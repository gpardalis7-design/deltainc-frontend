import type {
  BlogPost,
  Program,
  HomepagePayload,
  DeltaHub,
  CollectionResponse,
  FilterOptions,
  PostsParams,
  ProgramsParams,
  DeltaTaxonomyTerm,
} from "./types";
import { buildUrl, ENABLE_MOCK_FALLBACKS, tryFetch, tryFetchWithHeaders, WP_API, WP_BASE_URL } from "./api/core";
import { getPostApi, getPostsApi, getTagsApi } from "./api/posts";
import {
  loadMockHomepage,
  loadMockPosts,
} from "./fallbackLoaders";
import {
  getProgramApi,
  getProgramFiltersApi,
  getProgramsApi,
} from "./api/programs";
import { normalizeWpPost, normalizeWpProgram } from "./normalizers";
import {
  MOCK_HUBS,
} from "./mockDeltaData";

// ─── Per-page constants (single source of truth, not caller-controlled) ──────
const POSTS_PER_PAGE         = 12;
const PROGRAMS_PER_PAGE      = 9;

// ─── WP v2 category cache ─────────────────────────────────────────────────────
// Maps hub slug → WP category ID (e.g. "opsyd" → 342)
// Populated lazily on first request; null means "not found / fetch failed".
// Also pre-filled by CategoriesProvider on app boot via getCategories().

const WP_CAT_CACHE: Record<string, number | null> = {};
const WP_TAG_CACHE: Record<string, number | null> = {};

// ─── Known hub slug ↔ WP category ID mappings ────────────────────────────────
// Real IDs from the live DB (spec §6). These are the ground truth —
// WP slugs differ from our friendly app slugs (e.g. "opsyd-proslipsis-anaplirwtwn"
// vs "opsyd"; "metaptychiaka" vs "metaptyxiaka").
// "pistopoihseis" has no confirmed ID yet and falls back to slug resolution.
const HUB_WP_IDS: Record<string, number> = {
  opsyd:        342, // WP slug: "opsyd-proslipsis-anaplirwtwn"
  asep:         285, // WP slug: "prokirykseis-asep-sox"
  metaptyxiaka: 286, // WP slug: "metaptychiaka" (different spelling)
  pistopoihseis: 349, // WP slug: "πιστοποιήσεις" (Greek, percent-encoded)
  "επιδόματα":  347, // WP slug: "%ce%b5%cf%80%ce%b9%ce%b4%cf%8c%ce%bc%ce%b1%cf%84%ce%b1" (Greek, percent-encoded)
};
// Reverse: WP category ID → our friendly app slug
const WP_ID_TO_HUB_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(HUB_WP_IDS).map(([slug, id]) => [id, slug])
);
// Pre-seed the cache at module init — these hubs never need a round-trip
Object.entries(HUB_WP_IDS).forEach(([slug, id]) => { WP_CAT_CACHE[slug] = id; });

async function resolveWpCategoryId(slug: string): Promise<number | null> {
  if (slug in WP_CAT_CACHE) return WP_CAT_CACHE[slug];
  try {
    const res = await fetch(
      buildUrl(WP_API, "/categories", { slug, per_page: 1 }),
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) { WP_CAT_CACHE[slug] = null; return null; }
    const data = (await res.json()) as Record<string, unknown>[];
    const id = Array.isArray(data) && data.length > 0 ? (data[0].id as number) : null;
    WP_CAT_CACHE[slug] = id;
    return id;
  } catch {
    WP_CAT_CACHE[slug] = null;
    return null;
  }
}

async function resolveWpTagId(slug: string): Promise<number | null> {
  if (slug in WP_TAG_CACHE) return WP_TAG_CACHE[slug];
  try {
    const res = await fetch(
      buildUrl(WP_API, "/tags", { slug, per_page: 1 }),
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) {
      WP_TAG_CACHE[slug] = null;
      return null;
    }
    const data = (await res.json()) as Record<string, unknown>[];
    const id = Array.isArray(data) && data.length > 0 ? (data[0].id as number) : null;
    WP_TAG_CACHE[slug] = id;
    return id;
  } catch {
    WP_TAG_CACHE[slug] = null;
    return null;
  }
}

// ─── WP v2 category normalizer ────────────────────────────────────────────────

