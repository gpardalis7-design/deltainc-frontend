import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

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
  if (/[^\u0000-\u007f]/.test(entry.slug)) greekEntryVerified = true;
}

assert(greekEntryVerified, "No Greek-slug route was verified");

const notFound = parse(readFileSync(resolve(distDir, "404.html"), "utf8"));
assert(notFound.querySelector('meta[name="robots"]')?.getAttribute("content") === "noindex,nofollow", "404.html is indexable");
assert(notFound.querySelectorAll('meta[property="og:title"]').length === 0, "404.html advertises Open Graph metadata");

const vercel = JSON.parse(readFileSync(resolve(rootDir, "vercel.json"), "utf8"));
assert(vercel.trailingSlash === false, "vercel.json must enforce URLs without trailing slashes");
assert(vercel.rewrites.some((rule) => rule.source === "/courses" && rule.destination === "/index.html"), "Missing /courses collection rewrite");
assert(vercel.rewrites.some((rule) => rule.source === "/blog" && rule.destination === "/index.html"), "Missing /blog collection rewrite");
assert(vercel.rewrites.some((rule) => rule.source.includes("courses/") && rule.source.includes("blog/")), "SPA fallback does not exclude content detail routes");

console.log(`Verified ${manifest.entries.length} generated social preview pages, a Greek slug, routing, and 404 metadata.`);

