import policy from "./sitePolicy.json";

type RoutePath = `/${string}`;

export const INDEXABLE_STATIC_ROUTES = policy.indexableStaticRoutes as RoutePath[];
export const NOINDEX_STATIC_ROUTES = policy.noindexStaticRoutes as RoutePath[];
export const PROMOTED_SERVICE_HUB_SLUGS = policy.promotedServiceHubSlugs as string[];
export const EDITORIAL_HUB_SLUGS = policy.editorialHubSlugs as string[];
export const SERVICE_CATEGORY_REDIRECTS = policy.serviceCategoryRedirects as Record<string, RoutePath>;
export const EDITORIAL_CATEGORY_REDIRECTS = policy.editorialCategoryRedirects as Record<string, RoutePath>;
export const LEGACY_STATIC_REDIRECTS = policy.legacyStaticRedirects as Record<RoutePath, RoutePath>;

export type StaticSeoPage =
  | "about"
  | "contact"
  | "privacy"
  | "cookies"
  | "terms"
  | "assignments"
  | "deltaApps"
  | "moriaCalculator"
  | "blogHub";

const STATIC_PAGE_PATHS: Record<StaticSeoPage, RoutePath> = {
  about: "/about",
  contact: "/contact",
  privacy: "/privacy-policy",
  cookies: "/cookie-policy",
  terms: "/terms",
  assignments: "/assignments",
  deltaApps: "/delta-apps",
  moriaCalculator: "/delta-apps/moria-calculator",
  blogHub: "/blog-hub",
};

function normalizeSlug(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getStaticPagePath(page: StaticSeoPage): RoutePath {
  return STATIC_PAGE_PATHS[page];
}

export function isPromotedServiceHubSlug(slug: string | undefined): boolean {
  return PROMOTED_SERVICE_HUB_SLUGS.includes(normalizeSlug(slug));
}

export function isEditorialHubSlug(slug: string | undefined): boolean {
  return EDITORIAL_HUB_SLUGS.includes(normalizeSlug(slug));
}

export function shouldIndexHubSlug(slug: string | undefined): boolean {
  return isPromotedServiceHubSlug(slug);
}

export function shouldIndexStaticPage(page: StaticSeoPage): boolean {
  return INDEXABLE_STATIC_ROUTES.includes(getStaticPagePath(page));
}

export function isNoindexStaticPage(page: StaticSeoPage): boolean {
  return NOINDEX_STATIC_ROUTES.includes(getStaticPagePath(page));
}

export function getLegacyStaticRedirect(pathname: string): RoutePath | null {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return LEGACY_STATIC_REDIRECTS[normalized as RoutePath] ?? null;
}

export function resolveLegacyCategoryRedirectPath(slug: string | undefined): RoutePath | null {
  const normalizedSlug = normalizeSlug(slug);
  if (SERVICE_CATEGORY_REDIRECTS[normalizedSlug]) {
    return SERVICE_CATEGORY_REDIRECTS[normalizedSlug];
  }
  if (EDITORIAL_CATEGORY_REDIRECTS[normalizedSlug]) {
    return EDITORIAL_CATEGORY_REDIRECTS[normalizedSlug];
  }
  return null;
}
