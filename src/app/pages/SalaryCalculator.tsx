import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeEuro,
  Briefcase,
  Calculator,
  CheckCircle2,
  CircleAlert,
  FileText,
  GraduationCap,
  Landmark,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import {
  AGE_OPTIONS,
  CHILDREN_OPTIONS,
  EDUCATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  POSTGRADUATE_STUDIES_OPTIONS,
  PROBATIONER_OPTIONS,
  SALARY_ALLOWANCE_GROUPS,
  SALARY_REFERENCE_YEAR,
  calculateSalary,
  defaultSalaryCalculatorForm,
  formatGreekNumberFixedTwo,
  type SalaryAllowanceCategoryId,
  type SalaryCalculatorFormInput,
} from "../lib/salaryCalculator";
import { staticPageSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";

const sectionShellStyle = {
  background: D.surfaceStrong,
  border: `1px solid ${D.border}`,
  boxShadow: `0 12px 30px ${D.shadow}`,
} as const;

const inputStyle = {
  background: D.surfaceStrong,
  border: `1px solid ${D.border}`,
  color: D.ink,
  borderRadius: D.radiusInner,
  padding: "0.9rem 1rem",
  fontSize: "0.95rem",
  outline: "none",
  width: "100%",
} as const;

const allowanceFieldOrder: Array<{
  key: keyof Pick<
    SalaryCalculatorFormInput,
    | "familyAllowanceId"
    | "hazardAllowanceId"
    | "remoteAllowanceId"
    | "aadeAllowanceId"
    | "responsibilityAllowanceId"
  >;
  groupId: SalaryAllowanceCategoryId;
}> = [
  { key: "familyAllowanceId", groupId: "family" },
  { key: "hazardAllowanceId", groupId: "hazard" },
  { key: "remoteAllowanceId", groupId: "remote" },
  { key: "aadeAllowanceId", groupId: "aade" },
  { key: "responsibilityAllowanceId", groupId: "responsibility" },
];

function SummaryMetric({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: "default" | "positive";
}) {
  const iconColor = tone === "positive" ? "#166534" : D.accentStrong;
  const iconBackground = tone === "positive" ? "rgba(22,163,74,0.12)" : D.accentSoft;

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: D.surfaceStrong,
        border: `1px solid ${D.border}`,
        boxShadow: `0 8px 24px ${D.shadow}`,
        borderRadius: D.radiusCard,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: iconBackground, color: iconColor, borderRadius: D.radiusControl }}
        >
          <Icon size={18} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: D.inkSoft, fontWeight: 700 }}>
          {label}
        </div>
      </div>
      <div className="text-[1.7rem] md:text-[2rem]" style={{ color: D.ink, fontWeight: 800, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm" style={{ color: D.ink, fontWeight: 700 }}>
        {label}
      </div>
      <select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? (
        <p className="mt-2 text-[13px]" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
          {helper}
        </p>
      ) : null}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  helper,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  helper?: string;
}) {
  return (
    <label
      className="flex items-start gap-3 rounded-2xl px-4 py-4"
      style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0"
      />
      <div>
        <div className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>
          {label}
        </div>
        {helper ? (
          <p className="mt-1 text-[13px]" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
            {helper}
          </p>
        ) : null}
      </div>
    </label>
  );
}

