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
  NumberInput,
  Select,
  Checkbox,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconFileText,
  IconGauge,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconCircleCheck,
  IconHelp,
  IconArrowRight,
  IconMinus,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
  DUMMY_PRESCREENING_DATA,
} from "../PreScreeningModal/Dummyloanapplicationdata";

interface EnrichmentModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
  embedded?: boolean;
  readOnly?: boolean;
}

const POLICY: Record<"personal" | "business" | "mortgage", { minCreditScore: number; maxDTI: number; productMax: number }> = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

const PRODUCT_LIMITS = { amountMin: 5000, rateMin: 18, rateMax: 32, tenureMin: 6, tenureMax: 60 };

const zmw = (n: number | null) => (n == null ? "—" : "ZMW " + Math.round(n).toLocaleString());

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
  income: number;
  obligations: number;
  maxDTI: number;
  annualRate: number;
  tenureMonths: number;
  productMax: number;
  creditScore: number;
  minCreditScore: number;
}) {
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount =
    r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  const eligibleAmount = creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
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

function computeSimulation(
  amount: number,
  tenure: number,
  rate: number,
  frequency: string,
  feePct = 0,
) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  let installment: number;
  if (periodicRate > 0)
    installment =
      (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) /
      (Math.pow(1 + periodicRate, nPeriods) - 1);
  else installment = amount / nPeriods;
  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;
  const fee = amount * feePct;
  const first = new Date();
  first.setMonth(first.getMonth() + 1);
  const final = new Date(first);
  if (frequency === "Bi-weekly") final.setDate(final.getDate() + 14 * (nPeriods - 1));
  else final.setMonth(final.getMonth() + (nPeriods - 1));
  const schedule: { n: number; due: Date; principal: number; interest: number; balance: number }[] = [];
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
  return { installment, totalRepayment: totalRepayment + fee, totalInterest, fee, nPeriods, first, final, schedule };
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
      <Text fz={12.5} c="slate.5">
        {label}
      </Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}

const th = { textAlign: "left" as const, padding: "8px 12px", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11 };
const td = { padding: "8px 12px", color: "var(--mantine-color-slate-7)" };

type Section = "application" | "prescreening" | "enrichment";

function LeftNav({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  const items: { id: Section; label: string; icon: React.FC<any> }[] = [
    { id: "application", label: "Loan application", icon: IconFileText },
    { id: "prescreening", label: "Prescreening", icon: IconGauge },
    { id: "enrichment", label: "Enrichment", icon: IconBuildingBank },
  ];
  return (
    <Box
      w={216}
      style={{ flexShrink: 0, background: "white", borderRight: "1px solid var(--mantine-color-slate-2)" }}
      p={12}
    >
      <Text fz={10.5} fw={600} c="slate.4" tt="uppercase" px={10} mb={10} style={{ letterSpacing: 0.4 }}>
        Stage 3 of 5
      </Text>
      <Stack gap={4}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          const isDone = it.id !== "enrichment";
          return (
            <UnstyledButton
              key={it.id}
              onClick={() => setSection(it.id)}
              px={12}
              py={10}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                background: active ? "var(--mantine-color-brand-0)" : "transparent",
              }}
            >
              <Group gap={10} justify="space-between" wrap="nowrap">
                <Group gap={10}>
                  <Icon
                    size={16}
                    color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-slate-6)"}
                  />
                  <Text fz="sm" fw={active ? 600 : 500} c={active ? "brand.7" : "slate.7"}>
                    {it.label}
                  </Text>
                </Group>
                {isDone && (
                  <IconCheck
                    size={13}
                    color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-green-6)"}
                  />
                )}
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}

function ContextHeader({
  values,
  applicationId,
  approvedAmount,
}: {
  values: LoanApplicationValues;
  applicationId: string;
  approvedAmount: number;
}) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness
    ? values.companyName
    : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

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
            Approved amount
          </Text>
          <Text fz={13.5} fw={700} c="slate.9">
            {zmw(approvedAmount)}
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

