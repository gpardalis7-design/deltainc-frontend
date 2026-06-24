import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { buildPageMetadata, contentPath, normalizeSlug, trimTrailingSlash } from "./social-preview-lib.mjs";
import { extractHubContent } from "./extract-hub-content.mjs";
import { extractStaticPages } from "./extract-static-content.mjs";

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

function renderHtml(baseHtml, metadata, { includeSocial = true, includeCanonical = true, article = null, program = null, hub = null, archive = null, page = null } = {}) {
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

  if (hub) {
    for (const schema of buildHubJsonLd(hub)) {
      tags.push(`<script type="application/ld+json" data-social-meta="generated">${jsonForScript(schema)}</script>`);
    }
  }

  if (archive) {
    for (const schema of buildArchiveJsonLd(archive)) {
      tags.push(`<script type="application/ld+json" data-social-meta="generated">${jsonForScript(schema)}</script>`);
    }
  }

  if (page) {
    for (const schema of buildPageJsonLd(page)) {
      tags.push(`<script type="application/ld+json" data-social-meta="generated">${jsonForScript(schema)}</script>`);
    }
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
  if (hub) {
    const rootEl = document.querySelector("#root");
    if (rootEl) rootEl.set_content(buildHubBodyHtml(hub));
  }
  if (archive) {
    const rootEl = document.querySelector("#root");
    if (rootEl) rootEl.set_content(buildArchiveBodyHtml(archive));
  }
  if (page) {
    const rootEl = document.querySelector("#root");
    if (rootEl) rootEl.set_content(buildStaticBodyHtml(page));
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

// ─── Phase 4a: guided hub crawlable pages (CollectionPage + ItemList) ────────
const HUB_CATEGORY_IDS = { opsyd: 342, asep: 285, metaptyxiaka: 286, pistopoihseis: 349 };

function hubPostsFor(articleMap, categoryId, limit = 24) {
  const posts = [];
  for (const post of articleMap.values()) {
    const cats = post._embedded?.["wp:term"]?.[0];
    if (Array.isArray(cats) && cats.some((c) => c?.id === categoryId)) posts.push(post);
  }
  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return posts.slice(0, limit);
}

function buildHubBodyHtml(hub) {
  const topics = hub.keyTopics.length
    ? `<section><h2>Βασικά θέματα</h2><ul>${hub.keyTopics
        .map((t) => `<li><strong>${escapeHtml(t.label)}</strong> — ${escapeHtml(t.desc)}</li>`)
        .join("")}</ul></section>`
    : "";
  const articles = hub.posts.length
    ? `<section><h2>Σχετικά άρθρα</h2><ul>${hub.posts
        .map((p) => `<li><a href="/blog/${encodeURIComponent(p.slug)}">${escapeHtml(decodeEntities(p.title?.rendered || ""))}</a></li>`)
        .join("")}</ul></section>`
    : "";
  return [
    `<main class="hub-prerender">`,
    `<article>`,
    `<nav aria-label="breadcrumb"><a href="/">Αρχική</a> › <span>${escapeHtml(hub.name)}</span></nav>`,
    `<h1>${escapeHtml(hub.h1 || hub.name)}</h1>`,
    `<p class="hub-intro">${escapeHtml(hub.intro)}</p>`,
    topics,
    articles,
    `</article>`,
    `</main>`,
  ].join("\n");
}

function buildHubJsonLd(hub) {
  const url = `${canonicalSiteUrl}/${hub.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: hub.h1 || hub.name,
      description: hub.intro.slice(0, 300),
      url,
      inLanguage: "el-GR",
      isPartOf: { "@type": "WebSite", name: "Delta", url: `${canonicalSiteUrl}/` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: hub.posts.length,
        itemListElement: hub.posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${canonicalSiteUrl}/blog/${p.slug}`,
          name: decodeEntities(p.title?.rendered || ""),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Αρχική", item: `${canonicalSiteUrl}/` },
        { "@type": "ListItem", position: 2, name: hub.name, item: url },
      ],
    },
  ];
}

