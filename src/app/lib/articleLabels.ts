import type { BlogPost } from "./types";

const EXCLUDED_CATEGORY_SLUGS = new Set(["uncategorized"]);

export function getArticlePrimaryLabel(post: BlogPost): string | null {
  if (post.hub?.name?.trim()) {
    return post.hub.name.trim();
  }

  const fallbackCategory = post.categories.find((category) => {
    const slug = category.slug?.trim().toLowerCase();
    const name = category.name?.trim();
    return Boolean(name) && !EXCLUDED_CATEGORY_SLUGS.has(slug);
  });

  return fallbackCategory?.name?.trim() || null;
}
