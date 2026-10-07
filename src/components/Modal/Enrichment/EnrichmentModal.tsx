import { useEffect, useMemo, useState } from "react";
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
  NumberInput,
  Select,
  Button,
  ActionIcon,
  Pagination,
  SegmentedControl,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconFileText, IconCalendarEvent,
  IconGauge,
  IconCheck,
  IconX,
  IconChevronUp,
  IconInfoCircle,
  IconHelp,
  IconArrowRight,
  IconMinus,
  IconDownload,
  IconTrash,
  IconPlus,
  IconReportMoney,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import { LeftNav, ContextHeader } from "../PreScreeningModal/PreScreeningShared";
import type { LoanApplication, StagePayload } from "../../../api/LosConfiguration/LoanApplicationApi";
import { StageLoading, stagePolicy, useStageApplication } from "../stageData";

interface EnrichmentModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanApplicationId?: string | null;
  application?: LoanApplication;
  embedded?: boolean;
  readOnly?: boolean;
}

export interface AppraisalResult {
  ready: boolean;
  payload: StagePayload;
}

const PRODUCT_LIMITS = { amountMin: 5000, rateMin: 18, rateMax: 32, tenureMin: 1, tenureMax: 360 };

type ChargeBasis = "Amount" | "Percentage";
type ChargeTreatment = "Add to First Repayment" | "Billed Separately";

interface ChargeRow {
  id: string;
  name: string;
  basis: ChargeBasis;
  value: number | "";
  account: string;
  treatment: ChargeTreatment;
}

const CHARGE_NAME_OPTIONS = [
  "Processing Fee", "VAT", "Credit Life Insurance", "Valuation Fee", "Legal Fee",
  "Stamp Duty", "Registration Fee", "Disbursement Fee", "Documentation Fee", "Other",
];
const CHARGE_ACCOUNT_OPTIONS = [
  "Fee Income — Processing", "VAT Payable", "Fee Income — Insurance",
  "Legal Fees Expense", "Stamp Duty Payable", "Suspense — Fees",
];
const CHARGE_TREATMENT_OPTIONS: ChargeTreatment[] = ["Add to First Repayment", "Billed Separately"];

function makeChargeRow(): ChargeRow {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: "",
    basis: "Amount",
    value: "",
    account: "",
    treatment: "Add to First Repayment",
  };
}

function resolveChargeAmount(charge: ChargeRow, approvedAmount: number): number {
  const v = Number(charge.value) || 0;
  return charge.basis === "Percentage" ? approvedAmount * (v / 100) : v;
}

const zmw = (n: number | null) => (n == null ? "—" : "ZMW " + Math.round(n).toLocaleString());

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function addMonths(base: Date, months: number) {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return target;
}

function parseEffectiveDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function computeSimulation(
  amount: number,
  tenure: number,
  rate: number,
  frequency: string,
  calcMethod = "Reducing balance",
  effectiveDate?: string,
) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  const isFlat = calcMethod === "Flat rate";

  const flatTotalInterest = amount * (rate / 100) * (tenure / 12);
  let installment: number;
  if (isFlat) {
    installment = nPeriods > 0 ? (amount + flatTotalInterest) / nPeriods : 0;
  } else if (periodicRate > 0) {
    installment =
      (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) /
      (Math.pow(1 + periodicRate, nPeriods) - 1);
  } else {
    installment = nPeriods > 0 ? amount / nPeriods : 0;
  }

  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;

  const start = parseEffectiveDate(effectiveDate);
  const dueAt = (i: number) =>
    frequency === "Bi-weekly"
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 14 * i)
      : addMonths(start, i);
  const first = dueAt(1);
  const final = dueAt(nPeriods);

  const schedule: { n: number; due: Date; opening: number; principal: number; interest: number; balance: number }[] = [];
  let balance = amount;
  for (let i = 1; i <= nPeriods; i++) {
    const opening = balance;
    const interestPortion = isFlat ? flatTotalInterest / nPeriods : balance * periodicRate;
    const principalPortion = isFlat ? amount / nPeriods : installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    schedule.push({ n: i, due: dueAt(i), opening, principal: principalPortion, interest: interestPortion, balance });
  }
  return { installment, totalRepayment, totalInterest, nPeriods, periodsPerYear, first, final, schedule };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fz={11} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.3 }} mb={6}>
      {children}
    </Text>
  );
}

