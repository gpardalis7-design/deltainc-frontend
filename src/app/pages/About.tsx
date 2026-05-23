import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { submitContact, MOCK_HUBS } from "../lib/deltaApi";
import { trackLeadFormEvent } from "../lib/analytics";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";

const interests = ["Μεταπτυχιακά", "ΑΣΕΠ", "ΟΠΣΥΔ", "Πιστοποιήσεις", "Άλλο"];

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
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

export function About() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const trackedViewRef = useRef(false);
  const trackedStartRef = useRef(false);

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackLeadFormEvent("lead_form_view", {
      form_type: "about_page",
      source_label: "About page",
    });
    trackedViewRef.current = true;
  }, []);

  const trackFormStart = () => {
    if (trackedStartRef.current) return;
    trackLeadFormEvent("lead_form_start", {
      form_type: "about_page",
      source_label: "About page",
      interest: form.interest || undefined,
    });
    trackedStartRef.current = true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.interest) {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "about_page",
        interest: form.interest || undefined,
        source_label: "About page",
        error_type: "missing_required_fields",
      });
      setError("Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία.");
      return;
    }
    setSubmitting(true);
    setError("");
    trackLeadFormEvent("lead_form_submit", {
      form_type: "about_page",
      subject: `Φόρμα επικοινωνίας - ${form.interest}`,
      interest: form.interest,
      source_label: "About page",
    });
    const result = await submitContact({
      form_type: "about_page",
      subject: `Φόρμα επικοινωνίας - ${form.interest}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      interest: form.interest,
      message: form.message,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      submitted_at: new Date().toISOString(),
      source_label: "About page",
    });
    setSubmitting(false);
    if (result.success) {
      trackLeadFormEvent("lead_form_success", {
        form_type: "about_page",
        subject: `Φόρμα επικοινωνίας - ${form.interest}`,
        interest: form.interest,
        source_label: "About page",
      });
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", interest: "", message: "" });
      trackedStartRef.current = false;
    } else {
      trackLeadFormEvent("lead_form_failure", {
        form_type: "about_page",
        subject: `Φόρμα επικοινωνίας - ${form.interest}`,
        interest: form.interest,
        source_label: "About page",
        error_type: "submission_failed",
      });
      setError(result.message);
    }
  };

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("about")} />
      {/* Header */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(37,99,235,0.035) 100%)`,
        }} />
        <div className="absolute left-1/2 top-20 hidden h-[360px] w-[760px] -translate-x-1/2 rounded-full blur-3xl md:block pointer-events-none" style={{ background: "rgba(37,99,235,0.07)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent 0%, ${D.bg} 100%)` }} />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-block px-3 py-1 rounded-full text-xs mb-6 tracking-widest uppercase" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.25)`, color: D.accentStrong }}>
              Σχετικά
            </span>
            <h1 className="type-display-hero mb-6 max-w-3xl" style={{ color: D.ink }}>
              Ποιοι είμαστε
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Το Delta Inc είναι η κορυφαία πλατφόρμα εκπαιδευτικής ενημέρωσης στην Ελλάδα. Παρέχουμε έγκυρους οδηγούς για ΑΣΕΠ, ΟΠΣΥΔ, μεταπτυχιακά και πιστοποιήσεις.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-5xl mx-auto pt-16">
          <AnimatedSection>
            <div className="rounded-3xl p-10 md:p-14 text-center" style={{ background: D.ink }}>
              <div className="text-xs mb-5 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Αποστολή</div>
              <blockquote className="type-display-section" style={{ color: "#fff", lineHeight: 1.4, maxWidth: "700px", margin: "0 auto", fontSize: "clamp(1.2rem, 3vw, 2rem)" }}>
                "Να παρέχουμε έγκυρη, κατανοητή και δωρεάν εκπαιδευτική πληροφόρηση σε κάθε εκπαιδευτικό και σπουδαστή στην Ελλάδα."
              </blockquote>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: D.accent }}>
                  <span className="type-ui-label" style={{ color: D.ink, fontSize: "13px" }}>Δ</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>Delta Editorial Team</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What we cover */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-5xl mx-auto pt-16">
          <AnimatedSection>
            <h2 className="type-display-section mb-10" style={{ color: D.ink }}>
              Τι καλύπτουμε
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MOCK_HUBS.map((hub, i) => (
              <AnimatedSection key={hub.id} delay={i * 0.07}>
                <div className="p-7 rounded-3xl" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 2px 12px ${D.shadow}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: D.accentSoft }}>
                      <span className="type-ui-label" style={{ color: D.accentStrong, fontSize: "1.1rem" }}>{hub.name.charAt(0)}</span>
                    </div>
                    <Link to={hub.slug === "metaptyxiaka" ? "/courses" : `/blog?hub=${hub.slug}`} className="text-xs flex items-center gap-1" style={{ color: D.accent }}>
                      Εξερεύνηση <ArrowRight size={12} />
                    </Link>
                  </div>
                  <h3 className="type-display-card mb-2" style={{ color: D.ink, fontSize: "1.05rem" }}>{hub.name}</h3>
                  <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>{hub.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* API info */}
      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}`, background: D.surface }}>
        <div className="max-w-5xl mx-auto pt-16">
          <AnimatedSection>
            <h2 className="type-display-section mb-6" style={{ color: D.ink, fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>
              Delta API v1
            </h2>
            <p className="text-sm mb-8" style={{ color: D.inkSoft, lineHeight: 1.7, maxWidth: "600px" }}>
              Το frontend αυτής της πλατφόρμας καταναλώνει δεδομένα μέσω του κανονικοποιημένου Delta API, το οποίο είναι χτισμένο πάνω σε WordPress backend.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { method: "GET", path: "/posts", desc: "Λίστα άρθρων με φιλτράρισμα κατά hub, κατηγορία, αναζήτηση" },
              { method: "GET", path: "/programs", desc: "Μεταπτυχιακά προγράμματα με φίλτρα πόλης, τρόπου, πανεπιστημίου" },
              { method: "GET", path: "/homepage", desc: "Συγκεντρωτικό payload για αρχική σελίδα" },
              { method: "GET", path: "/hubs", desc: "Λίστα editorial hubs (ΟΠΣΥΔ, ΑΣΕΠ, Μεταπτυχιακά, κλπ)" },
              { method: "GET", path: "/navigation", desc: "Δυναμικά στοιχεία πλοήγησης header/footer" },
              { method: "GET", path: "/posts/:slug", desc: "Πλήρες άρθρο με related posts και SEO metadata" },
              { method: "POST", path: "/contact", desc: "Υποβολή φόρμας επικοινωνίας" },
            ].map((ep) => (
              <AnimatedSection key={ep.path}>
                <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}` }}>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-xs" style={{
                    background: ep.method === "GET" ? "rgba(8,145,178,0.1)" : "rgba(5,150,105,0.1)",
                    color: ep.method === "GET" ? "#0891b2" : "#059669",
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}>{ep.method}</span>
                  <div>
                    <code className="text-sm" style={{ color: D.ink, fontFamily: "monospace" }}>{ep.path}</code>
                    <p className="text-xs mt-1" style={{ color: D.inkSoft }}>{ep.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={0.1}>
            <div className="mt-4 px-4 py-3 rounded-xl text-xs" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.2)` }}>
              <span style={{ color: D.accentStrong, fontWeight: 600 }}>Base URL: </span>
              <code style={{ color: D.accentStrong, fontFamily: "monospace" }}>https://deltainc.gr/wp-json/delta/v1</code>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Form — POST /contact */}
      <section className="px-6 py-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimatedSection>
              <span className="inline-block px-3 py-1 rounded-full text-xs mb-5 tracking-widest uppercase" style={{ background: D.accentSoft, border: `1px solid rgba(197,141,42,0.25)`, color: D.accentStrong }}>
                POST /contact
              </span>
              <h2 className="type-display-section mb-4" style={{ color: D.ink }}>
                Επικοινωνήστε μαζί μας
              </h2>
              <p className="text-sm mb-8" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                Έχετε ερώτηση για μεταπτυχιακά, ΑΣΕΠ, ΟΠΣΥΔ ή πιστοποιήσεις; Η ομάδα μας είναι εδώ να σας βοηθήσει.
              </p>
              <div className="space-y-4">
                {[
                  "Δωρεάν και έγκαιρη ενημέρωση",
                  "Έμπειρη συντακτική ομάδα",
                  "Καθημερινές ανακοινώσεις από επίσημους φορείς",
                  "Αξιόπιστοι οδηγοί ΑΣΕΠ & ΟΠΣΥΔ",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm" style={{ color: D.inkSoft }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: D.accentSoft }}>
                      <CheckCircle size={12} style={{ color: D.accent }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="rounded-3xl p-8" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 4px 24px ${D.shadow}` }}>
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
                    <button onClick={() => setSuccess(false)} className="text-sm mt-2" style={{ color: D.accent, fontWeight: 600 }}>
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
                      style={{ background: D.ink, color: "#fff", fontWeight: 600 }}
                    >
                      {submitting ? <><Loader2 size={15} className="animate-spin" /> Αποστολή...</> : "Αποστολή Μηνύματος"}
                    </button>

                    <p className="text-xs text-center" style={{ color: "rgba(19,35,58,0.4)" }}>
                      Υποβάλλεται στο <code style={{ fontFamily: "monospace" }}>POST /contact</code>
                    </p>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
