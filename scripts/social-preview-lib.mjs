const DEFAULT_DESCRIPTION =
  "Ειδήσεις, οδηγοί και ενημερώσεις για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις από το Delta.";

export function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—");
}

export function cleanText(value) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSlug(value) {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    throw new Error(`Invalid percent-encoded slug: ${value}`);
  }

  const normalized = decoded.normalize("NFC").trim();
  if (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized.includes("/") ||
    normalized.includes("\\") ||
    normalized.includes("\0")
  ) {
    throw new Error(`Unsafe content slug: ${value}`);
  }
  return normalized;
}

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeImage(candidate, fallbackAlt) {
  if (!candidate || typeof candidate !== "object") return null;
  const url = typeof candidate.url === "string"
    ? candidate.url
    : typeof candidate.source_url === "string"
      ? candidate.source_url
      : "";
  if (!/^https:\/\//i.test(url)) return null;

  const mediaDetails = candidate.media_details && typeof candidate.media_details === "object"
    ? candidate.media_details
    : {};
  return {
    url,
    alt: cleanText(candidate.alt || candidate.alt_text || candidate.caption || fallbackAlt),
    width: positiveNumber(candidate.width || mediaDetails.width),
    height: positiveNumber(candidate.height || mediaDetails.height),
  };
}

export function normalizeContentItem(item, kind) {
  const slug = normalizeSlug(item.slug);
  const renderedTitle = cleanText(item.title?.rendered);
  const renderedExcerpt = cleanText(item.excerpt?.rendered);
  const yoast = item.yoast_head_json && typeof item.yoast_head_json === "object"
    ? item.yoast_head_json
    : {};

  const title = cleanText(yoast.og_title || yoast.title || renderedTitle);
  if (!title) throw new Error(`Content item ${kind}/${slug} has no title`);

  const description = cleanText(
    yoast.og_description ||
      yoast.description ||
      renderedExcerpt ||
      `Μάθετε περισσότερα για «${title}» στο Delta.`,
  ).slice(0, 300) || DEFAULT_DESCRIPTION;

  const embeddedMedia = item._embedded?.["wp:featuredmedia"]?.[0];
  const yoastImage = Array.isArray(yoast.og_image) ? yoast.og_image[0] : null;
  const image = normalizeImage(yoastImage, title) || normalizeImage(embeddedMedia, title);

  return {
    kind,
    slug,
    title,
    description,
    image,
    publishedTime: typeof item.date === "string" ? item.date : undefined,
    modifiedTime: typeof item.modified === "string" ? item.modified : undefined,
  };
}

export function contentPath(entry) {
  return `/${entry.kind === "article" ? "blog" : "courses"}/${encodeURIComponent(entry.slug)}`;
}

export function buildPageMetadata(entry, options) {
  const publicSiteUrl = trimTrailingSlash(options.publicSiteUrl);
  const canonicalSiteUrl = trimTrailingSlash(options.canonicalSiteUrl);
  const path = contentPath(entry);
  const fallbackImage = {
    url: `${publicSiteUrl}/og-default.jpg`,
    alt: "Delta Inc Education Center",
    width: 1200,
    height: 630,
  };

  return {
    title: entry.title,
    description: entry.description,
    canonical: new URL(path, `${canonicalSiteUrl}/`).toString(),
    robots: options.allowIndexing
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    og: {
      type: entry.kind === "article" ? "article" : "website",
      url: new URL(path, `${publicSiteUrl}/`).toString(),
      image: entry.image || fallbackImage,
      publishedTime: entry.kind === "article" ? entry.publishedTime : undefined,
      modifiedTime: entry.kind === "article" ? entry.modifiedTime : undefined,
    },
  };
}