export function SalaryCalculator() {
  const [form, setForm] = useState<SalaryCalculatorFormInput>(defaultSalaryCalculatorForm);
  const resultRef = useRef<HTMLDivElement | null>(null);

  usePageNavigation({
    mode: "content",
    cta: { text: "", link: "" },
    showStickyBottom: false,
  });

  const result = useMemo(() => calculateSalary(form), [form]);

  const handleChange = <K extends keyof SalaryCalculatorFormInput>(key: K, value: SalaryCalculatorFormInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleScrollToTool = () => {
    const target = document.getElementById("salary-tool");
    if (!target) return;
    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const handleScrollToResult = () => {
    if (!resultRef.current) return;
    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const top = resultRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("salaryCalculator")} />

      <section className="pt-36 pb-14 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 74%, rgba(29,78,216,0.045) 100%)`,
          }}
        />
        <div
          className="absolute left-[10%] top-28 hidden h-72 w-72 rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(29,78,216,0.08)" }}
        />
        <div
          className="absolute right-[8%] top-32 hidden h-80 w-80 rounded-full blur-3xl md:block pointer-events-none"
          style={{ background: "rgba(15,23,42,0.05)" }}
        />
        <div className="max-w-6xl mx-auto relative">
          <Link
            to="/delta-apps"
            className="inline-flex items-center gap-2 mb-8 text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ color: D.inkSoft }}
          >
            <ArrowLeft size={16} />
            Επιστροφή στα Delta Apps
          </Link>

          <div className="max-w-4xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ background: D.accentSoft, border: "1px solid rgba(29,78,216,0.14)" }}
            >
              <Calculator size={16} style={{ color: D.accentStrong }} />
              <span className="type-eyebrow" style={{ color: D.accentStrong }}>
                Delta Apps • Utility 02
              </span>
            </div>

            <h1 className="type-display-hero max-w-4xl mb-5" style={{ color: D.ink }}>
              Υπολογισμός Μισθού για πρακτική εκτίμηση καθαρών αποδοχών στο Δημόσιο
            </h1>
            <p className="text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.82 }}>
              Ένα replica-first εργαλείο για γρήγορη εικόνα μεικτού, καθαρού και πληρωτέου ποσού με βασικά
              κλιμάκια, κρατήσεις, επιδόματα και φορολογία για το {SALARY_REFERENCE_YEAR}.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleScrollToTool}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white transition-all hover:opacity-95"
                style={{ background: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
              >
                Μετάβαση στο εργαλείο <ArrowRight size={16} />
              </button>
              <div
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, borderRadius: D.radiusControl }}
              >
                <ShieldCheck size={16} style={{ color: D.warmAccentStrong }} />
                Εκτίμηση για το {SALARY_REFERENCE_YEAR}, όχι επίσημη διοικητική βεβαίωση
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="salary-tool" className="px-6 pb-18 scroll-mt-32">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-6">
            <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
              Εργαλείο {SALARY_REFERENCE_YEAR}
            </div>
            <h2 className="type-display-section mb-3" style={{ color: D.ink, fontSize: "clamp(1.5rem, 3vw, 2.15rem)" }}>
              Συμπληρώστε τα βασικά στοιχεία
            </h2>
            <p className="text-base" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
              Το πρώτο version εστιάζει σε ένα καθαρό single-year flow, με local logic μέσα στο Delta Apps και breakdown που
              βοηθά να κατανοήσετε από πού προκύπτει το τελικό ποσό.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_380px] gap-6 items-start">
            <div
              className="rounded-[2rem] p-5 md:p-6"
              style={{ ...sectionShellStyle, borderRadius: D.radiusShell }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div
                  className="rounded-[1.5rem] p-5"
                  style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
                >
                  <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
                    <GraduationCap size={18} />
                    <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                      Βασικά στοιχεία
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SelectField
                      label="Κατηγορία εκπαίδευσης"
                      value={form.education}
                      options={EDUCATION_OPTIONS}
                      onChange={(value) => handleChange("education", value)}
                    />
                    <SelectField
                      label="Μεταπτυχιακές σπουδές"
                      value={form.postgraduateStudies}
                      options={POSTGRADUATE_STUDIES_OPTIONS}
                      onChange={(value) => handleChange("postgraduateStudies", value)}
                    />
                    <SelectField
                      label="Εξαρτώμενα μέλη"
                      value={form.children}
                      options={CHILDREN_OPTIONS}
                      onChange={(value) => handleChange("children", value)}
                      helper="Χρησιμοποιείται για τη φορολογική μείωση. Η οικογενειακή παροχή δηλώνεται ξεχωριστά στα επιδόματα."
                    />
                    <SelectField
                      label="Ηλικία"
                      value={form.age}
                      options={AGE_OPTIONS}
                      onChange={(value) => handleChange("age", value)}
                    />
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] p-5"
                  style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
                >
                  <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
                    <Briefcase size={18} />
                    <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                      Υπηρεσιακή εικόνα
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SelectField
                      label="Έτη προϋπηρεσίας στο δημόσιο"
                      value={form.experience}
                      options={EXPERIENCE_OPTIONS}
                      onChange={(value) => handleChange("experience", value)}
                    />
                    <SelectField
                      label="Κατάσταση διορισμού"
                      value={form.probationer}
                      options={PROBATIONER_OPTIONS}
                      onChange={(value) => handleChange("probationer", value)}
                    />
                    <ToggleField
                      label="Πρώτος διορισμός στο δημόσιο"
                      checked={form.firstAppointment}
                      onChange={(value) => handleChange("firstAppointment", value)}
                    />
                    <ToggleField
                      label="Δεν συμμετέχω στο Μ.Τ.Π.Υ."
                      checked={form.mtpyExcluded}
                      onChange={(value) => handleChange("mtpyExcluded", value)}
                      helper="Αφαιρεί τη βασική κράτηση ΜΤΠΥ και την πρόσθετη κράτηση νεοδιοριζομένου, όπου θα ίσχυε."
                    />
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] p-5 lg:col-span-2"
                  style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
                >
                  <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
                    <Landmark size={18} />
                    <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                      Επιδόματα - Bonus
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allowanceFieldOrder.map(({ key, groupId }) => {
                      const group = SALARY_ALLOWANCE_GROUPS.find((item) => item.id === groupId);
                      if (!group) return null;

                      return (
                        <SelectField
                          key={key}
                          label={group.label}
                          value={form[key]}
                          options={[{ label: "-", value: "0" }, ...group.options.map((option) => ({ label: option.label, value: String(option.id) }))]}
                          onChange={(value) => handleChange(key, value)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleScrollToResult}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white transition-opacity hover:opacity-95"
                  style={{ background: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  Υπολογισμός <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setForm(defaultSalaryCalculatorForm)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl transition-opacity hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  Επαναφορά
                </button>
              </div>
            </div>

            <div ref={resultRef} className="space-y-4">
              <SummaryMetric
                icon={BadgeEuro}
                label="Μεικτός μισθός"
                value={`${formatGreekNumberFixedTwo(result.grossPay)}€`}
              />
              <SummaryMetric
                icon={Wallet}
                label="Καθαρό ποσό"
                value={`${formatGreekNumberFixedTwo(result.netPay)}€`}
              />
              <SummaryMetric
                icon={PiggyBank}
                label="Πληρωτέο ποσό"
                value={`${formatGreekNumberFixedTwo(result.payableAmount)}€`}
                tone="positive"
              />

              <div
                className="rounded-[1.5rem] p-5"
                style={{ ...sectionShellStyle, borderRadius: D.radiusCard }}
              >
                <div className="type-eyebrow mb-3" style={{ color: D.inkSoft }}>
                  Snapshot
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: "Μισθός βάσει κλιμακίου", value: `${formatGreekNumberFixedTwo(result.grossPayBasedOnExperienceAndPostgraduateStudies)}€` },
                    { label: "Σύνολο επιδομάτων", value: `${formatGreekNumberFixedTwo(result.allowancesSum)}€` },
                    { label: "Σύνολο κρατήσεων", value: `${formatGreekNumberFixedTwo(result.deductionsSum)}€` },
                    { label: "Παρακράτηση φόρου", value: `${formatGreekNumberFixedTwo(result.tax.payrollTax)}€` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
                      style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                    >
                      <span className="text-sm" style={{ color: D.inkSoft, fontWeight: 600 }}>
                        {item.label}
                      </span>
                      <span className="text-sm text-right" style={{ color: D.ink, fontWeight: 800 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-18">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 items-start">
          <div
            className="rounded-[2rem] p-5 md:p-6"
            style={{ ...sectionShellStyle, borderRadius: D.radiusShell }}
          >
            <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
              <ReceiptText size={18} />
              <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                Κρατήσεις & φορολογία
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-[1.5rem] p-4"
                style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
              >
                <div className="mb-3 text-sm" style={{ color: D.ink, fontWeight: 800 }}>
                  Κρατήσεις
                </div>
                <div className="space-y-3">
                  {result.deductions.map((deduction) => (
                    <div
                      key={deduction.name}
                      className="rounded-xl px-3.5 py-3"
                      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>
                            {deduction.name}
                          </div>
                          <div className="mt-1 text-[13px]" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
                            {deduction.description}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm" style={{ color: D.ink, fontWeight: 800 }}>
                          {formatGreekNumberFixedTwo(deduction.value)}€
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[1.5rem] p-4"
                style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}
              >
                <div className="mb-3 text-sm" style={{ color: D.ink, fontWeight: 800 }}>
                  Φορολογικό breakdown
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Ετήσιο φορολογητέο εισόδημα", value: `${formatGreekNumberFixedTwo(result.tax.taxableIncome)}€` },
                    { label: "Φόρος κλίμακας", value: `${formatGreekNumberFixedTwo(result.tax.scaleTax)}€` },
                    { label: "Μείωση φόρου", value: `${formatGreekNumberFixedTwo(result.tax.taxReduction)}€` },
                    { label: "Ετήσιος φόρος εισοδήματος", value: `${formatGreekNumberFixedTwo(result.tax.taxIncome)}€` },
                    { label: "Μηνιαία παρακράτηση", value: `${formatGreekNumberFixedTwo(result.tax.payrollTax)}€` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
                      style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                    >
                      <span className="text-sm" style={{ color: D.inkSoft, fontWeight: 600 }}>
                        {item.label}
                      </span>
                      <span className="text-sm text-right" style={{ color: D.ink, fontWeight: 800 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="rounded-[2rem] p-5 md:p-6"
              style={{ ...sectionShellStyle, borderRadius: D.radiusShell }}
            >
              <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
                <BadgeEuro size={18} />
                <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                  Επιδόματα
                </div>
              </div>
              {result.allowances.length > 0 ? (
                <div className="space-y-3">
                  {result.allowances.map((allowance) => (
                    <div
                      key={`${allowance.allowanceId}-${allowance.id}`}
                      className="rounded-xl px-3.5 py-3"
                      style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>
                            {allowance.allowanceName}
                          </div>
                          <div className="mt-1 text-[13px]" style={{ color: D.inkSoft, lineHeight: 1.55 }}>
                            {allowance.name}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm" style={{ color: D.ink, fontWeight: 800 }}>
                          {formatGreekNumberFixedTwo(allowance.amount)}€
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl px-4 py-4"
                  style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                >
                  <div className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                    Δεν έχουν επιλεγεί ενεργά επιδόματα σε αυτό το σενάριο.
                  </div>
                </div>
              )}
            </div>

            <div
              className="rounded-[2rem] p-5 md:p-6"
              style={{ ...sectionShellStyle, borderRadius: D.radiusShell }}
            >
              <div className="flex items-center gap-2 mb-4" style={{ color: D.accentStrong }}>
                <UserRound size={18} />
                <div className="text-[11px] uppercase tracking-[0.14em]" style={{ fontWeight: 700 }}>
                  Ερμηνεία αποτελέσματος
                </div>
              </div>
              <div className="space-y-3">
                {result.explainList.map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 rounded-xl px-3.5 py-3"
                    style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}
                  >
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: D.accentStrong }} />
                    <div className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                      {line}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-[2.1rem] p-7 md:p-8"
            style={{
              background: D.surfaceStrong,
              border: `1px solid ${D.border}`,
              boxShadow: `0 14px 34px ${D.shadow}`,
              borderRadius: D.radiusShell,
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
              <div>
                <div className="type-eyebrow mb-3" style={{ color: D.inkSoft }}>
                  Σημαντική σημείωση
                </div>
                <h2 className="type-display-section mb-4" style={{ color: D.ink, fontSize: "clamp(1.45rem, 2.8vw, 2rem)" }}>
                  Ενημερωτικό εργαλείο με reference-calibrated λογική
                </h2>
                <p className="text-base max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                  Το εργαλείο έχει σχεδιαστεί για να δίνει μια γρήγορη και πρακτική εκτίμηση αποδοχών. Δεν αντικαθιστά επίσημη
                  διοικητική πράξη, εκκαθαριστικό ή τελική βεβαίωση από την αρμόδια υπηρεσία.
                </p>
              </div>

              <div
                className="rounded-[1.5rem] p-5"
                style={{
                  background: "rgba(185,152,90,0.07)",
                  border: `1px solid ${D.warmAccentBorderSoft}`,
                  borderRadius: D.radiusCard,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: D.warmAccentSoft, color: D.warmAccentStrong, borderRadius: D.radiusControl }}
                  >
                    <CircleAlert size={18} />
                  </div>
                  <div>
                    <div className="text-sm mb-2" style={{ color: D.ink, fontWeight: 800 }}>
                      Πριν βασιστείτε στο ποσό
                    </div>
                    <div className="space-y-2 text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>
                      <p>Επιβεβαιώστε το αποτέλεσμα με τα επίσημα κριτήρια της δικής σας υπηρεσίας.</p>
                      <p>Ειδικά επιδόματα, εξαιρέσεις ή ειδικές υπηρεσιακές περιπτώσεις μπορεί να αλλάξουν το τελικό ποσό.</p>
                      <p>Η πρώτη έκδοση καλύπτει μόνο το έτος {SALARY_REFERENCE_YEAR} και δεν περιλαμβάνει σύγκριση πολλών ετών.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/delta-apps"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl transition-opacity hover:opacity-90"
                style={{ background: D.bg, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
              >
                Επιστροφή στο hub <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={handleScrollToTool}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white transition-opacity hover:opacity-95"
                style={{ background: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
              >
                Νέος υπολογισμός <FileText size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
