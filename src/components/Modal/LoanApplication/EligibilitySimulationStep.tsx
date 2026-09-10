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
  ThemeIcon,
  UnstyledButton,
  Badge,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconWallet,
  IconClock,
  IconPercentage,
  IconShieldCheck,
  IconUsers,
  IconCheck,
  IconChevronUp,
  IconChevronDown,
  IconAlertCircle,
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

const FREQUENCIES: Array<"Monthly" | "Bi-weekly"> = ["Monthly", "Bi-weekly"];

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

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <Group gap={6} mt={6} wrap="nowrap" align="flex-start">
      <IconAlertCircle
        size={13}
        color="var(--mantine-color-red-6)"
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <Text fz={12.5} c="red.6">
        {children}
      </Text>
    </Group>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<any>;
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Group gap={5} fz={11.5} c="slate.5" mb={3}>
        <Icon size={12} />
        <Text fz={11.5} c="slate.5">
          {label}
        </Text>
      </Group>
      <Text fz="sm" fw={600} c="slate.9">
        {value}
      </Text>
    </Box>
  );
}

function RequirementTag({
  icon: Icon,
  label,
  ok,
}: {
  icon: React.FC<any>;
  label: string;
  ok: boolean;
}) {
  return (
    <Badge
      size="md"
      radius="xl"
      variant="light"
      color={ok ? "green" : "orange"}
      leftSection={<Icon size={12} />}
      style={{ textTransform: "none", fontWeight: 500 }}
    >
      {label}
    </Badge>
  );
}

