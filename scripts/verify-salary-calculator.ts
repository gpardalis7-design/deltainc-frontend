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
  type SalaryCalculationResult,
  type SalaryCalculatorFormInput,
} from "../src/app/lib/salaryCalculator.js";

const API_URL = "https://edyp.gr/api/pay-calculator";
const REQUEST_TIMEOUT_MS = 12000;
const RANDOM_CASE_COUNT = 600;
const MAX_MISMATCH_SAMPLES = 25;
const CONCURRENCY = 5;
type IdOnlyOption = { id: number };

type Scenario = {
  label: string;
  form: SalaryCalculatorFormInput;
};

type ApiResponse = SalaryCalculationResult;

type NumericFieldComparison = {
  field: string;
  local: number;
  remote: number;
};

type MismatchRecord = {
  label: string;
  form: SalaryCalculatorFormInput;
  numericDiffs: NumericFieldComparison[];
  localDeductions: Array<{ name: string; value: number }>;
  remoteDeductions: Array<{ name: string; value: number }>;
  localAllowances: Array<{ name: string; amount: number }>;
  remoteAllowances: Array<{ name: string; amount: number }>;
};

type Summary = {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  apiFailures: number;
  maxAbsoluteDiff: number;
  maxAbsoluteDiffCase: string | null;
  scenarioGroupFailures: Record<string, number>;
  mismatchFieldCounts: Record<string, number>;
  deductionStructureMismatchCount: number;
  allowanceStructureMismatchCount: number;
  mismatches: MismatchRecord[];
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function makeForm(overrides: Partial<SalaryCalculatorFormInput>): SalaryCalculatorFormInput {
  return { ...defaultSalaryCalculatorForm, ...overrides };
}

function createSeededRandom(seed: number) {
  let current = seed >>> 0;
  return () => {
    current = (current * 1664525 + 1013904223) >>> 0;
    return current / 0x100000000;
  };
}

function sampleOne<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!;
}

function allowanceIdsFromForm(form: SalaryCalculatorFormInput) {
  return [
    form.familyAllowanceId,
    form.hazardAllowanceId,
    form.remoteAllowanceId,
    form.aadeAllowanceId,
    form.responsibilityAllowanceId,
  ]
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function toApiPayload(form: SalaryCalculatorFormInput) {
  return {
    referenceYear: SALARY_REFERENCE_YEAR,
    education: Number.parseInt(form.education, 10),
    postgraduateStudies: Number.parseInt(form.postgraduateStudies, 10),
    children: Number.parseInt(form.children, 10),
    experience: Number.parseInt(form.experience, 10),
    firstAppointment: form.firstAppointment,
    mtpyExcluded: form.mtpyExcluded,
    allowancesItems: allowanceIdsFromForm(form),
    probationer: Number.parseInt(form.probationer, 10),
    age: Number.parseInt(form.age, 10),
  };
}

async function callReferenceApi(form: SalaryCalculatorFormInput): Promise<ApiResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
    },
    body: JSON.stringify(toApiPayload(form)),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as ApiResponse;
}

