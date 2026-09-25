import {
  Box,
  Group,
  Text,
  Badge,
  UnstyledButton,
  Stack,
  Paper,
  Table,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconCheck,
  IconX,
  IconPercentage,
} from "@tabler/icons-react";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import "./prescreening.css";

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
    <Group
      gap={5}
      wrap="nowrap"
      px={7}
      py={1}
      style={{
        borderRadius: 999,
        background: `var(--mantine-color-${s.color}-0)`,
        border: `1px solid var(--mantine-color-${s.color}-1)`,
      }}
    >
      <Box
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          flexShrink: 0,
          background: `var(--mantine-color-${s.color}-6)`,
        }}
      />
      <Text fz={10} fw={600} c={`${s.color}.7`} style={{ letterSpacing: 0.1 }}>
        {s.label}
      </Text>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Prescreening UI kit — the pieces every card on this stage is built from, so
// surfaces, headers and inline actions stay visually identical everywhere.
// ---------------------------------------------------------------------------

/** Tabular figures keep money columns from jittering as values refresh. */
export const NUMERIC: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

export function MicroLabel({
  children,
  c = "slate.5",
}: {
  children: React.ReactNode;
  c?: string;
}) {
  return (
    <Text fz={9.5} fw={700} c={c} tt="uppercase" style={{ letterSpacing: 0.7 }}>
      {children}
    </Text>
  );
}

