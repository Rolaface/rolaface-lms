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
  IconCalendar,
  IconCircleCheck,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { SIMULATION_RANGE, computeSimulation, type LoanApplicationValues } from "./form";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

const FREQUENCIES: Array<{ value: "Monthly" | "Bi-weekly"; label: string }> = [
  { value: "Monthly", label: "Monthly (Recommended)" },
  { value: "Bi-weekly", label: "Bi-Weekly (Fortnightly)" },
];

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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

  const rules = SIMULATION_RANGE[form.values.applicant_type];
  const amount = Number(form.values.requested_amount) || 0;
  const tenure = Number(form.values.tenure_months) || 0;
  const frequency = form.values.repayment_frequency || "Monthly";
  const amountError = form.errors.requested_amount;
  const tenureError = form.errors.tenure_months;
  const rate = rules.rate;

  const simulation = useMemo(() => {
    if (!amount || !tenure || !Number.isInteger(tenure)) return null;
    return { ...computeSimulation(amount, tenure, rate, frequency), rate };
  }, [amount, tenure, frequency, rate]);

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
            <Text fz={15} fw={700} c="slate.9" mb={2}>
              Eligibility &amp; Loan Simulation
            </Text>
            <Text fz={12} c="slate.5">
              Adjust requested amount and tenure to simulate instant repayment breakdown.
            </Text>
          </Box>
        </Group>
      </Box>

    {/* MAIN TWO-COLUMN LAYOUT */}
      <Box
        p="lg"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* LEFT PANEL: Configure loan parameters */}
          <Box style={{ display: "flex", flexDirection: "column" }}>
            <Box mb={16}>
              <Text fz={12} fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: 0.3 }} mb={4}>
                Configure Loan Parameters
              </Text>
              <Text fz={12} c="slate.5">
                Indicative APR:{" "}
                <Text component="span" fz={10} fw={700} c="brand.6">
                  {rate.toFixed(1)}% p.a.
                </Text>
              </Text>
            </Box>

            <SimpleGrid cols={1} spacing="lg" style={{ flex: 1 }}>
              {/* Amount */}
              <Box
                p={12}
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <Group justify="space-between" align="center" mb={8}>
                  <Text fz={12.5} fw={600} c="slate.8">
                    Requested Amount
                  </Text>
                  <NumberInput
                    radius="sm"
                    size="xs"
                    w={130}
                    value={form.values.requested_amount}
                    min={0}
                    allowNegative={false}
                    onChange={(v) =>
                      form.setFieldValue("requested_amount", typeof v === "number" ? v : "")
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
                  step={rules.amount.step}
                  color="brand"
                  value={Math.min(Math.max(amount, rules.amount.min), rules.amount.max)}
                  onChange={(v) => form.setFieldValue("requested_amount", v)}
                  label={(v) => zmw(v)}
                  mb={12}
                  disabled={readOnly}
                />
                {amountError && (
                  <Text fz={11} c="red.6" mt={4}>
                    {amountError}
                  </Text>
                )}
              </Box>

              {/* Tenure */}
              <Box
                p={12}
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <Group justify="space-between" align="center" mb={8}>
                  <Text fz={12.5} fw={600} c="slate.8">
                    Tenure Duration
                  </Text>
                  <NumberInput
                    radius="sm"
                    size="xs"
                    w={130}
                    value={form.values.tenure_months}
                    allowDecimal={false}
                    onChange={(v) =>
                      form.setFieldValue("tenure_months", typeof v === "number" ? v : "")
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
                  value={Math.min(Math.max(tenure, rules.tenure.min), rules.tenure.max)}
                  onChange={(v) => form.setFieldValue("tenure_months", v)}
                  label={(v) => `${v} mo`}
                  mb={12}
                  disabled={readOnly}
                />
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
              mt={16}
              p={8}
              style={{
                background: "var(--mantine-color-slate-0)",
                borderRadius: "var(--mantine-radius-md)",
                marginTop: "auto",
              }}
            >
              <Box>
                <Text fz={12} fw={600} c="slate.8">
                  Repayment Frequency:
                </Text>
              </Box>
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
                      readOnly ? undefined : () => form.setFieldValue("repayment_frequency", f.value)
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

          {/* RIGHT PANEL: Instant simulation outcome */}
          <Box style={{ display: "flex", flexDirection: "column" }}>
            <Group justify="space-between" align="center" mb={16} wrap="wrap">
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
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb={12}>
                  <OutcomeStat
                    icon={IconCalendar}
                    label={frequency === "Bi-weekly" ? "Estimated Bi-weekly EMI" : "Estimated Monthly EMI"}
                    value={
                      <>
                        {zmw(simulation.installment)}{" "}
                        <Text component="span" fz={11.5} fw={500} c="slate.4">
                          {frequency === "Bi-weekly" ? "/2 wks" : "/mo"}
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
                    sub={`Interest: ${zmw(simulation.totalInterest)}`}
                  />
                </SimpleGrid>

                <SimpleGrid
                  cols={3}
                  spacing={0}
                  mb={12}
                  style={{
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                    overflow: "hidden",
                  }}
                >
                  {[
                    { label: "Principal", value: zmw(amount) },
                    { label: "Interest", value: `${zmw(simulation.totalInterest)} ` },
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
                      px={12}
                      py={10}
                      style={{
                        borderLeft: i % 3 === 0 ? undefined : "1px solid var(--mantine-color-slate-2)",
                        borderTop: i >= 3 ? "1px solid var(--mantine-color-slate-2)" : undefined,
                      }}
                    >
                      <MicroStat label={cell.label} value={cell.value} valueColor={cell.color} />
                    </Box>
                  ))}
                </SimpleGrid>
              </>
            ) : (
              (amountError || tenureError) && (
                <Text fz={12.5} c="red.6">
                  {amountError || tenureError}
                </Text>
              )
            )}
          </Box>
        </SimpleGrid>

        {/* BOTTOM SECTION: Full Width Amortization Toggle */}
        {simulation && (
          <Box mt={24} pt={16}>
            <Group justify="space-between" align="center" wrap="wrap">
              <UnstyledButton onClick={() => setScheduleExpanded((v) => !v)} fz={11} fw={700} c="brand.6">
                <Group gap={4}>
                  {scheduleExpanded ? "Hide full amortization schedule" : "View full amortization schedule"}
                  {scheduleExpanded ? <IconChevronUp size={13} stroke={2.5} /> : <IconChevronDown size={13} stroke={2.5} />}
                </Group>
              </UnstyledButton>
              <Text fz={11} c="slate.4">
                APR: {rate.toFixed(1)}%
              </Text>
            </Group>

            {scheduleExpanded && (
              <Box
                mt={16}
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
        )}
      </Box>
    </Stack>
  );
}