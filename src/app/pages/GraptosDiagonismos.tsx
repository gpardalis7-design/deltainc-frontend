import { Link } from "react-router";
import { ArrowRight, BookOpen, ChevronRight, ClipboardCheck, FileText, Target } from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { SITE_URL } from "../lib/seo";
import { useNavigation } from "../lib/navigationContext";
import { usePageNavigation } from "../lib/usePageNavigation";
import { trackCtaClick } from "../lib/analytics";

const GUIDE_SECTIONS = [
  {
    title: "Τι είναι ο Πανελλήνιος Γραπτός Διαγωνισμός ΑΣΕΠ",
    body: "Placeholder κείμενο: εδώ θα παρουσιαστεί συνοπτικά ο σκοπός του γραπτού διαγωνισμού, ποιους αφορά και γιατί είναι σημαντικός για τους υποψηφίους που θέλουν να προετοιμαστούν σωστά.",
    icon: BookOpen,
  },
  {
    title: "Ύλη και δομή προετοιμασίας",
    body: "Placeholder κείμενο: εδώ θα μπει η βασική εικόνα της ύλης, οι ενότητες που χρειάζονται προσοχή και ο τρόπος οργάνωσης της μελέτης ανάλογα με τον χρόνο που έχει ο υποψήφιος.",
    icon: FileText,
  },
  {
    title: "Σημειώσεις, mock tests και στρατηγική",
    body: "Placeholder κείμενο: εδώ θα περιγραφεί πώς αξιοποιούνται οι σημειώσεις, τα mock tests και η επανάληψη ώστε η προετοιμασία να έχει μετρήσιμη πρόοδο.",
    icon: ClipboardCheck,
  },
] as const;

const STEPS = [
  "Αποτύπωση επιπέδου και διαθέσιμου χρόνου.",
  "Οργάνωση ύλης σε πρακτικό πρόγραμμα μελέτης.",
  "Εξάσκηση με ερωτήσεις, σημειώσεις και mock tests.",
  "Τελική επανάληψη με έμφαση στη στρατηγική εξέτασης.",
] as const;

export function GraptosDiagonismos() {
  const { openModalFor } = useNavigation();

  usePageNavigation({
    mode: "content",
    cta: { text: "Καθοδήγηση Γραπτού Διαγωνισμού", formType: "graptosDiagonismos" },
    showStickyBottom: true,
  });

  const openExamModal = (source: string) => {
    trackCtaClick("Καθοδήγηση Γραπτού Διαγωνισμού", source, {
      cta_target: "modal",
      service: "graptos_diagonismos_asep",
    });
    openModalFor("graptosDiagonismos");
  };

  return (
    <div style={{ background: D.bg }}>
      <SeoHead
        seo={{
          title: "Πανελλήνιος Γραπτός Διαγωνισμός ΑΣΕΠ",
          description: "Πληροφορίες, ύλη, σημειώσεις, mock tests και στρατηγική προετοιμασίας για τον Πανελλήνιο Γραπτό Διαγωνισμό ΑΣΕΠ.",
          canonical: `${SITE_URL}/asep/graptos-diagonismos`,
          robots: "index,follow",
          og: { type: "website" },
        }}
      />

      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(29,78,216,0.055) 100%)` }}
        />
        <div className="max-w-6xl mx-auto relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs mb-6" style={{ color: D.inkSoft }}>
            <Link to="/" className="hover:opacity-80 transition-opacity" style={{ color: D.inkSoft }}>Αρχική</Link>
            <ChevronRight size={12} />
            <Link to="/asep" className="hover:opacity-80 transition-opacity" style={{ color: D.inkSoft }}>ΑΣΕΠ</Link>
            <ChevronRight size={12} />
            <span style={{ color: D.accentStrong }}>Γραπτός Διαγωνισμός</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_360px] gap-8 items-start">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-[0.12em] uppercase mb-5"
                style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 800 }}
              >
                <Target size={14} />
                Οδηγός Προετοιμασίας
              </div>
              <h1 className="type-display-hero mb-5 max-w-4xl" style={{ color: D.ink, lineHeight: 1.08 }}>
                Πανελλήνιος Γραπτός Διαγωνισμός ΑΣΕΠ
              </h1>
              <p className="text-base md:text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.82 }}>
                Placeholder εισαγωγικό κείμενο για τη σελίδα. Εδώ θα μπει η τελική περιγραφή για την ύλη, τις σημειώσεις, τα mock tests και τη στρατηγική προετοιμασίας.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => openExamModal("written_exam_hero")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-95 active:scale-[0.99]"
                  style={{ background: D.accent, color: "#fff", fontWeight: 800, borderRadius: D.radiusControl, boxShadow: `0 8px 24px ${D.shadow}` }}
                >
                  Ζητήστε καθοδήγηση <ArrowRight size={16} />
                </button>
                <Link
                  to="/asep"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-95"
                  style={{ background: D.surfaceStrong, color: D.ink, fontWeight: 700, border: `1px solid ${D.border}`, borderRadius: D.radiusControl }}
                >
                  Πίσω στον κόμβο ΑΣΕΠ <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <aside
              className="rounded-3xl p-6"
              style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 14px 34px ${D.shadow}`, borderRadius: D.radiusShell }}
            >
              <div className="type-eyebrow mb-4" style={{ color: D.accentStrong }}>
                Placeholder πλάνο
              </div>
              <div className="space-y-3">
                {STEPS.map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                      style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 800 }}
                    >
                      {index + 1}
                    </div>
                    <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>{step}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-6 py-14" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GUIDE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <article
                  key={section.title}
                  className="rounded-3xl p-6"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusCard }}
                >
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center mb-5" style={{ background: D.accentSoft, color: D.accentStrong }}>
                    <Icon size={19} />
                  </div>
                  <h2 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1rem", lineHeight: 1.4 }}>
                    {section.title}
                  </h2>
                  <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                    {section.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div
          className="max-w-6xl mx-auto rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
          style={{ background: D.ink, color: "#fff", borderRadius: D.radiusShell }}
        >
          <div>
            <div className="type-eyebrow mb-2" style={{ color: "rgba(255,255,255,0.56)" }}>
              Υποστήριξη προετοιμασίας
            </div>
            <h2 className="type-display-section" style={{ color: "#fff", fontSize: "clamp(1.25rem, 2.4vw, 1.8rem)" }}>
              Placeholder CTA για καθοδήγηση στον γραπτό διαγωνισμό
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openExamModal("written_exam_bottom_cta")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm transition-all hover:opacity-95 active:scale-[0.99]"
            style={{ background: "#fff", color: D.ink, fontWeight: 800, borderRadius: D.radiusControl }}
          >
            Άνοιγμα φόρμας <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