function hubMetadata(hub) {
  const path = `/${hub.slug}`;
  return {
    title: hub.h1 || `${hub.name} | Delta`,
    description: hub.intro.slice(0, 300),
    canonical: `${canonicalSiteUrl}${path}`,
    robots: allowIndexing
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    og: {
      type: "website",
      url: `${publicSiteUrl}${path}`,
      image: { url: `${publicSiteUrl}/og-default.jpg`, alt: "Delta Inc Education Center", width: 1200, height: 630 },
    },
  };
}

// ─── Phase 4b: editorial category archives (CollectionPage + ItemList) ───────
const editorialArchives =
  JSON.parse(readFileSync(resolve(rootDir, "src/app/lib/sitePolicy.json"), "utf8")).editorialCategoryArchives || {};

function decodeSlugMaybe(value) {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function archivePostsFor(articleMap, categorySlug, limit = 24) {
  const target = decodeSlugMaybe(categorySlug);
  const posts = [];
  for (const post of articleMap.values()) {
    const cats = post._embedded?.["wp:term"]?.[0];
    if (Array.isArray(cats) && cats.some((c) => decodeSlugMaybe(c?.slug) === target)) posts.push(post);
  }
  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return posts.slice(0, limit);
}

function archivePath(archive) {
  return (archive.path || `/category/${archive.slug}`).replace(/\/+$/, "");
}

function buildArchiveBodyHtml(archive) {
  const articles = archive.posts.length
    ? `<section><h2>Άρθρα</h2><ul>${archive.posts
        .map((p) => `<li><a href="/blog/${encodeURIComponent(p.slug)}">${escapeHtml(decodeEntities(p.title?.rendered || ""))}</a></li>`)
        .join("")}</ul></section>`
    : "";
  return [
    `<main class="archive-prerender">`,
    `<article>`,
    `<nav aria-label="breadcrumb"><a href="/">Αρχική</a> › <a href="/blog">Blog</a> › <span>${escapeHtml(archive.name)}</span></nav>`,
    `<h1>${escapeHtml(archive.h1 || archive.name)}</h1>`,
    archive.intro ? `<p class="archive-intro">${escapeHtml(archive.intro)}</p>` : "",
    articles,
    `</article>`,
    `</main>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildArchiveJsonLd(archive) {
  const url = `${canonicalSiteUrl}${archivePath(archive)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: archive.h1 || archive.name,
      description: (archive.description || archive.intro || "").slice(0, 300),
      url,
      inLanguage: "el-GR",
      isPartOf: { "@type": "WebSite", name: "Delta", url: `${canonicalSiteUrl}/` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: archive.posts.length,
        itemListElement: archive.posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${canonicalSiteUrl}/blog/${p.slug}`,
          name: decodeEntities(p.title?.rendered || ""),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Αρχική", item: `${canonicalSiteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${canonicalSiteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: archive.name, item: url },
      ],
    },
  ];
}

function archiveMetadata(archive) {
  const path = archivePath(archive);
  return {
    title: (archive.titleFull && archive.titleFull.replace(/\|+$/, "").trim()) || archive.h1 || `${archive.name} | Delta`,
    description: (archive.description || archive.intro || "").slice(0, 300),
    canonical: `${canonicalSiteUrl}${path}`,
    robots: allowIndexing
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    og: {
      type: "website",
      url: `${publicSiteUrl}${path}`,
      image: { url: `${publicSiteUrl}/og-default.jpg`, alt: "Delta Inc Education Center", width: 1200, height: 630 },
    },
  };
}

// ─── Phase 4c: homepage + static pages (WebPage + BreadcrumbList) ────────────
const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const ROBOTS_NOINDEX = "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

// Phase 5: global site graph (single source, injected on the homepage).
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Delta",
  url: `${canonicalSiteUrl}/`,
  logo: { "@type": "ImageObject", url: `${canonicalSiteUrl}/LOGO.png` },
};
const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Delta",
  url: `${canonicalSiteUrl}/`,
  inLanguage: "el-GR",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${canonicalSiteUrl}/blog?search={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

function pageH1(title) {
  return title.split("|")[0].split("—")[0].trim();
}

function buildStaticBodyHtml(page) {
  const breadcrumb = page.breadcrumb?.length
    ? `<nav aria-label="breadcrumb">${page.breadcrumb
        .map((b, i) =>
          i < page.breadcrumb.length - 1
            ? `<a href="${escapeHtml(b.path)}">${escapeHtml(b.name)}</a> › `
            : `<span>${escapeHtml(b.name)}</span>`,
        )
        .join("")}</nav>`
    : "";
  const sections = (page.sections || [])
    .filter((s) => s.items.length)
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.heading)}</h2><ul>${s.items
          .map((it) => `<li><a href="${escapeHtml(it.url)}">${escapeHtml(it.name)}</a></li>`)
          .join("")}</ul></section>`,
    )
    .join("\n");
  return [
    `<main class="page-prerender">`,
    `<article>`,
    breadcrumb,
    `<h1>${escapeHtml(page.h1)}</h1>`,
    page.description ? `<p class="page-intro">${escapeHtml(page.description)}</p>` : "",
    sections,
    `</article>`,
    `</main>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPageJsonLd(page) {
  const ld = [
    ...(page.extraJsonLd || []),
    {
      "@context": "https://schema.org",
      "@type": page.schemaType || "WebPage",
      name: page.h1,
      description: (page.description || "").slice(0, 300),
      url: page.url,
      inLanguage: "el-GR",
      isPartOf: { "@type": "WebSite", name: "Delta", url: `${canonicalSiteUrl}/` },
    },
  ];
  if ((page.breadcrumb?.length || 0) > 1) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: page.breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${canonicalSiteUrl}${b.path}`,
      })),
    });
  }
  return ld;
}

function staticMetadata(page, route) {
  return {
    title: page.title,
    description: (page.description || "").slice(0, 300),
    canonical: `${canonicalSiteUrl}${route}`,
    robots: page.noindex ? ROBOTS_NOINDEX : allowIndexing ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    og: {
      type: "website",
      url: `${publicSiteUrl}${route}`,
      image: { url: `${publicSiteUrl}/og-default.jpg`, alt: "Delta Inc Education Center", width: 1200, height: 630 },
    },
  };
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

// Homepage dist/index.html is (re)written in the Phase 4c block below, once the
// article/program data needed for its crawlable body has been fetched.

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

const hubContent = extractHubContent();
let hubsInjected = 0;
for (const [slug, hub] of Object.entries(hubContent)) {
  const hubWithPosts = { ...hub, posts: hubPostsFor(articleMap, HUB_CATEGORY_IDS[slug]) };
  const outputPath = resolve(distDir, slug, "index.html");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderHtml(baseHtml, hubMetadata(hubWithPosts), { hub: hubWithPosts }), "utf8");
  hubsInjected += 1;
}

let archivesInjected = 0;
for (const [slug, archive] of Object.entries(editorialArchives)) {
  const archiveWithPosts = { ...archive, slug, posts: archivePostsFor(articleMap, archive.slug || slug) };
  const outputPath = resolve(distDir, "category", slug, "index.html");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderHtml(baseHtml, archiveMetadata(archiveWithPosts), { archive: archiveWithPosts }), "utf8");
  archivesInjected += 1;
}

// ─── Phase 4c: homepage + landing pages + static pages ───────────────────────
let staticPagesInjected = 0;
{
  const sectionLinks = [
    { name: "ΟΠΣΥΔ", url: "/opsyd" },
    { name: "ΑΣΕΠ", url: "/asep" },
    { name: "Μεταπτυχιακά", url: "/metaptyxiaka" },
    { name: "Πιστοποιήσεις", url: "/pistopoihseis" },
    { name: "Blog", url: "/blog" },
    { name: "Προγράμματα Σπουδών", url: "/courses" },
  ];
  const latestArticleItems = [...articleMap.values()]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 12)
    .map((p) => ({ name: decodeEntities(p.title?.rendered || ""), url: `/blog/${encodeURIComponent(p.slug)}` }));
  const programItems = [...programMap.values()]
    .slice(0, 15)
    .map((p) => ({ name: decodeEntities(p.title?.rendered || ""), url: `/courses/${encodeURIComponent(p.slug)}` }));

  const homePage = {
    h1: "Delta — Εκπαίδευση, ΑΣΕΠ, ΟΠΣΥΔ & Μεταπτυχιακά",
    description: homeDescription,
    url: `${canonicalSiteUrl}/`,
    schemaType: "WebPage",
    extraJsonLd: [ORGANIZATION_LD, WEBSITE_LD],
    breadcrumb: [{ name: "Αρχική", path: "/" }],
    sections: [
      { heading: "Ενότητες", items: sectionLinks },
      { heading: "Πρόσφατα άρθρα", items: latestArticleItems },
    ],
  };
  writeFileSync(indexPath, renderHtml(baseHtml, homeMetadata, { page: homePage }), "utf8");
  staticPagesInjected += 1;

  const landings = [
    {
      route: "/blog",
      page: {
        h1: "Blog — Εκπαίδευση, ΑΣΕΠ & ΟΠΣΥΔ",
        title: "Blog — Εκπαίδευση & ΑΣΕΠ | Delta",
        description:
          "Άρθρα, οδηγοί και ειδήσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά, πιστοποιήσεις και την εκπαίδευση από το Delta.",
        url: `${canonicalSiteUrl}/blog`,
        schemaType: "CollectionPage",
        breadcrumb: [{ name: "Αρχική", path: "/" }, { name: "Blog", path: "/blog" }],
        sections: [{ heading: "Πρόσφατα άρθρα", items: latestArticleItems }],
      },
    },
    {
      route: "/courses",
      page: {
        h1: "Μεταπτυχιακά & Προγράμματα Σπουδών",
        title: "Μεταπτυχιακά & Προγράμματα Σπουδών | Delta",
        description:
          "Αναζητήστε μεταπτυχιακά προγράμματα στην Ελλάδα και το εξωτερικό. Φιλτράρετε κατά πανεπιστήμιο, πόλη, τρόπο φοίτησης και κόστος.",
        url: `${canonicalSiteUrl}/courses`,
        schemaType: "CollectionPage",
        breadcrumb: [{ name: "Αρχική", path: "/" }, { name: "Μεταπτυχιακά", path: "/courses" }],
        sections: [{ heading: "Προγράμματα", items: programItems }],
      },
    },
  ];
  for (const { route, page } of landings) {
    const out = resolve(distDir, route.slice(1), "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderHtml(baseHtml, staticMetadata(page, route), { page }), "utf8");
    staticPagesInjected += 1;
  }

  const staticPagesSeo = extractStaticPages();
  const ROUTE_TO_KEY = {
    "/about": "about",
    "/contact": "contact",
    "/assignments": "assignments",
    "/delta-apps": "deltaApps",
    "/delta-apps/moria-calculator": "moriaCalculator",
    "/delta-apps/salary-calculator": "salaryCalculator",
    "/privacy-policy": "privacy",
    "/cookie-policy": "cookies",
    "/terms": "terms",
  };
  const NOINDEX_KEYS = new Set(["privacy", "cookies", "terms"]);
  for (const [route, key] of Object.entries(ROUTE_TO_KEY)) {
    const seo = staticPagesSeo[key];
    if (!seo) continue;
    const name = pageH1(seo.title);
    const page = {
      h1: name,
      title: seo.title,
      description: seo.description,
      url: `${canonicalSiteUrl}${route}`,
      schemaType: "WebPage",
      breadcrumb: [{ name: "Αρχική", path: "/" }, { name, path: route }],
      sections: [],
      noindex: NOINDEX_KEYS.has(key),
    };
    const out = resolve(distDir, ...route.slice(1).split("/"), "index.html");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderHtml(baseHtml, staticMetadata(page, route), { page }), "utf8");
    staticPagesInjected += 1;
  }
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
console.log(
  `Phase 4a: generated ${hubsInjected} crawlable hub pages (CollectionPage + ItemList + BreadcrumbList).`,
);
console.log(
  `Phase 4b: generated ${archivesInjected} crawlable category-archive pages (CollectionPage + ItemList + BreadcrumbList).`,
);
console.log(
  `Phase 4c: generated ${staticPagesInjected} crawlable static pages (homepage + landings + static + WebPage JSON-LD).`,
);
if (missingProgramSlugs.length > 0) {
  console.warn(
    `Phase 3: ${missingProgramSlugs.length} program(s) had no fetched WP program (head-meta only): ` +
      `${missingProgramSlugs.slice(0, 5).join(", ")}${missingProgramSlugs.length > 5 ? "…" : ""}`,
  );
}

