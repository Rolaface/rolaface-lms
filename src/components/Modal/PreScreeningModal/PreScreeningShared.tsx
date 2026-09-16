import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  ThemeIcon,
  UnstyledButton,
  Stack,
  SimpleGrid,
  Paper,
  Table,
  TextInput,
  Button,
  ActionIcon,
  Grid,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconHelp,
  IconRefresh,
  IconPercentage,
  IconArrowRight,
  IconMinus,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
} from "./Dummyloanapplicationdata";

export interface PreScreeningModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
  embedded?: boolean;
  readOnly?: boolean;
}

export const POLICY: Record<
  "personal" | "business" | "mortgage",
  { minCreditScore: number; maxDTI: number; productMax: number }
> = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

export type SourceKind = "bureau" | "hrms" | "application" | "manual" | "unavailable" | "none";

export interface LiabilityRecord {
  institution: string;
  facilityType: string;
  outstanding: number;
  monthlyPayment: number;
  status: string;
  source: SourceKind;
}

export interface IncomeRecord {
  type: string; // e.g. Rental, Pension, Business, Other
  amount: number;
}

export interface ScenarioDef {
  label: string;
  credit: number | null;
  creditSource: SourceKind;
  obligations: number | null;
  obligationsSource: SourceKind;
  income: number | null;
  incomeSource: SourceKind;
  riskBand?: string;
  activeAccounts?: number;
  delinquentAccounts?: number;
  recentEnquiries?: number;
  liabilities?: LiabilityRecord[];
}

export const SCENARIOS: Record<string, ScenarioDef> = {
  lower: {
    label: "Eligible for a lower amount",
    credit: 742,
    creditSource: "bureau",
    obligations: 1200,
    obligationsSource: "bureau",
    income: 13100,
    incomeSource: "hrms",
    riskBand: "Low",
    activeAccounts: 2,
    delinquentAccounts: 0,
    recentEnquiries: 1,
    liabilities: [
      {
        institution: "Zanaco",
        facilityType: "Personal Loan",
        outstanding: 12500,
        monthlyPayment: 850,
        status: "Active",
        source: "bureau",
      },
      {
        institution: "Absa",
        facilityType: "Credit Card",
        outstanding: 6000,
        monthlyPayment: 350,
        status: "Active",
        source: "bureau",
      },
    ],
  },
  eligible: {
    label: "Fully eligible",
    credit: 742,
    creditSource: "bureau",
    obligations: 2200,
    obligationsSource: "bureau",
    income: 22000,
    incomeSource: "hrms",
    riskBand: "Low",
    activeAccounts: 1,
    delinquentAccounts: 0,
    recentEnquiries: 0,
    liabilities: [
      {
        institution: "Metro Lending",
        facilityType: "Auto Loan",
        outstanding: 22000,
        monthlyPayment: 2200,
        status: "Active",
        source: "bureau",
      },
    ],
  },
  failed: {
    label: "Failed — credit score below minimum",
    credit: 590,
    creditSource: "bureau",
    obligations: 3850,
    obligationsSource: "bureau",
    income: 13100,
    incomeSource: "hrms",
    riskBand: "High",
    activeAccounts: 3,
    delinquentAccounts: 2,
    recentEnquiries: 5,
    liabilities: [
      {
        institution: "Capital Finance",
        facilityType: "Personal Loan",
        outstanding: 19000,
        monthlyPayment: 1900,
        status: "Active",
        source: "bureau",
      },
      {
        institution: "Horizon Credit",
        facilityType: "Credit Card",
        outstanding: 11000,
        monthlyPayment: 1000,
        status: "Delinquent",
        source: "bureau",
      },
      {
        institution: "Apex Lending",
        facilityType: "Overdraft",
        outstanding: 8500,
        monthlyPayment: 950,
        status: "Delinquent",
        source: "bureau",
      },
    ],
  },
  bureauDown: {
    label: "Bureau unavailable — needs manual entry",
    credit: null,
    creditSource: "unavailable",
    obligations: null,
    obligationsSource: "unavailable",
    income: 13100,
    incomeSource: "hrms",
    liabilities: [],
  },
  incomplete: {
    label: "Incomplete — income not yet available",
    credit: 742,
    creditSource: "bureau",
    obligations: 3850,
    obligationsSource: "bureau",
    income: null,
    incomeSource: "none",
    riskBand: "Low",
    activeAccounts: 2,
    delinquentAccounts: 0,
    recentEnquiries: 1,
    liabilities: [
      {
        institution: "Capital Finance",
        facilityType: "Personal Loan",
        outstanding: 24000,
        monthlyPayment: 2400,
        status: "Active",
        source: "bureau",
      },
      {
        institution: "Horizon Credit",
        facilityType: "Credit Card",
        outstanding: 14500,
        monthlyPayment: 1450,
        status: "Active",
        source: "bureau",
      },
    ],
  },
};

