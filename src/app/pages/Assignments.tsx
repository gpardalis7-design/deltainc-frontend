import { useState } from "react";
import { Link } from "react-router";
import { CalendarDays, CheckCircle2, FileText, Languages, PenSquare, UploadCloud } from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";

const ASSIGNMENTS_ENDPOINT = "https://deltainc.gr/wp-json/delta/v1/assignment-request";
const WRITING_LANGUAGES = ["Ελληνικά", "Αγγλικά"] as const;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx", ".zip"] as const;

const SPECIALTY_OPTIONS = [
  "ΕΛΠ – ΕΠΟ – ΟΡΘ – ΔΠΜ – ΔΙΣ",
  "ΕΚΠ – ΕΚΕ – ΕΤΑ – ΕΑΓ – ΔΠΜ",
  "ΔΜΥ – ΔΕΟ – ΤΡΑ – ΤΑΧ – ΔΤΕ – ΜΒΑ – ΤΟΙΚ – ΔΗΔ – ΓΧΝ",
  "ΔΧΤ – ΔΙΑ – ΔΙΠ – ΣΜΑ – ΕΠΑ – ΔΙΠΠ",
  "ΦΥΕ – ΚΦΕ – ΜΣΜ",
  "Πληροφορικής – ΠΛΗ – ΠΛΣ",
  "ΓΑΛ – ΙΣΠ – ΓΕΡ",
  "Οικ/κες – Διοίκηση – Λογιστική – Χρημ/κα",
  "Marketing – Management – Τουριστικά",
  "Στατιστικές – SPSS – Eviews κ.α.",
  "Ψυχολογία – Φιλολογικές – Θεολογικές",
  "Νομικής",
  "Κοινωνικές – Πολιτικές Επιστήμες",
  "Παιδαγωγικά – Εκπαίδευση Ενηλίκων",
  "Ιατρική – Νοσηλευτική – Βιολογία",
  "Κατατακτήριες Εξετάσεις",
  "Μαθηματικά – Φυσική – Χημεία",
  "Πολιτικοί μηχανικοί – Τοπογράφοι – Αρχιτέκτονες",
  "Ηλεκτρολόγοι – Μηχανολόγοι Μηχανικοί",
  "Γεωλογία – Γεωπονία – Ζωικής και Φυτικής Παραγωγής",
  "Λοιπές σχολές",
  "Ξενόγλωσσες",
  "Μετάφραση",
  "Ναυτιλιακά – Εμποροπλοιάρχων",
  "Βιογραφικό",
] as const;

const COLLABORATION_STEPS = [
  {
    title: "Σωστή συμπλήρωση της φόρμας",
    body: "Για να λάβετε ακριβή κοστολόγηση, συμπληρώστε όλα τα πεδία και επισυνάψτε οδηγίες, πρότυπα ή παραδείγματα που επηρεάζουν το εύρος της εργασίας.",
  },
  {
    title: "Έναρξη συνεργασίας με προκαταβολή",
    body: "Η συνεργασία ενεργοποιείται με προκαταβολή από 20€. Αμέσως μετά, το αίτημα ανατίθεται στον κατάλληλο συνεργάτη με βάση το αντικείμενο και τον χρόνο παράδοσης.",
  },
  {
    title: "Συνεχής ενημέρωση στη διάρκεια της διαδικασίας",
    body: "Λαμβάνετε ενημερώσεις σε κάθε βασικό στάδιο και μπορείτε να προσθέτετε διευκρινίσεις ή συμπληρωματικές οδηγίες όπου χρειάζεται.",
  },
  {
    title: "Τελική παράδοση και πλήρη δικαιώματα",
    body: "Με την ολοκλήρωση της τελικής πληρωμής παραδίδεται το πλήρες αρχείο και μεταβιβάζονται όλα τα πνευματικά δικαιώματα της τελικής εργασίας.",
  },
  {
    title: "Δωρεάν διορθώσεις για 30 ημέρες",
    body: "Προσφέρονται δωρεάν μικρές διορθώσεις και βελτιώσεις για διάστημα 30 ημερών μετά την παράδοση, ώστε το τελικό αποτέλεσμα να παραμείνει πλήρως λειτουργικό για τη χρήση σας.",
  },
] as const;