function SimRow({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <Group
      justify="space-between"
      py={9}
      style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz={11.5} c="slate.5">
        {label}
      </Text>
      <Text fz={11.5} fw={strong ? 700 : 600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}
function EnrichmentTabs({ tab, setTab }: { tab: "terms" | "schedule"; setTab: (t: "terms" | "schedule") => void }) {
    const tabs: { key: "terms" | "schedule"; label: string; icon: any } = [
      { key: "terms", label: "Loan Terms", icon: IconFileText },
      { key: "schedule", label: "Repayment Schedule", icon: IconCalendarEvent },
    ];
    return (
      <Group
        gap={4}
        mb={4} pt={2}
        wrap="nowrap"
        style={{
          borderBottom: "1px solid var(--mantine-color-slate-2)",
          flexShrink: 0,
        }}
      >
        {tabs.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          return (
            <UnstyledButton
              key={t.key}
              onClick={() => setTab(t.key)}
              px={14}
              py={4} style={{ position: "relative", marginBottom: -1 }}
            >
              <Group gap={7} wrap="nowrap">
                <Icon
                  size={15}
                  stroke={2}
                  color={active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-5)"}
                />
                <Text fz={13} fw={active ? 700 : 600} c={active ? "brand.6" : "slate.6"}>
                  {t.label}
                </Text>
              </Group>
              <Box
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  bottom: 0,
                  height: 2,
                  borderRadius: "2px 2px 0 0",
                  background: active
                    ? "linear-gradient(90deg, var(--mantine-color-brand-4), var(--mantine-color-brand-6))"
                    : "transparent",
                  transition: "background 160ms ease",
                }}
              />
            </UnstyledButton>
          );
        })}
      </Group>
    );
  }
function MilestoneCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <Box
      p={10}
      style={{
        border: highlight ? "1.5px solid var(--mantine-color-brand-4)" : "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-md)",
        flex: 1,
      }}
    >
      <Text fz={10} fw={600} c="slate.4">{label}</Text>
      <Text fz={13} fw={700} c="slate.9" mt={2}>{value}</Text>
      {sub && <Text fz={9.5} c={highlight ? "green.6" : "slate.4"} mt={2}>{sub}</Text>}
    </Box>
  );
}

const th = { textAlign: "left" as const, padding: "8px 12px", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11 };
const td = { padding: "8px 12px", color: "var(--mantine-color-slate-7)" };
const thNum = { ...th, textAlign: "right" as const };
const tdNum = { ...td, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };
const tdTop = { ...td, verticalAlign: "top" as const };
const tdCharge = { ...tdTop, padding: "5px 10px" };

const SCHEDULE_PAGE_SIZE = 10;

type Section = "application" | "prescreening" | "appraisal";



