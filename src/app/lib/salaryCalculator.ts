export const SALARY_REFERENCE_YEAR = 2026;

export const EDUCATION_OPTIONS = [
  { label: "Πανεπιστημιακής Εκπαίδευσης (Π.Ε.)", value: "1" },
  { label: "Τεχνολογικής Εκπαίδευσης (Τ.Ε.)", value: "2" },
  { label: "Δευτεροβάθμιας Εκπαίδευσης (Δ.Ε.)", value: "3" },
  { label: "Υποχρεωτικής Εκπαίδευσης (Υ.Ε.)", value: "4" },
] as const;

export const POSTGRADUATE_STUDIES_OPTIONS = [
  { label: "Χωρίς μεταπτυχιακό τίτλο", value: "0" },
  { label: "Μεταπτυχιακό", value: "1" },
  { label: "Διδακτορικό", value: "2" },
] as const;

export const PROBATIONER_OPTIONS = [
  { label: "Μόνιμος", value: "0" },
  { label: "Δόκιμος (1ο έτος)", value: "1" },
  { label: "Δόκιμος (2ο έτος)", value: "2" },
] as const;

export const EXPERIENCE_OPTIONS = Array.from({ length: 41 }, (_, index) => ({
  label: index === 0 ? "Χωρίς προϋπηρεσία" : `${index}`,
  value: String(index),
}));

export const CHILDREN_OPTIONS = Array.from({ length: 11 }, (_, index) => ({
  label: index === 0 ? "Χωρίς εξαρτώμενα μέλη" : `${index}`,
  value: String(index),
}));

export const AGE_OPTIONS = [
  { label: "22", value: "22" },
  { label: "23", value: "23" },
  { label: "24", value: "24" },
  { label: "25", value: "25" },
  { label: "26", value: "26" },
  { label: "27", value: "27" },
  { label: "28", value: "28" },
  { label: "29", value: "29" },
  { label: "30", value: "30" },
  { label: "31+", value: "31" },
] as const;

export type SalaryAllowanceCategoryId =
  | "family"
  | "hazard"
  | "remote"
  | "aade"
  | "responsibility";

export interface SalaryAllowanceOption {
  id: number;
  label: string;
  amount: number;
}

export interface SalaryAllowanceGroup {
  id: SalaryAllowanceCategoryId;
  label: string;
  options: readonly SalaryAllowanceOption[];
}

