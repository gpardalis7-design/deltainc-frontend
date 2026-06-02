import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, Calculator, Clock3, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { useRef } from "react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";

const UPCOMING_TOOLS = [
  {
    title: "Υπολογισμός Μισθού",
    summary: "Ένα πιο πρακτικό εργαλείο για γρήγορη εκτίμηση καθαρών αποδοχών και βασικών παραμέτρων εργασίας.",
    audience: "Ευρύτερο κοινό",
    lane: "Utility",
  },
  {
    title: "Checklist Εγγράφων",
    summary: "Οργανωμένες λίστες για αιτήσεις, υποβολές και δικαιολογητικά χωρίς να χάνετε κρίσιμα βήματα.",
    audience: "Σπουδές & εργασία",
    lane: "Workflow",
  },
  {
    title: "Προθεσμίες & Υπενθυμίσεις",
    summary: "Ένα πιο καθαρό σημείο παρακολούθησης βασικών deadlines, εξετάσεων και σημαντικών ενεργειών.",
    audience: "Καθημερινή οργάνωση",
    lane: "Planning",
  },
  {
    title: "Σύγκριση Επιλογών",
    summary: "Σύντομο εργαλείο αξιολόγησης σεναρίων, ώστε να βλέπετε γρήγορα διαφορές μεταξύ δύο επιλογών.",
    audience: "Αποφάσεις & planning",
    lane: "Decision support",
  },
] as const;

