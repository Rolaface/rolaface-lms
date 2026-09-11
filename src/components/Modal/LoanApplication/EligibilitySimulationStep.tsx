import { useMemo, useState } from "react";
import {
  Box,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Slider,
  NumberInput,
  Table,
  UnstyledButton,
  Badge,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconCheck,
  IconCalendar,
  IconCircleCheck,
  IconInfoCircle,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

interface LoanProductRules {
  amount: { min: number; max: number };
  tenure: { min: number; max: number };
  rate: { min: number; max: number; kind: "Fixed" | "Variable" };
  docs: { required: string[]; optional: string[]; conditional: string[] };
  requirements: {
    collateral: boolean;
    guarantor: boolean;
    employment: string;
    income: string;
  };
}

const LOAN_RULES: Record<LoanType, LoanProductRules> = {
  Personal: {
    amount: { min: 500, max: 8000 },
    tenure: { min: 3, max: 36 },
    rate: { min: 18, max: 32, kind: "Fixed" },
    docs: {
      required: ["Latest 3 payslips", "National ID copy", "Passport photo"],
      optional: ["Proof of residence"],
      conditional: ["Employer confirmation letter — if self-employed"],
    },
    requirements: {
      collateral: false,
      guarantor: false,
      employment: "Formal employment, 6+ months",
      income: "ZMW 3,000 / month minimum",
    },
  },
  Business: {
    amount: { min: 5000, max: 50000 },
    tenure: { min: 6, max: 60 },
    rate: { min: 21, max: 30, kind: "Fixed" },
    docs: {
      required: [
        "Business registration certificate",
        "6 months bank statements",
        "Director's ID",
      ],
      optional: ["Audited financials"],
      conditional: ["Lease agreement — if renting business premises"],
    },
    requirements: {
      collateral: true,
      guarantor: true,
      employment: "Business trading 12+ months",
      income: "ZMW 15,000 / month minimum turnover",
    },
  },
};

const FREQUENCIES: Array<{ value: "Monthly" | "Bi-weekly"; label: string }> = [
  { value: "Monthly", label: "Monthly (Recommended)" },
  { value: "Bi-weekly", label: "Bi-Weekly (Fortnightly)" },
];

const AMOUNT_PRESETS = [1000, 2500, 4000, 8000];
const TENURE_PRESETS = [3, 6, 12, 24];

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function computeSimulation(
  amount: number,
  tenure: number,
  rate: number,
  frequency: "Monthly" | "Bi-weekly",
  feePct = 0.02,
) {
  const nPeriods =
    frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  let installment: number;
  if (periodicRate > 0) {
    installment =
      (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) /
      (Math.pow(1 + periodicRate, nPeriods) - 1);
  } else {
    installment = amount / nPeriods;
  }
  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;
  const fee = amount * feePct;

  const first = new Date();
  first.setMonth(first.getMonth() + 1);
  const final = new Date(first);
  if (frequency === "Bi-weekly") final.setDate(final.getDate() + 14 * (nPeriods - 1));
  else final.setMonth(final.getMonth() + (nPeriods - 1));

  const schedule: Array<{
    n: number;
    due: Date;
    principal: number;
    interest: number;
    balance: number;
  }> = [];
  let balance = amount;
  for (let i = 1; i <= Math.min(nPeriods, 6); i++) {
    const interestPortion = balance * periodicRate;
    const principalPortion = installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    const due = new Date(first);
    if (frequency === "Bi-weekly") due.setDate(due.getDate() + 14 * (i - 1));
    else due.setMonth(due.getMonth() + (i - 1));
    schedule.push({ n: i, due, principal: principalPortion, interest: interestPortion, balance });
  }
  return {
    installment,
    totalRepayment: totalRepayment + fee,
    totalInterest,
    fee,
    nPeriods,
    first,
    final,
    schedule,
  };
}

function HeaderPill({
  color,
  bg,
  border,
  children,
}: {
  color: string;
  bg: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      px={10}
      py={5}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--mantine-radius-md)",
        whiteSpace: "nowrap",
      }}
    >
      <Text fz={12} fw={600} c={color} lh={1.3}>
        {children}
      </Text>
    </Box>
  );
}

function PresetChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <UnstyledButton
      onClick={disabled ? undefined : onClick}
      px={8}
      py={3}
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        fontSize: 11.5,
        fontWeight: 600,
        border: `1px solid ${
          active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"
        }`,
        background: active ? "var(--mantine-color-brand-6)" : "white",
        color: active ? "white" : "var(--mantine-color-slate-7)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function OutcomeStat({
  icon: Icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.FC<any>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <Box
      px="sm"
      py={8}
      style={{
        background: "white",
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-md)",
      }}
    >
      {/* Line 1: label + icon */}
      <Group justify="space-between" align="center" mb={2} wrap="nowrap">
        <Text fz={10.5} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Box
          w={20}
          h={20}
          style={{
            borderRadius: "50%",
            border: "1px solid var(--mantine-color-slate-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={11} color="var(--mantine-color-slate-5)" />
        </Box>
      </Group>
      {/* Line 2: value + sub note, same line */}
      <Group gap={6} align="baseline" wrap="nowrap">
        <Text fz={19} fw={700} c={valueColor ?? "slate.9"} lh={1.2} style={{ whiteSpace: "nowrap" }}>
          {value}
        </Text>
        {sub && (
          <Text fz={10.5} c="slate.4" lh={1.2} truncate>
            {sub}
          </Text>
        )}
      </Group>
    </Box>
  );
}

function MicroStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box>
      <Text fz={9.5} fw={600} c="slate.4" tt="uppercase" style={{ letterSpacing: 0.2 }} mb={2}>
        {label}
      </Text>
      <Text fz={12} fw={700} c={valueColor ?? "slate.9"}>
        {value}
      </Text>
    </Box>
  );
}

