export type MoriaCalculatorModeId = "anaplirotes" | "asep-de" | "ye-taktiko" | "pe-te-taktiko";

export const ANAPLIROTES_SPECIALTIES = [
  "ΠΕ01", "ΠΕ02", "ΠΕ03", "ΠΕ04", "ΠΕ05", "ΠΕ06", "ΠΕ07", "ΠΕ08", "ΠΕ11", "ΠΕ33", "ΠΕ34", "ΠΕ40",
  "ΠΕ41", "ΠΕ60", "ΠΕ70", "ΠΕ73", "ΠΕ78", "ΠΕ79.01", "ΠΕ79.02", "ΠΕ80", "ΠΕ81", "ΠΕ82", "ΠΕ83",
  "ΠΕ84", "ΠΕ85", "ΠΕ86", "ΠΕ87", "ΠΕ88", "ΠΕ89", "ΠΕ90", "ΠΕ91",
] as const;

export const FOREIGN_LANGUAGE_OPTIONS = [
  { label: "Αγγλική", value: "en" },
  { label: "Γαλλική", value: "fr" },
  { label: "Γερμανική", value: "de" },
  { label: "Ιταλική", value: "it" },
  { label: "Ισπανική", value: "es" },
  { label: "Άλλη ξένη γλώσσα", value: "other" },
] as const;

export const FOREIGN_LANGUAGE_LEVEL_OPTIONS = [
  { label: "Κανένα", value: "0", points: 0 },
  { label: "Καλή γνώση", value: "3", points: 3 },
  { label: "Πολύ καλή γνώση", value: "5", points: 5 },
  { label: "Άριστη γνώση", value: "7", points: 7 },
] as const;

type ForeignLanguageCode = (typeof FOREIGN_LANGUAGE_OPTIONS)[number]["value"];

const LANGUAGE_LABELS: Record<ForeignLanguageCode, string> = Object.fromEntries(
  FOREIGN_LANGUAGE_OPTIONS.map((item) => [item.value, item.label])
) as Record<ForeignLanguageCode, string>;

const LANGUAGE_SPECIALTY_EXCLUSIONS: Partial<Record<(typeof ANAPLIROTES_SPECIALTIES)[number], ForeignLanguageCode>> = {
  "ΠΕ05": "fr",
  "ΠΕ06": "en",
  "ΠΕ07": "de",
  "ΠΕ34": "it",
  "ΠΕ40": "es",
};

type ServiceFieldKey =
  | "publicServiceMonths"
  | "difficultServiceMonths"
  | "covid2020NormalMonths"
  | "covid2020DifficultMonths"
  | "covid2021NormalMonths"
  | "covid2021DifficultMonths"
  | "privateEducationMonths"
  | "digitalTutoringMonths";

const SERVICE_FIELD_LABELS: Record<ServiceFieldKey, string> = {
  publicServiceMonths: "Δημόσια εκπαιδευτική προϋπηρεσία",
  difficultServiceMonths: "Δυσπρόσιτα / καταστήματα κράτησης από 2020-2021 και μετά",
  covid2020NormalMonths: "Τρίμηνες συμβάσεις COVID 2020-2021 σε δημόσια σχολεία",
  covid2020DifficultMonths: "Τρίμηνες συμβάσεις COVID 2020-2021 σε δυσπρόσιτα / καταστήματα κράτησης",
  covid2021NormalMonths: "Τρίμηνες συμβάσεις COVID 2021-2022 σε δημόσια σχολεία",
  covid2021DifficultMonths: "Τρίμηνες συμβάσεις COVID 2021-2022 σε δυσπρόσιτα / καταστήματα κράτησης",
  privateEducationMonths: "Ιδιωτική εκπαίδευση",
  digitalTutoringMonths: "Ψηφιακό Φροντιστήριο",
};

export interface AnaplirotesMoriaFormInput {
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
}

export interface DeTakTikoFormInput {
  grade: string;
  secondDegreePoints: string;
  experienceMonths: string;
  excellentLanguagesCount: string;
  veryGoodLanguagesCount: string;
  goodLanguagesCount: string;
}

export interface YeTakTikoFormInput {
  childrenCount: string;
  polytekniPoints: string;
  tritekniPoints: string;
  monogoneikiPoints: string;
  continuousUnemploymentPeriods: string;
  nonContinuousUnemploymentPeriods: string;
  experienceMonths: string;
  ageUpTo30Points: string;
}

export interface PeTeTakTikoFormInput {
  grade: string;
  secondTitlePoints: string;
  doctorateCount: string;
  postgraduateCount: string;
  integratedMasterCount: string;
  experienceMonths: string;
  excellentLanguagesCount: string;
  veryGoodLanguagesCount: string;
  goodLanguagesCount: string;
}

export interface MoriaCategoryRow {
  id: string;
  label: string;
  points: number | null;
  explanation: string;
}