function normalizeWpCategory(c: Record<string, unknown>): DeltaHub {
  const id = c.id as number;
  const rawSlug = c.slug as string;
  // WP returns Greek (and other non-ASCII) slugs percent-encoded.
  // Decode so the cache key and DeltaHub.slug always match what useParams() gives us.
  let wpSlug: string;
  try {
    wpSlug = decodeURIComponent(rawSlug);
  } catch {
    wpSlug = rawSlug; // malformed encoding — keep as-is
  }
  // If this WP category ID maps to a known hub, use the friendly app slug
  // so Navbar links stay as /opsyd rather than /opsyd-proslipsis-anaplirwtwn.
  const appSlug = WP_ID_TO_HUB_SLUG[id] ?? wpSlug;
  WP_CAT_CACHE[appSlug] = id;                          // decoded/friendly slug → real ID
  if (appSlug !== rawSlug) WP_CAT_CACHE[rawSlug] = id; // also cover raw percent-encoded form
  return {
    id: String(id),
    name: (c.name as string) || wpSlug,
    slug: appSlug,
    description: (c.description as string) || "",
    url: (c.link as string) || `${WP_BASE_URL}/category/${rawSlug}/`,
    featuredImage: null,
    wpCategoryId: id,
    count: (c.count as number) || 0,
  };
}

// ─── WP v2 normalizers ───────────────────────────────────────────────────────

// Known hub slugs used to derive hub from post categories
const HUB_SLUGS = ["opsyd", "asep", "metaptyxiaka", "pistopoihseis"] as const;

export { MOCK_HUBS } from "./mockDeltaData";

// ─── Public API functions ─────────────────────────────────────────────────────

export async function getHomepage(): Promise<{ data: HomepagePayload; isMock: boolean }> {
  // Compose homepage from live WP data
  try {
    const hubOrder = ["metaptyxiaka", "asep", "opsyd", "pistopoihseis"] as const;
    const [mockHomepage, postsRes, featuredPostgraduateProgramsRes, featuredUndergraduateProgramsRes, featuredHubPostResults] = await Promise.all([
      loadMockHomepage(),
      getPosts({ page: 1 }),
      getFeaturedPrograms(3, "metaptyxiaka-pogrammata"),
      getFeaturedPrograms(3, "proptixiaka-programmata"),
      Promise.all(hubOrder.map((hub) => getFeaturedPost(hub))),
    ]);

    const featuredHubPosts = featuredHubPostResults
      .map((result) => result.data)
      .filter((post): post is BlogPost => Boolean(post));
    const featuredHubPostIds = new Set(featuredHubPosts.map((post) => post.id));
    const deduplicatedLatestPosts = postsRes.data.filter((post) => !featuredHubPostIds.has(post.id));

    const payload: HomepagePayload = {
      hero: mockHomepage.hero,
      latestPosts: deduplicatedLatestPosts.slice(0, 3),
      featuredHubPosts,
      featuredPrograms: {
        postgraduate: featuredPostgraduateProgramsRes.data,
        undergraduate: featuredUndergraduateProgramsRes.data,
      },
      trendingTopics: mockHomepage.trendingTopics,
      stats: mockHomepage.stats,
      testimonials: mockHomepage.testimonials,
      contactBlock: mockHomepage.contactBlock,
      seo: mockHomepage.seo,
    };

    const anyMock =
      postsRes.isMock ||
      featuredPostgraduateProgramsRes.isMock ||
      featuredUndergraduateProgramsRes.isMock ||
      featuredHubPostResults.some((result) => result.isMock);
    return { data: payload, isMock: anyMock };
  } catch {
    return { data: await loadMockHomepage(), isMock: true };
  }
}

export async function getHubs(): Promise<{ data: DeltaHub[]; isMock: boolean }> {
  return getCategories();
}

/**
 * Fetch all non-empty categories from wp/v2/categories.
 * As a side-effect, every returned category's slug→id pair is written into
 * WP_CAT_CACHE, so subsequent getPosts() hub-filter calls need zero extra
 * HTTP requests to resolve category IDs.
 */
