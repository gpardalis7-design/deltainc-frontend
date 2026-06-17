import type {
  BlogPost,
  DeltaHub,
  DeltaMedia,
  DeltaTaxonomyTerm,
  Program,
} from "./types";

type PostNormalizerOptions = {
  hubSlugHint?: string;
  hubs: DeltaHub[];
  hubSlugs: readonly string[];
  wpIdToHubSlug: Record<number, string>;
};

type ProgramNormalizerOptions = {
  hubs: DeltaHub[];
};

function normalizeArticleIntent(value: unknown): BlogPost["articleIntent"] {
  if (typeof value !== "string") return undefined;
  if (value === "read_more" || value === "hub" || value === "service") return value;
  return undefined;
}

function normalizeNextArticleSlug(value: unknown): BlogPost["nextArticleSlug"] {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeBooleanFlag(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'");
}

function normalizeWpMedia(media: Record<string, unknown> | null, fallbackAlt: string): DeltaMedia | null {
  if (!media) return null;

  const mediaDetails = (media.media_details as Record<string, unknown>) || {};
  const rawSizes = (mediaDetails.sizes as Record<string, Record<string, unknown>>) || {};

  const normalizeSize = (size: Record<string, unknown> | undefined) => {
    const url = size?.source_url;
    if (typeof url !== "string" || url.length === 0) return undefined;
    return {
      url,
      width: typeof size.width === "number" ? size.width : 0,
      height: typeof size.height === "number" ? size.height : 0,
      mimeType: typeof size.mime_type === "string" ? size.mime_type : ((media.mime_type as string) || "image/jpeg"),
    };
  };

  return {
    id: media.id as number,
    url: (media.source_url || (media.guid as { rendered: string })?.rendered || "") as string,
    alt: (media.alt_text as string) || fallbackAlt,
    width: (mediaDetails.width as number) || 1200,
    height: (mediaDetails.height as number) || 800,
    mimeType: (media.mime_type as string) || "image/jpeg",
    sizes: {
      thumbnail: normalizeSize(rawSizes.thumbnail),
      medium: normalizeSize(rawSizes.medium),
      medium_large: normalizeSize(rawSizes.medium_large),
      large: normalizeSize(rawSizes.large),
      full: typeof (media.source_url as string | undefined) === "string"
        ? {
            url: media.source_url as string,
            width: (mediaDetails.width as number) || 1200,
            height: (mediaDetails.height as number) || 800,
            mimeType: (media.mime_type as string) || "image/jpeg",
          }
        : undefined,
    },
  };
}

export function normalizeWpPost(
  p: Record<string, unknown>,
  {
    hubSlugHint,
    hubs,
    hubSlugs,
    wpIdToHubSlug,
  }: PostNormalizerOptions
): BlogPost {
  const embedded = (p._embedded || {}) as Record<string, unknown[]>;
  const media = (embedded["wp:featuredmedia"] as Record<string, unknown>[])?.[0] || null;
  const authorRaw = (embedded["author"] as Record<string, unknown>[])?.[0] || null;
  const terms = (embedded["wp:term"] as unknown[][]) || [];
  const categories = (terms[0] || []) as Record<string, unknown>[];
  const tags = (terms[1] || []) as Record<string, unknown>[];

  const title = decodeHtmlEntities((p.title as { rendered: string })?.rendered || "");
  const excerpt = ((p.excerpt as { rendered: string })?.rendered || "")
    .replace(/<[^>]*>/g, "")
    .trim();
  const content = (p.content as { rendered: string })?.rendered || "";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const meta = (p.meta as Record<string, unknown>) || {};
  const acf = (p.acf as Record<string, unknown>) || {};

  const matchedHubSlug =
    hubSlugHint ??
    (() => {
      for (const cat of categories) {
        const friendly = wpIdToHubSlug[cat.id as number];
        if (friendly) return friendly;
      }
      return hubSlugs.find((s) => categories.some((c) => (c.slug as string) === s));
    })();

  const hub = matchedHubSlug
    ? hubs.find((candidate) => candidate.slug === matchedHubSlug) ?? null
    : null;

  return {
    id: p.id as number,
    slug: p.slug as string,
    url: p.link as string,
    title,
    excerpt: excerpt.slice(0, 200),
    contentHtml: content,
    articleIntent: normalizeArticleIntent(
      acf.article_intent ??
        acf.articleIntent ??
        meta.article_intent ??
        meta.articleIntent
    ),
    nextArticleSlug: normalizeNextArticleSlug(
      acf.next_article_slug ??
        acf.nextArticleSlug ??
        meta.next_article_slug ??
        meta.nextArticleSlug
    ),
    isEvergreenGuide: normalizeBooleanFlag(
      acf.is_evergreen_guide ??
        acf.isEvergreenGuide ??
        meta.is_evergreen_guide ??
        meta.isEvergreenGuide
    ),
    featuredImage: normalizeWpMedia(media, title),
    author: authorRaw
      ? {
          id: authorRaw.id as number,
          name: (authorRaw.name as string) || "Delta Editorial Team",
          slug: authorRaw.slug as string,
          bio: (authorRaw.description as string) || "",
          avatar: null,
        }
      : null,
    hub,
    categories: categories.map((c) => ({
      id: c.id as number,
      name: c.name as string,
      slug: c.slug as string,
      url: c.link as string,
    })),
    tags: tags.map((t) => ({
      id: t.id as number,
      name: t.name as string,
      slug: t.slug as string,
      url: t.link as string,
    })),
    publishedAt: p.date as string,
    updatedAt: p.modified as string,
    readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
    isFeatured:
      normalizeBooleanFlag(
        acf.is_featured_article ??
          acf.isFeaturedArticle ??
          meta.is_featured_article ??
          meta.isFeaturedArticle
      ) ??
      normalizeBooleanFlag(
        acf.is_featured ??
          acf.isFeatured ??
          meta.is_featured ??
          meta.isFeatured
      ) ??
      false,
    seo: null,
    relatedPosts: [],
  };
}

export function normalizeWpProgram(
  p: Record<string, unknown>,
  { hubs }: ProgramNormalizerOptions
): Program {
  const embedded = (p._embedded || {}) as Record<string, unknown[]>;
  const media = (embedded["wp:featuredmedia"] as Record<string, unknown>[])?.[0] || null;
  const terms = (embedded["wp:term"] as unknown[][]) || [];

  const levelTerms = (terms[0] || []) as Record<string, unknown>[];
  const categoryTerms = (terms[1] || []) as Record<string, unknown>[];
  const universityTerms = (terms[2] || []) as Record<string, unknown>[];
  const cityTerms = (terms[3] || []) as Record<string, unknown>[];
  const modeTerms = (terms[4] || []) as Record<string, unknown>[];
  const uniTypeTerms = (terms[5] || []) as Record<string, unknown>[];

  const toTaxTerm = (t: Record<string, unknown>): DeltaTaxonomyTerm => ({
    id: t.id as number,
    name: t.name as string,
    slug: t.slug as string,
    url: (t.link as string) || "",
  });

  const level = levelTerms.map(toTaxTerm);
  const category = categoryTerms.map(toTaxTerm);
  const university = universityTerms.map(toTaxTerm);
  const mode = modeTerms.map(toTaxTerm);
  const city = cityTerms.map(toTaxTerm);
  const uniType = uniTypeTerms.map(toTaxTerm);

  const title = decodeHtmlEntities((p.title as { rendered: string })?.rendered || "");
  const excerpt = ((p.excerpt as { rendered: string })?.rendered || "")
    .replace(/<[^>]*>/g, "")
    .trim();
  const content = (p.content as { rendered: string })?.rendered || "";
  const meta = (p.meta as Record<string, unknown>) || {};
  const acf = (p.acf as Record<string, unknown>) || {};

  return {
    id: p.id as number,
    slug: p.slug as string,
    url: p.link as string,
    title,
    excerpt: excerpt.slice(0, 200),
    contentHtml: content,
    featuredImage: normalizeWpMedia(media, title),
    summary: {
      level: level[0]?.name || "Master",
      category: category[0]?.name || "",
      university: university[0]?.name || "",
      mode: mode[0]?.name || "",
      city: city[0]?.name || "",
      uniType: uniType[0]?.name || "",
      tuition: String(acf.tuition || meta.tuition || ""),
      duration: String(acf.duration || meta.duration || ""),
      language: String(acf.language || meta.language || "Ελληνικά"),
      deadline: String(acf.deadline || meta.deadline || ""),
      format: mode[0]?.name || "",
    },
    taxonomies: { level, category, university, mode, city, uniType },
    sections: {
      overview: String(acf.overview || meta.overview || ""),
      curriculum: String(acf.curriculum || meta.curriculum || ""),
      admissions: String(acf.admissions || meta.admissions || ""),
      outcomes: String(acf.outcomes || meta.outcomes || ""),
      faq: String(acf.faq || meta.faq || ""),
    },
    hub: hubs.find((hub) => hub.slug === "metaptyxiaka") || null,
    isFeatured: (meta.is_featured as boolean) || (acf.is_featured as boolean) || false,
    publishedAt: p.date as string,
    updatedAt: p.modified as string,
    seo: null,
  };
}
