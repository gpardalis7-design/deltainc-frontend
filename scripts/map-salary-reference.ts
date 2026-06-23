const API_URL = "https://edyp.gr/api/pay-calculator";
const REQUEST_DELAY_MS = 350;
const REQUEST_TIMEOUT_MS = 12000;

type Payload = {
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

type RuleCase = {
  label: string;
  payload: Payload;
};

type ApiResponse = {
  degreesByExperience: number;
  degreesByPostgraduateStudies: number;
  totalDegrees: number;
  validDegrees: number;
  maximumDegrees: number;
  grossPayBasedOnExperienceAndPostgraduateStudies: number;
  grossPay: number;
  netPay: number;
  payableAmount: number;
  deductionsSum: number;
  allowancesSum: number;
  deductions: Array<{ name: string; value: number }>;
  allowances: Array<{ name: string; amount: number }>;
  tax: {
    taxableIncome: number;
    scaleTax: number;
    taxReduction: number;
    taxIncome: number;
    payrollTax: number;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function basePayload(overrides: Partial<Payload>): Payload {
  return {
    referenceYear: 2026,
    education: 1,
    postgraduateStudies: 0,
    children: 0,
    experience: 2,
    firstAppointment: false,
    mtpyExcluded: false,
    allowancesItems: [],
    probationer: 0,
    age: 31,
    ...overrides,
  };
}

async function callApi(payload: Payload): Promise<ApiResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as ApiResponse;
}

const caseGroups: Array<{ group: string; cases: RuleCase[] }> = [
  {
    group: "base-scale",
    cases: [
      { label: "PE-exp-0", payload: basePayload({ education: 1, experience: 0 }) },
      { label: "PE-exp-2", payload: basePayload({ education: 1, experience: 2 }) },
      { label: "PE-exp-4", payload: basePayload({ education: 1, experience: 4 }) },
      { label: "PE-exp-10", payload: basePayload({ education: 1, experience: 10 }) },
      { label: "TE-exp-0", payload: basePayload({ education: 2, experience: 0 }) },
      { label: "TE-exp-10", payload: basePayload({ education: 2, experience: 10 }) },
      { label: "DE-exp-0", payload: basePayload({ education: 3, experience: 0 }) },
      { label: "DE-exp-9", payload: basePayload({ education: 3, experience: 9 }) },
      { label: "YE-exp-0", payload: basePayload({ education: 4, experience: 0 }) },
      { label: "YE-exp-9", payload: basePayload({ education: 4, experience: 9 }) },
    ],
  },
  {
    group: "postgraduate",
    cases: [
      { label: "PE-none", payload: basePayload({ education: 1, experience: 2, postgraduateStudies: 0 }) },
      { label: "PE-master", payload: basePayload({ education: 1, experience: 2, postgraduateStudies: 1 }) },
      { label: "PE-phd", payload: basePayload({ education: 1, experience: 2, postgraduateStudies: 2 }) },
      { label: "TE-master", payload: basePayload({ education: 2, experience: 2, postgraduateStudies: 1 }) },
      { label: "DE-master", payload: basePayload({ education: 3, experience: 2, postgraduateStudies: 1 }) },
    ],
  },
  {
    group: "deductions",
    cases: [
      { label: "baseline", payload: basePayload({}) },
      { label: "mtpy-excluded", payload: basePayload({ mtpyExcluded: true }) },
      { label: "first-appointment-probation-1", payload: basePayload({ firstAppointment: true, probationer: 1 }) },
      { label: "first-appointment-probation-2", payload: basePayload({ firstAppointment: true, probationer: 2 }) },
    ],
  },
  {
    group: "allowances",
    cases: [
      { label: "family-2-children", payload: basePayload({ allowancesItems: [20] }) },
      { label: "hazard-A", payload: basePayload({ allowancesItems: [14] }) },
      { label: "remote-cat-1", payload: basePayload({ allowancesItems: [29] }) },
      { label: "aade-grade-B", payload: basePayload({ allowancesItems: [2] }) },
      { label: "aade-grade-B-probation-1", payload: basePayload({ allowancesItems: [2], firstAppointment: true, probationer: 1 }) },
      { label: "responsibility-39", payload: basePayload({ allowancesItems: [39] }) },
      { label: "combined-family-remote", payload: basePayload({ allowancesItems: [20, 29] }) },
    ],
  },
  {
    group: "tax",
    cases: [
      { label: "children-0-age-31", payload: basePayload({ children: 0, age: 31 }) },
      { label: "children-1-age-31", payload: basePayload({ children: 1, age: 31 }) },
      { label: "children-2-age-31", payload: basePayload({ children: 2, age: 31 }) },
      { label: "children-4-age-31", payload: basePayload({ children: 4, age: 31 }) },
      { label: "children-0-age-25", payload: basePayload({ children: 0, age: 25 }) },
      { label: "children-0-age-28", payload: basePayload({ children: 0, age: 28 }) },
      { label: "children-5-age-23", payload: basePayload({ children: 5, age: 23, allowancesItems: [2, 29] }) },
    ],
  },
];

async function main() {
  const results: Record<string, unknown[]> = {};

  for (const group of caseGroups) {
    results[group.group] = [];

    for (const entry of group.cases) {
      try {
        const response = await callApi(entry.payload);
        results[group.group].push({
          label: entry.label,
          payload: entry.payload,
          response: {
            degreesByExperience: response.degreesByExperience,
            degreesByPostgraduateStudies: response.degreesByPostgraduateStudies,
            totalDegrees: response.totalDegrees,
            validDegrees: response.validDegrees,
            maximumDegrees: response.maximumDegrees,
            grossPayBasedOnExperienceAndPostgraduateStudies: response.grossPayBasedOnExperienceAndPostgraduateStudies,
            grossPay: response.grossPay,
            netPay: response.netPay,
            payableAmount: response.payableAmount,
            deductionsSum: response.deductionsSum,
            allowancesSum: response.allowancesSum,
            deductions: response.deductions,
            allowances: response.allowances,
            tax: response.tax,
          },
        });
      } catch (error) {
        results[group.group].push({
          label: entry.label,
          payload: entry.payload,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

void main();