export const SALARY_ALLOWANCE_GROUPS: readonly SalaryAllowanceGroup[] = [
  {
    id: "family",
    label: "Οικογενειακή παροχή",
    options: [
      { id: 19, label: "1 παιδί (70€)", amount: 70 },
      { id: 20, label: "2 παιδιά (120€)", amount: 120 },
      { id: 21, label: "3 παιδιά (170€)", amount: 170 },
      { id: 22, label: "4 παιδιά (220€)", amount: 220 },
      { id: 23, label: "5 παιδιά (290€)", amount: 290 },
      { id: 24, label: "6 παιδιά (360€)", amount: 360 },
      { id: 25, label: "7 παιδιά (430€)", amount: 430 },
      { id: 26, label: "8 παιδιά (500€)", amount: 500 },
      { id: 27, label: "9 παιδιά (570€)", amount: 570 },
      { id: 28, label: "10 παιδιά (660€)", amount: 660 },
    ],
  },
  {
    id: "hazard",
    label: "Επίδομα επικίνδυνης και ανθυγιεινής εργασίας",
    options: [
      { id: 14, label: "Κατηγορία Α' (200€)", amount: 200 },
      { id: 15, label: "Κατηγορία Β' (165€)", amount: 165 },
      { id: 16, label: "Κατηγορία Γ' (150€)", amount: 150 },
      { id: 17, label: "Κατηγορία Δ' (105€)", amount: 105 },
      { id: 18, label: "Κατηγορία Ε' (70€)", amount: 70 },
    ],
  },
  {
    id: "remote",
    label: "Επίδομα απομακρυσμένων - παραμεθορίων περιοχών",
    options: [
      { id: 29, label: "Κατηγορία 1 (προσαύξηση 400 ευρώ) (500€)", amount: 500 },
      { id: 30, label: "Κατηγορία 2 (προσαύξηση 200 ευρώ) (300€)", amount: 300 },
      { id: 31, label: "Κατηγορία 3 (προσαύξηση 100 ευρώ) (200€)", amount: 200 },
      { id: 42, label: "Χωρίς προσαύξηση (100€)", amount: 100 },
    ],
  },
  {
    id: "aade",
    label: "Περίγραμμα θέσης εργασίας (ΑΑΔΕ)",
    options: [
      { id: 1, label: "Βαθμός Α (2200€)", amount: 2200 },
      { id: 2, label: "Βαθμός Β (1750€)", amount: 1750 },
      { id: 3, label: "Βαθμός Γ (1600€)", amount: 1600 },
      { id: 4, label: "Βαθμός Δ (1450€)", amount: 1450 },
      { id: 5, label: "Βαθμός Ε (1250€)", amount: 1250 },
      { id: 6, label: "Βαθμός ΣΤ (1100€)", amount: 1100 },
      { id: 7, label: "Βαθμός Ζ (980€)", amount: 980 },
      { id: 8, label: "Βαθμός Η (850€)", amount: 850 },
      { id: 9, label: "Βαθμός Θ (600€)", amount: 600 },
      { id: 10, label: "Βαθμός Ι (370€)", amount: 370 },
      { id: 11, label: "Βαθμός ΙΑ (150€)", amount: 150 },
      { id: 12, label: "Βαθμός ΙΒ (100€)", amount: 100 },
      { id: 13, label: "Βαθμός ΙΓ (0€)", amount: 0 },
    ],
  },
  {
    id: "responsibility",
    label: "Επίδομα θέσης ευθύνης",
    options: [
      { id: 32, label: "Γενικοί και Υπηρεσιακοί Γραμματείς (1820€)", amount: 1820 },
      { id: 33, label: "Αναπληρωτές Γενικοί και Ειδικοί Γραμματείς Υπουργείου (1495€)", amount: 1495 },
      { id: 34, label: "Υπάλληλοι κατηγορίας ειδικών θέσεων 1ου βαθμού (780€)", amount: 780 },
      { id: 35, label: "Υπάλληλοι κατηγορίας ειδικών θέσεων 2ου βαθμού (715€)", amount: 715 },
      { id: 36, label: "Προϊστάμενοι Γενικών Διευθύνσεων και Συντονιστές Αποκεντρωμένων Διοικήσεων (1300€)", amount: 1300 },
      { id: 37, label: "Προϊστάμενοι Διευθύνσεων και πολιτικών γραφείων (585€)", amount: 585 },
      { id: 38, label: "Προϊστάμενοι Υποδιευθύνσεων (455€)", amount: 455 },
      { id: 39, label: "Προϊστάμενοι Τμημάτων (377€)", amount: 377 },
      { id: 40, label: "Διοικητής Συντονιστικού Οργάνου Πολιτικής Προστασίας (845€)", amount: 845 },
      { id: 41, label: "Περιφερειακοί συντονιστές πολιτικής προστασίας (585€)", amount: 585 },
    ],
  },
] as const;

const ALLOWANCE_OPTION_BY_ID = new Map(
  SALARY_ALLOWANCE_GROUPS.flatMap((group) =>
    group.options.map((option) => [
      option.id,
      {
        ...option,
        allowanceId: group.id,
        allowanceName: group.label,
      },
    ])
  )
);

const BASE_SCALE_BY_EDUCATION: Record<number, Record<number, number>> = {
  1: {
    2: 1291, 3: 1350, 4: 1409, 5: 1468, 6: 1527, 7: 1586, 8: 1645, 9: 1704, 10: 1763,
    11: 1822, 12: 1881, 13: 1940, 14: 1999, 15: 2058, 16: 2117, 17: 2176, 18: 2235, 19: 2294,
  },
  2: {
    2: 1232, 3: 1287, 4: 1342, 5: 1397, 6: 1452, 7: 1507, 8: 1562, 9: 1617, 10: 1672,
    11: 1727, 12: 1782, 13: 1837, 14: 1892, 15: 1947, 16: 2002, 17: 2057, 18: 2112, 19: 2167,
  },
  3: {
    1: 998, 2: 1058, 3: 1118, 4: 1178, 5: 1238, 6: 1298, 7: 1358, 8: 1418, 9: 1478, 10: 1538,
    11: 1598, 12: 1658, 13: 1718,
  },
  4: {
    1: 920, 2: 963, 3: 1006, 4: 1049, 5: 1092, 6: 1135, 7: 1178, 8: 1221, 9: 1264, 10: 1307,
    11: 1350, 12: 1393, 13: 1436,
  },
};

