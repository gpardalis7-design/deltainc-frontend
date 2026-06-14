import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Award, Briefcase, Calculator, CircleAlert, Cpu, GraduationCap, Languages, Sigma } from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import {
  ANAPLIROTES_SPECIALTIES,
  FOREIGN_LANGUAGE_LEVEL_OPTIONS,
  FOREIGN_LANGUAGE_OPTIONS,
  calculateAnaplirotesMoria,
  calculateDeTakTikoMoria,
  calculatePeTeTakTikoMoria,
  calculateYeTakTikoMoria,
  formatGreekNumberFixedTwo,
  formatGreekNumber,
  type AnaplirotesMoriaFormInput,
  type DeTakTikoFormInput,
  type PeTeTakTikoFormInput,
  type YeTakTikoFormInput,
  type MoriaCalculatorModeId,
} from "../lib/moriaCalculator";
import { staticPageSeo } from "../lib/seo";
import { usePageNavigation } from "../lib/usePageNavigation";

const modeCards = [
  {
    id: "anaplirotes" as const,
    title: "Μόρια Αναπληρωτών",
    status: "live" as const,
  },
  {
    id: "asep-de" as const,
    title: "ΔΕ Τακτικό Προσωπικό",
    status: "live" as const,
  },
  {
    id: "ye-taktiko" as const,
    title: "ΥΕ Τακτικό Προσωπικό",
    status: "live" as const,
  },
  {
    id: "pe-te-taktiko" as const,
    title: "ΠΕ - ΤΕ Τακτικό Προσωπικό",
    status: "live" as const,
  },
] as const;

const secondDegreeOptions = [
  { label: "Όχι", value: "0", points: 0 },
  { label: "Ναι", value: "7", points: 7 },
] as const;

const postgraduateOptions = [
  { label: "Κανένα", value: "0", points: 0 },
  { label: "Ένα", value: "20", points: 20 },
  { label: "Δύο", value: "28", points: 28 },
] as const;

const yesNoPointsOptions = (yesPoints: number) => [
  { label: "Όχι", value: "0", points: 0 },
  { label: "Ναι", value: String(yesPoints), points: yesPoints },
] as const;

const serviceFieldMeta = [
  {
    key: "publicServiceMonths",
    label: "Δημόσια εκπαιδευτική προϋπηρεσία",
    helper: "Πόντοι: μήνες × 1",
  },
  {
    key: "difficultServiceMonths",
    label: "Δυσπρόσιτα / καταστήματα κράτησης από 2020-2021 και μετά",
    helper: "Πόντοι: μήνες × 2",
  },
  {
    key: "covid2020NormalMonths",
    label: "Τρίμηνες συμβάσεις COVID 2020-2021 σε δημόσια σχολεία",
    helper: "Πόντοι: μήνες × 1,5 · συνολικά έως 8 μήνες μαζί με το δύσκολο πεδίο του 2020-2021",
  },
  {
    key: "covid2020DifficultMonths",
    label: "Τρίμηνες συμβάσεις COVID 2020-2021 σε δυσπρόσιτα / καταστήματα κράτησης",
    helper: "Πόντοι: μήνες × 3 · συνολικά έως 8 μήνες μαζί με το δημόσιο πεδίο του 2020-2021",
  },
  {
    key: "covid2021NormalMonths",
    label: "Τρίμηνες συμβάσεις COVID 2021-2022 σε δημόσια σχολεία",
    helper: "Πόντοι: μήνες × 1,5 · συνολικά έως 9 μήνες μαζί με το δύσκολο πεδίο του 2021-2022",
  },
  {
    key: "covid2021DifficultMonths",
    label: "Τρίμηνες συμβάσεις COVID 2021-2022 σε δυσπρόσιτα / καταστήματα κράτησης",
    helper: "Πόντοι: μήνες × 3 · συνολικά έως 9 μήνες μαζί με το δημόσιο πεδίο του 2021-2022",
  },
  {
    key: "privateEducationMonths",
    label: "Ιδιωτική εκπαίδευση",
    helper: "Πόντοι: μήνες × 0,9",
  },
  {
    key: "digitalTutoringMonths",
    label: "Ψηφιακό Φροντιστήριο",
    helper: "Πόντοι: μήνες × 1,5 · η μοριοδότηση ανά σχολικό έτος παραμένει ενδεικτική",
  },
] as const;

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

