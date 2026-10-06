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
  Loader,
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
  DEFAULT_FORMULA_PARAMS,
  CREDIT_SCORE_SCALE,
  INTERNAL_SCORE_SCALE,
  bandsReady,
  newBand,
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
import { ScoreBandTable } from "./ScoreBandTable";
import { CollateralLimit } from "./Collaterallimit";
import type {
  CreateEligibilityRulePayload,
  FormulaParams as ApiFormulaParams,
  ScoreBand,
} from "../../../../types/OriginationSetup/createRuleForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openCommonModal } from "../../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import {
  createEligibilityRule,
  getEligibilityRuleById,
  setEligibilityRuleStatus,
  updateEligibilityRule,
} from "../../../../api/OriginationSetupAPi/createRuleApi";
import { EligibilityFormula } from "./Eligibilityformula";
import { PreApprovalLimits } from "./Preapprovallimits";
import { DecisionRules } from "./Decisionrules";
import { ReviewPublish } from "./Reviewpublish";

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
const toApiFormula = (p: FormulaParams): ApiFormulaParams => ({
  other_income_recognition: p.otherIncomeRecognition,
  salary_multiple: p.salaryMultiple,
  max_emi_ratio: p.maxEmiRatio,
  max_dti_ratio: p.maxDtiRatio,
  affordability_buffer: p.affordabilityBuffer,
  product_max: p.productMax,
});

