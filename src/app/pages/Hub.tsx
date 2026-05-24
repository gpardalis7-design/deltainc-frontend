import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { motion, useInView } from "motion/react";
import {
  ChevronRight, ArrowRight, Calendar,
  BookOpen, CheckCircle2, HelpCircle,
  Search, SlidersHorizontal, X,
} from "lucide-react";
import { getFeaturedPost, getPosts } from "../lib/deltaApi";
import { trackContextualEvent, trackCtaClick, trackEvent } from "../lib/analytics";
import { useCategories } from "../lib/categoriesContext";
import type { BlogPost } from "../lib/types";
import { SeoHead } from "../components/SeoHead";
import { hubSeo } from "../lib/seo";
import { D, sectionSurfaces } from "../Root";
import { usePageNavigation } from "../lib/usePageNavigation";
import { useNavigation, type FormType } from "../lib/navigationContext";
import { GUIDED_HUB_DATA } from "../lib/hubs/guidedHubConfig";
import { resolveHubVariant } from "../lib/hubs/hubVariant";
import { getArticleCardImage } from "../components/articles/articleImage";

const HUB_INITIAL_GRID_POSTS = 9;
const HUB_LOAD_MORE_PER_PAGE = 9;
const EDITORIAL_HUB_DEFAULTS = {
  featuredEyebrow: "Προτεινόμενο άρθρο",
  cta: {
    text: "Επικοινωνήστε Μαζί Μας",
    link: "/contact#contact-form",
    formType: undefined,
  } as { text: string; link?: string; formType?: FormType },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "short", year: "numeric" });
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: BlogPost }) {
  const image = getArticleCardImage(post.featuredImage, "card");
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}
      onClick={() =>
        trackEvent("article_card_click", {
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "hub_post_card",
        })
      }
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      {post.featuredImage && image && (
        <div className="overflow-hidden" style={{ height: "176px" }}>
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="type-display-card mb-2 line-clamp-3 flex-1" style={{ fontSize: "0.875rem", letterSpacing: "-0.01em", color: D.ink, lineHeight: 1.45 }}>
          {post.title}
        </h3>
        <p className="text-xs mb-4 line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.6 }}>{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: `1px solid ${D.border}`, color: "rgba(19,35,58,0.4)" }}>
          <div className="flex items-center gap-1"><Calendar size={11} /> {formatDate(post.publishedAt)}</div>
          <span className="flex items-center gap-1" style={{ color: D.accent, fontWeight: 600 }}>Διαβάστε <ArrowRight size={11} /></span>
        </div>
      </div>
    </Link>
  );
}

// ─── Featured post ────────────────────────────────────────────────────────────