type AnaplirotesFormState = {
  specialty: string;
  grade: string;
  secondDegreePoints: string;
  postgraduatePoints: string;
  doctoratePoints: string;
  firstLanguage: string;
  firstLanguageLevel: string;
  secondLanguage: string;
  secondLanguageLevel: string;
  computerKnowledgePoints: string;
  trainingPoints: string;
  publicServiceMonths: string;
  difficultServiceMonths: string;
  covid2020NormalMonths: string;
  covid2020DifficultMonths: string;
  covid2021NormalMonths: string;
  covid2021DifficultMonths: string;
  privateEducationMonths: string;
  digitalTutoringMonths: string;
  minorChildren: string;
  disabilityPercentage: string;
};

const defaultAnaplirotesForm: AnaplirotesFormState = {
  specialty: "",
  grade: "",
  secondDegreePoints: "0",
  postgraduatePoints: "0",
  doctoratePoints: "0",
  firstLanguage: "",
  firstLanguageLevel: "0",
  secondLanguage: "",
  secondLanguageLevel: "0",
  computerKnowledgePoints: "0",
  trainingPoints: "0",
  publicServiceMonths: "",
  difficultServiceMonths: "",
  covid2020NormalMonths: "",
  covid2020DifficultMonths: "",
  covid2021NormalMonths: "",
  covid2021DifficultMonths: "",
  privateEducationMonths: "",
  digitalTutoringMonths: "",
  minorChildren: "",
  disabilityPercentage: "",
};

type DeTakTikoFormState = {
  grade: string;
  secondDegreePoints: string;
  experienceMonths: string;
  excellentLanguagesCount: string;
  veryGoodLanguagesCount: string;
  goodLanguagesCount: string;
};

const defaultDeTakTikoForm: DeTakTikoFormState = {
  grade: "",
  secondDegreePoints: "0",
  experienceMonths: "",
  excellentLanguagesCount: "",
  veryGoodLanguagesCount: "",
  goodLanguagesCount: "",
};

type YeTakTikoFormState = {
  childrenCount: string;
  polytekniPoints: string;
  tritekniPoints: string;
  monogoneikiPoints: string;
  continuousUnemploymentPeriods: string;
  nonContinuousUnemploymentPeriods: string;
  experienceMonths: string;
  ageUpTo30Points: string;
};

const defaultYeTakTikoForm: YeTakTikoFormState = {
  childrenCount: "",
  polytekniPoints: "0",
  tritekniPoints: "0",
  monogoneikiPoints: "0",
  continuousUnemploymentPeriods: "",
  nonContinuousUnemploymentPeriods: "",
  experienceMonths: "",
  ageUpTo30Points: "0",
};

type PeTeTakTikoFormState = {
  grade: string;
  secondTitlePoints: string;
  doctorateCount: string;
  postgraduateCount: string;
  integratedMasterCount: string;
  experienceMonths: string;
  excellentLanguagesCount: string;
  veryGoodLanguagesCount: string;
  goodLanguagesCount: string;
};

const zeroToTwoOptions = [
  { label: "0", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
] as const;

const defaultPeTeTakTikoForm: PeTeTakTikoFormState = {
  grade: "",
  secondTitlePoints: "0",
  doctorateCount: "0",
  postgraduateCount: "0",
  integratedMasterCount: "0",
  experienceMonths: "",
  excellentLanguagesCount: "",
  veryGoodLanguagesCount: "",
  goodLanguagesCount: "",
};

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const _delay = delay;
  void _delay;
  return <>{children}</>;
}