function DocGroup({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: string;
}) {
  if (!items.length) return null;
  return (
    <Box>
      <Text fz={11} fw={600} c={color} mb={4}>
        {label}
      </Text>
      <Box component="ul" pl={18} m={0}>
        {items.map((it) => (
          <Text component="li" fz={12} c="slate.7" key={it} mb={2}>
            {it}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function SimRow({ label, value }: { label: string; value: string }) {
  return (
    <Group
      justify="space-between"
      py={9}
      style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz={12.5} c="slate.5">
        {label}
      </Text>
      <Text fz={12.5} fw={600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}

export function EligibilitySimulationStep({ form,  readOnly = false,}: StepProps) {
  const [reqExpanded, setReqExpanded] = useState(false);
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

  const simulation = useMemo(() => {
    if (amountError || tenureError || !amount || !tenure) return null;
    const rate = (rules.rate.min + rules.rate.max) / 2;
    return { ...computeSimulation(amount, tenure, rate, frequency), rate };
  }, [amount, tenure, frequency, rules, amountError, tenureError]);

  return (
    <Stack gap={22}>
      <Box>
        <SectionLabel>Eligibility</SectionLabel>
        <Box
          p="md"
          style={{
            background: "var(--mantine-color-slate-0)",
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-lg)",
          }}
        >
          <SimpleGrid cols={3} spacing="md" mb={12}>
            <MiniStat
              icon={IconWallet}
              label="Loan amount"
              value={`${zmw(rules.amount.min)} – ${zmw(rules.amount.max)}`}
            />
            <MiniStat
              icon={IconClock}
              label="Tenure"
              value={`${rules.tenure.min} – ${rules.tenure.max} months`}
            />
            <MiniStat
              icon={IconPercentage}
              label="Interest rate (p.a.)"
              value={`${rules.rate.min}% – ${rules.rate.max}% · ${rules.rate.kind}`}
            />
          </SimpleGrid>

          <Group gap={8} mb={reqExpanded ? 12 : 0}>
            <RequirementTag
              icon={IconShieldCheck}
              label={rules.requirements.collateral ? "Collateral required" : "No collateral required"}
              ok={!rules.requirements.collateral}
            />
            <RequirementTag
              icon={IconUsers}
              label={rules.requirements.guarantor ? "Guarantor required" : "No guarantor required"}
              ok={!rules.requirements.guarantor}
            />
            <RequirementTag icon={IconCheck} label={rules.requirements.income} ok />
          </Group>

          <UnstyledButton
            onClick={() => setReqExpanded((v) => !v)}
            fz={12}
            fw={500}
            c="brand.6"
          >
            <Group gap={4}>
              {reqExpanded ? "Hide details" : "View documents and full requirements"}
              {reqExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
            </Group>
          </UnstyledButton>

          {reqExpanded && (
            <Stack gap={10} mt={12}>
              <DocGroup label="Required" items={rules.docs.required} color="slate.9" />
              <DocGroup label="Optional" items={rules.docs.optional} color="slate.5" />
              <DocGroup label="Conditional" items={rules.docs.conditional} color="orange.7" />
              <Text fz={12} c="slate.5" mt={2}>
                Employment: {rules.requirements.employment}
              </Text>
            </Stack>
          )}
        </Box>
      </Box>

      <Box>
        <SectionLabel>Configure your loan</SectionLabel>
        <SimpleGrid cols={2} spacing="lg">
          <Box>
            <Group justify="space-between" fz={12.5} fw={500} c="slate.7" mb={6}>
              <Text fz={12.5} fw={500} c="slate.7">
                Requested amount
              </Text>
              <Text fz={12.5} c="slate.4">
                {zmw(rules.amount.min)} – {zmw(rules.amount.max)}
              </Text>
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
              mb={10}
              disabled={readOnly}
            />
            <NumberInput
              radius="md"
              value={amount ?? undefined}
              onChange={(v) =>
                form.setFieldValue("loanAmount", typeof v === "number" ? v : 0)
              }
              thousandSeparator=","
              hideControls
              error={amountError}
              readOnly={readOnly}
            />
          </Box>
          <Box>
            <Group justify="space-between" fz={12.5} fw={500} c="slate.7" mb={6}>
              <Text fz={12.5} fw={500} c="slate.7">
                Tenure (months)
              </Text>
              <Text fz={12.5} c="slate.4">
                {rules.tenure.min} – {rules.tenure.max}
              </Text>
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
              mb={10}
              disabled={readOnly}
            />
            <NumberInput
              radius="md"
              value={tenure ?? undefined}
              onChange={(v) =>
                form.setFieldValue(
                  "tenureMonths",
                  typeof v === "number" ? v : "",
                )
              }
              hideControls
              error={tenureError}
              readOnly={readOnly}
            />
          </Box>
          <Box style={{ gridColumn: "1 / -1" }}>
            <Text fz={12.5} fw={500} c="slate.7" mb={6}>
              Repayment frequency
            </Text>
            <Group gap={8}>
              {FREQUENCIES.map((f) => (
                               <UnstyledButton
                  key={f}
                  onClick={
                    readOnly
                      ? undefined
                      : () => form.setFieldValue("repaymentFrequency", f)
                  }
                  px={14}
                  py={7}
                  style={{
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 500,
                    border: `1.5px solid ${
                      frequency === f
                        ? "var(--mantine-color-brand-6)"
                        : "var(--mantine-color-slate-2)"
                    }`,
                    background:
                      frequency === f ? "var(--mantine-color-brand-6)" : "white",
                    color: frequency === f ? "white" : "var(--mantine-color-slate-7)",
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  {f}
                </UnstyledButton>
              ))}
            </Group>
          </Box>
        </SimpleGrid>
      </Box>

      {simulation && (
        <Box>
          <SectionLabel>Loan simulation</SectionLabel>
          <Box
            p="md"
            style={{
              border: "1.5px solid var(--mantine-color-brand-2)",
              borderRadius: "var(--mantine-radius-lg)",
              background: "var(--mantine-color-brand-0)",
            }}
          >
            <Group justify="flex-end" mb={10}>
              <Badge size="xs" color="brand" variant="light" radius="xl">
                Indicative — not final terms
              </Badge>
            </Group>

            <SimpleGrid cols={2} spacing="md" mb={14}>
              <Box p="md" bg="white" style={{ borderRadius: "var(--mantine-radius-md)" }}>
                <Text fz={11.5} c="slate.5">
                  Estimated {frequency.toLowerCase()} installment
                </Text>
                <Text fz={20} fw={700} c="slate.9" mt={2}>
                  {zmw(simulation.installment)}
                </Text>
              </Box>
              <Box p="md" bg="white" style={{ borderRadius: "var(--mantine-radius-md)" }}>
                <Text fz={11.5} c="slate.5">
                  Total repayment
                </Text>
                <Text fz={20} fw={700} c="slate.9" mt={2}>
                  {zmw(simulation.totalRepayment)}
                </Text>
              </Box>
            </SimpleGrid>

            <Box
              px="md"
              bg="white"
              mb={14}
              style={{ borderRadius: "var(--mantine-radius-md)" }}
            >
              <SimRow label="Loan amount" value={zmw(amount)} />
              <SimRow label="Interest rate" value={`${simulation.rate.toFixed(1)}% p.a.`} />
              <SimRow label="Tenure" value={`${tenure} months`} />
              <SimRow label="Repayment frequency" value={frequency} />
              <SimRow label="Estimated installment" value={zmw(simulation.installment)} />
              <SimRow label="Total interest" value={zmw(simulation.totalInterest)} />
              <SimRow label="Total repayment" value={zmw(simulation.totalRepayment)} />
              <SimRow
                label="Fees and charges"
                value={simulation.fee > 0 ? `${zmw(simulation.fee)} facility fee` : "None applicable"}
              />
              <SimRow label="First repayment date" value={fmtDate(simulation.first)} />
              <Group justify="space-between" py={9}>
                <Text fz={12.5} c="slate.5">
                  Final repayment date
                </Text>
                <Text fz={12.5} fw={600} c="slate.9">
                  {fmtDate(simulation.final)}
                </Text>
              </Group>
            </Box>

            <UnstyledButton
              onClick={() => setScheduleExpanded((v) => !v)}
              fz={12}
              fw={500}
              c="brand.6"
            >
              <Group gap={4}>
                {scheduleExpanded ? "Hide repayment schedule" : "Preview repayment schedule"}
                {scheduleExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
              </Group>
            </UnstyledButton>

            {scheduleExpanded && (
              <Box
                mt={10}
                bg="white"
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
          </Box>
        </Box>
      )}

      {!simulation && (amountError || tenureError) && (
        <FieldError>{amountError || tenureError}</FieldError>
      )}
    </Stack>
  );
}