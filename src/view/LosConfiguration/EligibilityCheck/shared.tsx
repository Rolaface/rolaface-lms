import type { ReactNode } from "react";
import { Badge, Box, Group, Text, Tooltip } from "@mantine/core";
import {
  IconLayoutGrid,
  IconStack,
  IconFlask,
  IconInfoCircle,
} from "@tabler/icons-react";

/* ============================================================
   TABS
   Same shape/pattern as lendingConfig.constants.ts — a plain
   array of { value, label, icon } consumed by LosEligibilityCheck.
   ============================================================ */
export type TabValue = "rules" | "create" | "simulate";

export const TAB_ITEMS: { value: TabValue; label: string; icon: typeof IconLayoutGrid }[] = [
  { value: "rules", label: "Eligibility Rules", icon: IconLayoutGrid },
  { value: "create", label: "Create Rule", icon: IconStack },
  { value: "simulate", label: "Simulator", icon: IconFlask },
];

/* ============================================================
   TONE → MANTINE COLOR
   Every status/risk "tone" used across the three tabs maps onto
   a plain Mantine semantic color, same pattern as StatusBadge in
   the Pre-Screening module.
   ============================================================ */
export type Tone = "neutral" | "active" | "draft" | "disabled" | "low" | "medium" | "high";

const TONE_COLOR: Record<Tone, string> = {
  neutral: "gray",
  active: "green",
  draft: "yellow",
  disabled: "gray",
  low: "green",
  medium: "yellow",
  high: "red",
};

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <Badge color={TONE_COLOR[tone]} variant="light" size="sm" radius="sm">
      {children}
    </Badge>
  );
}

export function SectionLabel({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <Box mb="md">
      <Text fz="sm" fw={600} c="slate.8">{children}</Text>
      {sub && <Text fz="xs" mt={4} c="slate.5">{sub}</Text>}
    </Box>
  );
}

export function LabeledField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <Box>
      <Group gap={4} mb={6}>
        <Text fz="xs" fw={600} c="slate.8">{label}</Text>
        {hint && (
          <Tooltip label={hint} withArrow multiline w={220}>
            <IconInfoCircle size={12} color="var(--mantine-color-slate-5)" style={{ cursor: "help" }} />
          </Tooltip>
        )}
      </Group>
      {children}
    </Box>
  );
}

/* ============================================================
   RULE TABLE DATA (Eligibility Rules tab)
   ============================================================ */
export interface RuleRow {
  name: string;
  product: string;
  type: string;
  risk: Tone;
  priority: number;
  status: "active" | "draft" | "disabled";
  version: string;
  updated: string;
  by: string;
}

export const RULES: RuleRow[] = [
  { name: "Salary-Based Personal Loan", product: "Personal Loan", type: "Individual", risk: "medium", priority: 1, status: "active", version: "v1.3", updated: "02 Aug 2026", by: "M. Banda" },
  { name: "SME Working Capital", product: "SME Loan", type: "SME", risk: "medium", priority: 2, status: "active", version: "v2.0", updated: "28 Jul 2026", by: "C. Phiri" },
  { name: "Staff Loan", product: "Staff Loan", type: "Employee", risk: "low", priority: 1, status: "active", version: "v1.1", updated: "15 Jul 2026", by: "M. Banda" },
  { name: "Secured Loan", product: "Asset Finance", type: "Individual", risk: "low", priority: 3, status: "active", version: "v1.4", updated: "30 Jun 2026", by: "T. Mwale" },
  { name: "Agricultural Loan", product: "Personal Loan", type: "Individual", risk: "high", priority: 4, status: "draft", version: "v0.9", updated: "22 Jun 2026", by: "C. Phiri" },
  { name: "Repeat Borrower Loan", product: "Personal Loan", type: "Repeat Borrower", risk: "low", priority: 2, status: "active", version: "v1.2", updated: "18 Jun 2026", by: "T. Mwale" },
  { name: "High Credit Score Customer", product: "Personal Loan", type: "Individual", risk: "low", priority: 1, status: "active", version: "v1.0", updated: "05 Jun 2026", by: "M. Banda" },
  { name: "Low Risk Customer", product: "Salary Advance", type: "Individual", risk: "low", priority: 5, status: "disabled", version: "v1.0", updated: "01 Jun 2026", by: "C. Phiri" },
];

/* ============================================================
   WIZARD STEP LIST (Create Rule tab)
   ============================================================ */
export const STEPS = [
  "Basic Information", "Customer Parameters", "Income Assessment", "Existing Obligations",
  "Credit & Payment History", "Collateral", "Risk Scoring", "Eligibility Formula",
  "Pre-Approval Limits", "Decision Rules", "Review & Publish",
];