const fromApiFormula = (p: Partial<ApiFormulaParams> | null | undefined): FormulaParams => ({
  ...BLANK_FORMULA_PARAMS,
  ...(p?.other_income_recognition !== undefined && { otherIncomeRecognition: p.other_income_recognition }),
  ...(p?.salary_multiple !== undefined && { salaryMultiple: p.salary_multiple }),
  ...(p?.max_emi_ratio !== undefined && { maxEmiRatio: p.max_emi_ratio }),
  ...(p?.max_dti_ratio !== undefined && { maxDtiRatio: p.max_dti_ratio }),
  ...(p?.affordability_buffer !== undefined && { affordabilityBuffer: p.affordability_buffer }),
  ...(p?.product_max !== undefined && { productMax: p.product_max }),
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
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  const [ruleName, setRuleName] = useState("");
  const [loanProduct, setLoanProduct] = useState<string | null>("");
  const [ruleStatus, setRuleStatus] = useState<string | null>("");
  const [version, setVersion] = useState("1.0");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
const [effectiveUntil, setEffectiveUntil] = useState("");
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
  mutationFn: async (payload: CreateEligibilityRulePayload) => {
    if (!ruleId) return (await createEligibilityRule(payload)).message.data;
    const { loan_product: _product, ...changes } = payload;
    const rule = (await updateEligibilityRule(ruleId, changes)).message.data;
    if (isLive && rule.status === "Draft") {
      return (await setEligibilityRuleStatus(rule.name, "Active")).message.data;
    }
    return rule;
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["eligibility-rules"] });
    if (ruleId) queryClient.invalidateQueries({ queryKey: ["eligibility-rule"] });
  },
  onSuccess: (rule) => {
    showSuccess(
      "Rule Saved",
      rule.status === "Active"
        ? `Eligibility rule "${rule.rule_name}" was saved. Version ${rule.version} is active.`
        : `Eligibility rule "${rule.rule_name}" was saved as draft version ${rule.version}.`,
    );
    onExit();
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

const buildPayload = (): CreateEligibilityRulePayload => ({
  rule_name: ruleName.trim(),
  loan_product: loanProduct || "",
  effective_from: effectiveFrom,
  effective_to: effectiveUntil || null,
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
  formula_params: toApiFormula(formulaParams),
  hard_stops: hardStops.map(({ factor, operator, value }) => ({ factor, operator, value })),
  manual_reviews: manualReviews.map(({ factor, operator, value1, value2 }) => ({
    factor,
    operator,
    value1,
    value2,
  })),
});

const persistRule = () => {
  const missing = [!ruleName.trim() && "rule name", !loanProduct && "loan product"].filter(Boolean);
  if (missing.length) {
    setStep(0);
    openCommonModal({
      heading: "Missing Information",
      subtitle: "",
      body: `Enter the ${missing.join(" and ")} before saving.`,
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
    return;
  }
  if (effectiveUntil && effectiveFrom && effectiveUntil < effectiveFrom) {
    setStep(0);
    openCommonModal({
      heading: "Invalid Dates",
      subtitle: "",
      body: "Effective until cannot be before effective from.",
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
    return;
  }
  if (isLive && reviewIssues.length) {
    setStep(STEPS.length - 1);
    openCommonModal({
      heading: "Rule Is Active",
      subtitle: "",
      body: `This rule is live, so it must stay complete. Fix these first: ${reviewIssues.map((i) => i.label).join("; ")}.`,
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
    return;
  }
  saveMutation.mutate(buildPayload());
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
  const [creditBands, setCreditBands] = useState<CreditBand[]>(() => [newBand("cb")]);
  const sampleCreditBand = useMemo(
    () => creditBandFor(FORMULA_SAMPLE.creditScore, creditBands),
    [creditBands],
  );
  const [internalBands, setInternalBands] = useState<CreditBand[]>([]);
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
        type: "",
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
  const { data: ruleResponse, isLoading: ruleLoading, isError: ruleError } = useQuery({
  queryKey: ["eligibility-rule", ruleId],
  queryFn: () => getEligibilityRuleById(ruleId as string),
  enabled: !!ruleId,
});
  const [loaded, setLoaded] = useState(!ruleId);
  const isLive = ruleResponse?.message?.data?.status === "Active";

useEffect(() => {
  const r = ruleResponse?.message?.data;
  if (!r) return;
  setRuleName(r.rule_name);
  setLoanProduct(r.loan_product);
  setRuleStatus(r.status);
  setVersion(r.version);
  setEffectiveFrom(r.effective_from ?? "");
  setEffectiveUntil(r.effective_to ?? "");
  if (r.income_sources?.length) {
    setIncomeSources(
      r.income_sources.map((s) => [s.name, s.recognition_pct, s.verification_required, s.included] as IncomeSourceTuple),
    );
  }
  if (r.obligation_sources?.length) {
    setObligationSources(
      r.obligation_sources.map((o) => ({
        name: o.name,
        pct: o.pct,
        ver: o.verification_required,
        inc: o.included,
      })) as ObligationDef[],
    );
  }
  setCreditBands((r.credit_bands ?? []).map((b, i) => fromScoreBand(b, "cb", i)));
  setInternalBands((r.internal_bands ?? []).map((b, i) => fromScoreBand(b, "ib", i)));
  setCollateralItems(
    (r.collateral_items ?? []).map((c, i) => ({
      id: `col${i}`,
      type: c.type,
      marketValue: 0,
      haircutPct: c.haircut_pct,
      maxLtvPct: c.max_ltv_pct,
    })),
  );
  setFormulaParams(fromApiFormula(r.formula_params));
  setHardStops((r.hard_stops ?? []).map((h, i) => ({ id: `hs${i}`, ...h })) as HardStop[]);
  setManualReviews((r.manual_reviews ?? []).map((m, i) => ({ id: `mr${i}`, ...m })) as ManualReviewRule[]);
  setLoaded(true);
}, [ruleResponse]);

  const currentSnapshot = JSON.stringify(buildPayload());
  const [baseline, setBaseline] = useState<string | null>(null);
  useEffect(() => {
    if (loaded && baseline === null) setBaseline(currentSnapshot);
  }, [loaded, baseline, currentSnapshot]);
  const dirty = !viewOnly && baseline !== null && baseline !== currentSnapshot;

  const requestClose = () => {
    if (!dirty || saveMutation.isPending) {
      if (!saveMutation.isPending) onExit();
      return;
    }
    openCommonModal({
      heading: "Discard changes?",
      subtitle: "",
      body: "You have unsaved changes to this rule. Close without saving?",
      color: "red",
      buttons: [
        { label: "Keep editing", variant: "default" },
        { label: "Discard", color: "red", onClick: onExit },
      ],
    });
  };
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
    {
      label: "Credit score bands are complete with no conflicts",
      ok: creditBands.length > 0 && bandsReady(creditBands, CREDIT_SCORE_SCALE),
    },
    {
      label: "Internal scoring bands are complete with no conflicts",
      ok: bandsReady(internalBands, INTERNAL_SCORE_SCALE),
    },
    { label: "At least one hard stop is configured", ok: hardStops.length > 0 },
    { label: "Rule name and loan product are set", ok: ruleName.trim().length > 0 && !!loanProduct },
  ];
  const reviewIssues = reviewChecks.filter((c) => !c.ok);
  const readyToPublish = reviewIssues.length === 0;

  const stepComplete = (i: number) => {
    if (i === 0) return !!ruleName.trim() && !!loanProduct && !(effectiveUntil && effectiveUntil < effectiveFrom);
    if (i === 3) return creditBands.length > 0 && bandsReady(creditBands, CREDIT_SCORE_SCALE);
    if (i === 5) return bandsReady(internalBands, INTERNAL_SCORE_SCALE);
    if (i === 8) return hardStops.length > 0;
    return true;
  };
  const goTo = (i: number) => {
    setVisited((v) => new Set(v).add(step));
    setStep(i);
  };
  const next = () => goTo(Math.min(step + 1, STEPS.length - 1));
  const back = () => goTo(Math.max(step - 1, 0));

 return (
 <Modal
  opened={opened}
  onClose={requestClose}
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
                  {ruleStatus || "Draft"} · v{version}
                </Text>
              </Box>
            </Group>
            <Text fz={11} c="rgba(255,255,255,0.7)" mt={2}>
              {STEPS[step]}
            </Text>
          </Box>
          <Group gap="xs">
            <ActionIcon variant="white" color="brand" radius="xl" size="md" onClick={requestClose} aria-label="Close">
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
              const done = i !== step && (visited.has(i) || !!ruleId) && stepComplete(i);
              const active = i === step;
              return (
                <Box
                  key={s}
                  onClick={() => goTo(i)}
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
            {!loaded ? (
              <Stack align="center" justify="center" gap="xs" h="100%" mih={240}>
                {ruleError ? (
                  <Text fz="sm" c="red.7">Could not load this rule.</Text>
                ) : (
                  <>
                    <Loader size="sm" color="brand" />
                    <Text fz="xs" c="slate.5">{ruleLoading ? "Loading rule…" : ""}</Text>
                  </>
                )}
              </Stack>
            ) : (
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
                ruleStatus={ruleStatus}
                formulaParams={formulaParams}
                setFormulaParam={setFormulaParam}
                effectiveFrom={effectiveFrom}
  setEffectiveFrom={setEffectiveFrom}
  effectiveUntil={effectiveUntil}
  setEffectiveUntil={setEffectiveUntil}
                version={version}
                productLocked={!!ruleId}
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
              <ScoreBandTable
                title="Credit Score Limit"
                description="Define credit score bands with a grade, credit limit and decision for each."
                scoreLabel="Credit score"
                bands={creditBands}
                onChange={setCreditBands}
                scale={CREDIT_SCORE_SCALE}
                idPrefix="cb"
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
              <ScoreBandTable
                title="Internal Scoring Limit"
                description="Define internal score bands (0–100) with a grade, credit limit and decision for each."
                scoreLabel="Internal score"
                bands={internalBands}
                onChange={setInternalBands}
                scale={INTERNAL_SCORE_SCALE}
                idPrefix="ib"
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
                ruleStatus={ruleStatus}
                incomeSources={incomeSources}
                obligationSources={obligationSources}
                formulaParams={formulaParams}
                creditBands={creditBands}
                collateralItems={collateralItems}
                totalCollateralLimit={totalCollateralLimit}
                hardStops={hardStops}
                formulaPreview={formulaPreview}
                preApprovedPreview={preApprovedPreview}
              />
            )}
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
  <Button
    color="brand"
    size="sm"
    radius="xl"
    fw={700}
    loading={saveMutation.isPending}
    disabled={!loaded}
    onClick={persistRule}
    style={{
      background:
        "linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 100%)",
    }}
  >
    Save
  </Button>
) : null}
          </Group>
        </Box>
      </Box>
      </Box>
  </Modal>
);
}