export const DEFAULT_SCENARIO = "lower";

export const zmw = (n: number | null) =>
  n == null ? "—" : "ZMW " + Math.round(n).toLocaleString();

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export interface EligibilityCalc {
  customerDTI: number;
  creditPassed: boolean;
  dtiPassed: boolean;
  maxAffordableMonthly: number;
  capacity: number;
  affordabilityAmount: number;
  eligibleAmount: number;
  productMax: number;
  mandatoryPassed: boolean;
}

export function calcEligibility({
  income,
  obligations,
  maxDTI,
  annualRate,
  tenureMonths,
  productMax,
  creditScore,
  minCreditScore,
}: {
  income: number | null;
  obligations: number | null;
  maxDTI: number;
  annualRate: number;
  tenureMonths: number;
  productMax: number;
  creditScore: number | null;
  minCreditScore: number;
}): EligibilityCalc | null {
  if (income == null || obligations == null || creditScore == null) return null;
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount =
    r > 0
      ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r)
      : capacity * tenureMonths;
  const eligibleAmount =
    creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
  return {
    customerDTI,
    creditPassed,
    dtiPassed,
    maxAffordableMonthly,
    capacity,
    affordabilityAmount,
    eligibleAmount,
    productMax,
    mandatoryPassed: creditPassed && dtiPassed,
  };
}

// ---------------------------------------------------------------------------
// Internal risk score — our own read on default risk, built from the bureau's
// underlying signals (credit score, delinquencies, enquiries, repayment
// history on existing facilities) rather than the bureau's own risk label.
// ---------------------------------------------------------------------------

export interface RiskScoreResult {
  score: number; // 0-100, higher = MORE risk (0 = safest, 100 = riskiest)
  band: "Low" | "Medium" | "High";
}

export function calcRiskScore({
  creditScore,
  delinquentAccounts,
  recentEnquiries,
  liabilityRecords,
}: {
  creditScore: number | null;
  delinquentAccounts: number | null;
  recentEnquiries: number | null;
  liabilityRecords: LiabilityRecord[];
}): RiskScoreResult | null {
  if (creditScore == null) return null;

  // Base risk from the credit score (300-850 -> 100-0: a low credit score means high risk).
  const baseRisk = Math.max(0, Math.min(100, 100 - ((creditScore - 300) / (850 - 300)) * 100));

  // Repayment history: facilities currently in default push risk up —
  // this is the "any defaults" / "previous repayment" signal.
  const defaultedFacilities = liabilityRecords.filter((r) => r.status !== "Active").length;
  const repaymentPenalty =
    defaultedFacilities * 12 + (delinquentAccounts ?? 0) * 8;

  // Recent credit-seeking behaviour — a burst of enquiries reads as elevated risk.
  const enquiryPenalty = Math.max(0, (recentEnquiries ?? 0) - 1) * 3;

  const score = Math.max(0, Math.min(100, Math.round(baseRisk + repaymentPenalty + enquiryPenalty)));
  const band = score <= 30 ? "Low" : score <= 69 ? "Medium" : "High";

  return { score, band };
}

export const SOURCE_MAP: Record<
  SourceKind,
  { label: string; color: string }
> = {
  bureau: { label: "Credit bureau", color: "brand" },
  hrms: { label: "HRMS", color: "brand" },
  application: { label: "From application", color: "teal" },
  manual: { label: "Manually entered", color: "orange" },
  unavailable: { label: "Unavailable", color: "gray" },
  none: { label: "Not available", color: "gray" },
};