function EnrichmentWorkspace({
  values,
  approvedAmount,
  onSubmitReady,
}: {
  values: LoanApplicationValues;
  approvedAmount: number;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
}) {
  const [amount, setAmount] = useState<number>(approvedAmount);
  const [tenure, setTenure] = useState<number>(Number(values.tenureMonths) || 0);
  const [frequency, setFrequency] = useState<string>(values.repaymentFrequency);
  const [rate, setRate] = useState<number>(DUMMY_PRESCREENING_CONTEXT.loanRate);
  const [interestType, setInterestType] = useState("Fixed");
  const [calcMethod, setCalcMethod] = useState("Reducing balance");
  const [effectiveDate, setEffectiveDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [processingFeePct, setProcessingFeePct] = useState(2);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insurancePct, setInsurancePct] = useState(1);
  const [taxPct, setTaxPct] = useState(16);
  const [waiverEnabled, setWaiverEnabled] = useState(false);
  const [waiverAmount, setWaiverAmount] = useState(0);
  const [waiverReason, setWaiverReason] = useState("");

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [continued, setContinued] = useState(false);

  const amountError =
    amount != null && (amount < PRODUCT_LIMITS.amountMin || amount > approvedAmount)
      ? `Enter an amount between ${zmw(PRODUCT_LIMITS.amountMin)} and ${zmw(approvedAmount)} (the amount approved at prescreening).`
      : null;
  const tenureError =
    tenure != null && (tenure < PRODUCT_LIMITS.tenureMin || tenure > PRODUCT_LIMITS.tenureMax)
      ? `Enter a tenure between ${PRODUCT_LIMITS.tenureMin} and ${PRODUCT_LIMITS.tenureMax} months.`
      : null;
  const rateError =
    rate != null && (rate < PRODUCT_LIMITS.rateMin || rate > PRODUCT_LIMITS.rateMax)
      ? `Enter a rate between ${PRODUCT_LIMITS.rateMin}% and ${PRODUCT_LIMITS.rateMax}%.`
      : null;

  const valid = !amountError && !tenureError && !rateError && amount && tenure && rate;

  const figures = useMemo(() => {
    if (!valid) return null;
    const processingFee = amount * (processingFeePct / 100);
    const insurance = insuranceEnabled ? amount * (insurancePct / 100) : 0;
    const feesSubtotal = processingFee + insurance;
    const tax = feesSubtotal * (taxPct / 100);
    const waiver = waiverEnabled ? Number(waiverAmount || 0) : 0;
    const netCharges = Math.max(0, feesSubtotal + tax - waiver);
    const netDisbursement = amount - netCharges;
    const sim = computeSimulation(amount, tenure, rate, frequency, 0);
    const totalCostOfCredit = sim.totalInterest + netCharges;
    return { processingFee, insurance, feesSubtotal, tax, waiver, netCharges, netDisbursement, sim, totalCostOfCredit };
  }, [valid, amount, tenure, rate, frequency, processingFeePct, insuranceEnabled, insurancePct, taxPct, waiverEnabled, waiverAmount]);
  useEffect(() => {
    onSubmitReady?.(!!valid, () => setContinued(true));
  }, [valid]);
  if (continued) {
    return (
      <Box py={70} px={30} ta="center">
        <ThemeIcon radius="xl" size={44} color="green" variant="light" mx="auto" mb={10}>
          <IconCircleCheck size={26} />
        </ThemeIcon>
        <Text fz="md" fw={700} c="slate.9">
          Moving to Stage 4 — Underwriting
        </Text>
        <Text fz={12.5} c="slate.5" mt={6}>
          Final terms locked at {zmw(amount)} · {rate}% · {tenure} months.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={24}>
      <Group
        gap={10}
        align="flex-start"
        mb={16}
        p="sm"
        bg="brand.0"
        style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}
      >
        <IconInfoCircle size={15} color="var(--mantine-color-brand-6)" style={{ marginTop: 2, flexShrink: 0 }} />
        <Text fz={13} c="brand.9">
          These are the final commercial terms being prepared for underwriting and the customer
          offer — not yet final approved terms.
        </Text>
      </Group>

      <SectionLabel>Interest details</SectionLabel>
      <SimpleGrid cols={4} spacing={12} mb={16}>
        <Box>
          <NumberInput
            label="Interest rate"
            value={rate}
            onChange={(v) => setRate(Number(v) || 0)}
            suffix="% p.a."
            error={rateError}
            min={PRODUCT_LIMITS.rateMin}
            max={PRODUCT_LIMITS.rateMax}
            step={0.5}
            radius="md"
            size="xs"
          />
          {!rateError && (
            <Text fz={10} c="slate.4" mt={4}>
              Range: {PRODUCT_LIMITS.rateMin}%–{PRODUCT_LIMITS.rateMax}%
            </Text>
          )}
        </Box>
        <Select
          label="Interest type"
          value={interestType}
          onChange={(v) => setInterestType(v || "Fixed")}
          data={["Fixed", "Variable"]}
          radius="md"
          size="xs"
        />
        <Select
          label="Calculation method"
          value={calcMethod}
          onChange={(v) => setCalcMethod(v || "Reducing balance")}
          data={["Reducing balance", "Flat rate"]}
          radius="md"
          size="xs"
        />
        <TextInput
          type="date"
          label="Effective date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.currentTarget.value)}
          radius="md"
          size="xs"
        />
      </SimpleGrid>

      <SectionLabel>Charges and fees</SectionLabel>
      <Paper withBorder radius="md" p="sm" mb={16}>
        <SimpleGrid cols={4} spacing={12} mb={12}>
          <Box>
            <NumberInput
              label="Processing fee"
              value={processingFeePct}
              onChange={(v) => setProcessingFeePct(Number(v) || 0)}
              suffix="%"
              min={0}
              max={10}
              step={0.5}
              radius="md"
              size="xs"
            />
            {figures && (
              <Text fz={10} c="slate.4" mt={4}>
                = {zmw(figures.processingFee)}
              </Text>
            )}
          </Box>
          <Box>
            <NumberInput
              label="Tax (VAT) on fees"
              value={taxPct}
              onChange={(v) => setTaxPct(Number(v) || 0)}
              suffix="%"
              min={0}
              max={30}
              step={1}
              radius="md"
              size="xs"
            />
            {figures && (
              <Text fz={10} c="slate.4" mt={4}>
                = {zmw(figures.tax)}
              </Text>
            )}
          </Box>
          {insuranceEnabled && (
            <Box>
              <NumberInput
                label="Insurance premium"
                value={insurancePct}
                onChange={(v) => setInsurancePct(Number(v) || 0)}
                suffix="%"
                min={0}
                max={5}
                step={0.25}
                radius="md"
                size="xs"
              />
              {figures && (
                <Text fz={10} c="slate.4" mt={4}>
                  = {zmw(figures.insurance)}
                </Text>
              )}
            </Box>
          )}
        </SimpleGrid>

        <Group gap={20} mb={10}>
          <Checkbox
            size="xs"
            checked={insuranceEnabled}
            onChange={(e) => setInsuranceEnabled(e.currentTarget.checked)}
            label="Credit life insurance applicable"
          />
          <Checkbox
            size="xs"
            checked={waiverEnabled}
            onChange={(e) => setWaiverEnabled(e.currentTarget.checked)}
            label="Apply a waiver or discount"
          />
        </Group>

        {waiverEnabled && (
          <SimpleGrid cols={4} spacing={12} mb={4}>
            <NumberInput
              label="Waiver amount"
              value={waiverAmount}
              onChange={(v) => setWaiverAmount(Number(v) || 0)}
              suffix=" ZMW"
              min={0}
              radius="md"
              size="xs"
            />
            <TextInput
              label="Reason"
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.currentTarget.value)}
              placeholder="e.g. loyalty discount"
              radius="md"
              size="xs"
            />
          </SimpleGrid>
        )}

        {figures && (
          <Box mt={10} pt={10} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
            <SimRow label="Total charges (net of waiver)" value={zmw(figures.netCharges)} last strong />
          </Box>
        )}
      </Paper>

      <SectionLabel>Final loan terms</SectionLabel>
      <SimpleGrid cols={3} spacing={12} mb={16}>
        <Box>
          <NumberInput
            label="Amount"
            value={amount}
            onChange={(v) => setAmount(Number(v) || 0)}
            suffix=" ZMW"
            error={amountError}
            min={PRODUCT_LIMITS.amountMin}
            max={approvedAmount}
            step={500}
            radius="md"
            size="xs"
          />
          {!amountError && (
            <Text fz={10} c="slate.4" mt={4}>
              Capped at approved amount: {zmw(approvedAmount)}
            </Text>
          )}
        </Box>
        <Box>
          <NumberInput
            label="Tenure"
            value={tenure}
            onChange={(v) => setTenure(Number(v) || 0)}
            suffix=" months"
            error={tenureError}
            min={PRODUCT_LIMITS.tenureMin}
            max={PRODUCT_LIMITS.tenureMax}
            radius="md"
            size="xs"
          />
          {!tenureError && (
            <Text fz={10} c="slate.4" mt={4}>
              {PRODUCT_LIMITS.tenureMin}–{PRODUCT_LIMITS.tenureMax}
            </Text>
          )}
        </Box>
        <Select
          label="Repayment frequency"
          value={frequency}
          onChange={(v) => setFrequency(v || "Monthly")}
          data={["Monthly", "Bi-weekly"]}
          radius="md"
          size="xs"
        />
      </SimpleGrid>

      {figures ? (
        <>
          <SectionLabel>Final repayment schedule</SectionLabel>
          <Box
            style={{ border: "1.5px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}
            p="sm"
            bg="brand.0"
            mb={16}
          >
            <Group justify="space-between" mb={12}>
              <Text fz={13} fw={600} c="brand.9">Summary of Terms</Text>
              <Badge size="xs" radius="xl" color="brand" variant="light">
                Final terms for underwriting
              </Badge>
            </Group>
            <Paper radius="md" p="sm" bg="white" mb={12}>
              <SimpleGrid cols={4} spacing="md" verticalSpacing="sm">
                <Box>
                  <Text fz={11} c="slate.5">Gross loan amount</Text>
                  <Text fz={13} fw={600} c="slate.9">{zmw(amount)}</Text>
                </Box>
                <Box>
                  <Text fz={11} c="slate.5">Total charges & fees</Text>
                  <Text fz={13} fw={600} c="slate.9">{zmw(figures.netCharges)}</Text>
                </Box>
                <Box>
                  <Text fz={11} c="slate.5">Total interest</Text>
                  <Text fz={13} fw={600} c="slate.9">{zmw(figures.sim.totalInterest)}</Text>
                </Box>
                <Box>
                  <Text fz={11} c="slate.5">Total cost of credit</Text>
                  <Text fz={13} fw={600} c="slate.9">{zmw(figures.totalCostOfCredit)}</Text>
                </Box>
                <Box style={{ borderTop: "1px dashed var(--mantine-color-slate-2)", paddingTop: 8 }}>
                  <Text fz={11} c="slate.5">Net disbursement</Text>
                  <Text fz={14} fw={700} c="brand.7">{zmw(figures.netDisbursement)}</Text>
                </Box>
                <Box style={{ borderTop: "1px dashed var(--mantine-color-slate-2)", paddingTop: 8 }}>
                  <Text fz={11} c="slate.5">Est. {frequency.toLowerCase()} installment</Text>
                  <Text fz={14} fw={700} c="brand.7">{zmw(figures.sim.installment)}</Text>
                </Box>
                <Box style={{ borderTop: "1px dashed var(--mantine-color-slate-2)", paddingTop: 8 }}>
                  <Text fz={11} c="slate.5">First repayment</Text>
                  <Text fz={13} fw={600} c="slate.9">{fmtDate(figures.sim.first)}</Text>
                </Box>
                <Box style={{ borderTop: "1px dashed var(--mantine-color-slate-2)", paddingTop: 8 }}>
                  <Text fz={11} c="slate.5">Final repayment</Text>
                  <Text fz={13} fw={600} c="slate.9">{fmtDate(figures.sim.final)}</Text>
                </Box>
              </SimpleGrid>
            </Paper>
            <UnstyledButton onClick={() => setScheduleOpen(!scheduleOpen)}>
              <Group gap={4}>
                <Text fz={12} fw={500} c="brand.6">
                  {scheduleOpen ? "Hide repayment schedule" : "Preview repayment schedule"}
                </Text>
                {scheduleOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
              </Group>
            </UnstyledButton>
            {scheduleOpen && (
              <Box mt={10} style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }} bg="white">
                <Table fz={12}>
                  <Table.Thead bg="slate.0">
                    <Table.Tr>
                      <Table.Th style={th}>#</Table.Th>
                      <Table.Th style={th}>Due date</Table.Th>
                      <Table.Th style={th}>Principal</Table.Th>
                      <Table.Th style={th}>Interest</Table.Th>
                      <Table.Th style={th}>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {figures.sim.schedule.map((row) => (
                      <Table.Tr key={row.n}>
                        <Table.Td style={td}>{row.n}</Table.Td>
                        <Table.Td style={td}>{fmtDate(row.due)}</Table.Td>
                        <Table.Td style={td}>{zmw(row.principal)}</Table.Td>
                        <Table.Td style={td}>{zmw(row.interest)}</Table.Td>
                        <Table.Td style={td}>{zmw(row.balance)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {figures.sim.nPeriods > 6 && (
                  <Text fz={11.5} c="slate.4" px="sm" py={8}>
                    Showing first 6 of {figures.sim.nPeriods} payments.
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Paper withBorder radius="md" p="xl" ta="center" mb={24} style={{ borderStyle: "dashed" }}>
          <IconHelp size={20} color="var(--mantine-color-slate-4)" />
          <Text fz={13} fw={600} c="slate.9" mt={6}>
            Fix the highlighted fields above to calculate the final schedule.
          </Text>
        </Paper>
      )}

      <Button
        disabled={!valid}
        onClick={() => valid && setContinued(true)}
        color="brand"
        radius="md"
        rightSection={<IconArrowRight size={16} />}
      >
        Review and continue
      </Button>
    </Box>
  );
}

export function EnrichmentModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  onMinimize,
  embedded,
  readOnly,
}: EnrichmentModalProps) {
  const [section, setSection] = useState<Section>("enrichment");

  const policy = POLICY[DUMMY_PRESCREENING_CONTEXT.loanTypeId];
  const calc = calcEligibility({
    income: DUMMY_PRESCREENING_DATA.income.value,
    obligations: DUMMY_PRESCREENING_DATA.liabilities.obligations,
    maxDTI: policy.maxDTI,
    annualRate: DUMMY_PRESCREENING_CONTEXT.loanRate,
    tenureMonths: Number(applicationValues.tenureMonths) || 0,
    productMax: policy.productMax,
    creditScore: DUMMY_PRESCREENING_DATA.credit.value,
    minCreditScore: policy.minCreditScore,
  });
  const approvedAmount = Math.round(calc.eligibleAmount);

  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  if (embedded) {
    return (
      <EnrichmentWorkspace
        values={applicationValues}
        approvedAmount={approvedAmount}
        onSubmitReady={handleSubmitReady}
      />
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
      <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
               <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconBuildingBank size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Loan application
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Stage 3 — Loan enrichment
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
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        <ContextHeader
          values={applicationValues}
          applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
          approvedAmount={approvedAmount}
        />

        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} />

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
                  <Text fz={12.5} c="brand.9">
                    Submitted application data — read-only at this stage.
                  </Text>
                </Group>
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
            )}

            {section === "prescreening" && (
              <Box style={{ height: "100%" }}>
                <PreScreeningModal
                  embedded
                  readOnly
                  applicationValues={applicationValues}
                  opened={false}
                  onClose={() => {}}
                />
              </Box>
            )}

                       {section === "enrichment" && (
              <EnrichmentWorkspace
                values={applicationValues}
                approvedAmount={approvedAmount}
                onSubmitReady={handleSubmitReady}
              />
            )}
          </Box>
        </Box>
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
            disabled={!canSubmit}
            rightSection={<IconArrowRight size={16} />}
          >
            Submit
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}