const MAX_DEGREES_BY_EDUCATION: Record<number, number> = {
  1: 19,
  2: 19,
  3: 13,
  4: 13,
};

const CHILD_TAX_REDUCTION_BASE: Record<number, number> = {
  0: 777,
  1: 900,
  2: 1120,
  3: 1340,
  4: 1580,
  5: 1780,
  6: 2000,
  7: 2220,
  8: 2440,
  9: 2660,
  10: 2880,
};

const DEDUCTION_DEFINITIONS = [
  { key: "tpdy", name: "Τ.Π.Δ.Υ. (4.00%)", description: "Τέως Ταμείο Προνοίας Δημοσίων Υπαλλήλων", basisPoints: 400 },
  { key: "mtpy", name: "Μ.Τ.Π.Υ. (4.50%)", description: "Μετοχικό Ταμείο Πολιτικών Υπαλλήλων", basisPoints: 450 },
  { key: "teady", name: "ΤΕΑΔΥ (ΤΑΥΤΥ) ΑΣΦΛ (3.00%)", description: "Ενιαίο Ταμείο Επικουρικής Ασφάλισης & Εφάπαξ Παροχών", basisPoints: 300 },
  { key: "health", name: "ΥΓΕΙΟΝ. ΑΣΦ. (2.05%)", description: "Υγιεινομική Περίθαλψη", basisPoints: 205 },
  { key: "efka", name: "ΕΦΚΑ Κλάδος Σύνταξης ΑΣΦΛ (6.67%)", description: "ΕΦΚΑ Κλάδος Σύνταξης Ασφαλισμένων", basisPoints: 667 },
  { key: "mtpy_new", name: "Μ.Τ.Π.Υ. ΝΕΟΔΙΟΡΙΣΜΟΥ (8.33%)", description: "Μετοχικό Ταμείο Πολιτικών Υπαλλήλων (εγγραφή νεοδιοριζόμενου)", basisPoints: 833 },
  { key: "unemployment", name: "Εισφορά αλληλ. υπέρ καταπ. της ανεργίας (2.00%)", description: "Εισφορά αλληλεγγύης υπέρ καταπολέμησης της ανεργίας", basisPoints: 200 },
] as const;

const TAX_BRACKETS = [
  { upTo: 10000, rate: 0.09 },
  { upTo: 20000, rate: 0.2 },
  { upTo: 30000, rate: 0.26 },
  { upTo: 40000, rate: 0.34 },
  { upTo: 60000, rate: 0.39 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.44 },
] as const;

const CHILDREN_TAX_RATE_PROFILES: Record<number, readonly [number, number, number]> = {
  0: [0.09, 0.2, 0.26],
  1: [0.09, 0.18, 0.24],
  2: [0.09, 0.16, 0.22],
  3: [0.09, 0.09, 0.2],
  4: [0, 0, 0.18],
  5: [0, 0, 0.16],
  6: [0, 0, 0.14],
  7: [0, 0, 0.12],
  8: [0, 0, 0.1],
  9: [0, 0, 0.08],
  10: [0, 0, 0.09],
};

export interface SalaryCalculatorFormInput {
  education: string;
  postgraduateStudies: string;
  children: string;
  age: string;
  firstAppointment: boolean;
  probationer: string;
  experience: string;
  mtpyExcluded: boolean;
  familyAllowanceId: string;
  hazardAllowanceId: string;
  remoteAllowanceId: string;
  aadeAllowanceId: string;
  responsibilityAllowanceId: string;
}

export interface SalaryBreakdownItem {
  id: number | null;
  name: string;
  description: string;
  value: number;
}