function FeaturedPost({ post }: { post: BlogPost }) {
  const image = getArticleCardImage(post.featuredImage, "featured");
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group rounded-3xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:-translate-y-0.5"
      style={{ border: `1px solid ${D.border}`, background: D.surfaceStrong, boxShadow: `0 4px 24px ${D.shadow}` }}
      onClick={() =>
        trackEvent("featured_article_click", {
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          article_slug: post.slug,
          article_title: post.title,
          article_source_section: "hub_featured_post",
        })
      }
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      {post.featuredImage && image && (
        <div className="overflow-hidden md:w-2/5 shrink-0" style={{ height: "clamp(200px,28vw,280px)" }}>
          <img src={image.src} alt={post.featuredImage.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="p-7 flex flex-col justify-between flex-1">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs mb-3" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 600 }}>✦ Προτεινόμενο</span>
          <h2 className="type-display-section mb-3" style={{ fontSize: "clamp(1.05rem, 2vw, 1.35rem)", color: D.ink, lineHeight: 1.3 }}>
            {post.title}
          </h2>
          <p className="text-sm line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.7 }}>{post.excerpt}</p>
        </div>
        <div className="flex items-center gap-4 mt-5 text-xs" style={{ color: "rgba(19,35,58,0.4)" }}>
          <div className="flex items-center gap-1"><Calendar size={11} /> {formatDate(post.publishedAt)}</div>
          <span className="ml-auto flex items-center gap-1 text-sm" style={{ color: D.accent, fontWeight: 700 }}>Διαβάστε <ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
}

type HubCTA = {
  label: string;
  onClick: () => void;
  isModal: boolean;
  href?: string;
};

type HubViewProps = {
  displayName: string;
  displayH1: string;
  displayIntro: string;
  heroSectionRef: React.RefObject<HTMLElement | null>;
  displayUrgentInfo?: {
    eyebrow?: string;
    title: string;
    body: string;
    meta?: string[];
    ctaLabel?: string;
  };
  displayKeyTopics: {
    label: string;
    desc: string;
    actionLabel: string;
    target: {
      search?: string;
      sort?: string;
    };
    icon: React.ReactNode;
  }[];
  displayFaq: { q: string; a: string }[];
  activeFiltersCount: number;
  activeSort: string;
  activeTag: string;
  clearFilters: () => void;
  featuredEyebrow: string;
  featured?: BlogPost;
  featuredLoading: boolean;
  handleLoadMore: () => void;
  handleSearch: (e: React.FormEvent) => void;
  hasMore: boolean;
  hubSlug?: string;
  loading: boolean;
  loadingMore: boolean;
  posts: BlogPost[];
  primaryCTA: HubCTA;
  relatedLiveHubs: Array<{ id: string | number; slug: string; name: string; description?: string; count?: number }>;
  rest: BlogPost[];
  search: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  setShowFilters: (value: boolean) => void;
  showFilters: boolean;
  startHereRef: React.RefObject<HTMLDivElement | null>;
  topicSectionRef: React.RefObject<HTMLDivElement | null>;
  total: number;
  updateParams: (updates: Record<string, string | number | undefined>) => void;
  applyTopicFilter: (label: string, target: { search?: string; sort?: string }) => void;
  scrollToTopicSection: () => void;
};

function GuidedHubView({
  displayName,
  displayH1,
  displayIntro,
  heroSectionRef,
  displayUrgentInfo,
  displayKeyTopics,
  displayFaq,
  activeFiltersCount,
  activeSort,
  activeTag,
  clearFilters,
  featuredEyebrow,
  featured,
  featuredLoading,
  handleLoadMore,
  handleSearch,
  hasMore,
  loading,
  loadingMore,
  posts,
  primaryCTA,
  relatedLiveHubs,
  rest,
  search,
  searchInput,
  setSearchInput,
  setShowFilters,
  showFilters,
  startHereRef,
  topicSectionRef,
  total,
  updateParams,
  applyTopicFilter,
  scrollToTopicSection,
}: HubViewProps) {
  return (
    <div style={{ background: D.bg }}>
      <section
        ref={heroSectionRef}
        className="pt-24 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${D.ink} 0%, ${D.heroMid} 58%, ${D.heroTo} 100%)` }}
      >
        <div className="absolute left-[-160px] top-16 h-[360px] w-[360px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(29,78,216,0.18)" }} />
        <div className="absolute right-[-140px] top-20 h-[420px] w-[420px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,255,255,0.055)" }} />
        <div className="absolute -bottom-12 left-0 right-0 h-32 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, rgba(247,250,252,0.58) 48%, ${D.bg} 100%)` }} />
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link to="/" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>Αρχική</Link>
            <ChevronRight size={12} />
            <span style={{ color: D.accent }}>{displayName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs" style={{ background: D.accentSoft, color: D.accent, border: "1px solid rgba(255,255,255,0.16)", fontWeight: 700 }}>
                  {displayName}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Οδηγός εκκίνησης</span>
                {total > 0 ? (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{total} άρθρα</span>
                ) : null}
              </div>

              <h1 className="type-display-hero mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.1, color: "#fff" }}>
                {displayH1}
              </h1>
              <p className="max-w-2xl mb-6" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.7 }}>
                {displayIntro}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const currentHub = typeof window !== "undefined" ? window.location.pathname.replace("/", "") : undefined;
                    trackCtaClick(primaryCTA.label, "hub_primary", {
                      hub: currentHub,
                      cta_target: primaryCTA.href || (primaryCTA.isModal ? "modal" : "custom_action"),
                    });
                    primaryCTA.onClick();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-90"
                  style={{ background: D.accent, color: "#fff", fontWeight: 700 }}
                >
                  {primaryCTA.label} <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentHub = typeof window !== "undefined" ? window.location.pathname.replace("/", "") : undefined;
                    trackCtaClick("Δείτε τα επόμενα βήματα", "hub_secondary", {
                      hub: currentHub,
                      cta_target: "topic_section",
                    });
                    scrollToTopicSection();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Δείτε τα επόμενα βήματα <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {displayUrgentInfo ? (
              <aside
                className="rounded-3xl p-5 md:p-6"
                style={{
                  background: "rgba(255,255,255,0.075)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  boxShadow: "0 16px 40px rgba(2,6,23,0.16)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: D.accent }} />
                  <div className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.42)", letterSpacing: "0.13em", fontWeight: 700 }}>
                    {displayUrgentInfo.eyebrow || "Τι ισχύει τώρα"}
                  </div>
                </div>
                <h2 className="type-display-card mb-2" style={{ fontSize: "1rem", lineHeight: 1.35, color: "#fff" }}>
                  {displayUrgentInfo.title}
                </h2>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>
                  {displayUrgentInfo.body}
                </p>
                {displayUrgentInfo.meta?.length ? (
                  <div className="flex flex-col gap-1.5">
                    {displayUrgentInfo.meta.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs md:text-sm" style={{ color: "rgba(255,255,255,0.74)", lineHeight: 1.55 }}>
                        <CheckCircle2 size={14} style={{ color: D.accent, flexShrink: 0, marginTop: 2 }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </aside>
            ) : null}
          </div>

        </div>
      </section>

      <section className="px-6 py-6" style={sectionSurfaces.hubControls}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-md" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
              <Search size={14} style={{ color: "rgba(19,35,58,0.35)" }} />
              <input
                type="text"
                placeholder={`Αναζήτηση σε ${displayName}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/30"
                style={{ color: D.ink }}
              />
            </form>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={showFilters || activeFiltersCount > 0 ? { background: D.accentSoft, border: `1px solid rgba(197,141,42,0.35)`, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
            >
              <SlidersHorizontal size={15} />
              {activeFiltersCount > 0 && <span className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ background: D.accentStrong }}>{activeFiltersCount}</span>}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="type-ui-label text-sm" style={{ color: D.ink }}>Ταξινόμηση</h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs transition-colors" style={{ color: D.inkSoft }}>
                      <X size={12} /> Καθαρισμός
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateParams({ sort: undefined })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={!activeSort ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    <Calendar size={11} className="inline mr-1" />
                    Πιο Πρόσφατα
                  </button>
                  <button
                    onClick={() => updateParams({ sort: activeSort === "oldest" ? undefined : "oldest" })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={activeSort === "oldest" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    <Calendar size={11} className="inline mr-1" />
                    Παλαιότερα
                  </button>
                  <button
                    onClick={() => updateParams({ sort: activeSort === "title" ? undefined : "title" })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={activeSort === "title" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    Αλφαβητικά
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-4 pt-4" style={{ borderTop: `1px solid ${D.border}` }}>
              <span className="text-xs" style={{ color: D.inkSoft }}>Ενεργά:</span>
              {search && (
                <button
                  onClick={() => { updateParams({ search: undefined }); setSearchInput(""); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  <Search size={10} /> "{search}" <X size={12} />
                </button>
              )}
              {activeSort && (
                <button
                  onClick={() => updateParams({ sort: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  {activeSort === "oldest" ? "Παλαιότερα" : activeSort === "title" ? "Αλφαβητικά" : activeSort} <X size={12} />
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => updateParams({ tag: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  Επιλεγμένα <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {displayKeyTopics.length > 0 && (
        <section id="hub-topics" className="px-6 py-14" style={sectionSurfaces.hubTopics}>
          <div className="max-w-7xl mx-auto">
            <div ref={topicSectionRef} />
            <Fade>
              <div className="mb-8">
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Επόμενα βήματα</div>
                <h2 className="type-display-section" style={{ fontSize: "1.4rem", color: D.ink }}>
                  Ξεκινήστε από το σωστό θέμα
                </h2>
              </div>
            </Fade>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayKeyTopics.map((t) => (
                <Fade key={t.label}>
                  <button
                    type="button"
                    onClick={() => applyTopicFilter(t.label, t.target)}
                    className="group p-5 rounded-2xl h-full w-full text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${D.accent}55`)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: D.accentSoft, color: D.accentStrong }}>
                      {t.icon}
                    </div>
                    <div className="type-display-card text-sm mb-1" style={{ color: D.ink }}>{t.label}</div>
                    <p className="text-xs mb-4" style={{ color: D.inkSoft, lineHeight: 1.6 }}>{t.desc}</p>
                    <div className="text-xs flex items-center gap-1.5" style={{ color: D.accentStrong, fontWeight: 700 }}>
                      {t.actionLabel}
                      <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </button>
                </Fade>
              ))}
            </div>
          </div>
        </section>
      )}

      <HubArticlesSection
        displayName={displayName}
        featured={featured}
        featuredLoading={featuredLoading}
        handleLoadMore={handleLoadMore}
        hasMore={hasMore}
        isFiltered={activeFiltersCount > 0}
        loading={loading}
        loadingMore={loadingMore}
        posts={posts}
        rest={rest}
        searchQuery={search}
        startHereRef={startHereRef}
        total={total}
        featuredEyebrow={featuredEyebrow}
      />

      {displayFaq.length > 0 && (
        <section className="px-6 py-14" style={sectionSurfaces.hubFaq}>
          <div className="max-w-3xl mx-auto">
            <Fade>
              <h2 className="type-display-section mb-8" style={{ fontSize: "1.4rem", color: D.ink }}>
                Συχνές Ερωτήσεις
              </h2>
            </Fade>
            <div className="space-y-3">
              {displayFaq.map((f, i) => (
                <Fade key={i} delay={i * 0.05}>
                  <div className="rounded-2xl p-6" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle size={16} style={{ color: D.accent, flexShrink: 0, marginTop: 2 }} />
                      <p className="type-display-card text-sm" style={{ color: D.ink, lineHeight: 1.45 }}>{f.q}</p>
                    </div>
                    <p className="text-sm pl-7" style={{ color: D.inkSoft, lineHeight: 1.75 }}>{f.a}</p>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>
      )}

      <HubRelatedSection
        displayName={displayName}
        primaryCTA={primaryCTA}
        relatedLiveHubs={relatedLiveHubs}
      />
    </div>
  );
}

function EditorialHubView({
  displayName,
  displayH1,
  displayIntro,
  heroSectionRef,
  activeFiltersCount,
  activeSort,
  activeTag,
  clearFilters,
  handleLoadMore,
  handleSearch,
  hasMore,
  loading,
  loadingMore,
  posts,
  primaryCTA,
  relatedLiveHubs,
  rest,
  search,
  searchInput,
  setSearchInput,
  setShowFilters,
  showFilters,
  startHereRef,
  total,
  updateParams,
}: HubViewProps) {
  return (
    <div style={{ background: D.bg }}>
      <section
        ref={heroSectionRef}
        className="pt-24 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${D.ink} 0%, ${D.heroMid} 58%, ${D.heroTo} 100%)` }}
      >
        <div className="absolute left-[-160px] top-16 h-[360px] w-[360px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(29,78,216,0.18)" }} />
        <div className="absolute right-[-140px] top-20 h-[420px] w-[420px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,255,255,0.055)" }} />
        <div className="absolute -bottom-12 left-0 right-0 h-32 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, rgba(247,250,252,0.58) 48%, ${D.bg} 100%)` }} />
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link to="/" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>Αρχική</Link>
            <ChevronRight size={12} />
            <Link to="/blog" className="hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>Blog</Link>
            <ChevronRight size={12} />
            <span style={{ color: D.accent }}>{displayName}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: D.accentSoft, color: D.accent, border: "1px solid rgba(255,255,255,0.16)", fontWeight: 700 }}>
                Κατηγορία
              </span>
              {total > 0 ? (
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{total} άρθρα</span>
              ) : null}
            </div>

            <h1 className="type-display-hero mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.1, color: "#fff" }}>
              {displayH1}
            </h1>
            <p className="max-w-2xl mb-6" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.7 }}>
              {displayIntro}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => startHereRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-90"
                style={{ background: D.accent, color: D.ink, fontWeight: 700 }}
              >
                Δείτε τα άρθρα <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={primaryCTA.onClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {primaryCTA.label} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-6" style={sectionSurfaces.hubControls}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-md" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
              <Search size={14} style={{ color: "rgba(19,35,58,0.35)" }} />
              <input
                type="text"
                placeholder={`Αναζήτηση σε ${displayName}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/30"
                style={{ color: D.ink }}
              />
            </form>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={showFilters || activeFiltersCount > 0 ? { background: D.accentSoft, border: `1px solid rgba(197,141,42,0.35)`, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
            >
              <SlidersHorizontal size={15} />
              {activeFiltersCount > 0 && <span className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ background: D.accentStrong }}>{activeFiltersCount}</span>}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="type-ui-label text-sm" style={{ color: D.ink }}>Ταξινόμηση</h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs transition-colors" style={{ color: D.inkSoft }}>
                      <X size={12} /> Καθαρισμός
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateParams({ sort: undefined })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={!activeSort ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    <Calendar size={11} className="inline mr-1" />
                    Πιο Πρόσφατα
                  </button>
                  <button
                    onClick={() => updateParams({ sort: activeSort === "oldest" ? undefined : "oldest" })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={activeSort === "oldest" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    <Calendar size={11} className="inline mr-1" />
                    Παλαιότερα
                  </button>
                  <button
                    onClick={() => updateParams({ sort: activeSort === "title" ? undefined : "title" })}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={activeSort === "title" ? { background: D.accentSoft, color: D.accentStrong, fontWeight: 600 } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft }}
                  >
                    Αλφαβητικά
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-4 pt-4" style={{ borderTop: `1px solid ${D.border}` }}>
              <span className="text-xs" style={{ color: D.inkSoft }}>Ενεργά:</span>
              {search && (
                <button
                  onClick={() => { updateParams({ search: undefined }); setSearchInput(""); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  <Search size={10} /> "{search}" <X size={12} />
                </button>
              )}
              {activeSort && (
                <button
                  onClick={() => updateParams({ sort: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  {activeSort === "oldest" ? "Παλαιότερα" : activeSort === "title" ? "Αλφαβητικά" : activeSort} <X size={12} />
                </button>
              )}
              {activeTag && (
                <button
                  onClick={() => updateParams({ tag: undefined })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid rgba(197,141,42,0.25)` }}
                >
                  Επιλεγμένα <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <HubArticlesSection
        displayName={displayName}
        featured={undefined}
        featuredLoading={false}
        handleLoadMore={handleLoadMore}
        hasMore={hasMore}
        isFiltered={activeFiltersCount > 0}
        loading={loading}
        loadingMore={loadingMore}
        posts={posts}
        rest={rest}
        searchQuery={search}
        startHereRef={startHereRef}
        total={total}
        emptyTitle={`Δεν υπάρχουν άρθρα ακόμα στην κατηγορία ${displayName}.`}
        emptyDescription="Η κατηγορία είναι διαθέσιμη αλλά δεν έχει αρκετό δημοσιευμένο περιεχόμενο ακόμη. Μπορείτε να συνεχίσετε στο γενικό blog ή να επικοινωνήσετε με την ομάδα Delta."
        emptyActionLabel="Δείτε όλο το Blog"
        emptyActionHref="/blog"
      />

      {(relatedLiveHubs.length > 0 || primaryCTA.href) && (
        <HubRelatedSection
          displayName={displayName}
          primaryCTA={primaryCTA}
          relatedLiveHubs={relatedLiveHubs}
        />
      )}
    </div>
  );
}

