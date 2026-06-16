import { useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router";
import { D } from "../Root";
import {
  findExactLegacyRedirect,
  findLegacyProgramRedirect,
  hasLegacyProgramSlug,
} from "../lib/legacyRedirectManifest";
import {
  getLegacyStaticRedirect,
  resolveLegacyCategoryRedirectPath,
} from "../lib/sitePolicy";

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function RedirectFallback({ message, href }: { message: string; href: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: D.bg }}>
      <p style={{ color: D.inkSoft }}>{message}</p>
      <a href={href} style={{ color: D.accent, fontWeight: 600 }}>
        Συνεχίστε
      </a>
    </div>
  );
}

export function LegacyExactRedirectPage() {
  const location = useLocation();
  const pathname = normalizePath(location.pathname);
  const target = useMemo(
    () => findExactLegacyRedirect(pathname) ?? getLegacyStaticRedirect(pathname),
    [pathname],
  );

  if (!target) {
    return <RedirectFallback message="Η παλιά διαδρομή δεν αντιστοιχίστηκε αυτόματα." href="/" />;
  }

  return <Navigate to={target} replace />;
}

export function LegacyCategoryRedirectPage() {
  const { legacyCategorySlug } = useParams<{ legacyCategorySlug: string }>();
  const target = resolveLegacyCategoryRedirectPath(legacyCategorySlug) ?? "/blog";
  return <Navigate to={target} replace />;
}

export function LegacyBlogHubRedirectPage() {
  return <Navigate to="/blog" replace />;
}

export function LegacyProgramRedirectPage() {
  const location = useLocation();
  const { legacyProgramSlug } = useParams<{ legacyProgramSlug: string }>();
  const normalizedPath = normalizePath(location.pathname);
  const exactTarget = findLegacyProgramRedirect(normalizedPath);

  if (exactTarget) {
    return <Navigate to={exactTarget} replace />;
  }

  if (hasLegacyProgramSlug(legacyProgramSlug)) {
    return <Navigate to={`/courses/${legacyProgramSlug}`} replace />;
  }

  return <Navigate to="/courses" replace />;
}
