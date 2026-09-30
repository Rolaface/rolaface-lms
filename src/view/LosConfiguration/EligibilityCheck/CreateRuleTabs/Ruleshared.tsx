import type { ReactNode } from "react";
import { Box, Group, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { Tone } from "./shared";

/* ── tiny reusable helpers ─────────────────────────────────── */
export function Field({
  label,
  hint,
  required,
  description,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Group gap={3} mb={3}>
        <Text
          fz={10}
          fw={600}
          c="slate.5"
          tt="uppercase"
          style={{ letterSpacing: ".04em" }}
        >
          {label}{" "}
          {required && (
            <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>
          )}
        </Text>
        {hint && (
          <Box title={hint} style={{ cursor: "help", display: "flex" }}>
            <IconInfoCircle size={10} color="var(--mantine-color-slate-4)" />
          </Box>
        )}
      </Group>
      {children}
      {description && (
        <Text fz={9} c="slate.4" mt={4}>
          {description}
        </Text>
      )}
    </Box>
  );
}

export function SectionHead({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box mb="sm">
      <Text fz={13} fw={700} c="slate.8" lh={1.2}>
        {title}
      </Text>
      <Text fz={11} c="slate.5" mt={2}>
        {description}
      </Text>
    </Box>
  );
}

export function InfoCard({
  children,
  color = "brand",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Box
      px="sm"
      py={7}
      style={{
        background: `var(--mantine-color-${color}-0)`,
        border: `1px solid var(--mantine-color-${color}-2)`,
        borderRadius: "var(--mantine-radius-sm)",
      }}
    >
      {children}
    </Box>
  );
}

export function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Group
      justify="space-between"
      py={5}
      style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz={11} c="slate.5">
        {label}
      </Text>
      <Text fz={11} fw={600} c="slate.8">
        {value}
      </Text>
    </Group>
  );
}

/* ── data ───────────────────────────────────────────────────── */
export type IncomeSourceTuple = [string, number, boolean, boolean];

export const INCOME_SOURCES: IncomeSourceTuple[] = [
  ["Net Salary", 100, true, true],
  ["Business Income", 70, true, true],
  ["Rental Income", 80, true, true],
  ["Other Income", 50, true, true],
];

export interface CreditBand {
  id: string;
  grade: string;
  min: number | string;
  multiple: number | string;
  basis: string;
  decision: string;
}
export const DECISION_OPTIONS = [
  "Eligible",
  "Conditional",
  "Manual Review",
  "Decline",
];
export const MULTIPLE_BASIS_OPTIONS = [
  "Basic Salary",
  "Net Salary",
  "Gross Income",
  "Total Income",
];
export const DECISION_TONE: Record<string, Tone> = {
  Eligible: "low",
  Conditional: "medium",
  "Manual Review": "medium",
  Decline: "high",
};
export const DECISION_DOT: Record<string, string> = {
  low: "green",
  medium: "yellow",
  high: "red",
};

export const DEFAULT_CREDIT_BANDS: CreditBand[] = [
  {
    id: "cb1",
    grade: "A",
    min: 800,
    multiple: 7,
    basis: "Basic Salary",
    decision: "Eligible",
  },
  {
    id: "cb2",
    grade: "B",
    min: 700,
    multiple: 4,
    basis: "Basic Salary",
    decision: "Eligible",
  },
  {
    id: "cb3",
    grade: "C",
    min: 600,
    multiple: 2.5,
    basis: "Basic Salary",
    decision: "Conditional",
  },
  {
    id: "cb4",
    grade: "D",
    min: 500,
    multiple: 1,
    basis: "Basic Salary",
    decision: "Manual Review",
  },
  {
    id: "cb5",
    grade: "E",
    min: 0,
    multiple: 0,
    basis: "Basic Salary",
    decision: "Decline",
  },
];

export function creditBandFor(score: number, bands: CreditBand[]): CreditBand {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return (
    sorted.find((b) => score >= b.min) ||
    sorted[sorted.length - 1] ||
    DEFAULT_CREDIT_BANDS[DEFAULT_CREDIT_BANDS.length - 1]
  );
}

export interface ObligationDef {
  name: string;
  ver: boolean;
  inc: boolean;
  pct: number;
}

export const OBLIGATION_SOURCES: ObligationDef[] = [
  { name: "Existing Monthly EMI", ver: true, inc: true, pct: 100 },
  { name: "Rental Obligation", ver: false, inc: false, pct: 100 },
  { name: "Other Monthly Debt", ver: false, inc: true, pct: 100 },
];
export const COLLATERAL_TYPES = [
  "Property",
  "Vehicle",
  "Equipment",
  "Fixed Deposit",
  "Securities",
  "Guarantor",
  "Salary Assignment",
];

export interface CollateralItem {
  id: string;
  type: string;
  marketValue: number;
  haircutPct: number;
  maxLtvPct: number;
}
export const DEFAULT_COLLATERAL_ITEMS: CollateralItem[] = [
  {
    id: "col1",
    type: "Property",
    marketValue: 500000,
    haircutPct: 20,
    maxLtvPct: 70,
  },
];
export function collateralItemLimit(item: CollateralItem) {
  return (
    item.marketValue * (1 - item.haircutPct / 100) * (item.maxLtvPct / 100)
  );
}

export const FORMULA_ITEMS: [string, string][] = [
  ["Income limit", "Eligible Monthly Income × Income Multiple"],
  [
    "Affordability limit",
    "(Eligible Income × Max EMI Ratio - Existing Obligation) × Tenure × Buffer",
  ],
  ["Credit limit", "Net Salary × Credit Score Multiple"],
  ["Collateral limit", "Sum(Market Value × (1 - Haircut %) × Max LTV %)"],
  ["Product limit", "Product Maximum (configured cap)"],
];

