import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigation, FormType } from "../lib/navigationContext";
import { submitContact } from "../lib/deltaApi";
import { trackLeadFormEvent } from "../lib/analytics";
import { D } from "../Root";

// ─── Form Configuration ───────────────────────────────────────────────────────

const FORM_CONFIG: Record<FormType, {
  title: string;
  description: string;
  options: string[];
  placeholder: string;
}> = {
  asep: {
    title: "Συμβουλευτική ΑΣΕΠ",
    description: "Συμπληρώστε τα στοιχεία σας και θα επικοινωνήσουμε μαζί σας το συντομότερο.",
    options: ["Αίτηση για προκήρυξη", "Αύξηση μορίων μέσω πιστοποιήσεων", "Άλλο"],
    placeholder: "Τι σας ενδιαφέρει;",
  },
  opsyd: {
    title: "Συμβουλευτική ΟΠΣΥΔ",
    description: "Συμπληρώστε τα στοιχεία σας και θα επικοινωνήσουμε μαζί σας το συντομότερο.",
    options: ["Αίτηση για τους πίνακες", "Αύξηση μορίων μέσω πιστοποιήσεων", "Ενημέρωση για μεταπτυχιακό", "Άλλο"],
    placeholder: "Τι σας ενδιαφέρει;",
  },
  metaptyxiaka: {
    title: "Βρες το Κατάλληλο Πρόγραμμα",
    description: "Μας ενδιαφέρει να σας βοηθήσουμε στην επιλογή του κατάλληλου μεταπτυχιακού.",
    options: ["Συμβουλευτική επιλογής προγράμματος", "Έχω επιλέξει πρόγραμμα και θέλω πληροφορίες", "Άλλο"],
    placeholder: "Τι σας ενδιαφέρει;",
  },
  pistopoihseis: {
    title: "Πληροφορίες Πιστοποιήσεων",
    description: "Συμπληρώστε τα στοιχεία σας για να λάβετε πληροφορίες για πιστοποιήσεις.",
    options: ["Πιστοποίηση Αγγλικών", "Πιστοποίηση Υπολογιστών", "Άλλο"],
    placeholder: "Ποια πιστοποίηση σας ενδιαφέρει;",
  },
  graptosDiagonismos: {
    title: "Προετοιμασία Γραπτού Διαγωνισμού ΑΣΕΠ",
    description: "Συμπληρώστε τα στοιχεία σας και θα επικοινωνήσουμε μαζί σας για καθοδήγηση σχετικά με την προετοιμασία σας.",
    options: ["Ύλη και πρόγραμμα μελέτης", "Σημειώσεις και υλικό", "Mock tests", "Στρατηγική προετοιμασίας", "Άλλο"],
    placeholder: "Τι σας ενδιαφέρει;",
  },
  general: {
    title: "Χρειάζεστε καθοδήγηση;",
    description: "Συμπληρώστε τα στοιχεία σας και η ομάδα της Delta Inc. θα επικοινωνήσει μαζί σας για να σας κατευθύνει σωστά.",
    options: ["Αίτηση για μεταπτυχιακό", "Πιστοποιήσεις για αύξηση μορίων", "Αίτηση ΑΣΕΠ", "Αίτηση ΟΠΣΥΔ", "Άλλο"],
    placeholder: "Πώς μπορούμε να βοηθήσουμε;",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactFormModal() {
  const { isModalOpen, closeModal, cta, modalFormType, modalInitialInterest } = useNavigation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const trackedViewRef = useRef<string | null>(null);
  const trackedStartRef = useRef<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
  });

  const formType = modalFormType ?? cta.formType;

  const getPayloadConfig = (currentFormType: FormType, interest: string) => {
    switch (currentFormType) {
      case "asep":
        return {
          form_type: "asep_popup",
          subject: `ΑΣΕΠ - ${interest}`,
          hub: "asep",
          source_label: "ΑΣΕΠ popup",
        };
      case "opsyd":
        return {
          form_type: "opsyd_popup",
          subject: `ΟΠΣΥΔ - ${interest}`,
          hub: "opsyd",
          source_label: "ΟΠΣΥΔ popup",
        };
      case "pistopoihseis":
        return {
          form_type: "pistopoiiseis_popup",
          subject: `Πιστοποιήσεις - ${interest}`,
          hub: "pistopoiiseis",
          source_label: "Πιστοποιήσεις popup",
        };
      case "metaptyxiaka":
        return {
          form_type: "metaptyxiaka_popup",
          subject: `Μεταπτυχιακά - ${interest}`,
          hub: "metaptyxiaka",
          source_label: "Μεταπτυχιακά popup",
        };
      case "graptosDiagonismos":
        return {
          form_type: "asep_written_exam_popup",
          subject: `Γραπτός Διαγωνισμός ΑΣΕΠ - ${interest}`,
          hub: "asep",
          source_label: "Γραπτός Διαγωνισμός ΑΣΕΠ popup",
        };
      case "general":
        return {
          form_type: "general_popup",
          subject: `Γενική επικοινωνία - ${interest}`,
          source_label: "General popup",
        };
      default:
        return {
          form_type: "hub_popup",
          subject: interest,
          source_label: "Hub popup",
        };
    }
  };

  useEffect(() => {
    if (!isModalOpen || !formType) {
      trackedViewRef.current = null;
      trackedStartRef.current = null;
      return;
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const trackedKey = `${formType}:${currentPath}`;
    if (trackedViewRef.current === trackedKey) return;

    const config = FORM_CONFIG[formType];
    const viewInterest = formData.interest || modalInitialInterest || config.placeholder;
    const payloadConfig = getPayloadConfig(formType, viewInterest);
    trackLeadFormEvent("lead_form_view", {
      form_type: payloadConfig.form_type,
      hub: payloadConfig.hub,
      source_label: payloadConfig.source_label,
    });
    trackedViewRef.current = trackedKey;
  }, [formData.interest, formType, isModalOpen, modalInitialInterest]);

  useEffect(() => {
    if (!isModalOpen || !formType || !modalInitialInterest) return;
    const config = FORM_CONFIG[formType];
    if (!config.options.includes(modalInitialInterest)) return;

    setFormData((current) => (
      current.interest === modalInitialInterest
        ? current
        : { ...current, interest: modalInitialInterest }
    ));
  }, [formType, isModalOpen, modalInitialInterest]);

  if (!formType) return null;

  const config = FORM_CONFIG[formType];

  const trackFormStart = () => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const trackedKey = `${formType}:${currentPath}`;
    if (trackedStartRef.current === trackedKey) return;

    const payloadConfig = getPayloadConfig(formType, formData.interest || "");
    trackLeadFormEvent("lead_form_start", {
      form_type: payloadConfig.form_type,
      hub: payloadConfig.hub,
      source_label: payloadConfig.source_label,
      interest: formData.interest || undefined,
    });
    trackedStartRef.current = trackedKey;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payloadConfig = getPayloadConfig(formType, formData.interest);

    trackLeadFormEvent("lead_form_submit", {
      form_type: payloadConfig.form_type,
      subject: payloadConfig.subject,
      interest: formData.interest,
      hub: payloadConfig.hub,
      source_label: payloadConfig.source_label,
    });

    const result = await submitContact({
      ...payloadConfig,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      interest: formData.interest,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);

    if (!result.success) {
      trackLeadFormEvent("lead_form_failure", {
        form_type: payloadConfig.form_type,
        subject: payloadConfig.subject,
        interest: formData.interest,
        hub: payloadConfig.hub,
        source_label: payloadConfig.source_label,
        error_type: "submission_failed",
      });
      setError(result.message);
      return;
    }

    trackLeadFormEvent("lead_form_success", {
      form_type: payloadConfig.form_type,
      subject: payloadConfig.subject,
      interest: formData.interest,
      hub: payloadConfig.hub,
      source_label: payloadConfig.source_label,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      closeModal();
      setError("");
      setFormData({ name: "", email: "", phone: "", interest: "" });
      trackedStartRef.current = null;
    }, 3000);
  };

  const handleClose = () => {
    if (!submitted && !submitting) {
      closeModal();
      setError("");
      setFormData({ name: "", email: "", phone: "", interest: "" });
      trackedStartRef.current = null;
    }
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            style={{ cursor: submitted ? "default" : "pointer" }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 relative"
                style={{ background: D.bg, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", borderRadius: D.radiusShell }}
              >
                {/* Close button */}
                {!submitted && (
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: D.surface, color: D.inkSoft }}
                    aria-label="Κλείσιμο"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Success State */}
                {submitted ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: D.accentSoft }}
                    >
                      <CheckCircle2 size={32} style={{ color: D.accentStrong }} />
                    </div>
                    <h3
                      className="mb-2"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: D.ink,
                      }}
                    >
                      Ευχαριστούμε!
                    </h3>
                    <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                      Λάβαμε το αίτημα σας και θα επικοινωνήσουμε μαζί σας σύντομα.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-6">
                      <h2
                        className="mb-2"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 800,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.025em",
                          color: D.ink,
                        }}
                      >
                        {config.title}
                      </h2>
                      <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                        {config.description}
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm mb-1.5"
                          style={{ color: D.ink, fontWeight: 600 }}
                        >
                          Ονοματεπώνυμο *
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onFocus={trackFormStart}
                          onChange={(e) => {
                            trackFormStart();
                            setFormData({ ...formData, name: e.target.value });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            background: D.surface,
                            border: `1px solid ${D.border}`,
                            color: D.ink,
                            borderRadius: D.radiusControl,
                          }}
                          placeholder="π.χ. Γιάννης Παπαδόπουλος"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm mb-1.5"
                          style={{ color: D.ink, fontWeight: 600 }}
                        >
                          Email *
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onFocus={trackFormStart}
                          onChange={(e) => {
                            trackFormStart();
                            setFormData({ ...formData, email: e.target.value });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            background: D.surface,
                            border: `1px solid ${D.border}`,
                            color: D.ink,
                            borderRadius: D.radiusControl,
                          }}
                          placeholder="email@example.com"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm mb-1.5"
                          style={{ color: D.ink, fontWeight: 600 }}
                        >
                          Τηλέφωνο *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onFocus={trackFormStart}
                          onChange={(e) => {
                            trackFormStart();
                            setFormData({ ...formData, phone: e.target.value });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            background: D.surface,
                            border: `1px solid ${D.border}`,
                            color: D.ink,
                            borderRadius: D.radiusControl,
                          }}
                          placeholder="69XXXXXXXX"
                        />
                      </div>

                      {/* Interest Dropdown */}
                      <div>
                        <label
                          htmlFor="interest"
                          className="block text-sm mb-1.5"
                          style={{ color: D.ink, fontWeight: 600 }}
                        >
                          {config.placeholder} *
                        </label>
                        <select
                          id="interest"
                          required
                          value={formData.interest}
                          onFocus={trackFormStart}
                          onChange={(e) => {
                            trackFormStart();
                            setFormData({ ...formData, interest: e.target.value });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                          style={{
                            background: D.surface,
                            border: `1px solid ${D.border}`,
                            color: formData.interest ? D.ink : D.inkSoft,
                            borderRadius: D.radiusControl,
                          }}
                        >
                          <option value="" disabled>
                            Επιλέξτε...
                          </option>
                          {config.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {error && (
                        <p className="text-sm" style={{ color: "#dc2626" }}>
                          {error}
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        style={{
                          background: D.ink,
                          color: "#fff",
                          fontWeight: 700,
                          boxShadow: `0 4px 20px ${D.shadow}`,
                          marginTop: "1.5rem",
                          borderRadius: D.radiusControl,
                        }}
                      >
                        {submitting ? <><Loader2 size={16} className="animate-spin" /> Αποστολή...</> : <>Αποστολή <Send size={16} /></>}
                      </button>
                    </form>

                    {/* Privacy Note */}
                    <p
                      className="text-xs mt-4 text-center"
                      style={{ color: "rgba(19,35,58,0.4)", lineHeight: 1.5 }}
                    >
                      Τα στοιχεία σας προστατεύονται σύμφωνα με τον GDPR.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
