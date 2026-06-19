import type { BlogPost, DeltaTaxonomyTerm } from "./types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR")
    .trim();
}

export function isGuideTerm(term: Pick<DeltaTaxonomyTerm, "slug" | "name">) {
  const slug = normalizeText(term.slug || "");
  const name = normalizeText(term.name || "");
  return slug === "οδηγοι" || slug === "guides" || name === "οδηγοι" || name === "guides";
}

export function isGuideArticle(post: BlogPost) {
  return Boolean(post.isEvergreenGuide || post.tags.some(isGuideTerm));
}