export function MoriaCalculator() {
  const [activeMode, setActiveMode] = useState<MoriaCalculatorModeId>("anaplirotes");
  const [anaplirotesForm, setAnaplirotesForm] = useState<AnaplirotesMoriaFormInput>(defaultAnaplirotesForm);
  const [deTakTikoForm, setDeTakTikoForm] = useState<DeTakTikoFormInput>(defaultDeTakTikoForm);
  const [yeTakTikoForm, setYeTakTikoForm] = useState<YeTakTikoFormInput>(defaultYeTakTikoForm);
  const [peTeTakTikoForm, setPeTeTakTikoForm] = useState<PeTeTakTikoFormInput>(defaultPeTeTakTikoForm);

  usePageNavigation({
    mode: "content",
    cta: { text: "", link: "" },
    showStickyBottom: false,
  });

  const result = useMemo(
    () =>
      activeMode === "anaplirotes"
        ? calculateAnaplirotesMoria(anaplirotesForm)
        : activeMode === "asep-de"
          ? calculateDeTakTikoMoria(deTakTikoForm)
          : activeMode === "ye-taktiko"
            ? calculateYeTakTikoMoria(yeTakTikoForm)
            : calculatePeTeTakTikoMoria(peTeTakTikoForm),
    [activeMode, anaplirotesForm, deTakTikoForm, yeTakTikoForm, peTeTakTikoForm]
  );

  const handleAnaplirotesChange = <K extends keyof AnaplirotesMoriaFormInput>(key: K, value: AnaplirotesMoriaFormInput[K]) => {
    setAnaplirotesForm((current) => ({ ...current, [key]: value }));
  };

  const handleDeTakTikoChange = <K extends keyof DeTakTikoFormInput>(key: K, value: DeTakTikoFormInput[K]) => {
    setDeTakTikoForm((current) => ({ ...current, [key]: value }));
  };

  const handleYeTakTikoChange = <K extends keyof YeTakTikoFormInput>(key: K, value: YeTakTikoFormInput[K]) => {
    setYeTakTikoForm((current) => ({ ...current, [key]: value }));
  };

  const handlePeTeTakTikoChange = <K extends keyof PeTeTakTikoFormInput>(key: K, value: PeTeTakTikoFormInput[K]) => {
    setPeTeTakTikoForm((current) => ({ ...current, [key]: value }));
  };

  const activeModeCard = modeCards.find((mode) => mode.id === activeMode) ?? modeCards[0];
  const activeModeIndexLabel =
    activeMode === "anaplirotes"
      ? "Mode 01"
      : activeMode === "asep-de"
        ? "Mode 02"
        : activeMode === "ye-taktiko"
          ? "Mode 03"
          : "Mode 04";

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("moriaCalculator")} />

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
          <AnimatedSection>
            <Link
              to="/delta-apps"
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.inkSoft, boxShadow: `0 6px 18px ${D.shadow}` }}
            >
              <ArrowLeft size={15} />
              <span className="text-sm font-semibold">Πίσω στο Delta Apps</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: D.accentSoft, border: "1px solid rgba(29,78,216,0.14)" }}
              >
                <Calculator size={16} style={{ color: D.accentStrong }} />
                <span className="type-eyebrow" style={{ color: D.accentStrong }}>Μόρια Calculator</span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] tracking-[0.12em] uppercase"
                style={{ background: "rgba(15,23,42,0.06)", color: D.inkSoft, fontWeight: 700 }}
              >
                Beta
              </div>
            </div>

            <div className="max-w-4xl">
              <h1 className="type-display-hero mb-5 max-w-4xl" style={{ color: D.ink }}>
                Ένας καθαρός, ζωντανός υπολογισμός μορίων με modes για διαφορετικές λογικές
              </h1>
              <p className="text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.82 }}>
                Το εργαλείο λειτουργεί με ξεχωριστά calculation tracks, ώστε κάθε κατηγορία να έχει τη δική της καθαρή λογική. Αυτή τη στιγμή υποστηρίζει
                <strong style={{ color: D.ink }}> Μόρια Αναπληρωτών</strong>, <strong style={{ color: D.ink }}>ΔΕ Τακτικό Προσωπικό</strong>, <strong style={{ color: D.ink }}>ΥΕ Τακτικό Προσωπικό</strong> και <strong style={{ color: D.ink }}>ΠΕ - ΤΕ Τακτικό Προσωπικό</strong>, χωρίς να γίνεται ένα ενιαίο μπερδεμένο form.
              </p>
              <div className="mt-8">
                <a
                  href="#moria-mode-selector"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white transition-all hover:opacity-95"
                  style={{ background: D.ink, fontWeight: 700, boxShadow: `0 6px 20px ${D.shadow}`, borderRadius: D.radiusControl }}
                >
                  Μετάβαση στο εργαλείο <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="moria-modes" className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="max-w-3xl mb-8">
              <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Calculator modes</div>
              <h2 className="type-display-section mb-3" style={{ color: D.ink, fontSize: "clamp(1.45rem, 3vw, 2.05rem)" }}>
                Επιλέξτε τη σωστή λογική μορίων πριν ξεκινήσετε
              </h2>
              <p className="text-base" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
                Κάθε mode έχει διαφορετικά inputs και διαφορετική φόρμουλα. Το εργαλείο ξεκινά με πραγματική λειτουργία για τους αναπληρωτές και επεκτείνεται σταδιακά σε νέα calculation tracks.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.04}>
            <div className="flex flex-col gap-4">
              <div id="moria-mode-selector" className="type-eyebrow scroll-mt-28" style={{ color: D.inkSoft }}>
                Επιλέξτε mode
              </div>
              <div className="flex flex-wrap gap-2">
                {modeCards.map((mode) => {
                  const isActive = mode.id === activeMode;
                  const isLive = mode.status === "live";

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isLive}
                      onClick={() => isLive && setActiveMode(mode.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all duration-200"
                      style={{
                        background: isActive ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.9)",
                        border: `1px solid ${isActive ? "rgba(37,99,235,0.32)" : "rgba(148,163,184,0.22)"}`,
                        color: isActive ? D.accentStrong : D.inkSoft,
                        fontWeight: 700,
                        boxShadow: isActive ? "0 6px 18px rgba(37,99,235,0.12)" : "0 2px 10px rgba(15,23,42,0.04)",
                        opacity: isLive ? 1 : 0.62,
                        cursor: isLive ? "pointer" : "default",
                      }}
                    >
                      {mode.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="moria-tool" className="px-6 pb-18">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_360px] gap-8 items-start">
          <AnimatedSection>
            <div className="rounded-[2rem] p-6 md:p-8" style={{ ...sectionShellStyle, borderRadius: D.radiusShell }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
                <div>
                  <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>
                    {activeModeIndexLabel} · Live
                  </div>
                  <h2 className="type-display-section" style={{ color: D.ink, fontSize: "1.45rem" }}>
                    {activeModeCard.title}
                  </h2>
                </div>
                <div className="text-xs px-3 py-2 rounded-full self-start md:self-auto" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
                  Αυτόματος υπολογισμός με 2 δεκαδικά
                </div>
              </div>

              {activeMode === "anaplirotes" ? (
                <div className="space-y-8">
                  <CalculatorSection title="1. Κλάδος / ειδικότητα" icon={<Calculator size={16} style={{ color: D.accentStrong }} />}>
                    <Field label="Κλάδος / ειδικότητα" helper="Απαιτείται επιλογή κλάδου για να εφαρμοστούν σωστά οι εξαιρέσεις σε γλώσσες και Η/Υ.">
                      <select value={anaplirotesForm.specialty} onChange={(e) => handleAnaplirotesChange("specialty", e.target.value)} style={inputStyle}>
                        <option value="">Επιλέξτε κλάδο / ειδικότητα</option>
                        {ANAPLIROTES_SPECIALTIES.map((specialty) => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </select>
                    </Field>
                  </CalculatorSection>

                  <CalculatorSection title="Α. Ακαδημαϊκά Προσόντα" icon={<GraduationCap size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Βαθμός βασικού τίτλου σπουδών" helper="Αποδεκτό εύρος 5 έως 10 · δέχεται δεκαδικά · τύπος: βαθμός × 2.5">
                        <input
                          type="number"
                          min="5"
                          max="10"
                          step="0.01"
                          value={anaplirotesForm.grade}
                          onChange={(e) => handleAnaplirotesChange("grade", e.target.value)}
                          placeholder="π.χ. 7.84"
                          style={inputStyle}
                        />
                      </Field>

                      <Field label="Δεύτερο πτυχίο Α.Ε.Ι.">
                        <select value={anaplirotesForm.secondDegreePoints} onChange={(e) => handleAnaplirotesChange("secondDegreePoints", e.target.value)} style={inputStyle}>
                          {secondDegreeOptions.map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Μεταπτυχιακός τίτλος">
                        <select value={anaplirotesForm.postgraduatePoints} onChange={(e) => handleAnaplirotesChange("postgraduatePoints", e.target.value)} style={inputStyle}>
                          {postgraduateOptions.map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Διδακτορικό">
                        <select value={anaplirotesForm.doctoratePoints} onChange={(e) => handleAnaplirotesChange("doctoratePoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(40).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Β. Ξένες Γλώσσες" icon={<Languages size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <Field label="1η Γλώσσα">
                          <select value={anaplirotesForm.firstLanguage} onChange={(e) => handleAnaplirotesChange("firstLanguage", e.target.value)} style={inputStyle}>
                            <option value="">Επιλέξτε γλώσσα</option>
                            {FOREIGN_LANGUAGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Επίπεδο 1ης γλώσσας">
                          <select value={anaplirotesForm.firstLanguageLevel} onChange={(e) => handleAnaplirotesChange("firstLanguageLevel", e.target.value)} style={inputStyle}>
                            {FOREIGN_LANGUAGE_LEVEL_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <div className="space-y-4">
                        <Field label="2η Γλώσσα">
                          <select value={anaplirotesForm.secondLanguage} onChange={(e) => handleAnaplirotesChange("secondLanguage", e.target.value)} style={inputStyle}>
                            <option value="">Επιλέξτε γλώσσα</option>
                            {FOREIGN_LANGUAGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Επίπεδο 2ης γλώσσας">
                          <select value={anaplirotesForm.secondLanguageLevel} onChange={(e) => handleAnaplirotesChange("secondLanguageLevel", e.target.value)} style={inputStyle}>
                            {FOREIGN_LANGUAGE_LEVEL_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Γ. Λοιπά Ακαδημαϊκά Προσόντα" icon={<Cpu size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Πιστοποιημένη γνώση Η/Υ ή ΤΠΕ Α’ επιπέδου">
                        <select value={anaplirotesForm.computerKnowledgePoints} onChange={(e) => handleAnaplirotesChange("computerKnowledgePoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(4).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Επιμόρφωση τουλάχιστον 300 ωρών και διάρκειας τουλάχιστον 7 μηνών">
                        <select value={anaplirotesForm.trainingPoints} onChange={(e) => handleAnaplirotesChange("trainingPoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(2).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Δ. Προϋπηρεσία" icon={<Briefcase size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceFieldMeta.map((field) => (
                        <Field key={field.key} label={field.label} helper={field.helper}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={anaplirotesForm[field.key]}
                            onChange={(e) => handleAnaplirotesChange(field.key, e.target.value)}
                            placeholder="π.χ. 8"
                            style={inputStyle}
                          />
                        </Field>
                      ))}
                    </div>
                    <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: D.radiusCard }}>
                      <p className="text-sm" style={{ color: "#92400e", lineHeight: 1.75 }}>
                        Μην εισάγετε τους ίδιους μήνες σε περισσότερα από ένα πεδία. Οι μήνες τρίμηνων συμβάσεων COVID δεν πρέπει να προστίθενται και στη γενική δημόσια προϋπηρεσία.
                      </p>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Ε. Κοινωνικά Κριτήρια" icon={<Award size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Αριθμός ανήλικων τέκνων" helper="Κάθε τέκνο προσθέτει 3 μόρια">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={anaplirotesForm.minorChildren}
                          onChange={(e) => handleAnaplirotesChange("minorChildren", e.target.value)}
                          placeholder="π.χ. 2"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Ποσοστό αναπηρίας, 50% και άνω" helper="Κάτω από 50% δεν προσμετράται · τύπος: ποσοστό × 0.4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={anaplirotesForm.disabilityPercentage}
                          onChange={(e) => handleAnaplirotesChange("disabilityPercentage", e.target.value)}
                          placeholder="π.χ. 50"
                          style={inputStyle}
                        />
                      </Field>
                    </div>
                  </CalculatorSection>
                </div>
              ) : activeMode === "asep-de" ? (
                <div className="space-y-8">
                  <CalculatorSection title="Α. Βασικά Στοιχεία" icon={<GraduationCap size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Βαθμός βασικού τίτλου" helper="Τύπος: βαθμός × 60 · έγκυρος μόνο από 4 έως 10. Εκτός εύρους, μετρά 0.">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={deTakTikoForm.grade}
                          onChange={(e) => handleDeTakTikoChange("grade", e.target.value)}
                          placeholder="π.χ. 8.45"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Δεύτερος τίτλος σπουδών">
                        <select value={deTakTikoForm.secondDegreePoints} onChange={(e) => handleDeTakTikoChange("secondDegreePoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(110).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Β. Εμπειρία" icon={<Briefcase size={16} style={{ color: D.accentStrong }} />}>
                    <Field label="Μήνες εμπειρίας" helper="Τύπος: μήνες × 7 · μέγιστο 84 μήνες. Αν ξεπεραστεί, εφαρμόζεται cap.">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={deTakTikoForm.experienceMonths}
                        onChange={(e) => handleDeTakTikoChange("experienceMonths", e.target.value)}
                        placeholder="π.χ. 36"
                        style={inputStyle}
                      />
                    </Field>
                  </CalculatorSection>

                  <CalculatorSection title="Γ. Ξένες Γλώσσες" icon={<Languages size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Άριστη γνώση" helper="Αριθμός γλωσσών × 90">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={deTakTikoForm.excellentLanguagesCount}
                          onChange={(e) => handleDeTakTikoChange("excellentLanguagesCount", e.target.value)}
                          placeholder="π.χ. 1"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Πολύ καλή γνώση" helper="Αριθμός γλωσσών × 60">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={deTakTikoForm.veryGoodLanguagesCount}
                          onChange={(e) => handleDeTakTikoChange("veryGoodLanguagesCount", e.target.value)}
                          placeholder="π.χ. 1"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Καλή γνώση" helper="Αριθμός γλωσσών × 40">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={deTakTikoForm.goodLanguagesCount}
                          onChange={(e) => handleDeTakTikoChange("goodLanguagesCount", e.target.value)}
                          placeholder="π.χ. 0"
                          style={inputStyle}
                        />
                      </Field>
                    </div>
                    <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(29,78,216,0.05)", border: "1px solid rgba(29,78,216,0.12)", borderRadius: D.radiusCard }}>
                      <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                        Το σύστημα υπολογίζει έως 3 ξένες γλώσσες συνολικά και δίνει προτεραιότητα πρώτα στις άριστες, μετά στις πολύ καλές και τέλος στις καλές.
                      </p>
                    </div>
                  </CalculatorSection>
                </div>
              ) : activeMode === "ye-taktiko" ? (
                <div className="space-y-8">
                  <CalculatorSection title="Α. Οικογενειακά κριτήρια" icon={<Award size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Ανήλικα τέκνα" helper="Τύπος: τέκνα × 200 · μετρώνται έως 6 τέκνα.">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={yeTakTikoForm.childrenCount}
                          onChange={(e) => handleYeTakTikoChange("childrenCount", e.target.value)}
                          placeholder="π.χ. 2"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Τέκνο πολύτεκνης οικογένειας">
                        <select value={yeTakTikoForm.polytekniPoints} onChange={(e) => handleYeTakTikoChange("polytekniPoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(300).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Τέκνο τρίτεκνης οικογένειας" helper="Αν μετρήσει η πολύτεκνη οικογένεια, αυτό το κριτήριο γίνεται 0.">
                        <select value={yeTakTikoForm.tritekniPoints} onChange={(e) => handleYeTakTikoChange("tritekniPoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(200).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Τέκνο μονογονεϊκής οικογένειας" helper="Αν μετρήσει πολύτεκνη ή τρίτεκνη οικογένεια, αυτό το κριτήριο γίνεται 0.">
                        <select value={yeTakTikoForm.monogoneikiPoints} onChange={(e) => handleYeTakTikoChange("monogoneikiPoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(100).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Β. Ανεργία" icon={<Briefcase size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Συνεχόμενη ανεργία" helper="Εξάμηνα × 50 · μετρώνται έως 10 εξάμηνα.">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={yeTakTikoForm.continuousUnemploymentPeriods}
                          onChange={(e) => handleYeTakTikoChange("continuousUnemploymentPeriods", e.target.value)}
                          placeholder="π.χ. 4"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Μη συνεχόμενη ανεργία" helper="Εξάμηνα × 20 · μετρώνται έως 5 εξάμηνα.">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={yeTakTikoForm.nonContinuousUnemploymentPeriods}
                          onChange={(e) => handleYeTakTikoChange("nonContinuousUnemploymentPeriods", e.target.value)}
                          placeholder="π.χ. 2"
                          style={inputStyle}
                        />
                      </Field>
                    </div>
                    <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(29,78,216,0.05)", border: "1px solid rgba(29,78,216,0.12)", borderRadius: D.radiusCard }}>
                      <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                        Το σύστημα δεν αθροίζει τις δύο κατηγορίες ανεργίας. Κρατά μόνο εκείνη που δίνει τα περισσότερα μόρια.
                      </p>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Γ. Εμπειρία και ηλικία" icon={<Calculator size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Μήνες εμπειρίας" helper="Τύπος: μήνες × 7 · μέγιστο 84 μήνες.">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={yeTakTikoForm.experienceMonths}
                          onChange={(e) => handleYeTakTikoChange("experienceMonths", e.target.value)}
                          placeholder="π.χ. 24"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Ηλικία έως και 30 ετών">
                        <select value={yeTakTikoForm.ageUpTo30Points} onChange={(e) => handleYeTakTikoChange("ageUpTo30Points", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(75).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>
                </div>
              ) : (
                <div className="space-y-8">
                  <CalculatorSection title="Α. Τίτλοι σπουδών" icon={<GraduationCap size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Βαθμός βασικού τίτλου σπουδών" helper="Τύπος: βαθμός × 60 · αποδεκτό εύρος 5 έως 10. Δέχεται και κόμμα ως δεκαδικό.">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={peTeTakTikoForm.grade}
                          onChange={(e) => handlePeTeTakTikoChange("grade", e.target.value)}
                          placeholder="π.χ. 7,50"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Δεύτερος τίτλος σπουδών">
                        <select value={peTeTakTikoForm.secondTitlePoints} onChange={(e) => handlePeTeTakTikoChange("secondTitlePoints", e.target.value)} style={inputStyle}>
                          {yesNoPointsOptions(100).map((option) => (
                            <option key={option.label} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Διδακτορικό δίπλωμα" helper="Επιλογές 0, 1 ή 2. Ο δεύτερος τίτλος ενεργοποιεί πρώτος το shared extra-title bonus.">
                        <select value={peTeTakTikoForm.doctorateCount} onChange={(e) => handlePeTeTakTikoChange("doctorateCount", e.target.value)} style={inputStyle}>
                          {zeroToTwoOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Μεταπτυχιακός τίτλος" helper="Επιλογές 0, 1 ή 2. Η τιμή 2 μπορεί να γίνει 270 μόνο αν το shared bonus είναι ακόμη διαθέσιμο.">
                        <select value={peTeTakTikoForm.postgraduateCount} onChange={(e) => handlePeTeTakTikoChange("postgraduateCount", e.target.value)} style={inputStyle}>
                          {zeroToTwoOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Integrated master" helper="Επιλογές 0, 1 ή 2. Η τιμή 2 μπορεί να γίνει 135 μόνο αν το shared bonus είναι ακόμη διαθέσιμο.">
                        <select value={peTeTakTikoForm.integratedMasterCount} onChange={(e) => handlePeTeTakTikoChange("integratedMasterCount", e.target.value)} style={inputStyle}>
                          {zeroToTwoOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </CalculatorSection>

                  <CalculatorSection title="Β. Εμπειρία" icon={<Briefcase size={16} style={{ color: D.accentStrong }} />}>
                    <Field label="Μήνες εμπειρίας" helper="Τύπος: μήνες × 7 · μέγιστο 84 μήνες. Αν ξεπεραστεί, εφαρμόζεται cap.">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={peTeTakTikoForm.experienceMonths}
                        onChange={(e) => handlePeTeTakTikoChange("experienceMonths", e.target.value)}
                        placeholder="π.χ. 36"
                        style={inputStyle}
                      />
                    </Field>
                  </CalculatorSection>

                  <CalculatorSection title="Γ. Ξένες γλώσσες" icon={<Languages size={16} style={{ color: D.accentStrong }} />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Άριστη γνώση" helper="Αριθμός γλωσσών × 90">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={peTeTakTikoForm.excellentLanguagesCount}
                          onChange={(e) => handlePeTeTakTikoChange("excellentLanguagesCount", e.target.value)}
                          placeholder="π.χ. 1"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Πολύ καλή γνώση" helper="Αριθμός γλωσσών × 60">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={peTeTakTikoForm.veryGoodLanguagesCount}
                          onChange={(e) => handlePeTeTakTikoChange("veryGoodLanguagesCount", e.target.value)}
                          placeholder="π.χ. 1"
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="Καλή γνώση" helper="Αριθμός γλωσσών × 40">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={peTeTakTikoForm.goodLanguagesCount}
                          onChange={(e) => handlePeTeTakTikoChange("goodLanguagesCount", e.target.value)}
                          placeholder="π.χ. 0"
                          style={inputStyle}
                        />
                      </Field>
                    </div>
                    <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(29,78,216,0.05)", border: "1px solid rgba(29,78,216,0.12)", borderRadius: D.radiusCard }}>
                      <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                        Το σύστημα υπολογίζει έως 3 ξένες γλώσσες συνολικά και κρατά πρώτα τις άριστες, μετά τις πολύ καλές και στο τέλος τις καλές.
                      </p>
                    </div>
                  </CalculatorSection>
                </div>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.08}>
            <aside className="rounded-[2rem] p-6 sticky top-28" style={{ background: "rgba(255,255,255,0.84)", border: `1px solid ${D.border}`, boxShadow: `0 10px 28px ${D.shadow}`, backdropFilter: "blur(12px)", borderRadius: D.radiusShell }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: D.accentSoft, color: D.accentStrong }}>
                <Sigma size={15} />
                <span className="text-xs font-semibold tracking-[0.08em] uppercase">Live αποτέλεσμα</span>
              </div>
              <div className="rounded-[1.5rem] p-5 mb-5" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}>
                <div className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: D.inkSoft, fontWeight: 700 }}>
                  Συνολικά μόρια
                </div>
                <div className="text-[2.85rem] leading-none mb-2" style={{ color: D.ink, fontWeight: 800 }}>
                  {activeMode === "pe-te-taktiko" ? formatGreekNumberFixedTwo(result.total) : formatGreekNumber(result.total)}
                </div>
                <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>
                  Η ένδειξη ανανεώνεται αυτόματα κάθε φορά που αλλάζετε κάποιο πεδίο ή select. Αν υπάρχει validation error, το τελικό άθροισμα δεν υπολογίζεται.
                </p>
              </div>

              {result.errors.length > 0 ? (
                <div className="mb-5 rounded-[1.4rem] p-4" style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: D.radiusCard }}>
                  <div className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: "#b91c1c", fontWeight: 800 }}>
                    Σφάλματα που πρέπει να διορθωθούν
                  </div>
                  <div className="space-y-2">
                    {result.errors.map((error) => (
                      <div key={error} className="flex items-start gap-3">
                        <CircleAlert size={16} style={{ color: "#b91c1c", marginTop: 2, flexShrink: 0 }} />
                        <p className="text-sm" style={{ color: "#991b1b", lineHeight: 1.65 }}>{error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {result.rows.map((row) => (
                  <div key={row.id} className="rounded-xl px-3.5 py-3" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusInner }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm" style={{ color: D.ink, fontWeight: 700 }}>{row.label}</span>
                      <span className="text-sm" style={{ color: row.id === "total" ? D.ink : D.accentStrong, fontWeight: 800 }}>
                        {formatGreekNumber(row.points)}
                      </span>
                    </div>
                    {row.explanation ? (
                      <p className="text-xs mt-1.5" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
                        {row.explanation}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {result.warnings.length > 0 ? (
                <div className="mt-5 rounded-[1.4rem] p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: D.radiusCard }}>
                  <div className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: "#b45309", fontWeight: 800 }}>
                    Προειδοποιήσεις
                  </div>
                  <div className="space-y-2">
                    {result.warnings.map((warning) => (
                      <div key={warning} className="flex items-start gap-3">
                        <CircleAlert size={16} style={{ color: "#b45309", marginTop: 2, flexShrink: 0 }} />
                        <p className="text-sm" style={{ color: "#92400e", lineHeight: 1.65 }}>{warning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (activeMode === "anaplirotes") {
                    setAnaplirotesForm(defaultAnaplirotesForm);
                    return;
                  }
                  if (activeMode === "asep-de") {
                    setDeTakTikoForm(defaultDeTakTikoForm);
                    return;
                  }
                  if (activeMode === "ye-taktiko") {
                    setYeTakTikoForm(defaultYeTakTikoForm);
                    return;
                  }
                  setPeTeTakTikoForm(defaultPeTeTakTikoForm);
                }}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all hover:opacity-95"
                style={{ background: D.ink, color: "#fff", fontWeight: 700, boxShadow: `0 6px 18px ${D.shadow}`, borderRadius: D.radiusControl }}
              >
                Μηδενισμός πεδίων
              </button>
            </aside>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}

function CalculatorSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: D.accentSoft, borderRadius: D.radiusControl }}>
          {icon}
        </div>
        <h3 className="type-display-card" style={{ color: D.ink, fontSize: "1.05rem" }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm" style={{ color: D.ink, fontWeight: 700 }}>
        {label}
      </div>
      {children}
      {helper ? (
        <p className="text-xs mt-2" style={{ color: D.inkSoft, lineHeight: 1.6 }}>
          {helper}
        </p>
      ) : null}
    </label>
  );
}
