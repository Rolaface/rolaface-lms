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
  Switch,
  Slider,
  SegmentedControl,
  Table,
  ThemeIcon,
  ActionIcon,
  Divider,
  RingProgress,
  Grid,
  Badge,
  Tabs,
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
  IconMinus,
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
  IconBriefcase,
  IconBuilding,
  IconDots,
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
function Field({
  label,
  hint,
  required,
  description,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Group gap={3} mb={3}>
        <Text
          fz={10}
          fw={600}
          c="slate.5"
          tt="uppercase"
          style={{ letterSpacing: ".04em" }}
        >
          {label}{" "}
          {required && (
            <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>
          )}
        </Text>
        {hint && (
          <Box title={hint} style={{ cursor: "help", display: "flex" }}>
            <IconInfoCircle size={10} color="var(--mantine-color-slate-4)" />
          </Box>
        )}
      </Group>
      {children}
      {description && (
        <Text fz={9} c="slate.4" mt={4}>
          {description}
        </Text>
      )}
    </Box>
  );
}

function SectionHead({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box mb="sm">
      <Text fz={13} fw={700} c="slate.8" lh={1.2}>
        {title}
      </Text>
      <Text fz={11} c="slate.5" mt={2}>
        {description}
      </Text>
    </Box>
  );
}

function InfoCard({
  children,
  color = "brand",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Box
      px="sm"
      py={7}
      style={{
        background: `var(--mantine-color-${color}-0)`,
        border: `1px solid var(--mantine-color-${color}-2)`,
        borderRadius: "var(--mantine-radius-sm)",
      }}
    >
      {children}
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Group
      justify="space-between"
      py={5}
      style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz={11} c="slate.5">
        {label}
      </Text>
      <Text fz={11} fw={600} c="slate.8">
        {value}
      </Text>
    </Group>
  );
}

/* ── data ───────────────────────────────────────────────────── */
const INCOME_SOURCES: [string, number, boolean, boolean][] = [
  ["Net Salary", 100, true, true],
  ["Business Income", 70, true, true],
  ["Rental Income", 80, true, true],
  ["Other Income", 50, true, true],
];

interface CreditBand {
  id: string;
  grade: string;
  min: number | string;
  multiple: number | string;
  basis: string;
  decision: string;
}
const DECISION_OPTIONS = [
  "Eligible",
  "Conditional",
  "Manual Review",
  "Decline",
];
const MULTIPLE_BASIS_OPTIONS = [
  "Basic Salary",
  "Net Salary",
  "Gross Income",
  "Total Income",
];
const DECISION_TONE: Record<string, Tone> = {
  Eligible: "low",
  Conditional: "medium",
  "Manual Review": "medium",
  Decline: "high",
};
const DECISION_DOT: Record<string, string> = {
  low: "green",
  medium: "yellow",
  high: "red",
};

const DEFAULT_CREDIT_BANDS: CreditBand[] = [
  {
    id: "cb1",
    grade: "A",
    min: 800,
    multiple: 7,
    basis: "Basic Salary",
    decision: "Eligible",
  },
  {
    id: "cb2",
    grade: "B",
    min: 700,
    multiple: 4,
    basis: "Basic Salary",
    decision: "Eligible",
  },
  {
    id: "cb3",
    grade: "C",
    min: 600,
    multiple: 2.5,
    basis: "Basic Salary",
    decision: "Conditional",
  },
  {
    id: "cb4",
    grade: "D",
    min: 500,
    multiple: 1,
    basis: "Basic Salary",
    decision: "Manual Review",
  },
  {
    id: "cb5",
    grade: "E",
    min: 0,
    multiple: 0,
    basis: "Basic Salary",
    decision: "Decline",
  },
];

function creditBandFor(score: number, bands: CreditBand[]): CreditBand {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return (
    sorted.find((b) => score >= b.min) ||
    sorted[sorted.length - 1] ||
    DEFAULT_CREDIT_BANDS[DEFAULT_CREDIT_BANDS.length - 1]
  );
}

const OBLIGATION_SOURCES: [string, boolean, boolean][] = [
  ["Existing Loan Balance", true, true],
  ["Existing Monthly EMI", true, true],
  ["Credit Card Balance", true, true],
  ["Overdraft Balance", true, true],
  ["Mortgage Payment", true, true],
  ["Other Monthly Debt", false, true],
];
const COLLATERAL_TYPES = [
  "Property",
  "Vehicle",
  "Equipment",
  "Fixed Deposit",
  "Securities",
  "Guarantor",
  "Salary Assignment",
];

interface CollateralItem {
  id: string;
  type: string;
  marketValue: number;
  haircutPct: number;
  maxLtvPct: number;
}
const DEFAULT_COLLATERAL_ITEMS: CollateralItem[] = [
  {
    id: "col1",
    type: "Property",
    marketValue: 500000,
    haircutPct: 20,
    maxLtvPct: 70,
  },
];
function collateralItemLimit(item: CollateralItem) {
  return (
    item.marketValue * (1 - item.haircutPct / 100) * (item.maxLtvPct / 100)
  );
}

const FORMULA_ITEMS: [string, string][] = [
  ["Salary Limit", "Basic Salary x Salary Multiple"],
  [
    "Affordability Limit",
    "(Eligible Income x Max EMI Ratio - Existing EMI) x Tenure x Affordability Buffer",
  ],
  ["Credit Limit", "Basic Salary x Credit Score Multiple"],
  [
    "Existing Exposure Limit",
    "Affordability Limit x (1 - Existing Exposure Ratio)",
  ],
  ["Collateral Limit", "Sum (Market Value x (1 - Haircut %) x Max LTV %)"],
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
  basicSalary: 15000,
  netSalary: 12500,
  otherIncome: 3000,
  existingEMI: 2000,
  existingBalance: 20000,
  creditScore: 735,
  tenure: 24,
  onTime: 94,
  maxDPD: 12,
  npa: false,
};

function computeFormulaPreview(
  p: FormulaParams,
  creditMultiple: number,
  collateralLimit: number,
) {
  const eligibleIncome =
    FORMULA_SAMPLE.netSalary +
    FORMULA_SAMPLE.otherIncome * (p.otherIncomeRecognition / 100);
  const salaryLimit = FORMULA_SAMPLE.basicSalary * p.salaryMultiple;
  let maxEMI =
    eligibleIncome * (p.maxEmiRatio / 100) - FORMULA_SAMPLE.existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit =
    maxEMI * FORMULA_SAMPLE.tenure * (p.affordabilityBuffer / 100);
  const creditLimit = FORMULA_SAMPLE.basicSalary * creditMultiple;
  const exposureRatio = Math.min(
    FORMULA_SAMPLE.existingBalance / (eligibleIncome * 12 || 1),
    p.exposureCap / 100,
  );
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
  {
    t: "Tier 1 — Low Risk",
    label: "Low Risk",
    cond: "Credit Score >= 750 · On-Time Payment >= 95% · Max DPD <= 15 days",
    pct: 90,
    max: 100000,
    tone: "low" as const,
  },
  {
    t: "Tier 2 — Medium Risk",
    label: "Medium Risk",
    cond: "Credit Score 650–749 · On-Time Payment >= 85%",
    pct: 75,
    max: 60000,
    tone: "medium" as const,
  },
  {
    t: "Tier 3 — High Risk",
    label: "High Risk",
    cond: "Credit Score 550–649",
    pct: 50,
    max: 25000,
    tone: "high" as const,
  },
  {
    t: "Tier 4 — Not Acceptable",
    label: "Not Acceptable",
    cond: "Credit Score < 550, or Active NPA",
    pct: 0,
    max: 0,
    tone: "high" as const,
  },
];
interface HardStop {
  id: string;
  factor: string;
  operator: string;
  value: string;
  hint?: string;
}
const DEFAULT_HARD_STOPS: HardStop[] = [
  { id: "hs1", factor: "DTI Ratio", operator: "Greater Than", value: "70%" },
  {
    id: "hs2",
    factor: "Fraud Flag Present",
    operator: "Is True",
    value: "Confirmed Fraud",
  },
  { id: "hs3", factor: "Active NPA", operator: "Equals", value: "Yes" },
  {
    id: "hs4",
    factor: "Existing Loan DPD",
    operator: "Greater Than or Equal",
    value: "90 Days",
  },
  {
    id: "hs5",
    factor: "Debt Service Ratio (DSR)",
    operator: "Greater Than",
    value: "80%",
  },
];
interface ManualReviewRule {
  id: string;
  factor: string;
  operator: string;
  value1: string;
  value2?: string;
}
const DEFAULT_MANUAL_REVIEWS: ManualReviewRule[] = [
  {
    id: "mr1",
    factor: "Credit Score",
    operator: "Between",
    value1: "580",
    value2: "649",
  },
  {
    id: "mr2",
    factor: "Debt Service Ratio (DSR)",
    operator: "Between",
    value1: "50%",
    value2: "80%",
  },
  {
    id: "mr3",
    factor: "Existing Loan DPD",
    operator: "Between",
    value1: "30",
    value2: "89 Days",
  },
];
const RULE_FACTORS = [
  "KYC Verification Status",
  "Fraud Flag Present",
  "Blacklisted Customer",
  "Active NPA",
  "Existing Loan DPD",
  "Debt Service Ratio (DSR)",
  "Insolvency / Bankruptcy Status",
  "Application Misrepresentation Flag",
  "Credit Score",
  "DTI Ratio",
  "EMI-to-Income Ratio",
  "Loan Amount",
];
const RULE_OPERATORS = [
  "Equals",
  "Is True",
  "In List",
  "Less Than",
  "Less Than or Equal",
  "Greater Than",
  "Greater Than or Equal",
  "Between",
];

const STEP_ICONS = [
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
];

