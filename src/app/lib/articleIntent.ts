import type { BlogPost } from "./types";

export type ArticleIntent = "read_more" | "hub" | "service";

const SERVICE_KEYWORDS = [
  "προθεσμια",
  "αιτησεις",
  "δικαιολογητικα",
  "προκηρυξη",
  "προκηρυξεις",
  "ενσταση",
  "υποβολη",
  "δηλωση",
  "ανοιξε",
  "ξεκινησαν",
];

const READ_MORE_KEYWORDS = [
  "τι ειναι",
  "οδηγος",
  "πως",
  "τι ισχυει",
  "τι αλλαζει",
  "αναλυτικα",
  "βημα βημα",
];

const HUB_KEYWORDS = [
  "μορια",
  "πινακες",
  "οπσυδ",
  "μεταπτυχιακα",
  "πιστοποιησεις",
  "κατηγοριες",
  "προγραμματα",
];

const HUB_DEFAULTS: Partial<Record<NonNullable<BlogPost["hub"]>["slug"], ArticleIntent>> = {
  metaptyxiaka: "hub",
  pistopoihseis: "hub",
  asep: "read_more",
  opsyd: "read_more",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("el-GR");
}

function includesAnyKeyword(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

export function resolveArticleIntent(post: BlogPost): ArticleIntent {
  if (post.articleIntent) return post.articleIntent;

  const searchableText = normalizeText(`${post.title} ${post.excerpt}`);

  if (includesAnyKeyword(searchableText, SERVICE_KEYWORDS)) {
    return "service";
  }

  if (includesAnyKeyword(searchableText, READ_MORE_KEYWORDS)) {
    return "read_more";
  }

  const hubDefault = post.hub?.slug ? HUB_DEFAULTS[post.hub.slug] : undefined;
  if (hubDefault) {
    return hubDefault;
  }

  if (includesAnyKeyword(searchableText, HUB_KEYWORDS)) {
    return "hub";
  }

  return "read_more";
}
