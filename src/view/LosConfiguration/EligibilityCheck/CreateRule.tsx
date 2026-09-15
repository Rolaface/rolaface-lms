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
  Divider,
  RingProgress,
  Grid,
  Badge,
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
  IconInfoCircle,
  IconFileDescription,
  IconCurrencyDollar,
  IconScale,
  IconStar,
  IconBuildingBank,
  IconChartBar,
  IconMath,
  IconShield,
  IconX,
  IconClipboardCheck,
  IconTag,
  IconBan,
  IconCopy,
} from "@tabler/icons-react";
import {
  STEPS,
  DEFAULT_WEIGHTS,
  Pill,
  riskTier,
  type WeightItem,
  type Tone,
} from "./shared";

/* ── tiny reusable helpers ─────────────────────────────────── */
function Field({ label, hint, required, description, children }: { label: string; hint?: string; required?: boolean; description?: string; children: ReactNode }) {
  return (
    <Box>
      <Group gap={3} mb={3}>
        <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: ".04em" }}>
          {label} {required && <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>}
        </Text>
        {hint && (
          <Box title={hint} style={{ cursor: "help", display: "flex" }}>
            <IconInfoCircle size={10} color="var(--mantine-color-slate-4)" />
          </Box>
        )}
      </Group>
      {children}
      {description && <Text fz={9} c="slate.4" mt={4}>{description}</Text>}
    </Box>
  );
}

function SectionHead({ title, description }: { title: string; description: string }) {
  return (
    <Box mb="sm">
      <Text fz={13} fw={700} c="slate.8" lh={1.2}>{title}</Text>
      <Text fz={11} c="slate.5" mt={2}>{description}</Text>
    </Box>
  );
}

function InfoCard({ children, color = "brand" }: { children: ReactNode; color?: string }) {
  return (
    <Box px="sm" py={7} style={{ background: `var(--mantine-color-${color}-0)`, border: `1px solid var(--mantine-color-${color}-2)`, borderRadius: "var(--mantine-radius-sm)" }}>
      {children}
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Group justify="space-between" py={5} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
      <Text fz={11} c="slate.5">{label}</Text>
      <Text fz={11} fw={600} c="slate.8">{value}</Text>
    </Group>
  );
}

/* ── data ───────────────────────────────────────────────────── */
const INCOME_SOURCES: [string, number, boolean, boolean][] = [
  ["Salary", 100, true, true],
  ["Business Income", 70, true, true],
  ["Rental Income", 80, true, true],
  ["Other Income", 50, true, true],
];

interface CreditBand { id: string; grade: string; min: number; multiple: number; decision: string; }
const DECISION_OPTIONS = ["Eligible", "Conditional", "Manual Review", "Decline"];
const DECISION_TONE: Record<string, Tone> = { Eligible: "low", Conditional: "medium", "Manual Review": "medium", Decline: "high" };
const DECISION_DOT: Record<string, string> = { low: "green", medium: "yellow", high: "red" };

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

interface CollateralItem { id: string; type: string; marketValue: number; haircutPct: number; maxLtvPct: number; }
const DEFAULT_COLLATERAL_ITEMS: CollateralItem[] = [
  { id: "col1", type: "Property", marketValue: 500000, haircutPct: 20, maxLtvPct: 70 },
];
function collateralItemLimit(item: CollateralItem) {
  return item.marketValue * (1 - item.haircutPct / 100) * (item.maxLtvPct / 100);
}

const FORMULA_ITEMS: [string, string][] = [
  ["Salary Limit", "Basic Salary x Salary Multiple"],
  ["Affordability Limit", "(Eligible Income x Max EMI Ratio - Existing EMI) x Tenure x Affordability Buffer"],
  ["Credit Limit", "Basic Salary x Credit Score Multiple"],
  ["Existing Exposure Limit", "Affordability Limit x (1 - Existing Exposure Ratio)"],
  ["Collateral Limit", "Sum (Market Value x (1 - Haircut %) x Max LTV %)"],
  ["Product Limit", "Product Maximum (configured cap)"],
];

interface FormulaParams { otherIncomeRecognition: number; salaryMultiple: number; maxEmiRatio: number; affordabilityBuffer: number; exposureCap: number; productMax: number; }
const DEFAULT_FORMULA_PARAMS: FormulaParams = { otherIncomeRecognition: 70, salaryMultiple: 5, maxEmiRatio: 30, affordabilityBuffer: 91, exposureCap: 60, productMax: 100000 };
const FORMULA_SAMPLE = { basicSalary: 15000, netSalary: 12500, otherIncome: 3000, existingEMI: 2000, existingBalance: 20000, creditScore: 735, tenure: 24, onTime: 94, maxDPD: 12, npa: false };

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
  { t: "Tier 1 — Low Risk", label: "Low Risk", cond: "Credit Score >= 750 · On-Time Payment >= 95% · Max DPD <= 15 days", pct: 90, max: 100000, tone: "low" as const },
  { t: "Tier 2 — Medium Risk", label: "Medium Risk", cond: "Credit Score 650–749 · On-Time Payment >= 85%", pct: 75, max: 60000, tone: "medium" as const },
  { t: "Tier 3 — High Risk", label: "High Risk", cond: "Credit Score 550–649", pct: 50, max: 25000, tone: "high" as const },
  { t: "Tier 4 — Not Acceptable", label: "Not Acceptable", cond: "Credit Score < 550, or Active NPA", pct: 0, max: 0, tone: "high" as const },
];
interface HardStop { id: string; factor: string; operator: string; value: string; hint?: string; }
const DEFAULT_HARD_STOPS: HardStop[] = [
  { id: "hs1", factor: "DTI Ratio", operator: "Greater Than", value: "70%" },
  { id: "hs2", factor: "Fraud Flag Present", operator: "Is True", value: "Confirmed Fraud" },
  { id: "hs3", factor: "Active NPA", operator: "Equals", value: "Yes" },
  { id: "hs4", factor: "Existing Loan DPD", operator: "Greater Than or Equal", value: "90 Days" },
  { id: "hs5", factor: "Debt Service Ratio (DSR)", operator: "Greater Than", value: "80%" },
];
interface ManualReviewRule { id: string; factor: string; operator: string; value1: string; value2?: string; }
const DEFAULT_MANUAL_REVIEWS: ManualReviewRule[] = [
  { id: "mr1", factor: "Credit Score", operator: "Between", value1: "580", value2: "649" },
  { id: "mr2", factor: "Debt Service Ratio (DSR)", operator: "Between", value1: "50%", value2: "80%" },
  { id: "mr3", factor: "Existing Loan DPD", operator: "Between", value1: "30", value2: "89 Days" },
];
const RULE_FACTORS = ["KYC Verification Status", "Fraud Flag Present", "Blacklisted Customer", "Active NPA", "Existing Loan DPD", "Debt Service Ratio (DSR)", "Insolvency / Bankruptcy Status", "Application Misrepresentation Flag", "Credit Score", "DTI Ratio", "EMI-to-Income Ratio", "Loan Amount"];
const RULE_OPERATORS = ["Equals", "Is True", "In List", "Less Than", "Less Than or Equal", "Greater Than", "Greater Than or Equal", "Between"];