export function SourceBadge({ source }: { source: SourceKind }) {
  const s = SOURCE_MAP[source] ?? SOURCE_MAP.manual;
  return (
    <Badge size="xs" radius="xl" color={s.color} variant="light">
      {s.label}
    </Badge>
  );
}

export function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Box>
      <Text fz={11} c="slate.5">
        {label}
      </Text>
      <Text fz={16} fw={700} c={accent ? "orange.7" : "slate.9"}>
        {value}
      </Text>
    </Box>
  );
}

export function CalcRow({
  label,
  value,
  last,
  strong,
}: {
  label: string;
  value: string;
  last?: boolean;
  strong?: boolean;
}) {
  return (
    <Group
      justify="space-between"
      py={9}
      style={{
        borderBottom: last
          ? "none"
          : "1px solid var(--mantine-color-slate-1)",
      }}
    >
      <Text fz={12.5} c="slate.5">
        {label}
      </Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}

export function CheckLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <Group gap={7} align="flex-start" wrap="nowrap">
      {ok ? (
        <IconCheck
          size={14}
          color="var(--mantine-color-green-6)"
          style={{ marginTop: 1, flexShrink: 0 }}
        />
      ) : (
        <IconX
          size={14}
          color="var(--mantine-color-red-6)"
          style={{ marginTop: 1, flexShrink: 0 }}
        />
      )}
      <Text fz={12.5} c="slate.7">
        {children}
      </Text>
    </Group>
  );
}