export async function getCategories(): Promise<{ data: DeltaHub[]; isMock: boolean; sourceUnavailable: boolean }> {
  // Always fetch the full wp/v2/categories list — this is the only source that
  // contains ALL categories (including ones like "epidomata" that aren't in our
  // hardcoded HUB_WP_IDS).
  // normalizeWpCategory seeds WP_CAT_CACHE as a side effect, so subsequent
  // getPosts() calls that pass wpCategoryId directly need zero extra round-trips.
  const wpRes = await tryFetch<Record<string, unknown>[]>(
    buildUrl(WP_API, "/categories", { per_page: 100, hide_empty: true, orderby: "count", order: "desc" })
  );
  if (Array.isArray(wpRes) && wpRes.length > 0) {
    const hubs = wpRes
      .filter((c) => (c.slug as string) !== "uncategorized")
      .map(normalizeWpCategory);
    if (hubs.length > 0) return { data: hubs, isMock: false, sourceUnavailable: false };
  }

  // WP fetch failed — seed known slugs so lazy resolvers don't keep retrying.
  MOCK_HUBS.forEach((h) => {
    if (!(h.slug in WP_CAT_CACHE)) WP_CAT_CACHE[h.slug] = null;
  });

  if (ENABLE_MOCK_FALLBACKS) {
    return { data: MOCK_HUBS, isMock: true, sourceUnavailable: false };
  }

  return { data: [], isMock: false, sourceUnavailable: true };
}

export async function getPosts(
  params: PostsParams = {}
): Promise<{ data: BlogPost[]; meta: CollectionResponse<BlogPost>["meta"]; isMock: boolean; sourceUnavailable: boolean }> {
  return getPostsApi(params, {
    postsPerPage: POSTS_PER_PAGE,
    wpApi: WP_API,
    enableMockFallbacks: ENABLE_MOCK_FALLBACKS,
    mockHubs: MOCK_HUBS,
    hubSlugs: HUB_SLUGS,
    wpIdToHubSlug: WP_ID_TO_HUB_SLUG,
    buildUrl,
    tryFetch,
    tryFetchWithHeaders,
    loadMockPosts,
    normalizeWpPost,
    resolveWpCategoryId,
    resolveWpTagId,
  });
}

export async function getPost(slug: string): Promise<{ data: BlogPost | null; isMock: boolean; sourceUnavailable: boolean }> {
  return getPostApi(slug, {
    postsPerPage: POSTS_PER_PAGE,
    wpApi: WP_API,
    enableMockFallbacks: ENABLE_MOCK_FALLBACKS,
    mockHubs: MOCK_HUBS,
    hubSlugs: HUB_SLUGS,
    wpIdToHubSlug: WP_ID_TO_HUB_SLUG,
    buildUrl,
    tryFetch,
    tryFetchWithHeaders,
    loadMockPosts,
    normalizeWpPost,
    resolveWpCategoryId,
    resolveWpTagId,
  });
}

function decodeMaybeEncodedSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Phase 2: read a build-time embedded blog post (injected into <head> as
 * <script id="__DELTA_BLOG_POST__" type="application/json">) and normalize it
 * with the same pure normalizer the live fetch uses — so BlogArticle can seed
 * initial state and skip the skeleton. Returns null if absent or slug mismatch.
 */
export function getEmbeddedPost(slug: string): BlogPost | null {
  if (typeof document === "undefined" || !slug) return null;
  const raw = document.getElementById("__DELTA_BLOG_POST__")?.textContent?.trim();
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    if (decodeMaybeEncodedSlug(payload.slug) !== decodeMaybeEncodedSlug(slug)) return null;
    return normalizeWpPost(payload, {
      hubs: MOCK_HUBS,
      hubSlugs: HUB_SLUGS,
      wpIdToHubSlug: WP_ID_TO_HUB_SLUG,
    });
  } catch {
    return null;
  }
}

/**
 * Phase 3: read a build-time embedded program (<script id="__DELTA_PROGRAM__">)
 * and normalize it with the same pure normalizer the live fetch uses — so
 * ProgramDetails can seed initial state and skip the skeleton.
 */
export function getEmbeddedProgram(slug: string): Program | null {
  if (typeof document === "undefined" || !slug) return null;
  const raw = document.getElementById("__DELTA_PROGRAM__")?.textContent?.trim();
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    if (decodeMaybeEncodedSlug(payload.slug) !== decodeMaybeEncodedSlug(slug)) return null;
    return normalizeWpProgram(payload, { hubs: MOCK_HUBS });
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'");
}

