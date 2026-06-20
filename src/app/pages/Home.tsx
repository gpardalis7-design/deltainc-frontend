import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Award, BookOpen, ChevronRight, FileText, GraduationCap, Users } from "lucide-react";
import { getHomepage } from "../lib/deltaApi";
import { trackCtaClick, trackEvent } from "../lib/analytics";
import type { BlogPost, DeltaHub, HomepagePayload, Program } from "../lib/types";
import { D, sectionSurfaces } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { PageLoader } from "../components/PageLoader";
import { ProminentArticleCard } from "../components/articles/ProminentArticleCard";
import { CompactArticleListItem } from "../components/articles/CompactArticleListItem";
import { HomeHeroEcosystemVisual } from "../components/HomeHeroEcosystemVisual";
import { LearningPathDivider } from "../components/HomeLearningPath";
import { usePageNavigation } from "../lib/usePageNavigation";
import { homeSeo } from "../lib/seo";
import { useCategories } from "../lib/categoriesContext";
import { useNavigation } from "../lib/navigationContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
}

function formatReadingTime(minutes: number) {
  const safeMinutes = Math.max(1, Math.round(minutes || 0));
  return `Χρόνος Ανάγνωσης: ${safeMinutes} λεπτά`;
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

const PATH_CONFIG = {
  metaptyxiaka: {
    icon: GraduationCap,
    displayName: "Μεταπτυχιακά – Διδακτορικά",
    quickCue: "500+ Μεταπτυχιακά",
    route: "/metaptyxiaka",
  },
  asep: {
    icon: FileText,
    displayName: "ΑΣΕΠ",
    quickCue: "Προκηρύξεις, αιτήσεις και βασικοί οδηγοί",
    route: "/asep",
  },
  opsyd: {
    icon: Users,
    displayName: "ΟΠΣΥΔ",
    quickCue: "Μόρια, πίνακες και κινήσεις εκπαιδευτικών",
    route: "/opsyd",
  },
  pistopoihseis: {
    icon: Award,
    displayName: "Πιστοποιήσεις",
    quickCue: "Μόρια, επιμορφώσεις και επαγγελματική εξέλιξη",
    route: "/pistopoihseis",
  },
} as const satisfies Record<string, {
  icon: typeof GraduationCap;
  displayName: string;
  quickCue: string;
  route: string;
}>;

const PATH_ORDER = ["metaptyxiaka", "asep", "opsyd", "pistopoihseis"] as const;

function getEditorialHubLabel(slug: string, fallback?: string) {
  return slug === "metaptyxiaka" ? "Μεταπτυχιακά" : fallback || slug;
}

function ProgramCard({ program }: { program: Program }) {
  const universityLogo = program.universityLogo;
  const programTags = [program.summary.university, program.summary.category, program.summary.mode].filter(Boolean);
  const durationLabel = program.summary.duration || "—";
  const programTarget = `/courses/${program.slug}`;

  return (
    <Link
      to={programTarget}
      className="group p-5 rounded-3xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-full"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}`, borderRadius: D.radiusCard }}
      onClick={() =>
        trackEvent("program_card_click", {
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          page_type: "home",
          content_type: "program",
          program_title: program.title,
          program_slug: program.slug,
          university: program.summary.university,
          source_section: "home_featured_programs",
          cta_target: programTarget,
        })
      }
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.warmAccentBorderSoft)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
          Δημοφιλές
        </span>
        {program.isFeatured ? (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px]" style={{ background: D.ink, color: "#fff", fontWeight: 700 }}>
            Προτεραιότητα
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        {universityLogo ? (
          <div className="h-10 flex items-center">
            <img
              src={universityLogo.url}
              alt={universityLogo.alt}
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </div>
        ) : null}
        <h3 className="type-display-card line-clamp-2" style={{ fontSize: "1.02rem", letterSpacing: "-0.025em", color: D.ink, lineHeight: 1.35 }}>
          {program.title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {programTags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.inkSoft }}>
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl p-3" style={{ background: D.surface, borderRadius: D.radiusInner }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: D.inkSoft }}>
            Διάρκεια
          </div>
          <div className="text-sm mt-1" style={{ color: D.ink, fontWeight: 700 }}>
            {durationLabel}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: D.inkSoft }}>
            Δίδακτρα
          </div>
          <div className="text-sm mt-1" style={{ color: D.ink, fontWeight: 700 }}>
            Σε δόσεις
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mt-auto" style={{ color: D.inkSoft }}>
        <span>Επιλεγμένο πρόγραμμα για επόμενο βήμα</span>
        <span className="flex items-center gap-1" style={{ color: D.accentStrong, fontWeight: 700 }}>
          Δείτε το πρόγραμμα <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  );
}

export function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomepagePayload | null>(null);
  const [selectedEditorialHub, setSelectedEditorialHub] = useState<string>("");
  const [selectedProgramLevel, setSelectedProgramLevel] = useState<"undergraduate" | "postgraduate">("postgraduate");
  const { hubs: categoryHubs } = useCategories();
  const { setShowStickyBottom } = useNavigation();
  const heroPrimaryCtaRef = useRef<HTMLAnchorElement | null>(null);

  usePageNavigation({
    mode: "content",
    cta: { text: "Αναζήτηση Προγραμμάτων", link: "/courses" },
    showStickyBottom: true,
  });

  useEffect(() => {
    getHomepage().then(({ data: d }) => {
      setData(d);
      setSelectedEditorialHub((current) => current || d.featuredHubPosts[0]?.hub?.slug || "");
      setSelectedProgramLevel(d.featuredPrograms.postgraduate.length > 0 ? "postgraduate" : "undergraduate");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading || !data) return;

    const syncHomeStickyVisibility = () => {
      if (typeof window === "undefined") return;

      if (window.innerWidth >= 1024) {
        setShowStickyBottom(true);
        return;
      }

      const ctaRect = heroPrimaryCtaRef.current?.getBoundingClientRect();
      if (!ctaRect) {
        setShowStickyBottom(true);
        return;
      }

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = ctaRect.bottom > 0 && ctaRect.top < viewportHeight;
      setShowStickyBottom(!isVisible);
    };

    syncHomeStickyVisibility();

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          ([entry]) => {
            if (typeof window === "undefined") return;
            if (window.innerWidth >= 1024) {
              setShowStickyBottom(true);
              return;
            }
            setShowStickyBottom(!entry.isIntersecting);
          },
          { threshold: 0.01 },
        )
      : null;

    const observedElement = heroPrimaryCtaRef.current;
    if (observer && observedElement) {
      observer.observe(observedElement);
    }

    window.addEventListener("resize", syncHomeStickyVisibility);
    window.addEventListener("orientationchange", syncHomeStickyVisibility);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncHomeStickyVisibility);
      window.removeEventListener("orientationchange", syncHomeStickyVisibility);
      setShowStickyBottom(true);
    };
  }, [data, loading, setShowStickyBottom]);

  if (loading) {
    return <PageLoader />;
  }

  if (!data) return null;

  const { hero, latestPosts, featuredHubPosts, featuredPrograms } = data;
  const primaryPaths = PATH_ORDER.map((slug) => {
    const liveHub = categoryHubs.find((hub) => hub.slug === slug);
    if (liveHub) return liveHub;

    return {
      id: slug,
      name: PATH_CONFIG[slug].displayName,
      slug,
      description: PATH_CONFIG[slug].quickCue,
      url: PATH_CONFIG[slug].route,
      featuredImage: null,
      count: 0,
    } satisfies DeltaHub;
  });

  const editorialEntries = PATH_ORDER
    .map((slug) => ({
      slug,
      post: featuredHubPosts.find((candidate) => candidate.hub?.slug === slug) || null,
    }))
    .filter((entry): entry is { slug: typeof PATH_ORDER[number]; post: BlogPost } => Boolean(entry.post));

  const selectedEditorialPost =
    editorialEntries.find((entry) => entry.slug === selectedEditorialHub)?.post ||
    editorialEntries[0]?.post ||
    null;

  const programTabs = [
    { id: "postgraduate" as const, label: "Μεταπτυχιακά", slug: "metaptyxiaka-pogrammata", levelId: "303" },
    { id: "undergraduate" as const, label: "Προπτυχιακά", slug: "proptixiaka-programmata", levelId: "323" },
  ];

  const availableProgramTabs = programTabs.filter((tab) => featuredPrograms[tab.id].length > 0);
  const resolvedProgramLevel = availableProgramTabs.some((tab) => tab.id === selectedProgramLevel)
    ? selectedProgramLevel
    : (availableProgramTabs[0]?.id ?? "postgraduate");
  const visibleFeaturedPrograms = featuredPrograms[resolvedProgramLevel];
  const programSectionHeading = resolvedProgramLevel === "undergraduate"
    ? "Δημοφιλή Προπτυχιακά Προγράμματα"
    : "Δημοφιλή Μεταπτυχιακά Προγράμματα";
  const programSectionCtaLabel = resolvedProgramLevel === "undergraduate"
    ? "Δείτε όλα τα προπτυχιακά"
    : "Δείτε όλα τα μεταπτυχιακά";
  const resolvedProgramTab = programTabs.find((tab) => tab.id === resolvedProgramLevel) ?? programTabs[1];
  const programSectionCtaTarget = `/courses?level=${resolvedProgramTab.levelId}#course-search`;

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={homeSeo()} />

      <section className="pt-[7.25rem] md:pt-40 pb-10 md:pb-14 px-5 md:px-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
            <div className="max-w-3xl">
              <h1
                className="type-display-hero mb-4 md:mb-6"
                style={{
                  fontSize: "clamp(2.15rem, 6vw, 4.5rem)",
                  color: D.ink,
                  maxWidth: "760px",
                  lineHeight: 0.95,
                  textWrap: "balance",
                }}
              >
                Σπουδές, Προκηρύξεις &amp; Οδηγοί
              </h1>

              <p className="type-body-lg mb-6 md:mb-8 max-w-2xl" style={{ color: D.inkSoft, fontSize: "clamp(1rem, 2vw, 1.125rem)" }}>
                Μεταπτυχιακά, ΑΣΕΠ, ΟΠΣΥΔ και πιστοποιήσεις με αξιόπιστη ενημέρωση και πρακτική καθοδήγηση.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  ref={heroPrimaryCtaRef}
                  to="/courses"
                  onClick={() => trackCtaClick("Βρείτε Πρόγραμμα Σπουδών", "home_hero_primary", { cta_target: "/courses" })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{ background: D.ink, fontWeight: 700, fontSize: "1rem", boxShadow: `0 4px 20px ${D.shadow}`, minHeight: "56px", borderRadius: D.radiusControl }}
                >
                  Βρείτε Πρόγραμμα Σπουδών <ArrowRight size={18} />
                </Link>
                <Link
                  to={hero.secondaryCta.url}
                  onClick={() => trackCtaClick("Νέα & Προκηρύξεις", "home_hero_secondary", { cta_target: hero.secondaryCta.url })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 600, minHeight: "56px", borderRadius: D.radiusControl }}
                >
                  Νέα &amp; Προκηρύξεις <ChevronRight size={16} />
                </Link>
              </div>

            </div>

            <HomeHeroEcosystemVisual />
          </div>

        </div>
      </section>

      <LearningPathDivider step={1} />

      <section className="py-2 md:py-4 px-5 md:px-6" style={sectionSurfaces.homeTrust}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div
              className="rounded-[32px] p-5 md:p-7 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: `1px solid ${D.border}`,
                boxShadow: `0 18px 48px rgba(15,23,42,0.09)`,
                backdropFilter: "blur(16px)",
                borderRadius: D.radiusShell,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${D.warmAccentStrong}, ${D.accentStrong}, rgba(37,99,235,0.12))` }} />
              <h2 className="type-display-section mb-2.5" style={{ fontSize: "1.34rem", color: D.ink, lineHeight: 1.16, letterSpacing: "-0.03em" }}>
                Ξεκινήστε από τη σωστή διαδρομή
              </h2>
              <p className="text-sm mb-6 max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.72 }}>
                Διαλέξτε τη βασική διαδρομή που ταιριάζει στην ανάγκη σας και περάστε κατευθείαν στο σωστό περιεχόμενο.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {primaryPaths.map((hub, index) => {
                  const config = PATH_CONFIG[hub.slug as keyof typeof PATH_CONFIG];
                  const Icon = config?.icon || BookOpen;
                  const isFeatured = hub.slug === "metaptyxiaka" && index === 0;

                  return (
                    <Link
                      key={hub.id}
                      to={config?.route || `/${hub.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-[1.35rem] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-[94px]"
                      style={{
                        background: isFeatured ? "linear-gradient(180deg, rgba(255,251,243,0.98) 0%, rgba(255,255,255,0.98) 100%)" : "rgba(255,255,255,0.72)",
                        border: `1px solid ${isFeatured ? D.warmAccentBorderSoft : D.border}`,
                        boxShadow: isFeatured ? "0 12px 28px rgba(185,152,90,0.14)" : "0 4px 16px rgba(15,23,42,0.04)",
                        borderRadius: D.radiusCard,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-[1.1rem] flex items-center justify-center shrink-0"
                          style={{
                            background: isFeatured ? D.warmAccentSoft : D.accentSoft,
                            border: `1px solid ${isFeatured ? D.warmAccentBorderSoft : "transparent"}`,
                            borderRadius: D.radiusControl,
                          }}
                        >
                          <Icon size={18} style={{ color: isFeatured ? D.warmAccentStrong : D.accentStrong }} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <div className="text-sm" style={{ fontWeight: 750, color: D.ink, letterSpacing: "-0.01em" }}>
                              {config?.displayName || hub.name}
                            </div>
                            {isFeatured ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em]"
                                style={{ background: D.warmAccentSoft, color: D.warmAccentStrong, fontWeight: 700 }}
                              >
                                Πιο συχνή διαδρομή
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
                            {config?.quickCue || hub.description}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0"
                        style={{ color: isFeatured ? D.warmAccentStrong : D.inkSoft, opacity: isFeatured ? 1 : 0.72 }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <LearningPathDivider step={2} />

      <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homeEditorial}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col gap-3 mb-7 md:mb-8">
              <div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", color: D.ink }}>
                  Δημοφιλείς οδηγοί &amp; άρθρα
                </h2>
                <p className="max-w-xl text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Επιλέξτε μία κατηγορία και δείτε το βασικό άρθρο που αξίζει να διαβάσετε πρώτο.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {selectedEditorialPost ? (
            <div className="flex flex-col gap-5 md:gap-6">
              <AnimatedSection>
                <div className="flex flex-col gap-4">
                  <div className="type-eyebrow" style={{ color: D.warmAccentStrong }}>
                    Επιλέξτε Κατηγορία
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editorialEntries.map(({ slug, post }) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                          setSelectedEditorialHub(slug);
                          trackEvent("cta_click", {
                            page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
                            page_type: "home",
                            content_type: "hub",
                            cta_label: `featured_hub_${slug}`,
                            cta_location: "home_editorial_tabs",
                            hub: slug,
                          });
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all duration-200"
                        style={{
                          background: selectedEditorialPost.hub?.slug === slug ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.9)",
                          border: `1px solid ${selectedEditorialPost.hub?.slug === slug ? "rgba(37,99,235,0.32)" : "rgba(148,163,184,0.22)"}`,
                          color: selectedEditorialPost.hub?.slug === slug ? D.accentStrong : D.inkSoft,
                          fontWeight: 700,
                          boxShadow: selectedEditorialPost.hub?.slug === slug ? "0 6px 18px rgba(37,99,235,0.12)" : "0 2px 10px rgba(15,23,42,0.04)",
                        }}
                      >
                        {getEditorialHubLabel(slug, post.hub?.name)}
                      </button>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] gap-5 md:gap-6 items-start">
                <AnimatedSection>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedEditorialPost.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ProminentArticleCard
                        post={selectedEditorialPost}
                        dateLabel={`${formatDate(selectedEditorialPost.publishedAt)} · ${formatReadingTime(selectedEditorialPost.readingTimeMinutes)}`}
                        ctaLabel="Συνεχίστε την ανάγνωση"
                      />
                    </motion.div>
                  </AnimatePresence>
                </AnimatedSection>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <AnimatedSection>
                    <div className="type-eyebrow" style={{ color: D.warmAccentStrong }}>
                      Τελευταία Άρθρα
                    </div>
                  </AnimatedSection>
                  {latestPosts.map((post, index) => (
                    <AnimatedSection key={post.id} delay={index * 0.08}>
                      <div
                        className="rounded-[22px] p-3 md:p-3.5"
                        style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                      >
                        <CompactArticleListItem
                          post={post}
                          dateLabel={formatDate(post.publishedAt)}
                          timeLabel={formatReadingTime(post.readingTimeMinutes)}
                          showCategoryLabel
                        />
                      </div>
                    </AnimatedSection>
                  ))}
                  <AnimatedSection delay={0.18}>
                    <div className="pt-1">
                      <Link
                        to="/blog"
                        onClick={() => trackCtaClick("Όλα τα άρθρα", "home_editorial_more_articles", { cta_target: "/blog" })}
                        className="inline-flex items-center gap-2 text-sm"
                        style={{ color: D.accentStrong, fontWeight: 700 }}
                      >
                        Όλα τα άρθρα
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {visibleFeaturedPrograms.length > 0 ? <LearningPathDivider step={3} /> : null}

      {visibleFeaturedPrograms.length > 0 ? (
        <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homePrograms}>
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7 md:mb-8">
                <div>
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
                    Σπουδές με προτεραιότητα
                  </div>
                  <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.8rem)", color: D.ink }}>
                    {programSectionHeading}
                  </h2>
                </div>
                <p className="max-w-xl text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Ανακαλύψτε επιλεγμένα προγράμματα από συνεργαζόμενα πανεπιστήμια και βρείτε την επιλογή που ταιριάζει καλύτερα στους στόχους σας
                </p>
              </div>
            </AnimatedSection>

            {availableProgramTabs.length > 1 ? (
              <AnimatedSection>
                <div className="flex justify-center mb-6 md:mb-7">
                  <div
                    className="inline-flex items-center gap-1 p-1 rounded-full"
                    style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusPill }}
                  >
                    {availableProgramTabs.map((tab) => {
                      const isActive = resolvedProgramLevel === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedProgramLevel(tab.id)}
                          className="px-5 py-2.5 rounded-full text-sm transition-colors duration-200"
                          style={{
                            background: isActive ? D.accent : "transparent",
                            color: isActive ? "#fff" : D.inkSoft,
                            fontWeight: 700,
                            borderRadius: D.radiusPill,
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </AnimatedSection>
            ) : null}

            <div className="md:hidden -mx-5 px-5">
              <div
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Δημοφιλή προγράμματα"
              >
                {visibleFeaturedPrograms.map((program, index) => (
                  <div key={program.id} className="snap-start shrink-0 basis-[86%]">
                    <AnimatedSection delay={index * 0.07}>
                      <ProgramCard program={program} />
                    </AnimatedSection>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-5">
              {visibleFeaturedPrograms.map((program, index) => (
                <AnimatedSection key={program.id} delay={index * 0.07}>
                  <ProgramCard program={program} />
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.22}>
              <div className="mt-7 md:mt-8 flex justify-center">
                <Link
                  to={programSectionCtaTarget}
                  onClick={() => trackCtaClick(programSectionCtaLabel, "home_programs_more", {
                    cta_target: programSectionCtaTarget,
                    featured_program_level: resolvedProgramLevel,
                  })}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm transition-all duration-200 hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  {programSectionCtaLabel}
                  <ChevronRight size={15} />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      ) : null}

    </div>
  );
}
