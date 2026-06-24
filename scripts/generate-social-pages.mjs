import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { buildPageMetadata, contentPath, normalizeSlug, trimTrailingSlash } from "./social-preview-lib.mjs";

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

function renderHtml(baseHtml, metadata, { includeSocial = true, includeCanonical = true, article = null, program = null } = {}) {
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

  if (article) {
    for (const schema of buildArticleJsonLd(article)) {
      tags.push(`<script type="application/ld+json" data-social-meta="generated">${jsonForScript(schema)}</script>`);
    }
    tags.push(
      `<script id="__DELTA_BLOG_POST__" type="application/json" data-delta-embedded="post">${jsonForScript(trimPostPayload(article))}</script>`,
    );
  }

  if (program) {
    for (const schema of buildCourseJsonLd(program)) {
      tags.push(`<script type="application/ld+json" data-social-meta="generated">${jsonForScript(schema)}</script>`);
    }
    tags.push(
      `<script id="__DELTA_PROGRAM__" type="application/json" data-delta-embedded="program">${jsonForScript(trimProgramPayload(program))}</script>`,
    );
  }

  head.insertAdjacentHTML("beforeend", `\n    ${tags.filter(Boolean).join("\n    ")}\n  `);

  if (article) {
    const rootEl = document.querySelector("#root");
    if (rootEl) rootEl.set_content(buildArticleBodyHtml(article));
  }
  if (program) {
    const rootEl = document.querySelector("#root");
    if (rootEl) rootEl.set_content(buildProgramBodyHtml(program));
  }

  return document.toString();
}

function safeOutputPath(entry) {
  const section = entry.kind === "article" ? "blog" : "courses";
  const outputPath = resolve(distDir, section, entry.slug, "index.html");
  const allowedRoot = `${resolve(distDir, section)}${process.platform === "win32" ? "\\" : "/"}`;
  if (!outputPath.startsWith(allowedRoot)) throw new Error(`Unsafe output path for ${contentPath(entry)}`);
  return outputPath;
}

// ─── Phase 2: crawlable article body + JSON-LD injection (spike: one route) ───
const wpBaseUrl = trimTrailingSlash(process.env.VITE_WP_BASE_URL || canonicalSiteUrl);
const wpApiBase = `${wpBaseUrl}/wp-json/wp/v2`;

