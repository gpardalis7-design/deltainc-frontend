import type {
  BlogPost,
  CollectionResponse,
  DeltaHub,
  DeltaTaxonomyTerm,
  PostsParams,
} from "../types";

type WpFetchHeadersResult = { data: unknown; headers: Headers } | null;

type PostsApiDeps = {
  postsPerPage: number;
  wpApi: string;
  mockHubs: DeltaHub[];
  hubSlugs: readonly string[];
  wpIdToHubSlug: Record<number, string>;
  buildUrl: (
    base: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ) => string;
  tryFetch: <T>(url: string, timeoutMs?: number) => Promise<T | null>;
  tryFetchWithHeaders: (url: string, timeoutMs?: number) => Promise<WpFetchHeadersResult>;
  loadMockPosts: () => Promise<BlogPost[]>;
  normalizeWpPost: (
    post: Record<string, unknown>,
    options: {
      hubSlugHint?: string;
      hubs: DeltaHub[];
      hubSlugs: readonly string[];
      wpIdToHubSlug: Record<number, string>;
    }
  ) => BlogPost;
  resolveWpCategoryId: (slug: string) => Promise<number | null>;
  resolveWpTagId: (slug: string) => Promise<number | null>;
};

interface WpFetchResult {
  posts: BlogPost[];
  total: number;
  totalPages: number;
}

async function fetchWpV2Posts(params: PostsParams, deps: PostsApiDeps): Promise<WpFetchResult | null> {
  try {
    const perPage = params.perPage || deps.postsPerPage;
    let categoryId: number | undefined;
    let tagId: number | undefined;

    if (params.wpCategoryId) {
      categoryId = params.wpCategoryId;
    } else if (params.hub) {
      const id = await deps.resolveWpCategoryId(params.hub);
      if (id === null) {
        return null;
      }
      categoryId = id;
    }

    if (params.tag) {
      const numericTagId = Number(params.tag);
      if (Number.isInteger(numericTagId) && numericTagId > 0) {
        tagId = numericTagId;
      } else {
        const resolvedTagId = await deps.resolveWpTagId(params.tag);
        if (resolvedTagId === null) {
          return { posts: [], total: 0, totalPages: 1 };
        }
        tagId = resolvedTagId;
      }
    }

    const url = deps.buildUrl(deps.wpApi, "/posts", {
      page: params.offset !== undefined ? undefined : params.page || 1,
      per_page: perPage,
      offset: params.offset,
      _embed: 1,
      search: params.search || undefined,
      categories: categoryId,
      tags: tagId,
      orderby: params.sort === "oldest" ? "date" : params.sort === "title" ? "title" : undefined,
      order: params.sort === "oldest" ? "asc" : params.sort === "title" ? "asc" : "desc",
    });

    const result = await deps.tryFetchWithHeaders(url);
    if (!result) return null;

    const total = parseInt(result.headers.get("X-WP-Total") || "0", 10);
    const totalPages = parseInt(result.headers.get("X-WP-TotalPages") || "1", 10);
    const data = result.data as Record<string, unknown>[];

    if (!Array.isArray(data)) return null;

    const posts = data.map((post) =>
      deps.normalizeWpPost(post, {
        hubSlugHint: params.hub,
        hubs: deps.mockHubs,
        hubSlugs: deps.hubSlugs,
        wpIdToHubSlug: deps.wpIdToHubSlug,
      })
    );

    return { posts, total: total || posts.length, totalPages: totalPages || 1 };
  } catch {
    return null;
  }
}

export async function getPostsApi(
  params: PostsParams = {},
  deps: PostsApiDeps
): Promise<{ data: BlogPost[]; meta: CollectionResponse<BlogPost>["meta"]; isMock: boolean }> {
  const perPage = params.perPage || deps.postsPerPage;
  const wpResult = await fetchWpV2Posts(params, deps);

  if (wpResult !== null) {
    return {
      data: wpResult.posts,
      meta: {
        page: params.page || 1,
        perPage,
        total: wpResult.total,
        totalPages: wpResult.totalPages,
      },
      isMock: false,
    };
  }

  let filtered = [...(await deps.loadMockPosts())];
  if (params.hub) filtered = filtered.filter((post) => post.hub?.slug === params.hub);
  if (params.search) {
    const query = params.search.toLowerCase();
    filtered = filtered.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query)
    );
  }
  if (params.tag) {
    const normalizedTag = params.tag.toLowerCase();
    filtered = filtered.filter((post) =>
      post.tags.some(
        (tag) =>
          tag.slug.toLowerCase() === normalizedTag ||
          tag.name.toLowerCase() === normalizedTag
      )
    );
  }
  if (params.featured) filtered = filtered.filter((post) => post.isFeatured);

  const page = params.page || 1;
  const start = params.offset ?? (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  return {
    data: paginated,
    meta: {
      page,
      perPage,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / perPage),
    },
    isMock: true,
  };
}

export async function getPostApi(
  slug: string,
  deps: PostsApiDeps
): Promise<{ data: BlogPost | null; isMock: boolean }> {
  const wpUrl = deps.buildUrl(deps.wpApi, "/posts", { slug, _embed: 1 });
  const wpRes = await deps.tryFetch<Record<string, unknown>[]>(wpUrl);

  if (Array.isArray(wpRes) && wpRes.length > 0) {
    return {
      data: deps.normalizeWpPost(wpRes[0], {
        hubs: deps.mockHubs,
        hubSlugs: deps.hubSlugs,
        wpIdToHubSlug: deps.wpIdToHubSlug,
      }),
      isMock: false,
    };
  }

  const mock = (await deps.loadMockPosts()).find((post) => post.slug === slug) || null;
  return { data: mock, isMock: true };
}

export async function getTagsApi(
  deps: Pick<PostsApiDeps, "buildUrl" | "tryFetch" | "wpApi">
): Promise<{ data: DeltaTaxonomyTerm[]; isMock: boolean }> {
  const res = await deps.tryFetch<Record<string, unknown>[]>(
    deps.buildUrl(deps.wpApi, "/tags", {
      per_page: 100,
      hide_empty: true,
      orderby: "count",
      order: "desc",
    })
  );

  if (Array.isArray(res) && res.length > 0) {
    const tags = res.map((tag) => ({
      id: tag.id as number,
      name: tag.name as string,
      slug: tag.slug as string,
      url: (tag.link as string) || "",
    }));
    return { data: tags, isMock: false };
  }

  return { data: [], isMock: true };
}
