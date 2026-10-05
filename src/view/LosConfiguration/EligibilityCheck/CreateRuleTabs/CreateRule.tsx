import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Group,
  Text,
  Title,
  ThemeIcon,
  Modal,
  ActionIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconShieldCheck,
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
} from "@tabler/icons-react";
import {
  INCOME_SOURCES,
  OBLIGATION_SOURCES,
  DEFAULT_CREDIT_BANDS,
  DEFAULT_FORMULA_PARAMS,
  COLLATERAL_TYPES,
  RULE_FACTORS,
  RULE_OPERATORS,
  TIERS,
  FORMULA_SAMPLE,
  creditBandFor,
  collateralItemLimit,
  computeFormulaPreview,
  type CreditBand,
  type CollateralItem,
  type FormulaParams,
  type HardStop,
  type ManualReviewRule,
  type ObligationDef,
  type IncomeSourceTuple,
} from "./Ruleshared";
import { BasicInformation } from "./Basicinformation";
import { IncomeAssessment } from "./Incomeassessment";
import { ObligationAssessment } from "./Obligationassessment";
import { CreditScoreLimit } from "./Creditscorelimit";
import { CollateralLimit } from "./Collaterallimit";
import type { CreateEligibilityRulePayload, ScoreBand } from "../../../../types/OriginationSetup/createRuleForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openCommonModal } from "../../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { createEligibilityRule, getEligibilityRuleById, updateEligibilityRule } from "../../../../api/OriginationSetupAPi/createRuleApi";
import { InternalScoringLimit } from "./Internalscoringlimit";
import { EligibilityFormula } from "./Eligibilityformula";
import { PreApprovalLimits } from "./Preapprovallimits";
import { DecisionRules } from "./Decisionrules";
import { ReviewPublish } from "./Reviewpublish";

export type WeightItem = { w: number; label: string };

export const STEPS = [
  "Basic Information",
  "Income Assessment",
  "Obligation Assessment",
  "Credit Score Limit",
  "Collateral Limit",
  "Internal Scoring",
  "Eligibility Formula",
  "Pre-Approval Limits",
  "Decision Rules",
  "Review & Publish"
];

export const DEFAULT_WEIGHTS: WeightItem[] = [
  { label: "Base", w: 100 }
];
const toScoreBand = (b: CreditBand): ScoreBand => ({
  grade: b.grade,
  min_score: Number(b.min),
  multiple: Number(b.multiple),
  basis: b.basis,
  decision: b.decision,
});

const fromScoreBand = (b: ScoreBand, prefix: string, i: number): CreditBand => ({
  id: `${prefix}${i}`,
  grade: b.grade,
  min: b.min_score,
  multiple: b.multiple,
  basis: b.basis as CreditBand["basis"],
  decision: b.decision as CreditBand["decision"],
});
export const riskTier = (creditScore: number, onTime: number, maxDPD: number, npa: number) => {
  return { label: "Medium Risk" }; // Returns a mock tier label
};

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

const BLANK_INCOME_SOURCES: IncomeSourceTuple[] = INCOME_SOURCES.map(
  ([name]) => [name, 0, false, false] as IncomeSourceTuple,
);
const BLANK_OBLIGATION_SOURCES: ObligationDef[] = OBLIGATION_SOURCES.map(
  (o) => ({ ...o, pct: 0, ver: false, inc: false }),
);
const BLANK_CREDIT_BANDS: CreditBand[] = DEFAULT_CREDIT_BANDS.map((b) => ({
  ...b,
  min: "",
  multiple: "",
  basis: "",
  decision: "",
}));
const BLANK_INTERNAL_BANDS: CreditBand[] = [
  { id: "ib1", grade: "A", min: "", multiple: "", basis: "", decision: "" },
  { id: "ib2", grade: "B", min: "", multiple: "", basis: "", decision: "" },
  { id: "ib3", grade: "C", min: "", multiple: "", basis: "", decision: "" },
  { id: "ib4", grade: "D", min: "", multiple: "", basis: "", decision: "" },
  { id: "ib5", grade: "E", min: "", multiple: "", basis: "", decision: "" },
];

const BLANK_FORMULA_PARAMS: FormulaParams = {
  ...DEFAULT_FORMULA_PARAMS,
  salaryMultiple: 0,
  maxEmiRatio: 0,
  maxDtiRatio: 0,
  affordabilityBuffer: 0,
  productMax: 0,
};

