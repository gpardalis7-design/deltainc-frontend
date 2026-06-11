import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const policyPath = resolve(rootDir, "src/app/lib/sitePolicy.json");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const redirectManifestPath = resolve(rootDir, "src/app/lib/generated/legacyRedirectManifest.json");
const vercelConfigPath = resolve(rootDir, "vercel.json");

const siteUrl = "https://deltainc.gr";
const wpBaseUrl = process.env.VITE_WP_BASE_URL || siteUrl;
const wpApiBase = `${wpBaseUrl}/wp-json/wp/v2`;
const policy = JSON.parse(readFileSync(policyPath, "utf8"));

function normalizePath(pathname) {
  if (!pathname) return "/";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function decodeMaybe(value) {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function curlJson(url) {
  const output = execFileSync("curl", ["-s", "-L", url], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function isInvalidPageResponse(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      payload.code === "rest_post_invalid_page_number",
  );
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function withTrailingSlash(pathname) {
  const normalized = normalizePath(pathname);
  return normalized === "/" ? "/" : `${normalized}/`;
}

function createPathVariants(pathname, { includeTrailingSlash = true } = {}) {
  const normalized = normalizePath(pathname);
  const encoded = normalizePath(encodeURI(decodeMaybe(normalized)));
  const variants = new Set([encoded]);

  if (includeTrailingSlash && encoded !== "/") {
    for (const value of [...variants]) {
      variants.add(withTrailingSlash(value));
    }
  }

  return [...variants];
}

function buildUrlSet(entries) {
  const body = entries
    .map((entry) => {
      const parts = [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
      ];
      if (entry.lastmod) {
        parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      parts.push("  </url>");
      return parts.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function fetchPaginatedCollection(endpoint) {
  const items = [];
  let page = 1;

  while (page <= 50) {
    const url = `${wpApiBase}/${endpoint}?per_page=100&page=${page}&_fields=slug,link,modified`;
    const data = curlJson(url);
    if (isInvalidPageResponse(data)) break;
    if (!Array.isArray(data) || data.length === 0) break;
    items.push(...data);
    if (data.length < 100) break;
    page += 1;
  }

  return items;
}

function createStaticEntries() {
  const now = new Date().toISOString();
  const entries = [];

  for (const path of policy.indexableStaticRoutes) {
    entries.push({
      loc: `${siteUrl}${path}`,
      lastmod: now,
    });
  }

  for (const slug of policy.promotedServiceHubSlugs) {
    entries.push({
      loc: `${siteUrl}/${slug}`,
      lastmod: now,
    });
  }

  return entries;
}

function createContentEntries(posts, programs) {
  const articleEntries = posts.map((post) => ({
    loc: `${siteUrl}/blog/${post.slug}`,
    lastmod: post.modified || undefined,
  }));

  const programEntries = programs.map((program) => ({
    loc: `${siteUrl}/courses/${program.slug}`,
    lastmod: program.modified || undefined,
  }));

  return [...articleEntries, ...programEntries];
}

function createRedirectManifest(posts, programs) {
  const exactRedirects = Object.entries(policy.legacyStaticRedirects).map(([from, to]) => ({
    from: normalizePath(from),
    to: normalizePath(to),
    type: "static",
  }));

  const articleRedirects = posts
    .map((post) => {
      const pathname = normalizePath(new URL(post.link).pathname);
      return {
        from: pathname,
        to: `/blog/${post.slug}`,
        type: "article",
      };
    })
    .filter((entry) => entry.from !== entry.to);

  const programRedirects = programs.flatMap((program) => {
    const exactOldPath = normalizePath(new URL(program.link).pathname);
    const targets = new Set([
      exactOldPath,
      `/program/${program.slug}`,
      `/grad-undergrad/${program.slug}`,
      `/μεταπτυχιακά-search-engine/${program.slug}`,
      `/υπηρεσιες/μεταπτυχιακά-search-engine/${program.slug}`,
    ]);

    return [...targets]
      .map((from) => ({
        from,
        to: `/courses/${program.slug}`,
        type: "program",
      }))
      .filter((entry) => entry.from !== entry.to);
  });

  return {
    generatedAt: new Date().toISOString(),
    exactRedirects,
    articleRedirects,
    programRedirects,
    postSlugs: posts.map((post) => post.slug),
    programSlugs: programs.map((program) => program.slug),
  };
}

function appendRedirectRules(redirects, seenSources, from, to) {
  const destination = normalizePath(to);

  for (const source of createPathVariants(from)) {
    if (source === destination || seenSources.has(source)) continue;
    seenSources.add(source);
    redirects.push({
      source,
      destination,
      permanent: true,
    });
  }
}

function buildVercelConfig(redirectManifest) {
  const redirects = [];
  const seenSources = new Set();

  for (const entry of redirectManifest.exactRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const entry of redirectManifest.articleRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const entry of redirectManifest.programRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const [slug, destination] of Object.entries(policy.serviceCategoryRedirects)) {
    appendRedirectRules(redirects, seenSources, `/category/${slug}`, destination);
  }

  for (const [slug, destination] of Object.entries(policy.editorialCategoryRedirects)) {
    appendRedirectRules(redirects, seenSources, `/category/${slug}`, destination);
  }

  for (const source of createPathVariants("/category/:slug")) {
    if (seenSources.has(source)) continue;
    seenSources.add(source);
    redirects.push({
      source,
      destination: "/blog",
      permanent: true,
    });
  }

  return {
    redirects,
    rewrites: [
      {
        source: "/((?!assets/|.*\\..*).*)",
        destination: "/index.html",
      },
    ],
  };
}

function ensureDir(pathname) {
  mkdirSync(dirname(pathname), { recursive: true });
}

function writeArtifacts(posts, programs) {
  const staticEntries = createStaticEntries();
  const contentEntries = createContentEntries(posts, programs);
  const sitemapEntries = [...staticEntries, ...contentEntries];
  const redirectManifest = createRedirectManifest(posts, programs);
  const vercelConfig = buildVercelConfig(redirectManifest);

  ensureDir(sitemapPath);
  ensureDir(redirectManifestPath);
  writeFileSync(sitemapPath, buildUrlSet(sitemapEntries), "utf8");
  writeFileSync(redirectManifestPath, `${JSON.stringify(redirectManifest, null, 2)}\n`, "utf8");
  writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`, "utf8");
}

function rewriteVercelConfigFromExistingManifest() {
  const manifest = JSON.parse(readFileSync(redirectManifestPath, "utf8"));
  const vercelConfig = buildVercelConfig(manifest);
  writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`, "utf8");
}

function main() {
  try {
    const posts = fetchPaginatedCollection("posts");
    const programs = fetchPaginatedCollection("program");
    writeArtifacts(posts, programs);
    console.log(`Generated sitemap, redirect manifest, and vercel config from ${posts.length} posts and ${programs.length} programs.`);
  } catch (error) {
    try {
      rewriteVercelConfigFromExistingManifest();
      console.warn(
        "Site artifact generation skipped; refreshed vercel config from checked-in redirect manifest.",
        error instanceof Error ? error.message : error,
      );
      return;
    } catch (fallbackError) {
      console.warn(
        "Site artifact generation skipped; keeping checked-in artifacts.",
        fallbackError instanceof Error ? fallbackError.message : fallbackError,
      );
    }
  }
}

main();