function normalizeFeaturedPostPayload(payload: unknown): BlogPost | null {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as Record<string, unknown>;
  if (!raw.data || typeof raw.data !== "object") return null;

  const post = raw.data as Record<string, unknown>;
  const authorRaw = post.author as Record<string, unknown> | null | undefined;
  const hubRaw = post.hub as Record<string, unknown> | null | undefined;
  const categoriesRaw = Array.isArray(post.categories) ? post.categories : [];
  const tagsRaw = Array.isArray(post.tags) ? post.tags : [];
  const relatedPostsRaw = Array.isArray(post.relatedPosts) ? post.relatedPosts : [];

  return {
    ...(post as unknown as BlogPost),
    slug: decodeMaybeEncodedSlug(post.slug),
    title: decodeHtmlEntities(typeof post.title === "string" ? post.title : ""),
    excerpt: decodeHtmlEntities(typeof post.excerpt === "string" ? post.excerpt : ""),
    author: authorRaw
      ? {
          ...(authorRaw as unknown as BlogPost["author"]),
          id: Number(authorRaw.id) || 0,
        }
      : null,
    hub: hubRaw
      ? {
          ...(hubRaw as unknown as DeltaHub),
          slug: decodeMaybeEncodedSlug(hubRaw.slug),
        }
      : null,
    categories: categoriesRaw.map((category) => {
      const item = category as Record<string, unknown>;
      return {
        ...(item as unknown as DeltaTaxonomyTerm),
        slug: decodeMaybeEncodedSlug(item.slug),
      };
    }),
    tags: tagsRaw.map((tag) => {
      const item = tag as Record<string, unknown>;
      return {
        ...(item as unknown as DeltaTaxonomyTerm),
        slug: decodeMaybeEncodedSlug(item.slug),
      };
    }),
    relatedPosts: relatedPostsRaw as BlogPost["relatedPosts"],
  };
}

export async function getFeaturedPost(
  hub: string
): Promise<{ data: BlogPost | null; isMock: boolean }> {
  const response = await tryFetch<Record<string, unknown>>(
    buildUrl(WP_BASE_URL, "/wp-json/delta/v1/featured-post", { hub })
  );

  if (!response) {
    return { data: null, isMock: true };
  }

  return {
    data: normalizeFeaturedPostPayload(response),
    isMock: false,
  };
}