export interface SalaryAllowanceBreakdownItem {
  id: number;
  name: string;
  allowanceId: SalaryAllowanceCategoryId;
  allowanceName: string;
  amount: number;
  rate: number;
}

export interface SalaryTaxBreakdown {
  taxableIncome: number;
  scaleTax: number;
  taxReduction: number;
  taxIncome: number;
  payrollTax: number;
}

export interface SalaryCalculationResult {
  person: {
    referenceYear: number;
    education: number;
    postgraduateStudies: number;
    children: number;
    experience: number;
    firstAppointment: boolean;
    mtpyExcluded: boolean;
    allowancesItems: number[];
    probationer: number;
    age: number;
  };
  referenceYear: number;
  degreesByExperience: number;
  degreesByPostgraduateStudies: number;
  totalDegrees: number;
  validDegrees: number;
  maximumDegrees: number;
  firstAppointment: boolean;
  grossPayBasedOnExperienceAndPostgraduateStudies: number;
  grossPay: number;
  netPay: number;
  payableAmount: number;
  deductions: SalaryBreakdownItem[];
  deductionsSum: number;
  allowances: SalaryAllowanceBreakdownItem[];
  allowancesSum: number;
  tax: SalaryTaxBreakdown;
  explainList: string[];
}

const DEFAULT_FORM_INPUT: SalaryCalculatorFormInput = {
  education: "1",
  postgraduateStudies: "0",
  children: "0",
  age: "31",
  firstAppointment: false,
  probationer: "0",
  experience: "2",
  mtpyExcluded: false,
  familyAllowanceId: "0",
  hazardAllowanceId: "0",
  remoteAllowanceId: "0",
  aadeAllowanceId: "0",
  responsibilityAllowanceId: "0",
};

export const defaultSalaryCalculatorForm = DEFAULT_FORM_INPUT;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(value: number) {
  return value / 100;
}

function percentOfAmountCents(amount: number, basisPoints: number) {
  return Math.round((amount * basisPoints) / 10000);
}

function formatCurrencyLabel(value: number) {
  return `${formatGreekNumberFixedTwo(value)}€`;
}

function toInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getEducationLabel(education: number) {
  return EDUCATION_OPTIONS.find((option) => Number(option.value) === education)?.label ?? EDUCATION_OPTIONS[0].label;
}

function getPostgraduateLabel(value: number) {
  return POSTGRADUATE_STUDIES_OPTIONS.find((option) => Number(option.value) === value)?.label ?? POSTGRADUATE_STUDIES_OPTIONS[0].label;
}

function getExperienceDegrees(education: number, experience: number) {
  const maximumDegrees = MAX_DEGREES_BY_EDUCATION[education] ?? 19;

  if (education === 1 || education === 2) {
    const degrees = experience <= 3 ? 2 : 2 + Math.floor((experience - 2) / 2);
    return Math.min(degrees, maximumDegrees);
  }
  return Math.min(1 + Math.floor(experience / 3), maximumDegrees);
}

function getPostgraduateDegrees(education: number, postgraduateStudies: number) {
  if (education !== 1 && education !== 2) return 0;
  if (postgraduateStudies === 1) return 2;
  if (postgraduateStudies === 2) return 6;
  return 0;
}

function getAdjustedAllowanceAmount(optionId: number, amount: number, probationer: number) {
  if (optionId >= 1 && optionId <= 13) {
    if (probationer === 1) return round2(amount * 0.75);
    if (probationer === 2) return round2(amount * 0.9);
  }

  return amount;
}

function getSelectedAllowanceItems(form: SalaryCalculatorFormInput, probationer: number): SalaryAllowanceBreakdownItem[] {
  const selectedIds = [
    form.familyAllowanceId,
    form.hazardAllowanceId,
    form.remoteAllowanceId,
    form.aadeAllowanceId,
    form.responsibilityAllowanceId,
  ]
    .map((value) => toInt(value, 0))
    .filter((value) => value > 0);

  return selectedIds
    .map((id) => {
      const allowance = ALLOWANCE_OPTION_BY_ID.get(id);
      if (!allowance) return null;
      return {
        id: allowance.id,
        name: allowance.label.replace(/\s*\(\d+€\)$/, ""),
        allowanceId: allowance.allowanceId,
        allowanceName: allowance.allowanceName,
        amount: getAdjustedAllowanceAmount(allowance.id, allowance.amount, probationer),
        rate: 0,
      } satisfies SalaryAllowanceBreakdownItem;
    })
    .filter((allowance): allowance is SalaryAllowanceBreakdownItem => allowance !== null);
}

