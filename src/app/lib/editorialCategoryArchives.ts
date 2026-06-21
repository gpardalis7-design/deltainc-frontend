import policy from "./sitePolicy.json";

export interface EditorialCategoryArchive {
  slug: string;
  path: `/${string}`;
  name: string;
  h1: string;
  intro: string;
  titleFull: string;
  description: string;
}

export const EDITORIAL_CATEGORY_ARCHIVES = policy.editorialCategoryArchives as Record<string, EditorialCategoryArchive>;

export const EDITORIAL_CATEGORY_ARCHIVE_SLUGS = Object.keys(EDITORIAL_CATEGORY_ARCHIVES);

function normalizeSlug(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getEditorialCategoryArchive(slug: string | undefined): EditorialCategoryArchive | null {
  return EDITORIAL_CATEGORY_ARCHIVES[normalizeSlug(slug)] ?? null;
}

export function getEditorialCategoryArchivePath(slug: string | undefined): string | null {
  return getEditorialCategoryArchive(slug)?.path ?? null;
}
