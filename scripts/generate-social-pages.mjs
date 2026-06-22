import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { buildPageMetadata, contentPath, trimTrailingSlash } from "./social-preview-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const distDir = resolve(rootDir, "dist");
const manifestPath = resolve(rootDir, ".vite/social-preview-manifest.json");
const indexPath = resolve(distDir, "index.html");

const publicSiteUrl = trimTrailingSlash(process.env.VITE_SITE_URL || "https://deltainc.gr");
const canonicalSiteUrl = trimTrailingSlash(
  process.env.VITE_CANONICAL_SITE_URL || "https://deltainc.gr",
);
const allowIndexing = process.env.VITE_ALLOW_INDEXING !== "false";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function removeManagedHeadTags(head) {
  for (const title of head.querySelectorAll("title")) title.remove();
  for (const link of head.querySelectorAll("link")) {
    if ((link.getAttribute("rel") || "").toLowerCase() === "canonical") link.remove();
  }
  for (const meta of head.querySelectorAll("meta")) {
    const name = (meta.getAttribute("name") || "").toLowerCase();
    const property = (meta.getAttribute("property") || "").toLowerCase();
    if (
      name === "description" ||
      name === "robots" ||
      name.startsWith("twitter:") ||
      property.startsWith("og:") ||
      property.startsWith("article:")
    ) {
      meta.remove();
    }
  }
}

function metaTag(attribute, key, content) {
  if (!content) return "";
  return `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" data-social-meta="generated">`;
}

function renderHtml(baseHtml, metadata, { includeSocial = true, includeCanonical = true } = {}) {
  const document = parse(baseHtml, { comment: true });
  const head = document.querySelector("head");
  if (!head) throw new Error("Built index.html has no <head>");
  removeManagedHeadTags(head);

  const tags = [
    `<title data-social-meta="generated">${escapeHtml(metadata.title)}</title>`,
    metaTag("name", "description", metadata.description),
    metaTag("name", "robots", metadata.robots),
    includeCanonical && metadata.canonical
      ? `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" data-social-meta="generated">`
      : "",
  ];

  if (includeSocial && metadata.og) {
    const image = metadata.og.image;
    tags.push(
      metaTag("property", "og:locale", "el_GR"),
      metaTag("property", "og:type", metadata.og.type),
      metaTag("property", "og:site_name", "Delta"),
      metaTag("property", "og:title", metadata.title),
      metaTag("property", "og:description", metadata.description),
      metaTag("property", "og:url", metadata.og.url),
      metaTag("property", "og:image", image?.url),
      metaTag("property", "og:image:alt", image?.alt || metadata.title),
      image?.width ? metaTag("property", "og:image:width", String(image.width)) : "",
      image?.height ? metaTag("property", "og:image:height", String(image.height)) : "",
      metaTag("property", "article:published_time", metadata.og.publishedTime),
      metaTag("property", "article:modified_time", metadata.og.modifiedTime),
      metaTag("name", "twitter:card", "summary_large_image"),
      metaTag("name", "twitter:title", metadata.title),
      metaTag("name", "twitter:description", metadata.description),
      metaTag("name", "twitter:image", image?.url),
      metaTag("name", "twitter:image:alt", image?.alt || metadata.title),
      metaTag("name", "twitter:site", "@deltainc_gr"),
    );
  }

  head.insertAdjacentHTML("beforeend", `\n    ${tags.filter(Boolean).join("\n    ")}\n  `);
  return document.toString();
}

function safeOutputPath(entry) {
  const section = entry.kind === "article" ? "blog" : "courses";
  const outputPath = resolve(distDir, section, entry.slug, "index.html");
  const allowedRoot = `${resolve(distDir, section)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!outputPath.startsWith(allowedRoot)) throw new Error(`Unsafe output path for ${contentPath(entry)}`);
  return outputPath;
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const baseHtml = readFileSync(indexPath, "utf8");
const homeDescription =
  "Ειδήσεις, οδηγοί και ενημερώσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις. Η πλατφόρμα εκπαίδευσης του Delta.";
const homeMetadata = {
  title: "Delta | Εκπαίδευση, ΑΣΕΠ, ΟΠΣΥΔ & Μεταπτυχιακά",
  description: homeDescription,
  canonical: `${canonicalSiteUrl}/`,
  robots: allowIndexing
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  og: {
    type: "website",
    url: `${publicSiteUrl}/`,
    image: {
      url: `${publicSiteUrl}/og-default.jpg`,
      alt: "Delta Inc Education Center",
      width: 1200,
      height: 630,
    },
  },
};

writeFileSync(indexPath, renderHtml(baseHtml, homeMetadata), "utf8");

let fallbackImageCount = 0;
for (const entry of manifest.entries) {
  const metadata = buildPageMetadata(entry, { publicSiteUrl, canonicalSiteUrl, allowIndexing });
  if (!entry.image) fallbackImageCount += 1;
  const outputPath = safeOutputPath(entry);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderHtml(baseHtml, metadata), "utf8");
}

const notFoundMetadata = {
  title: "Η σελίδα δεν βρέθηκε | Delta",
  description: "Η σελίδα που αναζητάτε δεν είναι διαθέσιμη.",
  robots: "noindex,nofollow",
};
writeFileSync(
  resolve(distDir, "404.html"),
  renderHtml(baseHtml, notFoundMetadata, { includeSocial: false, includeCanonical: false }),
  "utf8",
);

console.log(
  `Generated ${manifest.entries.length} social preview pages (${fallbackImageCount} using the fallback image) and 404.html.`,
);