function getGrossScale(education: number, validDegrees: number) {
  const scales = BASE_SCALE_BY_EDUCATION[education] ?? BASE_SCALE_BY_EDUCATION[1];
  const fallbackDegree = Math.min(
    Math.max(validDegrees, Math.min(...Object.keys(scales).map(Number))),
    Math.max(...Object.keys(scales).map(Number))
  );
  return scales[validDegrees] ?? scales[fallbackDegree] ?? 0;
}

function getTaxRatesForProfile(children: number, age: number) {
  const cappedChildren = clamp(children, 0, 10);
  const profile = CHILDREN_TAX_RATE_PROFILES[cappedChildren] ?? CHILDREN_TAX_RATE_PROFILES[0];
  const rates: number[] = TAX_BRACKETS.map((bracket) => bracket.rate);

  rates[0] = profile[0];
  rates[1] = profile[1];
  rates[2] = profile[2];

  if (age <= 25) {
    rates[0] = 0;
    rates[1] = 0;
  } else if (age <= 30) {
    rates[0] = 0;
    rates[1] = Math.max(0, rates[1] - 0.02);
  }

  return rates;
}

function computeScaleTax(taxableIncome: number, age: number, children: number) {
  const rates = getTaxRatesForProfile(children, age);
  let remaining = taxableIncome;
  let previousUpperBound = 0;
  let total = 0;

  for (const [index, bracket] of TAX_BRACKETS.entries()) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.upTo - previousUpperBound);
    total += taxableInBracket * rates[index]!;
    remaining -= taxableInBracket;
    previousUpperBound = bracket.upTo;
  }

  return round2(Math.max(0, total));
}

function computeTaxReduction(children: number, taxableIncome: number) {
  const cappedChildren = clamp(children, 0, 10);
  const baseReduction = CHILD_TAX_REDUCTION_BASE[cappedChildren];
  if (cappedChildren >= 5) {
    return round2(baseReduction);
  }
  const roundedTaxableIncome = Math.round(taxableIncome);
  const reductionOffset = Math.max(0, roundedTaxableIncome - 12000) * 0.02;
  return Math.max(0, round2(baseReduction - reductionOffset));
}