function normalizeFeaturedProgramsPayload(payload: unknown): Program[] {
  if (!payload || typeof payload !== "object") return [];

  const raw = payload as Record<string, unknown>;
  const items = Array.isArray(raw.data) ? raw.data : [];

  return items.map((item) => {
    const program = item as Record<string, unknown>;
    const featuredImageRaw = program.featuredImage as Record<string, unknown> | null | undefined;
    const universityLogoRaw = program.universityLogo as Record<string, unknown> | null | undefined;
    const summaryRaw = (program.summary as Record<string, unknown> | null | undefined) || {};
    const taxonomiesRaw = (program.taxonomies as Record<string, unknown> | null | undefined) || {};
    const sectionsRaw = (program.sections as Record<string, unknown> | null | undefined) || {};

    return {
      id: Number(program.id) || 0,
      slug: decodeMaybeEncodedSlug(program.slug),
      url: typeof program.url === "string" ? program.url : "",
      title: decodeHtmlEntities(typeof program.title === "string" ? program.title : ""),
      excerpt: decodeHtmlEntities(typeof program.excerpt === "string" ? program.excerpt : ""),
      contentHtml: typeof program.contentHtml === "string" ? program.contentHtml : "",
      featuredImage: featuredImageRaw
        ? {
            id: Number(featuredImageRaw.id) || 0,
            url: typeof featuredImageRaw.url === "string" ? featuredImageRaw.url : "",
            alt: typeof featuredImageRaw.alt === "string" ? featuredImageRaw.alt : "",
            width: Number(featuredImageRaw.width) || 0,
            height: Number(featuredImageRaw.height) || 0,
            mimeType: typeof featuredImageRaw.mimeType === "string" ? featuredImageRaw.mimeType : "",
          }
        : null,
      universityLogo: universityLogoRaw
        ? {
            id: Number(universityLogoRaw.id) || 0,
            url: typeof universityLogoRaw.url === "string" ? universityLogoRaw.url : "",
            alt: typeof universityLogoRaw.alt === "string" ? universityLogoRaw.alt : "",
            width: Number(universityLogoRaw.width) || 0,
            height: Number(universityLogoRaw.height) || 0,
            mimeType: typeof universityLogoRaw.mimeType === "string" ? universityLogoRaw.mimeType : "",
          }
        : null,
      summary: {
        level: typeof summaryRaw.level === "string" ? summaryRaw.level : "",
        category: typeof summaryRaw.category === "string" ? summaryRaw.category : "",
        university: typeof summaryRaw.university === "string" ? summaryRaw.university : "",
        mode: typeof summaryRaw.mode === "string" ? summaryRaw.mode : "",
        city: typeof summaryRaw.city === "string" ? summaryRaw.city : "",
        uniType: typeof summaryRaw.uniType === "string" ? summaryRaw.uniType : "",
        tuition: typeof summaryRaw.tuition === "string" ? summaryRaw.tuition : "",
        duration: typeof summaryRaw.duration === "string" ? summaryRaw.duration : "",
        language: typeof summaryRaw.language === "string" ? summaryRaw.language : "",
        deadline: typeof summaryRaw.deadline === "string" ? summaryRaw.deadline : "",
        format: typeof summaryRaw.format === "string" ? summaryRaw.format : "",
      },
      taxonomies: {
        level: Array.isArray(taxonomiesRaw.level) ? (taxonomiesRaw.level as DeltaTaxonomyTerm[]) : [],
        category: Array.isArray(taxonomiesRaw.category) ? (taxonomiesRaw.category as DeltaTaxonomyTerm[]) : [],
        university: Array.isArray(taxonomiesRaw.university) ? (taxonomiesRaw.university as DeltaTaxonomyTerm[]) : [],
        mode: Array.isArray(taxonomiesRaw.mode) ? (taxonomiesRaw.mode as DeltaTaxonomyTerm[]) : [],
        city: Array.isArray(taxonomiesRaw.city) ? (taxonomiesRaw.city as DeltaTaxonomyTerm[]) : [],
        uniType: Array.isArray(taxonomiesRaw.uniType) ? (taxonomiesRaw.uniType as DeltaTaxonomyTerm[]) : [],
      },
      sections: {
        overview: typeof sectionsRaw.overview === "string" ? sectionsRaw.overview : "",
        curriculum: typeof sectionsRaw.curriculum === "string" ? sectionsRaw.curriculum : "",
        admissions: typeof sectionsRaw.admissions === "string" ? sectionsRaw.admissions : "",
        outcomes: typeof sectionsRaw.outcomes === "string" ? sectionsRaw.outcomes : "",
        faq: typeof sectionsRaw.faq === "string" ? sectionsRaw.faq : "",
      },
      hub: null,
      isFeatured: Boolean(program.isFeatured),
      publishedAt: typeof program.publishedAt === "string" ? program.publishedAt : "",
      updatedAt: typeof program.updatedAt === "string" ? program.updatedAt : "",
      seo: null,
    };
  });
}