const DELTA_APPS_PRINCIPLES = [
  {
    title: "Σοβαρότητα στη λογική",
    body: "Τα εργαλεία σχεδιάζονται για καθαρή πρακτική χρήση, όχι για εντυπωσιασμό χωρίς ουσία.",
    icon: ShieldCheck,
  },
  {
    title: "Χρήσιμα σε πραγματικό χρόνο",
    body: "Ο στόχος είναι να λύνουν άμεσα μικρά αλλά σημαντικά προβλήματα σε σπουδές, εργασία και καθημερινότητα.",
    icon: Clock3,
  },
  {
    title: "Μοντέρνα εμπειρία",
    body: "Το Delta Apps κρατά την αξιοπιστία του brand, αλλά με πιο product-first, πιο σύγχρονη αίσθηση.",
    icon: Sparkles,
  },
] as const;

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function DeltaApps() {
  usePageNavigation({
    mode: "content",
    cta: { text: "", link: "" },
    showStickyBottom: false,
  });

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("deltaApps")} />

      <section className="pt-36 pb-18 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 64%, rgba(29,78,216,0.055) 100%)`,
          }}
        />
        <div
          className="absolute left-[12%] top-28 hidden h-64 w-64 rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(29,78,216,0.09)" }}
        />
        <div
          className="absolute right-[8%] top-24 hidden h-72 w-72 rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(15,23,42,0.05)" }}
        />
        <div className="max-w-6xl mx-auto relative">
          <AnimatedSection>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: D.accentSoft, border: "1px solid rgba(29,78,216,0.14)" }}
              >
                <Layers3 size={16} style={{ color: D.accentStrong }} />
                <span className="type-eyebrow" style={{ color: D.accentStrong }}>Delta Apps</span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] tracking-[0.12em] uppercase"
                style={{ background: "rgba(15,23,42,0.06)", color: D.inkSoft, fontWeight: 700 }}
              >
                Νέο
              </div>
            </div>

            <div className="max-w-5xl">
                <h1 className="type-display-hero max-w-4xl mb-5" style={{ color: D.ink }}>
                  Ψηφιακά εργαλεία με τη σοβαρότητα του Delta και μια πιο σύγχρονη product εμπειρία
                </h1>
                <p className="text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.82 }}>
                  Το Delta Apps είναι η νέα ομπρέλα πρακτικών εργαλείων του Delta για σπουδές, εργασία και καθημερινές αποφάσεις.
                  Ξεκινάμε με focused utilities και επεκτεινόμαστε σταδιακά σε ένα πιο ευρύ οικοσύστημα χρήσιμων εφαρμογών.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/delta-apps/moria-calculator"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white transition-all hover:opacity-95"
                    style={{ background: D.ink, fontWeight: 700, boxShadow: `0 6px 20px ${D.shadow}`, borderRadius: D.radiusControl }}
                  >
                    Δοκιμάστε το πρώτο εργαλείο <ArrowRight size={16} />
                  </Link>
                  <a
                    href="#apps-roadmap"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all hover:opacity-95"
                    style={{ background: D.surfaceStrong, color: D.ink, fontWeight: 700, border: `1px solid ${D.border}`, borderRadius: D.radiusControl }}
                  >
                    Τι έρχεται <ArrowRight size={16} />
                  </a>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                  {[
                    { label: "Launch format", value: "Hub + working tools" },
                    { label: "Positioning", value: "Utility-first Delta layer" },
                    { label: "Audience", value: "Σπουδές, εργασία, καθημερινότητα" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl px-4 py-4"
                      style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusCard }}
                    >
                      <div className="text-[11px] uppercase tracking-[0.14em] mb-2" style={{ color: D.inkSoft, fontWeight: 700 }}>
                        {item.label}
                      </div>
                      <div className="text-sm md:text-[15px]" style={{ color: D.ink, fontWeight: 700, lineHeight: 1.5 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="featured-tool" className="px-6 pb-18">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div
              className="rounded-[2rem] p-6 md:p-7"
              style={{
                background: D.surfaceStrong,
                border: `1px solid ${D.border}`,
                boxShadow: `0 12px 30px ${D.shadow}`,
                borderRadius: D.radiusShell,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_320px] gap-6 items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                      <Calculator size={14} />
                      Πρώτο εργαλείο
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs" style={{ background: "rgba(22,163,74,0.10)", color: "#166534", fontWeight: 700 }}>
                      Διαθέσιμο τώρα
                    </span>
                  </div>
                  <h2 className="type-display-section mb-3" style={{ color: D.ink, fontSize: "clamp(1.55rem, 3.2vw, 2.35rem)" }}>
                    Μόρια Calculator
                  </h2>
                  <p className="text-base max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                    Το πρώτο tool του Delta Apps προσφέρει γρήγορο, καθαρό υπολογισμό μορίων, ώστε να έχετε μία πιο πρακτική εικόνα χωρίς να ψάχνετε διάσπαρτες πληροφορίες.
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "Χρήση", value: "Γρήγορη εκτίμηση" },
                      { label: "Στόχος", value: "Λιγότερη ασάφεια" },
                      { label: "Μορφή", value: "Καθαρό step-by-step flow" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl px-4 py-4"
                        style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
                      >
                        <div className="text-xs uppercase tracking-[0.12em] mb-2" style={{ color: D.inkSoft, fontWeight: 700 }}>
                          {item.label}
                        </div>
                        <div className="text-sm md:text-base" style={{ color: D.ink, fontWeight: 700 }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm" style={{ background: D.bg, border: `1px solid ${D.border}`, color: D.inkSoft }}>
                      <span style={{ fontWeight: 700, color: D.ink }}>Flow:</span> input → έλεγχος → αποτέλεσμα
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm" style={{ background: D.bg, border: `1px solid ${D.border}`, color: D.inkSoft }}>
                      <span style={{ fontWeight: 700, color: D.ink }}>Tone:</span> premium αλλά πρακτικό
                    </div>
                    <Link
                      to="/delta-apps/moria-calculator"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-90"
                      style={{ background: D.ink, color: "#fff", fontWeight: 700, borderRadius: D.radiusPill }}
                    >
                      Άνοιγμα εργαλείου <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] p-5"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    color: D.ink,
                    border: `1px solid ${D.border}`,
                    boxShadow: `0 8px 20px ${D.shadow}`,
                    borderRadius: D.radiusCard,
                  }}
                >
                  <div className="type-eyebrow mb-3" style={{ color: D.inkSoft }}>Featured tool</div>
                  <div className="space-y-3">
                    {[
                      { label: "Mode", value: "Live calculator" },
                      { label: "Use case", value: "Γρήγορη εκτίμηση μορίων" },
                      { label: "Output", value: "Συνολικό αποτέλεσμα + breakdown" },
                      { label: "Status", value: "Διαθέσιμο τώρα" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-4 rounded-xl px-3.5 py-3"
                        style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                      >
                        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: D.inkSoft, fontWeight: 700 }}>
                          {item.label}
                        </span>
                        <span className="text-sm text-right" style={{ color: D.ink, fontWeight: 700 }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="apps-roadmap" className="px-6 pb-18">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="max-w-3xl mb-8">
              <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Τι έρχεται</div>
              <h2 className="type-display-section mb-3" style={{ color: D.ink, fontSize: "clamp(1.45rem, 3vw, 2.1rem)" }}>
                Ένα hub που θα ανοίγει σταδιακά σε ευρύτερο κοινό
              </h2>
              <p className="text-base" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                Τα πρώτα εργαλεία συνδέονται φυσικά με το υπάρχον κοινό της Delta, αλλά ο σχεδιασμός τους στοχεύει σε πιο ευρύτερη πρακτική αξία.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.04}>
            <div
              className="hidden md:grid grid-cols-[minmax(0,1.15fr)_140px_170px_140px] gap-4 px-4 pb-3 mb-3"
              style={{ borderBottom: `1px solid ${D.border}` }}
            >
              {["Tool", "Category", "Audience", "Status"].map((label) => (
                <div
                  key={label}
                  className="text-[11px] uppercase tracking-[0.14em]"
                  style={{ color: D.inkSoft, fontWeight: 700 }}
                >
                  {label}
                </div>
              ))}
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-3">
            {UPCOMING_TOOLS.map((tool, index) => (
              <AnimatedSection key={tool.title} delay={index * 0.05}>
                <div
                  className="rounded-[1.5rem] px-4 py-4 md:px-5"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${D.border}`,
                    boxShadow: `0 6px 18px rgba(15,23,42,0.05)`,
                    borderRadius: D.radiusCard,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_140px_170px_140px] gap-4 items-start md:items-center">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.12em] mb-2 md:hidden" style={{ color: D.inkSoft, fontWeight: 700 }}>
                        Tool
                      </div>
                      <h3 className="type-display-card mb-1.5" style={{ color: D.ink, fontSize: "1.02rem" }}>
                        {tool.title}
                      </h3>
                      <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                        {tool.summary}
                      </p>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.12em] mb-2 md:hidden" style={{ color: D.inkSoft, fontWeight: 700 }}>
                        Category
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase" style={{ background: "rgba(15,23,42,0.06)", color: D.inkSoft, fontWeight: 700 }}>
                        {tool.lane}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.12em] mb-2 md:hidden" style={{ color: D.inkSoft, fontWeight: 700 }}>
                        Audience
                      </div>
                      <div className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>
                        {tool.audience}
                      </div>
                    </div>

                    <div className="md:text-right">
                      <div className="text-[11px] uppercase tracking-[0.12em] mb-2 md:hidden" style={{ color: D.inkSoft, fontWeight: 700 }}>
                        Status
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                        Coming soon
                      </span>
                      <div className="text-[11px] mt-2" style={{ color: D.inkSoft, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Phase 1
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-18">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DELTA_APPS_PRINCIPLES.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <AnimatedSection key={principle.title} delay={index * 0.05}>
                  <div
                    className="rounded-[1.75rem] p-6 h-full"
                    style={{
                      background: "rgba(255,255,255,0.82)",
                      border: `1px solid ${D.border}`,
                      boxShadow: `0 8px 24px ${D.shadow}`,
                      backdropFilter: "blur(12px)",
                      borderRadius: D.radiusCard,
                    }}
                  >
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: D.accentSoft, color: D.accentStrong, borderRadius: D.radiusControl }}>
                      <Icon size={19} />
                    </div>
                    <h3 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1.05rem" }}>
                      {principle.title}
                    </h3>
                    <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.72 }}>
                      {principle.body}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div
              className="rounded-[2.1rem] p-7 md:p-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8 items-center"
              style={{
                background: D.surfaceStrong,
                border: `1px solid ${D.border}`,
                boxShadow: `0 14px 34px ${D.shadow}`,
                borderRadius: D.radiusShell,
              }}
            >
              <div>
                <div className="type-eyebrow mb-3" style={{ color: D.inkSoft }}>Γιατί Delta Apps</div>
                <h2 className="type-display-section mb-4" style={{ color: D.ink, fontSize: "clamp(1.5rem, 3vw, 2.15rem)" }}>
                  Το επόμενο βήμα δεν είναι μόνο περισσότερο περιεχόμενο. Είναι πιο χρήσιμα εργαλεία.
                </h2>
                <p className="text-base max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                  Η Delta χτίζει σταδιακά ένα νέο layer πρακτικής αξίας: λιγότερη αβεβαιότητα, πιο καθαρή απόφαση και πιο άμεση βοήθεια μέσα από σύγχρονα utilities με προσεγμένη εμπειρία.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-white transition-all hover:opacity-95"
                  style={{ background: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  Προτείνετε ιδέα εργαλείου <ArrowRight size={16} />
                </Link>
                <span className="text-sm text-center" style={{ color: D.inkSoft }}>
                  Θέλουμε τα επόμενα tools να λύνουν αληθινά καθημερινά προβλήματα.
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