function buildExplainList({
  educationLabel,
  experience,
  experienceDegrees,
  postgraduateStudies,
  postgraduateDegrees,
  validDegrees,
  grossPayBasedOnExperienceAndPostgraduateStudies,
  allowances,
  grossPay,
  deductions,
  deductionsSum,
  netPay,
  taxableIncome,
  payableAmount,
  age,
  firstAppointment,
  probationer,
  mtpyExcluded,
}: {
  educationLabel: string;
  experience: number;
  experienceDegrees: number;
  postgraduateStudies: number;
  postgraduateDegrees: number;
  validDegrees: number;
  grossPayBasedOnExperienceAndPostgraduateStudies: number;
  allowances: SalaryAllowanceBreakdownItem[];
  grossPay: number;
  deductions: SalaryBreakdownItem[];
  deductionsSum: number;
  netPay: number;
  taxableIncome: number;
  payableAmount: number;
  age: number;
  firstAppointment: boolean;
  probationer: number;
  mtpyExcluded: boolean;
}) {
  const lines = [
    `Τα παρακάτω αφορούν το έτος ${SALARY_REFERENCE_YEAR}.`,
    `Ο υπάλληλος εντάσσεται στον πίνακα με τα μισθολογικά κλιμάκια που αφορούν την κατηγορία '${educationLabel}'.`,
  ];

  if (experience === 0) {
    lines.push(`Δεν υπάρχει αναγνωρισμένη προϋπηρεσία, οπότε η αφετηρία είναι το μισθολογικό κλιμάκιο MK${experienceDegrees}.`);
  } else {
    lines.push(`Έχει ${experience} έτη προϋπηρεσίας, οπότε ξεκινάει από το μισθολογικό κλιμάκιο MK${experienceDegrees}.`);
  }

  if (postgraduateStudies === 1 && postgraduateDegrees > 0) {
    lines.push(`Έχει μεταπτυχιακό τίτλο, οπότε ανεβαίνει ${postgraduateDegrees} κλιμάκια (MK${validDegrees}).`);
  } else if (postgraduateStudies === 2 && postgraduateDegrees > 0) {
    lines.push(`Έχει διδακτορικό τίτλο, οπότε ανεβαίνει ${postgraduateDegrees} κλιμάκια (MK${validDegrees}).`);
  } else if (postgraduateStudies > 0) {
    lines.push(`Στην επιλεγμένη κατηγορία εκπαίδευσης ο τίτλος '${getPostgraduateLabel(postgraduateStudies)}' δεν αλλάζει το μισθολογικό κλιμάκιο.`);
  } else {
    lines.push(`Δεν έχει μεταπτυχιακό τίτλο, οπότε παραμένει στο MK${validDegrees}.`);
  }

  lines.push(`Λόγω του MK${validDegrees}, ο μεικτός μισθός ξεκινάει από ${formatCurrencyLabel(grossPayBasedOnExperienceAndPostgraduateStudies)}.`);

  if (allowances.length > 0) {
    for (const allowance of allowances) {
      lines.push(`Προστίθεται στο μεικτό μισθό το επίδομα '${allowance.allowanceName}' (${allowance.name}): ${formatCurrencyLabel(allowance.amount)}.`);
    }
    lines.push(`Ο μεικτός μισθός είναι πλέον ${formatCurrencyLabel(grossPay)}.`);
  } else {
    lines.push("Δεν υπάρχουν επιδόματα.");
  }

  if (firstAppointment && probationer === 1 && !mtpyExcluded) {
    lines.push("Επειδή είναι η πρώτη φορά που διορίζεται στο δημόσιο, είναι δόκιμος 1ου έτους και συμμετέχει στο Μ.Τ.Π.Υ., εφαρμόζεται και η πρόσθετη κράτηση νεοδιορισμού.");
  } else if (firstAppointment && mtpyExcluded) {
    lines.push("Δηλώνεται πρώτος διορισμός, αλλά δεν εφαρμόζεται κράτηση Μ.Τ.Π.Υ. επειδή έχει επιλεγεί εξαίρεση από το ταμείο.");
  }

  lines.push(
    deductions.length > 0
      ? `Οι κρατήσεις είναι οι ακόλουθες: ${deductions.map((item) => `${formatCurrencyLabel(item.value)}: ${item.name}`).join(", ")}.`
      : "Δεν υπάρχουν κρατήσεις."
  );
  lines.push(`Το καθαρό ποσό προκύπτει αφαιρώντας από το μεικτό μισθό το άθροισμα των κρατήσεων: ${formatCurrencyLabel(grossPay)} - ${formatCurrencyLabel(deductionsSum)} = ${formatCurrencyLabel(netPay)}.`);

  if (age <= 25) {
    lines.push("Η ηλικία έως 25 ετών ενεργοποιεί τη μεγαλύτερη ελάφρυνση φόρου, η οποία μπορεί να μηδενίσει πλήρως την παρακράτηση σε χαμηλότερα εισοδήματα.");
  } else if (age <= 30) {
    lines.push(`Η φορολογία υπολογίζεται με την ελάφρυνση που ισχύει για ηλικίες 26-30 ετών, πάνω σε ετήσιο φορολογητέο εισόδημα ${formatCurrencyLabel(taxableIncome)}.`);
  } else {
    lines.push(`Το καθαρό ποσό υπόκειται σε φορολογία με βάση το ετήσιο φορολογητέο εισόδημα ${formatCurrencyLabel(taxableIncome)}.`);
  }

  lines.push(`Τελικά, το πληρωτέο ποσό είναι ${formatCurrencyLabel(payableAmount)}.`);

  return lines;
}