/** Gradient icon tile used in every card header. */
export function IconTile({
  icon: Icon,
  color = "brand",
  size = 28,
  iconSize = 15,
}: {
  icon: React.FC<any>;
  color?: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <Box
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size / 3,
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(135deg, var(--mantine-color-${color}-5), var(--mantine-color-${color}-7))`,
        boxShadow: `0 4px 10px -4px color-mix(in srgb, var(--mantine-color-${color}-6) 70%, transparent)`,
      }}
    >
      <Icon size={iconSize} color="var(--mantine-color-white)" stroke={2} />
    </Box>
  );
}

/** Compact pill button — replaces the bare text links used before. */
export function InlineAction({
  label,
  icon: Icon,
  onClick,
  color = "brand",
  disabled,
  variant = "soft",
}: {
  label: string;
  icon?: React.FC<any>;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  variant?: "soft" | "ghost";
}) {
  const soft = variant === "soft";
  return (
    <UnstyledButton
      className="ps-chip"
      onClick={onClick}
      disabled={disabled}
      px={8}
      py={3}
      style={{
        borderRadius: 999,
        background: soft ? `var(--mantine-color-${color}-0)` : "transparent",
        border: `1px solid ${soft ? `var(--mantine-color-${color}-1)` : "transparent"}`,
      }}
    >
      <Group gap={4} wrap="nowrap">
        {Icon && <Icon size={11} stroke={2.2} color={`var(--mantine-color-${color}-6)`} />}
        <Text fz={11} fw={600} c={`${color}.6`} style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

/** White elevated card with a tinted header strip. */
export function SectionCard({
  icon,
  color = "brand",
  title,
  subtitle,
  actions,
  children,
  bodyPad = 12,
  style,
}: {
  icon?: React.FC<any>;
  color?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  bodyPad?: number;
  style?: React.CSSProperties;
}) {
  return (
    <Paper
      className="ps-surface"
      radius="lg"
      withBorder
      bg="white"
      style={{
        borderColor: "var(--mantine-color-slate-2)",
        overflow: "hidden",
        ...style,
      }}
    >
      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        px={12}
        py={9}
        style={{
          borderBottom: "1px solid var(--mantine-color-slate-1)",
          background:
            "linear-gradient(180deg, var(--mantine-color-slate-0) 0%, var(--mantine-color-white) 100%)",
        }}
      >
        <Group gap={9} wrap="nowrap" style={{ minWidth: 0 }}>
          {icon && <IconTile icon={icon} color={color} size={26} iconSize={14} />}
          <Box style={{ minWidth: 0 }}>
            <Text fz={13} fw={700} c="slate.9" lh={1.25} truncate>
              {title}
            </Text>
            {subtitle && (
              <Text fz={10.5} c="slate.5" lh={1.3} truncate>
                {subtitle}
              </Text>
            )}
          </Box>
        </Group>
        {actions && (
          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            {actions}
          </Group>
        )}
      </Group>
      <Box p={bodyPad}>{children}</Box>
    </Paper>
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
      py={12}
      wrap="nowrap"
      style={{
        borderBottom: "1px solid var(--mantine-color-slate-2)",
        background:
          "linear-gradient(120deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-white) 42%)",
      }}
    >
      <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
        <Box
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "var(--mantine-color-white)",
            background:
              "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
            boxShadow:
              "0 6px 16px -6px color-mix(in srgb, var(--mantine-color-brand-6) 75%, transparent)",
          }}
        >
          <Text fz={14} fw={700} c="white" style={{ letterSpacing: 0.3 }}>
            {initials || "—"}
          </Text>
        </Box>
        <Box style={{ minWidth: 0 }}>
          <Text fz={15} fw={700} c="slate.9" lh={1.25} truncate>
            {name || "—"}
          </Text>
          <Group gap={8} wrap="nowrap" mt={2}>
            <Badge size="xs" radius="xl" color="brand" variant="light">
              {isBusiness ? "Business Loan" : "Personal Loan"}
            </Badge>
            <Text fz={11} c="slate.4">
              ·
            </Text>
            <Text fz={11} c="slate.5" style={NUMERIC}>
              {applicationId}
            </Text>
          </Group>
        </Box>
      </Group>

      <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
        <Box ta="right" px={18}>
          <MicroLabel c="slate.4">Requested amount</MicroLabel>
          <Text fz={16} fw={800} c="slate.9" lh={1.2} style={NUMERIC} mt={2}>
            {zmw(values.loanAmount)}
          </Text>
        </Box>
        <Box
          style={{
            width: 1,
            height: 30,
            background: "var(--mantine-color-slate-2)",
            flexShrink: 0,
          }}
        />
        <Box ta="right" px={18}>
          <MicroLabel c="slate.4">Tenure</MicroLabel>
          <Text fz={16} fw={800} c="slate.9" lh={1.2} style={NUMERIC} mt={2}>
            {values.tenureMonths ? `${values.tenureMonths} mo` : "—"}
          </Text>
        </Box>
        <Box
          style={{
            width: 1,
            height: 30,
            background: "var(--mantine-color-slate-2)",
            flexShrink: 0,
          }}
        />
        <Box pl={18}>
          <MicroLabel c="slate.4">Stage</MicroLabel>
          <Group gap={7} wrap="nowrap" mt={3}>
            <Group gap={3} wrap="nowrap">
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  style={{
                    width: i === 1 ? 16 : 7,
                    height: 5,
                    borderRadius: 99,
                    background:
                      i <= 1
                        ? "var(--mantine-color-brand-5)"
                        : "var(--mantine-color-slate-2)",
                    transition: "width 200ms ease",
                  }}
                />
              ))}
            </Group>
            <Text fz={11.5} fw={700} c="brand.6">
              Prescreening
            </Text>
          </Group>
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
  const items: {
    id: Section;
    label: string;
    hint: string;
    icon: React.FC<any>;
    done: boolean;
  }[] = [
    {
      id: "application",
      label: "Loan application",
      hint: "Submitted",
      icon: IconFileText,
      done: true,
    },
    {
      id: "prescreening",
      label: "Prescreening",
      hint: "In progress",
      icon: IconGauge,
      done: false,
    },
  ];

  return (
    <Box
      w={224}
      p={14}
      style={{
        flexShrink: 0,
        borderRight: "1px solid var(--mantine-color-slate-2)",
        background:
          "linear-gradient(180deg, var(--mantine-color-white) 0%, var(--mantine-color-slate-0) 100%)",
      }}
    >
      <Group gap={6} px={4} mb={4} wrap="nowrap">
        <MicroLabel c="slate.4">Stage 2 of 5</MicroLabel>
      </Group>
      <Box
        mx={4}
        mb={12}
        style={{
          height: 4,
          borderRadius: 99,
          background: "var(--mantine-color-slate-2)",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            width: "40%",
            height: "100%",
            borderRadius: 99,
            background:
              "linear-gradient(90deg, var(--mantine-color-brand-4), var(--mantine-color-brand-6))",
          }}
        />
      </Box>

      <Stack gap={6}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          return (
            <UnstyledButton
              key={it.id}
              className="ps-nav-item"
              onClick={() => setSection(it.id)}
              px={10}
              py={9}
              style={{
                position: "relative",
                borderRadius: "var(--mantine-radius-md)",
                background: active ? "var(--mantine-color-white)" : "transparent",
                border: `1px solid ${active ? "var(--mantine-color-brand-1)" : "transparent"}`,
                boxShadow: active
                  ? "0 6px 16px -12px rgba(15, 23, 42, 0.5)"
                  : "none",
              }}
            >
              {active && (
                <Box
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 10,
                    bottom: 10,
                    width: 3,
                    borderRadius: 99,
                    background: "var(--mantine-color-brand-6)",
                  }}
                />
              )}
              <Group gap={10} wrap="nowrap">
                <Box
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    background: active
                      ? "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))"
                      : it.done
                        ? "var(--mantine-color-success-0)"
                        : "var(--mantine-color-slate-1)",
                  }}
                >
                  {it.done && !active ? (
                    <IconCheck size={13} color="var(--mantine-color-success-6)" stroke={2.5} />
                  ) : (
                    <Icon
                      size={14}
                      stroke={2}
                      color={
                        active
                          ? "var(--mantine-color-white)"
                          : "var(--mantine-color-slate-5)"
                      }
                    />
                  )}
                </Box>
                <Box style={{ minWidth: 0 }}>
                  <Text
                    fz={12.5}
                    fw={active ? 700 : 600}
                    c={active ? "brand.7" : "slate.7"}
                    lh={1.25}
                    truncate
                  >
                    {it.label}
                  </Text>
                  <Text fz={10} c={active ? "brand.5" : "slate.4"} lh={1.3}>
                    {it.hint}
                  </Text>
                </Box>
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
  const band = score != null ? creditScoreBand(score) : null;
  const color = band?.color ?? "slate";

  // Single 180° arc, centre (80, 80), r = 64 → length = pi * r.
  const R = 64;
  const ARC = Math.PI * R;
  const FULL_ARC = `M16 80 A${R} ${R} 0 0 1 144 80`;

  // Band zones are kept as a faint backdrop so the score still reads in context.
  const zones = [
    { d: "M16 80 A64 64 0 0 1 34.75 34.75", color: "red" },
    { d: "M34.75 34.75 A64 64 0 0 1 80 16", color: "orange" },
    { d: "M80 16 A64 64 0 0 1 125.25 34.75", color: "yellow" },
    { d: "M125.25 34.75 A64 64 0 0 1 144 80", color: "green" },
  ];

  const theta = (180 - pct * 180) * (Math.PI / 180);
  const markerX = 80 + R * Math.cos(theta);
  const markerY = 80 - R * Math.sin(theta);

  return (
    <Box style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <Box style={{ position: "relative", width: "100%", maxWidth: 186 }}>
        <svg width="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
          {zones.map((z) => (
            <path
              key={z.color}
              d={z.d}
              fill="none"
              stroke={`var(--mantine-color-${z.color}-5)`}
              strokeWidth="11"
              strokeLinecap="butt"
              opacity={0.2}
            />
          ))}

          <path
            d={FULL_ARC}
            fill="none"
            stroke={`var(--mantine-color-${color}-6)`}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${score == null ? 0 : pct * ARC} ${ARC}`}
            style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />

          {score != null && (
            <g style={{ transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
              <circle cx={markerX} cy={markerY} r="7" fill="var(--mantine-color-white)" />
              <circle
                cx={markerX}
                cy={markerY}
                r="4.5"
                fill={`var(--mantine-color-${color}-6)`}
              />
            </g>
          )}

          <text x="12" y="94" fontSize="8.5" fontWeight="600" fill="var(--mantine-color-slate-4)">
            300
          </text>
          <text x="134" y="94" fontSize="8.5" fontWeight="600" fill="var(--mantine-color-slate-4)" textAnchor="middle">
            850
          </text>
        </svg>

        {/* Score readout, centred inside the arc */}
        <Box
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "22%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Text fz={26} fw={800} c="slate.9" lh={1} style={NUMERIC}>
            {loading ? "…" : (score ?? "—")}
          </Text>
          <Box
            mt={4}
            mx="auto"
            px={8}
            py={1}
            style={{
              display: "inline-block",
              borderRadius: 999,
              background: `var(--mantine-color-${band ? band.color : "slate"}-0)`,
              border: `1px solid var(--mantine-color-${band ? band.color : "slate"}-2)`,
            }}
          >
            <Text fz={10} fw={700} c={band ? `${band.color}.7` : "slate.5"}>
              {loading
                ? "Fetching…"
                : unavailable
                  ? "Unavailable"
                  : band
                    ? band.label
                    : "Not fetched"}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
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
      py={2}
      style={{
        borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flex: 1, minWidth: 0 }}>
          {label && <MicroLabel c="slate.4">{label}</MicroLabel>}
          <Box
            mt={label ? 3 : 0}
            style={{
              ...NUMERIC,
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.2,
              color: "var(--mantine-color-slate-9)",
            }}
          >
            {value}
          </Box>
          {(subtext || badge) && (
            <Group gap={6} mt={4} wrap="nowrap">
              {badge}
              {subtext && (
                <Text fz={10.5} c="slate.5" truncate>
                  {subtext}
                </Text>
              )}
            </Group>
          )}
        </Box>
        {action && <Box style={{ flexShrink: 0 }}>{action}</Box>}
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
    <Box
      className="ps-stat"
      p={8}
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-white)",
        minWidth: 0,
      }}
    >
      <Group gap={6} wrap="nowrap" mb={4}>
        <Box
          style={{
            width: 18,
            height: 18,
            flexShrink: 0,
            borderRadius: 6,
            display: "grid",
            placeItems: "center",
            background: "var(--mantine-color-slate-1)",
          }}
        >
          <Icon size={11} stroke={2} color="var(--mantine-color-slate-6)" />
        </Box>
        <Text fz={10} fw={600} c="slate.5" truncate>
          {label}
        </Text>
      </Group>
      <Group justify="space-between" align="baseline" wrap="nowrap" gap={4}>
        <Text fz={14} fw={800} c="slate.9" style={NUMERIC} truncate>
          {value}
        </Text>
        {sublabel && (
          <Text fz={8.5} fw={700} c="slate.4" tt="uppercase" style={{ letterSpacing: 0.5, flexShrink: 0 }}>
            {sublabel}
          </Text>
        )}
      </Group>
    </Box>
  );
}