export function EnrichmentWorkspace({
  application,
  readOnly = false,
  onChange,
}: {
  application: LoanApplication;
  readOnly?: boolean;
  onChange?: (result: AppraisalResult) => void;
}) {
  const policy = stagePolicy(application);
  const saved = application.appraisal_data ?? {};
  const income = Number(application.monthly_income) || 0;
  const obligations = Number(application.monthly_obligations) || 0;
  const maxDTI = Number(application.prescreening_data?.policy?.max_dti) || policy.maxDTI;
  const eligibleAmount = Number(application.eligible_amount) || 0;
  const [approvedAmount, setApprovedAmount] = useState<number>(
    () =>
      Number(application.approved_amount) ||
      Number(application.prescreening_data?.confirmed_amount) ||
      eligibleAmount ||
      Number(application.requested_amount) ||
      0,
  );
  const [overrideReason, setOverrideReason] = useState<string>(saved.override_reason ?? "");
  const [tab, setTab] = useState<"terms" | "schedule">("terms");
  const [tenure, setTenure] = useState<number>(
    Number(application.approved_tenure_months) || Number(application.tenure_months) || 0,
  );
  const [frequency, setFrequency] = useState<string>(application.approved_frequency || application.repayment_frequency);
  const [rate, setRate] = useState<number>(Number(application.interest_rate) || policy.rate);
  const [interestType, setInterestType] = useState<string>(saved.interest_type ?? "Fixed");
  const [calcMethod, setCalcMethod] = useState<string>(saved.interest_calculation ?? "Reducing balance");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    () => saved.effective_date ?? new Date().toISOString().slice(0, 10),
  );

  const [charges, setCharges] = useState<ChargeRow[]>(() =>
    ((saved.charges ?? []) as Omit<ChargeRow, "id">[]).map((charge) => ({ ...makeChargeRow(), ...charge })),
  );

  function addCharge() {
    setCharges((prev) => [...prev, makeChargeRow()]);
  }
  function updateCharge(id: string, patch: Partial<ChargeRow>) {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCharge(id: string) {
    setCharges((prev) => prev.filter((c) => c.id !== id));
  }

  const [schedulePage, setSchedulePage] = useState(1);
  const theme = useMantineTheme();

  const requestedAmount = Number(application.requested_amount) || 0;
  const isOverride = eligibleAmount > 0 && approvedAmount > eligibleAmount;
  const overrideError =
    isOverride && !overrideReason.trim()
      ? "Record why the approved amount exceeds the calculated eligibility."
      : null;

  const tenureError =
    tenure != null && (tenure < PRODUCT_LIMITS.tenureMin || tenure > PRODUCT_LIMITS.tenureMax)
      ? `Enter a tenure between ${PRODUCT_LIMITS.tenureMin} and ${PRODUCT_LIMITS.tenureMax} months.`
      : null;
  const rateError =
    rate != null && (rate < PRODUCT_LIMITS.rateMin || rate > PRODUCT_LIMITS.rateMax)
      ? `Enter a rate between ${PRODUCT_LIMITS.rateMin}% and ${PRODUCT_LIMITS.rateMax}%.`
      : null;

  const valid = !tenureError && !rateError && !overrideError && approvedAmount && tenure && rate;

  const figures = useMemo(() => {
    if (!valid) return null;

    const billedSeparately = charges.filter((c) => c.treatment === "Billed Separately");
    const addToFirst = charges.filter((c) => c.treatment === "Add to First Repayment");

    const billedSeparatelyTotal = billedSeparately.reduce((s, c) => s + resolveChargeAmount(c, approvedAmount), 0);
    const addToFirstTotal = addToFirst.reduce((s, c) => s + resolveChargeAmount(c, approvedAmount), 0);
    const financedCharges = addToFirstTotal;

    const financedPrincipal = approvedAmount;
    const netDisbursement = approvedAmount;
    const sim = computeSimulation(financedPrincipal, tenure, rate, frequency, calcMethod, effectiveDate);

    const totalRepayment = approvedAmount + sim.totalInterest + financedCharges;

    const monthlyInstalment =
      frequency === "Bi-weekly" ? (sim.installment * 26) / 12 : sim.installment;
    const projectedDti = income > 0 ? ((obligations + monthlyInstalment) / income) * 100 : null;

    return {
      billedSeparatelyTotal, addToFirstTotal, financedCharges,
      financedPrincipal, netDisbursement, sim, totalRepayment, monthlyInstalment, projectedDti,
    };
  }, [valid, approvedAmount, tenure, rate, frequency, calcMethod, effectiveDate, charges, income, obligations]);
  useEffect(() => {
    onChange?.({
      ready: !!valid,
      payload: {
        custom_status: "Pending",
        approved_amount: approvedAmount || null,
        approved_tenure_months: tenure || null,
        approved_frequency: frequency,
        interest_rate: rate,
        appraisal_data: {
          interest_type: interestType,
          interest_calculation: calcMethod,
          effective_date: effectiveDate,
          override_reason: isOverride ? overrideReason.trim() || null : null,
          charges: charges
            .filter((charge) => charge.name)
            .map(({ name, basis, value, account, treatment }) => ({ name, basis, value: Number(value) || 0, account, treatment })),
          monthly_instalment: figures ? Math.round(figures.monthlyInstalment) : null,
          total_repayment: figures ? Math.round(figures.totalRepayment) : null,
          projected_dti: figures?.projectedDti != null ? Math.round(figures.projectedDti * 10) / 10 : null,
        },
      },
    });
  }, [valid, approvedAmount, tenure, frequency, rate, interestType, calcMethod, effectiveDate, overrideReason, charges, figures]);

  const scheduleTotalPages = figures ? Math.ceil(figures.sim.nPeriods / SCHEDULE_PAGE_SIZE) : 0;
  const pagedSchedule = useMemo(
    () =>
      figures
        ? figures.sim.schedule.slice(
            (schedulePage - 1) * SCHEDULE_PAGE_SIZE,
            schedulePage * SCHEDULE_PAGE_SIZE,
          )
        : [],
    [figures, schedulePage],
  );
  useEffect(() => {
    if (schedulePage > scheduleTotalPages) setSchedulePage(Math.max(1, scheduleTotalPages));
  }, [schedulePage, scheduleTotalPages]);

  const exportSchedule = () => {
    if (!figures) return;
    const sheetData = figures.sim.schedule.map((row) => {
      const chargesAdded = row.n === 1 ? figures.addToFirstTotal : 0;
      return {
        "#": row.n,
        "Due Date": fmtDate(row.due),
        "Opening Balance": Math.round(row.opening),
        Principal: Math.round(row.principal),
        Interest: Math.round(row.interest),
        "Charges Added": Math.round(chargesAdded),
        Instalment: Math.round(row.principal + row.interest + chargesAdded),
        "Closing Balance": Math.round(row.balance),
      };
    });
    sheetData.push({
      "#": "" as never,
      "Due Date": "Total",
      "Opening Balance": "" as never,
      Principal: Math.round(figures.financedPrincipal),
      Interest: Math.round(figures.sim.totalInterest),
      "Charges Added": Math.round(figures.addToFirstTotal),
      Instalment: Math.round(figures.totalRepayment),
      "Closing Balance": "" as never,
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), "Repayment Schedule");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      `Repayment_Schedule_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

   return (
    <Box pl={20} pr={16} py={8}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 10, alignItems: "start" }}>
        <Box>
          <EnrichmentTabs tab={tab} setTab={setTab} />

          {tab === "terms" && (
            <Box component="fieldset" disabled={readOnly} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
              <Paper withBorder radius="md" p={8} mb={4}>
                <SectionLabel>Final loan terms</SectionLabel>
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing={8} verticalSpacing={4}>
                  <Box>
                    <TextInput
                      label="Requested"
                      value={zmw(requestedAmount)}
                      readOnly
                      radius="md"
                      size="xs"
                      styles={{
                        input: {
                          background: "var(--mantine-color-slate-0)",
                          color: "var(--mantine-color-slate-6)",
                          cursor: "default",
                        },
                      }}
                    />
                    <Text fz={10} c="slate.4" mt={4}>
                      At application
                    </Text>
                  </Box>
                  <Box>
                    <NumberInput
                      label="Approved"
                      value={approvedAmount}
                      onChange={(v) => setApprovedAmount(Number(v) || 0)}
                      prefix="ZMW "
                      hideControls
                      thousandSeparator=","
                      min={0}
                      radius="md"
                      size="xs"
                    />
                    <Text fz={10} c={isOverride ? "orange.7" : "slate.4"} mt={4}>
                      {isOverride
                        ? `Override — eligibility is ${zmw(eligibleAmount)}`
                        : `Eligibility: ${zmw(eligibleAmount)}`}
                    </Text>
                  </Box>
                  <Box>
                    <NumberInput
                      label="Tenure"
                      value={tenure}
                      hideControls
                      onChange={(v) => setTenure(Number(v) || 0)}
                      suffix=" months"
                      error={tenureError}
                      min={PRODUCT_LIMITS.tenureMin}
                      max={PRODUCT_LIMITS.tenureMax}
                      radius="md"
                      size="xs"
                    />
                  </Box>
                  <Select
                    label="Frequency"
                    value={frequency}
                    onChange={(v) => setFrequency(v || "Monthly")}
                    data={["Monthly", "Bi-weekly"]}
                    radius="md"
                    size="xs"
                  />
                </SimpleGrid>
                {isOverride && (
                  <Box
                    mt={10}
                    p={10}
                    style={{
                      background: "var(--mantine-color-orange-0)",
                      border: "1px solid var(--mantine-color-orange-2)",
                      borderRadius: "var(--mantine-radius-md)",
                    }}
                  >
                    <Group gap={6} mb={6} wrap="nowrap">
                      <IconInfoCircle size={14} color="var(--mantine-color-orange-7)" />
                      <Text fz={11.5} fw={600} c="orange.8">
                        Approved amount exceeds calculated eligibility by{" "}
                        {zmw(approvedAmount - eligibleAmount)}
                      </Text>
                    </Group>
                    <TextInput
                      label="Override reason"
                      placeholder="e.g. amount negotiated and agreed with the customer by phone on 22 Sep"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.currentTarget.value)}
                      error={overrideError}
                      radius="md"
                      size="xs"
                    />
                  </Box>
                )}
              </Paper>

              <Paper withBorder radius="md" p={8} mb={4}>
                <SectionLabel>Interest rate & calculation method</SectionLabel>
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing={8} verticalSpacing={4}>
                  <NumberInput
                    label="Interest Rate"
                    value={rate}
                    hideControls
                    onChange={(v) => setRate(Number(v) || 0)}
                    suffix=" % p.a."
                    error={rateError}
                    min={PRODUCT_LIMITS.rateMin}
                    max={PRODUCT_LIMITS.rateMax}
                    radius="md"
                    size="xs"
                  />
                  <Select
                    label="Interest Type"
                    value={interestType}
                    onChange={(v) => setInterestType(v || "Fixed")}
                    data={["Fixed", "Variable"]}
                    radius="md"
                    size="xs"
                  />
                  <Select
                    label="Calculation"
                    value={calcMethod}
                    onChange={(v) => setCalcMethod(v || "Reducing balance")}
                    data={["Reducing balance", "Flat rate"]}
                    radius="md"
                    size="xs"
                  />
                  <Box>
                    <TextInput
                      type="date"
                      label="Effective Date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.currentTarget.value)}
                      radius="md"
                      size="xs"
                    />
                    {figures && (
                      <Text fz={10} c="slate.4" mt={2}>
                        1st due {fmtDate(figures.sim.first)}
                      </Text>
                    )}
                  </Box>
                </SimpleGrid>
              </Paper>

              <Paper withBorder radius="md" p={8}>
                <Group justify="space-between" mb={6}>
                  <SectionLabel>Fees &amp; charges</SectionLabel>
                  {charges.length > 0 && (
                    <Text fz={11} c="slate.4">
                      {charges.length} charge{charges.length === 1 ? "" : "s"}
                    </Text>
                  )}
                </Group>

                <Box style={{ maxHeight: 168, overflowY: "auto" }}>
                  <Table.ScrollContainer minWidth={620}>
                    <Table fz={12} verticalSpacing={4}>
                      <Table.Thead bg="slate.0" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <Table.Tr>
                          <Table.Th style={th}>Name</Table.Th>
                          <Table.Th style={th}>Value</Table.Th>
                          <Table.Th style={th}>Treatment</Table.Th>
                          <Table.Th style={th} />
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {charges.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Text fz={12} c="slate.4" ta="center" py={10}>
                                No charges added yet. Click "Add charge" for processing fees, VAT,
                                insurance, legal, valuation or any other cost on this facility.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          charges.map((c) => {
                            const resolved = resolveChargeAmount(c, approvedAmount);
                            return (
                              <Table.Tr key={c.id}>
                                <Table.Td style={tdCharge}>
                                  <Select
                                    size="xs"
                                    radius="md"
                                    placeholder="Select or type"
                                    searchable
                                    data={CHARGE_NAME_OPTIONS}
                                    value={c.name}
                                    onChange={(v) => updateCharge(c.id, { name: v || "" })}
                                  />
                                </Table.Td>
                                <Table.Td style={tdCharge}>
                                  <Group gap={6} wrap="nowrap" align="flex-start">
                                    <Box style={{ minWidth: 100, flex: 1 }}>
                                      <NumberInput
                                        size="xs"
                                        radius="md"
                                        hideControls
                                        min={0}
                                        thousandSeparator={c.basis === "Amount" ? "," : undefined}
                                        prefix={c.basis === "Amount" ? "ZMW " : undefined}
                                        suffix={c.basis === "Percentage" ? " %" : undefined}
                                        value={c.value}
                                        onChange={(v) => updateCharge(c.id, { value: v === "" ? "" : Number(v) })}
                                      />
                                      {c.basis === "Percentage" && (
                                        <Text fz={10} c="slate.4" mt={1}>≈ {zmw(resolved)}</Text>
                                      )}
                                    </Box>
                                    <SegmentedControl
                                      size="xs"
                                      value={c.basis}
                                      onChange={(v) => updateCharge(c.id, { basis: v as ChargeBasis })}
                                      data={[
                                        { label: "%", value: "Percentage" },
                                        { label: "Flat", value: "Amount" },
                                      ]}
                                      styles={{ root: { flexShrink: 0 } }}
                                    />
                                  </Group>
                                </Table.Td>
                                <Table.Td style={tdCharge}>
                                  <Select
                                    size="xs"
                                    radius="md"
                                    data={CHARGE_TREATMENT_OPTIONS}
                                    value={c.treatment}
                                    onChange={(v) =>
                                      updateCharge(c.id, { treatment: (v as ChargeTreatment) || "Add to First Repayment" })
                                    }
                                  />
                                </Table.Td>
                                <Table.Td style={tdCharge}>
                                  <ActionIcon variant="subtle" color="danger" size="sm" onClick={() => removeCharge(c.id)}>
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })
                        )}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Box>

                <Group justify="space-between" align="center" mt={8}>
                  <Button
                    variant="subtle"
                    color="brand"
                    size="xs"
                    radius="md"
                    leftSection={<IconPlus size={14} stroke={2.5} />}
                    onClick={addCharge}
                  >
                    Add charge
                  </Button>
                  {figures && charges.length > 0 && (
                    <Text fz={12} fw={700} c="slate.9">
                      Total charges: {zmw(figures.billedSeparatelyTotal + figures.addToFirstTotal)}
                    </Text>
                  )}
                </Group>
              </Paper>
            </Box>
          )}

          {tab === "schedule" && (
            <Paper withBorder radius="md" p={8}>
              <Group justify="space-between" align="center" mb={6}>
                <Box>
                  <SectionLabel>Repayment schedule</SectionLabel>
                  {figures && (
                    <Text fz={11} c="slate.4">
                      {figures.sim.nPeriods} instalments · {calcMethod} · {interestType.toLowerCase()} {rate}% p.a.
                    </Text>
                  )}
                </Box>
                <Button
                  size="xs"
                  radius="xl"
                  color="brand"
                  leftSection={<IconDownload size={13} />}
                  onClick={exportSchedule}
                  disabled={!figures}
                  style={{
                    background: theme.other.brandGradient,
                    boxShadow: theme.other.brandGlowShadowSm,
                  }}
                >
                  Export
                </Button>
              </Group>
              {figures ? (
                <>
                  <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                    <Table.ScrollContainer minWidth={620}>
                      <Table fz={11} verticalSpacing={3} highlightOnHover>
                        <Table.Thead bg="slate.0">
                          <Table.Tr>
                            <Table.Th style={th}>#</Table.Th>
                            <Table.Th style={th}>Due date</Table.Th>
                            <Table.Th style={thNum}>Opening</Table.Th>
                            <Table.Th style={thNum}>Principal</Table.Th>
                            <Table.Th style={thNum}>Interest</Table.Th>
                            <Table.Th style={thNum}>Instalment</Table.Th>
                            <Table.Th style={thNum}>Balance</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {pagedSchedule.map((row) => {
                            const chargesAdded = row.n === 1 ? figures.addToFirstTotal : 0;
                            return (
                              <Table.Tr key={row.n}>
                                <Table.Td style={td}>{row.n}</Table.Td>
                                <Table.Td style={td}>{fmtDate(row.due)}</Table.Td>
                                <Table.Td style={tdNum}>{zmw(row.opening)}</Table.Td>
                                <Table.Td style={tdNum}>{zmw(row.principal)}</Table.Td>
                                <Table.Td style={tdNum}>{zmw(row.interest)}</Table.Td>
                                <Table.Td style={tdNum}>
                                  {zmw(row.principal + row.interest + chargesAdded)}
                                  {chargesAdded > 0 && (
                                    <Text component="span" fz={10} c="orange.6"> *</Text>
                                  )}
                                </Table.Td>
                                <Table.Td style={tdNum}>{zmw(row.balance)}</Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                        <Table.Tfoot>
                          <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                            <Table.Th style={th} colSpan={3}>
                              Total
                            </Table.Th>
                            <Table.Th style={thNum}>{zmw(figures.financedPrincipal)}</Table.Th>
                            <Table.Th style={thNum}>{zmw(figures.sim.totalInterest)}</Table.Th>
                            <Table.Th style={thNum}>{zmw(figures.totalRepayment)}</Table.Th>
                            <Table.Th style={thNum}>—</Table.Th>
                          </Table.Tr>
                        </Table.Tfoot>
                      </Table>
                    </Table.ScrollContainer>
                  </Paper>
                  {figures.addToFirstTotal > 0 && (
                    <Text fz={10.5} c="orange.7" mt={4}>
                      * Instalment 1 includes {zmw(figures.addToFirstTotal)} in charges added to the first repayment.
                    </Text>
                  )}
                  <Group justify="space-between" align="center" mt={10}>
                    <Text fz={11} c="slate.4">
                      Showing {(schedulePage - 1) * SCHEDULE_PAGE_SIZE + 1}–
                      {Math.min(schedulePage * SCHEDULE_PAGE_SIZE, figures.sim.nPeriods)} of{" "}
                      {figures.sim.nPeriods}
                    </Text>
                    {scheduleTotalPages > 1 && (
                      <Pagination
                        total={scheduleTotalPages}
                        value={schedulePage}
                        onChange={setSchedulePage}
                        size="sm"
                        radius="xl"
                        color="brand"
                      />
                    )}
                  </Group>
                </>
              ) : (
                <Text fz={11.5} c="slate.5">Fix the highlighted fields in Loan Terms to view the schedule.</Text>
              )}
            </Paper>
          )}

        </Box>


        <Paper
  withBorder
  radius="lg"
  shadow="xs"
  p={12}
  style={{ overflow: "hidden", alignSelf: "flex-start", position: "sticky", top: 0 }}
>
         <Box
  p={8}
  mx={-12}
  mt={-12}
  mb={8}
  style={{
    background: theme.other.brandGradient,
    borderRadius: "var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0",
  }}
>
  <Group justify="space-between" wrap="nowrap">
    <Text fz={13} fw={700} c="white">Summary of Terms</Text>
    <Badge size="xs" radius="xl" variant="white" c="brand.7">
      {calcMethod}
    </Badge>
  </Group>
</Box>

          {figures ? (
            <>
        <SimpleGrid cols={2} spacing={8} mb={6}>
  <Box p={8} bg="green.0" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-green-2)" }}>
    <Text fz={9} fw={700} c="green.7" mb={3} style={{ whiteSpace: "nowrap" }}>NET DISBURSED</Text>
    <Text fz={14.5} fw={800} c="slate.9" lh={1.05} style={{ whiteSpace: "nowrap" }}>{zmw(figures.netDisbursement)}</Text>
  </Box>
  <Box p={8} bg="brand.0" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-brand-2)" }}>
    <Text fz={9} fw={700} c="brand.7" mb={3} style={{ whiteSpace: "nowrap" }}>EST. INSTALMENT</Text>
    <Text fz={14.5} fw={800} c="slate.9" lh={1.05} style={{ whiteSpace: "nowrap" }}>{zmw(figures.sim.installment)}</Text>
    <Text fz={9.5} c="brand.7" mt={2}>
      {figures.addToFirstTotal > 0
        ? `1st instalment +${zmw(figures.addToFirstTotal)}`
        : `${figures.sim.nPeriods} × ${frequency.toLowerCase()}`}
    </Text>
  </Box>
</SimpleGrid>

              <Box mb={8}>
  <Group justify="space-between" py={3} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
    <Text fz={12} c="slate.5">Principal</Text>
    <Text fz={12} fw={600} c="slate.9">{zmw(approvedAmount)}</Text>
  </Group>
  <Group justify="space-between" py={3} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
    <Text fz={12} c="slate.5">Interest</Text>
    <Text fz={12} fw={600} c="slate.9">{zmw(figures.sim.totalInterest)}</Text>
  </Group>
  <Group justify="space-between" py={3}>
    <Text fz={12} c="slate.5">Charges</Text>
    <Text fz={12} fw={600} c="slate.9">{zmw(figures.financedCharges)}</Text>
  </Group>
  <Group justify="space-between" py={6} bg="slate.0" px={8} mt={4} style={{ borderRadius: "var(--mantine-radius-sm)" }}>
    <Text fz={11.5} fw={700} c="slate.9">Total Customer Repayment</Text>
    <Text fz={11.5} fw={700} c="brand.7">{zmw(figures.totalRepayment)}</Text>
  </Group>
  {figures.billedSeparatelyTotal > 0 && (
    <Group justify="space-between" py={3} mt={2}>
      <Text fz={11} c="slate.4">Billed separately, outside this loan</Text>
      <Text fz={11} fw={600} c="slate.5">{zmw(figures.billedSeparatelyTotal)}</Text>
    </Group>
  )}
</Box>

              <Text fz={9} fw={700} c="slate.4" tt="uppercase" mb={1} style={{ letterSpacing: 0.3 }}>Affordability</Text>
              <Box
                mb={8}
                p={6}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  background:
                    figures.projectedDti != null && figures.projectedDti > maxDTI
                      ? "var(--mantine-color-red-0)"
                      : "var(--mantine-color-slate-0)",
                  border:
                    figures.projectedDti != null && figures.projectedDti > maxDTI
                      ? "1px solid var(--mantine-color-red-2)"
                      : "1px solid var(--mantine-color-slate-2)",
                }}
              >
                <Group justify="space-between" py={1}>
                  <Text fz={11.5} c="slate.5">Monthly income</Text>
                  <Text fz={11.5} fw={600} c="slate.9">{zmw(income)}</Text>
                </Group>
                <Group justify="space-between" py={1}>
                  <Text fz={11.5} c="slate.5">Existing obligations</Text>
                  <Text fz={11.5} fw={600} c="slate.9">{zmw(obligations)}</Text>
                </Group>
                <Group justify="space-between" py={1}>
                  <Text fz={11.5} c="slate.5">This loan (monthly)</Text>
                  <Text fz={11.5} fw={600} c="slate.9">{zmw(figures.monthlyInstalment)}</Text>
                </Group>
                <Group justify="space-between" py={1} mt={2} style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
                  <Text fz={11.5} fw={600} c="slate.7">Projected DTI</Text>
                  <Text
                    fz={12}
                    fw={700}
                    c={figures.projectedDti != null && figures.projectedDti > maxDTI ? "red.7" : "green.7"}
                  >
                    {figures.projectedDti == null ? "—" : `${figures.projectedDti.toFixed(1)}%`} / {maxDTI}%
                  </Text>
                </Group>
                {figures.projectedDti != null && figures.projectedDti > maxDTI && (
                  <Text fz={10.5} c="red.7" mt={6}>
                    These terms take the customer past the {maxDTI}% DTI policy limit.
                  </Text>
                )}
              </Box>

              <Group justify="space-between" mb={6} pt={6} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
  <Box>
    <Text fz={10} c="slate.4">First repayment</Text>
    <Text fz={12} fw={700} c="slate.9">{fmtDate(figures.sim.first)}</Text>
  </Box>
  <Box ta="right">
    <Text fz={10} c="slate.4">Final maturity</Text>
    <Text fz={12} fw={700} c="slate.9">{fmtDate(figures.sim.final)}</Text>
  </Box>
</Group>

            <UnstyledButton
  onClick={() => setTab("schedule")}
  mt={2}
  mb={0}
  p={7}
  w="100%"
  style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-md)" }}
>
  <Group justify="space-between">
    <Text fz={12} fw={600} c="brand.7">View full schedule — {figures.sim.nPeriods} instalments</Text>
    <IconArrowRight size={13} color="var(--mantine-color-brand-7)" />
  </Group>
</UnstyledButton>

            </>
          ) : (
            <Text fz={11.5} c="slate.5">Fix the highlighted fields to see the summary.</Text>
          )}
        </Paper>
      </div>
    </Box>
  );
}

export function EnrichmentModal({
  opened,
  onClose,
  loanApplicationId,
  application: embeddedApplication,
  onMinimize,
  embedded,
  readOnly,
}: EnrichmentModalProps) {
  const [section, setSection] = useState<Section>("appraisal");
  const [result, setResult] = useState<AppraisalResult | null>(null);
  const stage = useStageApplication(embedded ? null : loanApplicationId);

  if (embedded) {
    return embeddedApplication ? <EnrichmentWorkspace application={embeddedApplication} readOnly={readOnly} /> : null;
  }

  const { application, values } = stage;

  const handleSubmit = async () => {
    if (!result) return;
    const payload: StagePayload = { ...result.payload, custom_status: "Approved" };
    if (await stage.save(payload)) onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90vw"
      padding={0}
      closeOnClickOutside={false}
      closeOnEscape={false}
      lockScroll
      styles={{
        content: { height: "96vh", maxHeight: "99vh", width: "90vw", maxWidth: "1600px", display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Group justify="space-between" align="center" px="xl" py="sm" bg="brand.6" style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}>
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconReportMoney size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>Loan Application</Text>
              <Text size="xs" fw={500} c="brand.1">Stage 3 &mdash; Loan Appraisal</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onMinimize} aria-label="Minimize">
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        {!application || !values ? (
          <StageLoading error={stage.error} />
        ) : (
          <>
            <ContextHeader values={values} applicationId={application.name} loanTypeName={application.loan_type_name} stageIndex={3} />
            <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
              <LeftNav
                section={section}
                setSection={setSection}
                stageIndex={3}
                items={[
                  { id: "application", label: "Loan application", icon: IconFileText, done: true },
                  { id: "prescreening", label: "Prescreening", icon: IconGauge, done: true },
                  { id: "appraisal", label: "Loan Appraisal", icon: IconBuildingBank, done: false },
                ]}
              />
              <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
                {section === "application" && (
                  <Box style={{ height: "100%" }}>
                    <Group
                      gap={10}
                      align="flex-start"
                      m="md"
                      p="sm"
                      bg="brand.0"
                      style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}
                    >
                      <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text fz={11.5} c="brand.9">
                        Submitted application data — read-only at this stage.
                      </Text>
                    </Group>
                    <Box style={{ height: "calc(100% - 70px)" }}>
                      <LoanApplicationModal embedded readOnly initialValues={values} opened={false} onClose={() => {}} onMinimize={() => {}} />
                    </Box>
                  </Box>
                )}
                {section === "prescreening" && (
                  <Box style={{ height: "100%" }}>
                    <PreScreeningModal embedded readOnly application={application} opened={false} onClose={() => {}} onMinimize={() => {}} />
                  </Box>
                )}
                {section === "appraisal" && <EnrichmentWorkspace application={application} readOnly={readOnly} onChange={setResult} />}
              </Box>
            </Box>
            {!readOnly && (
              <Group
                justify="space-between"
                align="center"
                px="xl"
                py="md"
                bg="white"
                style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
              >
                <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  color="brand"
                  radius="md"
                  onClick={handleSubmit}
                  disabled={!result?.ready}
                  loading={stage.saving}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Submit
                </Button>
              </Group>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
}
