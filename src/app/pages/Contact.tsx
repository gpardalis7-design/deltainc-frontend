import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowRight, CheckCircle, Loader2, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { submitContact } from "../lib/deltaApi";
import { trackContactIntent, trackCtaClick, trackLeadFormEvent } from "../lib/analytics";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";

const interests = ["Μεταπτυχιακά", "ΑΣΕΠ", "ΟΠΣΥΔ", "Πιστοποιήσεις", "Άλλο"];
const CONTACT_PHONE_DISPLAY = "+30 694 051 9003";
const CONTACT_PHONE_LINK = "tel:+306940519003";

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

const inputStyle = {
  background: D.surfaceStrong,
  border: `1px solid ${D.border}`,
  color: D.ink,
  borderRadius: D.radiusControl,
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);
  const formInView = useInView(formRef, { margin: "-96px 0px -35% 0px" });
  const trackedViewRef = useRef(false);
  const trackedStartRef = useRef(false);

  // Configure navigation for service mode
  usePageNavigation({
    mode: "service",
    cta: { text: "Στείλτε Μήνυμα", link: "/contact" },
    showStickyBottom: false,
  });

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackLeadFormEvent("lead_form_view", {
      form_type: "contact_page",
      source_label: "Contact page",
    });
    trackedViewRef.current = true;
  }, []);

  const trackFormStart = () => {
    if (trackedStartRef.current) return;
    trackLeadFormEvent("lead_form_start", {
      form_type: "contact_page",
      source_label: "Contact page",
      interest: form.interest || undefined,
    });
    trackedStartRef.current = true;
  };

  const scrollToForm = () => {
    trackCtaClick("Στείλτε Μήνυμα", "contact_sticky_scroll", {
      cta_target: "contact_form",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.interest) {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "contact_page",
        interest: form.interest || undefined,
        source_label: "Contact page",
        error_type: "missing_required_fields",
      });
      setError("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }
    setSubmitting(true);
    setError("");
    trackLeadFormEvent("lead_form_submit", {
      form_type: "contact_page",
      subject: `Φόρμα επικοινωνίας - ${form.interest}`,
      interest: form.interest,
      source_label: "Contact page",
    });
    const result = await submitContact({
      form_type: "contact_page",
      subject: `Φόρμα επικοινωνίας - ${form.interest}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      interest: form.interest,
      message: form.message,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      submitted_at: new Date().toISOString(),
      source_label: "Contact page",
    });
    setSubmitting(false);
    if (result.success) {
      trackLeadFormEvent("lead_form_success", {
        form_type: "contact_page",
        subject: `Φόρμα επικοινωνίας - ${form.interest}`,
        interest: form.interest,
        source_label: "Contact page",
      });
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", interest: "", message: "" });
      trackedStartRef.current = false;
    } else {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "contact_page",
        subject: `Φόρμα επικοινωνίας - ${form.interest}`,
        interest: form.interest,
        source_label: "Contact page",
        error_type: "submission_failed",
      });
      setError(result.message);
    }
  };

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("contact")} />
      
      {/* Header */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(37,99,235,0.035) 100%)`,
        }} />
        <div className="absolute left-1/2 top-20 hidden h-[360px] w-[760px] -translate-x-1/2 rounded-full blur-3xl md:block pointer-events-none" style={{ background: "rgba(37,99,235,0.07)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, ${D.bg} 100%)` }} />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: D.accentSoft, borderRadius: D.radiusControl }}>
                <MessageSquare size={24} style={{ color: D.accent }} />
              </div>
              <span className="type-eyebrow inline-block px-3 py-1 rounded-full" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.25)`, color: D.accentStrong }}>
                Επικοινωνία
              </span>
            </div>
            <h1 className="type-display-hero mb-6 max-w-3xl" style={{ color: D.ink }}>
              Επικοινωνηστε μαζι μας
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Έχετε ερώτηση για μεταπτυχιακά, ΑΣΕΠ, ΟΠΣΥΔ ή πιστοποιήσεις; Η ομάδα του Delta είναι εδώ να σας βοηθήσει.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-5xl mx-auto pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: Benefits */}
            <AnimatedSection>
              <h2 className="type-display-section mb-6" style={{ color: D.ink }}>
                Γιατί να επικοινωνήσετε μαζί μας;
              </h2>
              <p className="text-sm mb-10" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                Το Delta παρέχει δωρεάν και έγκυρη εκπαιδευτική πληροφόρηση σε χιλιάδες εκπαιδευτικούς και σπουδαστές καθημερινά.
              </p>
              <div className="space-y-5">
                {[
                  { icon: CheckCircle, text: "Δωρεάν και έγκαιρη ενημέρωση", desc: "Ενημερώσεις σε πραγματικό χρόνο" },
                  { icon: Mail, text: "Έμπειρη συντακτική ομάδα", desc: "Εξειδικευμένοι editors και ερευνητές" },
                  { icon: Send, text: "Καθημερινές ανακοινώσεις", desc: "Από επίσημους φορείς (ΑΣΕΠ, ΥΠΑΙΘΑ, κλπ)" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft, borderRadius: D.radiusControl }}>
                      <item.icon size={18} style={{ color: D.accent }} />
                    </div>
                    <div>
                      <h3 className="type-ui-label mb-1" style={{ fontSize: "0.95rem", color: D.ink }}>{item.text}</h3>
                      <p className="text-xs" style={{ color: D.inkSoft }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-8 rounded-2xl p-5"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}`, borderRadius: D.radiusCard }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: D.accentSoft, borderRadius: D.radiusControl }}>
                    <Phone size={18} style={{ color: D.accent }} />
                  </div>
                  <div className="min-w-0">
                    <div className="type-ui-label mb-1" style={{ fontSize: "0.95rem", color: D.ink }}>
                      Καλέστε μας
                    </div>
                    <p className="text-xs mb-3" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                      Αν προτιμάτε άμεση επικοινωνία, μπορείτε να μιλήσετε απευθείας με την ομάδα Delta.
                    </p>
                    <a
                      href={CONTACT_PHONE_LINK}
                      onClick={() =>
                        trackContactIntent("phone", "contact_page_phone_card", {
                          phone_number: CONTACT_PHONE_DISPLAY,
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
                      style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700, borderRadius: D.radiusControl }}
                    >
                      <Phone size={14} />
                      {CONTACT_PHONE_DISPLAY}
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right: Form */}
            <AnimatedSection delay={0.1}>
              <div
                id="contact-form"
                ref={formRef}
                className="rounded-3xl p-8"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 4px 24px ${D.shadow}`, scrollMarginTop: "5.5rem", borderRadius: D.radiusShell }}
              >
                {success ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: D.accentSoft }}>
                      <CheckCircle size={28} style={{ color: D.accent }} />
                    </div>
                    <h3 className="type-display-card" style={{ color: D.ink, fontSize: "1.2rem" }}>
                      Ευχαριστούμε!
                    </h3>
                    <p className="text-sm" style={{ color: D.inkSoft }}>
                      Λάβαμε το αίτημα σας και θα επικοινωνήσουμε μαζί σας σύντομα.
                    </p>
                    <button onClick={() => setSuccess(false)} className="text-sm mt-2 px-4 py-2 rounded-xl" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 600, borderRadius: D.radiusControl }}>
                      Νέο μήνυμα
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>Ονοματεπώνυμο *</label>
                        <input type="text" value={form.name} onChange={(e) => { trackFormStart(); setForm({ ...form, name: e.target.value }); }} placeholder="Γιώργος Παπαδόπουλος" style={inputStyle}
                          onFocus={(e) => { trackFormStart(); e.currentTarget.style.borderColor = D.accentStrong; }}
                          onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>Email *</label>
                        <input type="email" value={form.email} onChange={(e) => { trackFormStart(); setForm({ ...form, email: e.target.value }); }} placeholder="email@example.com" style={inputStyle}
                          onFocus={(e) => { trackFormStart(); e.currentTarget.style.borderColor = D.accentStrong; }}
                          onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>Τηλέφωνο *</label>
                        <input type="tel" value={form.phone} onChange={(e) => { trackFormStart(); setForm({ ...form, phone: e.target.value }); }} placeholder="69XXXXXXXX" style={inputStyle}
                          onFocus={(e) => { trackFormStart(); e.currentTarget.style.borderColor = D.accentStrong; }}
                          onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>Με ενδιαφέρει *</label>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((int) => (
                            <button key={int} type="button" onClick={() => { trackFormStart(); setForm({ ...form, interest: int }); }} className="px-3 py-1.5 rounded-xl text-xs transition-all"
                              style={form.interest === int ? { background: D.accentSoft, border: `1px solid rgba(197,141,42,0.35)`, color: D.accentStrong, fontWeight: 600 } : { background: D.surface, border: `1px solid ${D.border}`, color: D.inkSoft }}
                            >{int}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: D.inkSoft, fontWeight: 600 }}>Μήνυμα</label>
                        <textarea rows={4} value={form.message} onChange={(e) => { trackFormStart(); setForm({ ...form, message: e.target.value }); }} placeholder="Πώς μπορούμε να σας βοηθήσουμε;" style={{ ...inputStyle, resize: "vertical" }}
                          onFocus={(e) => { trackFormStart(); e.currentTarget.style.borderColor = D.accentStrong; }}
                          onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
                        />
                      </div>
                    </div>

                    {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}

                    <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm transition-all disabled:opacity-60 hover:opacity-90"
                      style={{ background: D.ink, color: "#fff", fontWeight: 600, borderRadius: D.radiusControl }}
                    >
                      {submitting ? <><Loader2 size={15} className="animate-spin" /> Αποστολή...</> : "Αποστολή Μηνύματος"}
                    </button>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {!formInView && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 lg:hidden"
            style={{
              background: `linear-gradient(to top, ${D.bg} 60%, transparent)`,
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={scrollToForm}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm transition-all active:scale-95"
              style={{
                background: D.ink,
                color: "#fff",
                fontWeight: 700,
                boxShadow: `0 4px 20px ${D.shadow}`,
                minHeight: "48px",
                borderRadius: D.radiusControl,
              }}
            >
              Στείλτε Μήνυμα <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
