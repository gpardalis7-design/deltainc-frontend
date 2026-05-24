import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { BookOpen, Users, GraduationCap, Award, ChevronRight, ArrowRight, Star, CheckCircle2, FileText, ShieldCheck, Compass, X } from "lucide-react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { getHomepage } from "../lib/deltaApi";
import { trackCtaClick, trackEvent } from "../lib/analytics";
import type { HomepagePayload, DeltaHub, BlogPost, Program } from "../lib/types";
import { D, sectionSurfaces } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { MockBadge } from "../components/MockBadge";
import { PageLoader } from "../components/PageLoader";
import { ProminentArticleCard } from "../components/articles/ProminentArticleCard";
import { CompactArticleListItem } from "../components/articles/CompactArticleListItem";
import { usePageNavigation } from "../lib/usePageNavigation";
import { homeSeo } from "../lib/seo";
import { useCategories } from "../lib/categoriesContext";

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

function HeroKnowledgeMap() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const pathTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 14, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const };

  const nodeTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 4.8, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  const nodes = [
    { x: "15%", y: "24%", label: "ΑΣΕΠ" },
    { x: "37%", y: "58%", label: "ΟΠΣΥΔ" },
    { x: "70%", y: "32%", label: "Μεταπτυχιακά" },
    { x: "81%", y: "62%", label: "Πιστοποιήσεις" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-y-0 left-0 w-[58%] hidden md:block"
        style={{
          background: "linear-gradient(90deg, rgba(219,234,254,0.28) 0%, rgba(255,255,255,0.08) 72%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-[22%] h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.08) 20%, rgba(197,141,42,0.12) 52%, transparent 100%)" }}
      />
      <motion.div
        className="absolute left-[7%] top-[12%] h-52 w-52 rounded-full blur-3xl"
        style={{ background: "rgba(37,99,235,0.12)" }}
        animate={prefersReducedMotion ? undefined : { x: [0, 14, -10, 0], y: [0, -12, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[6%] top-[20%] h-64 w-64 rounded-full blur-3xl"
        style={{ background: "rgba(197,141,42,0.1)" }}
        animate={prefersReducedMotion ? undefined : { x: [0, -18, 12, 0], y: [0, 14, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 780"
        preserveAspectRatio="none"
        initial={{ opacity: 0.7 }}
        animate={prefersReducedMotion ? undefined : { opacity: [0.62, 0.82, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="routeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.34)" />
            <stop offset="50%" stopColor="rgba(197,141,42,0.32)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0.22)" />
          </linearGradient>
          <linearGradient id="routeStrokeSoft" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(19,35,58,0.12)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0.18)" />
          </linearGradient>
        </defs>

        <motion.path
          d="M -40 168 C 190 64, 332 108, 492 246 S 786 474, 1042 336 S 1298 190, 1500 272"
          fill="none"
          stroke="url(#routeStroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="10 14"
          animate={prefersReducedMotion ? undefined : { pathLength: [0.82, 1, 0.88], x: [0, 8, -6, 0], y: [0, -6, 5, 0] }}
          transition={pathTransition}
        />
        <motion.path
          d="M 120 566 C 302 432, 462 468, 632 542 S 912 650, 1130 542 S 1336 392, 1490 462"
          fill="none"
          stroke="url(#routeStrokeSoft)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray="4 12"
          animate={prefersReducedMotion ? undefined : { pathLength: [0.75, 0.94, 0.82], x: [0, -10, 7, 0], y: [0, 5, -4, 0] }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </motion.svg>

      {nodes.map((node, index) => (
        <motion.div
          key={node.label}
          className={`absolute ${index > 1 ? "hidden md:flex" : "flex"} items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm`}
          style={{
            left: node.x,
            top: node.y,
            background: "rgba(255,255,255,0.76)",
            border: "1px solid rgba(37,99,235,0.18)",
            color: D.inkSoft,
            boxShadow: "0 12px 34px rgba(15,23,42,0.08)",
          }}
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], scale: [1, 1.03, 1] }}
          transition={{ ...nodeTransition, delay: index * 0.45 }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full"
              style={{ background: "rgba(37,99,235,0.26)" }}
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.9, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 3.4, repeat: Infinity, delay: index * 0.4, ease: "easeOut" }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: D.accentStrong }} />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase">{node.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

const PATH_CONFIG = {
  metaptyxiaka: {
    icon: GraduationCap,
    eyebrow: "Κύρια διαδρομή",
    summary: "Αναζήτηση και καθοδήγηση για προπτυχιακά και μεταπτυχιακά προγράμματα με έμφαση στην Κύπρο.",
    action: "Δείτε τα προγράμματα",
    quickCue: "Σπουδές στην Κύπρο και επόμενο ακαδημαϊκό βήμα",
    audience: "Για φοιτητές και επαγγελματίες που σχεδιάζουν το επόμενο βήμα τους",
    problem: "Βρείτε τη σωστή κατεύθυνση για σπουδές, σύγκριση επιλογών και καθοδήγηση πριν την αίτηση.",
    destinationLabel: "Προγράμματα, σύγκριση επιλογών και καθοδήγηση",
    isFeatured: true,
    route: "/metaptyxiaka",
  },
  asep: {
    icon: FileText,
    eyebrow: "Αιτήσεις & προκηρύξεις",
    summary: "Οδηγοί και ενημέρωση για ΑΣΕΠ, προκηρύξεις και διαδικασίες υποβολής αίτησης.",
    action: "Μπείτε στο hub ΑΣΕΠ",
    quickCue: "Προκηρύξεις, αιτήσεις και βασικοί οδηγοί",
    audience: "Για υποψηφίους που θέλουν σωστή αίτηση χωρίς λάθη",
    problem: "Παρακολουθήστε τις βασικές πληροφορίες για προκηρύξεις και μειώστε τα λάθη στη διαδικασία αίτησης.",
    destinationLabel: "Οδηγοί αιτήσεων, προκηρύξεις και επόμενα βήματα",
    route: "/asep",
  },
  opsyd: {
    icon: Users,
    eyebrow: "Εκπαιδευτικοί",
    summary: "Ενημέρωση για ΟΠΣΥΔ, πίνακες, μόρια, δικαιολογητικά και υπηρεσιακές κινήσεις.",
    action: "Δείτε ενημέρωση ΟΠΣΥΔ",
    quickCue: "Μόρια, πίνακες και κινήσεις εκπαιδευτικών",
    audience: "Για εκπαιδευτικούς που χρειάζονται έγκυρη καθοδήγηση",
    problem: "Οργανώστε την πληροφόρησή σας γύρω από μόρια, δικαιολογητικά και κρίσιμες υπηρεσιακές κινήσεις.",
    destinationLabel: "Μόρια, πίνακες, δικαιολογητικά και ενημέρωση",
    route: "/opsyd",
  },
  pistopoihseis: {
    icon: Award,
    eyebrow: "Μόρια & εξέλιξη",
    summary: "Πιστοποιήσεις, επιμορφώσεις και διαδρομές ενίσχυσης προσόντων και μορίων.",
    action: "Δείτε διαδρομές πιστοποιήσεων",
    quickCue: "Επιμόρφωση και ενίσχυση προσόντων",
    audience: "Για επαγγελματίες που ενισχύουν τον φάκελό τους",
    problem: "Δείτε επιλογές που στηρίζουν επαγγελματική εξέλιξη, επιμόρφωση και ενίσχυση προσόντων.",
    destinationLabel: "Πιστοποιήσεις, επιμορφώσεις και διαδρομές μοριοδότησης",
    route: "/pistopoihseis",
  },
} as const satisfies Record<string, {
  icon: typeof GraduationCap;
  eyebrow: string;
  summary: string;
  action: string;
  quickCue: string;
  audience: string;
  problem: string;
  destinationLabel: string;
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

const PATH_CHOOSER_OPTIONS = PATH_ORDER.map((slug) => ({
  slug,
  title: slug === "metaptyxiaka" ? "Μεταπτυχιακά" : slug === "asep" ? "ΑΣΕΠ" : slug === "opsyd" ? "ΟΠΣΥΔ" : "Πιστοποιήσεις",
  route: PATH_CONFIG[slug].route,
  icon: PATH_CONFIG[slug].icon,
  cue: PATH_CONFIG[slug].quickCue,
}));

function HubCard({ hub }: { hub: DeltaHub }) {
  const config = PATH_CONFIG[hub.slug as keyof typeof PATH_CONFIG];
  const Icon = config?.icon || BookOpen;
  const target = config?.route || (hub.slug === "metaptyxiaka" ? "/metaptyxiaka" : `/${hub.slug}`);
  const isFeatured = Boolean(config && "isFeatured" in config && config.isFeatured);

  return (
    <Link
      to={target}
      className={`group flex flex-col gap-4 rounded-[28px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] ${isFeatured ? "p-5 md:p-7 md:col-span-2 min-h-[276px]" : "p-5 min-h-[248px]"}`}
      style={isFeatured
        ? { background: `linear-gradient(145deg, ${D.surfaceStrong} 0%, ${D.surface} 100%)`, border: `1px solid ${D.accent}26`, boxShadow: `0 14px 34px ${D.shadow}` }
        : { background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}` }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.14em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
            {config?.eyebrow || "Κόμβος"}
          </span>
          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]" style={{ background: D.ink, color: "#fff", fontWeight: 700 }}>
              Προτεραιότητα
            </span>
          )}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft }}>
          <Icon size={20} style={{ color: D.accentStrong }} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="type-display-card flex items-center gap-1.5" style={{ color: D.ink, fontSize: isFeatured ? "1.2rem" : "0.98rem" }}>
          <span className="line-clamp-2">{hub.name}</span>
          <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" style={{ color: D.accent }} />
        </div>
        <p className={`${isFeatured ? "text-sm" : "text-xs"} line-clamp-3`} style={{ color: D.inkSoft, lineHeight: 1.65 }}>
          {config?.audience || hub.description}
        </p>
        <p className={`${isFeatured ? "text-sm" : "text-xs"} line-clamp-3`} style={{ color: D.ink, lineHeight: 1.55, fontWeight: 500 }}>
          {config?.problem || config?.summary || hub.description}
        </p>
      </div>

      <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3" style={{ borderTop: `1px solid ${D.border}` }}>
        <span className="text-xs leading-5" style={{ color: D.inkSoft }}>
          {config?.destinationLabel || (hub.count ? `${hub.count} άρθρα και οδηγοί` : "Ξεκινήστε από αυτό το hub")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm max-w-full sm:max-w-[48%]" style={{ color: D.accentStrong, fontWeight: 700, lineHeight: 1.35 }}>
          <span>{config?.action || "Δείτε περισσότερα"}</span>
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" />
        </span>
      </div>
    </Link>
  );
}

function extractProgramUniversityLogo(contentHtml: string) {
  const srcMatch = contentHtml.match(/<img[^>]+src="([^"]+)"/i);
  if (!srcMatch?.[1]) return null;

  const altMatch = contentHtml.match(/<img[^>]+alt="([^"]*)"/i);

  return {
    url: srcMatch[1],
    alt: altMatch?.[1] || "University logo",
  };
}

function ProgramCard({ program }: { program: Program }) {
  const universityLogo = extractProgramUniversityLogo(program.contentHtml);
  const programTags = [program.summary.university, program.summary.category, program.summary.mode].filter(Boolean);
  const durationLabel = program.summary.duration || "—";
  const tuitionLabel = program.summary.tuition ? `€${program.summary.tuition}` : "—";
  const programTarget = `/courses/${program.slug}`;

  return (
    <Link to={programTarget} className="group p-5 rounded-3xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-full" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}` }}
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
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
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

      <div className="grid grid-cols-2 gap-3 rounded-2xl p-3" style={{ background: D.surface }}>
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
  const [isMock, setIsMock] = useState(false);
  const [isPathChooserOpen, setIsPathChooserOpen] = useState(false);
  const [selectedEditorialHub, setSelectedEditorialHub] = useState<string>("");
  const { hubs: categoryHubs, isMock: categoriesAreMock } = useCategories();

  // Configure navigation for content mode
  usePageNavigation({
    mode: "content",
    cta: { text: "Αναζήτηση Προγραμμάτων", link: "/courses" },
    showStickyBottom: true,
  });

  useEffect(() => {
    getHomepage().then(({ data: d, isMock: m }) => {
      setData(d);
      setIsMock(m);
      setSelectedEditorialHub((current) => current || d.featuredHubPosts[0]?.hub?.slug || "");
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (!data) return null;

  const { hero, latestPosts, featuredHubPosts, featuredPrograms, stats, testimonials } = data;
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

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={homeSeo()} />
      {/* Hero */}
      <section className="pt-[5.5rem] md:pt-32 pb-10 md:pb-14 px-5 md:px-6 relative overflow-hidden">
        <HeroKnowledgeMap />
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(37,99,235,0.035) 100%)`,
        }} />
        <div className="absolute left-1/2 top-20 hidden h-[360px] w-[760px] -translate-x-1/2 rounded-full blur-3xl md:block pointer-events-none" style={{ background: "rgba(37,99,235,0.07)" }} />
        <div className="absolute right-[-120px] top-28 hidden h-[420px] w-[420px] rounded-full blur-3xl md:block pointer-events-none" style={{ background: "rgba(15,23,42,0.045)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, ${D.bg} 100%)` }} />

        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] gap-8 md:gap-10 items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.3)`, color: D.accentStrong, fontWeight: 600 }}>
                  ✦ {hero.eyebrow}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, fontWeight: 600 }}>
                  <Compass size={12} /> Καθοδηγημένο ξεκίνημα
                </span>
                {(isMock || categoriesAreMock) && <MockBadge />}
              </div>

              <h1 className="type-display-hero mb-4 md:mb-6" style={{
                fontSize: "clamp(2.15rem, 6vw, 4.5rem)",
                color: D.ink,
                maxWidth: "760px",
              }}>
                {hero.title}
              </h1>

              <p className="type-body-lg mb-6 md:mb-8 max-w-xl" style={{ color: D.inkSoft, fontSize: "clamp(1rem, 2vw, 1.125rem)" }}>
                {hero.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link 
                  to={hero.primaryCta.url} 
                  onClick={() => trackCtaClick(hero.primaryCta.label, "home_hero_primary", { cta_target: hero.primaryCta.url })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{ background: D.ink, fontWeight: 700, fontSize: "1rem", boxShadow: `0 4px 20px ${D.shadow}`, minHeight: "56px" }}
                >
                  {hero.primaryCta.label} <ArrowRight size={18} />
                </Link>
                <Link
                  to={hero.secondaryCta.url}
                  onClick={() => trackCtaClick(hero.secondaryCta.label, "home_hero_secondary", { cta_target: hero.secondaryCta.url })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-200 hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 600, minHeight: "56px" }}
                >
                  {hero.secondaryCta.label} <ChevronRight size={16} />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 md:mt-5">
                {["Μεταπτυχιακά", "ΑΣΕΠ", "ΟΠΣΥΔ", "Πιστοποιήσεις"].map((label) => (
                  <span key={label} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, fontWeight: 600 }}>
                    {label}
                  </span>
                ))}
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
                    style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}
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

            <div className="rounded-[32px] p-5 md:p-7 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.88)", border: `1px solid ${D.border}`, boxShadow: `0 18px 48px rgba(15,23,42,0.09)`, backdropFilter: "blur(16px)" }}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${D.accentStrong}, rgba(37,99,235,0.15))` }} />
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} style={{ color: D.accentStrong }} />
                <div className="text-xs tracking-[0.12em] uppercase" style={{ color: D.inkSoft }}>Ξεκινήστε από εδώ</div>
              </div>
              <h2 className="type-display-section mb-3" style={{ fontSize: "1.3rem", color: D.ink, lineHeight: 1.2 }}>
                Επιλέξτε γρήγορα το θέμα που σας αφορά
              </h2>
              <p className="text-sm mb-5" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                Αυτό το block λειτουργεί σαν γρήγορος οδηγός κατεύθυνσης. Αν ήδη ξέρετε περίπου τι ψάχνετε, διαλέξτε τη σωστή διαδρομή και συνεχίστε άμεσα.
              </p>
              <div className="space-y-3">
                {primaryPaths.slice(0, 4).map((hub) => {
                  const config = PATH_CONFIG[hub.slug as keyof typeof PATH_CONFIG];
                  const Icon = config?.icon || BookOpen;
                  return (
                    <Link
                      key={hub.id}
                      to={config?.route || `/${hub.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] min-h-[72px]"
                      style={{ background: D.surface, border: `1px solid ${D.border}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft }}>
                          <Icon size={18} style={{ color: D.accentStrong }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm" style={{ fontWeight: 700, color: D.ink }}>{hub.name}</div>
                          <div className="text-xs line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.45 }}>{config?.quickCue || config?.action || hub.description}</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" style={{ color: D.accent }} />
                    </Link>
                  );
                })}
              </div>
              <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${D.border}` }}>
                <button
                  onClick={() => {
                    trackCtaClick("Δεν είστε σίγουροι ποια διαδρομή ταιριάζει;", "home_path_chooser_open", {
                      cta_target: "path_chooser_modal",
                    });
                    setIsPathChooserOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 hover:opacity-90"
                  style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}
                >
                  Δεν είστε σίγουροι ποια διαδρομή ταιριάζει; <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Primary Paths */}
      {primaryPaths.length > 0 && (
        <section className="py-10 md:py-14 px-5 md:px-6 relative" style={sectionSurfaces.homePaths}>
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7 md:mb-8">
                <div>
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Βασικές διαδρομές</div>
                  <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.8rem)", color: D.ink }}>
                    Κατανοήστε καλύτερα ποιο hub σας εξυπηρετεί
                  </h2>
                </div>
                <p className="max-w-xl text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Εδώ οι διαδρομές εξηγούνται πιο αναλυτικά. Αν θέλετε λίγη περισσότερη σιγουριά πριν μπείτε σε ένα hub, χρησιμοποιήστε αυτή την ενότητα σαν σημείο σύγκρισης.
                </p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {primaryPaths.map((hub, i) => (
                <AnimatedSection key={hub.id} delay={i * 0.06}>
                  <HubCard hub={hub} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section className="py-9 md:py-11 px-5 md:px-6" style={sectionSurfaces.homeTrust}>
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6 md:mb-7">
              <div>
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Trust placeholders</div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.2rem, 2.6vw, 1.6rem)", color: D.ink }}>
                  Εδώ θα μπουν τα βασικά στοιχεία εμπιστοσύνης του brand
                </h2>
              </div>
              <p className="max-w-xl text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                Η ενότητα είναι έτοιμη να δεχθεί πραγματικά νούμερα κοινότητας, εμπειρίας και καθοδήγησης μόλις τα οριστικοποιήσετε.
              </p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_PLACEHOLDERS.map((item, i) => (
              <AnimatedSection key={item.label} delay={i * 0.06}>
                <div className="rounded-[24px] p-5 h-full" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}`, backdropFilter: "blur(8px)" }}>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4 text-[11px]" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
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
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-7 md:mb-8">
              <div>
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Επιλεγμένη καθοδήγηση</div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", color: D.ink }}>
                  Διαβάστε πρώτα τα πιο χρήσιμα θέματα
                </h2>
              </div>
              <p className="max-w-xl text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                Αντί για γενικό feed, η αρχική προβάλλει επιλεγμένα άρθρα που βοηθούν τον επισκέπτη να συνεχίσει προς τη σωστή υπηρεσία ή το σωστό hub.
              </p>
            </div>
          </AnimatedSection>

          {selectedEditorialPost && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] gap-5 md:gap-6 items-start">
              <AnimatedSection>
                <div className="flex flex-col gap-4">
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
                          background: selectedEditorialPost.hub?.slug === slug ? D.ink : D.surfaceStrong,
                          border: `1px solid ${selectedEditorialPost.hub?.slug === slug ? D.ink : D.border}`,
                          color: selectedEditorialPost.hub?.slug === slug ? "#fff" : D.inkSoft,
                          fontWeight: 700,
                        }}
                      >
                        {post.hub?.name || PATH_CONFIG[slug].eyebrow}
                      </button>
                    ))}
                  </div>

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
                </div>
              </AnimatedSection>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {latestPosts.map((post, i) => (
                  <AnimatedSection key={post.id} delay={i * 0.08}>
                    <div
                      className="rounded-[22px] p-3 md:p-3.5"
                      style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${D.border}` }}
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
                  <div className="rounded-3xl p-5 md:p-6 h-full flex flex-col justify-between" style={{ background: `linear-gradient(180deg, ${D.surface} 0%, rgba(255,255,255,0.96) 100%)`, border: `1px solid ${D.border}` }}>
                    <div>
                      <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
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
          )}
        </div>
      </section>

      {/* Testimonials Section - P0 Fix (Social Proof) */}
      {testimonials.length > 0 && (
        <>
        <section className="py-11 md:py-15 px-5 md:px-6" style={sectionSurfaces.homeTrustBand}>
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center mb-8 md:mb-10">
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Σήματα εμπιστοσύνης</div>
                <h2 className="type-display-section" style={{ fontSize: "clamp(1.45rem, 3vw, 2rem)", color: D.ink }}>
                  Εμπειρίες που ενισχύουν την αξιοπιστία του brand
                </h2>
                <p className="text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Η ενότητα παραμένει υποστηρικτική και όχι κραυγαλέα, ώστε να λειτουργεί σαν ήρεμη επιβεβαίωση εμπιστοσύνης μέσα στη συνολική διαδρομή της αρχικής.
                </p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {testimonials.map((t, i) => (
                <AnimatedSection key={t.id} delay={i * 0.08}>
                  <div className="flex flex-col gap-4 p-5 md:p-6 rounded-3xl h-full" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                        Επιβεβαίωση
                      </span>
                      <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={14} fill={D.accent} style={{ color: D.accent }} />
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
                </AnimatedSection>
              ))}
            </div>
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
              <div className="mt-7 md:mt-8 rounded-3xl p-5 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5" style={{ background: D.surface, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}` }}>
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
              style={{ background: `linear-gradient(135deg, ${D.ink} 0%, ${D.heroMid} 100%)`, boxShadow: `0 16px 44px ${D.shadow}` }}
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
                style={{ background: D.accent, color: D.ink, fontWeight: 700, boxShadow: `0 4px 20px rgba(197,141,42,0.4)`, minHeight: "56px" }}
              >
                Ζητήστε καθοδήγηση <ArrowRight size={18} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatePresence>
        {isPathChooserOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPathChooserOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="w-full max-w-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="rounded-t-3xl sm:rounded-3xl p-5 md:p-7"
                  style={{ background: D.bg, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
                        Καθοδήγηση εκκίνησης
                      </div>
                      <h2 className="type-display-section" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", color: D.ink, lineHeight: 1.15 }}>
                        Επιλέξτε τη διαδρομή που σας ταιριάζει καλύτερα
                      </h2>
                      <p className="text-sm mt-3" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                        Ξεκινήστε από το πιο σχετικό hub ή μεταβείτε στην επικοινωνία αν θέλετε πιο προσωπική καθοδήγηση.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPathChooserOpen(false)}
                      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: D.surface, color: D.inkSoft, border: `1px solid ${D.border}` }}
                      aria-label="Κλείσιμο"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PATH_CHOOSER_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Link
                          key={option.slug}
                          to={option.route}
                          onClick={() => {
                            trackCtaClick(option.title, "home_path_chooser_option", { cta_target: option.route });
                            setIsPathChooserOpen(false);
                          }}
                          className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995]"
                          style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 6px 18px ${D.shadow}` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft }}>
                                <Icon size={18} style={{ color: D.accentStrong }} />
                              </div>
                              <div className="min-w-0">
                                <div className="type-ui-label text-sm" style={{ color: D.ink }}>
                                  {option.title}
                                </div>
                                <div className="text-xs mt-1 line-clamp-2" style={{ color: D.inkSoft, lineHeight: 1.5 }}>
                                  {option.cue}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: D.accent }} />
                          </div>
                        </Link>
                      );
                    })}

                    <Link
                      to="/contact#contact-form"
                      onClick={() => {
                        trackCtaClick("Χρειάζομαι βοήθεια να αποφασίσω", "home_path_chooser_contact", {
                          cta_target: "/contact#contact-form",
                        });
                        setIsPathChooserOpen(false);
                      }}
                      className="group rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.995] sm:col-span-2"
                      style={{ background: D.surface, border: `1px solid ${D.borderStrong}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft }}>
                            <Compass size={18} style={{ color: D.accentStrong }} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm" style={{ fontWeight: 700, color: D.ink }}>
                              Χρειάζομαι βοήθεια να αποφασίσω
                            </div>
                            <div className="text-xs mt-1" style={{ color: D.inkSoft, lineHeight: 1.5 }}>
                              Μεταβείτε στην επικοινωνία για πιο προσωπική καθοδήγηση και υποστήριξη.
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: D.accentStrong }} />
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