/* ── main component ─────────────────────────────────────────── */
export function CreateRule({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [ruleName, setRuleName] = useState(
    "Standard Personal Loan Eligibility",
  );
  const [loanProduct, setLoanProduct] = useState<string | null>(
    "Personal Loan",
  );
  const [riskCategory, setRiskCategory] = useState<string | null>(
    "Medium Risk",
  );
  const [ruleStatus, setRuleStatus] = useState<string | null>("Draft");
  const [weights, setWeights] = useState<WeightItem[]>(DEFAULT_WEIGHTS);
  const totalWeight = weights.reduce((s, x) => s + Number(x.w || 0), 0);
  const [formulaParams, setFormulaParams] = useState<FormulaParams>(
    DEFAULT_FORMULA_PARAMS,
  );
  const setFormulaParam = (k: keyof FormulaParams) => (v: number) =>
    setFormulaParams((p) => ({ ...p, [k]: v }));

  const [incomeSources, setIncomeSources] =
    useState<[string, number, boolean, boolean][]>(INCOME_SOURCES);
  const updateIncomeSource = (
    index: number,
    patch: Partial<{ pct: number; ver: boolean; inc: boolean }>,
  ) => {
    setIncomeSources((sources) =>
      sources.map((s, i) => {
        if (i !== index) return s;
        let newInc = patch.inc !== undefined ? patch.inc : s[3];
        let newPct = patch.pct !== undefined ? patch.pct : s[1];
        let newVer = patch.ver !== undefined ? patch.ver : s[2];
        if (patch.inc === false) {
          newPct = 0;
          newVer = false;
        }
        return [s[0], newPct, newVer, newInc];
      }),
    );
  };

  const [obligationSources, setObligationSources] =
    useState<[string, boolean, boolean][]>(OBLIGATION_SOURCES);
  const updateObligationSource = (
    index: number,
    patch: Partial<{ ver: boolean; inc: boolean }>,
  ) => {
    setObligationSources((sources) =>
      sources.map((s, i) => {
        if (i !== index) return s;
        let newInc = patch.inc !== undefined ? patch.inc : s[2];
        let newVer = patch.ver !== undefined ? patch.ver : s[1];
        if (patch.inc === false) {
          newVer = false;
        }
        return [s[0], newVer, newInc];
      }),
    );
  };
  const [creditBands, setCreditBands] =
    useState<CreditBand[]>(DEFAULT_CREDIT_BANDS);
  const sortedCreditBands = useMemo(
    () => [...creditBands].sort((a, b) => Number(b.min) - Number(a.min)),
    [creditBands],
  );
  const sampleCreditBand = useMemo(
    () => creditBandFor(FORMULA_SAMPLE.creditScore, creditBands),
    [creditBands],
  );
  const updateCreditBand = (id: string, patch: Partial<CreditBand>) =>
    setCreditBands((bands) =>
      bands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  const addCreditBand = () => {
    const lowestMin = Math.min(...creditBands.map((b) => Number(b.min) || 0));
    setCreditBands((bands) => [
      ...bands,
      {
        id: "cb" + Date.now(),
        grade: "New",
        min: Math.max(lowestMin - 100, 0),
        multiple: 0,
        basis: "Basic Salary",
        decision: "Manual Review",
      },
    ]);
  };
  const removeCreditBand = (id: string) =>
    setCreditBands((bands) =>
      bands.length > 1 ? bands.filter((b) => b.id !== id) : bands,
    );

  const [internalBands, setInternalBands] = useState<CreditBand[]>([
    {
      id: "ib1",
      grade: "A",
      min: 80,
      multiple: 5,
      basis: "Basic Salary",
      decision: "Eligible",
    },
    {
      id: "ib2",
      grade: "B",
      min: 60,
      multiple: 3,
      basis: "Basic Salary",
      decision: "Eligible",
    },
    {
      id: "ib3",
      grade: "C",
      min: 40,
      multiple: 1.5,
      basis: "Basic Salary",
      decision: "Conditional",
    },
    {
      id: "ib4",
      grade: "D",
      min: 20,
      multiple: 0.5,
      basis: "Basic Salary",
      decision: "Manual Review",
    },
    {
      id: "ib5",
      grade: "E",
      min: 0,
      multiple: 0,
      basis: "Basic Salary",
      decision: "Decline",
    },
  ]);
  const sortedInternalBands = useMemo(
    () => [...internalBands].sort((a, b) => Number(b.min) - Number(a.min)),
    [internalBands],
  );
  const updateInternalBand = (id: string, patch: Partial<CreditBand>) =>
    setInternalBands((bands) =>
      bands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  const addInternalBand = () => {
    const lowestMin = Math.min(...internalBands.map((b) => Number(b.min) || 0));
    setInternalBands((bands) => [
      ...bands,
      {
        id: "ib" + Date.now(),
        grade: "New",
        min: Math.max(lowestMin - 10, 0),
        multiple: 0,
        basis: "Basic Salary",
        decision: "Manual Review",
      },
    ]);
  };
  const removeInternalBand = (id: string) =>
    setInternalBands((bands) =>
      bands.length > 1 ? bands.filter((b) => b.id !== id) : bands,
    );
  const [collateralItems, setCollateralItems] = useState<CollateralItem[]>(
    DEFAULT_COLLATERAL_ITEMS,
  );
  const updateCollateralItem = (id: string, patch: Partial<CollateralItem>) =>
    setCollateralItems((items) =>
      items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  const addCollateralItem = () =>
    setCollateralItems((items) => [
      ...items,
      {
        id: "col" + Date.now(),
        type: COLLATERAL_TYPES[0],
        marketValue: 0,
        haircutPct: 20,
        maxLtvPct: 70,
      },
    ]);
  const removeCollateralItem = (id: string) =>
    setCollateralItems((items) => items.filter((it) => it.id !== id));
  const totalCollateralLimit = useMemo(
    () => collateralItems.reduce((sum, it) => sum + collateralItemLimit(it), 0),
    [collateralItems],
  );
  const formulaPreview = useMemo(
    () =>
      computeFormulaPreview(
        formulaParams,
        sampleCreditBand.multiple,
        totalCollateralLimit,
      ),
    [formulaParams, sampleCreditBand, totalCollateralLimit],
  );
  const sampleRisk = useMemo(
    () =>
      riskTier(
        FORMULA_SAMPLE.creditScore,
        FORMULA_SAMPLE.onTime,
        FORMULA_SAMPLE.maxDPD,
        FORMULA_SAMPLE.npa,
      ),
    [],
  );
  const sampleTier = TIERS.find((t) => t.label === sampleRisk.label);
  const preApprovedPreview =
    sampleTier && sampleTier.pct > 0
      ? Math.min(formulaPreview.final * (sampleTier.pct / 100), sampleTier.max)
      : 0;
  const [hardStops, setHardStops] = useState<HardStop[]>(DEFAULT_HARD_STOPS);
  const addHardStop = () =>
    setHardStops((hs) => [
      ...hs,
      {
        id: "hs" + Date.now(),
        factor: RULE_FACTORS[0],
        operator: RULE_OPERATORS[0],
        value: "",
      },
    ]);
  const updateHardStop = (id: string, patch: Partial<HardStop>) =>
    setHardStops((hs) => hs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeHardStop = (id: string) =>
    setHardStops((hs) => hs.filter((x) => x.id !== id));

  const [manualReviews, setManualReviews] = useState<ManualReviewRule[]>(
    DEFAULT_MANUAL_REVIEWS,
  );
  const addManualReview = () =>
    setManualReviews((mr) => [
      ...mr,
      {
        id: "mr" + Date.now(),
        factor: "Credit Score",
        operator: "Between",
        value1: "",
        value2: "",
      },
    ]);
  const updateManualReview = (id: string, patch: Partial<ManualReviewRule>) =>
    setManualReviews((mr) =>
      mr.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  const removeManualReview = (id: string) =>
    setManualReviews((mr) => mr.filter((x) => x.id !== id));

  const reviewChecks = [
    { label: "Risk weights total exactly 100%", ok: totalWeight === 100 },
    {
      label: "At least one credit band is configured",
      ok: creditBands.length > 0,
    },
    { label: "At least one hard stop is configured", ok: hardStops.length > 0 },
    { label: "Rule name is set", ok: ruleName.trim().length > 0 },
  ];
  const reviewIssues = reviewChecks.filter((c) => !c.ok);
  const readyToPublish = reviewIssues.length === 0;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 0,
      }}
    >
      {/* top header bar */}
      <Box
        px="lg"
        py="sm"
        mb="md"
        style={{
          background:
            "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)",
          borderRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="sm" align="center">
              <IconShieldCheck size={16} color="rgba(255,255,255,0.85)" />
              <Title order={5} c="white" fw={700}>
                {ruleName || "Untitled Rule"}
              </Title>
              <Box
                px={8}
                py={2}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Text fz={10} fw={600} c="white">
                  {ruleStatus || "Draft"}
                </Text>
              </Box>
            </Group>
            <Text fz={11} c="rgba(255,255,255,0.7)" mt={2}>
              {STEPS[step]}
            </Text>
          </Box>
          <Group gap="xs">
            <Button
              size="xs"
              variant="white"
              color="brand"
              radius="xl"
              fw={600}
            >
              Save Draft
            </Button>
            <Button
              size="xs"
              radius="xl"
              disabled={!readyToPublish}
              style={{
                background: readyToPublish ? "white" : "rgba(255,255,255,0.3)",
                color: readyToPublish
                  ? "var(--mantine-color-brand-7)"
                  : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                border: "none",
              }}
            >
              Publish v1.0
            </Button>
          </Group>
        </Group>
        {/* progress segments */}
        <Group gap={3} mt="sm">
          {STEPS.map((_, i) => (
            <Box
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 99,
                background:
                  i < step
                    ? "rgba(255,255,255,0.9)"
                    : i === step
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(255,255,255,0.2)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </Group>
      </Box>

      {/* body: sidebar + content */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* sidebar */}
        <Paper
          radius="lg"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            background: "var(--mantine-color-slate-0)",
            padding: "6px 5px",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
                      : done
                        ? "var(--mantine-color-brand-0)"
                        : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <ThemeIcon
                    size={20}
                    radius="sm"
                    style={{
                      flexShrink: 0,
                      background: active
                        ? "rgba(255,255,255,0.25)"
                        : done
                          ? "var(--mantine-color-brand-6)"
                          : "var(--mantine-color-slate-1)",
                      border: "none",
                    }}
                  >
                    {done ? (
                      <IconCheck size={10} color="white" />
                    ) : (
                      <Icon
                        size={10}
                        color={
                          active ? "white" : "var(--mantine-color-slate-5)"
                        }
                      />
                    )}
                  </ThemeIcon>
                  <Text
                    fz={11}
                    fw={active ? 700 : done ? 600 : 500}
                    c={active ? "white" : done ? "brand.6" : "slate.6"}
                    style={{ lineHeight: 1.2 }}
                    truncate
                  >
                    {s}
                  </Text>
                </Box>
              );
            })}
          </Stack>
        </Paper>

        {/* content pane */}
        <Box style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Paper
            radius="lg"
            p="lg"
            style={{
              border: "1px solid var(--mantine-color-slate-2)",
              flex: 1,
              overflowY: "auto",
            }}
          >
            {/* 0 — Basic Information */}
            {step === 0 && (
              <Box>
                <Paper
                  radius="md"
                  style={{
                    border: "1px solid var(--mantine-color-slate-2)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    py={8}
                    px="sm"
                    style={{
                      borderBottom: "1px solid var(--mantine-color-slate-2)",
                      background: "transparent",
                    }}
                  >
                    <Title order={6} c="slate.8" fw={600}>
                      Basic information
                    </Title>
                  </Box>

                  <Grid
                    gutter={10}
                    py={10}
                    px="sm"
                    align="flex-start"
                    style={{
                      borderBottom: "1px solid var(--mantine-color-slate-2)",
                      margin: 0,
                    }}
                  >
                    <Grid.Col span={2}>
                      <Text fz={11} fw={600} c="slate.6">
                        Identity
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={10}>
                      <Grid gutter={10}>
                        <Grid.Col span={8}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Rule name{" "}
                              <span
                                style={{ color: "var(--mantine-color-red-6)" }}
                              >
                                *
                              </span>
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder="Standard Personal Loan Eligibility"
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Version
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            defaultValue="1.0"
                            disabled
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Priority
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            type="number"
                            defaultValue={1}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                      </Grid>
                    </Grid.Col>
                  </Grid>

                  <Grid
                    gutter={10}
                    py={10}
                    px="sm"
                    align="flex-start"
                    style={{
                      borderBottom: "1px solid var(--mantine-color-slate-2)",
                      margin: 0,
                    }}
                  >
                    <Grid.Col span={2}>
                      <Text fz={11} fw={600} c="slate.6">
                        Applies to
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={10}>
                      <Grid gutter={10} mb={8}>
                        <Grid.Col span={6}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Loan product
                            </Text>
                          </Box>
                          <Select
                            radius="md"
                            size="xs"
                            value={loanProduct}
                            onChange={setLoanProduct}
                            data={[
                              "Personal Loan",
                              "Staff Loan",
                              "SME Loan",
                              "Salary Advance",
                              "Asset Finance",
                              "Emergency Loan",
                            ]}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Maximum amount
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            type="number"
                            value={formulaParams.productMax}
                            onChange={(e) =>
                              setFormulaParam("productMax")(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                              )
                            }
                            rightSection={
                              <Text fz={9} c="dimmed" mr={8}>
                                ZMW
                              </Text>
                            }
                            rightSectionWidth={36}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Risk category
                            </Text>
                          </Box>
                          <Select
                            radius="md"
                            size="xs"
                            value={riskCategory}
                            onChange={setRiskCategory}
                            data={["Low Risk", "Medium Risk", "High Risk"]}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                      </Grid>
                      <Grid gutter={10}>
                        <Grid.Col span={3}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Customer type
                            </Text>
                          </Box>
                          <Select
                            radius="md"
                            size="xs"
                            defaultValue="Individual"
                            data={[
                              "Individual",
                              "Employee",
                              "SME",
                              "Corporate",
                            ]}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Customer segment
                            </Text>
                          </Box>
                          <Select
                            radius="md"
                            size="xs"
                            defaultValue="New Customer"
                            data={[
                              "New Customer",
                              "Existing Customer",
                              "Repeat Borrower",
                              "Preferred Customer",
                            ]}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                      </Grid>
                    </Grid.Col>
                  </Grid>

                  <Grid
                    gutter={10}
                    py={10}
                    px="sm"
                    align="flex-start"
                    style={{ margin: 0 }}
                  >
                    <Grid.Col span={2}>
                      <Text fz={11} fw={600} c="slate.6">
                        In force
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={10}>
                      <Grid gutter={10}>
                        <Grid.Col span={4}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Status
                            </Text>
                          </Box>
                          <Select
                            radius="md"
                            size="xs"
                            value={ruleStatus}
                            onChange={setRuleStatus}
                            data={["Draft", "Active", "Disabled"]}
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={4}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Effective from
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            type="date"
                            defaultValue={
                              new Date().toISOString().split("T")[0]
                            }
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={4}>
                          <Box mb={1}>
                            <Text fz={10} fw={500} c="slate.7">
                              Effective until
                            </Text>
                          </Box>
                          <TextInput
                            radius="md"
                            size="xs"
                            type="date"
                            styles={{ input: { minHeight: 26, height: 26 } }}
                          />
                        </Grid.Col>
                      </Grid>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Box>
            )}

            {/* 1 — Income Assessment */}
            {step === 1 && (
              <Box>
                <Group justify="space-between" align="flex-start" mb="xs">
                  <SectionHead
                    title="Income assessment"
                    description="Add every income source this rule recognizes and the share counted toward eligibility."
                  />
                  <Box>
                    <Text fz={10} fw={600} c="slate.7" mb={4} ta="right">
                      Income multiple
                    </Text>
                    <Group gap={6} wrap="nowrap">
                      <ActionIcon
                        size="md"
                        variant="default"
                        radius="md"
                        onClick={() =>
                          setFormulaParam("salaryMultiple")(
                            Math.max(1, formulaParams.salaryMultiple - 1),
                          )
                        }
                        style={{ borderColor: "var(--mantine-color-slate-3)" }}
                      >
                        <IconMinus
                          size={14}
                          color="var(--mantine-color-slate-6)"
                        />
                      </ActionIcon>
                      <TextInput
                        radius="md"
                        w={54}
                        type="number"
                        value={formulaParams.salaryMultiple}
                        onChange={(e) =>
                          setFormulaParam("salaryMultiple")(
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                        rightSection={
                          <Text fz={12} c="slate.4" mr={4}>
                            ×
                          </Text>
                        }
                        rightSectionWidth={20}
                        styles={{
                          input: {
                            textAlign: "center",
                            height: 32,
                            minHeight: 32,
                            fontSize: 13,
                            fontWeight: 500,
                            borderColor: "var(--mantine-color-slate-3)",
                          },
                        }}
                      />
                      <ActionIcon
                        size="md"
                        variant="default"
                        radius="md"
                        onClick={() =>
                          setFormulaParam("salaryMultiple")(
                            formulaParams.salaryMultiple + 1,
                          )
                        }
                        style={{ borderColor: "var(--mantine-color-slate-3)" }}
                      >
                        <IconPlus
                          size={14}
                          color="var(--mantine-color-slate-6)"
                        />
                      </ActionIcon>
                    </Group>
                  </Box>
                </Group>

                <Box mb="xs">
                  <Table verticalSpacing={4} fz={11} highlightOnHover>
                    <Table.Thead style={{ background: "transparent" }}>
                      <Table.Tr>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            paddingLeft: 8,
                          }}
                        >
                          Income Source
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Recognition %
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            width: 60,
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Verify
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            width: 70,
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Included
                        </Table.Th>
                        <Table.Th
                          style={{ borderColor: "transparent", width: 36 }}
                        ></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {incomeSources.map(([n, pct, ver, inc], index) => {
                        const Icon =
                          n === "Net Salary"
                            ? IconBriefcase
                            : n === "Business Income"
                              ? IconBuildingBank
                              : n === "Rental Income"
                                ? IconBuilding
                                : IconDots;
                        return (
                          <Table.Tr key={n as string}>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                paddingLeft: 8,
                              }}
                            >
                              <Group gap={8}>
                                <Icon
                                  size={12}
                                  color="var(--mantine-color-slate-5)"
                                />
                                <Text fz={11} fw={500} c="slate.8">
                                  {n as string}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                width: "50%",
                              }}
                            >
                              <Group gap={12} wrap="nowrap" align="center">
                                <Slider
                                  value={pct as number}
                                  onChange={(v) =>
                                    updateIncomeSource(index, { pct: v })
                                  }
                                  disabled={!inc}
                                  min={0}
                                  max={100}
                                  style={{ flex: 1 }}
                                  size="xs"
                                  color="brand"
                                  label={(v) => `${v}%`}
                                />
                                <Text fz={10} fw={600} c="slate.7" w={28}>
                                  {pct}%
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 60,
                              }}
                            >
                              <Switch
                                checked={ver as boolean}
                                onChange={(e) =>
                                  updateIncomeSource(index, {
                                    ver: e.currentTarget.checked,
                                  })
                                }
                                disabled={!inc}
                                size="xs"
                                color="brand"
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 70,
                              }}
                            >
                              <Switch
                                checked={inc as boolean}
                                onChange={(e) =>
                                  updateIncomeSource(index, {
                                    inc: e.currentTarget.checked,
                                  })
                                }
                                size="xs"
                                color="brand"
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 36,
                                paddingRight: 8,
                              }}
                            >
                              <ActionIcon
                                variant="subtle"
                                color="slate.4"
                                size="sm"
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Box>

                <InfoCard color="brand">
                  <Group gap={6} align="flex-start">
                    <IconInfoCircle
                      size={14}
                      color="var(--mantine-color-brand-6)"
                      style={{ marginTop: 2 }}
                    />
                    <Box style={{ flex: 1 }}>
                      <Text fz={11} c="brand.7" fw={500}>
                        Eligible Monthly Income = sum of each included source x
                        its recognition %.
                      </Text>
                      <Text fz={11} c="brand.7" fw={500}>
                        Income limit = Eligible Monthly Income x income
                        multiple.
                      </Text>
                    </Box>
                  </Group>
                </InfoCard>
              </Box>
            )}

            {/* 2 — Obligation Assessment */}
            {step === 2 && (
              <Box>
                <SectionHead
                  title="Obligation Assessment"
                  description="Cap how much of a customer's income can already be committed elsewhere."
                />
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Paper
                    px="sm"
                    py="sm"
                    radius="sm"
                    style={{ border: "1px solid var(--mantine-color-slate-2)" }}
                  >
                    <Field
                      label="Maximum Debt-to-Income Ratio"
                      hint="Total monthly debt divided by eligible monthly income x 100"
                    >
                      <Group gap="sm" wrap="nowrap" mt={4}>
                        <Slider
                          defaultValue={40}
                          min={10}
                          max={70}
                          color="brand"
                          style={{ flex: 1 }}
                          label={(v) => `${v}%`}
                          size="xs"
                        />
                        <Text fz="xs" fw={700} c="brand.6" w={32}>
                          40%
                        </Text>
                      </Group>
                    </Field>
                  </Paper>
                  <Paper
                    px="sm"
                    py="sm"
                    radius="sm"
                    style={{ border: "1px solid var(--mantine-color-slate-2)" }}
                  >
                    <Field label="Maximum EMI-to-Income Ratio">
                      <Group gap="sm" wrap="nowrap" mt={4}>
                        <Slider
                          defaultValue={30}
                          min={10}
                          max={60}
                          color="brand"
                          style={{ flex: 1 }}
                          label={(v) => `${v}%`}
                          size="xs"
                        />
                        <Text fz="xs" fw={700} c="brand.6" w={32}>
                          30%
                        </Text>
                      </Group>
                    </Field>
                  </Paper>
                </SimpleGrid>
                <Divider
                  mb="sm"
                  label={
                    <Text
                      fz={10}
                      fw={700}
                      c="slate.5"
                      tt="uppercase"
                      style={{ letterSpacing: ".04em" }}
                    >
                      Obligations Counted
                    </Text>
                  }
                  labelPosition="left"
                />
                <Box mb="xs">
                  <Table verticalSpacing={4} fz={11} highlightOnHover>
                    <Table.Thead style={{ background: "transparent" }}>
                      <Table.Tr>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            paddingLeft: 8,
                          }}
                        >
                          Obligation Source
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            width: 60,
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Verify
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "transparent",
                            width: 70,
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Included
                        </Table.Th>
                        <Table.Th
                          style={{ borderColor: "transparent", width: 36 }}
                        ></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {obligationSources.map(([n, ver, inc], index) => {
                        const Icon =
                          n === "Existing Loan Balance"
                            ? IconScale
                            : n === "Existing Monthly EMI"
                              ? IconMath
                              : n === "Credit Card Balance"
                                ? IconFileDescription
                                : n === "Overdraft Balance"
                                  ? IconAlertTriangle
                                  : n === "Mortgage Payment"
                                    ? IconBuilding
                                    : IconDots;
                        return (
                          <Table.Tr key={n as string}>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                paddingLeft: 8,
                              }}
                            >
                              <Group gap={8}>
                                <Icon
                                  size={12}
                                  color="var(--mantine-color-slate-5)"
                                />
                                <Text fz={11} fw={500} c="slate.8">
                                  {n as string}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 60,
                              }}
                            >
                              <Switch
                                checked={ver as boolean}
                                onChange={(e) =>
                                  updateObligationSource(index, {
                                    ver: e.currentTarget.checked,
                                  })
                                }
                                disabled={!inc}
                                size="xs"
                                color="brand"
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 70,
                              }}
                            >
                              <Switch
                                checked={inc as boolean}
                                onChange={(e) =>
                                  updateObligationSource(index, {
                                    inc: e.currentTarget.checked,
                                  })
                                }
                                size="xs"
                                color="brand"
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-1)",
                                textAlign: "center",
                                width: 36,
                                paddingRight: 8,
                              }}
                            >
                              <ActionIcon
                                variant="subtle"
                                color="slate.4"
                                size="sm"
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Box>
            )}

            {/* 3 — Credit Score Limit */}
            {step === 3 && (
              <Box>
                <Box mb="xs">
                  <Box
                    py={6}
                    px={8}
                    style={{
                      borderBottom: "1px solid var(--mantine-color-slate-2)",
                      background: "transparent",
                    }}
                  >
                    <Title order={6} c="slate.8" fw={600} mb={1}>
                      Credit Score Limit
                    </Title>
                    <Text fz={10} c="slate.5">
                      Define credit bands — each band's minimum score and credit
                      limit are fully editable.
                    </Text>
                  </Box>
                  <Table
                    verticalSpacing={4}
                    fz={11}
                    style={{ tableLayout: "fixed" }}
                  >
                    <Table.Thead style={{ background: "transparent" }}>
                      <Table.Tr>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 100,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            paddingLeft: 8,
                          }}
                        >
                          Min score
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 160,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Range
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 80,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Grade
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 250,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            textAlign: "center",
                          }}
                        >
                          <Box>Credit limit</Box>
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 170,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Decision
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 38,
                          }}
                        ></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sortedCreditBands.map((band, i) => {
                        const upper =
                          i > 0 ? sortedCreditBands[i - 1].min - 1 : null;
                        const rangeLabel =
                          upper === null
                            ? `${band.min}+`
                            : `${band.min}–${upper}`;
                        const dotColor =
                          DECISION_DOT[DECISION_TONE[band.decision] as string];
                        return (
                          <Table.Tr key={band.id}>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                                paddingLeft: 8,
                              }}
                            >
                              <TextInput
                                radius="md"
                                size="xs"
                                type="number"
                                value={band.min}
                                onChange={(e) =>
                                  updateCreditBand(band.id, {
                                    min: e.target.value,
                                  })
                                }
                                styles={{
                                  input: {
                                    minHeight: 26,
                                    height: 26,
                                    textAlign: "center",
                                    background: "transparent",
                                    borderColor: "var(--mantine-color-slate-3)",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                                color: "var(--mantine-color-slate-5)",
                              }}
                            >
                              {rangeLabel}
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Box
                                w={40}
                                h={26}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border:
                                    "1px solid var(--mantine-color-slate-3)",
                                  borderRadius: "var(--mantine-radius-md)",
                                  fontWeight: 700,
                                  color: "var(--mantine-color-slate-8)",
                                }}
                              >
                                {band.grade}
                              </Box>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Group
                                gap={0}
                                wrap="nowrap"
                                style={{
                                  border:
                                    "1px solid var(--mantine-color-slate-3)",
                                  borderRadius: "var(--mantine-radius-md)",
                                  overflow: "hidden",
                                }}
                              >
                                <TextInput
                                  radius={0}
                                  size="xs"
                                  variant="unstyled"
                                  w={46}
                                  type="number"
                                  value={band.multiple}
                                  onChange={(e) =>
                                    updateCreditBand(band.id, {
                                      multiple: e.target.value,
                                    })
                                  }
                                  styles={{
                                    input: {
                                      minHeight: 26,
                                      height: 26,
                                      textAlign: "center",
                                      fontWeight: 600,
                                    },
                                  }}
                                />
                                <Box
                                  px={8}
                                  style={{
                                    height: 26,
                                    borderLeft:
                                      "1px solid var(--mantine-color-slate-3)",
                                    borderRight:
                                      "1px solid var(--mantine-color-slate-3)",
                                    background: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text fz={10} c="dimmed">
                                    ×
                                  </Text>
                                </Box>
                                <Select
                                  radius={0}
                                  size="xs"
                                  variant="unstyled"
                                  style={{ flex: 1 }}
                                  value={band.basis}
                                  onChange={(v) =>
                                    v && updateCreditBand(band.id, { basis: v })
                                  }
                                  data={MULTIPLE_BASIS_OPTIONS}
                                  styles={{
                                    input: {
                                      minHeight: 26,
                                      height: 26,
                                      paddingLeft: 10,
                                    },
                                  }}
                                />
                              </Group>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Select
                                radius="md"
                                size="xs"
                                value={band.decision}
                                onChange={(v) =>
                                  v &&
                                  updateCreditBand(band.id, { decision: v })
                                }
                                data={DECISION_OPTIONS}
                                styles={{
                                  input: {
                                    minHeight: 26,
                                    height: 26,
                                    background: "transparent",
                                    borderColor: "var(--mantine-color-slate-3)",
                                  },
                                }}
                                leftSection={
                                  <Box
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 99,
                                      background: `var(--mantine-color-${dotColor}-5)`,
                                    }}
                                  />
                                }
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <ActionIcon
                                variant="subtle"
                                color="slate"
                                size="sm"
                                disabled={creditBands.length <= 1}
                                onClick={() => removeCreditBand(band.id)}
                              >
                                <IconTrash size={13} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                  <Box py={8} px={8}>
                    <Button
                      variant="subtle"
                      color="slate"
                      size="xs"
                      leftSection={<IconPlus size={12} />}
                      onClick={addCreditBand}
                    >
                      Add band
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* 4 — Collateral Limit */}
            {step === 4 && (
              <Box>
                <Box
                  py={6}
                  px={8}
                  style={{
                    borderBottom: "1px solid var(--mantine-color-slate-2)",
                    background: "transparent",
                  }}
                >
                  <Title order={6} c="slate.8" fw={600} mb={1}>
                    Collateral Limit
                  </Title>
                  <Text fz={10} c="slate.5">
                    Add every collateral item this rule accepts. Market value,
                    haircut and max LTV convert to a live limit.
                  </Text>
                </Box>
                <Box mb="xs">
                  <Table
                    verticalSpacing={4}
                    fz={11}
                    style={{ tableLayout: "fixed" }}
                  >
                    <Table.Thead style={{ background: "transparent" }}>
                      <Table.Tr>
                        {[
                          ["Type", 150],
                          ["Haircut %", 150],
                          ["Loan to Value %", 150],
                          ["", 36],
                        ].map(([h, w]) => (
                          <Table.Th
                            key={h}
                            style={{
                              borderColor: "transparent",
                              width: w,
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--mantine-color-slate-5)",
                              textTransform: "none",
                              paddingLeft: h === "Type" ? 8 : undefined,
                            }}
                          >
                            {h}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {collateralItems.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td
                            style={{
                              borderColor: "var(--mantine-color-slate-1)",
                              paddingLeft: 8,
                            }}
                          >
                            <Select
                              radius="md"
                              size="xs"
                              value={item.type}
                              onChange={(v) =>
                                v && updateCollateralItem(item.id, { type: v })
                              }
                              data={COLLATERAL_TYPES}
                              styles={{ input: { minHeight: 26, height: 26 } }}
                            />
                          </Table.Td>
                          <Table.Td
                            style={{
                              borderColor: "var(--mantine-color-slate-1)",
                            }}
                          >
                            <Text fz={11} fw={500}>
                              {item.haircutPct}%
                            </Text>
                          </Table.Td>
                          <Table.Td
                            style={{
                              borderColor: "var(--mantine-color-slate-1)",
                            }}
                          >
                            <Text fz={11} fw={500}>
                              {item.maxLtvPct}%
                            </Text>
                          </Table.Td>
                          <Table.Td
                            style={{
                              borderColor: "var(--mantine-color-slate-1)",
                              paddingRight: 8,
                            }}
                          >
                            <ActionIcon
                              variant="subtle"
                              color="slate.4"
                              size="sm"
                              onClick={() => removeCollateralItem(item.id)}
                            >
                              <IconTrash size={12} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {collateralItems.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6}>
                            <Text fz={11} c="slate.5" ta="center" py="xs">
                              No collateral configured — this rule evaluates as
                              unsecured.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Box>
                <Group justify="flex-start" align="center">
                  <Button
                    variant="subtle"
                    color="slate"
                    size="xs"
                    leftSection={<IconPlus size={11} />}
                    onClick={addCollateralItem}
                  >
                    Add Collateral
                  </Button>
                </Group>
                <InfoCard color="brand" mt="sm">
                  <Group gap={6}>
                    <IconInfoCircle
                      size={14}
                      color="var(--mantine-color-brand-6)"
                    />
                    <Text fz={12} fw={500} c="brand.8">
                      Collateral Limit = sum of each included item's Market
                      Value x (1 - Haircut %) x Loan to Value %.
                    </Text>
                  </Group>
                </InfoCard>
              </Box>
            )}

            {/* 5 — Internal Scoring Limit */}
            {step === 5 && (
              <Box>
                <Box mb="xs">
                  <Box
                    py={6}
                    px={8}
                    style={{
                      borderBottom: "1px solid var(--mantine-color-slate-2)",
                      background: "transparent",
                    }}
                  >
                    <Title order={6} c="slate.8" fw={600} mb={1}>
                      Internal Scoring Limit
                    </Title>
                    <Text fz={10} c="slate.5">
                      Define scoring bands — each band's minimum score and
                      credit limit are fully editable. Score is out of 100.
                    </Text>
                  </Box>
                  <Table
                    verticalSpacing={4}
                    fz={11}
                    style={{ tableLayout: "fixed" }}
                  >
                    <Table.Thead style={{ background: "transparent" }}>
                      <Table.Tr>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 100,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            paddingLeft: 8,
                          }}
                        >
                          Min score
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 160,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Range
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 80,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Grade
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 250,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                            textAlign: "center",
                          }}
                        >
                          <Box>Credit limit</Box>
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 170,
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--mantine-color-slate-5)",
                            textTransform: "none",
                          }}
                        >
                          Decision
                        </Table.Th>
                        <Table.Th
                          style={{
                            borderColor: "var(--mantine-color-slate-2)",
                            width: 38,
                          }}
                        ></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sortedInternalBands.map((band, i) => {
                        const upper =
                          i > 0 ? sortedInternalBands[i - 1].min - 1 : null;
                        const rangeLabel =
                          upper === null
                            ? `${band.min}+`
                            : `${band.min}–${upper}`;
                        const dotColor =
                          DECISION_DOT[DECISION_TONE[band.decision] as string];
                        return (
                          <Table.Tr key={band.id}>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                                paddingLeft: 8,
                              }}
                            >
                              <TextInput
                                radius="md"
                                size="xs"
                                type="number"
                                value={band.min}
                                onChange={(e) =>
                                  updateInternalBand(band.id, {
                                    min: e.target.value,
                                  })
                                }
                                styles={{
                                  input: {
                                    minHeight: 26,
                                    height: 26,
                                    textAlign: "center",
                                    background: "transparent",
                                    borderColor: "var(--mantine-color-slate-3)",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                                color: "var(--mantine-color-slate-5)",
                              }}
                            >
                              {rangeLabel}
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Box
                                w={40}
                                h={26}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border:
                                    "1px solid var(--mantine-color-slate-3)",
                                  borderRadius: "var(--mantine-radius-md)",
                                  fontWeight: 700,
                                  color: "var(--mantine-color-slate-8)",
                                }}
                              >
                                {band.grade}
                              </Box>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Group
                                gap={0}
                                wrap="nowrap"
                                style={{
                                  border:
                                    "1px solid var(--mantine-color-slate-3)",
                                  borderRadius: "var(--mantine-radius-md)",
                                  overflow: "hidden",
                                }}
                              >
                                <TextInput
                                  radius={0}
                                  size="xs"
                                  variant="unstyled"
                                  w={46}
                                  type="number"
                                  value={band.multiple}
                                  onChange={(e) =>
                                    updateInternalBand(band.id, {
                                      multiple: e.target.value,
                                    })
                                  }
                                  styles={{
                                    input: {
                                      minHeight: 26,
                                      height: 26,
                                      textAlign: "center",
                                      fontWeight: 600,
                                    },
                                  }}
                                />
                                <Box
                                  px={8}
                                  style={{
                                    height: 26,
                                    borderLeft:
                                      "1px solid var(--mantine-color-slate-3)",
                                    borderRight:
                                      "1px solid var(--mantine-color-slate-3)",
                                    background: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text fz={10} c="dimmed">
                                    ×
                                  </Text>
                                </Box>
                                <Select
                                  radius={0}
                                  size="xs"
                                  variant="unstyled"
                                  style={{ flex: 1 }}
                                  value={band.basis}
                                  onChange={(v) =>
                                    v &&
                                    updateInternalBand(band.id, { basis: v })
                                  }
                                  data={MULTIPLE_BASIS_OPTIONS}
                                  styles={{
                                    input: {
                                      minHeight: 26,
                                      height: 26,
                                      paddingLeft: 10,
                                    },
                                  }}
                                />
                              </Group>
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <Select
                                radius="md"
                                size="xs"
                                value={band.decision}
                                onChange={(v) =>
                                  v &&
                                  updateInternalBand(band.id, { decision: v })
                                }
                                data={DECISION_OPTIONS}
                                styles={{
                                  input: {
                                    minHeight: 26,
                                    height: 26,
                                    background: "transparent",
                                    borderColor: "var(--mantine-color-slate-3)",
                                  },
                                }}
                                leftSection={
                                  <Box
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 99,
                                      background: `var(--mantine-color-${dotColor}-5)`,
                                    }}
                                  />
                                }
                              />
                            </Table.Td>
                            <Table.Td
                              style={{
                                borderColor: "var(--mantine-color-slate-2)",
                              }}
                            >
                              <ActionIcon
                                variant="subtle"
                                color="slate"
                                size="sm"
                                disabled={internalBands.length <= 1}
                                onClick={() => removeInternalBand(band.id)}
                              >
                                <IconTrash size={13} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                  <Box py={8} px={8}>
                    <Button
                      variant="subtle"
                      color="slate"
                      size="xs"
                      leftSection={<IconPlus size={12} />}
                      onClick={addInternalBand}
                    >
                      Add band
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* 6 — Eligibility Formula */}
            {step === 6 && (
              <Box>
                <Group justify="space-between" align="flex-start" mb="sm">
                  <SectionHead
                    title="Eligibility Formula"
                    description="The eligible amount is always the lowest of the limits below. Values update live."
                  />
                </Group>
                <Stack gap={0}>
                  {FORMULA_ITEMS.map(([name, formula], i, arr) => {
                    return (
                      <Box key={name}>
                        <Paper
                          px="sm"
                          py={7}
                          radius="sm"
                          style={{
                            border: `1px solid var(--mantine-color-slate-2)`,
                            background: "var(--mantine-color-white)",
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap">
                              <ThemeIcon
                                size={18}
                                radius="sm"
                                variant="light"
                                color="brand"
                              >
                                <Text fz={9} fw={700}>
                                  {i + 1}
                                </Text>
                              </ThemeIcon>
                              <Box>
                                <Text fz="xs" fw={600} c="slate.8">
                                  {name}
                                </Text>
                                <Text fz={9} c="slate.4" ff="monospace">
                                  {formula}
                                </Text>
                              </Box>
                            </Group>
                          </Group>
                        </Paper>
                        {i < arr.length - 1 && (
                          <Group justify="center" py={2}>
                            <IconChevronDown
                              size={12}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Group>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
                <Paper
                  px="sm"
                  py={8}
                  mt="sm"
                  radius="sm"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-5) 100%)",
                  }}
                >
                  <Group justify="space-between">
                    <Group gap={6}>
                      <IconShieldCheck
                        size={13}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text fz="xs" fw={600} c="white">
                        Final Eligible Amount = MIN(all limits above)
                      </Text>
                    </Group>
                  </Group>
                </Paper>
                <Text fz={10} c="slate.4" mt={4}>
                  Worked example: Basic Salary ZMW 15,000 · Net Salary ZMW
                  12,500 · Other Income ZMW 3,000 · Credit Score 735 · Tenure 24
                  months.
                </Text>
              </Box>
            )}

            {/* 7 — Pre-Approval Limits */}
            {step === 7 && (
              <Box>
                <SectionHead
                  title="Pre-Approval Limits"
                  description="Once the eligible amount is known, the applicant's risk tier decides how much of it is offered automatically."
                />
                <InfoCard color="brand">
                  <Group gap={6}>
                    <IconShieldCheck
                      size={12}
                      color="var(--mantine-color-brand-6)"
                    />
                    <Text fz={11} fw={600} c="brand.7">
                      Pre-Approved Amount = MIN(Eligible Amount x Tier %, Tier
                      Maximum)
                    </Text>
                  </Group>
                </InfoCard>
                <SimpleGrid cols={2} spacing="sm" mt="sm">
                  {TIERS.map((t) => {
                    const isSample = t.label === sampleRisk.label;
                    const isHardStop = t.pct === 0;
                    return (
                      <Paper
                        key={t.t}
                        radius="sm"
                        px="sm"
                        py="sm"
                        style={{
                          border: `1px solid ${isSample ? "var(--mantine-color-yellow-3)" : isHardStop ? "var(--mantine-color-red-2)" : "var(--mantine-color-slate-2)"}`,
                          background: isSample
                            ? "var(--mantine-color-yellow-0)"
                            : isHardStop
                              ? "var(--mantine-color-red-0)"
                              : "var(--mantine-color-white)",
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Text fz="xs" fw={700} c="slate.8">
                            {t.t}
                          </Text>
                          <Group gap={4}>
                            {isSample && <Pill tone="medium">Sample</Pill>}
                            <Pill tone={t.tone}>
                              {isHardStop ? "Hard Stop" : `${t.pct}%`}
                            </Pill>
                          </Group>
                        </Group>
                        <Text fz={10} c="slate.5" mb={4}>
                          {t.cond}
                        </Text>
                        <Text fz={10} c="slate.5">
                          Max:{" "}
                          <Text span fw={600} c="slate.7">
                            {isHardStop
                              ? "Manual Review / Decline"
                              : `ZMW ${t.max.toLocaleString()}`}
                          </Text>
                        </Text>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
                <Paper
                  radius="sm"
                  px="sm"
                  py="sm"
                  mt="sm"
                  style={{
                    border: "1px solid var(--mantine-color-slate-2)",
                    background: "var(--mantine-color-slate-0)",
                  }}
                >
                  <Text fz={11} fw={700} mb={6} c="slate.7">
                    Worked example — same sample applicant
                  </Text>
                  <SimpleGrid
                    cols={4}
                    spacing="sm"
                    style={{ textAlign: "center" }}
                  >
                    {[
                      [
                        "Eligible Amount",
                        `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`,
                      ],
                      ["Risk Tier", sampleRisk.label],
                      ["Tier %", sampleTier ? `${sampleTier.pct}%` : "—"],
                      [
                        "Pre-Approved",
                        `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`,
                      ],
                    ].map(([label, value], idx) => (
                      <Box key={label}>
                        <Text
                          fz={9}
                          c="slate.5"
                          tt="uppercase"
                          style={{ letterSpacing: ".04em" }}
                        >
                          {label}
                        </Text>
                        <Text
                          fz="xs"
                          fw={700}
                          c={idx === 3 ? "brand.6" : "slate.8"}
                          mt={2}
                        >
                          {value}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Box>
            )}

            {/* 8 — Decision Rules */}
            {step === 8 && (
              <Box>
                <SectionHead
                  title="Decision Rules"
                  description="Define automatic decline triggers and manual review escalations."
                />
                <Paper
                  radius="md"
                  p="md"
                  mb="md"
                  style={{
                    border: "1px solid var(--mantine-color-red-2)",
                    background: "var(--mantine-color-red-0)",
                  }}
                >
                  <Group justify="space-between" mb="md" align="center">
                    <Group gap="sm" align="center">
                      <Badge
                        color="red.7"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="uppercase"
                        style={{ borderWidth: 1 }}
                        leftSection={
                          <Box
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: "var(--mantine-color-red-7)",
                              marginLeft: 6,
                              marginRight: 0,
                            }}
                          />
                        }
                      >
                        HARD STOP RULES
                      </Badge>
                      <Text fz={12} c="slate.7">
                        Conditions that stop automatic approval outright.
                      </Text>
                    </Group>
                    <Group gap="sm" align="center">
                      <Badge
                        color="red.7"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="none"
                        style={{ borderWidth: 1, fontWeight: 600 }}
                      >
                        {hardStops.length} Rule
                        {hardStops.length !== 1 ? "s" : ""} Configured
                      </Badge>
                      <Badge
                        color="red.7"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="none"
                        style={{ borderWidth: 1, fontWeight: 700 }}
                        leftSection={
                          <IconBan size={14} style={{ marginLeft: 4 }} />
                        }
                      >
                        Outcome: Auto Decline
                      </Badge>
                    </Group>
                  </Group>

                  <Stack gap={4}>
                    {hardStops.map((hs, i) => (
                      <Paper
                        key={hs.id}
                        radius="sm"
                        px={8}
                        py={4}
                        style={{
                          background: "white",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <Group wrap="nowrap" gap="xs" align="center">
                          <Text fz={10} fw={700} c="slate.4" w={16} ta="center">
                            {(i + 1).toString().padStart(2, "0")}
                          </Text>
                          <Select
                            radius="md"
                            size="xs"
                            value={hs.factor}
                            onChange={(v) =>
                              v && updateHardStop(hs.id, { factor: v })
                            }
                            data={RULE_FACTORS}
                            style={{ flex: 1.5 }}
                            styles={{
                              input: {
                                height: 24,
                                minHeight: 24,
                                fontSize: 11,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Select
                            radius="md"
                            size="xs"
                            value={hs.operator}
                            onChange={(v) =>
                              v && updateHardStop(hs.id, { operator: v })
                            }
                            data={RULE_OPERATORS}
                            style={{ flex: 1 }}
                            styles={{
                              input: {
                                height: 24,
                                minHeight: 24,
                                fontSize: 11,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <TextInput
                            radius="md"
                            size="xs"
                            value={hs.value}
                            onChange={(e) =>
                              updateHardStop(hs.id, { value: e.target.value })
                            }
                            rightSection={
                              hs.hint ? (
                                <Text fz={9} c="slate.4" mr="xs">
                                  {hs.hint}
                                </Text>
                              ) : undefined
                            }
                            rightSectionWidth={80}
                            style={{ flex: 1.5 }}
                            styles={{
                              input: {
                                height: 24,
                                minHeight: 24,
                                fontSize: 11,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeHardStop(hs.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>

                  <Group mt="md" justify="space-between" align="center">
                    <Button
                      variant="outline"
                      color="red.7"
                      bg="white"
                      radius="md"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      style={{
                        borderStyle: "dashed",
                        borderWidth: 1,
                        height: 26,
                      }}
                      onClick={addHardStop}
                    >
                      Add Hard Stop Rule
                    </Button>
                    <Text fz={10} c="slate.5">
                      All hard stops trigger immediate evaluation termination
                    </Text>
                  </Group>
                </Paper>

                <Paper
                  radius="md"
                  p="md"
                  style={{
                    border: "1px solid var(--mantine-color-orange-2)",
                    background: "var(--mantine-color-orange-0)",
                  }}
                >
                  <Group justify="space-between" mb="md" align="center">
                    <Group gap="sm" align="center">
                      <Badge
                        color="orange.8"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="uppercase"
                        style={{ borderWidth: 1 }}
                        leftSection={
                          <Box
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: "var(--mantine-color-orange-8)",
                              marginLeft: 6,
                              marginRight: 0,
                            }}
                          />
                        }
                      >
                        MANUAL REVIEW RULES
                      </Badge>
                      <Text fz={12} c="slate.7">
                        Conditions routed to a human decision instead of an
                        automatic one.
                      </Text>
                    </Group>
                    <Group gap="sm" align="center">
                      <Badge
                        color="orange.8"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="none"
                        style={{ borderWidth: 1, fontWeight: 600 }}
                      >
                        {manualReviews.length} Rule
                        {manualReviews.length !== 1 ? "s" : ""} Configured
                      </Badge>
                      <Badge
                        color="orange.8"
                        variant="outline"
                        bg="white"
                        radius="xl"
                        size="md"
                        tt="none"
                        style={{ borderWidth: 1, fontWeight: 700 }}
                        leftSection={
                          <IconAlertTriangle
                            size={14}
                            style={{ marginLeft: 4 }}
                          />
                        }
                      >
                        Outcome: Manual Review
                      </Badge>
                    </Group>
                  </Group>

                  <Stack gap={4}>
                    {manualReviews.map((mr, i) => (
                      <Paper
                        key={mr.id}
                        radius="sm"
                        px={8}
                        py={4}
                        style={{
                          background: "white",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <Group wrap="nowrap" gap="xs" align="center">
                          <Text fz={10} fw={700} c="slate.4" w={16} ta="center">
                            {(i + 1).toString().padStart(2, "0")}
                          </Text>
                          <Select
                            radius="md"
                            size="xs"
                            value={mr.factor}
                            onChange={(v) =>
                              v && updateManualReview(mr.id, { factor: v })
                            }
                            data={RULE_FACTORS}
                            style={{ flex: 1.5 }}
                            styles={{
                              input: {
                                height: 24,
                                minHeight: 24,
                                fontSize: 11,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Select
                            radius="md"
                            size="xs"
                            value={mr.operator}
                            onChange={(v) =>
                              v && updateManualReview(mr.id, { operator: v })
                            }
                            data={RULE_OPERATORS}
                            style={{ flex: 1 }}
                            styles={{
                              input: {
                                height: 24,
                                minHeight: 24,
                                fontSize: 11,
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Group gap="xs" wrap="nowrap" style={{ flex: 1.5 }}>
                            <TextInput
                              radius="md"
                              size="xs"
                              value={mr.value1}
                              onChange={(e) =>
                                updateManualReview(mr.id, {
                                  value1: e.target.value,
                                })
                              }
                              style={{ flex: 1 }}
                              styles={{
                                input: {
                                  height: 24,
                                  minHeight: 24,
                                  fontSize: 11,
                                  borderRadius: 2,
                                },
                              }}
                            />
                            {mr.operator === "Between" && (
                              <>
                                <Text fz={9} fw={700} c="slate.5">
                                  AND
                                </Text>
                                <TextInput
                                  radius="md"
                                  size="xs"
                                  value={mr.value2}
                                  onChange={(e) =>
                                    updateManualReview(mr.id, {
                                      value2: e.target.value,
                                    })
                                  }
                                  style={{ flex: 1 }}
                                  styles={{
                                    input: {
                                      height: 24,
                                      minHeight: 24,
                                      fontSize: 11,
                                      borderRadius: 2,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </Group>
                          <ActionIcon
                            variant="subtle"
                            color="orange.8"
                            size="sm"
                            onClick={() => removeManualReview(mr.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                  <Group mt="md" justify="space-between" align="center">
                    <Button
                      variant="outline"
                      color="orange.8"
                      bg="white"
                      radius="md"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      style={{
                        borderStyle: "dashed",
                        borderWidth: 1,
                        height: 26,
                      }}
                      onClick={addManualReview}
                    >
                      Add Manual Review Rule
                    </Button>
                  </Group>
                </Paper>
              </Box>
            )}

            {/* 9 — Review & Publish */}
            {step === 9 && (
              <Box>
                <SectionHead
                  title="Review & Publish"
                  description="Confirm the configuration below. You can simulate the rule with dynamic inputs or publish it as a new version."
                />

                <Tabs defaultValue="summary" color="brand">
                  <Tabs.List mb="md">
                    <Tabs.Tab value="summary" fw={600} fz={12}>
                      Summary
                    </Tabs.Tab>
                    <Tabs.Tab value="simulator" fw={600} fz={12}>
                      Simulator
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="summary">
                    <Paper
                      px="sm"
                      py="sm"
                      mb="md"
                      radius="sm"
                      style={{
                        border: `1px solid ${readyToPublish ? "var(--mantine-color-green-3)" : "var(--mantine-color-orange-3)"}`,
                        background: readyToPublish
                          ? "var(--mantine-color-green-0)"
                          : "var(--mantine-color-orange-0)",
                      }}
                    >
                      <Group gap={7} mb={reviewIssues.length > 0 ? 6 : 0}>
                        {readyToPublish ? (
                          <IconCheck
                            size={13}
                            color="var(--mantine-color-green-7)"
                          />
                        ) : (
                          <IconAlertTriangle
                            size={13}
                            color="var(--mantine-color-orange-7)"
                          />
                        )}
                        <Text
                          fz="xs"
                          fw={700}
                          c={readyToPublish ? "green.8" : "orange.8"}
                        >
                          {readyToPublish
                            ? "Ready to publish"
                            : `${reviewIssues.length} item${reviewIssues.length > 1 ? "s" : ""} need attention before publishing`}
                        </Text>
                      </Group>
                      {reviewIssues.length > 0 && (
                        <Stack gap={2} pl={20}>
                          {reviewIssues.map((c) => (
                            <Text key={c.label} fz={11} c="orange.8">
                              • {c.label}
                            </Text>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                    <SimpleGrid cols={2} spacing="sm">
                      {[
                        {
                          title: "Rule Details",
                          rows: [
                            ["Rule Name", ruleName || "—"],
                            ["Loan Product", loanProduct || "—"],
                            ["Risk Category", riskCategory || "—"],
                            ["Status", ruleStatus || "—"],
                          ] as [string, ReactNode][],
                        },
                        {
                          title: "Income & Obligations",
                          rows: [
                            [
                              "Income Sources Recognized",
                              `${incomeSources.filter((s) => s[3]).length} configured`,
                            ],
                            [
                              "Obligation Types Tracked",
                              `${obligationSources.filter((s) => s[2]).length} configured`,
                            ],
                            [
                              "Max EMI-to-Income Ratio",
                              `${formulaParams.maxEmiRatio}%`,
                            ],
                          ] as [string, ReactNode][],
                        },
                        {
                          title: "Credit & Risk Scoring",
                          rows: [
                            [
                              "Credit Bands",
                              `${creditBands.length} configured`,
                            ],
                            [
                              "Risk Weight Total",
                              <Text
                                span
                                fz="xs"
                                fw={700}
                                c={totalWeight === 100 ? "green.7" : "red.6"}
                              >
                                {totalWeight}%
                              </Text>,
                            ],
                            [
                              "Salary Multiple",
                              `${formulaParams.salaryMultiple}x`,
                            ],
                            [
                              "Affordability Buffer",
                              `${formulaParams.affordabilityBuffer}%`,
                            ],
                          ] as [string, ReactNode][],
                        },
                        {
                          title: "Collateral",
                          rows: [
                            [
                              "Collateral Items",
                              collateralItems.length > 0
                                ? `${collateralItems.length} configured`
                                : "None — unsecured",
                            ],
                            [
                              "Total Collateral Limit",
                              `ZMW ${Math.round(totalCollateralLimit).toLocaleString()}`,
                            ],
                          ] as [string, ReactNode][],
                        },
                        {
                          title: "Pre-Approval & Decision Rules",
                          rows: [
                            [
                              "Pre-Approval Tiers",
                              `${TIERS.length} configured`,
                            ],
                            ["Hard Stops", `${hardStops.length} configured`],
                            [
                              "Sample Eligible Amount",
                              `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`,
                            ],
                            [
                              "Sample Pre-Approved Amount",
                              `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`,
                            ],
                          ] as [string, ReactNode][],
                        },
                      ].map(({ title, rows }) => (
                        <Paper
                          key={title}
                          px="sm"
                          py="sm"
                          radius="sm"
                          style={{
                            border: "1px solid var(--mantine-color-slate-2)",
                          }}
                        >
                          <Text
                            fz={10}
                            fw={700}
                            c="slate.5"
                            tt="uppercase"
                            mb={6}
                            style={{ letterSpacing: ".04em" }}
                          >
                            {title}
                          </Text>
                          {rows.map(([k, val]) => (
                            <ReviewRow
                              key={k as string}
                              label={k as string}
                              value={val}
                            />
                          ))}
                        </Paper>
                      ))}
                    </SimpleGrid>
                    <Group gap="sm" mt="md">
                      <Button
                        size="xs"
                        color="brand"
                        radius="xl"
                        disabled={!readyToPublish}
                        style={{
                          background: readyToPublish
                            ? "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)"
                            : undefined,
                        }}
                      >
                        Publish as v1.0
                      </Button>
                      <Button size="xs" variant="default" radius="xl">
                        Save as Draft
                      </Button>
                    </Group>
                    {!readyToPublish && (
                      <Text fz={11} c="orange.7" mt={6}>
                        Resolve the items above to enable publishing.
                      </Text>
                    )}
                  </Tabs.Panel>
                  <Tabs.Panel value="simulator">
                    <RuleSimulator
                      incomeSources={incomeSources}
                      obligationSources={obligationSources}
                      creditBands={creditBands}
                      collateralItems={collateralItems}
                      formulaParams={formulaParams}
                      hardStops={hardStops}
                    />
                  </Tabs.Panel>
                </Tabs>
              </Box>
            )}
          </Paper>

          {/* nav */}
          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              color="slate"
              size="sm"
              leftSection={<IconChevronLeft size={14} />}
              disabled={step === 0}
              onClick={back}
            >
              Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button
                color="brand"
                size="sm"
                radius="xl"
                rightSection={<IconChevronRight size={14} />}
                onClick={next}
                style={{
                  background:
                    "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)",
                }}
              >
                Continue
              </Button>
            )}
          </Group>
        </Box>
      </Box>
    </Box>
  );
}

// ── Simulator Component ───────────────────────────────────────────
function SimField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  return (
    <Box>
      <Group gap={4} mb={4}>
        <Text fz={11} fw={500} c="slate.7">{label}</Text>
        {hint && <Text fz={10} c="slate.4">{hint}</Text>}
      </Group>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={{
          width: "100%",
          border: "1px solid var(--mantine-color-slate-3)",
          borderRadius: 4,
          padding: "7px 10px",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--mantine-color-slate-8)",
          background: "var(--mantine-color-slate-0)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </Box>
  );
}

function RuleSimulator({
  incomeSources,
  obligationSources,
  creditBands,
  collateralItems,
  formulaParams,
  hardStops,
}: {
  incomeSources: [string, number, boolean, boolean][];
  obligationSources: [string, boolean, boolean][];
  creditBands: CreditBand[];
  collateralItems: CollateralItem[];
  formulaParams: FormulaParams;
  hardStops: HardStop[];
}) {
  const [basicSalary, setBasicSalary] = useState(15000);
  const [incomes, setIncomes] = useState<Record<string, number>>({
    "Net Salary": 12500,
    "Business Income": 3000,
  });
  const [obligations, setObligations] = useState<Record<string, number>>({
    "Existing Monthly EMI": 2000,
    "Existing Loan Balance": 20000,
  });
  const [collaterals, setCollaterals] = useState<Record<string, number>>({});
  const [creditScore, setCreditScore] = useState(735);
  const [tenure, setTenure] = useState(24);
  const [onTime, setOnTime] = useState(94);
  const [maxDPD, setMaxDPD] = useState(12);
  const [npa, setNpa] = useState(false);

  const activeIncomes = incomeSources.filter((s) => s[3]);
  const activeObligations = obligationSources.filter((s) => s[2]);

  const setInc = (k: string) => (v: number | string) =>
    setIncomes((p) => ({ ...p, [k]: Number(v) || 0 }));
  const setObl = (k: string) => (v: number | string) =>
    setObligations((p) => ({ ...p, [k]: Number(v) || 0 }));
  const setCol = (k: string) => (v: number | string) =>
    setCollaterals((p) => ({ ...p, [k]: Number(v) || 0 }));

  const eligibleIncome = activeIncomes.reduce(
    (sum, s) => sum + (incomes[s[0]] || 0) * (s[1] / 100),
    0,
  );
  const existingEMI = activeObligations.reduce(
    (sum, s) =>
      sum +
      (s[0].includes("EMI") || s[0].includes("Payment")
        ? obligations[s[0]] || 0
        : 0),
    0,
  );
  const existingBalance = activeObligations.reduce(
    (sum, s) => sum + (s[0].includes("Balance") ? obligations[s[0]] || 0 : 0),
    0,
  );

  const salaryLimit = basicSalary * formulaParams.salaryMultiple;

  let maxEMI = eligibleIncome * (formulaParams.maxEmiRatio / 100) - existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit =
    maxEMI * tenure * (formulaParams.affordabilityBuffer / 100);

  const matchedBand = creditBandFor(creditScore, creditBands);
  const creditMultiple = matchedBand ? Number(matchedBand.multiple) : 0;
  const creditLimit = basicSalary * creditMultiple;

  const exposureRatio = Math.min(
    existingBalance / (eligibleIncome * 12 || 1),
    formulaParams.exposureCap / 100,
  );
  const exposureLimit = affordabilityLimit * (1 - exposureRatio);

  const collateralLimit = collateralItems.reduce((sum, item) => {
    return (
      sum +
      (collaterals[item.id] || 0) *
        (1 - item.haircutPct / 100) *
        (item.maxLtvPct / 100)
    );
  }, 0);

  const limits = [
    { name: "Salary limit", value: salaryLimit },
    { name: "Affordability limit", value: affordabilityLimit },
    { name: "Credit limit", value: creditLimit },
    { name: "Exposure limit", value: exposureLimit },
    ...(collateralItems.length > 0
      ? [{ name: "Collateral limit", value: collateralLimit }]
      : []),
    { name: "Product limit", value: formulaParams.productMax },
  ];

  let final = Math.min(...limits.map((l) => l.value));
  let limitingFactor = limits.find((l) => l.value === final)?.name || "";
  let decision = "Eligible";

  const risk = riskTier(creditScore, onTime, maxDPD, npa);

  if (npa && hardStops.some((h) => h.factor === "Active NPA")) {
    final = 0;
    decision = "Decline";
    limitingFactor = "Active NPA (Hard Stop)";
  } else if (risk.label === "Not Acceptable") {
    final = 0;
    decision = "Decline";
    limitingFactor = "Risk Profile Not Acceptable";
  } else if (matchedBand && matchedBand.decision === "Decline") {
    final = 0;
    decision = "Decline";
    limitingFactor = "Credit Score Band (Decline)";
  } else if (
    hardStops.some(
      (h) =>
        h.factor === "Credit Score" &&
        h.operator === "Less Than" &&
        creditScore < Number(h.value),
    )
  ) {
    final = 0;
    decision = "Decline";
    limitingFactor = "Credit Score (Hard Stop)";
  }

  const sampleTier = TIERS.find((t) => t.label === risk.label);
  const preApproved =
    decision === "Eligible" && sampleTier && sampleTier.pct > 0
      ? Math.min(final * (sampleTier.pct / 100), sampleTier.max)
      : 0;

  return (
    <SimpleGrid cols={{ base: 1, md: 12 }} spacing="sm" mt="sm">
      {/* ── LEFT: Input Cards ── */}
      <Box style={{ gridColumn: "span 7" }}>
        <Stack gap="sm">

          {/* Card 1 — Income and affordability */}
          <Paper radius="sm" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <Text fz="md" fw={700} c="slate.8" mb="sm">Income and affordability</Text>
            <SimpleGrid cols={2} spacing="sm">
              <SimField label="Basic salary," hint="for multipliers" value={basicSalary} onChange={setBasicSalary} />
              {activeIncomes.map((s) => (
                <SimField key={s[0]} label={s[0]} hint={`${s[1]}% recognized`} value={incomes[s[0]] || 0} onChange={setInc(s[0])} />
              ))}
              <SimField label="Requested tenure," hint="months" value={tenure} onChange={setTenure} />
            </SimpleGrid>
          </Paper>

          {/* Card 2 — Risk and collateral */}
          <Paper radius="sm" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <Text fz="md" fw={700} c="slate.8" mb="sm">Risk and collateral</Text>
            <SimpleGrid cols={2} spacing="sm">
              <SimField label="Credit score" value={creditScore} onChange={setCreditScore} />
              <SimField label="On time payment" value={onTime} onChange={setOnTime} />
              <SimField label="Maximum days past due" value={maxDPD} onChange={setMaxDPD} />
              {collateralItems.map((c) => (
                <SimField
                  key={c.id}
                  label={`${c.type} value`}
                  hint={`${c.maxLtvPct}% LTV, ${c.haircutPct}% haircut`}
                  value={collaterals[c.id] || 0}
                  onChange={setCol(c.id)}
                />
              ))}
            </SimpleGrid>
            <Checkbox
              mt="sm"
              size="xs"
              checked={npa}
              onChange={(e) => setNpa(e.currentTarget.checked)}
              label={<Text fz={12} c="slate.7">Active non-performing asset</Text>}
            />
          </Paper>

          {/* Card 3 — Existing obligations */}
          {activeObligations.length > 0 && (
            <Paper radius="sm" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
              <Text fz="md" fw={700} c="slate.8" mb="sm">Existing obligations</Text>
              <SimpleGrid cols={2} spacing="sm">
                {activeObligations.map((s) => (
                  <SimField key={s[0]} label={s[0]} value={obligations[s[0]] || 0} onChange={setObl(s[0])} />
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Stack>
      </Box>

      {/* ── RIGHT: Results ── */}
      <Box style={{ gridColumn: "span 5", position: "sticky", top: 12, alignSelf: "start" }}>
        <Paper
          radius="sm"
          p="md"
          style={{
            border: `1px solid ${decision === "Decline" ? "var(--mantine-color-red-3)" : "var(--mantine-color-slate-2)"}`,
            background: decision === "Decline" ? "var(--mantine-color-red-0)" : "white",
          }}
        >
          {/* Decision header */}
          <Group justify="space-between" mb="xs">
            <Group gap={8}>
              {decision === "Eligible" ? (
                <IconCheck size={16} color="var(--mantine-color-green-6)" />
              ) : (
                <IconCircleX size={16} color="var(--mantine-color-red-6)" />
              )}
              <Text fz="sm" fw={700} c={decision === "Eligible" ? "green.7" : "red.7"}>
                {decision}
              </Text>
            </Group>
            <Badge
              color={risk.tone === "high" ? "red.7" : risk.tone === "medium" ? "orange.7" : "green.7"}
              variant="light"
              size="sm"
              radius="sm"
            >
              {risk.label}
            </Badge>
          </Group>

          {/* Eligible amount */}
          <Box mb={4}>
            <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: "0.04em" }}>Eligible amount</Text>
            <Text fz={24} fw={700} c="slate.8" lh={1.2}>ZMW&nbsp;&nbsp;{Math.round(final).toLocaleString()}</Text>
          </Box>

          {/* Pre-approved amount */}
          <Box mb="xs">
            <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: "0.04em" }}>Pre-approved</Text>
            <Text fz={18} fw={700} c="brand.6" lh={1.2}>ZMW&nbsp;&nbsp;{Math.round(preApproved).toLocaleString()}</Text>
          </Box>

          {/* Limiting factor */}
          {decision === "Eligible" && (
            <Text
              fz={11}
              p={8}
              mb="sm"
              style={{
                background: "var(--mantine-color-brand-0)",
                borderRadius: 4,
                color: "var(--mantine-color-brand-7)",
              }}
            >
              Amount is limited by <b>{limitingFactor.replace(" limit", "").toLowerCase()}</b>.
            </Text>
          )}

          {/* Eligibility breakdown — compact 2-col grid */}
          <Text fz={11} fw={600} c="slate.6" mb={6}>Eligibility breakdown</Text>
          <SimpleGrid cols={2} spacing={6}>
            {limits.map((l) => {
              const isLimiting = l.name === limitingFactor && decision === "Eligible";
              return (
                <Box
                  key={l.name}
                  px={8}
                  py={6}
                  style={{
                    border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "transparent"}`,
                    background: isLimiting ? "var(--mantine-color-yellow-0)" : "transparent",
                    borderRadius: 4,
                  }}
                >
                  <Group gap={4} wrap="nowrap">
                    <Text fz={10} c="slate.5" style={{ whiteSpace: "nowrap" }}>{l.name}</Text>
                    {isLimiting && <Text fz={10} c="yellow.7">☆</Text>}
                  </Group>
                  <Text fz={13} fw={700} c="slate.8" mt={1}>{Math.round(l.value).toLocaleString()}</Text>
                </Box>
              );
            })}
          </SimpleGrid>
        </Paper>
      </Box>
    </SimpleGrid>
  );
}

export default CreateRule;
