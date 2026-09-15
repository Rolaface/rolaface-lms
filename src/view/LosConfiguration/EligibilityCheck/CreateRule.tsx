import { useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  Group,
  Text,
  Title,
  TextInput,
  Select,
  Checkbox,
  Slider,
  SegmentedControl,
  Table,
  ThemeIcon,
  ActionIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconGripVertical,
  IconShieldCheck,
  IconAlertTriangle,
  IconCircleX,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  STEPS,
  DEFAULT_WEIGHTS,
  Pill,
  SectionLabel,
  LabeledField,
  riskTier,
  type WeightItem,
  type Tone,
} from "./shared";

const INCOME_SOURCES: [string, number, boolean, boolean][] = [
  ["Salary", 100, true, true], ["Business Income", 70, true, true], ["Rental Income", 80, true, true],
  ["Other Income", 50, true, true],
];

interface CreditBand {
  id: string;
  grade: string;
  min: number;
  multiple: number;
  decision: string;
}

const DECISION_OPTIONS = ["Eligible", "Conditional", "Manual Review", "Decline"];

const DECISION_TONE: Record<string, Tone> = {
  Eligible: "low",
  Conditional: "medium",
  "Manual Review": "medium",
  Decline: "high",
};

const DEFAULT_CREDIT_BANDS: CreditBand[] = [
  { id: "cb1", grade: "A", min: 800, multiple: 7, decision: "Eligible" },
  { id: "cb2", grade: "B", min: 700, multiple: 4, decision: "Eligible" },
  { id: "cb3", grade: "C", min: 600, multiple: 2.5, decision: "Conditional" },
  { id: "cb4", grade: "D", min: 500, multiple: 1, decision: "Manual Review" },
  { id: "cb5", grade: "E", min: 0, multiple: 0, decision: "Decline" },
];

function creditBandFor(score: number, bands: CreditBand[]): CreditBand {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => score >= b.min) || sorted[sorted.length - 1] || DEFAULT_CREDIT_BANDS[DEFAULT_CREDIT_BANDS.length - 1];
}

const OBLIGATION_TYPES = ["Existing Loan Balance", "Existing Monthly EMI", "Credit Card Balance", "Overdraft Balance", "Mortgage Payment", "Other Monthly Debt"];

const COLLATERAL_TYPES = ["Property", "Vehicle", "Equipment", "Fixed Deposit", "Securities", "Guarantor", "Salary Assignment"];

interface CollateralItem {
  id: string;
  type: string;
  marketValue: number;
  haircutPct: number;
  maxLtvPct: number;
}

const DEFAULT_COLLATERAL_ITEMS: CollateralItem[] = [
  { id: "col1", type: "Property", marketValue: 500000, haircutPct: 20, maxLtvPct: 70 },
];

function collateralItemLimit(item: CollateralItem) {
  return item.marketValue * (1 - item.haircutPct / 100) * (item.maxLtvPct / 100);
}

const FORMULA_ITEMS: [string, string][] = [
  ["Salary Limit", "Basic Salary × Salary Multiple"],
  ["Affordability Limit", "(Eligible Income × Max EMI Ratio − Existing EMI) × Tenure × Affordability Buffer"],
  ["Credit Limit", "Basic Salary × Credit Score Multiple"],
  ["Existing Exposure Limit", "Affordability Limit × (1 − Existing Exposure Ratio)"],
  ["Collateral Limit", "Σ (Market Value × (1 − Haircut %) × Max LTV %)"],
  ["Product Limit", "Product Maximum (configured cap)"],
];

interface FormulaParams {
  otherIncomeRecognition: number;
  salaryMultiple: number;
  maxEmiRatio: number;
  affordabilityBuffer: number;
  exposureCap: number;
  productMax: number;
}

const DEFAULT_FORMULA_PARAMS: FormulaParams = {
  otherIncomeRecognition: 70,
  salaryMultiple: 5,
  maxEmiRatio: 30,
  affordabilityBuffer: 91,
  exposureCap: 60,
  productMax: 100000,
};

const FORMULA_SAMPLE = {
  basicSalary: 15000, netSalary: 12500, otherIncome: 3000,
  existingEMI: 2000, existingBalance: 20000, creditScore: 735, tenure: 24,
  onTime: 94, maxDPD: 12, npa: false,
};

function computeFormulaPreview(p: FormulaParams, creditMultiple: number, collateralLimit: number) {
  const eligibleIncome = FORMULA_SAMPLE.netSalary + FORMULA_SAMPLE.otherIncome * (p.otherIncomeRecognition / 100);
  const salaryLimit = FORMULA_SAMPLE.basicSalary * p.salaryMultiple;

  let maxEMI = eligibleIncome * (p.maxEmiRatio / 100) - FORMULA_SAMPLE.existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit = maxEMI * FORMULA_SAMPLE.tenure * (p.affordabilityBuffer / 100);

  const creditLimit = FORMULA_SAMPLE.basicSalary * creditMultiple;

  const exposureRatio = Math.min(FORMULA_SAMPLE.existingBalance / (eligibleIncome * 12 || 1), p.exposureCap / 100);
  const exposureLimit = affordabilityLimit * (1 - exposureRatio);

  const limits = [
    { name: "Salary Limit", value: salaryLimit },
    { name: "Affordability Limit", value: affordabilityLimit },
    { name: "Credit Limit", value: creditLimit },
    { name: "Existing Exposure Limit", value: exposureLimit },
    { name: "Collateral Limit", value: collateralLimit },
    { name: "Product Limit", value: p.productMax },
  ];
  const final = Math.min(...limits.map((l) => l.value));
  const limitingFactor = limits.find((l) => l.value === final)?.name || "";
  return { limits, final, limitingFactor };
}