export interface FormulaParams {
  otherIncomeRecognition: number;
  salaryMultiple: number;
  maxEmiRatio: number;
  maxDtiRatio: number;
  affordabilityBuffer: number;
  exposureCap: number;
  productMax: number;
}
export type SetFormulaParam = (
  k: keyof FormulaParams,
) => (v: number) => void;

export const DEFAULT_FORMULA_PARAMS: FormulaParams = {
  otherIncomeRecognition: 70,
  salaryMultiple: 5,
  maxEmiRatio: 30,
  maxDtiRatio: 40,
  affordabilityBuffer: 91,
  exposureCap: 60,
  productMax: 100000,
};
export const FORMULA_SAMPLE = {
  basicSalary: 15000,
  netSalary: 12500,
  otherIncome: 3000,
  existingEMI: 2000,
  existingDSR: 2500,
  creditScore: 735,
  tenure: 24,
  onTime: 94,
  maxDPD: 12,
  npa: false,
};

export function computeFormulaPreview(
  p: FormulaParams,
  creditMultiple: number,
  collateralLimit: number,
) {
  const eligibleIncome =
    FORMULA_SAMPLE.netSalary +
    FORMULA_SAMPLE.otherIncome * (p.otherIncomeRecognition / 100);
  const incomeLimit = eligibleIncome * p.salaryMultiple;
  let maxEMI =
    eligibleIncome * (p.maxEmiRatio / 100) - FORMULA_SAMPLE.existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit =
    maxEMI * FORMULA_SAMPLE.tenure * (p.affordabilityBuffer / 100);
  const creditLimit = FORMULA_SAMPLE.netSalary * creditMultiple;
  const limits = [
    { name: "Income Limit", value: incomeLimit },
    { name: "Affordability Limit", value: affordabilityLimit },
    { name: "Credit Limit", value: creditLimit },
    { name: "Collateral Limit", value: collateralLimit },
    { name: "Product Limit", value: p.productMax },
  ];
  const final = Math.min(...limits.map((l) => l.value));
  const limitingFactor = limits.find((l) => l.value === final)?.name || "";
  const existingDti = FORMULA_SAMPLE.existingDSR / (eligibleIncome || 1);
  const dtiPassed = existingDti <= p.maxDtiRatio / 100;
  return {
    limits,
    final: dtiPassed ? final : 0,
    limitingFactor: dtiPassed ? limitingFactor : "DSR Limit",
    dtiPassed,
    existingDti,
  };
}

export const TIERS = [
  {
    t: "Tier 1 — Low Risk",
    label: "Low Risk",
    cond: "Credit Score >= 750 · On-Time Payment >= 95% · Max DPD <= 15 days",
    pct: 90,
    max: 100000,
    tone: "low" as const,
  },
  {
    t: "Tier 2 — Medium Risk",
    label: "Medium Risk",
    cond: "Credit Score 650–749 · On-Time Payment >= 85%",
    pct: 75,
    max: 60000,
    tone: "medium" as const,
  },
  {
    t: "Tier 3 — High Risk",
    label: "High Risk",
    cond: "Credit Score 550–649",
    pct: 50,
    max: 25000,
    tone: "high" as const,
  },
  {
    t: "Tier 4 — Not Acceptable",
    label: "Not Acceptable",
    cond: "Credit Score < 550, or Active NPA",
    pct: 0,
    max: 0,
    tone: "high" as const,
  },
];

export interface HardStop {
  id: string;
  factor: string;
  operator: string;
  value: string;
  hint?: string;
}
export const DEFAULT_HARD_STOPS: HardStop[] = [
  { id: "hs1", factor: "DSR Ratio", operator: "Greater Than", value: "70%" },
  {
    id: "hs2",
    factor: "Fraud Flag Present",
    operator: "Is True",
    value: "Confirmed Fraud",
  },
  { id: "hs3", factor: "Active NPA", operator: "Equals", value: "Yes" },
  {
    id: "hs4",
    factor: "Existing Loan DPD",
    operator: "Greater Than or Equal",
    value: "90 Days",
  },
  {
    id: "hs5",
    factor: "Debt Service Ratio (DSR)",
    operator: "Greater Than",
    value: "80%",
  },
];
export interface ManualReviewRule {
  id: string;
  factor: string;
  operator: string;
  value1: string;
  value2?: string;
}
export const DEFAULT_MANUAL_REVIEWS: ManualReviewRule[] = [
  {
    id: "mr1",
    factor: "Credit Score",
    operator: "Between",
    value1: "580",
    value2: "649",
  },
  {
    id: "mr2",
    factor: "Debt Service Ratio (DSR)",
    operator: "Between",
    value1: "50%",
    value2: "80%",
  },
  {
    id: "mr3",
    factor: "Existing Loan DPD",
    operator: "Between",
    value1: "30",
    value2: "89 Days",
  },
];
export const RULE_FACTORS = [
  "KYC Verification Status",
  "Fraud Flag Present",
  "Blacklisted Customer",
  "Active NPA",
  "Existing Loan DPD",
  "Debt Service Ratio (DSR)",
  "Insolvency / Bankruptcy Status",
  "Application Misrepresentation Flag",
  "Credit Score",
  "DSR Ratio",
  "EMI-to-Income Ratio",
  "Loan Amount",
];
export const RULE_OPERATORS = [
  "Equals",
  "Is True",
  "In List",
  "Less Than",
  "Less Than or Equal",
  "Greater Than",
  "Greater Than or Equal",
  "Between",
];