function createScenarios(): Scenario[] {
  const scenarios: Scenario[] = [];

  for (const education of EDUCATION_OPTIONS) {
    for (const postgraduateStudies of POSTGRADUATE_STUDIES_OPTIONS) {
      for (const experience of EXPERIENCE_OPTIONS) {
        scenarios.push({
          label: `base-scale-e${education.value}-p${postgraduateStudies.value}-x${experience.value}`,
          form: makeForm({
            education: education.value,
            postgraduateStudies: postgraduateStudies.value,
            experience: experience.value,
            age: "31",
            children: "0",
            firstAppointment: false,
            mtpyExcluded: false,
            probationer: "0",
          }),
        });
      }
    }
  }

  for (const children of CHILDREN_OPTIONS) {
    for (const age of AGE_OPTIONS) {
      scenarios.push({
        label: `tax-children-${children.value}-age-${age.value}`,
        form: makeForm({
          children: children.value,
          age: age.value,
          education: "1",
          postgraduateStudies: "0",
          experience: "2",
          firstAppointment: false,
          mtpyExcluded: false,
          probationer: "0",
        }),
      });
    }
  }

  for (const education of EDUCATION_OPTIONS) {
    for (const firstAppointment of [false, true]) {
      for (const mtpyExcluded of [false, true]) {
        for (const probationer of PROBATIONER_OPTIONS) {
          scenarios.push({
            label: `appointment-e${education.value}-f${firstAppointment ? 1 : 0}-m${mtpyExcluded ? 1 : 0}-p${probationer.value}`,
            form: makeForm({
              education: education.value,
              postgraduateStudies: "0",
              experience: "2",
              age: "31",
              children: "0",
              firstAppointment,
              mtpyExcluded,
              probationer: probationer.value,
            }),
          });
        }
      }
    }
  }

  for (const education of EDUCATION_OPTIONS) {
    for (const group of SALARY_ALLOWANCE_GROUPS) {
      for (const option of group.options) {
        const fieldKey =
          group.id === "family"
            ? "familyAllowanceId"
            : group.id === "hazard"
              ? "hazardAllowanceId"
              : group.id === "remote"
                ? "remoteAllowanceId"
                : group.id === "aade"
                  ? "aadeAllowanceId"
                  : "responsibilityAllowanceId";

        scenarios.push({
          label: `single-allowance-e${education.value}-${group.id}-${option.id}`,
          form: makeForm({
            education: education.value,
            postgraduateStudies: "0",
            experience: "2",
            age: "31",
            children: "0",
            firstAppointment: false,
            mtpyExcluded: false,
            probationer: "0",
            [fieldKey]: String(option.id),
          }),
        });
      }
    }
  }

  const representativeAllowanceSelections: Array<Partial<SalaryCalculatorFormInput>> = [
    {
      familyAllowanceId: "20",
      hazardAllowanceId: "14",
    },
    {
      remoteAllowanceId: "29",
      aadeAllowanceId: "8",
    },
    {
      familyAllowanceId: "24",
      responsibilityAllowanceId: "39",
    },
    {
      hazardAllowanceId: "16",
      remoteAllowanceId: "31",
      responsibilityAllowanceId: "41",
    },
    {
      familyAllowanceId: "28",
      hazardAllowanceId: "14",
      remoteAllowanceId: "29",
      aadeAllowanceId: "3",
      responsibilityAllowanceId: "32",
    },
  ];

  for (const education of EDUCATION_OPTIONS) {
    for (const postgraduateStudies of POSTGRADUATE_STUDIES_OPTIONS) {
      for (const allowanceSelection of representativeAllowanceSelections) {
        scenarios.push({
          label: `combo-e${education.value}-p${postgraduateStudies.value}-${Object.values(allowanceSelection)
            .filter(Boolean)
            .join("-")}`,
          form: makeForm({
            education: education.value,
            postgraduateStudies: postgraduateStudies.value,
            experience: "10",
            age: "31",
            children: "2",
            firstAppointment: false,
            mtpyExcluded: false,
            probationer: "0",
            ...allowanceSelection,
          }),
        });
      }
    }
  }

  const rng = createSeededRandom(20260614);

  for (let index = 0; index < RANDOM_CASE_COUNT; index += 1) {
    const familyOptions: readonly IdOnlyOption[] = [{ id: 0 }, ...SALARY_ALLOWANCE_GROUPS.find((group) => group.id === "family")!.options];
    const hazardOptions: readonly IdOnlyOption[] = [{ id: 0 }, ...SALARY_ALLOWANCE_GROUPS.find((group) => group.id === "hazard")!.options];
    const remoteOptions: readonly IdOnlyOption[] = [{ id: 0 }, ...SALARY_ALLOWANCE_GROUPS.find((group) => group.id === "remote")!.options];
    const aadeOptions: readonly IdOnlyOption[] = [{ id: 0 }, ...SALARY_ALLOWANCE_GROUPS.find((group) => group.id === "aade")!.options];
    const responsibilityOptions: readonly IdOnlyOption[] = [{ id: 0 }, ...SALARY_ALLOWANCE_GROUPS.find((group) => group.id === "responsibility")!.options];

    const firstAppointment = rng() > 0.5;
    const probationer = sampleOne(PROBATIONER_OPTIONS, rng).value;

    scenarios.push({
      label: `random-${index + 1}`,
      form: makeForm({
        education: sampleOne(EDUCATION_OPTIONS, rng).value,
        postgraduateStudies: sampleOne(POSTGRADUATE_STUDIES_OPTIONS, rng).value,
        children: sampleOne(CHILDREN_OPTIONS, rng).value,
        age: sampleOne(AGE_OPTIONS, rng).value,
        firstAppointment,
        mtpyExcluded: rng() > 0.5,
        probationer: firstAppointment ? probationer : "0",
        experience: sampleOne(EXPERIENCE_OPTIONS, rng).value,
        familyAllowanceId: String(sampleOne(familyOptions, rng).id),
        hazardAllowanceId: String(sampleOne(hazardOptions, rng).id),
        remoteAllowanceId: String(sampleOne(remoteOptions, rng).id),
        aadeAllowanceId: String(sampleOne(aadeOptions, rng).id),
        responsibilityAllowanceId: String(sampleOne(responsibilityOptions, rng).id),
      }),
    });
  }

  return scenarios;
}

