import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeContentItem, trimTrailingSlash } from "./social-preview-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const policyPath = resolve(rootDir, "src/app/lib/sitePolicy.json");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const feedPath = resolve(rootDir, "public/feed.xml");
const redirectManifestPath = resolve(rootDir, "src/app/lib/generated/legacyRedirectManifest.json");
const vercelConfigPath = resolve(rootDir, "vercel.json");
const socialPreviewManifestPath = resolve(rootDir, ".vite/social-preview-manifest.json");

const siteUrl = trimTrailingSlash(process.env.VITE_CANONICAL_SITE_URL || "https://deltainc.gr");
const publicSiteUrl = trimTrailingSlash(process.env.VITE_SITE_URL || siteUrl);
const wpBaseUrl = trimTrailingSlash(process.env.VITE_WP_BASE_URL || siteUrl);
const wpApiBase = `${wpBaseUrl}/wp-json/wp/v2`;
const allowIndexing = process.env.VITE_ALLOW_INDEXING !== "false";
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function curlJson(url) {
  const output = execFileSync("curl", [
    "-sS",
    "-L",
    "--fail",
    "--retry",
    "3",
    "--retry-delay",
    "1",
    "--connect-timeout",
    "10",
    "--max-time",
    "60",
    url,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 50 * 1024 * 1024,
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

function stripTags(html) {
  return String(html || "").replace(/<[^>]*>/g, " ");
}

// Compact HTML-entity decode for RSS title/description (WP rendered fields carry
// &amp;/&#8217;/&hellip; etc). Numeric first; decode &amp; LAST to avoid
// double-decoding sequences like &amp;lt;.
function decodeEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
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
    console.log(`Fetching WordPress ${endpoint} metadata page ${page}…`);
    const params = new URLSearchParams({
      per_page: "100",
      page: String(page),
      _embed: "wp:featuredmedia",
      _fields: "slug,link,date,modified,title,excerpt,yoast_head_json,_embedded",
    });
    const url = `${wpApiBase}/${endpoint}?${params.toString()}`;
    const data = curlJson(url);
    if (isInvalidPageResponse(data)) break;
    if (!Array.isArray(data) || data.length === 0) break;
    items.push(...data);
    if (data.length < 100) break;
    page += 1;
  }

  if (items.length === 0) {
    throw new Error(`WordPress returned no published items for ${endpoint}`);
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

  for (const archive of Object.values(policy.editorialCategoryArchives)) {
    entries.push({
      loc: `${siteUrl}${archive.path}`,
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

// Phase 6a: RSS 2.0 feed of the latest blog posts. Item links + the channel
// self-reference use the canonical host (deltainc.gr), matching the sitemap; the
// <link rel="alternate"> autodiscovery tag in index.html is host-relative.
function createRssFeed(posts) {
  const items = [...posts]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 30)
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`;
      const title = escapeXml(decodeEntities(stripTags(post.title?.rendered || "")).trim());
      const description = escapeXml(
        decodeEntities(stripTags(post.excerpt?.rendered || "")).replace(/\s+/g, " ").trim(),
      );
      const pubDate = new Date(post.date || Date.now()).toUTCString();
      return [
        "    <item>",
        `      <title>${title}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${description}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>Delta — Blog</title>`,
    `    <link>${siteUrl}/blog</link>`,
    `    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />`,
    `    <description>Άρθρα, οδηγοί και ειδήσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις από το Delta.</description>`,
    `    <language>el-GR</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    `  </channel>`,
    `</rss>`,
    ``,
  ].join("\n");
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

function appendRedirectRules(redirects, seenSources, from, to, options = {}) {
  const destination = options.preserveDestinationTrailingSlash ? to : normalizePath(to);

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

// Phase 7: wildcard redirect for a whole legacy URL prefix → one destination
// (e.g. /tag/* → /blog, /υπηρεσιες/* → /courses). Emitted AFTER the specific
// article/program redirects so a real /grad-undergrad/<programSlug> still wins.
function appendPrefixRedirect(redirects, seenSources, prefix, destination) {
  const dest = normalizePath(destination);
  const base = normalizePath(encodeURI(decodeMaybe(normalizePath(prefix))));
  const wildcard = `${base}/:path*`;
  if (!seenSources.has(wildcard)) {
    seenSources.add(wildcard);
    redirects.push({ source: wildcard, destination: dest, permanent: true });
  }
  if (base !== dest && !seenSources.has(base)) {
    seenSources.add(base);
    redirects.push({ source: base, destination: dest, permanent: true });
  }
}

function buildVercelConfig(redirectManifest) {
  const redirects = [];
  const seenSources = new Set();
  const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ...(!allowIndexing ? [{ key: "X-Robots-Tag", value: "noindex, follow" }] : []),
  ];

  for (const entry of redirectManifest.exactRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const entry of redirectManifest.articleRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const entry of redirectManifest.programRedirects) {
    appendRedirectRules(redirects, seenSources, entry.from, entry.to);
  }

  for (const [prefix, destination] of Object.entries(policy.legacyPrefixRedirects || {})) {
    appendPrefixRedirect(redirects, seenSources, prefix, destination);
  }

  for (const [slug, destination] of Object.entries(policy.serviceCategoryRedirects)) {
    appendRedirectRules(redirects, seenSources, `/category/${slug}`, destination);
  }

  for (const archive of Object.values(policy.editorialCategoryArchives)) {
    appendRedirectRules(redirects, seenSources, `/${archive.slug}`, archive.path, {
      preserveDestinationTrailingSlash: true,
    });
    appendRedirectRules(redirects, seenSources, `${archive.path}page/:page`, archive.path, {
      preserveDestinationTrailingSlash: true,
    });
  }

  const knownCategorySegments = [
    ...Object.keys(policy.serviceCategoryRedirects),
    ...Object.keys(policy.editorialCategoryArchives),
  ].map((slug) => escapeRegex(encodeURIComponent(decodeMaybe(slug))));

  return {
    trailingSlash: false,
    headers: [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ],
    redirects,
    routes: [
      {
        src: `/category/(?!(?:${knownCategorySegments.join("|")})(?:/|$)).+`,
        status: 404,
        headers: {
          "X-Robots-Tag": "noindex, follow",
        },
      },
    ],
    rewrites: [
      ...(wpBaseUrl !== publicSiteUrl
        ? [
            {
              source: "/wp-content/:path*",
              destination: `${wpBaseUrl}/wp-content/:path*`,
            },
            {
              source: "/wp-json/:path*",
              destination: `${wpBaseUrl}/wp-json/:path*`,
            },
          ]
        : []),
      {
        source: "/courses",
        destination: "/index.html",
      },
      {
        source: "/blog",
        destination: "/index.html",
      },
      {
        source: "/((?!assets/|courses/|blog/|wp-content/|wp-json/|.*\\..*).*)",
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
  const socialEntries = [
    ...posts.map((post) => normalizeContentItem(post, "article")),
    ...programs.map((program) => normalizeContentItem(program, "program")),
  ];
  const seenRoutes = new Set();
  for (const entry of socialEntries) {
    const routeKey = `${entry.kind}:${entry.slug}`;
    if (seenRoutes.has(routeKey)) throw new Error(`Duplicate social preview route: ${routeKey}`);
    seenRoutes.add(routeKey);
  }

  ensureDir(sitemapPath);
  ensureDir(redirectManifestPath);
  ensureDir(socialPreviewManifestPath);
  writeFileSync(sitemapPath, buildUrlSet(sitemapEntries), "utf8");
  writeFileSync(feedPath, createRssFeed(posts), "utf8");
  writeFileSync(redirectManifestPath, `${JSON.stringify(redirectManifest, null, 2)}\n`, "utf8");
  writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`, "utf8");
  writeFileSync(
    socialPreviewManifestPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), wpBaseUrl, publicSiteUrl, entries: socialEntries }, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  const posts = fetchPaginatedCollection("posts");
  const programs = fetchPaginatedCollection("program");
  writeArtifacts(posts, programs);
  console.log(
    `Generated sitemap, RSS feed, redirects, Vercel routing, and social metadata from ${posts.length} posts and ${programs.length} programs for ${publicSiteUrl}.`,
  );
}

main();
