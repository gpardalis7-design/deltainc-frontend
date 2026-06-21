import { Link, Navigate, useLocation, useParams } from "react-router";
import { SeoHead } from "../components/SeoHead";
import { D } from "../Root";
import { getEditorialCategoryArchive } from "../lib/editorialCategoryArchives";
import { notFoundSeo } from "../lib/seo";
import { resolveServiceCategoryRedirectPath } from "../lib/sitePolicy";
import { Blog } from "./Blog";

export function CategoryArchive() {
  const location = useLocation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const archive = getEditorialCategoryArchive(categorySlug);

  if (archive) {
    return <Blog archive={archive} />;
  }

  const serviceTarget = resolveServiceCategoryRedirectPath(categorySlug);
  if (serviceTarget) {
    return <Navigate to={serviceTarget} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: D.bg }}>
      <SeoHead seo={notFoundSeo(location.pathname)} />
      <h1 className="type-display-section" style={{ color: D.ink }}>Η κατηγορία δεν βρέθηκε</h1>
      <p style={{ color: D.inkSoft }}>Η κατηγορία που αναζητάτε δεν είναι διαθέσιμη.</p>
      <Link to="/blog" className="text-sm font-semibold" style={{ color: D.accentStrong }}>
        Επιστροφή στο Blog
      </Link>
    </div>
  );
}