export interface WeightItem {
  name: string;
  w: number;
}

export const DEFAULT_WEIGHTS: WeightItem[] = [
  { name: "Credit Score", w: 30 }, { name: "Payment History", w: 20 }, { name: "Income Stability", w: 15 },
  { name: "Debt-to-Income", w: 15 }, { name: "Employment Stability", w: 10 }, { name: "Collateral", w: 5 },
  { name: "Customer Relationship", w: 5 },
];

export const DEFAULT_PARAMS: Record<string, string> = {
  "Employment Type": "Required", "Employer": "Optional", "Employment Sector": "Optional",
  "Employment Duration": "Required", "Years of Service": "Required", "Probation Status": "Optional",
  "Retirement Age": "Ignored", "Basic Salary": "Required", "Net Salary": "Required",
  "Salary Stability": "Optional", "Salary Growth": "Ignored",
};

/* ============================================================
   ELIGIBILITY CALCULATION (Simulator tab)
   ============================================================ */
export interface CreditTier {
  grade: string;
  multiple: number;
  tone: Tone;
}

export function creditTier(score: number): CreditTier {
  if (score >= 800) return { grade: "A", multiple: 7, tone: "low" };
  if (score >= 700) return { grade: "B", multiple: 4, tone: "low" };
  if (score >= 600) return { grade: "C", multiple: 2.5, tone: "medium" };
  if (score >= 500) return { grade: "D", multiple: 1, tone: "medium" };
  return { grade: "E", multiple: 0, tone: "high" };
}

export interface RiskTier {
  label: string;
  pct: number;
  tone: Tone;
}

export function riskTier(score: number, onTime: number, dpd: number, npa: boolean): RiskTier {
  if (npa) return { label: "Manual Review", pct: 0, tone: "high" };
  if (score >= 750 && onTime >= 95 && dpd <= 15) return { label: "Low Risk", pct: 0.9, tone: "low" };
  if (score >= 650 && onTime >= 85) return { label: "Medium Risk", pct: 0.75, tone: "medium" };
  if (score >= 550) return { label: "High Risk", pct: 0.5, tone: "high" };
  return { label: "Manual Review", pct: 0, tone: "high" };
}

export interface EligibilityInputs {
  basicSalary: number;
  netSalary: number;
  otherIncome: number;
  existingEMI: number;
  existingBalance: number;
  creditScore: number;
  onTime: number;
  maxDPD: number;
  npa: boolean;
  collateral: number;
  tenure: number;
  productMax: number;
}

export interface LimitItem {
  name: string;
  value: number;
}

export function computeEligibility(inputs: EligibilityInputs) {
  const { basicSalary, netSalary, otherIncome, existingEMI, existingBalance, creditScore, onTime, maxDPD, npa, collateral, tenure, productMax } = inputs;

  const eligibleIncome = netSalary + otherIncome * 0.7;
  const salaryLimit = basicSalary * 5;

  let maxEMI = eligibleIncome * 0.3 - existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit = maxEMI * tenure * 0.91;

  const tier = creditTier(creditScore);
  const creditLimit = basicSalary * tier.multiple;

  const exposureRatio = Math.min(existingBalance / (eligibleIncome * 12 || 1), 0.6);
  const exposureLimit = affordabilityLimit * (1 - exposureRatio);

  const collateralLimit = collateral * 0.8 * 0.7;

  let onTimeAdj = 1;
  if (onTime < 70) onTimeAdj = 0.7;

  const limits: LimitItem[] = [
    { name: "Salary-Based Limit", value: salaryLimit },
    { name: "Affordability Limit", value: affordabilityLimit * onTimeAdj },
    { name: "Credit Score Limit", value: creditLimit },
    { name: "Existing Exposure Limit", value: exposureLimit },
    { name: "Collateral Limit", value: collateralLimit },
    { name: "Product Maximum", value: productMax },
  ];

  let final = Math.min(...limits.map((l) => l.value));
  let limitingFactor = limits.find((l) => l.value === final)?.name || "";
  let decision: "Eligible" | "Decline" = "Eligible";

  if (npa) { final = 0; limitingFactor = "Active NPA — Hard Stop"; decision = "Decline"; }
  else if (creditScore < 500) { final = 0; limitingFactor = "Credit Score Below Minimum"; decision = "Decline"; }

  const risk = riskTier(creditScore, onTime, maxDPD, npa);
  const preApproved = decision === "Eligible" ? final * risk.pct : 0;
  const maxEMIOut = (preApproved / tenure) * 1.1;

  return { eligibleIncome, limits, final, limitingFactor, decision, risk, preApproved, tier, maxEMIOut };
}