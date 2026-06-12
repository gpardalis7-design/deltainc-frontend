import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft, ChevronRight, GraduationCap, MapPin, Clock, Euro, Calendar,
  Globe, Building2, X, Mail, User, Phone, ArrowRight, Laptop, Loader2,
} from "lucide-react";
import { getProgram, getPrograms, submitContact } from "../lib/deltaApi";
import { trackCtaClick, trackEvent, trackLeadFormEvent } from "../lib/analytics";
import type { Program } from "../lib/types";
import { SeoHead } from "../components/SeoHead";
import { D } from "../Root";
import { usePageNavigation } from "../lib/usePageNavigation";
import { useScrollableRichTables } from "../lib/richContentTables";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
}

function isPublicUniversityProgram(program: Program | null): boolean {
  if (!program) return false;

  const uniTypeTerms = program.taxonomies.uniType;
  if (uniTypeTerms.some((term) => term.slug === "public")) return true;

  const normalizedUniType = program.summary.uniType.trim().toLowerCase();
  return normalizedUniType === "δημόσιο" || normalizedUniType === "δημόσια πανεπιστήμια";
}

const modeColors: Record<string, string> = {
  "Υβριδικό": "#7c3aed",
  "Εξ Αποστάσεως": "#0891b2",
  "Δια Ζώσης": "#059669",
  "Online": "#0891b2",
  "In-person": "#059669",
  "Hybrid": "#7c3aed",
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ProgramSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-36 pb-24 animate-pulse">
      <div className="h-4 w-24 rounded mb-8" style={{ background: "rgba(19,35,58,0.08)" }} />
      <div className="h-12 w-4/5 rounded mb-4" style={{ background: "rgba(19,35,58,0.08)" }} />
      <div className="h-6 w-3/5 rounded mb-10" style={{ background: "rgba(19,35,58,0.06)" }} />
      <div className="h-72 rounded-3xl" style={{ background: "rgba(19,35,58,0.07)" }} />
    </div>
  );
}

// ─── Info Request Form Modal ──────────────────────────────────────────────────