function HubArticlesSection({
  displayName,
  featured,
  featuredLoading,
  handleLoadMore,
  hasMore,
  isFiltered = false,
  loading,
  loadingMore,
  posts,
  rest,
  searchQuery,
  startHereRef,
  total,
  featuredEyebrow = "Ξεκινήστε από εδώ",
  emptyTitle = "Δεν υπάρχουν άρθρα ακόμα.",
  emptyDescription = "Δοκιμάστε ξανά σύντομα ή επιστρέψτε στο blog για περισσότερες κατηγορίες.",
  emptyActionLabel = "Δείτε όλο το Blog",
  emptyActionHref = "/blog",
}: {
  displayName: string;
  featured?: BlogPost;
  featuredLoading: boolean;
  handleLoadMore: () => void;
  hasMore: boolean;
  isFiltered?: boolean;
  loading: boolean;
  loadingMore: boolean;
  posts: BlogPost[];
  rest: BlogPost[];
  searchQuery?: string;
  startHereRef: React.RefObject<HTMLDivElement | null>;
  total: number;
  featuredEyebrow?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
}) {
  const visiblePosts = isFiltered ? posts : rest;
  const displayedCount = isFiltered ? visiblePosts.length : visiblePosts.length + (featured ? 1 : 0);
  const sectionEyebrow = isFiltered
    ? searchQuery
      ? `Αποτελέσματα για “${searchQuery}”`
      : "Φιλτραρισμένα αποτελέσματα"
    : "Περισσότερο περιεχόμενο";
  const sectionTitle = isFiltered ? `Αποτελέσματα στο ${displayName}` : `Όλα τα Άρθρα ${displayName}`;

  return (
    <section className="px-6 py-16" style={sectionSurfaces.hubArticles}>
      <div className="max-w-7xl mx-auto">
        <div
          ref={startHereRef}
          aria-hidden="true"
          style={{ scrollMarginTop: "8rem" }}
        />
        {featuredLoading && !loading && !isFiltered && (
          <Fade>
            <div className="mb-10">
              <div className="type-eyebrow mb-4" style={{ color: D.inkSoft }}>{featuredEyebrow}</div>
              <div
                className="rounded-3xl overflow-hidden"
                style={{ border: `1px solid ${D.border}`, background: D.surfaceStrong, boxShadow: `0 4px 24px ${D.shadow}` }}
              >
                <div className="animate-pulse grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div style={{ height: "clamp(200px,28vw,280px)", background: "rgba(19,35,58,0.08)" }} />
                  <div className="p-7">
                    <div className="h-6 w-28 rounded-full mb-4" style={{ background: "rgba(19,35,58,0.08)" }} />
                    <div className="h-7 w-4/5 rounded mb-3" style={{ background: "rgba(19,35,58,0.08)" }} />
                    <div className="h-7 w-3/5 rounded mb-4" style={{ background: "rgba(19,35,58,0.06)" }} />
                    <div className="h-4 w-full rounded mb-2" style={{ background: "rgba(19,35,58,0.05)" }} />
                    <div className="h-4 w-5/6 rounded mb-6" style={{ background: "rgba(19,35,58,0.05)" }} />
                    <div className="h-4 w-32 rounded" style={{ background: "rgba(19,35,58,0.05)" }} />
                  </div>
                </div>
              </div>
            </div>
          </Fade>
        )}

        {featured && !featuredLoading && !loading && !isFiltered && (
          <Fade>
            <div className="mb-10">
              <div className="type-eyebrow mb-4" style={{ color: D.inkSoft }}>{featuredEyebrow}</div>
              <FeaturedPost post={featured} />
            </div>
          </Fade>
        )}

        <Fade delay={0.05}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>{sectionEyebrow}</div>
              <h2 className="type-display-section" style={{ fontSize: "1.3rem", color: D.ink }}>
                {sectionTitle}
              </h2>
            </div>
            {total > 0 && !loading && (
              <span className="text-sm" style={{ color: D.inkSoft }}>{total.toLocaleString("el-GR")} άρθρα</span>
            )}
          </div>
        </Fade>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "rgba(19,35,58,0.07)" }} />
            ))}
          </div>
        ) : visiblePosts.length > 0 ? (
          <>
            <div id="hub-articles" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visiblePosts.map((p, i) => (
                <Fade key={p.id} delay={i * 0.055}>
                  <PostCard post={p} />
                </Fade>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex flex-col items-center gap-3">
                {loadingMore ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "rgba(19,35,58,0.07)" }} />
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-xs md:text-sm text-center mb-1" style={{ color: D.inkSoft }}>
                      Βλέπετε {displayedCount.toLocaleString("el-GR")} από {total.toLocaleString("el-GR")} άρθρα
                    </p>
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="group px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center gap-2"
                      style={{ background: D.surfaceStrong, color: D.accentStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 10px rgba(15,23,42,0.05)` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = D.accentSoft;
                        e.currentTarget.style.borderColor = "rgba(47, 91, 171, 0.28)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = D.surfaceStrong;
                        e.currentTarget.style.borderColor = D.border;
                      }}
                    >
                      Φόρτωσε περισσότερα άρθρα <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          (!featured || isFiltered) && (
            <div className="flex flex-col items-center py-16 gap-3" style={{ color: D.inkSoft }}>
              <BookOpen size={32} style={{ opacity: 0.35 }} />
              <p className="type-display-card text-sm" style={{ color: D.ink }}>{emptyTitle}</p>
              <p className="text-sm text-center max-w-md" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                {emptyDescription}
              </p>
              <Link
                to={emptyActionHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}
              >
                {emptyActionLabel} <ArrowRight size={13} />
              </Link>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function HubRelatedSection({
  displayName,
  primaryCTA,
  relatedLiveHubs,
}: {
  displayName: string;
  primaryCTA: HubCTA;
  relatedLiveHubs: Array<{ id: string | number; slug: string; name: string; description?: string; count?: number }>;
}) {
  return (
    <section className="px-6 py-16" style={sectionSurfaces.hubRelated}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <Fade>
              <div className="mb-6">
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Άλλες ενότητες</div>
                <h2 className="type-display-section" style={{ fontSize: "1.15rem", color: D.ink }}>
                  Δείτε και τις υπόλοιπες κατηγορίες
                </h2>
              </div>
            </Fade>
            <div className="rounded-2xl overflow-hidden" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
              {relatedLiveHubs.map((rh) => (
                <Fade key={rh.slug}>
                  <Link
                    to={`/${rh.slug}`}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors"
                    style={{ borderBottom: `1px solid ${D.border}` }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(47, 91, 171, 0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <div className="min-w-0">
                      <div className="type-display-card text-sm" style={{ color: D.ink }}>{rh.name}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs" style={{ color: D.inkSoft }}>
                        {rh.count ? `${rh.count} άρθρα` : "Δείτε άρθρα"}
                      </span>
                      <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: D.accentStrong }} />
                    </div>
                  </Link>
                </Fade>
              ))}
              <Fade>
                <Link
                  to="/blog"
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(47, 91, 171, 0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div className="type-display-card text-sm" style={{ color: D.ink }}>Όλο το Blog</div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs" style={{ color: D.inkSoft }}>Όλες οι κατηγορίες</span>
                    <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: D.accentStrong }} />
                  </div>
                </Link>
              </Fade>
            </div>
          </div>

          <Fade delay={0.1}>
            <div className="rounded-2xl p-6 flex flex-col justify-between h-full" style={{ background: D.ink, minHeight: "220px" }}>
              <div>
                <div className="type-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Χρειάζεστε Βοήθεια;</div>
                <h3 className="type-display-section mb-2" style={{ fontSize: "1rem", color: "#fff", lineHeight: 1.3 }}>
                  Ερωτήσεις για {displayName};
                </h3>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                  Η ομάδα Delta σας δείχνει τι να κάνετε τώρα, χωρίς γενικές απαντήσεις και χωρίς κόστος.
                </p>
              </div>
              <button
                type="button"
                onClick={primaryCTA.onClick}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs transition-all hover:opacity-90"
                style={{ background: D.accent, color: D.ink, fontWeight: 700 }}
              >
                {primaryCTA.label} <ArrowRight size={12} />
              </button>
            </div>
          </Fade>
        </div>
      </div>
    </section>
  );
}

function hasUsefulDescription(description: string | undefined): description is string {
  return Boolean(description && description.trim().length >= 24);
}

function buildEditorialIntro(name: string, description: string | undefined): string {
  if (hasUsefulDescription(description)) {
    return description.trim();
  }

  return `Βρείτε συγκεντρωμένα τα σημαντικότερα άρθρα, αναλύσεις και πρόσφατες εξελίξεις γύρω από ${name}, με καθαρή editorial ροή και εύκολη περιήγηση στο σχετικό περιεχόμενο.`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Hub() {
  const navigate = useNavigate();
  const { hubSlug } = useParams<{ hubSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal, setShowStickyBottom } = useNavigation();
  const search = searchParams.get("search") || "";
  const activeSort = searchParams.get("sort") || "";
  const activeTag = searchParams.get("tag") || "";
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredOverride, setFeaturedOverride] = useState<BlogPost | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceOffset, setSourceOffset] = useState(0);
  const [, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const startHereRef = useRef<HTMLDivElement | null>(null);
  const topicSectionRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const pendingTopicScrollRef = useRef(false);

  // Live categories from context — contains real WP names, slugs, wpCategoryId
  const { hubs, loading: catsLoading } = useCategories();

  const hub = hubSlug ? GUIDED_HUB_DATA[hubSlug] : null;
  const hubVariant = resolveHubVariant(hubSlug);
  // Find the live WP category — gives us the real wpCategoryId
  const liveHub = hubs.find((h) => h.slug === hubSlug);

  const hubDisplayConfig = hub
    ? {
        cta: hub.cta,
        featuredEyebrow: hub.featuredEyebrow,
      }
    : EDITORIAL_HUB_DEFAULTS;

  const ctaConfig = hubDisplayConfig.cta;

  // Configure navigation for this Hub page
  usePageNavigation({
    mode: "service",
    cta: { 
      text: ctaConfig.text, 
      link: ctaConfig.link || "/contact#contact-form", 
      formType: ctaConfig.formType 
    },
    showStickyBottom: true,
  });

  // Reset when hub slug changes
  const prevSlugRef = useRef(hubSlug);
  useEffect(() => {
    if (prevSlugRef.current !== hubSlug) {
      prevSlugRef.current = hubSlug;
      setSearchParams({}, { replace: true });
      setSearchInput("");
      setPosts([]);
      setFeaturedOverride(null);
      setFeaturedLoading(false);
      setCurrentPage(1);
      setSourceOffset(0);
    }
  }, [hubSlug, setSearchParams]);

  useEffect(() => {
    if (!hubSlug) return;
  }, [hubSlug]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const syncMobileStickyVisibility = () => {
      if (typeof window === "undefined") return;

      if (window.innerWidth >= 1024) {
        setShowStickyBottom(true);
        return;
      }

      const heroBottom = heroSectionRef.current?.getBoundingClientRect().bottom;
      if (typeof heroBottom !== "number") {
        setShowStickyBottom(true);
        return;
      }

      const navbarClearance = 104;
      setShowStickyBottom(heroBottom <= navbarClearance);
    };

    syncMobileStickyVisibility();
    window.addEventListener("scroll", syncMobileStickyVisibility, { passive: true });
    window.addEventListener("resize", syncMobileStickyVisibility);

    return () => {
      window.removeEventListener("scroll", syncMobileStickyVisibility);
      window.removeEventListener("resize", syncMobileStickyVisibility);
    };
  }, [hubSlug, setShowStickyBottom]);

  // Track filters and reset when they change
  const prevFiltersRef = useRef({ search, sort: activeSort, tag: activeTag });

  const fetchNonFeaturedBatch = async ({
    startOffset,
    desiredCount,
    featuredId,
    searchValue,
    tagValue,
    sortValue,
  }: {
    startOffset: number;
    desiredCount: number;
    featuredId?: number;
    searchValue?: string;
    tagValue?: string;
    sortValue?: string;
  }) => {
    const primaryResult = await getPosts({
      hub: hubSlug,
      wpCategoryId: liveHub?.wpCategoryId,
      perPage: desiredCount,
      offset: startOffset,
      search: searchValue || undefined,
      tag: tagValue || undefined,
      sort: sortValue || undefined,
    });

    const filteredPrimary = featuredId
      ? primaryResult.data.filter((post) => post.id !== featuredId)
      : primaryResult.data;

    let nextOffset = startOffset + primaryResult.data.length;
    let data = filteredPrimary;

    if (featuredId && filteredPrimary.length < desiredCount && primaryResult.data.length === desiredCount) {
      const missingCount = desiredCount - filteredPrimary.length;
      const topUpResult = await getPosts({
        hub: hubSlug,
        wpCategoryId: liveHub?.wpCategoryId,
        perPage: missingCount,
        offset: nextOffset,
        search: searchValue || undefined,
        tag: tagValue || undefined,
        sort: sortValue || undefined,
      });

      const filteredTopUp = topUpResult.data.filter((post) => post.id !== featuredId);
      data = [...filteredPrimary, ...filteredTopUp];
      nextOffset += topUpResult.data.length;
    }

    return {
      data: data.slice(0, desiredCount),
      nextOffset,
      meta: primaryResult.meta,
    };
  };

  const resolveFeaturedPost = async () => {
    const featuredRes = await getFeaturedPost(hubSlug);
    return featuredRes.data;
  };
  const shouldUseFeatured = hubVariant === "guided";

  // Fetch posts whenever the hub slug, currentPage, filters, or resolved WP category ID changes.
  useEffect(() => {
    if (!hubSlug) return;

    let cancelled = false;
    const filtersChanged = 
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.sort !== activeSort ||
      prevFiltersRef.current.tag !== activeTag;

    const isFilteredRequest = Boolean(search || activeSort || activeTag);
    const shouldSyncFeatured = shouldUseFeatured && !isFilteredRequest && currentPage === 1;

    if (filtersChanged) {
      prevFiltersRef.current = { search, sort: activeSort, tag: activeTag };
      // Reset to page 1 when filters change
      setPosts([]);
      setCurrentPage(1);
      setSourceOffset(0);
      setLoading(true);

      if (shouldSyncFeatured) {
        setFeaturedLoading(true);
        resolveFeaturedPost().then(async (featuredResult) => {
          const gridResult = await fetchNonFeaturedBatch({
            startOffset: 0,
            desiredCount: HUB_INITIAL_GRID_POSTS,
            featuredId: featuredResult?.id,
            searchValue: search,
            tagValue: activeTag,
            sortValue: activeSort,
          });

          if (cancelled) return;
          setPosts(gridResult.data);
          setSourceOffset(gridResult.nextOffset);
          setTotalPages(gridResult.meta.totalPages);
          setTotal(gridResult.meta.total);
          setFeaturedOverride(featuredResult);
          setFeaturedLoading(false);
          setLoading(false);
        }).catch(() => {
          if (cancelled) return;
          setFeaturedOverride(null);
          setPosts([]);
          setFeaturedLoading(false);
          setLoading(false);
        });
      } else {
        setFeaturedOverride(null);
        setFeaturedLoading(false);
        getPosts({
          hub: hubSlug,
          wpCategoryId: liveHub?.wpCategoryId,
          page: 1,
          perPage: HUB_INITIAL_GRID_POSTS,
          search: search || undefined,
          tag: activeTag || undefined,
          sort: activeSort || undefined,
        }).then(({ data, meta }) => {
          if (cancelled) return;
          setPosts(data);
          setSourceOffset(data.length);
          setTotalPages(meta.totalPages);
          setTotal(meta.total);
          setLoading(false);
        });
      }
      return;
    }

    // Normal fetch (initial load or load more)
    const isLoadMore = currentPage > 1;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const requestPerPage = HUB_LOAD_MORE_PER_PAGE;

    if (!isLoadMore && shouldSyncFeatured) {
      setFeaturedLoading(true);
      resolveFeaturedPost().then(async (featuredResult) => {
        const gridResult = await fetchNonFeaturedBatch({
          startOffset: 0,
          desiredCount: HUB_INITIAL_GRID_POSTS,
          featuredId: featuredResult?.id,
          searchValue: search,
          tagValue: activeTag,
          sortValue: activeSort,
        });

        if (cancelled) return;
        setPosts(gridResult.data);
        setSourceOffset(gridResult.nextOffset);
        setTotalPages(gridResult.meta.totalPages);
        setTotal(gridResult.meta.total);
        setFeaturedOverride(featuredResult);
        setFeaturedLoading(false);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setFeaturedOverride(null);
        setFeaturedLoading(false);
        setLoading(false);
      });
      return;
    }

    if (isFilteredRequest) {
      setFeaturedOverride(null);
      setFeaturedLoading(false);
    }

    if (isLoadMore && shouldUseFeatured && featuredOverride) {
      fetchNonFeaturedBatch({
        startOffset: sourceOffset,
        desiredCount: HUB_LOAD_MORE_PER_PAGE,
        featuredId: featuredOverride.id,
        searchValue: search,
        tagValue: activeTag,
        sortValue: activeSort,
      }).then(({ data, meta, nextOffset }) => {
        if (cancelled) return;
        setPosts((prev) => [...prev, ...data]);
        setSourceOffset(nextOffset);
        setTotalPages(meta.totalPages);
        setTotal(meta.total);
        setLoading(false);
        setLoadingMore(false);
      }).catch(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });
    } else {
      getPosts({
        hub: hubSlug,
        wpCategoryId: liveHub?.wpCategoryId,
        page: isLoadMore ? undefined : currentPage,
        perPage: requestPerPage,
        offset: isLoadMore ? posts.length : undefined,
        search: search || undefined,
        tag: activeTag || undefined,
        sort: activeSort || undefined,
      }).then(({ data, meta }) => {
        if (cancelled) return;
        if (isLoadMore) {
          // Append new posts
          setPosts(prev => [...prev, ...data]);
        } else {
          // Replace posts (initial load)
          setPosts(data);
          setSourceOffset(data.length);
        }
        setTotalPages(meta.totalPages);
        setTotal(meta.total);
        setLoading(false);
        setLoadingMore(false);
      }).catch(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });
    }

    return () => {
      cancelled = true;
    };
  // Re-run when wpCategoryId becomes available (context loaded from WP)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubSlug, liveHub?.wpCategoryId, currentPage, search, activeSort, activeTag]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      return params;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSearch = searchInput.trim();
    trackContextualEvent("hub_search_submit", {
      hub: hubSlug,
      search_term: nextSearch || "(empty)",
      active_sort: activeSort || undefined,
      active_tag: activeTag || undefined,
      total_articles: total,
    });
    updateParams({ search: nextSearch });
  };

  const clearFilters = () => {
    updateParams({ search: undefined, sort: undefined, tag: undefined });
    setSearchInput("");
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const activeFiltersCount = [search, activeSort, activeTag].filter(Boolean).length;

  const scrollToStartHere = () => {
    const element = startHereRef.current;
    if (!element) {
      pendingTopicScrollRef.current = false;
      return;
    }

    const headerOffset = 104;
    const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    pendingTopicScrollRef.current = false;
  };

  const scrollToTopicSection = () => {
    const element = topicSectionRef.current;
    if (!element) return;

    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const breathingRoom = 24;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - breathingRoom;

    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const applyTopicFilter = (label: string, target: { search?: string; sort?: string }) => {
    const nextSearch = target.search || "";
    const nextSort = target.sort || "";

    trackContextualEvent("hub_topic_filter_click", {
      hub: hubSlug,
      topic_label: label,
      topic_search: nextSearch || undefined,
      topic_sort: nextSort || undefined,
      total_articles: total,
    });

    if (search === nextSearch && activeSort === nextSort) {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToStartHere);
      });
      return;
    }

    pendingTopicScrollRef.current = true;
    updateParams({
      search: nextSearch || undefined,
      sort: nextSort || undefined,
    });
    setSearchInput(nextSearch);
    setShowFilters(false);
  };

  useEffect(() => {
    if (!pendingTopicScrollRef.current || loading) return;

    // Wait for the updated article layout to paint before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToStartHere);
    });
  }, [loading, posts.length]);

  // Show "not found" only when:
  // - Not a hardcoded hub AND not a known live WP category AND context has finished loading
  if (!hub && !liveHub && !catsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: D.bg }}>
        <p style={{ color: D.inkSoft }}>Η κατηγορία δεν βρέθηκε.</p>
        <Link to="/" style={{ color: D.accent }}>← Αρχική</Link>
      </div>
    );
  }

  // While context is still loading (hub could be valid), show a skeleton
  if (!hub && !liveHub && catsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: D.bg }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${D.accent} transparent` }} />
      </div>
    );
  }

  // Use guided hub config when available; otherwise build a lighter editorial fallback.
  const displayName = hub?.name ?? liveHub?.name ?? hubSlug ?? "";
  const displayH1 = hub?.h1 ?? `${displayName}: Άρθρα, Αναλύσεις & Ενημερώσεις`;
  const displayIntro = hub?.intro ?? buildEditorialIntro(displayName, liveHub?.description);
  const displayUrgentInfo = hub?.urgentInfo;
  const displayKeyTopics = hub?.keyTopics ?? [];
  const displayFaq = hub?.faq ?? [];
  const primaryCTA = {
    label: displayUrgentInfo?.ctaLabel || ctaConfig.text,
    onClick: () => {
      if (ctaConfig.formType) {
        openModal();
        return;
      }
      if (ctaConfig.link) {
        navigate(ctaConfig.link);
      }
    },
    isModal: Boolean(ctaConfig.formType),
    href: ctaConfig.link,
  };

  const seo = hubSeo(hubSlug ?? "");
  const featured = shouldUseFeatured && !featuredLoading ? featuredOverride : undefined;
  const rest = shouldUseFeatured ? posts.filter((p) => p.id !== featured?.id) : posts;
  const isFiltered = Boolean(search || activeSort || activeTag);
  const displayedArticleCount = isFiltered ? posts.length : posts.length + (featured ? 1 : 0);
  const hasMore = displayedArticleCount < total;

  // Related hubs: other live categories excluding current one
  const relatedLiveHubs = hubs
    .filter((h) => h.slug !== hubSlug)
    .map((h) => ({
      id: h.id,
      slug: h.slug,
      name: h.name,
      description: h.description,
      count: h.count,
    }));
  const viewProps: HubViewProps = {
    displayName,
    displayH1,
    displayIntro,
    heroSectionRef,
    displayUrgentInfo,
    displayKeyTopics,
    displayFaq,
    activeFiltersCount,
    activeSort,
    activeTag,
    clearFilters,
    featuredEyebrow: hubDisplayConfig.featuredEyebrow,
    featured,
    featuredLoading,
    handleLoadMore,
    handleSearch,
    hasMore,
    hubSlug,
    loading,
    loadingMore,
    posts,
    primaryCTA,
    relatedLiveHubs,
    rest,
    search,
    searchInput,
    setSearchInput,
    setShowFilters,
    showFilters,
    startHereRef,
    topicSectionRef,
    total,
    updateParams,
    applyTopicFilter,
    scrollToTopicSection,
  };

  return (
    <>
      <SeoHead seo={seo} />
      {hubVariant === "guided" ? (
        <GuidedHubView {...viewProps} />
      ) : (
        <EditorialHubView {...viewProps} />
      )}
    </>
  );
}