export interface MoriaCalculatorResult {
  total: number | null;
  rows: MoriaCategoryRow[];
  errors: string[];
  warnings: string[];
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatGreekNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundToTwo(value));
}

export function formatGreekNumberFixedTwo(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundToTwo(value));
}

function parsePointsValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFlexibleNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRequiredGrade(raw: string) {
  const value = Number(raw);
  if (!raw.trim() || !Number.isFinite(value) || value < 5 || value > 10) {
    return {
      value: null,
      error: "Παρακαλώ συμπλήρωσε έγκυρο βαθμό βασικού τίτλου σπουδών, από 5 έως 10.",
    };
  }

  return { value };
}

function parseMonthField(raw: string, label: string) {
  if (!raw.trim()) {
    return { value: 0 };
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return {
      value: 0,
      error: `Το πεδίο «${label}» πρέπει να συμπληρωθεί σε ακέραιους μήνες. Σύμφωνα με το ΦΕΚ, λαμβάνεται υπόψη η εκπαιδευτική προϋπηρεσία σε μήνες, χωρίς να υπολογίζονται τα υπόλοιπα των ημερών.`,
    };
  }

  return { value };
}

function parseChildren(raw: string) {
  if (!raw.trim()) {
    return { value: 0 };
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { value: 0, error: "Ο αριθμός τέκνων πρέπει να είναι ακέραιος αριθμός." };
  }
  if (value < 0) {
    return { value: 0, error: "Ο αριθμός τέκνων δεν μπορεί να είναι αρνητικός." };
  }

  return { value };
}

function parseDisability(raw: string) {
  if (!raw.trim()) {
    return { value: 0 };
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { value: 0 };
  }
  if (value < 0) {
    return { value: 0, error: "Το ποσοστό αναπηρίας δεν μπορεί να είναι αρνητικό." };
  }
  if (value > 100) {
    return { value: 0, error: "Το ποσοστό αναπηρίας δεν μπορεί να είναι πάνω από 100%." };
  }

  return { value };
}

function compactExplanation(parts: Array<string>) {
  return parts.filter(Boolean).join(" · ") || "Δεν υπάρχουν μόρια σε αυτή την κατηγορία.";
}

