import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight, ArrowRight, Calendar,
  BookOpen, CheckCircle2, HelpCircle,
  Search, SlidersHorizontal, X,
} from "lucide-react";
import { getFeaturedPost, getPosts } from "../lib/deltaApi";
import { findLegacyArticleRedirect } from "../lib/legacyRedirectManifest";
import { trackContextualEvent, trackCtaClick, trackEvent } from "../lib/analytics";
import { useCategories } from "../lib/categoriesContext";
import type { BlogPost } from "../lib/types";
import { SeoHead } from "../components/SeoHead";
import { hubSeo, notFoundSeo } from "../lib/seo";
import { D, sectionSurfaces } from "../Root";
import { usePageNavigation } from "../lib/usePageNavigation";
import { useNavigation, type FormType } from "../lib/navigationContext";
import { GUIDED_HUB_DATA, type GuidedHubInfoPanel } from "../lib/hubs/guidedHubConfig";
import { resolveHubVariant } from "../lib/hubs/hubVariant";
import { getArticleCardImage } from "../components/articles/articleImage";
import { ChecklistHero } from "../components/ChecklistHero";
import { OpsydApplyCta } from "../components/OpsydApplyCta";
import { OrbitConstellation } from "../components/OrbitConstellation";

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
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

function isFaqHeadingLine(line: string) {
  return /^(Οδηγός|Βήμα\s+\d+|Προσοχή|Γιατί είναι σημαντικός|Χρήσιμη Συμβουλή|Χρειάζεστε βοήθεια|Σημαντική Επισήμανση|Σημαντικές Επισημάνσεις|Πότε πρέπει|Συχνά Λάθη|Πώς δημοσιεύονται|Πώς μπορώ|Δεν βρίσκω|Πόσο χρόνο χρειάζεται|\d+\.\s)/i.test(line);
}