function compareResults(local: SalaryCalculationResult, remote: ApiResponse) {
  const numericFields: Array<[string, number, number]> = [
    ["degreesByExperience", local.degreesByExperience, remote.degreesByExperience],
    ["degreesByPostgraduateStudies", local.degreesByPostgraduateStudies, remote.degreesByPostgraduateStudies],
    ["totalDegrees", local.totalDegrees, remote.totalDegrees],
    ["validDegrees", local.validDegrees, remote.validDegrees],
    ["maximumDegrees", local.maximumDegrees, remote.maximumDegrees],
    [
      "grossPayBasedOnExperienceAndPostgraduateStudies",
      local.grossPayBasedOnExperienceAndPostgraduateStudies,
      remote.grossPayBasedOnExperienceAndPostgraduateStudies,
    ],
    ["grossPay", local.grossPay, remote.grossPay],
    ["netPay", local.netPay, remote.netPay],
    ["payableAmount", local.payableAmount, remote.payableAmount],
    ["deductionsSum", local.deductionsSum, remote.deductionsSum],
    ["allowancesSum", local.allowancesSum, remote.allowancesSum],
    ["tax.taxableIncome", local.tax.taxableIncome, remote.tax.taxableIncome],
    ["tax.scaleTax", local.tax.scaleTax, remote.tax.scaleTax],
    ["tax.taxReduction", local.tax.taxReduction, remote.tax.taxReduction],
    ["tax.taxIncome", local.tax.taxIncome, remote.tax.taxIncome],
    ["tax.payrollTax", local.tax.payrollTax, remote.tax.payrollTax],
  ];

  const numericDiffs = numericFields
    .filter(([, localValue, remoteValue]) => Math.abs(round2(localValue) - round2(remoteValue)) > 0.01)
    .map(([field, localValue, remoteValue]) => ({
      field,
      local: round2(localValue),
      remote: round2(remoteValue),
    }));

  const localDeductions = local.deductions
    .map((item) => ({ name: item.name, value: round2(item.value) }))
    .sort((a, b) => a.name.localeCompare(b.name, "el"));
  const remoteDeductions = remote.deductions
    .map((item) => ({ name: item.name, value: round2(item.value) }))
    .sort((a, b) => a.name.localeCompare(b.name, "el"));
  const localAllowances = local.allowances
    .map((item) => ({ name: item.name, amount: round2(item.amount) }))
    .sort((a, b) => a.name.localeCompare(b.name, "el"));
  const remoteAllowances = remote.allowances
    .map((item) => ({ name: item.name, amount: round2(item.amount) }))
    .sort((a, b) => a.name.localeCompare(b.name, "el"));

  const deductionsMatch =
    JSON.stringify(localDeductions) === JSON.stringify(remoteDeductions);
  const allowancesMatch =
    JSON.stringify(localAllowances) === JSON.stringify(remoteAllowances);

  return {
    isMatch: numericDiffs.length === 0 && deductionsMatch && allowancesMatch,
    numericDiffs,
    localDeductions,
    remoteDeductions,
    localAllowances,
    remoteAllowances,
    maxDiff:
      numericDiffs.reduce((max, diff) => Math.max(max, Math.abs(diff.local - diff.remote)), 0),
    deductionsMatch,
    allowancesMatch,
  };
}