export function formatGreekNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatGreekNumberFixedTwo(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "0,00";
  return new Intl.NumberFormat("el-GR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateSalary(form: SalaryCalculatorFormInput): SalaryCalculationResult {
  const education = clamp(toInt(form.education, 1), 1, 4);
  const postgraduateStudies = clamp(toInt(form.postgraduateStudies, 0), 0, 2);
  const children = clamp(toInt(form.children, 0), 0, 10);
  const age = clamp(toInt(form.age, 31), 22, 31);
  const probationer = clamp(toInt(form.probationer, 0), 0, 2);
  const experience = clamp(toInt(form.experience, 2), 0, 40);
  const firstAppointment = Boolean(form.firstAppointment);
  const mtpyExcluded = Boolean(form.mtpyExcluded);
  const allowances = getSelectedAllowanceItems(form, probationer);
  const allowancesItems = allowances.map((allowance) => allowance.id);

  const degreesByExperience = getExperienceDegrees(education, experience);
  const degreesByPostgraduateStudies = getPostgraduateDegrees(education, postgraduateStudies);
  const totalDegrees = degreesByExperience + degreesByPostgraduateStudies;
  const maximumDegrees = MAX_DEGREES_BY_EDUCATION[education] ?? 19;
  const validDegrees = Math.min(totalDegrees, maximumDegrees);

  const grossPayBasedOnExperienceAndPostgraduateStudies = getGrossScale(education, validDegrees);
  const allowancesSum = round2(allowances.reduce((sum, allowance) => sum + allowance.amount, 0));
  const grossPay = round2(grossPayBasedOnExperienceAndPostgraduateStudies + allowancesSum);
  const grossPayCents = toCents(grossPay);

  const deductions: SalaryBreakdownItem[] = [];
  for (const definition of DEDUCTION_DEFINITIONS) {
    if (definition.key === "mtpy" && mtpyExcluded) continue;
    if (definition.key === "mtpy_new" && !(firstAppointment && probationer === 1 && !mtpyExcluded)) continue;

    deductions.push({
      id: null,
      name: definition.name,
      description: definition.description,
      value: fromCents(percentOfAmountCents(grossPayCents, definition.basisPoints)),
    });
  }

  const deductionsSumCents = deductions.reduce((sum, deduction) => sum + toCents(deduction.value), 0);
  const deductionsSum = fromCents(deductionsSumCents);
  const netPayCents = grossPayCents - deductionsSumCents;
  const netPay = fromCents(netPayCents);

  const taxableIncome = round2(netPay * 12);
  const scaleTax = computeScaleTax(taxableIncome, age, children);
  const taxReduction = computeTaxReduction(children, taxableIncome);
  const taxIncome = round2(Math.max(0, scaleTax - taxReduction));
  const payrollTax = round2(taxIncome / 12);
  const payableAmount = round2(netPay - payrollTax);

  const educationLabel = getEducationLabel(education);
  const explainList = buildExplainList({
    educationLabel,
    experience,
    experienceDegrees: degreesByExperience,
    postgraduateStudies,
    postgraduateDegrees: degreesByPostgraduateStudies,
    validDegrees,
    grossPayBasedOnExperienceAndPostgraduateStudies,
    allowances,
    grossPay,
    deductions,
    deductionsSum,
    netPay,
    taxableIncome,
    payableAmount,
    age,
    firstAppointment,
    probationer,
    mtpyExcluded,
  });

  return {
    person: {
      referenceYear: SALARY_REFERENCE_YEAR,
      education,
      postgraduateStudies,
      children,
      experience,
      firstAppointment,
      mtpyExcluded,
      allowancesItems,
      probationer,
      age,
    },
    referenceYear: SALARY_REFERENCE_YEAR,
    degreesByExperience,
    degreesByPostgraduateStudies,
    totalDegrees,
    validDegrees,
    maximumDegrees,
    firstAppointment,
    grossPayBasedOnExperienceAndPostgraduateStudies,
    grossPay,
    netPay,
    payableAmount,
    deductions,
    deductionsSum,
    allowances,
    allowancesSum,
    tax: {
      taxableIncome,
      scaleTax,
      taxReduction,
      taxIncome,
      payrollTax,
    },
    explainList,
  };
}