function parseNonNegativeCount(raw: string) {
  if (!raw.trim()) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

export function calculateAnaplirotesMoria(input: AnaplirotesMoriaFormInput): MoriaCalculatorResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const specialty = input.specialty.trim();
  if (!specialty) {
    errors.push("Παρακαλώ επίλεξε κλάδο / ειδικότητα.");
  }

  const gradeResult = parseRequiredGrade(input.grade);
  if (gradeResult.error) errors.push(gradeResult.error);
  const grade = gradeResult.value ?? 0;

  const secondDegreePoints = parsePointsValue(input.secondDegreePoints);
  const postgraduatePoints = parsePointsValue(input.postgraduatePoints);
  const doctoratePoints = parsePointsValue(input.doctoratePoints);

  const baseDegreePoints = roundToTwo(grade * 2.5);
  const academicRaw = roundToTwo(baseDegreePoints + secondDegreePoints + postgraduatePoints + doctoratePoints);
  const academicPoints = academicRaw > 120 ? 120 : academicRaw;

  if (academicRaw > 120) {
    warnings.push("Στα ακαδημαϊκά προσόντα εφαρμόστηκε ανώτατο όριο 120 μορίων.");
  }

  const academicExplanationParts = [
    gradeResult.value !== null ? `Βασικός τίτλος: ${formatGreekNumber(baseDegreePoints)} (${formatGreekNumber(grade)} × 2,5)` : "",
    secondDegreePoints > 0 ? `Δεύτερο πτυχίο: ${formatGreekNumber(secondDegreePoints)}` : "",
    doctoratePoints > 0 ? `Διδακτορικό: ${formatGreekNumber(doctoratePoints)}` : "",
    postgraduatePoints === 20 ? "1ος μεταπτυχιακός / integrated master: 20" : "",
    postgraduatePoints === 28 ? "Μεταπτυχιακά / integrated master: 20 + 8" : "",
  ];

  const rawLanguageEntries = [
    {
      code: input.firstLanguage as ForeignLanguageCode | "",
      points: parsePointsValue(input.firstLanguageLevel),
    },
    {
      code: input.secondLanguage as ForeignLanguageCode | "",
      points: parsePointsValue(input.secondLanguageLevel),
    },
  ];

  const languagePointsByCode = new Map<ForeignLanguageCode, number>();
  const excludedLanguage = specialty ? LANGUAGE_SPECIALTY_EXCLUSIONS[specialty as keyof typeof LANGUAGE_SPECIALTY_EXCLUSIONS] : undefined;

  for (const entry of rawLanguageEntries) {
    if (!entry.code || entry.points <= 0) continue;

    if (excludedLanguage && entry.code === excludedLanguage) {
      warnings.push(`Η ${LANGUAGE_LABELS[entry.code]} δεν μοριοδοτείται για τον κλάδο ${specialty}.`);
      continue;
    }

    const current = languagePointsByCode.get(entry.code) ?? 0;
    languagePointsByCode.set(entry.code, Math.max(current, entry.points));
  }

  const selectedLanguageEntries = [...languagePointsByCode.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const languagePoints = roundToTwo(selectedLanguageEntries.reduce((sum, [, points]) => sum + points, 0));
  const languageExplanation = selectedLanguageEntries.length > 0
    ? compactExplanation(selectedLanguageEntries.map(([code, points]) => `${LANGUAGE_LABELS[code]}: ${formatGreekNumber(points)}`))
    : "Δεν έχει προστεθεί μοριοδοτούμενη ξένη γλώσσα.";

  const requestedComputerPoints = parsePointsValue(input.computerKnowledgePoints);
  const computerPoints = specialty === "ΠΕ86" ? 0 : requestedComputerPoints;
  if (specialty === "ΠΕ86" && requestedComputerPoints > 0) {
    warnings.push("Η γνώση Η/Υ δεν μοριοδοτείται για τον κλάδο ΠΕ86.");
  }

  const trainingPoints = parsePointsValue(input.trainingPoints);

  const publicService = parseMonthField(input.publicServiceMonths, SERVICE_FIELD_LABELS.publicServiceMonths);
  const difficultService = parseMonthField(input.difficultServiceMonths, SERVICE_FIELD_LABELS.difficultServiceMonths);
  const covid2020Normal = parseMonthField(input.covid2020NormalMonths, SERVICE_FIELD_LABELS.covid2020NormalMonths);
  const covid2020Difficult = parseMonthField(input.covid2020DifficultMonths, SERVICE_FIELD_LABELS.covid2020DifficultMonths);
  const covid2021Normal = parseMonthField(input.covid2021NormalMonths, SERVICE_FIELD_LABELS.covid2021NormalMonths);
  const covid2021Difficult = parseMonthField(input.covid2021DifficultMonths, SERVICE_FIELD_LABELS.covid2021DifficultMonths);
  const privateEducation = parseMonthField(input.privateEducationMonths, SERVICE_FIELD_LABELS.privateEducationMonths);
  const digitalTutoring = parseMonthField(input.digitalTutoringMonths, SERVICE_FIELD_LABELS.digitalTutoringMonths);

  [
    publicService,
    difficultService,
    covid2020Normal,
    covid2020Difficult,
    covid2021Normal,
    covid2021Difficult,
    privateEducation,
    digitalTutoring,
  ].forEach((entry) => {
    if (entry.error) errors.push(entry.error);
  });

  if (covid2020Normal.value + covid2020Difficult.value > 8) {
    errors.push("Για το σχολικό έτος 2020-2021, το άθροισμα των μηνών τρίμηνης προϋπηρεσίας σε δημόσια σχολεία και σε δυσπρόσιτα / καταστήματα κράτησης δεν μπορεί να ξεπερνά τους 8 μήνες.");
  }

  if (covid2021Normal.value + covid2021Difficult.value > 9) {
    errors.push("Για το σχολικό έτος 2021-2022, το άθροισμα των μηνών τρίμηνης προϋπηρεσίας σε δημόσια σχολεία και σε δυσπρόσιτα / καταστήματα κράτησης δεν μπορεί να ξεπερνά τους 9 μήνες.");
  }

  const publicServicePoints = roundToTwo(publicService.value * 1);
  const difficultServicePoints = roundToTwo(difficultService.value * 2);
  const covid2020NormalRaw = roundToTwo(covid2020Normal.value * 1.5);
  const covid2020DifficultRaw = roundToTwo(covid2020Difficult.value * 3);
  const covid2021NormalRaw = roundToTwo(covid2021Normal.value * 1.5);
  const covid2021DifficultRaw = roundToTwo(covid2021Difficult.value * 3);
  const privateEducationPoints = roundToTwo(privateEducation.value * 0.9);
  const digitalTutoringPoints = roundToTwo(digitalTutoring.value * 1.5);

  const covid2020NormalPoints = Math.min(covid2020NormalRaw, 10);
  const covid2020DifficultPoints = Math.min(covid2020DifficultRaw, 20);
  const covid2021NormalPoints = Math.min(covid2021NormalRaw, 10);
  const covid2021DifficultPoints = Math.min(covid2021DifficultRaw, 20);

  if (covid2020NormalRaw > 10) {
    warnings.push("Στις τρίμηνες συμβάσεις 2020-2021 σε δημόσια σχολεία εφαρμόστηκε το ανώτατο όριο των 10 μορίων για το συγκεκριμένο σχολικό έτος.");
  }
  if (covid2020DifficultRaw > 20) {
    warnings.push("Στις τρίμηνες συμβάσεις 2020-2021 σε δυσπρόσιτα / καταστήματα κράτησης εφαρμόστηκε το ανώτατο όριο των 20 μορίων για το συγκεκριμένο σχολικό έτος.");
  }
  if (covid2021NormalRaw > 10) {
    warnings.push("Στις τρίμηνες συμβάσεις 2021-2022 σε δημόσια σχολεία εφαρμόστηκε το ανώτατο όριο των 10 μορίων για το συγκεκριμένο σχολικό έτος.");
  }
  if (covid2021DifficultRaw > 20) {
    warnings.push("Στις τρίμηνες συμβάσεις 2021-2022 σε δυσπρόσιτα / καταστήματα κράτησης εφαρμόστηκε το ανώτατο όριο των 20 μορίων για το συγκεκριμένο σχολικό έτος.");
  }
  if (digitalTutoring.value > 0) {
    warnings.push("Για το Ψηφιακό Φροντιστήριο υπάρχει ανώτατο όριο μοριοδότησης ανά σχολικό έτος. Ο υπολογισμός εδώ είναι ενδεικτικός.");
  }

  const serviceRaw = roundToTwo(
    publicServicePoints +
      difficultServicePoints +
      covid2020NormalPoints +
      covid2020DifficultPoints +
      covid2021NormalPoints +
      covid2021DifficultPoints +
      privateEducationPoints +
      digitalTutoringPoints
  );
  const servicePoints = serviceRaw > 120 ? 120 : serviceRaw;

  if (serviceRaw > 120) {
    warnings.push("Στην εκπαιδευτική προϋπηρεσία εφαρμόστηκε ανώτατο όριο 120 μορίων.");
  }

  const serviceExplanation = compactExplanation([
    publicService.value > 0 ? `Δημόσια: ${publicService.value} × 1 = ${formatGreekNumber(publicServicePoints)}` : "",
    difficultService.value > 0 ? `Δυσπρόσιτα: ${difficultService.value} × 2 = ${formatGreekNumber(difficultServicePoints)}` : "",
    covid2020Normal.value > 0 ? `COVID 2020-2021 δημόσια: ${formatGreekNumber(covid2020NormalPoints)}` : "",
    covid2020Difficult.value > 0 ? `COVID 2020-2021 δυσπρόσιτα: ${formatGreekNumber(covid2020DifficultPoints)}` : "",
    covid2021Normal.value > 0 ? `COVID 2021-2022 δημόσια: ${formatGreekNumber(covid2021NormalPoints)}` : "",
    covid2021Difficult.value > 0 ? `COVID 2021-2022 δυσπρόσιτα: ${formatGreekNumber(covid2021DifficultPoints)}` : "",
    privateEducation.value > 0 ? `Ιδιωτική: ${formatGreekNumber(privateEducationPoints)}` : "",
    digitalTutoring.value > 0 ? `Ψηφιακό Φροντιστήριο: ${formatGreekNumber(digitalTutoringPoints)}` : "",
  ]);

  const childrenResult = parseChildren(input.minorChildren);
  if (childrenResult.error) errors.push(childrenResult.error);
  const childrenPoints = roundToTwo(childrenResult.value * 3);

  const disabilityResult = parseDisability(input.disabilityPercentage);
  if (disabilityResult.error) errors.push(disabilityResult.error);
  let disabilityPoints = 0;

  if (!disabilityResult.error && disabilityResult.value > 0 && disabilityResult.value < 50) {
    warnings.push("Η αναπηρία μοριοδοτείται όταν το ποσοστό είναι 50% και άνω.");
  } else if (!disabilityResult.error && disabilityResult.value >= 50) {
    disabilityPoints = roundToTwo(disabilityResult.value * 0.4);
  }

  const socialPoints = roundToTwo(childrenPoints + disabilityPoints);
  const socialExplanation = compactExplanation([
    childrenResult.value > 0 ? `Τέκνα: ${childrenResult.value} × 3 = ${formatGreekNumber(childrenPoints)}` : "",
    disabilityPoints > 0 ? `Αναπηρία: ${formatGreekNumber(disabilityResult.value)}% × 0,4 = ${formatGreekNumber(disabilityPoints)}` : "",
  ]);

  const rows: MoriaCategoryRow[] = [
    {
      id: "academic",
      label: "Ακαδημαϊκά προσόντα",
      points: academicPoints,
      explanation: compactExplanation(academicExplanationParts),
    },
    {
      id: "languages",
      label: "Ξένες γλώσσες",
      points: languagePoints,
      explanation: languageExplanation,
    },
    {
      id: "computer",
      label: "Γνώση Η/Υ",
      points: computerPoints,
      explanation: computerPoints > 0 ? "Πιστοποιημένη γνώση Η/Υ / ΤΠΕ Α’ επιπέδου." : "Δεν προστέθηκαν μόρια από Η/Υ.",
    },
    {
      id: "training",
      label: "Επιμόρφωση",
      points: trainingPoints,
      explanation: trainingPoints > 0 ? "Επιμόρφωση τουλάχιστον 300 ωρών και διάρκειας τουλάχιστον 7 μηνών." : "Δεν προστέθηκαν μόρια από επιμόρφωση.",
    },
    {
      id: "service",
      label: "Εκπαιδευτική προϋπηρεσία",
      points: servicePoints,
      explanation: serviceExplanation,
    },
    {
      id: "social",
      label: "Κοινωνικά κριτήρια",
      points: socialPoints,
      explanation: socialExplanation,
    },
  ];

  const total = errors.length === 0
    ? roundToTwo(academicPoints + languagePoints + computerPoints + trainingPoints + servicePoints + socialPoints)
    : null;

  rows.push({
    id: "total",
    label: "Σύνολο",
    points: total,
    explanation: total === null ? "Υπάρχουν σφάλματα που πρέπει να διορθωθούν πριν ολοκληρωθεί ο υπολογισμός." : "Άθροισμα όλων των έγκυρων κατηγοριών.",
  });

  return {
    total,
    rows,
    errors,
    warnings,
  };
}

export function calculateDeTakTikoMoria(input: DeTakTikoFormInput): MoriaCalculatorResult {
  const warnings: string[] = [];

  const rawGrade = Number(input.grade);
  const hasValidGrade = Number.isFinite(rawGrade) && rawGrade >= 4 && rawGrade <= 10;
  const grade = hasValidGrade ? rawGrade : 0;
  const gradePoints = roundToTwo(grade * 60);

  const secondDegreePoints = parsePointsValue(input.secondDegreePoints);

  const rawExperienceMonths = parseNonNegativeCount(input.experienceMonths);
  const experienceMonths = Math.min(rawExperienceMonths, 84);
  if (rawExperienceMonths > 84) {
    warnings.push("Στην εμπειρία εφαρμόστηκε το ανώτατο όριο των 84 μηνών.");
  }
  const experiencePoints = roundToTwo(experienceMonths * 7);

  const excellentLanguagesCount = parseNonNegativeCount(input.excellentLanguagesCount);
  const veryGoodLanguagesCount = parseNonNegativeCount(input.veryGoodLanguagesCount);
  const goodLanguagesCount = parseNonNegativeCount(input.goodLanguagesCount);

  const languageSlots: number[] = [
    ...Array.from({ length: excellentLanguagesCount }, () => 90),
    ...Array.from({ length: veryGoodLanguagesCount }, () => 60),
    ...Array.from({ length: goodLanguagesCount }, () => 40),
  ];

  const countedLanguageSlots = languageSlots.slice(0, 3);
  if (languageSlots.length > 3) {
    warnings.push("Στις ξένες γλώσσες εφαρμόστηκε το ανώτατο όριο των 3 μοριοδοτούμενων γλωσσών.");
  }

  const countedExcellent = Math.min(excellentLanguagesCount, countedLanguageSlots.filter((points) => points === 90).length);
  const countedVeryGood = Math.min(
    veryGoodLanguagesCount,
    countedLanguageSlots.filter((points) => points === 60).length
  );
  const countedGood = Math.min(goodLanguagesCount, countedLanguageSlots.filter((points) => points === 40).length);

  const languagePoints = roundToTwo(countedLanguageSlots.reduce((sum, points) => sum + points, 0));

  const rows: MoriaCategoryRow[] = [
    {
      id: "grade",
      label: "Βαθμός βασικού τίτλου",
      points: gradePoints,
      explanation: hasValidGrade
        ? `Βαθμός: ${formatGreekNumber(grade)} × 60 = ${formatGreekNumber(gradePoints)}`
        : "Έγκυρος βαθμός μόνο από 4 έως 10. Εκτός εύρους, η κατηγορία μετρά 0.",
    },
    {
      id: "second-degree",
      label: "Δεύτερος τίτλος σπουδών",
      points: secondDegreePoints,
      explanation: secondDegreePoints > 0 ? "Δεύτερος τίτλος: 110 μόρια." : "Δεν προστέθηκαν μόρια από δεύτερο τίτλο.",
    },
    {
      id: "experience",
      label: "Εμπειρία",
      points: experiencePoints,
      explanation:
        experienceMonths > 0
          ? `Μήνες εμπειρίας: ${formatGreekNumber(experienceMonths)} × 7 = ${formatGreekNumber(experiencePoints)}`
          : "Δεν προστέθηκαν μόρια από εμπειρία.",
    },
    {
      id: "languages",
      label: "Ξένες γλώσσες",
      points: languagePoints,
      explanation: compactExplanation([
        countedExcellent > 0 ? `Άριστη γνώση: ${countedExcellent} × 90 = ${formatGreekNumber(countedExcellent * 90)}` : "",
        countedVeryGood > 0 ? `Πολύ καλή γνώση: ${countedVeryGood} × 60 = ${formatGreekNumber(countedVeryGood * 60)}` : "",
        countedGood > 0 ? `Καλή γνώση: ${countedGood} × 40 = ${formatGreekNumber(countedGood * 40)}` : "",
      ]),
    },
  ];

  const total = roundToTwo(gradePoints + secondDegreePoints + experiencePoints + languagePoints);

  rows.push({
    id: "total",
    label: "Σύνολο",
    points: total,
    explanation: "Άθροισμα βαθμού, δεύτερου τίτλου, εμπειρίας και μοριοδοτούμενων ξένων γλωσσών.",
  });

  return {
    total,
    rows,
    errors: [],
    warnings,
  };
}

export function calculateYeTakTikoMoria(input: YeTakTikoFormInput): MoriaCalculatorResult {
  const warnings: string[] = [];

  const rawChildrenCount = parseNonNegativeCount(input.childrenCount);
  const childrenCount = Math.min(rawChildrenCount, 6);
  if (rawChildrenCount > 6) {
    warnings.push("Στα ανήλικα τέκνα εφαρμόστηκε το ανώτατο όριο των 6 τέκνων.");
  }
  const childrenPoints = roundToTwo(childrenCount * 200);

  const polytekniPoints = parsePointsValue(input.polytekniPoints);
  let tritekniPoints = parsePointsValue(input.tritekniPoints);
  let monogoneikiPoints = parsePointsValue(input.monogoneikiPoints);

  if (polytekniPoints > 0) {
    if (tritekniPoints > 0) {
      warnings.push("Το κριτήριο τριτεκνίας δεν προσμετράται όταν έχει ήδη μετρήσει το κριτήριο πολύτεκνης οικογένειας.");
    }
    tritekniPoints = 0;
  }

  if (polytekniPoints > 0 || tritekniPoints > 0) {
    if (monogoneikiPoints > 0) {
      warnings.push("Το κριτήριο μονογονεϊκής οικογένειας δεν προσμετράται όταν έχει ήδη μετρήσει πολύτεκνη ή τρίτεκνη οικογένεια.");
    }
    monogoneikiPoints = 0;
  }

  const familyPoints = roundToTwo(childrenPoints + polytekniPoints + tritekniPoints + monogoneikiPoints);

  const rawContinuousPeriods = parseNonNegativeCount(input.continuousUnemploymentPeriods);
  const continuousPeriods = Math.min(rawContinuousPeriods, 10);
  if (rawContinuousPeriods > 10) {
    warnings.push("Στη συνεχόμενη ανεργία εφαρμόστηκε το ανώτατο όριο των 10 εξαμήνων.");
  }
  const continuousUnemploymentPoints = roundToTwo(continuousPeriods * 50);

  const rawNonContinuousPeriods = parseNonNegativeCount(input.nonContinuousUnemploymentPeriods);
  const nonContinuousPeriods = Math.min(rawNonContinuousPeriods, 5);
  if (rawNonContinuousPeriods > 5) {
    warnings.push("Στη μη συνεχόμενη ανεργία εφαρμόστηκε το ανώτατο όριο των 5 εξαμήνων.");
  }
  const nonContinuousUnemploymentPoints = roundToTwo(nonContinuousPeriods * 20);

  const unemploymentPoints = Math.max(continuousUnemploymentPoints, nonContinuousUnemploymentPoints);
  if (continuousUnemploymentPoints > 0 && nonContinuousUnemploymentPoints > 0) {
    warnings.push("Στην ανεργία υπολογίστηκε μόνο η κατηγορία με τα περισσότερα μόρια.");
  }

  const rawExperienceMonths = parseNonNegativeCount(input.experienceMonths);
  const experienceMonths = Math.min(rawExperienceMonths, 84);
  if (rawExperienceMonths > 84) {
    warnings.push("Στην εμπειρία εφαρμόστηκε το ανώτατο όριο των 84 μηνών.");
  }
  const experiencePoints = roundToTwo(experienceMonths * 7);

  const ageUpTo30Points = parsePointsValue(input.ageUpTo30Points);

  const rows: MoriaCategoryRow[] = [
    {
      id: "family",
      label: "Οικογενειακά κριτήρια",
      points: familyPoints,
      explanation: compactExplanation([
        childrenCount > 0 ? `Ανήλικα τέκνα: ${childrenCount} × 200 = ${formatGreekNumber(childrenPoints)}` : "",
        polytekniPoints > 0 ? "Τέκνο πολύτεκνης οικογένειας: 300" : "",
        tritekniPoints > 0 ? "Τέκνο τρίτεκνης οικογένειας: 200" : "",
        monogoneikiPoints > 0 ? "Τέκνο μονογονεϊκής οικογένειας: 100" : "",
      ]),
    },
    {
      id: "unemployment",
      label: "Ανεργία",
      points: unemploymentPoints,
      explanation:
        unemploymentPoints > 0
          ? unemploymentPoints === continuousUnemploymentPoints
            ? `Συνεχόμενη ανεργία: ${continuousPeriods} εξάμηνα × 50 = ${formatGreekNumber(continuousUnemploymentPoints)}`
            : `Μη συνεχόμενη ανεργία: ${nonContinuousPeriods} εξάμηνα × 20 = ${formatGreekNumber(nonContinuousUnemploymentPoints)}`
          : "Δεν προστέθηκαν μόρια από ανεργία.",
    },
    {
      id: "experience",
      label: "Εμπειρία",
      points: experiencePoints,
      explanation:
        experienceMonths > 0
          ? `Μήνες εμπειρίας: ${formatGreekNumber(experienceMonths)} × 7 = ${formatGreekNumber(experiencePoints)}`
          : "Δεν προστέθηκαν μόρια από εμπειρία.",
    },
    {
      id: "age",
      label: "Ηλικία έως 30 ετών",
      points: ageUpTo30Points,
      explanation: ageUpTo30Points > 0 ? "Ηλικία έως και 30 ετών: 75 μόρια." : "Δεν προστέθηκαν μόρια από το ηλικιακό κριτήριο.",
    },
  ];

  const total = roundToTwo(familyPoints + unemploymentPoints + experiencePoints + ageUpTo30Points);

  rows.push({
    id: "total",
    label: "Σύνολο",
    points: total,
    explanation: "Άθροισμα οικογενειακών κριτηρίων, ανεργίας, εμπειρίας και ηλικιακού κριτηρίου.",
  });

  return {
    total,
    rows,
    errors: [],
    warnings,
  };
}

export function calculatePeTeTakTikoMoria(input: PeTeTakTikoFormInput): MoriaCalculatorResult {
  const warnings: string[] = [];

  const rawGrade = parseFlexibleNumber(input.grade);
  const hasValidGrade = rawGrade >= 5 && rawGrade <= 10;
  const gradePoints = hasValidGrade ? roundToTwo(rawGrade * 60) : 0;

  const secondTitlePoints = parsePointsValue(input.secondTitlePoints);

  const doctorateCount = Math.max(0, Math.min(2, parseNonNegativeCount(input.doctorateCount)));
  const postgraduateCount = Math.max(0, Math.min(2, parseNonNegativeCount(input.postgraduateCount)));
  const integratedMasterCount = Math.max(0, Math.min(2, parseNonNegativeCount(input.integratedMasterCount)));

  let extraTitleBonusUsed = false;

  let doctoratePoints = 0;
  if (doctorateCount === 1) {
    doctoratePoints = 400;
  } else if (doctorateCount >= 2) {
    doctoratePoints = 600;
    extraTitleBonusUsed = true;
  }

  let postgraduatePoints = 0;
  if (postgraduateCount === 1) {
    postgraduatePoints = 180;
  } else if (postgraduateCount >= 2) {
    postgraduatePoints = extraTitleBonusUsed ? 180 : 270;
    if (!extraTitleBonusUsed) {
      extraTitleBonusUsed = true;
    }
  }

  let integratedMasterPoints = 0;
  if (integratedMasterCount === 1) {
    integratedMasterPoints = 90;
  } else if (integratedMasterCount >= 2) {
    integratedMasterPoints = extraTitleBonusUsed ? 90 : 135;
    if (!extraTitleBonusUsed) {
      extraTitleBonusUsed = true;
    }
  }

  const rawExperienceMonths = parseNonNegativeCount(input.experienceMonths);
  const experienceMonths = Math.min(rawExperienceMonths, 84);
  if (rawExperienceMonths > 84) {
    warnings.push("Στην εμπειρία εφαρμόστηκε το ανώτατο όριο των 84 μηνών.");
  }
  const experiencePoints = roundToTwo(experienceMonths * 7);

  const excellentLanguagesCount = parseNonNegativeCount(input.excellentLanguagesCount);
  const veryGoodLanguagesCount = parseNonNegativeCount(input.veryGoodLanguagesCount);
  const goodLanguagesCount = parseNonNegativeCount(input.goodLanguagesCount);

  const rawLanguageSlots: Array<90 | 60 | 40> = [
    ...Array.from({ length: excellentLanguagesCount }, () => 90 as const),
    ...Array.from({ length: veryGoodLanguagesCount }, () => 60 as const),
    ...Array.from({ length: goodLanguagesCount }, () => 40 as const),
  ];

  const countedLanguageSlots = rawLanguageSlots.slice(0, 3);
  if (rawLanguageSlots.length > 3) {
    warnings.push("Στις ξένες γλώσσες εφαρμόστηκε το ανώτατο όριο των 3 μοριοδοτούμενων γλωσσών.");
  }

  const countedExcellent = countedLanguageSlots.filter((points) => points === 90).length;
  const countedVeryGood = countedLanguageSlots.filter((points) => points === 60).length;
  const countedGood = countedLanguageSlots.filter((points) => points === 40).length;

  const excellentLanguagePoints = countedExcellent * 90;
  const veryGoodLanguagePoints = countedVeryGood * 60;
  const goodLanguagePoints = countedGood * 40;

  const total = roundToTwo(
    gradePoints +
      secondTitlePoints +
      doctoratePoints +
      postgraduatePoints +
      integratedMasterPoints +
      experiencePoints +
      excellentLanguagePoints +
      veryGoodLanguagePoints +
      goodLanguagePoints
  );

  const rows: MoriaCategoryRow[] = [
    {
      id: "grade",
      label: "Βαθμός βασικού τίτλου σπουδών",
      points: gradePoints,
      explanation: hasValidGrade
        ? `Βαθμός: ${formatGreekNumber(rawGrade)} × 60 = ${formatGreekNumber(gradePoints)}`
        : "Έγκυρος βαθμός μόνο από 5 έως 10. Εκτός εύρους, η κατηγορία μετρά 0.",
    },
    {
      id: "second-title",
      label: "Δεύτερος τίτλος σπουδών",
      points: secondTitlePoints,
      explanation: secondTitlePoints > 0 ? "Δεύτερος τίτλος ίδιου επιπέδου και κλάδου: 100 μόρια." : "Δεν προστέθηκαν μόρια από δεύτερο τίτλο.",
    },
    {
      id: "doctorate",
      label: "Διδακτορικό δίπλωμα",
      points: doctoratePoints,
      explanation:
        doctorateCount === 2
          ? "2 διδακτορικοί τίτλοι: 600 μόρια και ενεργοποίηση του shared extra-title bonus."
          : doctorateCount === 1
            ? "1 διδακτορικός τίτλος: 400 μόρια."
            : "Δεν προστέθηκαν μόρια από διδακτορικό.",
    },
    {
      id: "postgraduate",
      label: "Μεταπτυχιακός τίτλος",
      points: postgraduatePoints,
      explanation:
        postgraduateCount === 2
          ? postgraduatePoints === 270
            ? "2 μεταπτυχιακοί τίτλοι: 270 μόρια, επειδή το shared extra-title bonus ήταν διαθέσιμο."
            : "2 μεταπτυχιακοί τίτλοι: 180 μόρια, επειδή το shared extra-title bonus χρησιμοποιήθηκε ήδη."
          : postgraduateCount === 1
            ? "1 μεταπτυχιακός τίτλος: 180 μόρια."
            : "Δεν προστέθηκαν μόρια από μεταπτυχιακό.",
    },
    {
      id: "integrated-master",
      label: "Integrated master",
      points: integratedMasterPoints,
      explanation:
        integratedMasterCount === 2
          ? integratedMasterPoints === 135
            ? "2 integrated master: 135 μόρια, επειδή το shared extra-title bonus ήταν διαθέσιμο."
            : "2 integrated master: 90 μόρια, επειδή το shared extra-title bonus χρησιμοποιήθηκε ήδη."
          : integratedMasterCount === 1
            ? "1 integrated master: 90 μόρια."
            : "Δεν προστέθηκαν μόρια από integrated master.",
    },
    {
      id: "experience",
      label: "Εμπειρία",
      points: experiencePoints,
      explanation:
        experienceMonths > 0
          ? `Μήνες εμπειρίας: ${formatGreekNumber(experienceMonths)} × 7 = ${formatGreekNumber(experiencePoints)}`
          : "Δεν προστέθηκαν μόρια από εμπειρία.",
    },
    {
      id: "languages-excellent",
      label: "Ξένες γλώσσες με άριστη γνώση",
      points: excellentLanguagePoints,
      explanation:
        countedExcellent > 0
          ? `${countedExcellent} γλώσσες × 90 = ${formatGreekNumber(excellentLanguagePoints)}`
          : "Δεν προστέθηκαν μόρια από άριστη γνώση ξένων γλωσσών.",
    },
    {
      id: "languages-very-good",
      label: "Ξένες γλώσσες με πολύ καλή γνώση",
      points: veryGoodLanguagePoints,
      explanation:
        countedVeryGood > 0
          ? `${countedVeryGood} γλώσσες × 60 = ${formatGreekNumber(veryGoodLanguagePoints)}`
          : "Δεν προστέθηκαν μόρια από πολύ καλή γνώση ξένων γλωσσών.",
    },
    {
      id: "languages-good",
      label: "Ξένες γλώσσες με καλή γνώση",
      points: goodLanguagePoints,
      explanation:
        countedGood > 0
          ? `${countedGood} γλώσσες × 40 = ${formatGreekNumber(goodLanguagePoints)}`
          : "Δεν προστέθηκαν μόρια από καλή γνώση ξένων γλωσσών.",
    },
    {
      id: "total",
      label: "Σύνολο",
      points: total,
      explanation: "Άθροισμα βαθμού, τίτλων, εμπειρίας και ξένων γλωσσών με όλους τους κανόνες και τα caps εφαρμοσμένα.",
    },
  ];

  return {
    total,
    rows,
    errors: [],
    warnings,
  };
}