const TIERS = [
  { t: "Tier 1 — Low Risk", label: "Low Risk", cond: "Credit Score ≥ 750 · On-Time Payment ≥ 95% · Max DPD ≤ 15 days", pct: 90, max: 100000, tone: "low" as const },
  { t: "Tier 2 — Medium Risk", label: "Medium Risk", cond: "Credit Score 650–749 · On-Time Payment ≥ 85%", pct: 75, max: 60000, tone: "medium" as const },
  { t: "Tier 3 — High Risk", label: "High Risk", cond: "Credit Score 550–649", pct: 50, max: 25000, tone: "high" as const },
  { t: "Tier 4 — Not Acceptable", label: "Not Acceptable", cond: "Credit Score < 550, or Active NPA", pct: 0, max: 0, tone: "high" as const },
];

const HARD_STOPS = ["Active NPA", "Fraud Flag", "Blacklisted Customer", "Credit Score Below Minimum", "Existing Loan Default", "Risk Profile Not Acceptable"];

function ReviewGroup({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return (
    <Paper radius="md" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
      <Text fz={12} fw={700} c="slate.5" mb="sm" tt="uppercase" style={{ letterSpacing: ".04em" }}>{title}</Text>
      <Stack gap={0}>
        {rows.map(([k, val], i) => (
          <Group key={k} justify="space-between" wrap="nowrap" py={8} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : undefined }}>
            <Text fz="sm" c="slate.5">{k}</Text>
            <Text fz="sm" fw={600} c="slate.8">{val}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function CreateRule({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [ruleName, setRuleName] = useState("Standard Personal Loan Eligibility");
  const [loanProduct, setLoanProduct] = useState<string | null>("Personal Loan");
  const [riskCategory, setRiskCategory] = useState<string | null>("Medium Risk");
  const [ruleStatus, setRuleStatus] = useState<string | null>("Draft");
  const [weights, setWeights] = useState<WeightItem[]>(DEFAULT_WEIGHTS);
  const totalWeight = weights.reduce((s, x) => s + Number(x.w || 0), 0);
  const [formulaMode, setFormulaMode] = useState<"flow" | "advanced">("flow");
  const [formulaParams, setFormulaParams] = useState<FormulaParams>(DEFAULT_FORMULA_PARAMS);
  const setFormulaParam = (k: keyof FormulaParams) => (v: number) => setFormulaParams((p) => ({ ...p, [k]: v }));
  const [creditBands, setCreditBands] = useState<CreditBand[]>(DEFAULT_CREDIT_BANDS);
  const sortedCreditBands = useMemo(() => [...creditBands].sort((a, b) => b.min - a.min), [creditBands]);
  const sampleCreditBand = useMemo(() => creditBandFor(FORMULA_SAMPLE.creditScore, creditBands), [creditBands]);
  const updateCreditBand = (id: string, patch: Partial<CreditBand>) =>
    setCreditBands((bands) => bands.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const addCreditBand = () => {
    const lowestMin = Math.min(...creditBands.map((b) => b.min));
    setCreditBands((bands) => [
      ...bands,
      { id: "cb" + Date.now(), grade: "New", min: Math.max(lowestMin - 100, 0), multiple: 0, decision: "Manual Review" },
    ]);
  };
  const removeCreditBand = (id: string) => setCreditBands((bands) => (bands.length > 1 ? bands.filter((b) => b.id !== id) : bands));
  const [collateralItems, setCollateralItems] = useState<CollateralItem[]>(DEFAULT_COLLATERAL_ITEMS);
  const updateCollateralItem = (id: string, patch: Partial<CollateralItem>) =>
    setCollateralItems((items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addCollateralItem = () =>
    setCollateralItems((items) => [...items, { id: "col" + Date.now(), type: COLLATERAL_TYPES[0], marketValue: 0, haircutPct: 20, maxLtvPct: 70 }]);
  const removeCollateralItem = (id: string) => setCollateralItems((items) => items.filter((it) => it.id !== id));
  const totalCollateralLimit = useMemo(() => collateralItems.reduce((sum, it) => sum + collateralItemLimit(it), 0), [collateralItems]);
  const formulaPreview = useMemo(
    () => computeFormulaPreview(formulaParams, sampleCreditBand.multiple, totalCollateralLimit),
    [formulaParams, sampleCreditBand, totalCollateralLimit]
  );
  const sampleRisk = useMemo(() => riskTier(FORMULA_SAMPLE.creditScore, FORMULA_SAMPLE.onTime, FORMULA_SAMPLE.maxDPD, FORMULA_SAMPLE.npa), []);
  const sampleTier = TIERS.find((t) => t.label === sampleRisk.label);
  const preApprovedPreview = sampleTier && sampleTier.pct > 0 ? Math.min(formulaPreview.final * (sampleTier.pct / 100), sampleTier.max) : 0;

  const reviewChecks = [
    { label: "Risk weights total exactly 100%", ok: totalWeight === 100 },
    { label: "At least one credit band is configured", ok: creditBands.length > 0 },
    { label: "At least one hard stop is configured", ok: HARD_STOPS.length > 0 },
    { label: "Rule name is set", ok: ruleName.trim().length > 0 },
  ];
  const reviewIssues = reviewChecks.filter((c) => !c.ok);
  const readyToPublish = reviewIssues.length === 0;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Box style={{ margin: "0 auto" }}>
      <Group justify="space-between" align="flex-start" mb={4}>
        <Box>
          {/* <Button variant="subtle" color="slate" size="xs" px={0} mb={6} onClick={onExit}>← Back to rules</Button> */}
          <Title order={3} c="slate.8" fw={700}>Create Eligibility Rule</Title>
        </Box>
        <Text fz="xs" c="slate.5">Step {step + 1} of {STEPS.length}</Text>
      </Group>

      {/* progress */}
      <Group gap={4} mt="md" mb="lg">
        {STEPS.map((_, i) => (
          <Box key={i} style={{ height: 4, flex: 1, borderRadius: 999, background: i <= step ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)" }} />
        ))}
      </Group>

      <SimpleGrid cols={{ base: 1, md: 12 }} spacing="lg">
        {/* step list */}
        <Box style={{ gridColumn: "span 3" }}>
          <Paper radius="md" p={6} style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <Stack gap={2}>
              {STEPS.map((s, i) => (
                <Button
                  key={s}
                  variant="subtle"
                  color={i === step ? "brand" : "slate"}
                  justify="flex-start"
                  size="sm"
                  fw={500}
                  onClick={() => setStep(i)}
                  style={{ background: i === step ? "var(--mantine-color-brand-0)" : "transparent" }}
                  leftSection={
                    <ThemeIcon
                      size={18}
                      radius="xl"
                      variant={i < step ? "filled" : "outline"}
                      color={i < step ? "brand" : i === step ? "brand" : "slate"}
                    >
                      {i < step ? <IconCheck size={11} /> : <Text fz={10}>{i + 1}</Text>}
                    </ThemeIcon>
                  }
                >
                  {s}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* step content */}
        <Box style={{ gridColumn: "span 9" }}>
          <Paper radius="md" p="lg" style={{ border: "1px solid var(--mantine-color-slate-2)", minHeight: 420 }}>
            {step === 0 && (
              <Box>
                <SectionLabel sub="Identify the rule and where it applies.">Basic Information</SectionLabel>
                <SimpleGrid cols={2} spacing="md">
                  <LabeledField label="Rule Name"><TextInput value={ruleName} onChange={(e) => setRuleName(e.target.value)} /></LabeledField>
                  <LabeledField label="Rule Version"><TextInput defaultValue="v1.0" disabled /></LabeledField>
                  <LabeledField label="Loan Product">
                    <Select value={loanProduct} onChange={setLoanProduct} data={["Personal Loan", "Staff Loan", "SME Loan", "Salary Advance", "Asset Finance", "Emergency Loan"]} />
                  </LabeledField>
                  <LabeledField label="Customer Type">
                    <Select defaultValue="Individual" data={["Individual", "Employee", "SME", "Corporate"]} />
                  </LabeledField>
                  <LabeledField label="Customer Segment">
                    <Select defaultValue="New Customer" data={["New Customer", "Existing Customer", "Repeat Borrower", "Preferred Customer"]} />
                  </LabeledField>
                  <LabeledField label="Risk Category">
                    <Select value={riskCategory} onChange={setRiskCategory} data={["Low Risk", "Medium Risk", "High Risk"]} />
                  </LabeledField>
                  <LabeledField label="Priority" hint="Lower number is evaluated first when multiple rules match."><TextInput type="number" defaultValue={1} /></LabeledField>
                  <LabeledField label="Rule Status">
                    <Select value={ruleStatus} onChange={setRuleStatus} data={["Draft", "Active", "Disabled"]} />
                  </LabeledField>
                  <LabeledField label="Effective From"><TextInput type="date" defaultValue="2026-09-05" /></LabeledField>
                  <LabeledField label="Effective Until"><TextInput type="date" /></LabeledField>
                </SimpleGrid>
              </Box>
            )}

            {step === 1 && (
              <Box>
                <SectionLabel sub="Add every income source this rule recognizes and the percentage counted towards eligibility.">Income Assessment</SectionLabel>
                <Table verticalSpacing="xs" fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      {["Income Source", "Recognition %", "Verification Required", "Included"].map((h) => (
                        <Table.Th key={h} c="slate.5" fw={600} style={{ borderColor: "var(--mantine-color-slate-2)" }}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {INCOME_SOURCES.map(([n, pct, ver, inc]) => (
                      <Table.Tr key={n}>
                        <Table.Td c="slate.8" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{n}</Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 200 }}>
                          <Group gap={10} wrap="nowrap">
                            <Slider defaultValue={pct} min={0} max={100} w={120} size="sm" color="brand" label={null} />
                            <Text fz="xs" c="slate.5">{pct}%</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}><Checkbox defaultChecked={ver} /></Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}><Checkbox defaultChecked={inc} /></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Text fz="xs" mt="md" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)", color: "var(--mantine-color-brand-7)" }}>
                  Eligible Monthly Income = sum of each included source × its recognition %.
                </Text>
              </Box>
            )}

            {step === 2 && (
              <Box>
                <SectionLabel sub="Cap how much of a customer's income can already be committed elsewhere.">Existing Obligations</SectionLabel>
                <SimpleGrid cols={2} spacing="xl">
                  <LabeledField label="Maximum Debt-to-Income Ratio" hint="Total monthly debt ÷ eligible monthly income × 100">
                    <Group gap="sm" wrap="nowrap">
                      <Slider defaultValue={40} min={10} max={70} color="brand" style={{ flex: 1 }} label={null} />
                      <Text fz="sm" fw={600} c="slate.8" w={40}>40%</Text>
                    </Group>
                  </LabeledField>
                  <LabeledField label="Maximum EMI-to-Income Ratio">
                    <Group gap="sm" wrap="nowrap">
                      <Slider defaultValue={30} min={10} max={60} color="brand" style={{ flex: 1 }} label={null} />
                      <Text fz="sm" fw={600} c="slate.8" w={40}>30%</Text>
                    </Group>
                  </LabeledField>
                </SimpleGrid>
                <Text fz="xs" fw={600} mt="xl" mb="sm" c="slate.8">Obligations counted</Text>
                <SimpleGrid cols={2} spacing="sm">
                  {OBLIGATION_TYPES.map((o) => (
                    <Checkbox key={o} defaultChecked label={<Text fz="sm" c="slate.6">{o}</Text>} />
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {step === 3 && (
              <Box>
                <SectionLabel sub="Define as many or as few credit bands as your policy needs. Each band's minimum score, multiple and decision routing are fully editable — changes update the Eligibility Formula and Pre-Approval steps live.">Credit &amp; Payment History</SectionLabel>
                <Table verticalSpacing="sm" fz="sm" mb="sm" style={{ tableLayout: "fixed" }}>
                  <Table.Thead>
                    <Table.Tr>
                      {[
                        ["Minimum Score", 110],
                        ["Applies To", 190],
                        ["Grade", 90],
                        ["Max Loan Multiple", 200],
                        ["Decision", 190],
                        ["", 48],
                      ].map(([h, w]) => (
                        <Table.Th key={h} c="slate.5" fw={600} style={{ borderColor: "var(--mantine-color-slate-2)", width: w }}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sortedCreditBands.map((band, i) => {
                      const isSample = band.id === sampleCreditBand.id;
                      const upper = i > 0 ? sortedCreditBands[i - 1].min - 1 : null;
                      const rangeLabel = upper === null ? `${band.min} and above` : `${band.min} – ${upper}`;
                      return (
                        <Table.Tr key={band.id} style={{ background: isSample ? "var(--mantine-color-yellow-0)" : undefined }}>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 110 }}>
                            <TextInput
                              type="number"
                              size="xs"
                              value={band.min}
                              onChange={(e) => updateCreditBand(band.id, { min: e.target.value === "" ? 0 : Number(e.target.value) })}
                            />
                          </Table.Td>
                          <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)", width: 190 }}>
                            <Group gap={6} wrap="nowrap">
                              <Text fz="xs" c="slate.5" style={{ whiteSpace: "nowrap" }}>{rangeLabel}</Text>
                              {isSample && <Pill tone="medium">Sample applicant</Pill>}
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 90 }}>
                            <TextInput size="xs" value={band.grade} onChange={(e) => updateCreditBand(band.id, { grade: e.target.value })} />
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 200 }}>
                            <Group gap={10} wrap="nowrap">
                              <Slider
                                value={band.multiple}
                                onChange={(v) => updateCreditBand(band.id, { multiple: v })}
                                min={0}
                                max={10}
                                step={0.5}
                                w={110}
                                size="sm"
                                color="brand"
                                label={null}
                              />
                              <Text fz="xs" c="slate.5" w={40}>{band.multiple}×</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 190 }}>
                            <Group gap={8} wrap="nowrap">
                              <Box
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  flexShrink: 0,
                                  background: `var(--mantine-color-${DECISION_TONE[band.decision] === "low" ? "green" : DECISION_TONE[band.decision] === "medium" ? "yellow" : "red"}-6)`,
                                }}
                              />
                              <Select
                                size="xs"
                                w={140}
                                value={band.decision}
                                onChange={(v) => v && updateCreditBand(band.id, { decision: v })}
                                data={DECISION_OPTIONS}
                              />
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)", width: 48 }}>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              disabled={creditBands.length <= 1}
                              onClick={() => removeCreditBand(band.id)}
                              aria-label="Remove band"
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>

                <Button variant="subtle" color="slate" size="xs" px={0} leftSection={<IconPlus size={13} />} onClick={addCreditBand}>
                  Add Band
                </Button>
              </Box>
            )}

            {step === 4 && (
              <Box>
                <SectionLabel sub="Add every collateral item this rule accepts. Each item's market value, haircut and max LTV convert to a limit that feeds the Eligibility Formula live.">Collateral</SectionLabel>
                <Table verticalSpacing="sm" fz="sm" mb="sm" style={{ tableLayout: "fixed" }}>
                  <Table.Thead>
                    <Table.Tr>
                      {[
                        ["Collateral Type", 170],
                        ["Market Value", 140],
                        ["Haircut %", 150],
                        ["Max LTV %", 150],
                        ["Collateral Limit", 150],
                        ["", 48],
                      ].map(([h, w]) => (
                        <Table.Th key={h} c="slate.5" fw={600} style={{ borderColor: "var(--mantine-color-slate-2)", width: w }}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {collateralItems.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <Select
                            size="xs"
                            value={item.type}
                            onChange={(v) => v && updateCollateralItem(item.id, { type: v })}
                            data={COLLATERAL_TYPES}
                          />
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <TextInput
                            type="number"
                            size="xs"
                            value={item.marketValue}
                            onChange={(e) => updateCollateralItem(item.id, { marketValue: e.target.value === "" ? 0 : Number(e.target.value) })}
                          />
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <Group gap={8} wrap="nowrap">
                            <Slider
                              value={item.haircutPct}
                              onChange={(v) => updateCollateralItem(item.id, { haircutPct: v })}
                              min={0}
                              max={100}
                              w={80}
                              size="sm"
                              color="brand"
                              label={null}
                            />
                            <Text fz="xs" c="slate.5" w={34}>{item.haircutPct}%</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <Group gap={8} wrap="nowrap">
                            <Slider
                              value={item.maxLtvPct}
                              onChange={(v) => updateCollateralItem(item.id, { maxLtvPct: v })}
                              min={0}
                              max={100}
                              w={80}
                              size="sm"
                              color="brand"
                              label={null}
                            />
                            <Text fz="xs" c="slate.5" w={34}>{item.maxLtvPct}%</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <Text fz="sm" fw={600} c="slate.8">ZMW {Math.round(collateralItemLimit(item)).toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeCollateralItem(item.id)} aria-label="Remove collateral item">
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {collateralItems.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={6} style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                          <Text fz="sm" c="slate.5" ta="center" py="md">No collateral configured — this rule evaluates as unsecured.</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>

                <Button variant="subtle" color="slate" size="xs" px={0} mb="lg" leftSection={<IconPlus size={13} />} onClick={addCollateralItem}>
                  Add Collateral
                </Button>

                <Paper radius="md" p="md" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
                  <Group justify="space-between">
                    <Text fz="xs" fw={600} c="slate.8">Total Collateral Limit ({collateralItems.length} item{collateralItems.length !== 1 ? "s" : ""})</Text>
                    <Text fz="sm" fw={700} c="brand.6">ZMW {Math.round(totalCollateralLimit).toLocaleString()}</Text>
                  </Group>
                  <Text fz={11} c="slate.5" mt={6}>Collateral Limit = Σ (Market Value × (1 − Haircut %) × Max LTV %). This total feeds the Eligibility Formula step.</Text>
                </Paper>
              </Box>
            )}

            {step === 5 && (
              <Box>
                <SectionLabel sub="Weight the factors that make up the composite risk score. Weights must total 100%.">Risk Scoring</SectionLabel>
                <Stack gap="md">
                  {weights.map((w, i) => (
                    <Group key={w.name} gap="sm" wrap="nowrap">
                      <IconGripVertical size={14} color="var(--mantine-color-slate-5)" style={{ cursor: "grab" }} />
                      <Text fz="sm" c="slate.8" w={170}>{w.name}</Text>
                      <Slider
                        value={w.w}
                        min={0}
                        max={50}
                        color="brand"
                        style={{ flex: 1 }}
                        label={null}
                        onChange={(v) => setWeights((ws) => ws.map((x, j) => (j === i ? { ...x, w: v } : x)))}
                      />
                      <Text fz="sm" fw={600} c="slate.8" w={40} ta="right">{w.w}%</Text>
                    </Group>
                  ))}
                </Stack>
                <Group gap={0} mt="md" style={{ height: 8, borderRadius: 999, overflow: "hidden", background: "var(--mantine-color-slate-2)" }}>
                  {weights.map((w, i) => (
                    <Box key={w.name} style={{ width: `${w.w}%`, height: "100%", background: `hsl(213, 55%, ${30 + i * 8}%)` }} />
                  ))}
                </Group>
                <Text fz="xs" mt="sm" fw={600} c={totalWeight === 100 ? "green.7" : "red.6"}>
                  Total: {totalWeight}% {totalWeight !== 100 && "— must equal 100% to publish"}
                </Text>
              </Box>
            )}

            {step === 6 && (
              <Box>
                <Group justify="space-between" align="flex-start" mb="md">
                  <SectionLabel sub="The eligible amount is always the lowest of the limits below. Values shown update live against a sample applicant.">Eligibility Formula</SectionLabel>
                  <SegmentedControl
                    size="xs"
                    color="brand"
                    value={formulaMode}
                    onChange={(v) => setFormulaMode(v as "flow" | "advanced")}
                    data={[{ label: "Flow view", value: "flow" }, { label: "Advanced editor", value: "advanced" }]}
                  />
                </Group>

                {formulaMode === "flow" ? (
                  <>
                    <Stack gap={0}>
                      {FORMULA_ITEMS.map(([name, formula], i, arr) => {
                        const limit = formulaPreview.limits.find((l) => l.name === name)!;
                        const isLimiting = name === formulaPreview.limitingFactor;
                        return (
                          <Box key={name}>
                            <Group
                              justify="space-between"
                              wrap="nowrap"
                              px="sm"
                              py={8}
                              style={{
                                border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`,
                                background: isLimiting ? "var(--mantine-color-yellow-0)" : "var(--mantine-color-white)",
                                borderRadius: "var(--mantine-radius-sm)",
                              }}
                            >
                              <Group gap="sm" wrap="nowrap">
                                <ThemeIcon size={20} radius="xl" variant="light" color="brand"><Text fz={10} fw={700}>{i + 1}</Text></ThemeIcon>
                                <Box>
                                  <Text fz="sm" c="slate.8">{name}</Text>
                                  <Text fz={11} c="slate.5" ff="monospace">{formula}</Text>
                                </Box>
                              </Group>
                              <Group gap={8} wrap="nowrap">
                                <Text fz="sm" fw={700} c="slate.8">ZMW {Math.round(limit.value).toLocaleString()}</Text>
                                {isLimiting && <Pill tone="medium">Binding</Pill>}
                              </Group>
                            </Group>
                            {i < arr.length - 1 && (
                              <Group justify="center" py={2}><IconChevronDown size={14} color="var(--mantine-color-slate-5)" /></Group>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                    <Group justify="space-between" gap="xs" mt="md" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                      <Group gap="xs">
                        <IconShieldCheck size={14} color="var(--mantine-color-brand-7)" />
                        <Text fz="xs" fw={600} c="brand.7">Final Eligible Amount = MIN(all limits above)</Text>
                      </Group>
                      <Text fz="sm" fw={700} c="brand.7">ZMW {Math.round(formulaPreview.final).toLocaleString()}</Text>
                    </Group>
                    <Text fz={11} c="slate.5" mt={6}>Worked example: Basic Salary ZMW 15,000 · Net Salary ZMW 12,500 · Other Income ZMW 3,000 · Credit Score 735 · Tenure 24 months.</Text>
                  </>
                ) : (
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Paper radius="md" p="lg" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                      <Text fz={13} fw={700} mb="md" c="slate.8">Formula Coefficients</Text>
                      <Stack gap="md">
                        <LabeledField label="Other Income Recognition %" hint="Share of non-salary income counted towards eligible income.">
                          <Group gap="sm" wrap="nowrap">
                            <Slider value={formulaParams.otherIncomeRecognition} onChange={setFormulaParam("otherIncomeRecognition")} min={0} max={100} color="brand" style={{ flex: 1 }} label={null} />
                            <Text fz="sm" fw={600} c="slate.8" w={44}>{formulaParams.otherIncomeRecognition}%</Text>
                          </Group>
                        </LabeledField>
                        <LabeledField label="Salary Multiple" hint="Basic Salary is multiplied by this to get the Salary Limit.">
                          <Group gap="sm" wrap="nowrap">
                            <Slider value={formulaParams.salaryMultiple} onChange={setFormulaParam("salaryMultiple")} min={1} max={10} step={0.5} color="brand" style={{ flex: 1 }} label={null} />
                            <Text fz="sm" fw={600} c="slate.8" w={44}>{formulaParams.salaryMultiple}×</Text>
                          </Group>
                        </LabeledField>
                        <LabeledField label="Max EMI-to-Income Ratio %" hint="Share of eligible income that can go towards EMI.">
                          <Group gap="sm" wrap="nowrap">
                            <Slider value={formulaParams.maxEmiRatio} onChange={setFormulaParam("maxEmiRatio")} min={10} max={60} color="brand" style={{ flex: 1 }} label={null} />
                            <Text fz="sm" fw={600} c="slate.8" w={44}>{formulaParams.maxEmiRatio}%</Text>
                          </Group>
                        </LabeledField>
                        <LabeledField label="Affordability Buffer %" hint="Safety margin applied to the affordability calculation.">
                          <Group gap="sm" wrap="nowrap">
                            <Slider value={formulaParams.affordabilityBuffer} onChange={setFormulaParam("affordabilityBuffer")} min={50} max={100} color="brand" style={{ flex: 1 }} label={null} />
                            <Text fz="sm" fw={600} c="slate.8" w={44}>{formulaParams.affordabilityBuffer}%</Text>
                          </Group>
                        </LabeledField>
                        <LabeledField label="Existing Exposure Cap %" hint="Maximum share of eligible income existing debt is allowed to consume.">
                          <Group gap="sm" wrap="nowrap">
                            <Slider value={formulaParams.exposureCap} onChange={setFormulaParam("exposureCap")} min={10} max={90} color="brand" style={{ flex: 1 }} label={null} />
                            <Text fz="sm" fw={600} c="slate.8" w={44}>{formulaParams.exposureCap}%</Text>
                          </Group>
                        </LabeledField>
                        <LabeledField label="Product Maximum (ZMW)" hint="Hard cap set by the loan product, regardless of other limits.">
                          <TextInput
                            type="number"
                            value={formulaParams.productMax}
                            onChange={(e) => setFormulaParam("productMax")(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </LabeledField>
                      </Stack>
                    </Paper>

                    <Paper radius="md" p="lg" style={{ border: "1px solid var(--mantine-color-slate-2)", alignSelf: "start" }}>
                      <Text fz={13} fw={700} mb="md" c="slate.8">Live Preview</Text>
                      <Stack gap={8}>
                        {formulaPreview.limits.map((l) => {
                          const isLimiting = l.name === formulaPreview.limitingFactor;
                          return (
                            <Group
                              key={l.name}
                              justify="space-between"
                              px="sm"
                              py={8}
                              style={{
                                border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`,
                                background: isLimiting ? "var(--mantine-color-yellow-0)" : "var(--mantine-color-white)",
                                borderRadius: "var(--mantine-radius-sm)",
                              }}
                            >
                              <Text fz="sm" c="slate.8">{l.name}</Text>
                              <Group gap={8}>
                                <Text fz="sm" fw={600} c="slate.8">ZMW {Math.round(l.value).toLocaleString()}</Text>
                                {isLimiting && <Pill tone="medium">Binding</Pill>}
                              </Group>
                            </Group>
                          );
                        })}
                      </Stack>
                      <Group justify="space-between" mt="md" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                        <Text fz="xs" fw={600} c="brand.7">Final Eligible Amount</Text>
                        <Text fz="sm" fw={700} c="brand.7">ZMW {Math.round(formulaPreview.final).toLocaleString()}</Text>
                      </Group>
                      <Text fz={11} c="slate.5" mt={8}>Recalculated instantly against the same sample applicant as the flow view.</Text>
                    </Paper>
                  </SimpleGrid>
                )}
              </Box>
            )}

            {step === 7 && (
              <Box>
                <SectionLabel sub="Once the eligible amount is known, the applicant's risk tier decides how much of it is offered automatically.">Pre-Approval Limits</SectionLabel>

                <Group gap="xs" mb="lg" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                  <IconShieldCheck size={14} color="var(--mantine-color-brand-7)" />
                  <Text fz="xs" fw={600} c="brand.7">Pre-Approved Amount = MIN(Eligible Amount × Tier %, Tier Maximum)</Text>
                </Group>

                <SimpleGrid cols={2} spacing="sm">
                  {TIERS.map((t) => {
                    const isSample = t.label === sampleRisk.label;
                    const isHardStop = t.pct === 0;
                    return (
                      <Paper
                        key={t.t}
                        radius="md"
                        p="md"
                        style={{
                          border: `1px solid ${isSample ? "var(--mantine-color-yellow-3)" : isHardStop ? "var(--mantine-color-red-2)" : "var(--mantine-color-slate-2)"}`,
                          background: isSample ? "var(--mantine-color-yellow-0)" : isHardStop ? "var(--mantine-color-red-0)" : "var(--mantine-color-white)",
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Text fz="sm" fw={600} c="slate.8">{t.t}</Text>
                          <Group gap={6}>
                            {isSample && <Pill tone="medium">Sample applicant</Pill>}
                            <Pill tone={t.tone}>{isHardStop ? "Hard Stop" : `${t.pct}%`}</Pill>
                          </Group>
                        </Group>
                        <Text fz="xs" c="slate.5">{t.cond}</Text>
                        <Text fz="xs" mt={8} c="slate.5">
                          Maximum: <Text span fw={600} c="slate.8">{isHardStop ? "Manual Review / Decline — see Decision Rules" : `ZMW ${t.max.toLocaleString()}`}</Text>
                        </Text>
                      </Paper>
                    );
                  })}
                </SimpleGrid>

                <Paper radius="md" p="lg" mt="lg" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                  <Text fz={13} fw={700} mb="sm" c="slate.8">Worked example — same sample applicant as the Eligibility Formula step</Text>
                  <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" style={{ textAlign: "center" }}>
                    <Box>
                      <Text fz="xs" c="slate.5">Eligible Amount</Text>
                      <Text fz="sm" fw={600} c="slate.8">ZMW {Math.round(formulaPreview.final).toLocaleString()}</Text>
                    </Box>
                    <Box>
                      <Text fz="xs" c="slate.5">Risk Tier</Text>
                      <Box mt={2}><Pill tone={sampleRisk.tone}>{sampleRisk.label}</Pill></Box>
                    </Box>
                    <Box>
                      <Text fz="xs" c="slate.5">Tier %</Text>
                      <Text fz="sm" fw={600} c="slate.8">{sampleTier ? `${sampleTier.pct}%` : "—"}</Text>
                    </Box>
                    <Box>
                      <Text fz="xs" c="slate.5">Pre-Approved Amount</Text>
                      <Text fz="sm" fw={700} c="brand.6">ZMW {Math.round(preApprovedPreview).toLocaleString()}</Text>
                    </Box>
                  </SimpleGrid>
                </Paper>
              </Box>
            )}

            {step === 8 && (
              <Box>
                <SectionLabel sub="Conditions that stop automatic approval outright.">Hard Stop Rules</SectionLabel>
                <Stack gap={8} mb="xl">
                  {HARD_STOPS.map((h) => (
                    <Group key={h} justify="space-between" px="sm" py={8} style={{ border: "1px solid var(--mantine-color-red-2)", background: "var(--mantine-color-red-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                      <Group gap={6}><IconCircleX size={14} color="var(--mantine-color-red-7)" /><Text fz="sm" c="red.8">IF {h} = Yes</Text></Group>
                      <Pill tone="high">Decline · Eligible Amount 0</Pill>
                    </Group>
                  ))}
                </Stack>
                <SectionLabel sub="Conditions routed to a human decision instead of an automatic one.">Manual Review Rules</SectionLabel>
                <Group justify="space-between" px="sm" py={8} style={{ border: "1px solid var(--mantine-color-yellow-3)", background: "var(--mantine-color-yellow-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                  <Group gap={6}><IconAlertTriangle size={14} color="var(--mantine-color-yellow-8)" /><Text fz="sm" c="yellow.9">IF Credit Score 600–649 AND DTI &gt; 40%</Text></Group>
                  <Pill tone="medium">Manual Review · 50% cap · Credit Manager</Pill>
                </Group>
              </Box>
            )}

            {step === 9 && (
              <Box>
                <SectionLabel sub="Confirm the configuration below. Publishing creates a new version — the active rule is never edited in place.">Review &amp; Publish</SectionLabel>

                <Paper
                  radius="md"
                  p="md"
                  mb="lg"
                  style={{
                    border: `1px solid ${readyToPublish ? "var(--mantine-color-green-3)" : "var(--mantine-color-orange-3)"}`,
                    background: readyToPublish ? "var(--mantine-color-green-0)" : "var(--mantine-color-orange-0)",
                  }}
                >
                  <Group gap={8}>
                    {readyToPublish ? (
                      <IconCheck size={16} color="var(--mantine-color-green-7)" />
                    ) : (
                      <IconAlertTriangle size={16} color="var(--mantine-color-orange-7)" />
                    )}
                    <Text fz="sm" fw={700} c={readyToPublish ? "green.8" : "orange.8"}>
                      {readyToPublish ? "Ready to publish" : `${reviewIssues.length} item${reviewIssues.length > 1 ? "s" : ""} need attention before publishing`}
                    </Text>
                  </Group>
                  {reviewIssues.length > 0 && (
                    <Stack gap={4} mt={8} pl={24}>
                      {reviewIssues.map((c) => (
                        <Text key={c.label} fz={12.5} c="orange.8">• {c.label}</Text>
                      ))}
                    </Stack>
                  )}
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <ReviewGroup
                    title="Rule Details"
                    rows={[
                      ["Rule Name", ruleName || "—"],
                      ["Loan Product", loanProduct || "—"],
                      ["Risk Category", riskCategory || "—"],
                      ["Status", <Pill tone={ruleStatus === "Active" ? "active" : ruleStatus === "Disabled" ? "disabled" : "draft"}>{ruleStatus}</Pill>],
                    ]}
                  />
                  <ReviewGroup
                    title="Income & Obligations"
                    rows={[
                      ["Income Sources Recognized", `${INCOME_SOURCES.length} configured`],
                      ["Obligation Types Tracked", `${OBLIGATION_TYPES.length} configured`],
                      ["Max EMI-to-Income Ratio", `${formulaParams.maxEmiRatio}%`],
                    ]}
                  />
                  <ReviewGroup
                    title="Credit & Risk Scoring"
                    rows={[
                      ["Credit Bands", `${creditBands.length} configured`],
                      ["Risk Weight Total", <Text span fz="sm" fw={700} c={totalWeight === 100 ? "green.7" : "red.6"}>{totalWeight}%</Text>],
                      ["Salary Multiple", `${formulaParams.salaryMultiple}×`],
                      ["Affordability Buffer", `${formulaParams.affordabilityBuffer}%`],
                    ]}
                  />
                  <ReviewGroup
                    title="Collateral"
                    rows={[
                      ["Collateral Items", collateralItems.length > 0 ? `${collateralItems.length} configured` : "None — unsecured"],
                      ["Total Collateral Limit", `ZMW ${Math.round(totalCollateralLimit).toLocaleString()}`],
                    ]}
                  />
                  <ReviewGroup
                    title="Pre-Approval & Decision Rules"
                    rows={[
                      ["Pre-Approval Tiers", `${TIERS.length} configured`],
                      ["Hard Stops", `${HARD_STOPS.length} configured`],
                      ["Sample Eligible Amount", `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`],
                      ["Sample Pre-Approved Amount", `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`],
                    ]}
                  />
                </SimpleGrid>

                <Group gap="sm" mt="xl">
                  <Button color="brand" radius="xl" disabled={!readyToPublish}>Publish as v1.0</Button>
                  <Button variant="default" radius="xl">Save as Draft</Button>
                </Group>
                {!readyToPublish && (
                  <Text fz={11.5} c="orange.7" mt={8}>Resolve the items above to enable publishing.</Text>
                )}
              </Box>
            )}
          </Paper>

          <Group justify="space-between" mt="md">
            <Button variant="subtle" color="slate" size="sm" leftSection={<IconChevronLeft size={15} />} disabled={step === 0} onClick={back}>Back</Button>
            {step < STEPS.length - 1 && (
              <Button color="brand" radius="xl" rightSection={<IconChevronRight size={15} />} onClick={next}>Next</Button>
            )}
          </Group>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

export default CreateRule;