function curlJson(url) {
  const out = execFileSync(
    "curl",
    ["-sS", "-L", "--fail", "--retry", "2", "--connect-timeout", "10", "--max-time", "60", url],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  return JSON.parse(out);
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(Number(c)))
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCodePoint(parseInt(c, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Minimal build-time sanitization of trusted WP body HTML before it goes into
// the static #root (the client re-renders with the full DOMPurify pass on mount).
// iframes are intentionally KEPT to match the client's DOMPurify allowlist
// (sanitizeHtml.ts ADD_TAGS:["iframe"]) — stripping them statically made the
// 18 embed-bearing articles shift layout after React mounts.
function cleanContentHtml(html) {
  const root = parse(html || "", { comment: false });
  for (const node of root.querySelectorAll("script,style,noscript")) node.remove();
  for (const el of root.querySelectorAll("*")) {
    for (const name of Object.keys(el.attributes)) {
      const value = el.getAttribute(name) || "";
      if (/^on/i.test(name)) el.removeAttribute(name);
      else if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) el.removeAttribute(name);
    }
  }
  return root.toString();
}

function firstEmbedded(post, key) {
  const arr = (post._embedded || {})[key];
  return Array.isArray(arr) ? arr[0] : undefined;
}

// Lean payload the client reads as initial state — only what normalizeWpPost needs.
function trimPostPayload(post) {
  const e = post._embedded || {};
  return {
    id: post.id,
    slug: post.slug,
    link: post.link,
    date: post.date,
    modified: post.modified,
    title: { rendered: post.title?.rendered || "" },
    excerpt: { rendered: post.excerpt?.rendered || "" },
    content: { rendered: post.content?.rendered || "" },
    acf: post.acf || {},
    meta: post.meta || {},
    yoast_head_json: post.yoast_head_json || undefined,
    _embedded: {
      "wp:featuredmedia": e["wp:featuredmedia"],
      author: e.author,
      "wp:term": e["wp:term"],
    },
  };
}

function buildArticleBodyHtml(post) {
  const title = decodeEntities(post.title?.rendered || "");
  const dateLabel = post.date
    ? new Date(post.date).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const media = firstEmbedded(post, "wp:featuredmedia");
  const imgUrl = media?.source_url || "";
  const imgAlt = decodeEntities(media?.alt_text || title);
  const figure = imgUrl
    ? `<figure><img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(imgAlt)}" width="1200" height="630" /></figure>`
    : "";
  return [
    `<main class="article-prerender">`,
    `<article>`,
    `<nav aria-label="breadcrumb"><a href="/">Αρχική</a> › <a href="/blog">Blog</a> › <span>${escapeHtml(title)}</span></nav>`,
    `<h1>${escapeHtml(title)}</h1>`,
    `<p class="article-byline">Delta${dateLabel ? ` · ${escapeHtml(dateLabel)}` : ""}</p>`,
    figure,
    `<div class="article-body">${cleanContentHtml(post.content?.rendered || "")}</div>`,
    `</article>`,
    `</main>`,
  ].join("\n");
}

function buildArticleJsonLd(post) {
  const title = decodeEntities(post.title?.rendered || "");
  const description = decodeEntities((post.excerpt?.rendered || "").replace(/<[^>]*>/g, "")).trim().slice(0, 300);
  const media = firstEmbedded(post, "wp:featuredmedia");
  const imageUrl = media?.source_url || `${publicSiteUrl}/og-default.jpg`;
  const url = `${canonicalSiteUrl}/blog/${post.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description,
      image: { "@type": "ImageObject", url: imageUrl },
      datePublished: post.date || undefined,
      dateModified: post.modified || post.date || undefined,
      author: { "@type": "Organization", name: "Delta", url: canonicalSiteUrl },
      publisher: {
        "@type": "Organization",
        name: "Delta",
        logo: { "@type": "ImageObject", url: `${canonicalSiteUrl}/LOGO.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
      inLanguage: "el-GR",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Αρχική", item: `${canonicalSiteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${canonicalSiteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];
}

// Escape so JSON embedded in a <script> can never break out of the tag.
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// Fetch every published post with full content + embeds, keyed by the SAME
// decoded/NFC slug the manifest uses (normalizeSlug) so Greek slugs match.
function fetchAllArticles() {
  const map = new Map();
  let page = 1;
  while (page <= 50) {
    let posts;
    try {
      posts = curlJson(`${wpApiBase}/posts?per_page=100&page=${page}&_embed=1`);
    } catch {
      break; // a page past the last returns 400 (rest_post_invalid_page_number)
    }
    if (!Array.isArray(posts) || posts.length === 0) break;
    for (const post of posts) {
      if (typeof post?.slug !== "string") continue;
      try {
        map.set(normalizeSlug(post.slug), post);
      } catch {
        /* skip unsafe slug */
      }
    }
    if (posts.length < 100) break;
    page += 1;
  }
  return map;
}

// ─── Phase 3: program (course) crawlable body + Course JSON-LD ───────────────
function resolveTermByTax(program, taxonomy) {
  const groups = program._embedded?.["wp:term"] || [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const term of group) {
      if (term?.taxonomy === taxonomy && term?.name) return decodeEntities(term.name).trim();
    }
  }
  return "";
}

function programAcfField(program, key) {
  const v = (program.acf || {})[key] ?? (program.meta || {})[key];
  return typeof v === "string" ? v : "";
}

// Like cleanContentHtml but also strips ACF editor-cruft class tokens
// (e.g. isSelectedEnd). iframes are kept (client DOMPurify parity).
function cleanProgramHtml(html) {
  const root = parse(html || "", { comment: false });
  for (const node of root.querySelectorAll("script,style,noscript")) node.remove();
  for (const el of root.querySelectorAll("[class]")) {
    const kept = (el.getAttribute("class") || "").split(/\s+/).filter((c) => c && !/^isSelected/i.test(c));
    if (kept.length) el.setAttribute("class", kept.join(" "));
    else el.removeAttribute("class");
  }
  return root.toString();
}

const PROGRAM_SECTIONS = [
  ["overview", "Επισκόπηση"],
  ["curriculum", "Πρόγραμμα Σπουδών"],
  ["admissions", "Προϋποθέσεις Εισαγωγής"],
  ["outcomes", "Επαγγελματικές Προοπτικές"],
  ["faq", "Συχνές Ερωτήσεις"],
];

function buildProgramSummaryHtml(program) {
  const rows = [
    ["Πανεπιστήμιο", resolveTermByTax(program, "program_university")],
    ["Επίπεδο", resolveTermByTax(program, "program_level")],
    ["Πόλη", resolveTermByTax(program, "program_city")],
    ["Μορφή", resolveTermByTax(program, "program_mode")],
    ["Τύπος", resolveTermByTax(program, "uni_type")],
    ["Διάρκεια", programAcfField(program, "duration").trim()],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<dl class="program-summary">${rows
    .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
    .join("")}</dl>`;
}

// ACF sections when populated, else the Elementor content.rendered fallback.
function buildProgramBodyHtml(program) {
  const title = decodeEntities(program.title?.rendered || "");
  const media = firstEmbedded(program, "wp:featuredmedia");
  const imgUrl = media?.source_url || "";
  const figure = imgUrl
    ? `<figure><img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(decodeEntities(media?.alt_text || title))}" width="1200" height="630" /></figure>`
    : "";

  const sections = PROGRAM_SECTIONS.map(([key, heading]) => [heading, programAcfField(program, key)]).filter(
    ([, html]) => html.trim().length > 0,
  );
  const contentBlocks =
    sections.length > 0
      ? sections
          .map(([heading, html]) => `<section><h2>${escapeHtml(heading)}</h2><div class="program-prose">${cleanProgramHtml(html)}</div></section>`)
          .join("\n")
      : `<div class="program-prose">${cleanProgramHtml(program.content?.rendered || "")}</div>`;

  const excerpt = decodeEntities((program.excerpt?.rendered || "").replace(/<[^>]*>/g, "")).trim();
  return [
    `<main class="program-prerender">`,
    `<article>`,
    `<nav aria-label="breadcrumb"><a href="/">Αρχική</a> › <a href="/courses">Μεταπτυχιακά</a> › <span>${escapeHtml(title)}</span></nav>`,
    `<h1>${escapeHtml(title)}</h1>`,
    excerpt ? `<p class="program-excerpt">${escapeHtml(excerpt)}</p>` : "",
    buildProgramSummaryHtml(program),
    figure,
    contentBlocks,
    `</article>`,
    `</main>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCourseJsonLd(program) {
  const title = decodeEntities(program.title?.rendered || "");
  const description =
    decodeEntities((program.excerpt?.rendered || "").replace(/<[^>]*>/g, "")).trim().slice(0, 300) ||
    `Πρόγραμμα σπουδών «${title}» στο Delta.`;
  const url = `${canonicalSiteUrl}/courses/${program.slug}`;
  const university = resolveTermByTax(program, "program_university");
  const media = firstEmbedded(program, "wp:featuredmedia");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: title,
      description,
      url,
      inLanguage: "el-GR",
      ...(media?.source_url ? { image: { "@type": "ImageObject", url: media.source_url } } : {}),
      ...(university ? { provider: { "@type": "CollegeOrUniversity", name: university } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Αρχική", item: `${canonicalSiteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Μεταπτυχιακά", item: `${canonicalSiteUrl}/courses` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];
}

function trimProgramPayload(program) {
  const e = program._embedded || {};
  return {
    id: program.id,
    slug: program.slug,
    link: program.link,
    date: program.date,
    modified: program.modified,
    title: { rendered: program.title?.rendered || "" },
    excerpt: { rendered: program.excerpt?.rendered || "" },
    content: { rendered: program.content?.rendered || "" },
    acf: program.acf || {},
    meta: program.meta || {},
    yoast_head_json: program.yoast_head_json || undefined,
    _embedded: { "wp:featuredmedia": e["wp:featuredmedia"], "wp:term": e["wp:term"] },
  };
}

function fetchAllPrograms() {
  const map = new Map();
  let page = 1;
  while (page <= 50) {
    let programs;
    try {
      programs = curlJson(`${wpApiBase}/program?per_page=100&page=${page}&_embed=1`);
    } catch {
      break;
    }
    if (!Array.isArray(programs) || programs.length === 0) break;
    for (const program of programs) {
      if (typeof program?.slug !== "string") continue;
      try {
        map.set(normalizeSlug(program.slug), program);
      } catch {
        /* skip unsafe slug */
      }
    }
    if (programs.length < 100) break;
    page += 1;
  }
  return map;
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

const articleMap = fetchAllArticles();
const programMap = fetchAllPrograms();
let fallbackImageCount = 0;
let articlesInjected = 0;
let programsInjected = 0;
const missingArticleSlugs = [];
const missingProgramSlugs = [];
for (const entry of manifest.entries) {
  const metadata = buildPageMetadata(entry, { publicSiteUrl, canonicalSiteUrl, allowIndexing });
  if (!entry.image) fallbackImageCount += 1;
  const article = entry.kind === "article" ? articleMap.get(entry.slug) ?? null : null;
  const program = entry.kind === "program" ? programMap.get(entry.slug) ?? null : null;
  if (entry.kind === "article") {
    if (article) articlesInjected += 1;
    else missingArticleSlugs.push(entry.slug);
  }
  if (entry.kind === "program") {
    if (program) programsInjected += 1;
    else missingProgramSlugs.push(entry.slug);
  }
  const outputPath = safeOutputPath(entry);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderHtml(baseHtml, metadata, { article, program }), "utf8");
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
console.log(
  `Phase 2: injected crawlable body + BlogPosting JSON-LD + embedded data into ${articlesInjected} blog articles.`,
);
if (missingArticleSlugs.length > 0) {
  console.warn(
    `Phase 2: ${missingArticleSlugs.length} article(s) had no fetched WP post (head-meta only): ` +
      `${missingArticleSlugs.slice(0, 5).join(", ")}${missingArticleSlugs.length > 5 ? "…" : ""}`,
  );
}
console.log(
  `Phase 3: injected crawlable body + Course JSON-LD + embedded data into ${programsInjected} programs.`,
);
if (missingProgramSlugs.length > 0) {
  console.warn(
    `Phase 3: ${missingProgramSlugs.length} program(s) had no fetched WP program (head-meta only): ` +
      `${missingProgramSlugs.slice(0, 5).join(", ")}${missingProgramSlugs.length > 5 ? "…" : ""}`,
  );
}

