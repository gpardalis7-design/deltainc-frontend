import type { BlogPost } from "./types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .trim();
}

export function isGuideArticle(post: BlogPost) {
  if (post.isEvergreenGuide) return true;

  return post.tags.some((tag) => {
    const slug = normalizeText(tag.slug || "");
    const name = normalizeText(tag.name || "");
    return slug === "οδηγοι" || slug === "guides" || name === "οδηγοι" || name === "guides";
  });
}
