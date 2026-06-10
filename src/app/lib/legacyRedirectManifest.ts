import manifest from "./generated/legacyRedirectManifest.json";

type RedirectType = "static" | "article" | "program";

type RedirectEntry = {
  from: string;
  to: string;
  type: RedirectType;
};

const exactRedirectMap = new Map(
  (manifest.exactRedirects as RedirectEntry[]).map((entry) => [normalizePath(entry.from), normalizePath(entry.to)]),
);
const articleRedirectMap = new Map(
  (manifest.articleRedirects as RedirectEntry[]).map((entry) => [normalizePath(entry.from), normalizePath(entry.to)]),
);
const programRedirectMap = new Map(
  (manifest.programRedirects as RedirectEntry[]).map((entry) => [normalizePath(entry.from), normalizePath(entry.to)]),
);

function normalizePath(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function findExactLegacyRedirect(pathname: string): string | null {
  return exactRedirectMap.get(normalizePath(pathname)) ?? null;
}

export function findLegacyArticleRedirect(pathname: string): string | null {
  return articleRedirectMap.get(normalizePath(pathname)) ?? null;
}

export function findLegacyProgramRedirect(pathname: string): string | null {
  return programRedirectMap.get(normalizePath(pathname)) ?? null;
}

export function hasLegacyProgramSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  return (manifest.programSlugs as string[]).includes(slug);
}

export function hasLegacyArticleSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  return (manifest.postSlugs as string[]).includes(slug);
}
