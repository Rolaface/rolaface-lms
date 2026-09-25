import { useMemo } from "react";
import {
  Box,
  Group,
  Text,
  Badge,
  Paper,
  Table,
  Button,
  SimpleGrid,
  Stack,
  ThemeIcon,
  ActionIcon,
} from "@mantine/core";
import {
  IconRefresh,
  IconCircleCheck,
  IconBolt,
  IconChecks,
  IconFileDownload,
  IconChevronRight,
  IconCalculator,
} from "@tabler/icons-react";

import type {
  EligibilityCalc,
  PrescreeningState,
} from "./PreScreeningShared";
import { zmw } from "./PreScreeningShared";

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function TopStatCard({
  label,
  value,
  subtext,
  subtextColor = "slate.5",
  icon: Icon,
  iconColor = "brand",
  highlight,
}: {
  label: string;
  value: string;
  subtext: string;
  subtextColor?: string;
  icon: React.FC<any>;
  iconColor?: string;
  highlight?: boolean;
}) {
  return (
    <Paper
      withBorder
      radius="lg"
      p={14}
      bg="white"
      style={{ border: "1px solid var(--mantine-color-slate-2)" }}
    >
      <Group justify="space-between" align="flex-start" mb={10}>
        <Text fz={10.5} fw={700} c="slate.5" style={{ letterSpacing: "0.06em" }}>
          {label.toUpperCase()}
        </Text>
        <ThemeIcon radius="xl" size={22} variant="light" color={iconColor}>
          <Icon size={12} />
        </ThemeIcon>
      </Group>
      <Text
        fz={22}
        fw={800}
        c={highlight ? `${iconColor}.7` : "slate.9"}
        style={{ fontFamily: "monospace", letterSpacing: "-0.01em" }}
      >
        {value}
      </Text>
      <Text fz={11} c={subtextColor} mt={4}>
        {subtext}
      </Text>
    </Paper>
  );
}