export function EligibilitySimulationStep({ form, readOnly = false }: StepProps) {
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  const applicantType = form.values.applicantType ?? "Personal";
  const rules = LOAN_RULES[applicantType];

  const amount = form.values.loanAmount;
  const tenure =
    typeof form.values.tenureMonths === "number" ? form.values.tenureMonths : 0;
  const frequency = form.values.repaymentFrequency || "Monthly";

  const amountError =
    amount != null && (amount < rules.amount.min || amount > rules.amount.max)
      ? `Enter an amount between ${zmw(rules.amount.min)} and ${zmw(rules.amount.max)}.`
      : null;
  const tenureError =
    tenure != null && (tenure < rules.tenure.min || tenure > rules.tenure.max)
      ? `Enter a tenure between ${rules.tenure.min} and ${rules.tenure.max} months.`
      : null;

  const rate = (rules.rate.min + rules.rate.max) / 2;

  const simulation = useMemo(() => {
    if (amountError || tenureError || !amount || !tenure) return null;
    return { ...computeSimulation(amount, tenure, rate, frequency), rate };
  }, [amount, tenure, frequency, rules, amountError, tenureError, rate]);

  const tenurePresetOptions = TENURE_PRESETS.filter(
    (t) => t >= rules.tenure.min && t <= rules.tenure.max,
  );

  return (
    <Stack gap={10}>
      {/* Header card */}
      <Box
        p="sm"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} align="center" mb={2}>
              <Text fz={15} fw={700} c="slate.9">
                Eligibility &amp; Loan Simulation
              </Text>
              <Badge size="sm" radius="xl" variant="light" color="brand" style={{ textTransform: "none" }}>
                Step 2 of 7
              </Badge>
            </Group>
            <Text fz={12} c="slate.5">
              Adjust requested amount and tenure to simulate instant repayment breakdown.
            </Text>
          </Box>
          <Group gap={6} wrap="nowrap">
            <HeaderPill color="green.7" bg="var(--mantine-color-green-0)" border="var(--mantine-color-green-2)">
              <Group gap={5} wrap="nowrap">
                <IconCheck size={13} />
                <span>No collateral required</span>
              </Group>
            </HeaderPill>
            <HeaderPill color="green.7" bg="var(--mantine-color-green-0)" border="var(--mantine-color-green-2)">
              <Group gap={5} wrap="nowrap">
                <IconCheck size={13} />
                <span>No guarantor required</span>
              </Group>
            </HeaderPill>
            <HeaderPill color="slate.7" bg="var(--mantine-color-slate-0)" border="var(--mantine-color-slate-2)">
              Min. Income: {rules.requirements.income}
            </HeaderPill>
          </Group>
        </Group>
      </Box>

      {/* Configure loan parameters card */}
      <Box
        p="sm"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" align="center" mb={10} wrap="wrap">
          <Text fz={12} fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: 0.3 }}>
            Configure Loan Parameters
          </Text>
          <Group gap={6} fz={12}>
            <Text fz={12} c="slate.5">
              Allowable Range:{" "}
              <Text component="span" fw={600} c="slate.7">
                {zmw(rules.amount.min)} – {zmw(rules.amount.max)}
              </Text>
            </Text>
            <Text fz={12} c="slate.3">
              ·
            </Text>
            <Text fz={12} c="slate.5">
              Tenure Range:{" "}
              <Text component="span" fw={600} c="slate.7">
                {rules.tenure.min} – {rules.tenure.max} Mos
              </Text>
            </Text>
            <Text fz={12} c="slate.3">
              ·
            </Text>
            <Text fz={12} c="slate.5">
              {rules.rate.kind === "Fixed" ? "Fixed" : "Variable"} APR:{" "}
              <Text component="span" fw={700} c="brand.6">
                {rate.toFixed(1)}% p.a.
              </Text>
            </Text>
          </Group>
        </Group>

        <SimpleGrid cols={2} spacing="lg">
          {/* Amount */}
          <Box>
            <Group justify="space-between" align="center" mb={6}>
              <Text fz={12.5} fw={600} c="slate.8">
                Requested Amount
              </Text>
              <NumberInput
                radius="sm"
                size="xs"
                w={130}
                value={amount ?? undefined}
                onChange={(v) =>
                  form.setFieldValue("loanAmount", typeof v === "number" ? v : 0)
                }
                thousandSeparator=","
                prefix="ZMW "
                hideControls
                error={amountError ? true : undefined}
                readOnly={readOnly}
                styles={{ input: { fontWeight: 600, textAlign: "right" } }}
              />
            </Group>
            <Slider
              min={rules.amount.min}
              max={rules.amount.max}
              step={100}
              color="brand"
              value={Math.min(
                Math.max(amount ?? rules.amount.min, rules.amount.min),
                rules.amount.max,
              )}
              onChange={(v) => form.setFieldValue("loanAmount", v)}
              label={(v) => zmw(v)}
              mb={8}
              disabled={readOnly}
            />
            <Group gap={6} align="center">
              <Text fz={10.5} c="slate.4">
                Quick Presets:
              </Text>
              {AMOUNT_PRESETS.map((p) => (
                <PresetChip
                  key={p}
                  label={p.toLocaleString()}
                  active={amount === p}
                  onClick={() => form.setFieldValue("loanAmount", p)}
                  disabled={readOnly}
                />
              ))}
            </Group>
            {amountError && (
              <Text fz={11} c="red.6" mt={4}>
                {amountError}
              </Text>
            )}
          </Box>

          {/* Tenure */}
          <Box>
            <Group justify="space-between" align="center" mb={6}>
              <Text fz={12.5} fw={600} c="slate.8">
                Tenure Duration
              </Text>
              <NumberInput
                radius="sm"
                size="xs"
                w={130}
                value={tenure ?? undefined}
                onChange={(v) =>
                  form.setFieldValue("tenureMonths", typeof v === "number" ? v : "")
                }
                suffix=" Months"
                hideControls
                error={tenureError ? true : undefined}
                readOnly={readOnly}
                styles={{ input: { fontWeight: 600, textAlign: "right" } }}
              />
            </Group>
            <Slider
              min={rules.tenure.min}
              max={rules.tenure.max}
              step={1}
              color="brand"
              value={Math.min(
                Math.max(tenure ?? rules.tenure.min, rules.tenure.min),
                rules.tenure.max,
              )}
              onChange={(v) => form.setFieldValue("tenureMonths", v)}
              label={(v) => `${v} mo`}
              mb={8}
              disabled={readOnly}
            />
            <Group gap={6} align="center">
              <Text fz={10.5} c="slate.4">
                Common Terms:
              </Text>
              {tenurePresetOptions.map((t) => (
                <PresetChip
                  key={t}
                  label={`${t} mos`}
                  active={tenure === t}
                  onClick={() => form.setFieldValue("tenureMonths", t)}
                  disabled={readOnly}
                />
              ))}
            </Group>
            {tenureError && (
              <Text fz={11} c="red.6" mt={4}>
                {tenureError}
              </Text>
            )}
          </Box>
        </SimpleGrid>

        {/* Repayment frequency bar */}
        <Group
          justify="space-between"
          align="center"
          mt={10}
          p={8}
          style={{
            background: "var(--mantine-color-slate-0)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Box>
            <Text fz={12} fw={600} c="slate.8">
              Repayment Frequency:
            </Text>
          </Box>
          <Group gap={6} fz={12} align="center" style={{ flex: 1 }}>
            <Text fz={11} c="slate.4">
              Affects interest amortization intervals
            </Text>
          </Group>
          <Group
            gap={2}
            p={2}
            style={{
              background: "white",
              border: "1px solid var(--mantine-color-slate-2)",
              borderRadius: "var(--mantine-radius-xl)",
            }}
          >
            {FREQUENCIES.map((f) => (
              <UnstyledButton
                key={f.value}
                onClick={
                  readOnly ? undefined : () => form.setFieldValue("repaymentFrequency", f.value)
                }
                px={12}
                py={5}
                style={{
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    frequency === f.value ? "var(--mantine-color-brand-6)" : "transparent",
                  color: frequency === f.value ? "white" : "var(--mantine-color-slate-6)",
                  cursor: readOnly ? "default" : "pointer",
                  transition: "background 120ms ease",
                }}
              >
                {f.label}
              </UnstyledButton>
            ))}
          </Group>
        </Group>
      </Box>

      {/* Instant simulation outcome */}
      <Box
        p="sm"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" align="center" mb={8} wrap="wrap">
          <Group gap={8} align="center">
            <Text fz={12} fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: 0.3 }}>
              Instant Simulation Outcome
            </Text>
            <Badge size="sm" radius="xl" variant="light" color="green" style={{ textTransform: "none" }}>
              Pre-Approved Estimate
            </Badge>
          </Group>
          <Text fz={11} c="slate.4">
            Indicative estimate • No hidden fees
          </Text>
        </Group>

        {simulation ? (
          <>
            <SimpleGrid cols={2} spacing="sm" mb={8}>
              <OutcomeStat
                icon={IconCalendar}
                label="Estimated Monthly EMI"
                value={
                  <>
                    {zmw(simulation.installment)}{" "}
                    <Text component="span" fz={11.5} fw={500} c="slate.4">
                      /mo
                    </Text>
                  </>
                }
                sub="Principal + interest incl."
                valueColor="brand.6"
              />
              <OutcomeStat
                icon={IconCircleCheck}
                label="Total Repayment Obligation"
                value={zmw(simulation.totalRepayment)}
                sub={`Interest: ${zmw(simulation.totalInterest)} (${rules.rate.kind})`}
              />
            </SimpleGrid>

            <SimpleGrid
              cols={6}
              spacing={0}
              mb={8}
              style={{
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
            >
              {[
                { label: "Principal", value: zmw(amount) },
                { label: "Interest Rate", value: `${simulation.rate.toFixed(1)}% p.a.`, color: "brand.6" },
                { label: "Tenure", value: `${tenure} Months` },
                {
                  label: "Admin Fee",
                  value: simulation.fee > 0 ? zmw(simulation.fee) : "Free",
                  color: simulation.fee > 0 ? undefined : "green.6",
                },
                { label: "Disbursal", value: zmw(amount) },
                { label: "Method", value: "Auto-Debit" },
              ].map((cell, i) => (
                <Box
                  key={cell.label}
                  px={8}
                  py={6}
                  style={{
                    borderLeft: i === 0 ? undefined : "1px solid var(--mantine-color-slate-2)",
                  }}
                >
                  <MicroStat label={cell.label} value={cell.value} valueColor={cell.color} />
                </Box>
              ))}
            </SimpleGrid>

            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap={5} align="center">
                <IconInfoCircle size={12} color="var(--mantine-color-slate-4)" />
                <Text fz={10.5} c="slate.4">
                  Calculated with reducing balance formula. Final sanction subject to Step 5 (Income verification).
                </Text>
              </Group>
              <UnstyledButton onClick={() => setScheduleExpanded((v) => !v)} fz={10.5} fw={600} c="brand.6">
                <Group gap={4}>
                  {scheduleExpanded ? "Hide full amortization schedule" : "View full amortization schedule"}
                  {scheduleExpanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
                </Group>
              </UnstyledButton>
            </Group>

            {scheduleExpanded && (
              <Box
                mt={12}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-slate-2)",
                  overflow: "hidden",
                }}
              >
                <Table fz={12}>
                  <Table.Thead bg="slate.0">
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Due date</Table.Th>
                      <Table.Th>Principal</Table.Th>
                      <Table.Th>Interest</Table.Th>
                      <Table.Th>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {simulation.schedule.map((row) => (
                      <Table.Tr key={row.n}>
                        <Table.Td>{row.n}</Table.Td>
                        <Table.Td>{fmtDate(row.due)}</Table.Td>
                        <Table.Td>{zmw(row.principal)}</Table.Td>
                        <Table.Td>{zmw(row.interest)}</Table.Td>
                        <Table.Td>{zmw(row.balance)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {simulation.nPeriods > 6 && (
                  <Text fz={11.5} c="slate.4" px="md" py={8}>
                    Showing first 6 of {simulation.nPeriods} payments.
                  </Text>
                )}
              </Box>
            )}
          </>
        ) : (
          (amountError || tenureError) && (
            <Text fz={12.5} c="red.6">
              {amountError || tenureError}
            </Text>
          )
        )}
      </Box>
    </Stack>
  );
}