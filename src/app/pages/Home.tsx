import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { BookOpen, Users, GraduationCap, Award, ChevronRight, ArrowRight, Star, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { getHomepage } from "../lib/deltaApi";
import { trackCtaClick, trackEvent } from "../lib/analytics";
import type { HomepagePayload, DeltaHub, BlogPost, Program } from "../lib/types";
import { D, sectionSurfaces } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { PageLoader } from "../components/PageLoader";
import { ProminentArticleCard } from "../components/articles/ProminentArticleCard";
import { CompactArticleListItem } from "../components/articles/CompactArticleListItem";
import { usePageNavigation } from "../lib/usePageNavigation";
import { homeSeo } from "../lib/seo";
import { useCategories } from "../lib/categoriesContext";
import { useNavigation } from "../lib/navigationContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

const PATH_CONFIG = {
  metaptyxiaka: {
    icon: GraduationCap,
    eyebrow: "Κύρια διαδρομή",
    summary: "Αναζήτηση και καθοδήγηση για προπτυχιακά και μεταπτυχιακά προγράμματα με έμφαση στην Κύπρο.",
    action: "Δείτε τα προγράμματα",
    quickCue: "Σπουδές στην Κύπρο και επόμενο ακαδημαϊκό βήμα",
    isFeatured: true,
    route: "/metaptyxiaka",
  },
  asep: {
    icon: FileText,
    eyebrow: "Αιτήσεις & προκηρύξεις",
    summary: "Οδηγοί και ενημέρωση για ΑΣΕΠ, προκηρύξεις και διαδικασίες υποβολής αίτησης.",
    action: "Μπείτε στο hub ΑΣΕΠ",
    quickCue: "Προκηρύξεις, αιτήσεις και βασικοί οδηγοί",
    route: "/asep",
  },
  opsyd: {
    icon: Users,
    eyebrow: "Εκπαιδευτικοί",
    summary: "Ενημέρωση για ΟΠΣΥΔ, πίνακες, μόρια, δικαιολογητικά και υπηρεσιακές κινήσεις.",
    action: "Δείτε ενημέρωση ΟΠΣΥΔ",
    quickCue: "Μόρια, πίνακες και κινήσεις εκπαιδευτικών",
    route: "/opsyd",
  },
  pistopoihseis: {
    icon: Award,
    eyebrow: "Μόρια & εξέλιξη",
    summary: "Πιστοποιήσεις, επιμορφώσεις και διαδρομές ενίσχυσης προσόντων και μορίων.",
    action: "Δείτε διαδρομές πιστοποιήσεων",
    quickCue: "Επιμόρφωση και ενίσχυση προσόντων",
    route: "/pistopoihseis",
  },
} as const satisfies Record<string, {
  icon: typeof GraduationCap;
  eyebrow: string;
  summary: string;
  action: string;
  quickCue: string;
  route: string;
  isFeatured?: boolean;
}>;

const TRUST_PLACEHOLDERS = [
  { label: "Placeholder κοινότητας", value: "XX,XXX+", note: "Μέλη και ακόλουθοι στα βασικά κανάλια" },
  { label: "Placeholder καθοδήγησης", value: "X,XXX+", note: "Άτομα που έχουν εξυπηρετηθεί ή καθοδηγηθεί" },
  { label: "Placeholder περιεχομένου", value: "XXX+", note: "Οδηγοί, άρθρα και ενημερώσεις στους βασικούς τομείς" },
  { label: "Placeholder εμπιστοσύνης", value: "XX έτη", note: "Παρουσία και εξειδίκευση στον χώρο της εκπαίδευσης" },
] as const;

const PATH_ORDER = ["metaptyxiaka", "asep", "opsyd", "pistopoihseis"] as const;

function ProgramCard({ program }: { program: Program }) {
  const universityLogo = program.universityLogo;
  const programTags = [program.summary.university, program.summary.category, program.summary.mode].filter(Boolean);
  const durationLabel = program.summary.duration || "—";
  const tuitionLabel = program.summary.tuition ? `€${program.summary.tuition}` : "—";
  const programTarget = `/courses/${program.slug}`;

  return (
    <Link to={programTarget} className="group p-5 rounded-3xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-full" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}`, borderRadius: D.radiusCard }}
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
          Επιλογή προγράμματος
        </span>
        {program.isFeatured && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px]" style={{ background: D.ink, color: "#fff", fontWeight: 700 }}>
            Προτεραιότητα
          </span>
        )}
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
            {tuitionLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mt-auto" style={{ color: D.inkSoft }}>
        <span>Δείτε αν ταιριάζει στον στόχο σας</span>
        <span className="flex items-center gap-1" style={{ color: D.accentStrong, fontWeight: 700 }}>Λεπτομέρειες <ChevronRight size={13} /></span>
      </div>
    </Link>
  );
}

export function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomepagePayload | null>(null);
  const [selectedEditorialHub, setSelectedEditorialHub] = useState<string>("");
  const testimonialScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollTestimonialsPrev, setCanScrollTestimonialsPrev] = useState(false);
  const [canScrollTestimonialsNext, setCanScrollTestimonialsNext] = useState(false);
  const { hubs: categoryHubs } = useCategories();
  const { setShowStickyBottom } = useNavigation();
  const heroPrimaryCtaRef = useRef<HTMLAnchorElement | null>(null);
  const displayedTestimonialCount = data?.testimonials.slice(0, 6).length ?? 0;

  // Configure navigation for content mode
  usePageNavigation({
    mode: "content",
    cta: { text: "Αναζήτηση Προγραμμάτων", link: "/courses" },
    showStickyBottom: true,
  });

  useEffect(() => {
    getHomepage().then(({ data: d }) => {
      setData(d);
      setSelectedEditorialHub((current) => current || d.featuredHubPosts[0]?.hub?.slug || "");
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

  const syncTestimonialCarouselState = () => {
    const container = testimonialScrollRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollTestimonialsPrev(container.scrollLeft > 8);
    setCanScrollTestimonialsNext(maxScrollLeft - container.scrollLeft > 8);
  };

  const scrollTestimonials = (direction: "prev" | "next") => {
    const container = testimonialScrollRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "next" ? container.clientWidth * 0.92 : -container.clientWidth * 0.92,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = testimonialScrollRef.current;
    if (!container || displayedTestimonialCount === 0) return;

    const handleScroll = () => syncTestimonialCarouselState();

    syncTestimonialCarouselState();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [displayedTestimonialCount]);

  if (loading) {
    return <PageLoader />;
  }

  if (!data) return null;

  const { hero, latestPosts, featuredHubPosts, featuredPrograms, stats, testimonials } = data;
  const displayedTestimonials = testimonials.slice(0, 6);
  const primaryPaths = PATH_ORDER.map((slug) => {
    const liveHub = categoryHubs.find((hub) => hub.slug === slug);
    if (liveHub) return liveHub;

    return {
      id: slug,
      name: slug === "pistopoihseis" ? "Πιστοποιήσεις" : slug === "metaptyxiaka" ? "Μεταπτυχιακά" : slug === "asep" ? "ΑΣΕΠ" : "ΟΠΣΥΔ",
      slug,
      description: PATH_CONFIG[slug].summary,
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
  const heroTitleHighlight = "Προγράμματα Σπουδών";
  const heroTitleHasHighlight = hero.title.includes(heroTitleHighlight);
  const heroTitleHighlightWords = heroTitleHighlight.split(" ");
  const heroTitleTrailingClean = heroTitleHasHighlight
    ? hero.title.replace(heroTitleHighlight, "").replace(/^,\s*/, "")
    : "";

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={homeSeo()} />
      {/* Hero */}
      <section className="pt-[7.25rem] md:pt-40 pb-10 md:pb-14 px-5 md:px-6">
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] gap-8 md:gap-10 items-start">
            <div>
              <h1 className="type-display-hero mb-4 md:mb-6" style={{
                fontSize: "clamp(2.15rem, 6vw, 4.5rem)",
                color: D.ink,
                maxWidth: "760px",
                lineHeight: 0.95,
                textWrap: "balance",
              }}>
                {heroTitleHasHighlight ? (
                  <>
                    <span
                      className="inline"
                      style={{
                        color: D.accentStrong,
                        textShadow: "0 10px 30px rgba(37,99,235,0.14)",
                      }}
                    >
                      {heroTitleHighlightWords.map((word, index) => (
                        <span key={word}>
                          {index > 0 ? " " : null}
                          <span className="relative inline-block leading-[0.9] align-baseline">
                            {word}
                            <span
                              className="absolute left-[0.08em] right-[0.08em] -bottom-1 h-1.5 rounded-full"
                              style={{
                                background: "linear-gradient(90deg, rgba(37,99,235,0.24) 0%, rgba(37,99,235,0.08) 100%)",
                              }}
                            />
                          </span>
                        </span>
                      ))}
                    </span>
                    <span>{`, ${heroTitleTrailingClean}`}</span>
                  </>
                ) : (
                  hero.title
                )}
              </h1>

              <p className="type-body-lg mb-6 md:mb-8 max-w-xl" style={{ color: D.inkSoft, fontSize: "clamp(1rem, 2vw, 1.125rem)" }}>
                {hero.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link 
                  ref={heroPrimaryCtaRef}
                  to={hero.primaryCta.url} 
                  onClick={() => trackCtaClick(hero.primaryCta.label, "home_hero_primary", { cta_target: hero.primaryCta.url })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{ background: D.ink, fontWeight: 700, fontSize: "1rem", boxShadow: `0 4px 20px ${D.shadow}`, minHeight: "56px", borderRadius: D.radiusControl }}
                >
                  {hero.primaryCta.label} <ArrowRight size={18} />
                </Link>
                <Link
                  to={hero.secondaryCta.url}
                  onClick={() => trackCtaClick(hero.secondaryCta.label, "home_hero_secondary", { cta_target: hero.secondaryCta.url })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 600, minHeight: "56px", borderRadius: D.radiusControl }}
                >
                  {hero.secondaryCta.label} <ChevronRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 md:mt-10">
                {[
                  { label: "Φοιτητές", value: stats.students, icon: Users },
                  { label: "Προγράμματα", value: stats.programs, icon: BookOpen },
                  { label: "Πανεπιστήμια", value: stats.universities, icon: GraduationCap },
                  { label: "Επιτυχία", value: stats.successRate, icon: Award },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 + i * 0.08 }}
                    className="flex flex-col gap-2 p-4 rounded-2xl min-h-[118px]"
                    style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
                  >
                    <stat.icon size={18} style={{ color: D.accent }} />
                    <div className="type-stat" style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.7rem)", color: D.ink }}>
                      {stat.value}
                    </div>
                    <div className="text-[11px]" style={{ color: D.inkSoft, fontWeight: 600 }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] p-5 md:p-7 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${D.border}`, boxShadow: `0 18px 48px rgba(15,23,42,0.09)`, backdropFilter: "blur(16px)", borderRadius: D.radiusShell }}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${D.warmAccentStrong}, ${D.accentStrong}, rgba(37,99,235,0.12))` }} />
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: D.warmAccentSoft, border: `1px solid ${D.warmAccentBorderSoft}` }}
                >
                  <ShieldCheck size={14} style={{ color: D.warmAccentStrong }} />
                  <div className="text-[11px] tracking-[0.14em] uppercase" style={{ color: D.warmAccentStrong, fontWeight: 700 }}>
                    Επιλεγμένη διαδρομή
                  </div>
                </div>
              </div>
              <h2 className="type-display-section mb-2.5" style={{ fontSize: "1.34rem", color: D.ink, lineHeight: 1.16, letterSpacing: "-0.03em" }}>
                Επιλέξτε γρήγορα το θέμα που σας αφορά
              </h2>
              <p className="text-sm mb-6" style={{ color: D.inkSoft, lineHeight: 1.72, maxWidth: "34rem" }}>
                Διαλέξτε τη βασική διαδρομή που ταιριάζει στην ανάγκη σας και συνεχίστε χωρίς περιττή αναζήτηση.
              </p>
              <div className="space-y-2.5">
                {primaryPaths.slice(0, 4).map((hub, index) => {
                  const config = PATH_CONFIG[hub.slug as keyof typeof PATH_CONFIG];
                  const Icon = config?.icon || BookOpen;
                  return (
                    <Link
                      key={hub.id}
                      to={config?.route || `/${hub.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-[1.35rem] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-[78px]"
                      style={{
                        background: index === 0 ? "linear-gradient(180deg, rgba(248,250,255,0.98) 0%, rgba(255,255,255,0.98) 100%)" : "rgba(255,255,255,0.72)",
                        border: `1px solid ${index === 0 ? "rgba(37,99,235,0.18)" : D.border}`,
                        boxShadow: index === 0 ? "0 10px 26px rgba(37,99,235,0.08)" : "0 4px 16px rgba(15,23,42,0.04)",
                        borderRadius: D.radiusCard,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-[1.1rem] flex items-center justify-center shrink-0"
                          style={{ background: index === 0 ? "rgba(37,99,235,0.1)" : D.accentSoft, border: `1px solid ${index === 0 ? "rgba(37,99,235,0.12)" : "transparent"}`, borderRadius: D.radiusControl }}
                        >
                          <Icon size={18} style={{ color: D.accentStrong }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <div className="text-sm" style={{ fontWeight: 750, color: D.ink, letterSpacing: "-0.01em" }}>{hub.name}</div>
                          </div>
                          <div className="text-xs line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
                            {config?.quickCue || config?.action || hub.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" style={{ color: index === 0 ? D.accentStrong : D.inkSoft, opacity: index === 0 ? 1 : 0.72 }} />
                    </Link>
                  );
                })}
              </div>
              <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${D.warmAccentBorderSoft}` }}>
                <p className="text-xs" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                  Αν δεν είστε ακόμη βέβαιοι, ξεκινήστε από τη διαδρομή που μοιάζει πιο κοντά στην ανάγκη σας και συνεχίστε από εκεί.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-9 md:py-11 px-5 md:px-6" style={sectionSurfaces.homeTrust}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)] gap-6 md:gap-8 items-center mb-7 md:mb-8">
              <div>
                <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>Το οικοσύστημα Delta</div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.25rem, 2.8vw, 1.8rem)", color: D.ink }}>
                  Σπουδές, καθοδήγηση, ενημέρωση και πρακτικά εργαλεία σε ένα ενιαίο πλαίσιο υποστήριξης
                </h2>
                <p className="max-w-2xl text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                  Η Delta συνδέει διαφορετικές ανάγκες που συχνά εμφανίζονται μαζί: ακαδημαϊκές επιλογές, προκηρύξεις, επαγγελματική εξέλιξη,
                  πιστοποιήσεις και ψηφιακά εργαλεία που κάνουν τις αποφάσεις πιο γρήγορες και πιο καθαρές.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  {[
                    "Πιο καθαρές διαδρομές για σπουδές και εργασία",
                    "Πρακτική καθοδήγηση με Delta σοβαρότητα",
                    "Νέα εργαλεία που επεκτείνουν την εμπειρία πέρα από το περιεχόμενο",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.74)", border: `1px solid ${D.border}`, boxShadow: `0 6px 18px ${D.shadow}`, borderRadius: D.radiusCard }}
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={15} style={{ color: D.warmAccentStrong, marginTop: 2, flexShrink: 0 }} />
                        <p className="text-sm" style={{ color: D.ink, fontWeight: 600, lineHeight: 1.6 }}>
                          {item}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[2rem] p-4 md:p-5"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  border: `1px solid ${D.warmAccentBorderSoft}`,
                  boxShadow: `0 12px 32px rgba(185,152,90,0.08)`,
                  backdropFilter: "blur(8px)",
                  borderRadius: D.radiusShell,
                }}
              >
                <div className="rounded-[1.5rem] overflow-hidden" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.warmAccentWash} 100%)`, border: `1px solid ${D.warmAccentBorderSoft}`, borderRadius: D.radiusCard }}>
                  <img
                    src="/delta-hero.png"
                    alt="Οπτική αποτύπωση του οικοσυστήματος υπηρεσιών και εργαλείων της Delta"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_PLACEHOLDERS.map((item, i) => (
              <AnimatedSection key={item.label} delay={i * 0.06}>
                <div className="rounded-[24px] p-5 h-full" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}`, backdropFilter: "blur(8px)", borderRadius: D.radiusCard }}>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-[11px]" style={{ background: D.warmAccentSoft, color: D.warmAccentStrong, fontWeight: 700 }}>
                    <CheckCircle2 size={12} />
                    Placeholder
                  </div>
                  <div className="type-stat" style={{ fontSize: "1.7rem", color: D.ink }}>
                    {item.value}
                  </div>
                  <div className="text-sm mt-1" style={{ color: D.ink, fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <p className="text-xs mt-2" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                    {item.note}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Guidance */}
      <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homeEditorial}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col gap-3 mb-7 md:mb-8">
              <div>
                <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>Επιλεγμένη καθοδήγηση</div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", color: D.ink }}>
                  Ξεκινήστε από το σωστό θέμα
                </h2>
                <p className="max-w-xl text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Επιλέξτε μία κατηγορία και δείτε το βασικό άρθρο που αξίζει να διαβάσετε πρώτο.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {selectedEditorialPost && (
            <div className="flex flex-col gap-5 md:gap-6">
              <AnimatedSection>
                <div className="flex flex-col gap-4">
                  <div className="type-eyebrow" style={{ color: D.warmAccentStrong }}>
                    Επιλέξτε κατηγορία
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
                        {post.hub?.name || PATH_CONFIG[slug].eyebrow}
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
                        dateLabel={formatDate(selectedEditorialPost.publishedAt)}
                        eyebrow="Ξεκινήστε από εδώ"
                        ctaLabel={selectedEditorialPost.hub?.slug === "metaptyxiaka" ? "Διαβάστε τον οδηγό σπουδών" : "Διαβάστε τον οδηγό"}
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
                  {latestPosts.map((post, i) => (
                    <AnimatedSection key={post.id} delay={i * 0.08}>
                      <div
                        className="rounded-[22px] p-3 md:p-3.5"
                        style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                      >
                        <CompactArticleListItem
                          post={post}
                          dateLabel={formatDate(post.publishedAt)}
                          showCategoryLabel
                        />
                      </div>
                    </AnimatedSection>
                  ))}
                  <AnimatedSection delay={0.18}>
                    <div className="rounded-3xl p-5 md:p-6 h-full flex flex-col justify-between" style={{ background: `linear-gradient(180deg, ${D.surface} 0%, rgba(255,255,255,0.96) 100%)`, border: `1px solid ${D.border}`, borderRadius: D.radiusShell }}>
                      <div>
                        <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>
                          Περισσότερο περιεχόμενο
                        </div>
                        <h3 className="type-display-card" style={{ fontSize: "1.15rem", letterSpacing: "-0.025em", color: D.ink, lineHeight: 1.25 }}>
                          Συνεχίστε με όλους τους οδηγούς και τα άρθρα
                        </h3>
                        <p className="text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                          Μπείτε στη συνολική βιβλιοθήκη περιεχομένου για να βρείτε το επόμενο σχετικό θέμα, ανά hub ή ανά ανάγκη.
                        </p>
                      </div>
                      <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${D.border}` }}>
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
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section - P0 Fix (Social Proof) */}
      {displayedTestimonials.length > 0 && (
        <>
        <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homeTrustBand}>
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8 md:mb-10">
                <div className="max-w-3xl">
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Σήματα εμπιστοσύνης</div>
                  <h2 className="type-display-section" style={{ fontSize: "clamp(1.45rem, 3vw, 2rem)", color: D.ink }}>
                    Εμπειρίες που ενισχύουν την αξιοπιστία του brand
                  </h2>
                  <p className="text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                    Περιηγηθείτε στις πιο πρόσφατες αξιολογήσεις σε ένα ήρεμο, editor-led carousel που κρατά την κοινωνική απόδειξη παρούσα χωρίς να βαραίνει την αρχική.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-xs uppercase tracking-[0.12em]" style={{ color: D.inkSoft }}>
                    {displayedTestimonials.length} reviews
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollTestimonials("prev")}
                    disabled={!canScrollTestimonialsPrev}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed"
                    style={{
                      background: D.surfaceStrong,
                      border: `1px solid ${D.border}`,
                      color: D.ink,
                      opacity: canScrollTestimonialsPrev ? 1 : 0.45,
                    }}
                    aria-label="Προηγούμενες αξιολογήσεις"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTestimonials("next")}
                    disabled={!canScrollTestimonialsNext}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed"
                    style={{
                      background: D.ink,
                      color: "#fff",
                      border: `1px solid ${D.ink}`,
                      opacity: canScrollTestimonialsNext ? 1 : 0.45,
                    }}
                    aria-label="Επόμενες αξιολογήσεις"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div
                ref={testimonialScrollRef}
                className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {displayedTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="snap-start shrink-0 basis-[88%] sm:basis-[calc(50%-0.625rem)] lg:basis-[calc((100%-3rem)/3)]"
                  >
                    <div className="flex flex-col gap-4 p-5 md:p-6 rounded-3xl h-full min-h-[290px]" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusCard }}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                          Επιβεβαίωση
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: t.rating }).map((_, index) => (
                            <Star key={index} size={14} fill={D.accent} style={{ color: D.accent }} />
                          ))}
                        </div>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed" style={{ color: D.ink, lineHeight: 1.8 }}>
                        "{t.content}"
                      </p>
                      <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${D.border}` }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: D.accentSoft }}>
                          <span className="type-ui-label" style={{ color: D.accentStrong, fontSize: "0.85rem" }}>
                            {t.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{t.name}</div>
                          <div className="text-xs" style={{ color: D.inkSoft }}>{t.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
        </>
      )}

      {/* Featured Programs */}
      {featuredPrograms.length > 0 && (
        <>
        <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homePrograms}>
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7 md:mb-8">
                <div>
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Σπουδές με προτεραιότητα</div>
                  <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.8rem)", color: D.ink }}>
                    Ενδεικτικές επιλογές για το επόμενο ακαδημαϊκό σας βήμα
                  </h2>
                </div>
                <p className="max-w-xl text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Επειδή τα μεταπτυχιακά είναι βασικός άξονας του business, η αρχική τα παρουσιάζει σαν στρατηγική κατηγορία και όχι σαν απλή λίστα καρτών.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {featuredPrograms.map((p, i) => (
                <AnimatedSection key={p.id} delay={i * 0.07}>
                  <ProgramCard program={p} />
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.22}>
              <div className="mt-7 md:mt-8 rounded-3xl p-5 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5" style={{ background: D.surface, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusShell }}>
                <div className="max-w-2xl">
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
                    Αναζήτηση με καθοδήγηση
                  </div>
                  <h3 className="type-display-card" style={{ fontSize: "1.2rem", letterSpacing: "-0.025em", color: D.ink }}>
                    Θέλετε να συγκρίνετε περισσότερα προγράμματα με φίλτρα;
                  </h3>
                  <p className="text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                    Μπείτε στην αναζήτηση προγραμμάτων για να δείτε περισσότερες επιλογές, να φιλτράρετε πανεπιστήμια και να βρείτε αυτό που ταιριάζει καλύτερα στον στόχο σας.
                  </p>
                </div>
                <Link
                  to="/courses"
                  onClick={() => trackCtaClick("Αναζήτηση προγραμμάτων", "home_programs_more", { cta_target: "/courses" })}
                  className="text-sm flex items-center gap-1"
                  style={{ color: D.accent, fontWeight: 600 }}
                >
                  Αναζήτηση προγραμμάτων <ChevronRight size={14} />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
        </>
      )}

      {/* Contact CTA - P0 Fix (Trigger Modal) */}
      <section className="py-14 md:py-18 px-5 md:px-6" style={sectionSurfaces.homeFinalCta}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="rounded-3xl p-6 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
              style={{ background: `linear-gradient(135deg, ${D.ink} 0%, ${D.heroMid} 100%)`, boxShadow: `0 16px 44px ${D.shadow}`, borderRadius: D.radiusShell }}
            >
              <div className="max-w-lg">
                <div className="type-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Τελικό βήμα υποστήριξης
                </div>
                <h2 className="type-display-section mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "#fff", lineHeight: 1.2 }}>
                  {data.contactBlock.title}
                </h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
                  {data.contactBlock.description} Αν δεν είστε ακόμη σίγουροι ποια διαδρομή σας ταιριάζει, αυτό είναι το σημείο για να ζητήσετε πιο άμεση καθοδήγηση.
                </p>
              </div>
              <Link
                to="/contact"
                onClick={() => trackCtaClick("Ζητήστε καθοδήγηση", "home_final_cta", { cta_target: "/contact" })}
                className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: D.accent, color: D.ink, fontWeight: 700, boxShadow: `0 4px 20px rgba(197,141,42,0.4)`, minHeight: "56px", borderRadius: D.radiusControl }}
              >
                Ζητήστε καθοδήγηση <ArrowRight size={18} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