function normalizeProgramCardPayload(program: Record<string, unknown>): Program {
  const featuredImageRaw = program.featuredImage as Record<string, unknown> | null | undefined;
  const summaryRaw = (program.summary as Record<string, unknown> | null | undefined) || {};

  return {
    id: Number(program.id) || 0,
    slug: decodeMaybeEncodedSlug(program.slug),
    url: typeof program.url === "string" ? program.url : "",
    title: decodeHtmlEntities(typeof program.title === "string" ? program.title : ""),
    excerpt: "",
    contentHtml: "",
    featuredImage: featuredImageRaw
      ? {
          id: 0,
          url: typeof featuredImageRaw.url === "string" ? featuredImageRaw.url : "",
          alt: typeof featuredImageRaw.alt === "string" ? featuredImageRaw.alt : "",
          width: 0,
          height: 0,
          mimeType: "",
        }
      : null,
    universityLogo: null,
    summary: {
      level: typeof summaryRaw.level === "string" ? summaryRaw.level : "",
      category: typeof summaryRaw.category === "string" ? summaryRaw.category : "",
      university: typeof summaryRaw.university === "string" ? summaryRaw.university : "",
      mode: typeof summaryRaw.mode === "string" ? summaryRaw.mode : "",
      city: typeof summaryRaw.city === "string" ? summaryRaw.city : "",
      uniType: typeof summaryRaw.uniType === "string" ? summaryRaw.uniType : "",
      tuition: typeof summaryRaw.tuition === "string" ? summaryRaw.tuition : "",
      duration: typeof summaryRaw.duration === "string" ? summaryRaw.duration : "",
      language: typeof summaryRaw.language === "string" ? summaryRaw.language : "",
      deadline: typeof summaryRaw.deadline === "string" ? summaryRaw.deadline : "",
      format: typeof summaryRaw.format === "string" ? summaryRaw.format : "",
    },
    taxonomies: {
      level: [],
      category: [],
      university: [],
      mode: [],
      city: [],
      uniType: [],
    },
    sections: {
      overview: "",
      curriculum: "",
      admissions: "",
      outcomes: "",
      faq: "",
    },
    hub: null,
    isFeatured: false,
    publishedAt: "",
    updatedAt: "",
    seo: null,
  };
}

export async function getFeaturedPrograms(
  limit = 3,
  level?: string
): Promise<{ data: Program[]; isMock: boolean }> {
  const response = await tryFetch<Record<string, unknown>>(
    buildUrl(WP_BASE_URL, "/wp-json/delta/v1/featured-programs", { limit, ...(level ? { level } : {}) })
  );

  if (!response) {
    return { data: [], isMock: true };
  }

  return {
    data: normalizeFeaturedProgramsPayload(response),
    isMock: false,
  };
}

export async function getProgramFilters(): Promise<FilterOptions | undefined> {
  return getProgramFiltersApi({
    buildUrl,
    tryFetch,
    wpApi: WP_API,
  });
}

// Fetch available tags for blog filtering
export async function getTags(): Promise<{ data: DeltaTaxonomyTerm[]; isMock: boolean }> {
  return getTagsApi({
    buildUrl,
    tryFetch,
    wpApi: WP_API,
  });
}

export async function getPrograms(params: ProgramsParams = {}): Promise<{ data: Program[]; meta: CollectionResponse<Program>["meta"]; filters?: FilterOptions; isMock: boolean; sourceUnavailable: boolean }> {
  return getProgramsApi(params, {
    programsPerPage: PROGRAMS_PER_PAGE,
    wpApi: WP_API,
    wpBaseUrl: WP_BASE_URL,
    buildUrl,
    tryFetch,
    tryFetchWithHeaders,
    normalizeWpProgram,
    normalizeProgramCard: normalizeProgramCardPayload,
    mockHubs: MOCK_HUBS,
  });
}

export async function getProgram(slug: string): Promise<{ data: Program | null; isMock: boolean; sourceUnavailable: boolean }> {
  return getProgramApi(slug, {
    programsPerPage: PROGRAMS_PER_PAGE,
    wpApi: WP_API,
    wpBaseUrl: WP_BASE_URL,
    buildUrl,
    tryFetch,
    tryFetchWithHeaders,
    normalizeWpProgram,
    normalizeProgramCard: normalizeProgramCardPayload,
    mockHubs: MOCK_HUBS,
  });
}

export type LeadSubmissionPayload = {
  form_type: string;
  subject: string;
  name: string;
  email: string;
  phone: string;
  page_url: string;
  submitted_at: string;
  interest?: string;
  message?: string;
  program_title?: string;
  university?: string;
  hub?: string;
  source_label?: string;
};

export async function submitContact(payload: LeadSubmissionPayload): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/delta/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    
    if (!res.ok) {
      return { 
        success: false, 
        message: "Η αποστολή απέτυχε. Παρακαλώ δοκιμάστε ξανά σε λίγο.",
        error: `HTTP ${res.status}`
      };
    }
    
    const json = await res.json() as { success: boolean; message: string };
    return json;
  } catch (error) {
    return { 
      success: false, 
      message: "Η αποστολή απέτυχε. Παρακαλώ δοκιμάστε ξανά σε λίγο.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