function renderFaqAnswer(answer: string) {
  return answer.split("\n").map((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return <div key={`faq-space-${index}`} className="h-2" aria-hidden="true" />;
    }

    const isBullet = line.startsWith("•");
    const isHeading = isFaqHeadingLine(line);

    return (
      <p
        key={`faq-line-${index}`}
        className="text-sm"
        style={{
          color: isHeading ? D.ink : D.inkSoft,
          fontWeight: isHeading ? 750 : 400,
          lineHeight: isHeading ? 1.55 : 1.8,
          marginTop: isHeading && index > 0 ? "0.75rem" : 0,
          paddingLeft: isBullet ? "1rem" : 0,
        }}
      >
        {line}
      </p>
    );
  });
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: BlogPost }) {
  const image = getArticleCardImage(post.featuredImage, "card");
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}`, borderRadius: D.radiusCard }}
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
      style={{ border: `1px solid ${D.border}`, background: D.surfaceStrong, boxShadow: `0 4px 24px ${D.shadow}`, borderRadius: D.radiusShell }}
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
      link?: string;
      panelId?: string;
      search?: string;
      sort?: string;
    };
    icon: React.ReactNode;
  }[];
  displayInfoPanels: Record<string, GuidedHubInfoPanel>;
  displayFaq: { q: string; a: string }[];
  activeInfoPanel?: GuidedHubInfoPanel;
  closeInfoPanel: () => void;
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
  rest: BlogPost[];
  search: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  setShowFilters: (value: boolean) => void;
  showFilters: boolean;
  sourceUnavailable: boolean;
  infoPanelRef: React.RefObject<HTMLDivElement | null>;
  startHereRef: React.RefObject<HTMLDivElement | null>;
  topicSectionRef: React.RefObject<HTMLDivElement | null>;
  total: number;
  updateParams: (updates: Record<string, string | number | undefined>) => void;
  applyTopicFilter: (label: string, target: { link?: string; panelId?: string; search?: string; sort?: string }) => void;
  scrollToTopicSection: () => void;
};

function GuidedHubView({
  displayName,
  displayH1,
  displayIntro,
  heroSectionRef,
  displayUrgentInfo,
  displayKeyTopics,
  displayInfoPanels,
  displayFaq,
  activeInfoPanel,
  closeInfoPanel,
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
  hubSlug,
  loading,
  loadingMore,
  posts,
  primaryCTA,
  rest,
  search,
  searchInput,
  setSearchInput,
  setShowFilters,
  showFilters,
  infoPanelRef,
  startHereRef,
  topicSectionRef,
  total,
  updateParams,
  applyTopicFilter,
  scrollToTopicSection,
}: HubViewProps) {
  const { openModalFor } = useNavigation();
  const showOpsydApplicationCta = hubSlug === "opsyd" && activeInfoPanel?.id === "opsyd-documents-checklist";
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setOpenFaqIndex(null);
  }, [hubSlug]);

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
                  style={{ background: D.accent, color: "#fff", fontWeight: 700, borderRadius: D.radiusControl }}
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
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)", borderRadius: D.radiusControl }}
                >
                  Δείτε τα επόμενα βήματα <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {hubSlug === "asep" ? (
              <ChecklistHero
                eyebrow="Οδηγός ΑΣΕΠ"
                title="Από την προκήρυξη στην αίτηση"
                subtitle="Ακολουθήστε τα βασικά βήματα για να ελέγξετε την προκήρυξη, τα δικαιολογητικά και την τελική υποβολή."
              />
            ) : hubSlug === "opsyd" ? (
              <OpsydApplyCta />
            ) : hubSlug === "metaptyxiaka" ? (
              <OrbitConstellation centerHref="/courses" />
            ) : displayUrgentInfo ? (
              <aside
                className="rounded-3xl p-5 md:p-6"
                style={{
                  background: "rgba(255,255,255,0.075)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  boxShadow: "0 16px 40px rgba(2,6,23,0.16)",
                  backdropFilter: "blur(14px)",
                  borderRadius: D.radiusCard,
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
                    style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}`, borderRadius: D.radiusCard }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = `${D.accent}55`)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: D.accentSoft, color: D.accentStrong, borderRadius: D.radiusControl }}>
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
            {activeInfoPanel && displayInfoPanels[activeInfoPanel.id] ? (
              <div
                ref={infoPanelRef}
                className="mt-6 rounded-2xl p-6 sm:p-7"
                style={{
                  background: D.surfaceStrong,
                  border: `1px solid ${D.border}`,
                  boxShadow: `0 2px 12px ${D.shadow}`,
                  borderRadius: D.radiusCard,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="min-w-0 flex-1">
                    <div className="type-eyebrow mb-2" style={{ color: D.accentStrong }}>
                      Οδηγός Υποβολής
                    </div>
                    <h3 className="type-display-section" style={{ fontSize: "1.2rem", color: D.ink }}>
                      {activeInfoPanel.title}
                    </h3>
                    <p className="text-sm mt-3 max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                      {activeInfoPanel.intro}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeInfoPanel}
                    className="sticky top-3 shrink-0 self-start rounded-xl p-2 transition-colors"
                    style={{ background: D.accentSoft, color: D.accentStrong, border: `1px solid ${D.border}` }}
                    aria-label="Κλείσιμο οδηγιών"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {activeInfoPanel.items.map((item, index) => (
                    <div
                      key={`${activeInfoPanel.id}-${index}`}
                      className="rounded-2xl p-4 sm:p-5"
                      style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ background: D.accentSoft, color: D.accentStrong }}
                        >
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <p className="type-display-card text-sm mb-1.5" style={{ color: D.ink, lineHeight: 1.5 }}>
                            {item.title}
                          </p>
                          <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeInfoPanel.specialAttention ? (
                  <div
                    className="mt-6 rounded-2xl p-5 sm:p-6"
                    style={{
                      background: "rgba(29,78,216,0.04)",
                      border: "1px solid rgba(29,78,216,0.12)",
                      borderRadius: D.radiusInner,
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle size={16} style={{ color: D.accentStrong, flexShrink: 0, marginTop: 2 }} />
                      <h4 className="type-display-card text-sm" style={{ color: D.ink }}>
                        {activeInfoPanel.specialAttention.title}
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {activeInfoPanel.specialAttention.points.map((point, index) => (
                        <p key={`${activeInfoPanel.id}-note-${index}`} className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                          {point}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {showOpsydApplicationCta ? (
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                      Δεν είστε σίγουροι για το επόμενο βήμα;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        trackCtaClick("Θέλω βοήθεια με την αίτηση", "opsyd_info_panel_inline", {
                          hub: "opsyd",
                          cta_target: "modal",
                          preselected_interest: "Αίτηση για τους πίνακες",
                        });
                        openModalFor("opsyd", "Αίτηση για τους πίνακες");
                      }}
                      className="group inline-flex items-center gap-1.5 text-sm transition-colors"
                      style={{
                        background: "transparent",
                        color: D.accentStrong,
                        fontWeight: 700,
                      }}
                    >
                      Θέλω βοήθεια με την αίτηση
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      )}

      <section className="px-6 py-6" style={sectionSurfaces.hubControls}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-md" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusControl }}>
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
              style={showFilters || activeFiltersCount > 0 ? { background: D.accentSoft, border: `1px solid rgba(197,141,42,0.35)`, color: D.accentStrong, fontWeight: 600, borderRadius: D.radiusControl } : { background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, borderRadius: D.radiusControl }}
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
                  <div className="rounded-2xl" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}>
                    <button
                      type="button"
                      aria-expanded={openFaqIndex === i}
                      aria-controls={`hub-faq-answer-${i}`}
                      onClick={() => setOpenFaqIndex((current) => current === i ? null : i)}
                      className="flex w-full items-start justify-between gap-4 p-5 sm:p-6 text-left transition-colors"
                    >
                      <span className="flex items-start gap-3">
                        <HelpCircle size={16} style={{ color: D.accent, flexShrink: 0, marginTop: 2 }} />
                        <span className="type-display-card text-sm" style={{ color: D.ink, lineHeight: 1.45 }}>{f.q}</span>
                      </span>
                      <ChevronRight
                        size={17}
                        className="mt-0.5 shrink-0 transition-transform duration-200"
                        style={{ color: D.inkSoft, transform: openFaqIndex === i ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </button>
                    {openFaqIndex === i ? (
                      <div id={`hub-faq-answer-${i}`} className="px-5 pb-5 sm:px-6 sm:pb-6">
                        <div className="pl-7">
                          {renderFaqAnswer(f.a)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>
      )}

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
                {displayName}
              </span>
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
  sourceUnavailable = false,
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
  sourceUnavailable?: boolean;
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
                style={{ border: `1px solid ${D.border}`, background: D.surfaceStrong, boxShadow: `0 4px 24px ${D.shadow}`, borderRadius: D.radiusShell }}
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
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "rgba(19,35,58,0.07)", borderRadius: D.radiusCard }} />
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
                      <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "rgba(19,35,58,0.07)", borderRadius: D.radiusCard }} />
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
                      style={{ background: D.surfaceStrong, color: D.accentStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 10px rgba(15,23,42,0.05)`, borderRadius: D.radiusControl }}
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
        ) : sourceUnavailable ? (
          <div className="flex flex-col items-center py-16 gap-3" style={{ color: D.inkSoft }}>
            <BookOpen size={32} style={{ opacity: 0.35 }} />
            <p className="type-display-card text-sm" style={{ color: D.ink }}>
              Δεν ήταν δυνατή η φόρτωση των άρθρων αυτή τη στιγμή.
            </p>
            <p className="text-sm text-center max-w-md" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
              Δοκιμάστε ξανά σε λίγο ή ανανεώστε τη σελίδα για να δείτε τα πιο πρόσφατα αποτελέσματα.
            </p>
            <Link
              to={emptyActionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700, borderRadius: D.radiusControl }}
            >
              {emptyActionLabel} <ArrowRight size={13} />
            </Link>
          </div>
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
                style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700, borderRadius: D.radiusControl }}
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
  const location = useLocation();
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
  const [postsSourceUnavailable, setPostsSourceUnavailable] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [activeInfoPanelId, setActiveInfoPanelId] = useState<string | null>(null);
  const startHereRef = useRef<HTMLDivElement | null>(null);
  const topicSectionRef = useRef<HTMLDivElement | null>(null);
  const infoPanelRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const pendingResultsScrollRef = useRef(false);
  const pendingInfoPanelScrollRef = useRef(false);

  // Live categories from context — contains real WP names, slugs, wpCategoryId
  const { hubs, loading: catsLoading, sourceUnavailable: categoriesSourceUnavailable } = useCategories();

  const hub = hubSlug ? GUIDED_HUB_DATA[hubSlug] : null;
  const hubVariant = resolveHubVariant(hubSlug);
  // Find the live WP category — gives us the real wpCategoryId
  const liveHub = hubs.find((h) => h.slug === hubSlug);
  const legacyArticleRedirectTarget = hubSlug ? findLegacyArticleRedirect(`/${hubSlug}`) : null;

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
      setPostsSourceUnavailable(false);
      setActiveInfoPanelId(null);
      pendingInfoPanelScrollRef.current = false;
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

    if (primaryResult.sourceUnavailable) {
      return {
        data: [],
        nextOffset: startOffset,
        meta: primaryResult.meta,
        sourceUnavailable: true,
      };
    }

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

      if (topUpResult.sourceUnavailable) {
        return {
          data: filteredPrimary.slice(0, desiredCount),
          nextOffset,
          meta: primaryResult.meta,
          sourceUnavailable: true,
        };
      }

      const filteredTopUp = topUpResult.data.filter((post) => post.id !== featuredId);
      data = [...filteredPrimary, ...filteredTopUp];
      nextOffset += topUpResult.data.length;
    }

    return {
      data: data.slice(0, desiredCount),
      nextOffset,
      meta: primaryResult.meta,
      sourceUnavailable: false,
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
      setPostsSourceUnavailable(false);

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
          setPostsSourceUnavailable(gridResult.sourceUnavailable);
          setFeaturedOverride(featuredResult);
          setFeaturedLoading(false);
          setLoading(false);
        }).catch(() => {
          if (cancelled) return;
          setFeaturedOverride(null);
          setPosts([]);
          setPostsSourceUnavailable(true);
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
        }).then(({ data, meta, sourceUnavailable }) => {
          if (cancelled) return;
          setPosts(data);
          setSourceOffset(data.length);
          setTotalPages(meta.totalPages);
          setTotal(meta.total);
          setPostsSourceUnavailable(sourceUnavailable);
          setLoading(false);
        }).catch(() => {
          if (cancelled) return;
          setPosts([]);
          setPostsSourceUnavailable(true);
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
        setPostsSourceUnavailable(gridResult.sourceUnavailable);
        setFeaturedOverride(featuredResult);
        setFeaturedLoading(false);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setFeaturedOverride(null);
        setPostsSourceUnavailable(true);
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
      }).then(({ data, meta, nextOffset, sourceUnavailable }) => {
        if (cancelled) return;
        setPosts((prev) => [...prev, ...data]);
        setSourceOffset(nextOffset);
        setTotalPages(meta.totalPages);
        setTotal(meta.total);
        setPostsSourceUnavailable(sourceUnavailable);
        setLoading(false);
        setLoadingMore(false);
      }).catch(() => {
        if (cancelled) return;
        setPostsSourceUnavailable(true);
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
      }).then(({ data, meta, sourceUnavailable }) => {
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
        setPostsSourceUnavailable(sourceUnavailable);
        setLoading(false);
        setLoadingMore(false);
      }).catch(() => {
        if (cancelled) return;
        setPostsSourceUnavailable(true);
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

    if (search === nextSearch) {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToStartHere);
      });
      return;
    }

    pendingResultsScrollRef.current = true;
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
      pendingResultsScrollRef.current = false;
      return;
    }

    const headerOffset = 104;
    const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    pendingResultsScrollRef.current = false;
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

  const scrollToInfoPanel = () => {
    const element = infoPanelRef.current;
    if (!element) {
      pendingInfoPanelScrollRef.current = false;
      return;
    }

    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const breathingRoom = 24;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - breathingRoom;

    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    pendingInfoPanelScrollRef.current = false;
  };

  const applyTopicFilter = (label: string, target: { link?: string; panelId?: string; search?: string; sort?: string }) => {
    if (target.panelId) {
      trackContextualEvent("hub_topic_filter_click", {
        hub: hubSlug,
        topic_label: label,
        topic_panel_id: target.panelId,
        total_articles: total,
      });

      setShowFilters(false);
      if (activeInfoPanelId === target.panelId) {
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToInfoPanel);
        });
        return;
      }

      pendingInfoPanelScrollRef.current = true;
      setActiveInfoPanelId(target.panelId);
      return;
    }

    if (target.link) {
      trackContextualEvent("hub_topic_filter_click", {
        hub: hubSlug,
        topic_label: label,
        topic_link: target.link,
        total_articles: total,
      });

      setActiveInfoPanelId(null);
      navigate(target.link);
      return;
    }

    const nextSearch = target.search || "";
    const nextSort = target.sort || "";

    trackContextualEvent("hub_topic_filter_click", {
      hub: hubSlug,
      topic_label: label,
      topic_search: nextSearch || undefined,
      topic_sort: nextSort || undefined,
      total_articles: total,
    });

    setActiveInfoPanelId(null);
    if (search === nextSearch && activeSort === nextSort) {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToStartHere);
      });
      return;
    }

    pendingResultsScrollRef.current = true;
    updateParams({
      search: nextSearch || undefined,
      sort: nextSort || undefined,
    });
    setSearchInput(nextSearch);
    setShowFilters(false);
  };

  useEffect(() => {
    if (!pendingResultsScrollRef.current || loading) return;

    // Wait for the updated article layout to paint before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToStartHere);
    });
  }, [loading, posts.length]);

  useEffect(() => {
    if (!pendingInfoPanelScrollRef.current || !activeInfoPanelId) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToInfoPanel);
    });
  }, [activeInfoPanelId]);

  if (!catsLoading && !hub && !liveHub && legacyArticleRedirectTarget) {
    return <Navigate to={legacyArticleRedirectTarget} replace />;
  }

  // Show "not found" only when:
  // - Not a hardcoded hub AND not a known live WP category AND context has finished loading
  if (!hub && !liveHub && !catsLoading) {
    const notFoundStateSeo = notFoundSeo(location.pathname);

    return (
      <div className="min-h-screen px-5 md:px-6 flex items-center justify-center" style={{ background: D.bg }}>
        <SeoHead seo={notFoundStateSeo} />
        <div
          className="w-full max-w-2xl rounded-[1.75rem] p-8 md:p-10 text-center"
          style={{
            background: D.surfaceStrong,
            border: `1px solid ${D.border}`,
            boxShadow: `0 18px 48px ${D.shadow}`,
            borderRadius: D.radiusShell,
          }}
        >
          <div
            className="inline-flex items-center justify-center rounded-[1.25rem] px-4 py-2 text-xs md:text-sm mb-5"
            style={{
              background: D.accentSoft,
              color: D.accentStrong,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Delta
          </div>
          <h1
            className="type-display-section mb-4"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", color: D.ink }}
          >
            {categoriesSourceUnavailable ? "Η ενότητα δεν είναι διαθέσιμη προσωρινά" : "Η σελίδα δεν βρέθηκε"}
          </h1>
          <p
            className="text-base md:text-lg mb-7"
            style={{ color: D.inkSoft, lineHeight: 1.75, maxWidth: "40rem", marginInline: "auto" }}
          >
            {categoriesSourceUnavailable
              ? "Δεν ήταν δυνατή η φόρτωση της συγκεκριμένης ενότητας αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο ή συνεχίστε από μια βασική διαδρομή του Delta."
              : "Η διεύθυνση που ανοίξατε δεν αντιστοιχεί σε ενεργή ενότητα. Μπορείτε να επιστρέψετε στην αρχική ή να συνεχίσετε σε μία από τις βασικές ενότητες του site."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-[0.95rem] px-5 py-3 text-sm md:text-base"
              style={{
                background: D.ink,
                color: "#ffffff",
                fontWeight: 700,
                minWidth: "12rem",
              }}
            >
              Επιστροφή στην αρχική
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center rounded-[0.95rem] px-5 py-3 text-sm md:text-base"
              style={{
                background: D.surface,
                color: D.ink,
                border: `1px solid ${D.border}`,
                fontWeight: 700,
                minWidth: "12rem",
              }}
            >
              Μετάβαση στο Blog
            </Link>
          </div>
        </div>
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
  const displayInfoPanels = hub?.infoPanels ?? {};
  const activeInfoPanel = activeInfoPanelId ? displayInfoPanels[activeInfoPanelId] : undefined;
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

  const seo = hubSeo(hubSlug ?? "", Boolean(search || activeSort || activeTag));
  const featured = shouldUseFeatured && !featuredLoading ? featuredOverride : undefined;
  const rest = shouldUseFeatured ? posts.filter((p) => p.id !== featured?.id) : posts;
  const isFiltered = Boolean(search || activeSort || activeTag);
  const displayedArticleCount = isFiltered ? posts.length : posts.length + (featured ? 1 : 0);
  const hasMore = displayedArticleCount < total;

  const viewProps: HubViewProps = {
    displayName,
    displayH1,
    displayIntro,
    heroSectionRef,
    displayUrgentInfo,
    displayKeyTopics,
    displayInfoPanels,
    displayFaq,
    activeInfoPanel,
    closeInfoPanel: () => setActiveInfoPanelId(null),
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
    rest,
    search,
    searchInput,
    setSearchInput,
    setShowFilters,
    showFilters,
    sourceUnavailable: postsSourceUnavailable,
    infoPanelRef,
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
