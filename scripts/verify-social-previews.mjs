import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { normalizeSlug } from "./social-preview-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");
const manifest = JSON.parse(readFileSync(resolve(rootDir, ".vite/social-preview-manifest.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("Unable to read fallback JPEG dimensions");
}

const fallbackDimensions = jpegDimensions(readFileSync(resolve(distDir, "og-default.jpg")));
assert(fallbackDimensions.width === 1200, `Fallback image width is ${fallbackDimensions.width}, expected 1200`);
assert(fallbackDimensions.height === 630, `Fallback image height is ${fallbackDimensions.height}, expected 630`);

const genericTitle = "Delta | Εκπαίδευση, ΑΣΕΠ, ΟΠΣΥΔ & Μεταπτυχιακά";
let greekEntryVerified = false;
let articlesWithBody = 0;
let programsWithBody = 0;

for (const entry of manifest.entries) {
  const section = entry.kind === "article" ? "blog" : "courses";
  const html = readFileSync(resolve(distDir, section, entry.slug, "index.html"), "utf8");
  const document = parse(html);
  const ogTitles = document.querySelectorAll('meta[property="og:title"]');
  const ogImages = document.querySelectorAll('meta[property="og:image"]');
  const canonicals = document.querySelectorAll('link[rel="canonical"]');
  assert(ogTitles.length === 1, `${section}/${entry.slug} has ${ogTitles.length} og:title tags`);
  assert(ogImages.length === 1, `${section}/${entry.slug} has ${ogImages.length} og:image tags`);
  assert(canonicals.length === 1, `${section}/${entry.slug} has ${canonicals.length} canonical tags`);
  assert(ogTitles[0].getAttribute("content") === entry.title, `${section}/${entry.slug} has the wrong og:title`);
  assert(ogTitles[0].getAttribute("content") !== genericTitle, `${section}/${entry.slug} fell back to the homepage title`);

  if (entry.kind === "article") {
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const blogPostingCount = ldScripts.filter((s) => /"@type"\s*:\s*"BlogPosting"/.test(s.text)).length;
    assert(blogPostingCount === 1, `${section}/${entry.slug} has ${blogPostingCount} BlogPosting JSON-LD blocks (expected 1)`);
    const h1 = document.querySelector("h1");
    assert(h1 && h1.text.trim().length > 0, `${section}/${entry.slug} has no crawlable <h1>`);
    const bodyEl = document.querySelector(".article-body");
    assert(bodyEl && bodyEl.text.trim().length > 200, `${section}/${entry.slug} has a missing or empty article body`);

    // The embedded payload the client reads as initial state must parse, match
    // the route slug, and carry content — else the client silently skeletons.
    const embeddedScript = document.querySelector('script[id="__DELTA_BLOG_POST__"]');
    assert(embeddedScript, `${section}/${entry.slug} is missing embedded post data`);
    let embeddedPost;
    try {
      // .rawText (not .text): <script> content is raw text in the browser, so we
      // must NOT entity-decode it — .text would corrupt JSON for bodies with
      // &quot;/&lt;/&gt; entities (matching how the browser's textContent reads it).
      embeddedPost = JSON.parse(embeddedScript.rawText);
    } catch {
      throw new Error(`${section}/${entry.slug} embedded post JSON does not parse`);
    }
    assert(
      normalizeSlug(embeddedPost.slug) === entry.slug,
      `${section}/${entry.slug} embedded slug mismatch (got ${embeddedPost.slug})`,
    );
    assert(
      (embeddedPost.content?.rendered || "").length > 0,
      `${section}/${entry.slug} embedded content is empty`,
    );

    articlesWithBody += 1;
  }

  if (entry.kind === "program") {
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const courseCount = ldScripts.filter((s) => /"@type"\s*:\s*"Course"/.test(s.text)).length;
    assert(courseCount === 1, `${section}/${entry.slug} has ${courseCount} Course JSON-LD blocks (expected 1)`);
    const h1 = document.querySelector("h1");
    assert(h1 && h1.text.trim().length > 0, `${section}/${entry.slug} has no crawlable <h1>`);
    const main = document.querySelector("main.program-prerender");
    assert(main && main.text.trim().length > 100, `${section}/${entry.slug} has a missing or empty program body`);

    const embeddedScript = document.querySelector('script[id="__DELTA_PROGRAM__"]');
    assert(embeddedScript, `${section}/${entry.slug} is missing embedded program data`);
    let embeddedProgram;
    try {
      embeddedProgram = JSON.parse(embeddedScript.rawText);
    } catch {
      throw new Error(`${section}/${entry.slug} embedded program JSON does not parse`);
    }
    assert(
      normalizeSlug(embeddedProgram.slug) === entry.slug,
      `${section}/${entry.slug} embedded slug mismatch (got ${embeddedProgram.slug})`,
    );

    programsWithBody += 1;
  }
  if (/[^\u0000-\u007f]/.test(entry.slug)) greekEntryVerified = true;
}

assert(greekEntryVerified, "No Greek-slug route was verified");

// Phase 4a: guided hub pages (not in the manifest — verified by slug).
let hubsVerified = 0;
for (const slug of ["opsyd", "asep", "metaptyxiaka", "pistopoihseis"]) {
  const doc = parse(readFileSync(resolve(distDir, slug, "index.html"), "utf8"));
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const collectionCount = ldScripts.filter((s) => /"@type"\s*:\s*"CollectionPage"/.test(s.text)).length;
  assert(collectionCount === 1, `hub ${slug} has ${collectionCount} CollectionPage JSON-LD blocks (expected 1)`);
  const h1 = doc.querySelector("h1");
  assert(h1 && h1.text.trim().length > 0, `hub ${slug} has no crawlable <h1>`);
  const main = doc.querySelector("main.hub-prerender");
  assert(main && main.text.trim().length > 100, `hub ${slug} has a missing or empty body`);
  hubsVerified += 1;
}

// Phase 4b: editorial category archives (verified by slug from sitePolicy).
const archivePolicy =
  JSON.parse(readFileSync(resolve(rootDir, "src/app/lib/sitePolicy.json"), "utf8")).editorialCategoryArchives || {};
let archivesVerified = 0;
for (const slug of Object.keys(archivePolicy)) {
  const doc = parse(readFileSync(resolve(distDir, "category", slug, "index.html"), "utf8"));
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const collectionCount = ldScripts.filter((s) => /"@type"\s*:\s*"CollectionPage"/.test(s.text)).length;
  assert(collectionCount === 1, `archive ${slug} has ${collectionCount} CollectionPage JSON-LD blocks (expected 1)`);
  const h1 = doc.querySelector("h1");
  assert(h1 && h1.text.trim().length > 0, `archive ${slug} has no crawlable <h1>`);
  const main = doc.querySelector("main.archive-prerender");
  assert(main && main.text.trim().length > 50, `archive ${slug} has a missing or empty body`);
  archivesVerified += 1;
}

// Phase 4c: homepage + static pages (crawlable body + correct robots).
const staticRoutes = [
  { route: "/", file: ["index.html"], indexable: true },
  { route: "/blog", file: ["blog", "index.html"], indexable: true },
  { route: "/courses", file: ["courses", "index.html"], indexable: true },
  { route: "/about", file: ["about", "index.html"], indexable: true },
  { route: "/contact", file: ["contact", "index.html"], indexable: true },
  { route: "/assignments", file: ["assignments", "index.html"], indexable: true },
  { route: "/delta-apps", file: ["delta-apps", "index.html"], indexable: true },
  { route: "/delta-apps/moria-calculator", file: ["delta-apps", "moria-calculator", "index.html"], indexable: true },
  { route: "/delta-apps/salary-calculator", file: ["delta-apps", "salary-calculator", "index.html"], indexable: true },
  { route: "/privacy-policy", file: ["privacy-policy", "index.html"], indexable: false },
  { route: "/cookie-policy", file: ["cookie-policy", "index.html"], indexable: false },
  { route: "/terms", file: ["terms", "index.html"], indexable: false },
];
let staticPagesVerified = 0;
for (const sp of staticRoutes) {
  const doc = parse(readFileSync(resolve(distDir, ...sp.file), "utf8"));
  const h1 = doc.querySelector("h1");
  assert(h1 && h1.text.trim().length > 0, `static ${sp.route} has no crawlable <h1>`);
  const main = doc.querySelector("main.page-prerender");
  assert(main && main.text.trim().length > 20, `static ${sp.route} has a missing or empty body`);
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
  if (!sp.indexable) assert(/noindex/.test(robots), `policy page ${sp.route} is not noindex (got "${robots}")`);
  staticPagesVerified += 1;
}

const notFound = parse(readFileSync(resolve(distDir, "404.html"), "utf8"));
assert(notFound.querySelector('meta[name="robots"]')?.getAttribute("content") === "noindex,nofollow", "404.html is indexable");
assert(notFound.querySelectorAll('meta[property="og:title"]').length === 0, "404.html advertises Open Graph metadata");

const vercel = JSON.parse(readFileSync(resolve(rootDir, "vercel.json"), "utf8"));
assert(vercel.trailingSlash === false, "vercel.json must enforce URLs without trailing slashes");
assert(vercel.rewrites.some((rule) => rule.source === "/courses" && rule.destination === "/index.html"), "Missing /courses collection rewrite");
assert(vercel.rewrites.some((rule) => rule.source === "/blog" && rule.destination === "/index.html"), "Missing /blog collection rewrite");
assert(vercel.rewrites.some((rule) => rule.source.includes("courses/") && rule.source.includes("blog/")), "SPA fallback does not exclude content detail routes");

console.log(
  `Verified ${manifest.entries.length} generated social preview pages ` +
    `(${articlesWithBody} articles + ${programsWithBody} programs + ${hubsVerified} hubs + ${archivesVerified} archives + ${staticPagesVerified} static pages with crawlable body + JSON-LD), a Greek slug, routing, and 404 metadata.`,
);