const STEP_ICONS = [
  IconFileDescription, IconCurrencyDollar, IconScale, IconStar,
  IconBuildingBank, IconChartBar, IconMath, IconShield, IconX, IconClipboardCheck,
];

/* ── main component ─────────────────────────────────────────── */
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
    setCreditBands((bands) => [...bands, { id: "cb" + Date.now(), grade: "New", min: Math.max(lowestMin - 100, 0), multiple: 0, decision: "Manual Review" }]);
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
  const [hardStops, setHardStops] = useState<HardStop[]>(DEFAULT_HARD_STOPS);
  const addHardStop = () => setHardStops(hs => [...hs, { id: "hs" + Date.now(), factor: RULE_FACTORS[0], operator: RULE_OPERATORS[0], value: "" }]);
  const updateHardStop = (id: string, patch: Partial<HardStop>) => setHardStops(hs => hs.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeHardStop = (id: string) => setHardStops(hs => hs.filter(x => x.id !== id));

  const [manualReviews, setManualReviews] = useState<ManualReviewRule[]>(DEFAULT_MANUAL_REVIEWS);
  const addManualReview = () => setManualReviews(mr => [...mr, { id: "mr" + Date.now(), factor: "Credit Score", operator: "Between", value1: "", value2: "" }]);
  const updateManualReview = (id: string, patch: Partial<ManualReviewRule>) => setManualReviews(mr => mr.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeManualReview = (id: string) => setManualReviews(mr => mr.filter(x => x.id !== id));

  const reviewChecks = [
    { label: "Risk weights total exactly 100%", ok: totalWeight === 100 },
    { label: "At least one credit band is configured", ok: creditBands.length > 0 },
    { label: "At least one hard stop is configured", ok: hardStops.length > 0 },
    { label: "Rule name is set", ok: ruleName.trim().length > 0 },
  ];
  const reviewIssues = reviewChecks.filter((c) => !c.ok);
  const readyToPublish = reviewIssues.length === 0;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* top header bar */}
      <Box
        px="lg"
        py="sm"
        mb="md"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="sm" align="center">
              <IconShieldCheck size={16} color="rgba(255,255,255,0.85)" />
              <Title order={5} c="white" fw={700}>{ruleName || "Untitled Rule"}</Title>
              <Box px={8} py={2} style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Text fz={10} fw={600} c="white">{ruleStatus || "Draft"}</Text>
              </Box>
            </Group>
            <Text fz={11} c="rgba(255,255,255,0.7)" mt={2}>{STEPS[step]}</Text>
          </Box>
          <Group gap="xs">
            <Button size="xs" variant="white" color="brand" radius="xl" fw={600}>Save Draft</Button>
            <Button size="xs" radius="xl" disabled={!readyToPublish} style={{ background: readyToPublish ? "white" : "rgba(255,255,255,0.3)", color: readyToPublish ? "var(--mantine-color-brand-7)" : "rgba(255,255,255,0.6)", fontWeight: 700, border: "none" }}>
              Publish v1.0
            </Button>
          </Group>
        </Group>
        {/* progress segments */}
        <Group gap={3} mt="sm">
          {STEPS.map((_, i) => (
            <Box key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i < step ? "rgba(255,255,255,0.9)" : i === step ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", transition: "background 0.2s" }} />
          ))}
        </Group>
      </Box>

      {/* body: sidebar + content */}
      <Box style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        {/* sidebar */}
        <Paper radius="lg" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-slate-0)", padding: "6px 5px", display: "flex", flexDirection: "column" }}>
          <Stack gap={1}>
            {STEPS.map((s, i) => {
              const Icon = STEP_ICONS[i];
              const done = i < step;
              const active = i === step;
              return (
                <Box
                  key={s}
                  onClick={() => setStep(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: "var(--mantine-radius-sm)",
                    cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-5) 100%)"
                      : done ? "var(--mantine-color-brand-0)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <ThemeIcon
                    size={20}
                    radius="sm"
                    style={{ flexShrink: 0, background: active ? "rgba(255,255,255,0.25)" : done ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-1)", border: "none" }}
                  >
                    {done
                      ? <IconCheck size={10} color="white" />
                      : <Icon size={10} color={active ? "white" : "var(--mantine-color-slate-5)"} />
                    }
                  </ThemeIcon>
                  <Text fz={11} fw={active ? 700 : done ? 600 : 500} c={active ? "white" : done ? "brand.6" : "slate.6"} style={{ lineHeight: 1.2 }} truncate>{s}</Text>
                </Box>
              );
            })}
          </Stack>
        </Paper>

        {/* content pane */}
        <Box style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Paper radius="lg" p="lg" style={{ border: "1px solid var(--mantine-color-slate-2)", flex: 1, overflowY: "auto" }}>

            {/* 0 — Basic Information */}
            {step === 0 && (
              <Box>
                <SectionHead title="Basic Information" description="Identify the rule, scope it to a product, and set its operational status." />
                <Box mb="md">
                  <Grid gutter="md">
                    <Grid.Col span={9}>
                      <Field label="Rule Name" required description="Customer-facing identifier applied across evaluation traces.">
                        <TextInput size="xs" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Standard Personal Loan Eligibility" />
                      </Field>
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Field label="Rule Version" description="Auto-incremented.">
                        <TextInput size="xs" defaultValue="v1.0" disabled leftSection={<IconTag size={12} color="var(--mantine-color-slate-4)" />} />
                      </Field>
                    </Grid.Col>
                  </Grid>
                </Box>
                <Divider mb="md" color="slate.1" />
                <Box mb="md">
                  <SimpleGrid cols={2} spacing="md">
                    <Field label="Loan Product"><Select size="xs" value={loanProduct} onChange={setLoanProduct} data={["Personal Loan", "Staff Loan", "SME Loan", "Salary Advance", "Asset Finance", "Emergency Loan"]} /></Field>
                    <Field label="Customer Type"><Select size="xs" defaultValue="Individual" data={["Individual", "Employee", "SME", "Corporate"]} /></Field>
                    <Field label="Customer Segment"><Select size="xs" defaultValue="New Customer" data={["New Customer", "Existing Customer", "Repeat Borrower", "Preferred Customer"]} /></Field>
                    <Field label="Risk Category"><Select size="xs" value={riskCategory} onChange={setRiskCategory} data={["Low Risk", "Medium Risk", "High Risk"]} /></Field>
                  </SimpleGrid>
                </Box>
                <Divider mb="md" color="slate.1" />
                <Grid gutter="md">
                   <Grid.Col span={2}>
                     <Field label="Priority" hint="Lower number is evaluated first when multiple rules match."><TextInput size="xs" type="number" defaultValue={1} /></Field>
                   </Grid.Col>
                   <Grid.Col span={4}>
                     <Field label="Rule Status"><Select size="xs" value={ruleStatus} onChange={setRuleStatus} data={["Draft", "Active", "Disabled"]} /></Field>
                   </Grid.Col>
                   <Grid.Col span={4}>
                     <Field label="Effective From"><TextInput size="xs" type="date" defaultValue={new Date().toISOString().split('T')[0]} /></Field>
                   </Grid.Col>
                   <Grid.Col span={4}>
                     <Field label="Effective Until"><TextInput size="xs" type="date" /></Field>
                   </Grid.Col>
                </Grid>
              </Box>
            )}

            {/* 1 — Income Assessment */}
            {step === 1 && (
              <Box>
                <SectionHead title="Income Assessment" description="Add every income source this rule recognizes and the percentage counted towards eligibility." />
                <Paper radius="sm" mb="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
                  <Table verticalSpacing="xs" fz="xs" highlightOnHover>
                    <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                      <Table.Tr>
                        {["Income Source", "Recognition %", "Verification Required", "Included"].map((h) => (
                          <Table.Th key={h} style={{ borderColor: "var(--mantine-color-slate-2)", fontSize: 10, fontWeight: 700, color: "var(--mantine-color-slate-5)", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {INCOME_SOURCES.map(([n, pct, ver, inc]) => (
                        <Table.Tr key={n}>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><Text fz="xs" fw={500} c="slate.7">{n}</Text></Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)", width: 200 }}>
                            <Group gap={8} wrap="nowrap" align="center">
                              <Slider defaultValue={pct as number} min={0} max={100} w={110} size="xs" color="brand" label={(v) => `${v}%`} />
                              <Text fz={10} fw={600} c="brand.6" w={28}>{pct}%</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><Checkbox defaultChecked={ver as boolean} size="xs" color="brand" /></Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><Checkbox defaultChecked={inc as boolean} size="xs" color="brand" /></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
                <InfoCard color="brand">
                  <Group gap={6}><IconInfoCircle size={11} color="var(--mantine-color-brand-6)" /><Text fz={11} c="brand.7" fw={500}>Eligible Monthly Income = sum of each included source x its recognition %.</Text></Group>
                </InfoCard>
              </Box>
            )}

            {/* 2 — Existing Obligations */}
            {step === 2 && (
              <Box>
                <SectionHead title="Existing Obligations" description="Cap how much of a customer's income can already be committed elsewhere." />
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Paper px="sm" py="sm" radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                    <Field label="Maximum Debt-to-Income Ratio" hint="Total monthly debt divided by eligible monthly income x 100">
                      <Group gap="sm" wrap="nowrap" mt={4}>
                        <Slider defaultValue={40} min={10} max={70} color="brand" style={{ flex: 1 }} label={(v) => `${v}%`} size="xs" />
                        <Text fz="xs" fw={700} c="brand.6" w={32}>40%</Text>
                      </Group>
                    </Field>
                  </Paper>
                  <Paper px="sm" py="sm" radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                    <Field label="Maximum EMI-to-Income Ratio">
                      <Group gap="sm" wrap="nowrap" mt={4}>
                        <Slider defaultValue={30} min={10} max={60} color="brand" style={{ flex: 1 }} label={(v) => `${v}%`} size="xs" />
                        <Text fz="xs" fw={700} c="brand.6" w={32}>30%</Text>
                      </Group>
                    </Field>
                  </Paper>
                </SimpleGrid>
                <Divider mb="sm" label={<Text fz={10} fw={700} c="slate.5" tt="uppercase" style={{ letterSpacing: ".04em" }}>Obligations Counted</Text>} labelPosition="left" />
                <SimpleGrid cols={3} spacing={6}>
                  {OBLIGATION_TYPES.map((o) => (
                    <Paper key={o} px="sm" py={8} radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                      <Checkbox defaultChecked size="xs" color="brand" label={<Text fz="xs" c="slate.6" fw={500}>{o}</Text>} />
                    </Paper>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* 3 — Credit & Payment History */}
            {step === 3 && (
              <Box>
                <SectionHead title="Credit & Payment History" description="Define credit bands — each band's minimum score, multiple and decision routing are fully editable." />
                <Paper radius="sm" mb="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
                  <Table verticalSpacing="xs" fz="xs" style={{ tableLayout: "fixed" }}>
                    <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                      <Table.Tr>
                        {[["Min Score", 100], ["Range", 170], ["Grade", 70], ["Loan Multiple", 200], ["Decision", 185], ["", 38]].map(([h, w]) => (
                          <Table.Th key={h} style={{ borderColor: "var(--mantine-color-slate-2)", width: w, fontSize: 10, fontWeight: 700, color: "var(--mantine-color-slate-5)", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sortedCreditBands.map((band, i) => {
                        const isSample = band.id === sampleCreditBand.id;
                        const upper = i > 0 ? sortedCreditBands[i - 1].min - 1 : null;
                        const rangeLabel = upper === null ? `${band.min}+` : `${band.min}–${upper}`;
                        const dotColor = DECISION_DOT[DECISION_TONE[band.decision] as string];
                        return (
                          <Table.Tr key={band.id} style={{ background: isSample ? "var(--mantine-color-yellow-0)" : undefined }}>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <TextInput size="xs" type="number" value={band.min} onChange={(e) => updateCreditBand(band.id, { min: e.target.value === "" ? 0 : Number(e.target.value) })} />
                            </Table.Td>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <Group gap={4} wrap="nowrap">
                                <Text fz={10} c="slate.5">{rangeLabel}</Text>
                                {isSample && <Pill tone="medium">Sample</Pill>}
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <TextInput size="xs" value={band.grade} onChange={(e) => updateCreditBand(band.id, { grade: e.target.value })} />
                            </Table.Td>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <Group gap={6} wrap="nowrap">
                                <Slider value={band.multiple} onChange={(v) => updateCreditBand(band.id, { multiple: v })} min={0} max={10} step={0.5} w={110} size="xs" color="brand" label={null} />
                                <Text fz={10} fw={600} c="brand.6" w={28}>{band.multiple}x</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <Group gap={5} wrap="nowrap">
                                <Box style={{ width: 6, height: 6, borderRadius: 99, flexShrink: 0, background: `var(--mantine-color-${dotColor}-5)` }} />
                                <Select size="xs" w={130} value={band.decision} onChange={(v) => v && updateCreditBand(band.id, { decision: v })} data={DECISION_OPTIONS} />
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                              <ActionIcon variant="subtle" color="red" size="xs" disabled={creditBands.length <= 1} onClick={() => removeCreditBand(band.id)}>
                                <IconTrash size={11} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Paper>
                <Button variant="subtle" color="slate" size="xs" leftSection={<IconPlus size={11} />} onClick={addCreditBand}>Add Band</Button>
              </Box>
            )}

            {/* 4 — Collateral */}
            {step === 4 && (
              <Box>
                <SectionHead title="Collateral" description="Add every collateral item this rule accepts. Market value, haircut and max LTV convert to a live limit." />
                <Paper radius="sm" mb="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
                  <Table verticalSpacing="xs" fz="xs" style={{ tableLayout: "fixed" }}>
                    <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                      <Table.Tr>
                        {[["Type", 150], ["Market Value", 130], ["Haircut %", 150], ["Max LTV %", 150], ["Limit", 120], ["", 38]].map(([h, w]) => (
                          <Table.Th key={h} style={{ borderColor: "var(--mantine-color-slate-2)", width: w, fontSize: 10, fontWeight: 700, color: "var(--mantine-color-slate-5)", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {collateralItems.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><Select size="xs" value={item.type} onChange={(v) => v && updateCollateralItem(item.id, { type: v })} data={COLLATERAL_TYPES} /></Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><TextInput size="xs" type="number" value={item.marketValue} onChange={(e) => updateCollateralItem(item.id, { marketValue: e.target.value === "" ? 0 : Number(e.target.value) })} /></Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                            <Group gap={6} wrap="nowrap">
                              <Slider value={item.haircutPct} onChange={(v) => updateCollateralItem(item.id, { haircutPct: v })} min={0} max={100} w={80} size="xs" color="orange" label={null} />
                              <Text fz={10} fw={600} c="orange.6" w={26}>{item.haircutPct}%</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                            <Group gap={6} wrap="nowrap">
                              <Slider value={item.maxLtvPct} onChange={(v) => updateCollateralItem(item.id, { maxLtvPct: v })} min={0} max={100} w={80} size="xs" color="brand" label={null} />
                              <Text fz={10} fw={600} c="brand.6" w={26}>{item.maxLtvPct}%</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><Text fz="xs" fw={700} c="brand.6">ZMW {Math.round(collateralItemLimit(item)).toLocaleString()}</Text></Table.Td>
                          <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}><ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeCollateralItem(item.id)}><IconTrash size={11} /></ActionIcon></Table.Td>
                        </Table.Tr>
                      ))}
                      {collateralItems.length === 0 && (
                        <Table.Tr><Table.Td colSpan={6}><Text fz="xs" c="slate.5" ta="center" py="sm">No collateral configured — this rule evaluates as unsecured.</Text></Table.Td></Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Paper>
                <Group justify="space-between" align="center">
                  <Button variant="subtle" color="slate" size="xs" leftSection={<IconPlus size={11} />} onClick={addCollateralItem}>Add Collateral</Button>
                  <InfoCard color="brand">
                    <Group gap={6}><Text fz={10} c="slate.5">Total Limit</Text><Text fz={12} fw={700} c="brand.6">ZMW {Math.round(totalCollateralLimit).toLocaleString()}</Text></Group>
                  </InfoCard>
                </Group>
                <Text fz={10} c="slate.4" mt={6}>Limit = Sum (Market Value x (1 - Haircut %) x Max LTV %). This total feeds the Eligibility Formula section.</Text>
              </Box>
            )}

            {/* 5 — Risk Scoring */}
            {step === 5 && (
              <Box>
                <SectionHead title="Risk Scoring" description="Weight the factors that make up the composite risk score. Weights must total 100%." />
                <SimpleGrid cols={2} spacing="md">
                  <Stack gap={6}>
                    {weights.map((w, i) => (
                      <Paper key={w.name} px="sm" py={8} radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                        <Group gap="sm" wrap="nowrap" align="center">
                          <IconGripVertical size={12} color="var(--mantine-color-slate-4)" style={{ cursor: "grab", flexShrink: 0 }} />
                          <Text fz="xs" c="slate.7" fw={500} style={{ flex: 1 }}>{w.name}</Text>
                          <Slider value={w.w} min={0} max={50} color="brand" style={{ width: 110 }} size="xs" label={null} onChange={(v) => setWeights((ws) => ws.map((x, j) => (j === i ? { ...x, w: v } : x)))} />
                          <Text fz="xs" fw={700} c="brand.6" w={32} ta="right">{w.w}%</Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  <Box>
                    <Paper p="md" radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", textAlign: "center" }}>
                      <RingProgress
                        size={120}
                        thickness={10}
                        roundCaps
                        sections={weights.map((w, i) => ({ value: w.w, color: `hsl(213, 55%, ${30 + i * 8}%)`, tooltip: `${w.name}: ${w.w}%` }))}
                        label={
                          <Box ta="center">
                            <Text fz={18} fw={800} c={totalWeight === 100 ? "brand.6" : "red.6"}>{totalWeight}%</Text>
                            <Text fz={9} c="slate.5">of 100%</Text>
                          </Box>
                        }
                      />
                      <Text fz={11} fw={600} mt={6} c={totalWeight === 100 ? "green.7" : "red.6"}>
                        {totalWeight === 100 ? "Weights balanced" : `${100 - totalWeight > 0 ? "+" : ""}${100 - totalWeight}% to balance`}
                      </Text>
                    </Paper>
                    <Stack gap={3} mt="xs">
                      {weights.map((w, i) => (
                        <Group key={w.name} gap={6} align="center">
                          <Box style={{ width: 8, height: 8, borderRadius: 2, background: `hsl(213, 55%, ${30 + i * 8}%)`, flexShrink: 0 }} />
                          <Text fz={10} c="slate.6" style={{ flex: 1 }}>{w.name}</Text>
                          <Text fz={10} fw={600} c="slate.7">{w.w}%</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Box>
                </SimpleGrid>
              </Box>
            )}

            {/* 6 — Eligibility Formula */}
            {step === 6 && (
              <Box>
                <Group justify="space-between" align="flex-start" mb="sm">
                  <SectionHead title="Eligibility Formula" description="The eligible amount is always the lowest of the limits below. Values update live." />
                  <SegmentedControl size="xs" color="brand" value={formulaMode} onChange={(v) => setFormulaMode(v as "flow" | "advanced")} data={[{ label: "Flow view", value: "flow" }, { label: "Advanced", value: "advanced" }]} />
                </Group>
                {formulaMode === "flow" ? (
                  <>
                    <Stack gap={0}>
                      {FORMULA_ITEMS.map(([name, formula], i, arr) => {
                        const limit = formulaPreview.limits.find((l) => l.name === name)!;
                        const isLimiting = name === formulaPreview.limitingFactor;
                        return (
                          <Box key={name}>
                            <Paper px="sm" py={7} radius="sm" style={{ border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`, background: isLimiting ? "var(--mantine-color-yellow-0)" : "var(--mantine-color-white)" }}>
                              <Group justify="space-between" wrap="nowrap">
                                <Group gap="sm" wrap="nowrap">
                                  <ThemeIcon size={18} radius="sm" variant="light" color={isLimiting ? "yellow" : "brand"}>
                                    <Text fz={9} fw={700}>{i + 1}</Text>
                                  </ThemeIcon>
                                  <Box>
                                    <Text fz="xs" fw={600} c={isLimiting ? "yellow.9" : "slate.8"}>{name}</Text>
                                    <Text fz={9} c="slate.4" ff="monospace">{formula}</Text>
                                  </Box>
                                </Group>
                                <Group gap={6} wrap="nowrap">
                                  <Text fz="xs" fw={700} c={isLimiting ? "yellow.9" : "slate.8"}>ZMW {Math.round(limit.value).toLocaleString()}</Text>
                                  {isLimiting && <Pill tone="medium">Binding</Pill>}
                                </Group>
                              </Group>
                            </Paper>
                            {i < arr.length - 1 && <Group justify="center" py={2}><IconChevronDown size={12} color="var(--mantine-color-slate-4)" /></Group>}
                          </Box>
                        );
                      })}
                    </Stack>
                    <Paper px="sm" py={8} mt="sm" radius="sm" style={{ background: "linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-5) 100%)" }}>
                      <Group justify="space-between">
                        <Group gap={6}><IconShieldCheck size={13} color="rgba(255,255,255,0.9)" /><Text fz="xs" fw={600} c="white">Final Eligible Amount = MIN(all limits above)</Text></Group>
                        <Text fz="sm" fw={800} c="white">ZMW {Math.round(formulaPreview.final).toLocaleString()}</Text>
                      </Group>
                    </Paper>
                    <Text fz={10} c="slate.4" mt={4}>Worked example: Basic Salary ZMW 15,000 · Net Salary ZMW 12,500 · Other Income ZMW 3,000 · Credit Score 735 · Tenure 24 months.</Text>
                  </>
                ) : (
                  <SimpleGrid cols={2} spacing="md">
                    <Paper radius="sm" p="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                      <Text fz={12} fw={700} mb="sm" c="slate.8">Formula Coefficients</Text>
                      <Stack gap="sm">
                        {[
                          { label: "Other Income Recognition %", key: "otherIncomeRecognition" as const, min: 0, max: 100, suffix: "%", hint: "Share of non-salary income counted." },
                          { label: "Salary Multiple", key: "salaryMultiple" as const, min: 1, max: 10, step: 0.5, suffix: "x", hint: "Basic Salary x this = Salary Limit." },
                          { label: "Max EMI-to-Income Ratio %", key: "maxEmiRatio" as const, min: 10, max: 60, suffix: "%", hint: "Share of income for EMI." },
                          { label: "Affordability Buffer %", key: "affordabilityBuffer" as const, min: 50, max: 100, suffix: "%", hint: "Safety margin on affordability." },
                          { label: "Existing Exposure Cap %", key: "exposureCap" as const, min: 10, max: 90, suffix: "%", hint: "Max income consumed by existing debt." },
                        ].map(({ label, key, min, max, step: s, suffix, hint }) => (
                          <Field key={key} label={label} hint={hint}>
                            <Group gap="sm" wrap="nowrap" mt={3}>
                              <Slider value={formulaParams[key]} onChange={setFormulaParam(key)} min={min} max={max} step={s} color="brand" style={{ flex: 1 }} size="xs" label={(v) => `${v}${suffix}`} />
                              <Text fz="xs" fw={600} c="brand.6" w={36}>{formulaParams[key]}{suffix}</Text>
                            </Group>
                          </Field>
                        ))}
                        <Field label="Product Maximum (ZMW)" hint="Hard cap set by the loan product.">
                          <TextInput size="xs" type="number" value={formulaParams.productMax} onChange={(e) => setFormulaParam("productMax")(e.target.value === "" ? 0 : Number(e.target.value))} mt={3} />
                        </Field>
                      </Stack>
                    </Paper>
                    <Paper radius="sm" p="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", alignSelf: "start" }}>
                      <Text fz={12} fw={700} mb="sm" c="slate.8">Live Preview</Text>
                      <Stack gap={4}>
                        {formulaPreview.limits.map((l) => {
                          const isLimiting = l.name === formulaPreview.limitingFactor;
                          return (
                            <Group key={l.name} justify="space-between" px="sm" py={6} style={{ border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`, background: isLimiting ? "var(--mantine-color-yellow-0)" : "transparent", borderRadius: "var(--mantine-radius-xs)" }}>
                              <Text fz="xs" c="slate.7">{l.name}</Text>
                              <Group gap={5}><Text fz="xs" fw={700} c="slate.8">ZMW {Math.round(l.value).toLocaleString()}</Text>{isLimiting && <Pill tone="medium">Binding</Pill>}</Group>
                            </Group>
                          );
                        })}
                      </Stack>
                      <Paper px="sm" py={7} mt="sm" radius="sm" style={{ background: "linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-5) 100%)" }}>
                        <Group justify="space-between"><Text fz="xs" fw={600} c="white">Final Eligible Amount</Text><Text fz="sm" fw={800} c="white">ZMW {Math.round(formulaPreview.final).toLocaleString()}</Text></Group>
                      </Paper>
                      <Text fz={10} c="slate.5" mt={6}>Recalculated instantly against the same sample applicant as the flow view.</Text>
                    </Paper>
                  </SimpleGrid>
                )}
              </Box>
            )}

            {/* 7 — Pre-Approval Limits */}
            {step === 7 && (
              <Box>
                <SectionHead title="Pre-Approval Limits" description="Once the eligible amount is known, the applicant's risk tier decides how much of it is offered automatically." />
                <InfoCard color="brand">
                  <Group gap={6}><IconShieldCheck size={12} color="var(--mantine-color-brand-6)" /><Text fz={11} fw={600} c="brand.7">Pre-Approved Amount = MIN(Eligible Amount x Tier %, Tier Maximum)</Text></Group>
                </InfoCard>
                <SimpleGrid cols={2} spacing="sm" mt="sm">
                  {TIERS.map((t) => {
                    const isSample = t.label === sampleRisk.label;
                    const isHardStop = t.pct === 0;
                    return (
                      <Paper key={t.t} radius="sm" px="sm" py="sm" style={{ border: `1px solid ${isSample ? "var(--mantine-color-yellow-3)" : isHardStop ? "var(--mantine-color-red-2)" : "var(--mantine-color-slate-2)"}`, background: isSample ? "var(--mantine-color-yellow-0)" : isHardStop ? "var(--mantine-color-red-0)" : "var(--mantine-color-white)" }}>
                        <Group justify="space-between" mb={4}><Text fz="xs" fw={700} c="slate.8">{t.t}</Text><Group gap={4}>{isSample && <Pill tone="medium">Sample</Pill>}<Pill tone={t.tone}>{isHardStop ? "Hard Stop" : `${t.pct}%`}</Pill></Group></Group>
                        <Text fz={10} c="slate.5" mb={4}>{t.cond}</Text>
                        <Text fz={10} c="slate.5">Max: <Text span fw={600} c="slate.7">{isHardStop ? "Manual Review / Decline" : `ZMW ${t.max.toLocaleString()}`}</Text></Text>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
                <Paper radius="sm" px="sm" py="sm" mt="sm" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-slate-0)" }}>
                  <Text fz={11} fw={700} mb={6} c="slate.7">Worked example — same sample applicant</Text>
                  <SimpleGrid cols={4} spacing="sm" style={{ textAlign: "center" }}>
                    {[["Eligible Amount", `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`], ["Risk Tier", sampleRisk.label], ["Tier %", sampleTier ? `${sampleTier.pct}%` : "—"], ["Pre-Approved", `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`]].map(([label, value], idx) => (
                      <Box key={label}>
                        <Text fz={9} c="slate.5" tt="uppercase" style={{ letterSpacing: ".04em" }}>{label}</Text>
                        <Text fz="xs" fw={700} c={idx === 3 ? "brand.6" : "slate.8"} mt={2}>{value}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Box>
            )}

            {/* 8 — Decision Rules */}
            {step === 8 && (
              <Box>
                <SectionHead title="Decision Rules" description="Define automatic decline triggers and manual review escalations." />
                <Paper radius="md" p="md" mb="md" style={{ border: '1px solid var(--mantine-color-red-2)', background: 'var(--mantine-color-red-0)' }}>
                  <Group justify="space-between" mb="md" align="center">
                    <Group gap="sm" align="center">
                      <Badge color="red.7" variant="outline" bg="white" radius="xl" size="md" tt="uppercase" style={{ borderWidth: 1 }} leftSection={<Box style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--mantine-color-red-7)', marginLeft: 6, marginRight: 0 }} />}>HARD STOP RULES</Badge>
                      <Text fz={12} c="slate.7">Conditions that stop automatic approval outright.</Text>
                    </Group>
                    <Group gap="sm" align="center">
                      <Badge color="red.7" variant="outline" bg="white" radius="xl" size="md" tt="none" style={{ borderWidth: 1, fontWeight: 600 }}>{hardStops.length} Rule{hardStops.length !== 1 ? 's' : ''} Configured</Badge>
                      <Badge color="red.7" variant="outline" bg="white" radius="xl" size="md" tt="none" style={{ borderWidth: 1, fontWeight: 700 }} leftSection={<IconBan size={14} style={{ marginLeft: 4 }} />}>Outcome: Auto Decline</Badge>
                    </Group>
                  </Group>
                  
                  <Stack gap={4}>
                    {hardStops.map((hs, i) => (
                      <Paper key={hs.id} radius="sm" px={8} py={4} style={{ background: 'white', border: '1px solid var(--mantine-color-slate-2)' }}>
                        <Group wrap="nowrap" gap="xs" align="center">
                          <Text fz={10} fw={700} c="slate.4" w={16} ta="center">{(i+1).toString().padStart(2, '0')}</Text>
                          <Select size="xs" value={hs.factor} onChange={(v) => v && updateHardStop(hs.id, { factor: v })} data={RULE_FACTORS} style={{ flex: 1.5 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                          <Select size="xs" value={hs.operator} onChange={(v) => v && updateHardStop(hs.id, { operator: v })} data={RULE_OPERATORS} style={{ flex: 1 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                          <TextInput size="xs" value={hs.value} onChange={(e) => updateHardStop(hs.id, { value: e.target.value })} rightSection={hs.hint ? <Text fz={9} c="slate.4" mr="xs">{hs.hint}</Text> : undefined} rightSectionWidth={80} style={{ flex: 1.5 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeHardStop(hs.id)}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  
                  <Group mt="md" justify="space-between" align="center">
                    <Button variant="outline" color="red.7" bg="white" radius="md" size="xs" leftSection={<IconPlus size={14} />} style={{ borderStyle: 'dashed', borderWidth: 1, height: 26 }} onClick={addHardStop}>Add Hard Stop Rule</Button>
                    <Text fz={10} c="slate.5">All hard stops trigger immediate evaluation termination</Text>
                  </Group>
                </Paper>

                <Paper radius="md" p="md" style={{ border: '1px solid var(--mantine-color-orange-2)', background: 'var(--mantine-color-orange-0)' }}>
                  <Group justify="space-between" mb="md" align="center">
                    <Group gap="sm" align="center">
                      <Badge color="orange.8" variant="outline" bg="white" radius="xl" size="md" tt="uppercase" style={{ borderWidth: 1 }} leftSection={<Box style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--mantine-color-orange-8)', marginLeft: 6, marginRight: 0 }} />}>MANUAL REVIEW RULES</Badge>
                      <Text fz={12} c="slate.7">Conditions routed to a human decision instead of an automatic one.</Text>
                    </Group>
                    <Group gap="sm" align="center">
                      <Badge color="orange.8" variant="outline" bg="white" radius="xl" size="md" tt="none" style={{ borderWidth: 1, fontWeight: 600 }}>{manualReviews.length} Rule{manualReviews.length !== 1 ? 's' : ''} Configured</Badge>
                      <Badge color="orange.8" variant="outline" bg="white" radius="xl" size="md" tt="none" style={{ borderWidth: 1, fontWeight: 700 }} leftSection={<IconAlertTriangle size={14} style={{ marginLeft: 4 }} />}>Outcome: Manual Review</Badge>
                    </Group>
                  </Group>
                  
                  <Stack gap={4}>
                    {manualReviews.map((mr, i) => (
                      <Paper key={mr.id} radius="sm" px={8} py={4} style={{ background: 'white', border: '1px solid var(--mantine-color-slate-2)' }}>
                        <Group wrap="nowrap" gap="xs" align="center">
                          <Text fz={10} fw={700} c="slate.4" w={16} ta="center">{(i+1).toString().padStart(2, '0')}</Text>
                          <Select size="xs" value={mr.factor} onChange={(v) => v && updateManualReview(mr.id, { factor: v })} data={RULE_FACTORS} style={{ flex: 1.5 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                          <Select size="xs" value={mr.operator} onChange={(v) => v && updateManualReview(mr.id, { operator: v })} data={RULE_OPERATORS} style={{ flex: 1 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                          <Group gap="xs" wrap="nowrap" style={{ flex: 1.5 }}>
                            <TextInput size="xs" value={mr.value1} onChange={(e) => updateManualReview(mr.id, { value1: e.target.value })} style={{ flex: 1 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                            {mr.operator === "Between" && (
                              <>
                                <Text fz={9} fw={700} c="slate.5">AND</Text>
                                <TextInput size="xs" value={mr.value2} onChange={(e) => updateManualReview(mr.id, { value2: e.target.value })} style={{ flex: 1 }} styles={{ input: { height: 24, minHeight: 24, fontSize: 11, borderRadius: 2 } }} />
                              </>
                            )}
                          </Group>
                          <ActionIcon variant="subtle" color="orange.8" size="sm" onClick={() => removeManualReview(mr.id)}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  <Group mt="md" justify="space-between" align="center">
                    <Button variant="outline" color="orange.8" bg="white" radius="md" size="xs" leftSection={<IconPlus size={14} />} style={{ borderStyle: 'dashed', borderWidth: 1, height: 26 }} onClick={addManualReview}>Add Manual Review Rule</Button>

                  </Group>
                </Paper>
              </Box>
            )}

            {/* 9 — Review & Publish */}
            {step === 9 && (
              <Box>
                <SectionHead title="Review & Publish" description="Confirm the configuration below. Publishing creates a new version — the active rule is never edited in place." />
                <Paper px="sm" py="sm" mb="md" radius="sm" style={{ border: `1px solid ${readyToPublish ? "var(--mantine-color-green-3)" : "var(--mantine-color-orange-3)"}`, background: readyToPublish ? "var(--mantine-color-green-0)" : "var(--mantine-color-orange-0)" }}>
                  <Group gap={7} mb={reviewIssues.length > 0 ? 6 : 0}>
                    {readyToPublish ? <IconCheck size={13} color="var(--mantine-color-green-7)" /> : <IconAlertTriangle size={13} color="var(--mantine-color-orange-7)" />}
                    <Text fz="xs" fw={700} c={readyToPublish ? "green.8" : "orange.8"}>{readyToPublish ? "Ready to publish" : `${reviewIssues.length} item${reviewIssues.length > 1 ? "s" : ""} need attention before publishing`}</Text>
                  </Group>
                  {reviewIssues.length > 0 && <Stack gap={2} pl={20}>{reviewIssues.map((c) => <Text key={c.label} fz={11} c="orange.8">• {c.label}</Text>)}</Stack>}
                </Paper>
                <SimpleGrid cols={2} spacing="sm">
                  {[
                    { title: "Rule Details", rows: [["Rule Name", ruleName || "—"], ["Loan Product", loanProduct || "—"], ["Risk Category", riskCategory || "—"], ["Status", ruleStatus || "—"]] as [string, ReactNode][] },
                    { title: "Income & Obligations", rows: [["Income Sources Recognized", `${INCOME_SOURCES.length} configured`], ["Obligation Types Tracked", `${OBLIGATION_TYPES.length} configured`], ["Max EMI-to-Income Ratio", `${formulaParams.maxEmiRatio}%`]] as [string, ReactNode][] },
                    { title: "Credit & Risk Scoring", rows: [["Credit Bands", `${creditBands.length} configured`], ["Risk Weight Total", <Text span fz="xs" fw={700} c={totalWeight === 100 ? "green.7" : "red.6"}>{totalWeight}%</Text>], ["Salary Multiple", `${formulaParams.salaryMultiple}x`], ["Affordability Buffer", `${formulaParams.affordabilityBuffer}%`]] as [string, ReactNode][] },
                    { title: "Collateral", rows: [["Collateral Items", collateralItems.length > 0 ? `${collateralItems.length} configured` : "None — unsecured"], ["Total Collateral Limit", `ZMW ${Math.round(totalCollateralLimit).toLocaleString()}`]] as [string, ReactNode][] },
                    { title: "Pre-Approval & Decision Rules", rows: [["Pre-Approval Tiers", `${TIERS.length} configured`], ["Hard Stops", `${hardStops.length} configured`], ["Sample Eligible Amount", `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`], ["Sample Pre-Approved Amount", `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`]] as [string, ReactNode][] },
                  ].map(({ title, rows }) => (
                    <Paper key={title} px="sm" py="sm" radius="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                      <Text fz={10} fw={700} c="slate.5" tt="uppercase" mb={6} style={{ letterSpacing: ".04em" }}>{title}</Text>
                      {rows.map(([k, val]) => <ReviewRow key={k as string} label={k as string} value={val} />)}
                    </Paper>
                  ))}
                </SimpleGrid>
                <Group gap="sm" mt="md">
                  <Button size="xs" color="brand" radius="xl" disabled={!readyToPublish} style={{ background: readyToPublish ? "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)" : undefined }}>Publish as v1.0</Button>
                  <Button size="xs" variant="default" radius="xl">Save as Draft</Button>
                </Group>
                {!readyToPublish && <Text fz={11} c="orange.7" mt={6}>Resolve the items above to enable publishing.</Text>}
              </Box>
            )}

          </Paper>

          {/* nav */}
          <Group justify="space-between" mt="sm">
            <Button variant="subtle" color="slate" size="sm" leftSection={<IconChevronLeft size={14} />} disabled={step === 0} onClick={back}>Back</Button>
            {step < STEPS.length - 1 && (
              <Button color="brand" size="sm" radius="xl" rightSection={<IconChevronRight size={14} />} onClick={next} style={{ background: "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)" }}>
                Continue
              </Button>
            )}
          </Group>
        </Box>
      </Box>
    </Box>
  );
}

export default CreateRule;