function InfoRequestForm({ program, onClose }: { program: Program; onClose: () => void }) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const trackedStartRef = useRef(false);

  useEffect(() => {
    trackLeadFormEvent("lead_form_view", {
      form_type: "program_interest",
      source_label: "Program page",
      program_title: program.title,
      university: program.summary.university,
    });
  }, [program.summary.university, program.title]);

  const trackFormStart = () => {
    if (trackedStartRef.current) return;
    trackLeadFormEvent("lead_form_start", {
      form_type: "program_interest",
      source_label: "Program page",
      program_title: program.title,
      university: program.summary.university,
    });
    trackedStartRef.current = true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "program_interest",
        source_label: "Program page",
        program_title: program.title,
        university: program.summary.university,
        error_type: "missing_required_fields",
      });
      setError("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }

    setStatus("submitting");
    setError("");
    trackLeadFormEvent("lead_form_submit", {
      form_type: "program_interest",
      source_label: "Program page",
      subject: `${program.title} - ${program.summary.university}`,
      program_title: program.title,
      university: program.summary.university,
    });
    const result = await submitContact({
      form_type: "program_interest",
      subject: `${program.title} - ${program.summary.university}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      program_title: program.title,
      university: program.summary.university,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      submitted_at: new Date().toISOString(),
      source_label: "Program page",
    });

    if (!result.success) {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "program_interest",
        source_label: "Program page",
        subject: `${program.title} - ${program.summary.university}`,
        program_title: program.title,
        university: program.summary.university,
        error_type: "submission_failed",
      });
      setStatus("idle");
      setError(result.message);
      return;
    }

    trackLeadFormEvent("lead_form_success", {
      form_type: "program_interest",
      source_label: "Program page",
      subject: `${program.title} - ${program.summary.university}`,
      program_title: program.title,
      university: program.summary.university,
    });
    setStatus("success");
    trackedStartRef.current = false;
    setTimeout(() => {
      onClose();
      setStatus("idle");
      setError("");
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(19,35,58,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg rounded-3xl p-8"
        style={{ background: D.bg }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl transition-all hover:opacity-70"
          style={{ background: D.surface }}
        >
          <X size={18} style={{ color: D.inkSoft }} />
        </button>

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: D.accentSoft }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="type-display-card mb-2" style={{ fontSize: "1.3rem", color: D.ink }}>
              Ευχαριστούμε!
            </h3>
            <p className="text-sm" style={{ color: D.inkSoft }}>
              Λάβαμε το αίτημα σας και θα επικοινωνήσουμε μαζί σας σύντομα.
            </p>
          </div>
        ) : (
          <>
            <h2 className="type-display-section mb-2" style={{ fontSize: "1.5rem", color: D.ink }}>
              Πληροφορίες για το{" "}
              <span style={{ color: D.accent }}>{program.title}</span>
            </h2>
            <p className="text-sm mb-6" style={{ color: D.inkSoft }}>
              Συμπληρώστε τα στοιχεία σας και θα επικοινωνήσουμε μαζί σας.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>
                  Ονοματεπώνυμο *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: D.inkSoft }} />
                  <input
                    type="text"
                    value={formData.name}
                    onFocus={trackFormStart}
                    onChange={(e) => {
                      trackFormStart();
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.ink }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>
                  Email *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: D.inkSoft }} />
                  <input
                    type="email"
                    value={formData.email}
                    onFocus={trackFormStart}
                    onChange={(e) => {
                      trackFormStart();
                      setFormData({ ...formData, email: e.target.value });
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.ink }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>
                  Τηλέφωνο *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: D.inkSoft }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onFocus={trackFormStart}
                    onChange={(e) => {
                      trackFormStart();
                      setFormData({ ...formData, phone: e.target.value });
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.ink }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>
                  Μήνυμα (προαιρετικό)
                </label>
                <textarea
                  value={formData.message}
                  onFocus={trackFormStart}
                  onChange={(e) => {
                    trackFormStart();
                    setFormData({ ...formData, message: e.target.value });
                  }}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                  style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.ink }}
                  placeholder="Ερωτήσεις ή πρόσθετες πληροφορίες..."
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#dc2626" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-3.5 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: D.ink, color: "#fff", fontWeight: 700, letterSpacing: "0.02em" }}
              >
                {status === "submitting" ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Αποστολή...</span> : "Αποστολή Αίτησης"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Quick Info Sidebar Card ──────────────────────────────────────────────────

function QuickInfoCard({
  program,
  onRequestInfo,
  showInfoRequestButton = true,
}: {
  program: Program;
  onRequestInfo: () => void;
  showInfoRequestButton?: boolean;
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
      <h3 className="type-eyebrow mb-4" style={{ color: D.inkSoft }}>
        Σύνοψη Προγράμματος
      </h3>

      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-3">
          <GraduationCap size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Πανεπιστήμιο</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.university}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Πόλη</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.city}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Laptop size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Μορφή</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.mode}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Διάρκεια</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.duration}</div>
          </div>
        </div>

        {program.summary.tuition && (
          <div className="flex items-start gap-3">
            <Euro size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
            <div className="flex-1">
              <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Δίδακτρα</div>
              <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>€{program.summary.tuition}</div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Globe size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Γλώσσα</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.language}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Building2 size={16} className="mt-0.5 shrink-0" style={{ color: D.accent }} />
          <div className="flex-1">
            <div className="type-meta text-xs mb-0.5" style={{ color: D.inkSoft }}>Τύπος</div>
            <div className="text-sm" style={{ fontWeight: 600, color: D.ink }}>{program.summary.uniType}</div>
          </div>
        </div>
      </div>

      {program.summary.deadline && (
        <div className="mb-5 px-4 py-3 rounded-xl" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.2)` }}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} style={{ color: D.accentStrong }} />
            <span className="type-ui-label text-xs" style={{ color: D.accentStrong }}>Deadline Αιτήσεων</span>
          </div>
          <div className="text-sm" style={{ fontWeight: 700, color: D.accentStrong }}>
            {formatDate(program.summary.deadline)}
          </div>
        </div>
      )}

      {showInfoRequestButton && (
        <button
          onClick={() => {
            trackCtaClick("Ζήτα Πληροφορίες", "program_sidebar", {
              program_title: program.title,
              university: program.summary.university,
            });
            onRequestInfo();
          }}
          className="w-full py-3.5 rounded-xl text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ background: D.ink, color: "#fff", fontWeight: 700 }}
        >
          Ζήτα Πληροφορίες <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Related Program Card ─────────────────────────────────────────────────────

function RelatedProgramCard({ program }: { program: Program }) {
  const navigate = useNavigate();
  const modeColor = modeColors[program.summary.mode] || D.inkSoft;

  return (
    <button
      onClick={() => {
        trackEvent("related_program_click", {
          page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          program_title: program.title,
          university: program.summary.university,
        });
        navigate(`/courses/${program.slug}`);
        window.scrollTo(0, 0);
      }}
      className="group w-full text-left rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(197,141,42,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = D.border)}
    >
      {program.featuredImage && (
        <div className="overflow-hidden" style={{ height: "140px" }}>
          <img src={program.featuredImage.url} alt={program.featuredImage.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${modeColor}10`, border: `1px solid ${modeColor}25`, color: modeColor }}>
            {program.summary.mode}
          </span>
        </div>
        <h3 className="type-display-card mb-2 flex-1 line-clamp-2 text-sm" style={{ color: D.ink, lineHeight: 1.4 }}>
          {program.title}
        </h3>
        <div className="text-xs pt-2" style={{ borderTop: `1px solid ${D.border}`, color: D.inkSoft }}>
          {program.summary.university}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProgramDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [relatedPrograms, setRelatedPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceUnavailable, setSourceUnavailable] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "admissions" | "outcomes" | "faq">("overview");
  const [showModal, setShowModal] = useState(false);
  const programProseRef = useRef<HTMLDivElement | null>(null);
  const mobileQuickInfoRef = useRef<HTMLDivElement | null>(null);
  const [isMobileQuickInfoVisible, setIsMobileQuickInfoVisible] = useState(false);
  const hideInfoRequestCta = isPublicUniversityProgram(program);
  const showMobileStickyInfoCta = !hideInfoRequestCta && !isMobileQuickInfoVisible;

  // Configure sticky bottom CTA
  usePageNavigation({
    mode: "content",
    cta: {
      text: hideInfoRequestCta ? "" : "Ζήτα Πληροφορίες",
      action: () => setShowModal(true),
    },
    showStickyBottom: showMobileStickyInfoCta,
  });

  // Fetch program
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setActiveTab("overview");
    window.scrollTo(0, 0);

    getProgram(slug).then(({ data, sourceUnavailable: unavailable }) => {
      setProgram(data);
      setSourceUnavailable(unavailable);
      setLoading(false);

      if (data) {
        // Fetch related programs from same category
        const categorySlug = data.taxonomies.category[0]?.slug;
        if (categorySlug) {
          getPrograms({ category: String(data.taxonomies.category[0]?.id) }).then(({ data: related }) => {
            setRelatedPrograms(related.filter((p) => p.id !== data.id));
          });
        }
      }
    });
  }, [slug]);

  useEffect(() => {
    if (hideInfoRequestCta) {
      setIsMobileQuickInfoVisible(false);
      return;
    }

    if (typeof window === "undefined") return;

    const target = mobileQuickInfoRef.current;
    if (!target) return;

    const mobileMediaQuery = window.matchMedia("(max-width: 1023px)");
    if (!mobileMediaQuery.matches) {
      setIsMobileQuickInfoVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMobileQuickInfoVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2);
      },
      {
        threshold: [0, 0.2, 0.4, 0.6],
        rootMargin: "-8% 0px -16% 0px",
      },
    );

    observer.observe(target);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setIsMobileQuickInfoVisible(false);
      }
    };

    mobileMediaQuery.addEventListener?.("change", handleViewportChange);

    return () => {
      observer.disconnect();
      mobileMediaQuery.removeEventListener?.("change", handleViewportChange);
    };
  }, [hideInfoRequestCta, program?.id]);

  const activeContent = program
    ? (program.sections[activeTab] || program.excerpt)
    : "";
  const sanitizedProgramContent = useMemo(() => sanitizeRichHtml(activeContent), [activeContent]);
  useScrollableRichTables(programProseRef, [program?.id, activeTab, sanitizedProgramContent]);

  if (loading) return <ProgramSkeleton />;
  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: D.bg }}>
        <p style={{ color: D.inkSoft }}>
          {sourceUnavailable ? "Δεν ήταν δυνατή η φόρτωση του προγράμματος." : "Το πρόγραμμα δεν βρέθηκε."}
        </p>
        <Link to="/courses" className="text-sm" style={{ color: D.accent }}>← Επιστροφή στα Προγράμματα</Link>
      </div>
    );
  }

  const tabs = [
    {
      key: "overview" as const,
      label: "Επισκόπηση",
      mobileLabel: "Επισκόπηση",
      content: program.sections.overview,
    },
    {
      key: "curriculum" as const,
      label: "Πρόγραμμα Σπουδών",
      mobileLabel: "Σπουδές",
      content: program.sections.curriculum,
    },
    {
      key: "admissions" as const,
      label: "Προϋποθέσεις Εισαγωγής",
      mobileLabel: "Εισαγωγή",
      content: program.sections.admissions,
    },
    {
      key: "outcomes" as const,
      label: "Επαγγελματικές Προοπτικές",
      mobileLabel: "Προοπτικές",
      content: program.sections.outcomes,
    },
    {
      key: "faq" as const,
      label: "Συχνές Ερωτήσεις",
      mobileLabel: "FAQ",
      content: program.sections.faq,
    },
  ];

  const visibleTabs = tabs.filter((tab) =>
    tab.key === "overview" ||
    tab.key === "curriculum" ||
    Boolean(tab.content?.trim()),
  );

  const modeColor = modeColors[program.summary.mode] || D.inkSoft;

  const seo = {
    title: `${program.title} | Delta Inc Education`,
    description: program.excerpt,
    canonical: `https://deltainc.gr/courses/${program.slug}`,
    og: program.featuredImage
      ? {
          image: program.featuredImage.url,
          imageAlt: program.featuredImage.alt || program.title,
        }
      : undefined,
  };

  const programContentStyles = `
    .program-prose {
      color: ${D.inkSoft};
      max-width: 52rem;
    }
    .program-prose > *:first-child { margin-top: 0; }
    .program-prose h1,
    .program-prose h2,
    .program-prose h3,
    .program-prose h4 {
      font-family: 'Manrope', sans-serif;
      color: ${D.ink};
      letter-spacing: -0.03em;
      text-wrap: balance;
    }
    .program-prose h2 {
      font-size: clamp(1.6rem, 2vw, 2rem);
      font-weight: 800;
      line-height: 1.14;
      margin-top: 0;
      margin-bottom: 1.1rem;
    }
    .program-prose h3 {
      font-size: clamp(1.2rem, 1.6vw, 1.45rem);
      font-weight: 750;
      line-height: 1.22;
      margin-top: 2.4rem;
      margin-bottom: 0.85rem;
      padding-top: 1.4rem;
      border-top: 1px solid ${D.border};
    }
    .program-prose h4 {
      font-size: 1.04rem;
      font-weight: 700;
      line-height: 1.35;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .program-prose p,
    .program-prose li {
      font-size: 1.075rem;
      line-height: 1.82;
      color: ${D.inkSoft};
    }
    .program-prose p {
      margin: 0 0 1.15rem;
    }
    .program-prose strong {
      color: ${D.ink};
      font-weight: 700;
    }
    .program-prose em {
      color: ${D.ink};
    }
    .program-prose ul,
    .program-prose ol {
      margin: 1rem 0 1.4rem 0;
      padding-left: 1.35rem;
    }
    .program-prose li + li {
      margin-top: 0.55rem;
    }
    .program-prose hr {
      border: 0;
      border-top: 1px solid ${D.border};
      margin: 2rem 0;
    }
    .program-prose .TyagGW_tableContainer,
    .program-prose .TyagGW_tableWrapper,
    .program-prose .rich-table-scroll,
    .program-prose .wp-block-table,
    .program-prose figure:has(table) {
      width: 100%;
      overflow-x: auto;
      margin: 1.35rem 0 2rem;
      -webkit-overflow-scrolling: touch;
    }
    .program-prose table {
      width: 100%;
      min-width: 36rem;
      border-collapse: separate;
      border-spacing: 0;
      background: ${D.surfaceStrong};
      border: 1px solid ${D.border};
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.05);
    }
    .program-prose thead th {
      background: rgba(29, 78, 216, 0.06);
      color: ${D.ink};
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.95rem 1rem;
      text-align: left;
      border-bottom: 1px solid ${D.border};
    }
    .program-prose tbody td {
      padding: 0.9rem 1rem;
      vertical-align: top;
      border-bottom: 1px solid ${D.border};
      color: ${D.inkSoft};
      font-size: 0.98rem;
      line-height: 1.6;
      background: rgba(255,255,255,0.88);
    }
    .program-prose tbody tr:last-child td {
      border-bottom: 0;
    }
    .program-prose tbody td:first-child {
      width: 28%;
      min-width: 11rem;
      font-weight: 700;
      color: ${D.ink};
      background: rgba(248, 250, 255, 0.92);
    }
    @media (max-width: 768px) {
      .program-prose {
        max-width: none;
      }
      .program-prose h2 {
        font-size: 1.5rem;
      }
      .program-prose h3 {
        font-size: 1.18rem;
        margin-top: 2rem;
        padding-top: 1.1rem;
      }
      .program-prose p,
      .program-prose li {
        font-size: 1rem;
        line-height: 1.75;
      }
      .program-prose table {
        min-width: 32rem;
      }
      .program-prose thead th,
      .program-prose tbody td {
        padding: 0.8rem 0.85rem;
      }
    }
    .program-tabs-scroll {
      -ms-overflow-style: none;
      scrollbar-width: none;
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
    }
    .program-tabs-scroll::-webkit-scrollbar {
      display: none;
    }
    .program-tab-button {
      scroll-snap-align: start;
    }
  `;

  return (
    <div style={{ background: D.bg, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead seo={seo} />
      <style>{programContentStyles}</style>

      {/* Modal */}
      {showModal && <InfoRequestForm program={program} onClose={() => setShowModal(false)} />}

      {/* Hero */}
      <div className="pt-24" style={{ background: D.ink }}>
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.4)" }} className="hover:text-white transition-colors">Αρχική</Link>
            <ChevronRight size={12} />
            <Link to="/courses" style={{ color: "rgba(255,255,255,0.4)" }} className="hover:text-white transition-colors">Μεταπτυχιακά</Link>
            <ChevronRight size={12} />
            <span style={{ color: D.accent }}>{program.summary.category}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: `${modeColor}20`, border: `1px solid ${modeColor}40`, color: modeColor, fontWeight: 600 }}>
              {program.summary.mode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: D.accentSoft, color: D.accent, border: `1px solid rgba(197,141,42,0.35)`, fontWeight: 600 }}>
              {program.summary.level}
            </span>
            {program.isFeatured && (
              <span className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                ★ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="type-display-hero mb-4"
            style={{ lineHeight: 1.15, color: "#fff", maxWidth: "900px", fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}
          >
            {program.title}
          </motion.h1>

          {/* Quick Stats */}
          <div className="flex items-center flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            <div className="flex items-center gap-2">
              <GraduationCap size={16} style={{ color: D.accent }} />
              {program.summary.university}
            </div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: D.accent }} />
              {program.summary.city}
            </div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: D.accent }} />
              {program.summary.duration}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {program.featuredImage && (
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-0">
            <div className="rounded-t-3xl overflow-hidden" style={{ height: "clamp(200px, 35vw, 380px)" }}>
              <img src={program.featuredImage.url} alt={program.featuredImage.alt} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>

      {/* Body + Sidebar */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8 lg:gap-12 items-start">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0 py-12">
            {/* Excerpt */}
            <p className="text-lg mb-8" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
              {program.excerpt}
            </p>

            {/* Tabs */}
            <div className="relative mb-8 -mx-6 px-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 md:hidden"
                style={{ background: `linear-gradient(90deg, ${D.bg} 15%, rgba(249,250,252,0))` }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 md:hidden"
                style={{ background: `linear-gradient(270deg, ${D.bg} 15%, rgba(249,250,252,0))` }}
              />
              <div className="program-tabs-scroll overflow-x-auto md:overflow-visible" style={{ paddingBottom: "0.2rem" }}>
                <div className="flex items-center gap-2 min-w-max md:min-w-0 md:flex-wrap" style={{ borderBottom: `1px solid ${D.border}`, paddingBottom: "0" }}>
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="program-tab-button relative whitespace-nowrap rounded-t-2xl px-4 py-3 text-sm transition-all md:px-5"
                      style={{
                        color: activeTab === tab.key ? D.ink : D.inkSoft,
                        fontWeight: activeTab === tab.key ? 700 : 600,
                        background: activeTab === tab.key ? "rgba(255,255,255,0.98)" : "transparent",
                        border: activeTab === tab.key ? `1px solid ${D.border}` : "1px solid transparent",
                        borderBottom: activeTab === tab.key ? `1px solid ${D.bg}` : "1px solid transparent",
                        boxShadow: activeTab === tab.key ? "0 10px 24px rgba(15, 23, 42, 0.05)" : "none",
                      }}
                    >
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="md:hidden">{tab.mobileLabel}</span>
                      {activeTab === tab.key && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                          style={{ background: D.accent }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="program-prose"
              ref={programProseRef}
            >
              {activeContent ? (
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizedProgramContent }}
                />
              ) : (
                <p className="text-sm" style={{ color: D.inkSoft, fontStyle: "italic" }}>
                  Περιεχόμενο σύντομα διαθέσιμο...
                </p>
              )}
            </motion.div>

            {/* Bottom CTA */}
            <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${D.border}` }}>
              <div className="flex items-center flex-wrap gap-4">
                <Link to="/courses" className="flex items-center gap-2 text-sm transition-colors" style={{ color: D.inkSoft }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = D.ink)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = D.inkSoft)}
                >
                  <ArrowLeft size={14} /> Επιστροφή στα Προγράμματα
                </Link>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside
            className="hidden lg:block w-80 shrink-0 py-12"
            style={{ position: "sticky", top: "5.5rem", maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}
          >
            <QuickInfoCard
              program={program}
              onRequestInfo={() => setShowModal(true)}
              showInfoRequestButton={!hideInfoRequestCta}
            />
          </aside>
        </div>

        {/* Mobile Quick Info (below content) */}
        <div ref={mobileQuickInfoRef} className="lg:hidden pb-12">
          <QuickInfoCard
            program={program}
            onRequestInfo={() => setShowModal(true)}
            showInfoRequestButton={!hideInfoRequestCta}
          />
        </div>
      </div>

      {/* Related Programs */}
      {relatedPrograms.length > 0 && (
        <section className="px-6 py-16" style={{ borderTop: `1px solid ${D.border}`, background: D.surface }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="type-display-section" style={{ fontSize: "1.4rem", color: D.ink }}>
                Παρόμοια Προγράμματα
              </h2>
              <Link to="/courses" className="text-sm flex items-center gap-1" style={{ color: D.accent, fontWeight: 600 }}>
                Όλα τα Προγράμματα <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedPrograms.slice(0, 3).map((p) => (
                <RelatedProgramCard key={p.id} program={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="px-6 py-20" style={{ background: D.bg }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8"
            style={{ background: D.ink }}
          >
            <div className="flex-1">
              <div className="type-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Χρειάζεστε Βοήθεια;</div>
              <h2 className="type-display-section mb-3" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "#fff", lineHeight: 1.2 }}>
                Επικοινωνήστε για Δωρεάν Συμβουλευτική
              </h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "480px" }}>
                Η ομάδα Delta σας καθοδηγεί σε κάθε βήμα της διαδικασίας αίτησης.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-90"
                style={{ background: D.accent, color: D.ink, fontWeight: 700 }}
              >
                Ζήτα Πληροφορίες <ArrowRight size={15} />
              </button>
              <Link to="/about" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Επικοινωνία
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
