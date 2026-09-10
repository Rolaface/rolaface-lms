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
  Loader,
  TextInput,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconHelp,
  IconRefresh,
  IconPencil,
  IconBuildingBank,
  IconWallet,
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

interface PreScreeningModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
  embedded?: boolean;
  readOnly?: boolean;
}

const POLICY: Record<
  "personal" | "business" | "mortgage",
  { minCreditScore: number; maxDTI: number; productMax: number }
> = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

type SourceKind = "bureau" | "hrms" | "application" | "manual" | "unavailable" | "none";

interface ScenarioDef {
  label: string;
  credit: number | null;
  creditSource: SourceKind;
  obligations: number | null;
  obligationsSource: SourceKind;
  income: number | null;
  incomeSource: SourceKind;
}

const SCENARIOS: Record<string, ScenarioDef> = {
  lower: {
    label: "Eligible for a lower amount",
    credit: 742,
    creditSource: "bureau",
    obligations: 3850,
    obligationsSource: "bureau",
    income: 13100,
    incomeSource: "hrms",
  },
  eligible: {
    label: "Fully eligible",
    credit: 742,
    creditSource: "bureau",
    obligations: 2200,
    obligationsSource: "bureau",
    income: 22000,
    incomeSource: "hrms",
  },
  failed: {
    label: "Failed — credit score below minimum",
    credit: 590,
    creditSource: "bureau",
    obligations: 3850,
    obligationsSource: "bureau",
    income: 13100,
    incomeSource: "hrms",
  },
  bureauDown: {
    label: "Bureau unavailable — needs manual entry",
    credit: null,
    creditSource: "unavailable",
    obligations: null,
    obligationsSource: "unavailable",
    income: 13100,
    incomeSource: "hrms",
  },
  incomplete: {
    label: "Incomplete — income not yet available",
    credit: 742,
    creditSource: "bureau",
    obligations: 3850,
    obligationsSource: "bureau",
    income: null,
    incomeSource: "none",
  },
};

const DEFAULT_SCENARIO = "lower";

const zmw = (n: number | null) =>
  n == null ? "—" : "ZMW " + Math.round(n).toLocaleString();

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