async function runPool<T>(items: T[], worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      await worker(items[currentIndex]!, currentIndex);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const scenarios = createScenarios();
  const summary: Summary = {
    totalCases: scenarios.length,
    passedCases: 0,
    failedCases: 0,
    apiFailures: 0,
    maxAbsoluteDiff: 0,
    maxAbsoluteDiffCase: null,
    scenarioGroupFailures: {},
    mismatchFieldCounts: {},
    deductionStructureMismatchCount: 0,
    allowanceStructureMismatchCount: 0,
    mismatches: [],
  };

  await runPool(scenarios, async (scenario, index) => {
    try {
      const local = calculateSalary(scenario.form);
      const remote = await callReferenceApi(scenario.form);
      const comparison = compareResults(local, remote);

      if (comparison.isMatch) {
        summary.passedCases += 1;
      } else {
        summary.failedCases += 1;
        summary.maxAbsoluteDiff = Math.max(summary.maxAbsoluteDiff, comparison.maxDiff);
        if (comparison.maxDiff === summary.maxAbsoluteDiff) {
          summary.maxAbsoluteDiffCase = scenario.label;
        }

        const groupKey =
          scenario.label.startsWith("base-scale")
            ? "base-scale"
            : scenario.label.startsWith("tax-children")
              ? "tax-children"
              : scenario.label.startsWith("appointment")
                ? "appointment"
                : scenario.label.startsWith("single-allowance")
                  ? "single-allowance"
                  : scenario.label.startsWith("combo")
                    ? "combo"
                    : scenario.label.startsWith("random")
                      ? "random"
                      : "other";
        summary.scenarioGroupFailures[groupKey] = (summary.scenarioGroupFailures[groupKey] ?? 0) + 1;

        for (const diff of comparison.numericDiffs) {
          summary.mismatchFieldCounts[diff.field] = (summary.mismatchFieldCounts[diff.field] ?? 0) + 1;
        }

        if (!comparison.deductionsMatch) {
          summary.deductionStructureMismatchCount += 1;
        }
        if (!comparison.allowancesMatch) {
          summary.allowanceStructureMismatchCount += 1;
        }

        if (summary.mismatches.length < MAX_MISMATCH_SAMPLES) {
          summary.mismatches.push({
            label: scenario.label,
            form: scenario.form,
            numericDiffs: comparison.numericDiffs,
            localDeductions: comparison.localDeductions,
            remoteDeductions: comparison.remoteDeductions,
            localAllowances: comparison.localAllowances,
            remoteAllowances: comparison.remoteAllowances,
          });
        }
      }

      if ((index + 1) % 100 === 0 || index + 1 === scenarios.length) {
        console.log(
          `Checked ${index + 1}/${scenarios.length} cases • passed ${summary.passedCases} • failed ${summary.failedCases} • api failures ${summary.apiFailures}`
        );
      }
    } catch (error) {
      summary.apiFailures += 1;
      summary.failedCases += 1;

      if (summary.mismatches.length < MAX_MISMATCH_SAMPLES) {
        summary.mismatches.push({
          label: `${scenario.label} [API ERROR]`,
          form: scenario.form,
          numericDiffs: [
            {
              field: "apiError",
              local: Number.NaN,
              remote: Number.NaN,
            },
          ],
          localDeductions: [],
          remoteDeductions: [],
          localAllowances: [],
          remoteAllowances: [],
        });
      }

      console.warn(`API failure for ${scenario.label}:`, error instanceof Error ? error.message : error);
    }
  });

  console.log(JSON.stringify(summary, null, 2));
}

void main();