export function CreateRule({
  onExit,
  ruleId,
  opened,
  viewOnly = false,
}: {
  onExit: () => void;
  ruleId?: string;
  opened: boolean;
  viewOnly?: boolean;
}) {  const queryClient = useQueryClient();
  const handleModalClose = onExit;
  const [step, setStep] = useState(0);
  const [ruleName, setRuleName] = useState("");
  const [loanProduct, setLoanProduct] = useState<string | null>("");
  const [riskCategory, setRiskCategory] = useState<string | null>("");
  const [ruleStatus, setRuleStatus] = useState<string | null>("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
const [effectiveUntil, setEffectiveUntil] = useState("");
   const totalWeight = 100;
  const [formulaParams, setFormulaParams] = useState<FormulaParams>(
    BLANK_FORMULA_PARAMS,
  );
  const setFormulaParam = (k: keyof FormulaParams) => (v: number) =>
    setFormulaParams((p) => ({ ...p, [k]: v }));

  const showSuccess = (heading: string, body: string) => {
  openCommonModal({
    heading,
    subtitle: "",
    body,
    color: "green",
    buttons: [{ label: "Close", color: "green" }],
  });
};

const saveMutation = useMutation({
 mutationFn: (vars: { payload: CreateEligibilityRulePayload; status: "Draft" | "Active" }) =>
  ruleId
    ? updateEligibilityRule(ruleId, vars.payload)
    : createEligibilityRule(vars.payload),
  onSuccess: (_, vars) => {
    if (ruleId) queryClient.invalidateQueries({ queryKey: ["eligibility-rule", ruleId] });
    queryClient.invalidateQueries({ queryKey: ["eligibility-rules"] }); 
    setRuleStatus(vars.status);
    showSuccess(
      vars.status === "Active" ? "Rule Published" : "Draft Saved",
      `Eligibility rule "${ruleName.trim()}" was saved successfully.`,
    );
  },
  onError: (error: any) => {
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  },
});

const persistRule = (status: "Draft" | "Active") => {
  const payload: CreateEligibilityRulePayload = {
    rule_name: ruleName.trim(),
    loan_product: loanProduct || "",
    effective_from: effectiveFrom,
  effective_to: effectiveUntil,
    income_sources: incomeSources.map(([name, pct, ver, inc]) => ({
      name,
      recognition_pct: pct,
      verification_required: ver,
      included: inc,
    })),
    obligation_sources: obligationSources.map((o) => ({
      name: o.name,  
      pct: o.pct,  
      verification_required: o.ver,
      included: o.inc,
    })),
    credit_bands: creditBands.map(toScoreBand),
    internal_bands: internalBands.map(toScoreBand),
    collateral_items: collateralItems.map((it) => ({
      type: it.type,
      haircut_pct: it.haircutPct,
      max_ltv_pct: it.maxLtvPct,
    })),
    formula_params: formulaParams, 
    hard_stops: hardStops.map(({ factor, operator, value }) => ({ factor, operator, value })),
    manual_reviews: manualReviews.map(({ factor, operator, value1, value2 }) => ({
      factor,
      operator,
      value1,
      value2,
    })),
  };
  saveMutation.mutate({ payload, status });
};
  const [incomeSources, setIncomeSources] =
    useState<IncomeSourceTuple[]>(BLANK_INCOME_SOURCES);
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
    useState<ObligationDef[]>(BLANK_OBLIGATION_SOURCES);
  const updateObligationSource = (
    index: number,
    patch: Partial<ObligationDef>,
  ) => {
    setObligationSources((sources) =>
      sources.map((s, i) => {
        if (i !== index) return s;
        const next = { ...s, ...patch };
        if (!next.inc) {
          next.ver = false;
        }
        return next;
      }),
    );
  };
  const [creditBands, setCreditBands] =
    useState<CreditBand[]>(BLANK_CREDIT_BANDS);
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

  const [internalBands, setInternalBands] =
    useState<CreditBand[]>(BLANK_INTERNAL_BANDS);
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
  const [collateralItems, setCollateralItems] = useState<CollateralItem[]>([]);
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
  const [hardStops, setHardStops] = useState<HardStop[]>([]);
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

  const [manualReviews, setManualReviews] = useState<ManualReviewRule[]>([]);
  const { data: ruleResponse } = useQuery({
  queryKey: ["eligibility-rule", ruleId],
  queryFn: () => getEligibilityRuleById(ruleId as string),
  enabled: !!ruleId,
});

useEffect(() => {
  const r = ruleResponse?.message?.data;
  if (!r) return;
  setRuleName(r.rule_name);
  setLoanProduct(r.loan_product);
  setRuleStatus(r.status);
  setIncomeSources(
    r.income_sources.map((s) => [s.name, s.recognition_pct, s.verification_required, s.included] as IncomeSourceTuple),
  );
  setObligationSources(
    r.obligation_sources.map((o) => ({
      name: o.name, // CONFIRM: see note 2
      pct: o.pct,   // CONFIRM: see note 2
      ver: o.verification_required,
      inc: o.included,
    })) as ObligationDef[],
  );
  setCreditBands(r.credit_bands.map((b, i) => fromScoreBand(b, "cb", i)));
  setInternalBands(r.internal_bands.map((b, i) => fromScoreBand(b, "ib", i)));
  setCollateralItems(
    r.collateral_items.map((c, i) => ({
      id: `col${i}`,
      type: c.type,
      marketValue: 0, // CONFIRM: see note 4
      haircutPct: c.haircut_pct,
      maxLtvPct: c.max_ltv_pct,
    })),
  );
  setFormulaParams(r.formula_params as unknown as FormulaParams); // CONFIRM: see note 3
  setHardStops(r.hard_stops.map((h, i) => ({ id: `hs${i}`, ...h })) as HardStop[]);
  setManualReviews(r.manual_reviews.map((m, i) => ({ id: `mr${i}`, ...m })) as ManualReviewRule[]);
}, [ruleResponse]);
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
 <Modal
  opened={opened}
  onClose={handleModalClose}
  size="95%"
  centered
  withCloseButton={false}
  padding={0}
  radius="lg"
  closeOnClickOutside={false}
  closeOnEscape={false}
  styles={{
    content: {
      height: "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    body: {
      padding: 0,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      flex: 1,
      overflow: "hidden",
    },
  }}
>
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        padding: 16,
        gap: 0,
      }}
    >
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
            <ActionIcon variant="white" color="brand" radius="xl" size="md" onClick={handleModalClose}>
  <IconX size={14} />