export function RuleRow({
  rule,
  req,
  customer,
  pass,
  calculated,
}: {
  rule: string;
  req: string;
  customer: string;
  pass: boolean;
  calculated?: boolean;
}) {
  return (
    <Table.Tr>
      <Table.Td>{rule}</Table.Td>
      <Table.Td>{req}</Table.Td>
      <Table.Td>{customer}</Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          {calculated ? (
            <>
              <IconPercentage size={11} color="var(--mantine-color-brand-6)" />
              <Text fz={11.5} fw={600} c="brand.6">
                Calculated
              </Text>
            </>
          ) : pass ? (
            <>
              <IconCheck size={11} color="var(--mantine-color-green-6)" />
              <Text fz={11.5} fw={600} c="green.7">
                Passed
              </Text>
            </>
          ) : (
            <>
              <IconX size={11} color="var(--mantine-color-red-6)" />
              <Text fz={11.5} fw={600} c="red.6">
                Failed
              </Text>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function ContextHeader({
  values,
  applicationId,
}: {
  values: LoanApplicationValues;
  applicationId: string;
}) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness
    ? values.companyName
    : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Group
      justify="space-between"
      align="center"
      px="xl"
      py="sm"
      bg="white"
      style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
    >
      <Group gap={12}>
        <ThemeIcon radius="xl" size={36} variant="light" color="brand">
          <Text fz="sm" fw={700}>
            {initials || "—"}
          </Text>
        </ThemeIcon>
        <Box>
          <Text fz="sm" fw={700} c="slate.9">
            {name || "—"}
          </Text>
          <Text fz="xs" c="slate.5">
            {isBusiness ? "Business Loan" : "Personal Loan"}
          </Text>
        </Box>
      </Group>
      <Group gap={26}>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">
            Requested amount
          </Text>
          <Text fz={13.5} fw={700} c="slate.9">
            {zmw(values.loanAmount)}
          </Text>
        </Box>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">
            Application ID
          </Text>
          <Text fz={13.5} fw={700} c="slate.9">
            {applicationId}
          </Text>
        </Box>
      </Group>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Left navigation
// ---------------------------------------------------------------------------

export type Section = "application" | "prescreening";

export function LeftNav({
  section,
  setSection,
}: {
  section: Section;
  setSection: (s: Section) => void;
}) {
  const items: { id: Section; label: string; icon: React.FC<any> }[] = [
    { id: "application", label: "Loan application", icon: IconFileText },
    { id: "prescreening", label: "Prescreening", icon: IconGauge },
  ];
  return (
    <Box
      w={216}
      style={{
        flexShrink: 0,
        background: "white",
        borderRight: "1px solid var(--mantine-color-slate-2)",
      }}
      p={12}
    >
      <Text
        fz={10.5}
        fw={600}
        c="slate.4"
        tt="uppercase"
        px={10}
        mb={10}
        style={{ letterSpacing: 0.4 }}
      >
        Stage 2 of 5
      </Text>
      <Stack gap={4}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          return (
            <UnstyledButton
              key={it.id}
              onClick={() => setSection(it.id)}
              px={12}
              py={10}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                background: active
                  ? "var(--mantine-color-brand-0)"
                  : "transparent",
              }}
            >
              <Group gap={10}>
                <Icon
                  size={16}
                  color={
                    active
                      ? "var(--mantine-color-brand-7)"
                      : "var(--mantine-color-slate-6)"
                  }
                />
                <Text
                  fz="sm"
                  fw={active ? 600 : 500}
                  c={active ? "brand.7" : "slate.7"}
                >
                  {it.label}
                </Text>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Data source cards (credit score / liabilities / income)
// ---------------------------------------------------------------------------

export interface FieldState {
  status: "idle" | "loading";
  manual: boolean;
  reason: string;
}
export interface CreditState extends FieldState {
  value: number | null;
  source: SourceKind;
  riskBand: string | null;
  activeAccounts: number | null;
  delinquentAccounts: number | null;
  recentEnquiries: number | null;
}
export interface LiabilitiesState extends FieldState {
  obligations: number | null;
  activeLoans: number | null;
  outstanding: number | null;
  source: SourceKind;
  records: LiabilityRecord[];
  additionalRecords: LiabilityRecord[];
}
export interface IncomeState extends FieldState {
  value: number | null;
  source: SourceKind;
  additionalIncome: IncomeRecord[];
}
export interface PrescreeningState {
  credit: CreditState;
  liabilities: LiabilitiesState;
  income: IncomeState;
}

export function buildInitialState(scenarioKey: string): PrescreeningState {
  const s = SCENARIOS[scenarioKey];
  const records = s.liabilities ?? [];
  return {
    credit: {
      value: s.credit,
      source: s.creditSource,
      status: "idle",
      manual: s.creditSource === "unavailable",
      reason: "",
      riskBand: s.riskBand ?? null,
      activeAccounts: s.activeAccounts ?? null,
      delinquentAccounts: s.delinquentAccounts ?? null,
      recentEnquiries: s.recentEnquiries ?? null,
    },
    liabilities: {
      obligations: s.obligations,
      activeLoans: records.length || (s.obligations != null ? 2 : null),
      outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null,
      source: s.obligationsSource,
      status: "idle",
      manual: s.obligationsSource === "unavailable",
      reason: "",
      records,
      additionalRecords: [],
    },
    income: {
      value: s.income,
      source: s.incomeSource,
      status: "idle",
      manual: false,
      reason: "",
      additionalIncome: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Comparison bar
// ---------------------------------------------------------------------------

export function ComparisonBar({
  requested,
  eligible,
  productMax,
}: {
  requested: number;
  eligible: number;
  productMax: number;
}) {
  const scale = Math.max(requested, eligible, productMax * 0.4) * 1.05;
  const eligiblePct = Math.min(100, (eligible / scale) * 100);
  const requestedPct = Math.min(100, (requested / scale) * 100);
  const tone = eligible >= requested ? "green" : "orange";
  return (
    <Box my={8}>
      <Box
        pos="relative"
        style={{
          height: 10,
          background: "var(--mantine-color-slate-1)",
          borderRadius: 6,
        }}
      >
        <Box
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${eligiblePct}%`,
            background: `var(--mantine-color-${tone}-6)`,
            borderRadius: 6,
          }}
        />
        <Box
          style={{
            position: "absolute",
            left: `calc(${requestedPct}% - 1px)`,
            top: -4,
            width: 2,
            height: 18,
            background: "var(--mantine-color-slate-9)",
          }}
        />
      </Box>
      <Group justify="space-between" mt={6}>
        <Text fz={11} c="slate.5">
          ZMW 0
        </Text>
        <Text fz={11} c="slate.5">
          Eligible: {zmw(eligible)}
        </Text>
        <Text fz={11} c="slate.5">
          Requested amount: {zmw(requested)}
        </Text>
      </Group>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Compact overview — Credit Score, Liabilities, Income in one row + DTI row
// ---------------------------------------------------------------------------

export function creditScoreBand(score: number): { label: string; color: string } {
  if (score < 600) return { label: "Poor", color: "red" };
  if (score < 680) return { label: "Fair", color: "orange" };
  if (score < 740) return { label: "Good", color: "yellow" };
  return { label: "Excellent", color: "green" };
}

export function CreditGaugeVisual({
  score,
  unavailable,
  loading,
}: {
  score: number | null;
  unavailable?: boolean;
  loading?: boolean;
}) {
  const min = 300;
  const max = 850;
  const clamped = score == null ? min : Math.min(max, Math.max(min, score));
  const pct = (clamped - min) / (max - min);
  const needleAngle = -90 + pct * 180;
  const band = score != null ? creditScoreBand(score) : null;

  const segments = [
    { d: "M10 76 A64 64 0 0 1 28.75 30.75", color: "red" },
    { d: "M28.75 30.75 A64 64 0 0 1 74 12", color: "orange" },
    { d: "M74 12 A64 64 0 0 1 119.25 30.75", color: "yellow" },
    { d: "M119.25 30.75 A64 64 0 0 1 138 76", color: "green" },
  ];

  return (
    <>
      <Box
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg
          width="100%"
          height="76"
          viewBox="0 0 148 82"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: 144, overflow: "visible" }}
        >
          {segments.map((s) => (
            <path
              key={s.color}
              d={s.d}
              fill="none"
              stroke={`var(--mantine-color-${s.color}-6)`}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={score == null ? 0.35 : 1}
            />
          ))}
          {score != null && (
            <g
              transform={`rotate(${needleAngle} 74 76)`}
              style={{ transition: "transform 0.5s ease" }}
            >
              <line
                x1="74"
                y1="76"
                x2="74"
                y2="26"
                stroke="var(--mantine-color-slate-9)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          )}
          <circle cx="74" cy="76" r="5" fill="var(--mantine-color-slate-9)" />
        </svg>
      </Box>

      <Group justify="center" gap={6} mt={4}>
        <Text fz={18} fw={700} c="slate.9">
          {loading ? "…" : (score ?? "—")}
        </Text>
        <Box
          px={7}
          py={1}
          bg={band ? `${band.color}.0` : "slate.1"}
          style={{ borderRadius: 999 }}
        >
          <Text fz={10} fw={600} c={band ? `${band.color}.7` : "slate.5"}>
            {loading
              ? "Fetching…"
              : unavailable
                ? "Unavailable"
                : band
                  ? band.label
                  : "Not fetched"}
          </Text>
        </Box>
      </Group>
    </>
  );
}

export function CompactRow({
  label,
  value,
  subtext,
  badge,
  last,
  action,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  badge?: React.ReactNode;
  last?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Box
      py={4}
      style={{
        borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fz={12.5} fw={600} c="slate.9">
            {label}
          </Text>
          <Text fz={14} fw={500} c="slate.7" mt={1}>
            {value}
          </Text>
          {(subtext || badge) && (
            <Group gap={6} mt={2}>
              {subtext && (
                <Text fz={10.5} c="slate.5">
                  {subtext}
                </Text>
              )}
              {badge}
            </Group>
          )}
        </Box>
        {action}
      </Group>
    </Box>
  );
}

export function StatMini({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.FC<any>;
  label: string;
  value: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <Group gap={8} align="flex-start" wrap="nowrap">
      <ThemeIcon radius="sm" size={22} variant="light" color="slate">
        <Icon size={12} color="var(--mantine-color-slate-6)" />
      </ThemeIcon>
      <Box style={{ minWidth: 0 }}>
        <Text fz={10.5} c="slate.5" truncate>
          {label}
        </Text>
        {sublabel && (
          <Text fz={9.5} c="slate.4" mt={-2}>
            · {sublabel}
          </Text>
        )}
        <Text fz={13} fw={700} c="slate.9" mt={1}>
          {value}
        </Text>
      </Box>
    </Group>
  );
}