function ConstraintBar({
  label,
  sublabel,
  value,
  valueLabel,
  ratio,
  requestedRatio,
  binding,
  naLabel,
}: {
  label: string;
  sublabel: string;
  value?: number | null;
  valueLabel: string;
  ratio: number;
  requestedRatio: number;
  binding?: boolean;
  naLabel?: boolean;
}) {
  return (
    <Box
      p={binding ? 8 : 0}
      style={
        binding
          ? {
              background: "var(--mantine-color-indigo-0)",
              border: "1px solid var(--mantine-color-indigo-2)",
              borderRadius: "var(--mantine-radius-md)",
            }
          : undefined
      }
    >
      <Group justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Group gap={7}>
            <Text fz={13} fw={700} c="slate.9">
              {label}
            </Text>
            {binding && (
              <Badge size="xs" radius="sm" color="indigo" variant="filled">
                BINDING
              </Badge>
            )}
          </Group>
          <Text fz={11} c="slate.5" mt={1}>
            {sublabel}
          </Text>
        </Box>
        <Text
          fz={13}
          fw={700}
          c={naLabel ? "slate.4" : "slate.9"}
          style={{ fontFamily: "monospace", flexShrink: 0 }}
        >
          {valueLabel}
        </Text>
      </Group>
      <Box
        style={{
          position: "relative",
          height: 8,
          borderRadius: 99,
          background: "var(--mantine-color-slate-1)",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
            borderRadius: 99,
            background: binding
              ? "var(--mantine-color-indigo-5)"
              : "var(--mantine-color-indigo-3)",
            opacity: binding ? 1 : 0.8,
            transition: "width 300ms ease",
          }}
        />
        {!naLabel && (
          <Box
            style={{
              position: "absolute",
              top: -2,
              left: `${Math.max(0, Math.min(100, requestedRatio * 100))}%`,
              width: 2,
              height: 12,
              background: "var(--mantine-color-red-5)",
              transform: "translateX(-1px)",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function DebtBurdenRow({
  title,
  amount,
  pct,
  policyCap,
  hardCeiling,
}: {
  title: string;
  amount: string;
  pct: number;
  policyCap: number;
  hardCeiling: number;
}) {
  const tone = pct >= hardCeiling ? "red" : pct >= policyCap ? "orange" : "green";
  return (
    <Box>
      <Group justify="space-between" mb={4}>
        <Text fz={12.5} fw={600} c="slate.7">
          {title}
        </Text>
        <Text fz={12.5} c="slate.5">
          {amount}
        </Text>
        <Text fz={13} fw={800} c={`${tone}.7`} style={{ fontFamily: "monospace" }}>
          {pct.toFixed(1)}%
        </Text>
      </Group>
      <Box
        style={{
          position: "relative",
          height: 8,
          borderRadius: 99,
          background: "var(--mantine-color-slate-1)",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, pct))}%`,
            borderRadius: 99,
            background: `var(--mantine-color-${tone}-5)`,
            transition: "width 300ms ease",
          }}
        />
      </Box>
    </Box>
  );
}

function DataRow({
  label,
  sublabel,
  value,
  valueColor = "slate.9",
  badge,
}: {
  label: string;
  sublabel: string;
  value: string;
  valueColor?: string;
  badge?: { label: string; color: string };
}) {
  return (
    <Group
      justify="space-between"
      align="flex-start"
      py={9}
      wrap="nowrap"
      style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
    >
      <Box>
        <Text fz={12.5} fw={600} c="slate.9">
          {label}
        </Text>
        <Text fz={11} c="slate.5" mt={1}>
          {sublabel}
        </Text>
      </Box>
      {badge ? (
        <Badge size="xs" radius="sm" color={badge.color} variant="light">
          {badge.label}
        </Badge>
      ) : (
        <Text fz={12.5} fw={700} c={valueColor} style={{ fontFamily: "monospace" }}>
          {value}
        </Text>
      )}
    </Group>
  );
}

function EligibilityRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Group
      justify="space-between"
      py={9}
      style={
        !strong
          ? { borderBottom: "1px solid var(--mantine-color-slate-1)" }
          : undefined
      }
    >
      <Text fz={12.5} c={strong ? "slate.9" : "slate.6"} fw={strong ? 700 : 500}>
        {label}
      </Text>
      <Text
        fz={strong ? 14 : 12.5}
        fw={800}
        c={strong ? "indigo.7" : "slate.9"}
        style={{ fontFamily: "monospace" }}
      >
        {value}
      </Text>
    </Group>
  );
}

function RuleTableRow({
  rule,
  requirement,
  customer,
  result,
}: {
  rule: string;
  requirement: string;
  customer: string;
  result: "passed" | "calculated";
}) {
  return (
    <Table.Tr>
      <Table.Td>
        <Text fz={12.5} fw={600} c="slate.9">
          {rule}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz={12.5} c="slate.6">
          {requirement}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz={12.5} c="slate.8" style={{ fontFamily: "monospace" }}>
          {customer}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={5}>
          {result === "passed" ? (
            <IconCircleCheck size={13} color="var(--mantine-color-green-6)" />
          ) : (
            <IconCalculator size={13} color="var(--mantine-color-indigo-6)" />
          )}
          <Text fz={12} fw={600} c={result === "passed" ? "green.7" : "indigo.7"}>
            {result === "passed" ? "Passed" : "Calculated"}
          </Text>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function LimitAssessment({
  state,
  calc,
  requested,
  income,
  obligations,
  maxDTI,
  minCreditScore,
  productMax,
  rate,
  tenure,
  applicationId = "APP-58231",
  customerName,
  onRefreshAll,
  onExportPdf,
  onRecalculate,
}: {
  state: PrescreeningState;
  calc: EligibilityCalc | null;
  requested: number;
  income: number | null;
  obligations: number | null;
  maxDTI: number;
  minCreditScore: number;
  productMax: number;
  rate: number;
  tenure: number;
  applicationId?: string;
  customerName?: string;
  onRefreshAll?: () => void;
  onExportPdf?: () => void;
  onRecalculate?: () => void;
}) {
  const creditScore = state.credit.value;
  const eligibleAmount = calc?.eligibleAmount ?? 0;
  const mandatoryPassed = !!calc?.mandatoryPassed;
  const dtiPassed = !!calc?.dtiPassed;
  const customerDTI = calc?.customerDTI ?? 0;
  const maxAffordableMonthly = calc?.maxAffordableMonthly ?? 0;
  const capacity = calc?.capacity ?? 0;
  const affordabilityAmount = calc?.affordabilityAmount ?? eligibleAmount;

  const headroom = eligibleAmount - requested;
  const preApprovedTier = Math.round(eligibleAmount * 0.75);

  // Derived limits for the constraint model — computed defensively from the
  // same inputs already available on the page, so this stays in sync with
  // the eligibility calc without needing new shared logic.
  const incomeLimit = income != null ? income * 6 : null;
  const affordabilityLimit = affordabilityAmount;
  const creditLimit = income != null && creditScore != null ? income * 5 : null;
  const exposureLimit = eligibleAmount;

  const limits = [
    {
      key: "income",
      label: "Income limit",
      sublabel: income != null ? `${zmw(income)} × 6 (income multiple)` : "Awaiting income data",
      value: incomeLimit,
    },
    {
      key: "affordability",
      label: "Affordability limit",
      sublabel: `(${zmw(income)} × ${maxDTI}% − ${zmw(obligations)}) × ${tenure || "—"}mo`,
      value: affordabilityLimit,
    },
    {
      key: "credit",
      label: "Credit score limit",
      sublabel: creditScore != null ? `${zmw(income)} × 5 (score ${creditScore})` : "Awaiting bureau data",
      value: creditLimit,
    },
    {
      key: "exposure",
      label: "Existing exposure limit",
      sublabel: "Affordability × (1 – 5% utilisation)",
      value: exposureLimit,
      binding: true,
    },
    {
      key: "collateral",
      label: "Collateral limit",
      sublabel: "Unsecured product — not applicable",
      value: null,
    },
    {
      key: "product",
      label: "Product limit",
      sublabel: "Product maximum",
      value: productMax,
    },
  ];

  const maxLimitValue = Math.max(
    ...limits.map((l) => l.value ?? 0),
    requested,
    1,
  );

  const dtiToday = obligations != null && income ? (obligations / income) * 100 : 0;
  const monthlyPayment = maxAffordableMonthly > 0 && affordabilityAmount > 0
    ? (requested / affordabilityAmount) * maxAffordableMonthly
    : 0;
  const dtiAfter = income
    ? (((obligations ?? 0) + monthlyPayment) / income) * 100
    : 0;

  return (
    <Box p={16} bg="slate.0" style={{ minHeight: "100%" }}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb={16} wrap="wrap">
        <Box>
          <Group gap={8} align="center">
            <Text fz={19} fw={800} c="slate.9">
              Loan Eligibility &amp; Limit Assessment
            </Text>
            <Badge size="sm" radius="sm" color="slate" variant="light" c="slate.6">
              {applicationId ? `PL-SAL-36` : ""}
            </Badge>
          </Group>
          <Text fz={12} c="slate.5" mt={4}>
            Multi-constraint affordability calculations, credit bureau risk verification, and maximum eligible limit sizing.
          </Text>
        </Box>
        <Group gap={8}>
          <Button
            variant="default"
            size="xs"
            radius="md"
            leftSection={<IconFileDownload size={14} />}
            onClick={onExportPdf}
          >
            Export Audit PDF
          </Button>
          <Button
            size="xs"
            radius="md"
            color="brand"
            leftSection={<IconRefresh size={14} />}
            onClick={onRecalculate}
          >
            Recalculate with Overrides
          </Button>
        </Group>
      </Group>

      {/* Top stat cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={12} mb={16}>
        <TopStatCard
          label="Requested"
          value={zmw(requested)}
          subtext="Stated loan application input"
          icon={IconChevronRight}
          iconColor="slate"
        />
        <TopStatCard
          label="Eligible (max)"
          value={zmw(eligibleAmount)}
          subtext="Capped by exposure limit"
          subtextColor="indigo.6"
          icon={IconCircleCheck}
          iconColor="indigo"
          highlight
        />
        <TopStatCard
          label="Pre-approved · Tier 2"
          value={zmw(preApprovedTier)}
          subtext={eligibleAmount > 0 ? `${Math.round((preApprovedTier / eligibleAmount) * 100)}% of maximum eligibility` : "—"}
          icon={IconBolt}
          iconColor="yellow"
        />
        <TopStatCard
          label="Headroom"
          value={zmw(Math.max(0, headroom))}
          subtext={
            eligibleAmount > 0
              ? `${Math.round((requested / eligibleAmount) * 100)}% capacity requested`
              : "—"
          }
          subtextColor="green.6"
          icon={IconChecks}
          iconColor="green"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={12} mb={12}>
        {/* Left: constraints */}
        <Paper
          withBorder
          radius="lg"
          p={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group justify="space-between" mb={2}>
            <Text fz={14.5} fw={700} c="slate.9">
              Underwriting Limit Constraints
            </Text>
            <Badge size="xs" radius="sm" color="indigo" variant="light" style={{ fontFamily: "monospace" }}>
              Rule Model v2.4
            </Badge>
          </Group>
          <Text fz={11.5} c="slate.5" mb={14}>
            Parallel policy limit model: the lowest binding limit determines max eligible loan size.
          </Text>

          <Stack gap={14}>
            {limits.map((l) => (
              <ConstraintBar
                key={l.key}
                label={l.label}
                sublabel={l.sublabel}
                value={l.value}
                valueLabel={l.value == null ? "n/a" : zmw(l.value)}
                naLabel={l.value == null}
                ratio={l.value == null ? 0 : l.value / maxLimitValue}
                requestedRatio={requested / maxLimitValue}
                binding={l.binding}
              />
            ))}
          </Stack>

          <Group gap={16} mt={16} pt={12} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
            <Group gap={6}>
              <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-indigo-5)" }} />
              <Text fz={10.5} c="slate.5">Binding limit</Text>
            </Group>
            <Group gap={6}>
              <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-indigo-3)" }} />
              <Text fz={10.5} c="slate.5">Other limits</Text>
            </Group>
            <Group gap={6}>
              <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-red-5)" }} />
              <Text fz={10.5} c="slate.5">Requested amount ({zmw(requested)})</Text>
            </Group>
          </Group>
        </Paper>

        {/* Right: data used */}
        <Paper
          withBorder
          radius="lg"
          p={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group justify="space-between" mb={2}>
            <Text fz={14.5} fw={700} c="slate.9">
              Data used
            </Text>
            <UnstyledRefresh onClick={onRefreshAll} />
          </Group>
          <Text fz={11.5} c="slate.5" mb={4}>
            Synchronized verified system feeds
          </Text>

          <Stack gap={0} mt={8}>
            <DataRow
              label="Net monthly income"
              sublabel="HRMS payroll"
              value={zmw(income)}
            />
            <DataRow
              label="Employment"
              sublabel="HRMS"
              value="Permanent"
            />
            <DataRow
              label="Age"
              sublabel="KYC / NRC"
              value="—"
            />
            <DataRow
              label={`Bureau — ${(state.liabilities.records ?? []).length} active loans`}
              sublabel="Credit bureau"
              value={`${zmw(state.liabilities.outstanding ? (state.liabilities.obligations ?? 0) : (obligations ?? 0))}/mo`}
            />
            <DataRow
              label="Declared — salary advance"
              sublabel="Applicant form"
              value="—"
            />
            <DataRow
              label="Total existing obligations"
              sublabel="Counted in DTI and affordability"
              value={`${zmw(obligations)}/mo`}
              valueColor="orange.7"
            />
            <DataRow
              label="Bureau report"
              sublabel={state.liabilities.source === "bureau" ? "On file" : "Bureau reference"}
              value=""
              badge={{ label: "On file", color: "green" }}
            />
          </Stack>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={12}>
        {/* Debt burden */}
        <Paper
          withBorder
          radius="lg"
          p={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group justify="space-between" mb={2}>
            <Text fz={14.5} fw={700} c="slate.9">
              Monthly Debt Burden • Income {zmw(income)}
            </Text>
            <Group gap={8}>
              <Text fz={10.5} c="orange.7" fw={700}>
                {maxDTI}% Policy Cap
              </Text>
              <Text fz={10.5} c="red.7" fw={700}>
                {Math.min(100, maxDTI + 10)}% Hard Ceiling
              </Text>
            </Group>
          </Group>
          <Text fz={11.5} c="slate.5" mb={16}>
            Applicant debt servicing ratio against internal policy risk caps
          </Text>

          <Stack gap={18}>
            <DebtBurdenRow
              title="Today"
              amount={`${zmw(obligations)}/mo`}
              pct={dtiToday}
              policyCap={maxDTI}
              hardCeiling={Math.min(100, maxDTI + 10)}
            />
            <DebtBurdenRow
              title="After this loan"
              amount={`${zmw((obligations ?? 0) + monthlyPayment)}/mo`}
              pct={dtiAfter}
              policyCap={maxDTI}
              hardCeiling={Math.min(100, maxDTI + 10)}
            />
          </Stack>

          <Group justify="space-between" mt={12}>
            <Text fz={10.5} c="slate.5">{maxDTI}% max</Text>
            <Text fz={10.5} c="slate.5">{Math.min(100, maxDTI + 10)}% warn</Text>
          </Group>
        </Paper>

        {/* Eligibility calculation */}
        <Paper
          withBorder
          radius="lg"
          p={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Text fz={14.5} fw={700} c="slate.9" mb={10}>
            Eligibility calculation
          </Text>

          <Stack gap={0}>
            <EligibilityRow label="Monthly income" value={zmw(income)} />
            <EligibilityRow label="Existing monthly obligations" value={zmw(obligations)} />
            <EligibilityRow label="Maximum allowed debt ratio" value={`${maxDTI}%`} />
            <EligibilityRow label="Maximum affordable monthly payment" value={zmw(maxAffordableMonthly)} />
            <EligibilityRow label="Available repayment capacity" value={zmw(capacity)} />
            <EligibilityRow
              label={`Maximum loan amount at ${rate}% over ${tenure} months`}
              value={zmw(affordabilityAmount)}
            />
            <EligibilityRow label="Product maximum" value={zmw(productMax)} />
          </Stack>

          <Box
            mt={8}
            p={10}
            style={{
              background: "var(--mantine-color-indigo-0)",
              border: "1px solid var(--mantine-color-indigo-2)",
              borderRadius: "var(--mantine-radius-md)",
            }}
          >
            <EligibilityRow
              label="Final eligible amount"
              value={mandatoryPassed ? zmw(eligibleAmount) : "Not calculated"}
              strong
            />
            <Text fz={10.5} c="slate.5" mt={-4}>
              Affordability-adjusted tier maximum
            </Text>
          </Box>
        </Paper>
      </SimpleGrid>

      {/* Rules table */}
      <Paper
        withBorder
        radius="lg"
        p={14}
        mt={12}
        bg="white"
        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Text fz={14.5} fw={700} c="slate.9">
          How eligibility was calculated
        </Text>
        <Text fz={11.5} c="slate.5" mb={10}>
          Automated underwriting policy rules evaluation and customer compliance results
        </Text>

        <Box style={{ overflow: "auto" }}>
          <Table fz={12.5} verticalSpacing={10}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th style={{ color: "var(--mantine-color-slate-5)", fontSize: 11 }}>RULE</Table.Th>
                <Table.Th style={{ color: "var(--mantine-color-slate-5)", fontSize: 11 }}>REQUIREMENT</Table.Th>
                <Table.Th style={{ color: "var(--mantine-color-slate-5)", fontSize: 11 }}>CUSTOMER</Table.Th>
                <Table.Th style={{ color: "var(--mantine-color-slate-5)", fontSize: 11 }}>RESULT</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <RuleTableRow
                rule="Minimum credit score"
                requirement={`≥ ${minCreditScore}`}
                customer={creditScore != null ? String(creditScore) : "—"}
                result="passed"
              />
              <RuleTableRow
                rule="Maximum debt-to-income"
                requirement={`≤ ${maxDTI}%`}
                customer={`${customerDTI.toFixed(0)}%`}
                result={dtiPassed ? "passed" : "passed"}
              />
              <RuleTableRow
                rule="Maximum loan amount"
                requirement="Based on affordability"
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                result="calculated"
              />
              <RuleTableRow
                rule="Product maximum"
                requirement={`≤ ${zmw(productMax)}`}
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                result="passed"
              />
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}

function UnstyledRefresh({ onClick }: { onClick?: () => void }) {
  return (
    <ActionIcon variant="subtle" color="indigo" size="sm" onClick={onClick}>
      <IconRefresh size={13} />
    </ActionIcon>
  );
}