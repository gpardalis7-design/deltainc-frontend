import type {
  BlogPost,
  HomepagePayload,
} from "./types";

export async function loadMockHomepage(): Promise<HomepagePayload> {
  const { MOCK_HOMEPAGE } = await import("./mockHomepage");
  return MOCK_HOMEPAGE;
}

export async function loadMockPosts(): Promise<BlogPost[]> {
  const { MOCK_POSTS } = await import("./mockPosts");
  return MOCK_POSTS;
}
