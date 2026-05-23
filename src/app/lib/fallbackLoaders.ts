import type {
  BlogPost,
  HomepagePayload,
  Navigation,
} from "./types";

export async function loadMockHomepage(): Promise<HomepagePayload> {
  const { MOCK_HOMEPAGE } = await import("./mockHomepage");
  return MOCK_HOMEPAGE;
}

export async function loadMockNavigation(): Promise<Navigation> {
  const { MOCK_NAVIGATION } = await import("./mockNavigation");
  return MOCK_NAVIGATION;
}

export async function loadMockPosts(): Promise<BlogPost[]> {
  const { MOCK_POSTS } = await import("./mockPosts");
  return MOCK_POSTS;
}