const inputStyle = {
  background: D.surfaceStrong,
  border: `1px solid ${D.border}`,
  color: D.ink,
  borderRadius: D.radiusControl,
  padding: "0.9rem 1rem",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
} as const;

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

export function Assignments() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    language: "",
    subject: "",
    specialty: "",
    deadline: "",
    instructions: "",
  });

  usePageNavigation({
    mode: "service",
    cta: { text: "", link: "" },
    showStickyBottom: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privacyConsent) {
      setSubmitState({
        type: "error",
        message: "Απαιτείται αποδοχή της πολιτικής απορρήτου για να σταλεί το αίτημα.",
      });
      return;
    }

    const combinedFileSize = selectedFiles.reduce((total, file) => total + file.size, 0);

    if (selectedFiles.length > MAX_FILE_COUNT) {
      setSubmitState({
        type: "error",
        message: "Μπορείτε να ανεβάσετε έως 10 αρχεία.",
      });
      return;
    }

    if (combinedFileSize > MAX_FILE_SIZE_BYTES) {
      setSubmitState({
        type: "error",
        message: "Το συνολικό μέγεθος των αρχείων ξεπερνά το όριο των 25MB.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState(null);

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("email", form.email.trim());
    payload.append("phone", form.phone.trim());
    payload.append("language", form.language);
    payload.append("subject", form.subject.trim());
    payload.append("specialty", form.specialty);
    payload.append("deadline", form.deadline);
    payload.append("instructions", form.instructions.trim());
    payload.append("privacy_consent", "1");

    selectedFiles.forEach((file) => {
      payload.append("files[]", file);
    });

    try {
      const response = await fetch(ASSIGNMENTS_ENDPOINT, {
        method: "POST",
        body: payload,
      });

      const data = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Η αποστολή δεν ολοκληρώθηκε. Παρακαλώ δοκιμάστε ξανά.");
      }

      setSubmitState({
        type: "success",
        message: data.message || "Το αίτημά σας στάλθηκε επιτυχώς.",
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        language: "",
        subject: "",
        specialty: "",
        deadline: "",
        instructions: "",
      });
      setSelectedFiles([]);
      setPrivacyConsent(false);
    } catch (error) {
      setSubmitState({
        type: "error",
        message: error instanceof Error ? error.message : "Προέκυψε πρόβλημα κατά την αποστολή του αιτήματος.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    const nextFiles = Array.from(files);

    if (nextFiles.length > MAX_FILE_COUNT) {
      setSelectedFiles([]);
      setSubmitState({
        type: "error",
        message: "Μπορείτε να ανεβάσετε έως 10 αρχεία.",
      });
      return;
    }

    const hasInvalidExtension = nextFiles.some((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      return !ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
    });

    if (hasInvalidExtension) {
      setSelectedFiles([]);
      setSubmitState({
        type: "error",
        message: "Επιτρέπονται μόνο αρχεία PDF, DOC, DOCX και ZIP.",
      });
      return;
    }

    const combinedSize = nextFiles.reduce((total, file) => total + file.size, 0);

    if (combinedSize > MAX_FILE_SIZE_BYTES) {
      setSelectedFiles([]);
      setSubmitState({
        type: "error",
        message: "Το συνολικό μέγεθος των αρχείων ξεπερνά το όριο των 25MB.",
      });
      return;
    }

    setSubmitState(null);
    setSelectedFiles(nextFiles);
  };

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("assignments")} />

      <section className="pt-36 pb-16 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 72%, rgba(37,99,235,0.035) 100%)`,
          }}
        />
        <div
          className="absolute left-1/2 top-20 hidden h-[360px] w-[760px] -translate-x-1/2 rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(37,99,235,0.07)" }}
        />
        <div
          className="absolute right-[-120px] top-28 hidden h-[420px] w-[420px] rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(15,23,42,0.045)" }}
        />
        <div className="max-w-6xl mx-auto relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: D.accentSoft, border: `1px solid rgba(29,78,216,0.14)` }}>
              <PenSquare size={16} style={{ color: D.accentStrong }} />
              <span className="type-eyebrow" style={{ color: D.accentStrong }}>Ανάθεση & Κοστολόγηση</span>
            </div>
            <h1 className="type-display-hero mb-5 max-w-4xl" style={{ color: D.ink }}>
              Κοστολόγηση Εργασίας
            </h1>
            <p className="text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
              Συμπληρώστε τα βασικά στοιχεία της εργασίας σας για να διαμορφωθεί μια καθαρή πρώτη εικόνα κόστους, χρόνου και κατάλληλης ειδικότητας. Με την αποστολή, το αίτημα προωθείται στην ομάδα Delta για αρχική αξιολόγηση και επικοινωνία.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_360px] gap-8 items-start">
          <AnimatedSection>
            <div className="rounded-[2rem] p-6 md:p-8" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 10px 28px ${D.shadow}`, borderRadius: D.radiusShell }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
                <div>
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Φόρμα Κοστολόγησης</div>
                  <h2 className="type-display-section" style={{ color: D.ink, fontSize: "1.45rem" }}>
                    Συμπληρώστε τα βασικά στοιχεία
                  </h2>
                </div>
                <div className="text-xs px-3 py-2 rounded-full self-start md:self-auto" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                  PDF, DOC, DOCX, ZIP έως 25MB
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Ονομα">
                    <input required value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Το ονοματεπώνυμό σας" style={inputStyle} />
                  </Field>
                  <Field label="Email">
                    <input required type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="name@example.com" style={inputStyle} />
                  </Field>
                  <Field label="Τηλέφωνο">
                    <input required value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+30 69..." style={inputStyle} />
                  </Field>
                  <Field label="Γλώσσα συγγραφής">
                    <select required value={form.language} onChange={(e) => handleChange("language", e.target.value)} style={inputStyle}>
                      <option value="">Επιλέξτε γλώσσα</option>
                      {WRITING_LANGUAGES.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.95fr)] gap-4">
                  <Field label="Θέμα">
                    <input required value={form.subject} onChange={(e) => handleChange("subject", e.target.value)} placeholder="Τίτλος ή σύντομη περιγραφή θέματος" style={inputStyle} />
                  </Field>
                  <Field label="Ειδικότητα">
                    <select required value={form.specialty} onChange={(e) => handleChange("specialty", e.target.value)} style={inputStyle}>
                      <option value="">Επιλέξτε ειδικότητα</option>
                      {SPECIALTY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Ημερομηνία Παράδοσης" icon={<CalendarDays size={16} style={{ color: D.accentStrong }} />}>
                    <input required type="date" value={form.deadline} onChange={(e) => handleChange("deadline", e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Αρχείο" icon={<UploadCloud size={16} style={{ color: D.accentStrong }} />}>
                    <label
                      className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 cursor-pointer"
                      style={{ ...inputStyle, display: "flex", borderRadius: D.radiusCard }}
                    >
                      <span style={{ color: selectedFiles.length > 0 ? D.ink : D.inkSoft }}>
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} αρχεία επιλεγμένα`
                          : "Επιλέξτε αρχεία προς επισύναψη"}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                        Upload
                      </span>
                      <input
                        type="file"
                        accept={ALLOWED_FILE_EXTENSIONS.join(",")}
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files)}
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                            style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                          >
                            <span className="text-sm truncate" style={{ color: D.ink, maxWidth: "78%" }}>
                              {file.name}
                            </span>
                            <span className="text-xs" style={{ color: D.inkSoft, whiteSpace: "nowrap" }}>
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-2" style={{ color: D.inkSoft }}>
                      Υποστηρίζονται έως 10 αρχεία `PDF`, `DOC`, `DOCX` και `ZIP` με συνολικό μέγεθος έως 25MB.
                    </p>
                  </Field>
                </div>

                <Field label="Οδηγίες για writers" icon={<FileText size={16} style={{ color: D.accentStrong }} />}>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => handleChange("instructions", e.target.value)}
                    placeholder="Προσθέστε σύντομες οδηγίες, μεθοδολογία, πρότυπο citation, παρατηρήσεις ή οτιδήποτε είναι κρίσιμο για την εκτίμηση."
                    rows={6}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>

                <label className="flex items-start gap-3 rounded-2xl p-4" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}>
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    style={{ marginTop: 4, accentColor: D.accentStrong }}
                  />
                  <span className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                    Έχω διαβάσει και αποδέχομαι την{" "}
                    <Link to="/privacy-policy" className="underline" style={{ color: D.accentStrong, fontWeight: 700 }}>
                      Πολιτική Απορρήτου
                    </Link>{" "}
                    και συναινώ στην επεξεργασία των στοιχείων μου για την αξιολόγηση του αιτήματος.
                  </span>
                </label>

                <div className="pt-2">
                  {submitState && (
                    <div
                      className="mb-4 rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: submitState.type === "success" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                        border: `1px solid ${submitState.type === "success" ? "rgba(22,163,74,0.18)" : "rgba(220,38,38,0.18)"}`,
                        color: submitState.type === "success" ? "#166534" : "#b91c1c",
                        lineHeight: 1.6,
                        borderRadius: D.radiusCard,
                      }}
                    >
                      {submitState.message}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white transition-all w-full md:w-auto disabled:cursor-not-allowed"
                    style={{ background: D.ink, fontWeight: 700, fontSize: "1rem", boxShadow: `0 4px 20px ${D.shadow}`, minHeight: "56px", opacity: isSubmitting ? 0.72 : 1, borderRadius: D.radiusControl }}
                  >
                    {isSubmitting ? "Αποστολή..." : "Υποβολή"}
                  </button>
                  <p className="text-xs mt-3" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                    Η φόρμα αποστέλλει τα στοιχεία σας στην ομάδα Delta και θα λάβετε απάντηση στο email ή στο τηλέφωνο που δηλώσατε.
                  </p>
                </div>
              </form>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.08}>
            <aside className="rounded-[2rem] p-6 sticky top-28" style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${D.border}`, boxShadow: `0 10px 28px ${D.shadow}`, backdropFilter: "blur(12px)", borderRadius: D.radiusShell }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: D.accentSoft, color: D.accentStrong }}>
                <Languages size={15} />
                <span className="text-xs font-semibold tracking-[0.08em] uppercase">Πριν υποβάλετε</span>
              </div>
              <h3 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1.05rem" }}>
                Τι βοηθά μια πιο ακριβή κοστολόγηση
              </h3>
              <div className="space-y-3">
                {[
                  "Σαφής τίτλος ή θέμα εργασίας",
                  "Επιλογή σωστής ειδικότητας και γλώσσας συγγραφής",
                  "Ημερομηνία παράδοσης με ρεαλιστικό χρονικό περιθώριο",
                  "Επισύναψη προτύπων, οδηγιών ή σχετικών αρχείων",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} style={{ color: D.accentStrong, flexShrink: 0, marginTop: 2 }} />
                    <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </AnimatedSection>
        </div>
      </section>

      <section className="px-6 pb-20" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-6xl mx-auto pt-16">
          <AnimatedSection>
            <div className="max-w-3xl mb-10">
              <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Διαδικασία Συνεργασίας</div>
              <h2 className="type-display-section mb-3" style={{ color: D.ink, fontSize: "clamp(1.45rem, 3vw, 2.1rem)" }}>
                Πριν ξεκινήσεις
              </h2>
              <p className="text-base" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                💡 Όλα όσα χρειάζεται να γνωρίζετε για να κυλήσει η συνεργασία ομαλά, χωρίς καθυστερήσεις και χωρίς ασάφειες στο τελικό παραδοτέο.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {COLLABORATION_STEPS.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.05}>
                <div className="h-full rounded-[1.75rem] p-5 md:p-6" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusCard }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 800, borderRadius: D.radiusControl }}>
                    {index + 1}
                  </div>
                  <h3 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1rem", lineHeight: 1.4 }}>
                    {step.title}
                  </h3>
                  <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                    {step.body}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.18}>
            <div className="mt-8 rounded-[1.75rem] p-6 md:p-7" style={{ background: D.ink, color: "#fff", borderRadius: D.radiusShell }}>
              <div className="type-eyebrow mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>Σημαντικό</div>
              <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.8, maxWidth: "980px" }}>
                Η υποστήριξη παρέχεται για καθοδήγηση και μελέτη. Η χρήση του υλικού ως τελική ακαδημαϊκή υποβολή αποτελεί προσωπική ευθύνη του φοιτητή.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: D.ink, fontWeight: 700 }}>
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}