interface EligibilityCalc {
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

function calcEligibility({
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fz={11}
      fw={600}
      c="slate.5"
      tt="uppercase"
      style={{ letterSpacing: 0.3 }}
      mb={10}
    >
      {children}
    </Text>
  );
}

const SOURCE_MAP: Record<
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

function SourceBadge({ source }: { source: SourceKind }) {
  const s = SOURCE_MAP[source] ?? SOURCE_MAP.manual;
  return (
    <Badge size="xs" radius="xl" color={s.color} variant="light">
      {s.label}
    </Badge>
  );
}

function MiniStat({
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

function CalcRow({
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

function CheckLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
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

function RuleRow({
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

function ContextHeader({
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

type Section = "application" | "prescreening";

function LeftNav({
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

interface FieldState {
  status: "idle" | "loading";
  manual: boolean;
  reason: string;
}
interface CreditState extends FieldState {
  value: number | null;
  source: SourceKind;
}
interface LiabilitiesState extends FieldState {
  obligations: number | null;
  activeLoans: number | null;
  outstanding: number | null;
  source: SourceKind;
}
interface IncomeState extends FieldState {
  value: number | null;
  source: SourceKind;
}
interface PrescreeningState {
  credit: CreditState;
  liabilities: LiabilitiesState;
  income: IncomeState;
}

function buildInitialState(scenarioKey: string): PrescreeningState {
  const s = SCENARIOS[scenarioKey];
  return {
    credit: {
      value: s.credit,
      source: s.creditSource,
      status: "idle",
      manual: s.creditSource === "unavailable",
      reason: "",
    },
    liabilities: {
      obligations: s.obligations,
      activeLoans: s.obligations != null ? 2 : null,
      outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null,
      source: s.obligationsSource,
      status: "idle",
      manual: s.obligationsSource === "unavailable",
      reason: "",
    },
    income: {
      value: s.income,
      source: s.incomeSource,
      status: "idle",
      manual: false,
      reason: "",
    },
  };
}

function DataCard({
  title,
  icon: Icon,
  status,
  source,
  manualMode,
  onEnterManually,
  onUseSource,
  onRefresh,
  readOnly,
  children,
}: {
  title: string;
  icon: React.FC<any>;
  status: "idle" | "loading";
  source: SourceKind;
  manualMode: boolean;
  onEnterManually: () => void;
  onUseSource?: () => void;
  onRefresh?: () => void;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" mb={10}>
        <Group gap={7}>
          <Icon size={14} color="var(--mantine-color-slate-5)" />
          <Text fz={12.5} fw={600} c="slate.7">
            {title}
          </Text>
        </Group>
        {status === "loading" && <Loader size={13} />}
      </Group>
      {children}
      {!readOnly && (
        <Group gap={8} mt={12} style={{ flexWrap: "wrap" }}>
          {!manualMode && source !== "unavailable" && source !== "none" && onRefresh && (
            <Button
              size="xs"
              variant="light"
              color="brand"
              radius="sm"
              leftSection={<IconRefresh size={11} />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}
          {!manualMode && (
            <Button
              size="xs"
              variant="default"
              radius="sm"
              leftSection={<IconPencil size={11} />}
              onClick={onEnterManually}
            >
              Enter manually
            </Button>
          )}
          {manualMode && onUseSource && (
            <Button
              size="xs"
              variant="default"
              radius="sm"
              leftSection={<IconRefresh size={11} />}
              onClick={onUseSource}
            >
              Use source value
            </Button>
          )}
        </Group>
      )}
    </Paper>
  );
}

function CreditScoreCard({
  state,
  dispatch,
  readOnly,
}: {
  state: PrescreeningState;
  dispatch: (a: any) => void;
  readOnly?: boolean;
}) {
  const { value, source, status, manual, reason } = state.credit;
  return (
    <DataCard
      title="Credit score"
      icon={IconGauge}
      status={status}
      source={source}
      manualMode={manual}
      readOnly={readOnly}
      onRefresh={() => dispatch({ type: "fetchCredit" })}
      onEnterManually={() => dispatch({ type: "manualCredit", on: true })}
      onUseSource={() => dispatch({ type: "manualCredit", on: false })}
    >
      {status === "loading" ? (
        <Text fz={12.5} c="slate.5">
          Fetching from credit bureau…
        </Text>
      ) : manual ? (
        <Stack gap={6}>
          <TextInput
            radius="md"
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              dispatch({
                type: "setCredit",
                value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
              })
            }
            placeholder="e.g. 700"
            styles={{ input: { fontSize: 15, fontWeight: 700 } }}
          />
          <TextInput
            radius="md"
            size="xs"
            value={reason}
            onChange={(e) =>
              dispatch({ type: "setCreditReason", value: e.currentTarget.value })
            }
            placeholder="Reason for manual entry"
          />
          <SourceBadge source="manual" />
        </Stack>
      ) : source === "unavailable" ? (
        <Stack gap={4}>
          <Text fz={12.5} c="slate.4">
            Bureau unavailable
          </Text>
          <SourceBadge source="unavailable" />
        </Stack>
      ) : (
        <Stack gap={2}>
          <Text fz={22} fw={700} c="slate.9">
            {value}
          </Text>
          <Text fz={11.5} c="slate.5" mb={4}>
            Fetched today · Successfully fetched
          </Text>
          <SourceBadge source={source} />
        </Stack>
      )}
    </DataCard>
  );
}

function LiabilitiesCard({
  state,
  dispatch,
  readOnly,
}: {
  state: PrescreeningState;
  dispatch: (a: any) => void;
  readOnly?: boolean;
}) {
  const { obligations, activeLoans, outstanding, source, status, manual, reason } =
    state.liabilities;
  return (
    <DataCard
      title="Existing liabilities"
      icon={IconBuildingBank}
      status={status}
      source={source}
      manualMode={manual}
      readOnly={readOnly}
      onRefresh={() => dispatch({ type: "fetchLiabilities" })}
      onEnterManually={() => dispatch({ type: "manualLiabilities", on: true })}
      onUseSource={() => dispatch({ type: "manualLiabilities", on: false })}
    >
      {status === "loading" ? (
        <Text fz={12.5} c="slate.5">
          Fetching from credit bureau…
        </Text>
      ) : manual ? (
        <Stack gap={6}>
          <Text fz={11} c="slate.5">
            Monthly obligations (ZMW)
          </Text>
          <TextInput
            radius="md"
            type="number"
            value={obligations ?? ""}
            onChange={(e) =>
              dispatch({
                type: "setObligations",
                value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
              })
            }
            placeholder="e.g. 5000"
            styles={{ input: { fontSize: 15, fontWeight: 700 } }}
          />
          <TextInput
            radius="md"
            size="xs"
            value={reason}
            onChange={(e) =>
              dispatch({ type: "setLiabReason", value: e.currentTarget.value })
            }
            placeholder="Reason for manual adjustment"
          />
          <SourceBadge source="manual" />
        </Stack>
      ) : source === "unavailable" ? (
        <Stack gap={4}>
          <Text fz={12.5} c="slate.4">
            Bureau unavailable
          </Text>
          <SourceBadge source="unavailable" />
        </Stack>
      ) : (
        <Stack gap={2}>
          <Group gap={4} align="baseline">
            <Text fz={22} fw={700} c="slate.9">
              {zmw(obligations)}
            </Text>
            <Text fz={11} fw={500} c="slate.4">
              /mo
            </Text>
          </Group>
          <Text fz={11.5} c="slate.5" mb={4}>
            {activeLoans} active loans · {zmw(outstanding)} outstanding
          </Text>
          <SourceBadge source={source} />
        </Stack>
      )}
    </DataCard>
  );
}

function IncomeCard({
  state,
  dispatch,
  readOnly,
}: {
  state: PrescreeningState;
  dispatch: (a: any) => void;
  readOnly?: boolean;
}) {
  const { value, source, status, manual, reason } = state.income;
  return (
    <DataCard
      title="Monthly income"
      icon={IconWallet}
      status={status}
      source={source}
      manualMode={manual}
      readOnly={readOnly}
      onRefresh={() => dispatch({ type: "fetchIncome" })}
      onEnterManually={() => dispatch({ type: "manualIncome", on: true })}
      onUseSource={() => dispatch({ type: "manualIncome", on: false })}
    >
      {status === "loading" ? (
        <Text fz={12.5} c="slate.5">
          Checking HRMS…
        </Text>
      ) : manual ? (
        <Stack gap={6}>
          <TextInput
            radius="md"
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              dispatch({
                type: "setIncome",
                value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
              })
            }
            placeholder="e.g. 12000"
            styles={{ input: { fontSize: 15, fontWeight: 700 } }}
          />
          <TextInput
            radius="md"
            size="xs"
            value={reason}
            onChange={(e) =>
              dispatch({ type: "setIncomeReason", value: e.currentTarget.value })
            }
            placeholder="Reason for manual entry"
          />
          <SourceBadge source="manual" />
        </Stack>
      ) : source === "none" ? (
        <Stack gap={4}>
          <Text fz={12.5} c="slate.4">
            Not available from HRMS or the application
          </Text>
          <SourceBadge source="none" />
        </Stack>
      ) : (
        <Stack gap={2}>
          <Text fz={22} fw={700} c="slate.9">
            {zmw(value)}
          </Text>
          <Text fz={11.5} c="slate.5" mb={4}>
            {source === "hrms"
              ? "Confirmed via HRMS payroll"
              : source === "application"
                ? "Reused from the loan application"
                : ""}
          </Text>
          <SourceBadge source={source} />
        </Stack>
      )}
    </DataCard>
  );
}

// ---------------------------------------------------------------------------
// Comparison bar
// ---------------------------------------------------------------------------

function ComparisonBar({
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
    <Box my={16}>
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
          Requested marker: {zmw(requested)}
        </Text>
      </Group>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Eligibility calculation section
// ---------------------------------------------------------------------------

function EligibilitySection({
  calc,
  requested,
  tenure,
  rate,
  maxDTI,
  minCreditScore,
  productMax,
  income,
  obligations,
  creditScore,
  rulesOpen,
  setRulesOpen,
  calcOpen,
  setCalcOpen,
  recalcFlash,
}: {
  calc: EligibilityCalc | null;
  requested: number;
  tenure: number;
  rate: number;
  maxDTI: number;
  minCreditScore: number;
  productMax: number;
  income: number | null;
  obligations: number | null;
  creditScore: number | null;
  rulesOpen: boolean;
  setRulesOpen: (v: boolean) => void;
  calcOpen: boolean;
  setCalcOpen: (v: boolean) => void;
  recalcFlash: boolean;
}) {
  if (!calc) {
    const missing: string[] = [];
    if (creditScore == null) missing.push("Credit score");
    if (obligations == null) missing.push("Liability information");
    if (income == null) missing.push("Income");
    return (
      <Paper
        withBorder
        radius="md"
        p="xl"
        ta="center"
        style={{ borderStyle: "dashed" }}
      >
        <IconHelp size={22} color="var(--mantine-color-slate-4)" />
        <Text fz={13.5} fw={600} c="slate.9" mt={6}>
          Prescreening incomplete
        </Text>
        <Text fz={12.5} c="slate.5" mt={4}>
          Missing: {missing.join(", ")}. Fetch or enter these above to run
          the calculation.
        </Text>
      </Paper>
    );
  }

  const {
    eligibleAmount,
    mandatoryPassed,
    creditPassed,
    dtiPassed,
    customerDTI,
    maxAffordableMonthly,
    capacity,
    affordabilityAmount,
  } = calc;
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isFailed = !mandatoryPassed;

  return (
    <Box>
      {recalcFlash && (
        <Badge
          size="xs"
          radius="xl"
          color="brand"
          variant="light"
          mb={12}
          leftSection={<IconRefresh size={11} />}
        >
          Recalculated
        </Badge>
      )}

      <SimpleGrid cols={2} spacing={18} mb={4}>
        <Box>
          <Text fz={11.5} c="slate.5">
            Requested loan
          </Text>
          <Text fz={24} fw={700} c="slate.9">
            {zmw(requested)}
          </Text>
        </Box>
        <Box>
          <Text fz={11.5} c="slate.5">
            Maximum eligible amount
          </Text>
          <Text fz={24} fw={700} c={isFailed ? "slate.4" : "slate.9"}>
            {isFailed ? "—" : zmw(eligibleAmount)}
          </Text>
        </Box>
      </SimpleGrid>

      {!isFailed && (
        <ComparisonBar
          requested={requested}
          eligible={eligibleAmount}
          productMax={productMax}
        />
      )}

      {isEligible && (
        <Stack gap={5} mb={20}>
          <Text fz={12.5} fw={600} c="slate.9" mb={2}>
            Why this passes
          </Text>
          <CheckLine ok>Credit score meets minimum requirement</CheckLine>
          <CheckLine ok>Debt-to-income ratio is within the allowed limit</CheckLine>
          <CheckLine ok>Monthly repayment is within the affordability limit</CheckLine>
          <CheckLine ok>Requested amount is within the product and customer limit</CheckLine>
        </Stack>
      )}

      {isFailed && (
        <Stack gap={5} mb={20}>
          <Text fz={12.5} fw={600} c="slate.9" mb={2}>
            Why this fails
          </Text>
          <CheckLine ok={creditPassed}>
            Credit score {creditPassed ? "meets" : "is below"} the minimum
            requirement ({minCreditScore})
          </CheckLine>
          <CheckLine ok={dtiPassed}>
            Debt-to-income ratio {dtiPassed ? "is within" : "exceeds"} the
            allowed limit ({maxDTI}%)
          </CheckLine>
        </Stack>
      )}

      <UnstyledButton
        onClick={() => setRulesOpen(!rulesOpen)}
        w="100%"
        py={8}
      >
        <Group justify="space-between">
          <Text fz={12.5} fw={600} c="slate.9">
            How was eligibility calculated?
          </Text>
          {rulesOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </Group>
      </UnstyledButton>
      {rulesOpen && (
        <Box
          mb={16}
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Table fz={12.5}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th>Rule</Table.Th>
                <Table.Th>Requirement</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Result</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <RuleRow
                rule="Minimum credit score"
                req={`≥ ${minCreditScore}`}
                customer={String(creditScore)}
                pass={creditPassed}
              />
              <RuleRow
                rule="Maximum debt-to-income"
                req={`≤ ${maxDTI}%`}
                customer={`${customerDTI.toFixed(0)}%`}
                pass={dtiPassed}
              />
              <RuleRow
                rule="Maximum loan amount"
                req="Based on affordability"
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                pass={mandatoryPassed}
                calculated
              />
              <RuleRow
                rule="Product maximum"
                req={`≤ ${zmw(productMax)}`}
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                pass={mandatoryPassed}
              />
            </Table.Tbody>
          </Table>
        </Box>
      )}

      <UnstyledButton onClick={() => setCalcOpen(!calcOpen)} w="100%" py={8}>
        <Group justify="space-between">
          <Text fz={12.5} fw={600} c="slate.9">
            View calculation
          </Text>
          {calcOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </Group>
      </UnstyledButton>
      {calcOpen && (
        <Box
          px="md"
          bg="slate.0"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <CalcRow label="Monthly income" value={zmw(income)} />
          <CalcRow label="Existing monthly obligations" value={zmw(obligations)} />
          <CalcRow label="Maximum allowed debt ratio" value={`${maxDTI}%`} />
          <CalcRow
            label="Maximum affordable monthly payment"
            value={zmw(maxAffordableMonthly)}
          />
          <CalcRow label="Available repayment capacity" value={zmw(capacity)} />
          <CalcRow
            label={`Maximum loan amount at ${rate}% over ${tenure} months`}
            value={zmw(affordabilityAmount)}
          />
          <CalcRow label="Product maximum" value={zmw(productMax)} />
          <CalcRow
            label="Final eligible amount"
            value={
              mandatoryPassed
                ? zmw(eligibleAmount)
                : "Not calculated — mandatory rule failed"
            }
            last
            strong
          />
        </Box>
      )}
    </Box>
  );
}

function DecisionCard({
  calc,
  requested,
  onContinue,
  onUseEligible,
  onReview,
  confirm,
  readOnly,
}: {
  calc: EligibilityCalc | null;
  requested: number;
  onContinue: () => void;
  onUseEligible: (confirmed: boolean) => void;
  onReview: (action: "useEligible" | "review") => void;
  confirm: boolean;
  readOnly?: boolean;
}) {
  if (!calc) {
    return (
      <Paper withBorder radius="md" p="md">
        <Group gap={12}>
          <IconHelp size={20} color="var(--mantine-color-slate-4)" />
          <Box>
            <Text fz={13.5} fw={700} c="slate.9">
              Prescreening incomplete
            </Text>
            <Text fz={12} c="slate.5">
              Resolve the missing data above to reach a decision.
            </Text>
          </Box>
        </Group>
      </Paper>
    );
  }

  const { eligibleAmount, mandatoryPassed } = calc;
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isPartial = mandatoryPassed && eligibleAmount < requested;
  const isFailed = !mandatoryPassed;

  const tone = isEligible
    ? { bg: "green.0", border: "green.2", icon: IconCircleCheck, color: "green.7", title: "Prescreening passed" }
    : isPartial
      ? { bg: "orange.0", border: "orange.2", icon: IconAlertTriangle, color: "orange.7", title: "Amount adjustment required" }
      : { bg: "red.0", border: "red.2", icon: IconCircleX, color: "red.6", title: "Prescreening failed" };
  const Icon = tone.icon;

  return (
    <Box
      p="lg"
      bg={tone.bg}
      style={{
        border: `1.5px solid var(--mantine-color-${tone.border.replace(".", "-")})`,
        borderRadius: "var(--mantine-radius-lg)",
      }}
    >
      <Group gap={10} mb={8}>
        <Icon size={20} color={`var(--mantine-color-${tone.color.replace(".", "-")})`} />
        <Text fz="md" fw={700} c="slate.9">
          {tone.title}
        </Text>
      </Group>

      {isEligible && (
        <Text fz={12.5} c="green.8" mb={14}>
          The requested amount of {zmw(requested)} is within the customer's
          eligibility.
        </Text>
      )}
      {isPartial && (
        <>
          <Text fz={12.5} c="orange.8" mb={10}>
            The requested amount exceeds the customer's current eligibility.
          </Text>
          <Group gap={20} mb={14}>
            <MiniStat label="Requested" value={zmw(requested)} />
            <MiniStat label="Eligible" value={zmw(eligibleAmount)} accent />
          </Group>
        </>
      )}
      {isFailed && (
        <Text fz={12.5} c="red.8" mb={14}>
          The customer does not meet one or more mandatory prescreening
          rules. See the rule breakdown above for details.
        </Text>
      )}

           {confirm && !readOnly && (
        <Group
          gap={10}
          p="sm"
          mb={12}
          bg="white"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-sm)",
          }}
        >
          <Text fz={12.5} style={{ flex: 1 }}>
            Set requested amount to {zmw(calc.eligibleAmount)}?
          </Text>
          <Button size="xs" color="dark" radius="sm" onClick={() => onUseEligible(true)}>
            Confirm
          </Button>
          <Button size="xs" variant="default" radius="sm" onClick={() => onUseEligible(false)}>
            Cancel
          </Button>
        </Group>
      )}

      {!readOnly && (
        <Group gap={10}>
          {isEligible && (
            <Button
              color="green"
              radius="md"
              rightSection={<IconArrowRight size={14} />}
              onClick={onContinue}
            >
              Continue to enrichment
            </Button>
          )}
          {isPartial && !confirm && (
            <>
              <Button color="orange" radius="md" onClick={() => onReview("useEligible")}>
                Use {zmw(eligibleAmount)}
              </Button>
              <Button variant="default" radius="md" onClick={() => onReview("review")}>
                Review application
              </Button>
            </>
          )}
        </Group>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Reducer for prescreening inputs
// ---------------------------------------------------------------------------

function reducer(state: PrescreeningState, action: any): PrescreeningState {
  switch (action.type) {
    case "fetchCredit":
      return { ...state, credit: { ...state.credit, status: "loading" } };
    case "resolveCreditFetch":
      return {
        ...state,
        credit: { ...state.credit, status: "idle", value: action.value, source: action.source },
      };
    case "manualCredit":
      return {
        ...state,
        credit: {
          ...state.credit,
          manual: action.on,
          source: action.on ? "manual" : state.credit.source,
        },
      };
    case "setCredit":
      return { ...state, credit: { ...state.credit, value: action.value } };
    case "setCreditReason":
      return { ...state, credit: { ...state.credit, reason: action.value } };

    case "fetchLiabilities":
      return { ...state, liabilities: { ...state.liabilities, status: "loading" } };
    case "resolveLiabFetch":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          status: "idle",
          obligations: action.obligations,
          activeLoans: action.activeLoans,
          outstanding: action.outstanding,
          source: action.source,
        },
      };
    case "manualLiabilities":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          manual: action.on,
          source: action.on ? "manual" : state.liabilities.source,
        },
      };
    case "setObligations":
      return {
        ...state,
        liabilities: { ...state.liabilities, obligations: action.value },
      };
    case "setLiabReason":
      return { ...state, liabilities: { ...state.liabilities, reason: action.value } };

    case "fetchIncome":
      return { ...state, income: { ...state.income, status: "loading" } };
    case "resolveIncomeFetch":
      return {
        ...state,
        income: { ...state.income, status: "idle", value: action.value, source: action.source },
      };
    case "manualIncome":
      return {
        ...state,
        income: {
          ...state.income,
          manual: action.on,
          source: action.on ? "manual" : state.income.source,
        },
      };
    case "setIncome":
      return { ...state, income: { ...state.income, value: action.value } };
    case "setIncomeReason":
      return { ...state, income: { ...state.income, reason: action.value } };

    default:
      return state;
  }
}

function PrescreeningWorkspace({
  values,
  readOnly = false,
  onSubmitReady,
}: {
  values: LoanApplicationValues;
  readOnly?: boolean;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
}) {
  const loanTypeId = DUMMY_PRESCREENING_CONTEXT.loanTypeId;
  const policy = POLICY[loanTypeId];
  const rate = DUMMY_PRESCREENING_CONTEXT.loanRate;
  const tenure = Number(values.tenureMonths) || 0;

  const [state, setState] = useState<PrescreeningState>(() =>
    buildInitialState(DEFAULT_SCENARIO),
  );
  const [requested, setRequested] = useState(values.loanAmount);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [continued, setContinued] = useState(false);

  function dispatch(action: any) {
    setState((s) => reducer(s, action));
  }

  useEffect(() => {
    if (state.credit.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveCreditFetch", value: s.credit, source: s.creditSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.credit.status]);

  useEffect(() => {
    if (state.liabilities.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({
          type: "resolveLiabFetch",
          obligations: s.obligations,
          activeLoans: s.obligations != null ? 2 : null,
          outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null,
          source: s.obligationsSource,
        });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.liabilities.status]);

  useEffect(() => {
    if (state.income.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveIncomeFetch", value: s.income, source: s.incomeSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.income.status]);

  const calc = useMemo(() => {
    if (
      state.credit.status === "loading" ||
      state.liabilities.status === "loading" ||
      state.income.status === "loading"
    )
      return null;
    return calcEligibility({
      income: state.income.value,
      obligations: state.liabilities.obligations,
      maxDTI: policy.maxDTI,
      annualRate: rate,
      tenureMonths: tenure,
      productMax: policy.productMax,
      creditScore: state.credit.value,
      minCreditScore: policy.minCreditScore,
    });
  }, [
    state.credit.value,
    state.credit.status,
    state.liabilities.obligations,
    state.liabilities.status,
    state.income.value,
    state.income.status,
    policy,
    rate,
    tenure,
  ]);

  const prevCalc = useRef(calc);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (calc && prevCalc.current && JSON.stringify(calc) !== JSON.stringify(prevCalc.current)) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1400);
      prevCalc.current = calc;
      return () => clearTimeout(t);
    }
    prevCalc.current = calc;
  }, [calc]);

  function handleUseEligible(confirmed: boolean) {
    if (confirmed && calc) {
      setRequested(Math.round(calc.eligibleAmount));
    }
    setConfirm(false);
  }
  const isEligible = !!calc && calc.mandatoryPassed && calc.eligibleAmount >= requested;

  useEffect(() => {
    onSubmitReady?.(isEligible, () => setContinued(true));
  }, [isEligible]);

  if (continued) {
    return (
      <Box py={70} px={30} ta="center">
        <ThemeIcon radius="xl" size={44} color="green" variant="light" mx="auto" mb={10}>
          <IconCircleCheck size={26} />
        </ThemeIcon>
        <Text fz="md" fw={700} c="slate.9">
          Moving to Stage 3 — Enrichment
        </Text>
        <Text fz={12.5} c="slate.5" mt={6}>
          Requested amount confirmed at {zmw(requested)}.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={30}>
      <SectionLabel>Prescreening data</SectionLabel>
            <SimpleGrid cols={3} spacing={14} mb={26}>
        <CreditScoreCard state={state} dispatch={dispatch} readOnly={readOnly} />
        <LiabilitiesCard state={state} dispatch={dispatch} readOnly={readOnly} />
        <IncomeCard state={state} dispatch={dispatch} readOnly={readOnly} />
      </SimpleGrid>

      <SectionLabel>Eligibility calculation</SectionLabel>
      <EligibilitySection
        calc={calc}
        requested={requested}
        tenure={tenure}
        rate={rate}
        maxDTI={policy.maxDTI}
        minCreditScore={policy.minCreditScore}
        productMax={policy.productMax}
        income={state.income.value}
        obligations={state.liabilities.obligations}
        creditScore={state.credit.value}
        rulesOpen={rulesOpen}
        setRulesOpen={setRulesOpen}
        calcOpen={calcOpen}
        setCalcOpen={setCalcOpen}
        recalcFlash={flash}
      />

      <Box mt={26}>
        <SectionLabel>Prescreening result</SectionLabel>
                <DecisionCard
          calc={calc}
          requested={requested}
          onContinue={() => setContinued(true)}
          onUseEligible={handleUseEligible}
          onReview={(a) => a === "useEligible" && setConfirm(true)}
          confirm={confirm}
          readOnly={readOnly}
        />
      </Box>
    </Box>
  );
}

export function PreScreeningModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  embedded = false,
  readOnly = false,
  onMinimize,
}: PreScreeningModalProps) {
  const [section, setSection] = useState<Section>("prescreening");
  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  // Add this early return for the embedded state
  if (embedded) {
    return (
      <PrescreeningWorkspace
        values={applicationValues}
        readOnly={readOnly}
        onSubmitReady={handleSubmitReady}
      />
    );
  }
  const bodyContent = (
    <Box
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
           {!embedded && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconGauge size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Loan application workflow
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Stage 2 — Prescreening
              </Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={onMinimize}
              aria-label="Minimize"
            >
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={onClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>
      )}

      <ContextHeader
        values={applicationValues}
        applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
      />

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <LeftNav section={section} setSection={setSection} />

        <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {section === "application" ? (
            <Box style={{ height: "100%" }}>
              <Box style={{ height: "calc(100% - 70px)" }}>
                <LoanApplicationModal
                  embedded
                  readOnly
                  initialValues={applicationValues}
                  opened={false}
                  onClose={() => {}}
                  onMinimize={() => {}}
                />
              </Box>
            </Box>
            
          ) : (
                        <PrescreeningWorkspace
              values={applicationValues}
              readOnly={readOnly}
              onSubmitReady={handleSubmitReady}
            />
          )}
        </Box>
      </Box>
            {!embedded && !readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="md"
          bg="white"
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            flexShrink: 0,
          }}
        >
          <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color="brand"
            radius="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
            rightSection={<IconArrowRight size={16} />}
          >
            Submit
          </Button>
        </Group>
      )}
    </Box>
  );

  if (embedded) {
    return (
      <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {bodyContent}
      </Box>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1400}
      padding={0}
      lockScroll
      styles={{
        content: {
          height: "92vh",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      {bodyContent}
    </Modal>
  );
}