</ActionIcon>
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
            <Box
    ref={(el) => {
      el?.toggleAttribute("inert", viewOnly);
    }}
  >
            {step === 0 && (
              <BasicInformation
                ruleName={ruleName}
                setRuleName={setRuleName}
                loanProduct={loanProduct}
                setLoanProduct={setLoanProduct}
                riskCategory={riskCategory}
                setRiskCategory={setRiskCategory}
                ruleStatus={ruleStatus}
                setRuleStatus={setRuleStatus}
                formulaParams={formulaParams}
                setFormulaParam={setFormulaParam}
                effectiveFrom={effectiveFrom}
  setEffectiveFrom={setEffectiveFrom}
  effectiveUntil={effectiveUntil}
  setEffectiveUntil={setEffectiveUntil}
              />
            )}

            {step === 1 && (
              <IncomeAssessment
                incomeSources={incomeSources}
                updateIncomeSource={updateIncomeSource}
                formulaParams={formulaParams}
                setFormulaParam={setFormulaParam}
              />
            )}

            {step === 2 && (
              <ObligationAssessment
                obligationSources={obligationSources}
                updateObligationSource={updateObligationSource}
                formulaParams={formulaParams}
                setFormulaParam={setFormulaParam}
              />
            )}

            {step === 3 && (
              <CreditScoreLimit
                creditBands={creditBands}
                updateCreditBand={updateCreditBand}
                addCreditBand={addCreditBand}
                removeCreditBand={removeCreditBand}
              />
            )}

            {step === 4 && (
              <CollateralLimit
                collateralItems={collateralItems}
                updateCollateralItem={updateCollateralItem}
                addCollateralItem={addCollateralItem}
                removeCollateralItem={removeCollateralItem}
              />
            )}

            {step === 5 && (
              <InternalScoringLimit
                internalBands={internalBands}
                updateInternalBand={updateInternalBand}
                addInternalBand={addInternalBand}
                removeInternalBand={removeInternalBand}
              />
            )}

            {step === 6 && (
              <EligibilityFormula
                formulaParams={formulaParams}
                setFormulaParam={setFormulaParam}
              />
            )}

            {step === 7 && (
              <PreApprovalLimits
                formulaPreview={formulaPreview}
                sampleRisk={sampleRisk}
                sampleTier={sampleTier}
                preApprovedPreview={preApprovedPreview}
              />
            )}

            {step === 8 && (
              <DecisionRules
                hardStops={hardStops}
                addHardStop={addHardStop}
                updateHardStop={updateHardStop}
                removeHardStop={removeHardStop}
                manualReviews={manualReviews}
                addManualReview={addManualReview}
                updateManualReview={updateManualReview}
                removeManualReview={removeManualReview}
              />
            )}

            {step === 9 && (
              <ReviewPublish
                readyToPublish={readyToPublish}
                reviewIssues={reviewIssues}
                ruleName={ruleName}
                loanProduct={loanProduct}
                riskCategory={riskCategory}
                ruleStatus={ruleStatus}
                incomeSources={incomeSources}
                obligationSources={obligationSources}
                formulaParams={formulaParams}
                creditBands={creditBands}
                totalWeight={totalWeight}
                collateralItems={collateralItems}
                totalCollateralLimit={totalCollateralLimit}
                hardStops={hardStops}
                formulaPreview={formulaPreview}
                preApprovedPreview={preApprovedPreview}
                persistRule={persistRule}
              />
            )}
            </Box>
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
            {step < STEPS.length - 1 ? (
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
) : !viewOnly ? (
  <Group gap="xs">
    <Button
      size="sm"
      variant="default"
      radius="xl"
      fw={600}
      loading={saveMutation.isPending}
      onClick={() => persistRule("Draft")}
    >
      Save Draft
    </Button>
    <Button
      color="brand"
      size="sm"
      radius="xl"
      fw={700}
      disabled={!readyToPublish}
      loading={saveMutation.isPending}
      onClick={() => persistRule("Active")}
      style={{
        background: readyToPublish
          ? "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)"
          : undefined,
      }}
    >
      Submit
    </Button>
  </Group>
) : null}
          </Group>
        </Box>
      </Box>
      </Box>
  </Modal>
);
}