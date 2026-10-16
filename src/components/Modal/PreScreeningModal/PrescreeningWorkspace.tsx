import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  UnstyledButton,
  Stack,
  SimpleGrid,
  Paper,
  Button,
  Loader,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconX,
  IconPencil,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconHelp,
  IconRefresh,
  IconCircleDot,
  IconTargetArrow,
  IconClipboardList,
  IconCoins,
  IconBuildingBank,
  IconGauge as IconGaugeTab,
  IconListCheck,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as LoanApplicationApi from "../../../api/LosConfiguration/LoanApplicationApi";
import type {
  Evaluation,
  EvaluationOverrides,
  FinancialLine,
  LoanApplication,
  StagePayload,
} from "../../../api/LosConfiguration/LoanApplicationApi";
import { FinancialLines, lineTotal, linesEdited } from "./FinancialLines";
import { INCOME_SOURCES } from "../LoanApplication/form";
import { LiabilitiesEditor, facilityLines, outstandingTotal } from "./LiabilitiesEditor";

import type {
  EligibilityCalc,
  PrescreeningState,
} from './PreScreeningShared';
import {
  zmw,
  calcRiskScore,
  type RiskScoreResult,
  CreditGaugeVisual,
  StatMini,
  SourceBadge,
  CompactRow,
  SectionCard,
  InlineAction,
  MicroLabel,
  IconTile,
  NUMERIC,
} from './PreScreeningShared';
import { LimitAssessment } from './Limitassessment';
import { PrescreeningAssessment } from './PrescreeningAssessment';

function AmountUtilizationGauge({
  requested,
  eligible,
}: {
  requested: number;
  eligible: number;
}) {
  const ratio = eligible > 0 ? requested / eligible : 0;
  const pctClamped = Math.max(0, Math.min(100, ratio * 100));
  const exceeds = requested > eligible;
  const headroom = eligible - requested;
  const tone = exceeds ? "orange" : "success";

  const R = 19;
  const C = 2 * Math.PI * R;

  return (
    <Group gap={14} wrap="nowrap" align="center" mt={6}>
      <Box style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="22"
            cy="22"
            r={R}
            fill="none"
            stroke="var(--mantine-color-slate-1)"
            strokeWidth="3.5"
          />
          <circle
            cx="22"
            cy="22"
            r={R}
            fill="none"
            stroke={`var(--mantine-color-${tone}-5)`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${(pctClamped / 100) * C} ${C}`}
            style={{ transition: "stroke-dasharray 500ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <Box
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Text fz={13} fw={800} c="slate.9" lh={1} style={NUMERIC}>
            {Math.round(ratio * 100)}%
          </Text>
        </Box>
      </Box>

      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group gap={14} mb={6} wrap="nowrap">
          <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
            <Box style={{ width: 7, height: 7, borderRadius: 2, background: "var(--mantine-color-brand-5)", flexShrink: 0 }} />
            <Text fz={11} c="slate.5" truncate style={NUMERIC}>
              Requested {zmw(requested)}
            </Text>
          </Group>
          <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
            <Box style={{ width: 7, height: 7, borderRadius: 2, background: "var(--mantine-color-slate-2)", flexShrink: 0 }} />
            <Text fz={11} c="slate.5" truncate style={NUMERIC}>
              Eligible {zmw(eligible)}
            </Text>
          </Group>
        </Group>

        <Group
          gap={6}
          wrap="nowrap"
          px={8}
          py={4}
          style={{
            borderRadius: 999,
            display: "inline-flex",
            background: `var(--mantine-color-${tone}-0)`,
            border: `1px solid var(--mantine-color-${tone}-1)`,
          }}
        >
          {exceeds ? (
            <IconAlertTriangle size={12} color={`var(--mantine-color-${tone}-6)`} />
          ) : (
            <IconCircleCheck size={12} color={`var(--mantine-color-${tone}-6)`} />
          )}
          <Text fz={11.5} fw={700} c={`${tone}.7`} style={NUMERIC}>
            {exceeds
              ? `${zmw(Math.abs(headroom))} over the eligible limit`
              : `${zmw(headroom)} headroom remaining`}
          </Text>
        </Group>
      </Box>
    </Group>
  );
}

/** Debt-to-income bar with the policy ceiling marked on the track. */
function DtiBar({
  calc,
  maxDTI,
}: {
  calc: EligibilityCalc | null;
  maxDTI: number;
}) {
  const tone = calc ? (calc.dtiPassed ? "success" : "danger") : "slate";
  // Track runs to 1.25x the policy cap so the ceiling marker sits inside it.
  const scale = maxDTI * 1.25;
  const fillPct = calc ? Math.min(100, (calc.customerDTI / scale) * 100) : 0;
  const capPct = (maxDTI / scale) * 100;

  return (
    <Box
      p={10}
      style={{
        borderRadius: "var(--mantine-radius-md)",
        background: `var(--mantine-color-${tone}-0)`,
        border: `1px solid var(--mantine-color-${tone}-1)`,
      }}
    >
      <Group justify="space-between" align="center" mb={4} wrap="nowrap">
        <Group gap={7} wrap="nowrap">
          <IconInfoCircle size={13} color={`var(--mantine-color-${tone}-6)`} />
          <Text fz={12} fw={700} c="slate.9">
            Debt-to-income ratio
          </Text>
        </Group>
        <Group gap={8} wrap="nowrap">
          <Text fz={16} fw={800} c={`${tone}.7`} lh={1} style={NUMERIC}>
            {calc ? `${calc.customerDTI.toFixed(0)}%` : "—"}
          </Text>
          {calc && (
            <Badge size="xs" radius="xl" variant="light" color={tone}>
              {calc.dtiPassed ? "Within limit" : `Exceeds ${maxDTI}%`}
            </Badge>
          )}
        </Group>
      </Group>

      <Box style={{ position: "relative" }}>
        <Box
          style={{
            height: 7,
            borderRadius: 99,
            background: "var(--mantine-color-white)",
            border: "1px solid var(--mantine-color-slate-1)",
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              height: "100%",
              width: `${fillPct}%`,
              borderRadius: 99,
              background: `linear-gradient(90deg, var(--mantine-color-${tone}-4), var(--mantine-color-${tone}-6))`,
              transition: "width 400ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </Box>
        {/* Policy ceiling */}
        <Box
          style={{
            position: "absolute",
            top: -3,
            left: `${capPct}%`,
            width: 2,
            height: 13,
            borderRadius: 99,
            background: "var(--mantine-color-slate-4)",
            transform: "translateX(-1px)",
          }}
        />
      </Box>
      <Group justify="space-between" mt={5}>
        <Text fz={9.5} c="slate.4">
          0%
        </Text>
        <Text fz={9.5} fw={600} c="slate.5">
          Policy cap {maxDTI}%
        </Text>
      </Group>
    </Box>
  );
}

const RISK_LEVELS = [
  {
    key: "low",
    label: "Low",
    color: "success",
    icon: IconCircleCheck,
    title: "Low risk",
    desc: "The customer shows a healthy credit profile with low risk of default.",
  },
  {
    key: "medium",
    label: "Medium",
    color: "warning",
    icon: IconAlertTriangle,
    title: "Medium risk",
    desc: "The customer shows an acceptable credit profile with moderate risk of default.",
  },
  {
    key: "high",
    label: "High",
    color: "danger",
    icon: IconCircleX,
    title: "High risk",
    desc: "The customer shows a concerning credit profile with high risk of default.",
  },
] as const;

function RiskMeter({
  riskScore,
  loading,
  readOnly,
  onRefresh,
}: {
  riskScore: RiskScoreResult | null;
  loading?: boolean;
  readOnly?: boolean;
  onRefresh?: () => void;
}) {
  const activeIndex = riskScore
    ? RISK_LEVELS.findIndex((l) => l.key === riskScore.band.toLowerCase())
    : -1;
  const active = activeIndex >= 0 ? RISK_LEVELS[activeIndex] : null;
  const color = active?.color ?? "slate";
  const title = loading
    ? "Checking risk profile…"
    : (active?.title ?? "Not yet assessed");
  const desc = loading
    ? "Recalculating from the customer's repayment history, defaults and recent enquiries."
    : (active?.desc ??
      "Refresh to calculate from the customer's repayment history, defaults and recent enquiries.");

  const markerPct = riskScore ? Math.max(0, Math.min(100, riskScore.score)) : 0;

  return (
    <SectionCard
      icon={IconGauge}
      color="brand"
      title="Risk meter"
      subtitle="Internal score, 0–100"
      bodyPad={12}
      actions={
        !readOnly ? (
          <InlineAction
            label={loading ? "Refreshing…" : "Refresh"}
            icon={IconRefresh}
            onClick={onRefresh}
            disabled={loading}
          />
        ) : undefined
      }
    >
      <Group justify="space-between" align="flex-end" mb={4} wrap="nowrap">
        <Group gap={6} align="flex-end" wrap="nowrap">
          <Text
            fz={30}
            fw={800}
            c={active ? `${color}.7` : "slate.3"}
            lh={1}
            style={NUMERIC}
          >
            {riskScore ? riskScore.score : "—"}
          </Text>
          <Text fz={12} fw={700} c="slate.4" mb={2}>
            /100
          </Text>
        </Group>
        {active && (
          <Badge color={color} variant="light" radius="xl" size="sm">
            {active.label} risk
          </Badge>
        )}
      </Group>

      {/* Band track — Low / Medium / High with the customer's score marked */}
      <Box style={{ position: "relative" }} mb={7}>
        <Group gap={3} wrap="nowrap">
          {RISK_LEVELS.map((level, i) => {
            const isActive = i === activeIndex;
            return (
              <Box
                key={level.key}
                style={{
                  flex: i === 0 ? 30 : i === 1 ? 39 : 31,
                  height: 8,
                  borderRadius: 99,
                  background: isActive
                    ? `linear-gradient(90deg, var(--mantine-color-${level.color}-4), var(--mantine-color-${level.color}-6))`
                    : `var(--mantine-color-${level.color}-1)`,
                  transition: "background 250ms ease",
                }}
              />
            );
          })}
        </Group>
        {riskScore && (
          <Box
            style={{
              position: "absolute",
              top: -3,
              left: `${markerPct}%`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--mantine-color-white)",
              border: `3px solid var(--mantine-color-${color}-6)`,
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.18)",
              transform: "translateX(-7px)",
              transition: "left 500ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        )}
      </Box>

      <Group justify="space-between" mb={10} wrap="nowrap">
        {RISK_LEVELS.map((level, i) => (
          <Text
            key={level.key}
            fz={9.5}
            fw={i === activeIndex ? 700 : 600}
            c={i === activeIndex ? `${level.color}.7` : "slate.4"}
            tt="uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            {level.label}
          </Text>
        ))}
      </Group>

      <Group
        gap={8}
        align="flex-start"
        wrap="nowrap"
        p={9}
        style={{
          borderRadius: "var(--mantine-radius-md)",
          background: `var(--mantine-color-${color}-0)`,
          border: `1px solid var(--mantine-color-${color}-1)`,
        }}
      >
        {active ? (
          <active.icon
            size={15}
            color={`var(--mantine-color-${color}-6)`}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
        ) : (
          <IconHelp
            size={15}
            color="var(--mantine-color-slate-4)"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
        )}
        <Box style={{ minWidth: 0 }}>
          <Text fz={11.5} fw={700} c={active ? `${color}.9` : "slate.7"}>
            {title}
          </Text>
          <Text fz={11} c="slate.6" lh={1.45}>
            {desc}
          </Text>
        </Box>
      </Group>
    </SectionCard>
  );
}

function PrescreeningOverview({
  credit,
  onRefreshCredit,
  incomeLines,
  obligationLines,
  original,
  onEditIncome,
  onEditObligations,
  readOnly,
  calc,
  requested,
  maxDTI,
  riskScore,
}: {
  credit: PrescreeningState["credit"];
  onRefreshCredit: () => void;
  incomeLines: FinancialLine[];
  obligationLines: FinancialLine[];
  original: { income: FinancialLine[]; obligations: FinancialLine[] };
  onEditIncome: () => void;
  onEditObligations: () => void;
  readOnly?: boolean;
  calc: EligibilityCalc | null;
  requested: number;
  maxDTI: number;
  riskScore: RiskScoreResult | null;
}) {
  const creditLoading = credit.status === "loading";
  const incomeEdited = linesEdited(incomeLines, original.income);
  const obligationsEdited = linesEdited(obligationLines, original.obligations);
  const totalIncome = lineTotal(incomeLines);
  const totalObligations = lineTotal(obligationLines);
  const editedNote = "Edited here — saved to the application on Save / Approve";
  return (
    <SimpleGrid
      cols={{ base: 1, md: 2 }}
      spacing={8}
      verticalSpacing={8}
      style={{ alignItems: "start" }}
    >
      {/* ---------------- Left: affordability ---------------- */}
      <Stack gap={10} style={{ minWidth: 0 }}>
        <SectionCard
          icon={IconCoins}
          color="brand"
          title="Income & affordability"
          subtitle="What the customer earns and can comfortably repay"
          actions={
            !readOnly ? (
              <InlineAction label="Update" icon={IconPencil} onClick={onEditIncome} />
            ) : undefined
          }
        >
          <Stack gap={10}>
            <CompactRow
              last
              label="Monthly income"
              value={incomeLines.length ? zmw(totalIncome) : "—"}
              subtext={
                incomeEdited
                  ? editedNote
                  : incomeLines.length
                    ? `Reused from the loan application · ${incomeLines.length} ${incomeLines.length === 1 ? "source" : "sources"}`
                    : "No income on the application"
              }
              badge={<SourceBadge source={incomeEdited ? "manual" : incomeLines.length ? "application" : "none"} />}
            />


            <DtiBar calc={calc} maxDTI={maxDTI} />

            {calc && calc.mandatoryPassed && (
              <Box
                p={11}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-slate-2)",
                  background:
                    "linear-gradient(135deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-white) 60%)",
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap={9} align="flex-start" wrap="nowrap">
                    <IconTile icon={IconTargetArrow} color="brand" size={26} iconSize={14} />
                    <Box>
                      <MicroLabel c="slate.4">Requested loan</MicroLabel>
                      <Text fz={15} fw={800} c="slate.9" lh={1.25} style={NUMERIC}>
                        {zmw(requested)}
                      </Text>
                    </Box>
                  </Group>
                  <Group gap={9} align="flex-start" wrap="nowrap">
                    <Box ta="right">
                      <MicroLabel c="slate.4">Maximum eligible</MicroLabel>
                      <Text fz={15} fw={800} c="slate.9" lh={1.25} style={NUMERIC}>
                        {zmw(calc.eligibleAmount)}
                      </Text>
                    </Box>
                    <IconTile icon={IconGauge} color="success" size={26} iconSize={14} />
                  </Group>
                </Group>
                <AmountUtilizationGauge requested={requested} eligible={calc.eligibleAmount} />
              </Box>
            )}
          </Stack>
        </SectionCard>

        <RiskMeter
          riskScore={riskScore}
          loading={creditLoading}
          readOnly={readOnly}
          onRefresh={onRefreshCredit}
        />
      </Stack>

      {/* ---------------- Right: bureau data ---------------- */}
      <Stack gap={10} style={{ minWidth: 0 }}>
        <SectionCard
          icon={IconBuildingBank}
          color="brand"
          title="Credit bureau summary"
          subtitle="Score, standing and recent activity"
          actions={
            !readOnly ? (
              <InlineAction
                label={credit.status === "loading" ? "Refreshing…" : "Refresh"}
                icon={IconRefresh}
                onClick={onRefreshCredit}
                disabled={credit.status === "loading"}
              />
            ) : undefined
          }
        >
          <CreditGaugeVisual
            score={credit.status === "loading" ? null : credit.value}
            unavailable={credit.source === "unavailable" && !credit.manual}
            loading={credit.status === "loading"}
          />

          {credit.status !== "loading" && credit.riskBand != null && (
            <SimpleGrid cols={3} spacing={8} verticalSpacing={8} mt={12}>
              <StatMini icon={IconAlertCircle} label="Risk band" value={credit.riskBand ?? "—"} />
              <StatMini icon={IconFileText} label="Active accounts" value={credit.activeAccounts ?? "—"} />
              <StatMini icon={IconAlertTriangle} label="Delinquent" value={credit.delinquentAccounts ?? "—"} />
              <StatMini icon={IconGauge} label="Outstanding" value={zmw(outstandingTotal(obligationLines))} />
              <StatMini icon={IconRefresh} label="Obligations" value={zmw(lineTotal(obligationLines))} />
              <StatMini icon={IconHelp} label="Enquiries" value={credit.recentEnquiries ?? "—"} />
            </SimpleGrid>
          )}
        </SectionCard>

        <SectionCard
          icon={IconCircleDot}
          color="brand"
          title="Existing liabilities"
          subtitle="Commitments already on the customer's book"
          actions={
            !readOnly ? <InlineAction label="Update" icon={IconPencil} onClick={onEditObligations} /> : undefined
          }
        >
          <CompactRow
            last
            label="Total monthly obligations"
            value={`${zmw(totalObligations)}/mo`}
            subtext={
              obligationsEdited
                ? editedNote
                : facilityLines(obligationLines).length
                  ? `${facilityLines(obligationLines).length} active loans · ${zmw(outstandingTotal(obligationLines))} outstanding`
                  : `${obligationLines.length} ${obligationLines.length === 1 ? "commitment" : "commitments"} from the loan application`
            }
            badge={<SourceBadge source={obligationsEdited ? "manual" : obligationLines.length ? "application" : "none"} />}
          />

        </SectionCard>
      </Stack>
    </SimpleGrid>
  );
}

// ---------------------------------------------------------------------------
// Top-level tabs: Details | Pre-screening Assessment | Eligibility Assessment
// ---------------------------------------------------------------------------

type TopTab = "details" | "prescreeningAssessment" | "limitAssessment";

function TopTabs({
  tab,
  setTab,
  evaluating,
  lastRun,
  onRerun,
}: {
  tab: TopTab;
  setTab: (t: TopTab) => void;
  evaluating: boolean;
  lastRun: { at: Date; status: string } | null;
  onRerun?: () => void;
}) {
  const tabs: { key: TopTab; label: string; icon: React.FC<any> }[] = [
    { key: "details", label: "Details", icon: IconClipboardList },
    { key: "prescreeningAssessment", label: "Pre-screening Assessment", icon: IconListCheck },
    { key: "limitAssessment", label: "Eligibility Assessment", icon: IconGaugeTab },
  ];
  return (
    <Group
      gap={2}
      px={20}
      pt={2}
      wrap="nowrap"
      style={{
        borderBottom: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-white)",
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => {
        const active = t.key === tab;
        const Icon = t.icon;
        return (
          <UnstyledButton
            key={t.key}
            className="ps-tab"
            onClick={() => setTab(t.key)}
            px={14}
            py={4}
            style={{ marginBottom: -1 }}
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
                left: 10,
                right: 10,
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
      <Group gap={10} ml="auto" pb={4} wrap="nowrap">
        {evaluating ? (
          <Group gap={6} wrap="nowrap">
            <Loader size={12} color="brand" />
            <Text fz={11.5} fw={600} c="brand.6">
              Running pre-screening and eligibility…
            </Text>
          </Group>
        ) : lastRun ? (
          <Group gap={5} wrap="nowrap" className="ps-fade-up" key={lastRun.at.getTime()}>
            <IconCircleCheck size={13} color="var(--mantine-color-success-6)" />
            <Text fz={11.5} c="slate.6">
              Re-run at {lastRun.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} ·{" "}
              <Text span inherit fw={700}>{lastRun.status}</Text>
            </Text>
          </Group>
        ) : (
          <Group gap={5} wrap="nowrap">
            <IconCircleCheck size={13} color="var(--mantine-color-success-6)" />
            <Text fz={11.5} c="slate.5">
              Results up to date
            </Text>
          </Group>
        )}
        {onRerun && (
          <Button
            size="compact-xs"
            radius="md"
            variant="light"
            color="brand"
            leftSection={<IconRefresh size={12} />}
            onClick={onRerun}
            loading={evaluating}
            title="Runs the active rules again with the figures on screen. Save or Approve stores the result."
          >
            Rerun pre-screening
          </Button>
        )}
      </Group>
    </Group>
  );
}

export interface PrescreeningResult {
  ready: boolean;
  warning: boolean;
  message: string | null;
  overrides: EvaluationOverrides;
  payload: StagePayload;
}

function cleanLines(lines?: FinancialLine[] | null): FinancialLine[] {
  return (lines ?? []).map((line) => ({ ...line, monthly_amount: Number(line.monthly_amount) || 0 }));
}

function applicationCredit(application: LoanApplication): PrescreeningState["credit"] {
  return {
    value: application.credit_score || null,
    source: application.credit_score ? "application" : "unavailable",
    status: "idle",
    manual: false,
    reason: "",
    riskBand: null,
    activeAccounts: null,
    delinquentAccounts: null,
    recentEnquiries: null,
  };
}

const STAGE_STATUS_LABEL: Record<string, string> = {
  Eligible: "Pass",
  "Eligible with Warnings": "Warning",
  "Manual Review": "Review",
  "Not Eligible": "Fail",
};

const SEVERITY_FOR_VERDICT: Record<string, string> = { "Not Eligible": "Blocking", "Manual Review": "Review", "Eligible with Warnings": "Warning" };

function evaluationReason(evaluation: Evaluation | undefined) {
  const prescreening = evaluation?.prescreening;
  const failed =
    prescreening?.verdict === evaluation?.verdict
      ? prescreening?.failed?.find((f) => f.severity === SEVERITY_FOR_VERDICT[evaluation?.verdict ?? ""])
      : undefined;
  if (failed) return `${failed.label}${failed.missing ? " missing" : ` ${failed.actual}`} (${failed.severity})`;
  const text = prescreening?.reason ?? evaluation?.eligibility?.reasons?.[0] ?? evaluation?.error;
  return text ? text.replace(/\.$/, "") : null;
}

export function PrescreeningWorkspace({
  application,
  readOnly = false,
  onChange,
}: {
  application: LoanApplication;
  readOnly?: boolean;
  onChange?: (result: PrescreeningResult) => void;
}) {

  const original = useMemo(
    () => ({
      income: cleanLines(application.financials?.income),
      obligations: cleanLines(application.financials?.obligations),
    }),
    [application],
  );
  const [credit, setCredit] = useState(() => applicationCredit(application));
  const [incomeLines, setIncomeLines] = useState<FinancialLine[]>(original.income);
  const [obligationLines, setObligationLines] = useState<FinancialLine[]>(original.obligations);
  const [topTab, setTopTab] = useState<TopTab>("details");
  const [editing, setEditing] = useState<"income" | "obligations" | null>(null);
  const requested = Number(application.requested_amount) || 0;



  useEffect(() => {
    if (credit.status !== "loading") return;
    const t = setTimeout(() => setCredit(applicationCredit(application)), 400);
    return () => clearTimeout(t);
  }, [credit.status, application]);

  const creditScore = credit.value != null && credit.value >= 300 && credit.value <= 850 ? credit.value : null;

  const riskScore = useMemo(
    () =>
      calcRiskScore({
        creditScore,
        delinquentAccounts: credit.delinquentAccounts,
        recentEnquiries: credit.recentEnquiries,
        liabilityRecords: [],
      }),
    [creditScore, credit.delinquentAccounts, credit.recentEnquiries],
  );

  const totalIncome = incomeLines.length ? lineTotal(incomeLines) : null;
  const totalObligations = lineTotal(obligationLines);

  const overrides = useMemo<EvaluationOverrides>(
    () => ({
      credit_score: creditScore ?? undefined,
      income: incomeLines,
      obligations: obligationLines.filter((line) => line.source.trim()),
    }),
    [creditScore, incomeLines, obligationLines],
  );

  const storedEvaluation = application.prescreening_data?.engine as Evaluation | undefined;
  const [debouncedOverrides] = useDebouncedValue(overrides, 400);
  const {
    data: liveEvaluation,
    isFetching: evaluating,
    refetch: reevaluate,
  } = useQuery({
    queryKey: ["los-evaluate", application.name, debouncedOverrides],
    queryFn: () => LoanApplicationApi.evaluate(application.name, debouncedOverrides),
    enabled: !readOnly || !storedEvaluation,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const evaluation = readOnly && storedEvaluation ? storedEvaluation : liveEvaluation;
  const eligibility = evaluation?.eligibility;
  const limitValue = (key: string) => eligibility?.limits?.find((limit) => limit.key === key)?.value ?? null;
  const maxDTI = eligibility?.max_dti_ratio || 100;
  const productMax = limitValue("product") ?? 0;
  const rate = eligibility?.rate_of_interest ?? 0;
  const verdict = evaluation?.verdict;

  const calc = useMemo<EligibilityCalc | null>(() => {
    if (!evaluation || creditScore == null || totalIncome == null || totalObligations == null) return null;
    const affordability = eligibility?.limits?.find((limit) => limit.key === "affordability");
    const customerDTI = eligibility?.dsr ?? (totalIncome > 0 ? (totalObligations / totalIncome) * 100 : 100);
    return {
      customerDTI,
      creditPassed: !evaluation.prescreening?.failed?.some((f) => f.label === "Credit Score" && f.severity === "Blocking"),
      dtiPassed: customerDTI <= maxDTI,
      maxAffordableMonthly: (eligibility?.recognised_income ?? 0) * ((eligibility?.max_emi_ratio ?? 0) / 100),
      capacity: affordability?.max_emi ?? 0,
      affordabilityAmount: affordability?.value ?? 0,
      eligibleAmount: evaluation.eligible_amount ?? 0,
      productMax,
      mandatoryPassed: evaluation.verdict !== "Not Eligible",
    };
  }, [evaluation, eligibility, creditScore, totalIncome, totalObligations, maxDTI, productMax]);

  const prevCalc = useRef(calc);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (calc && prevCalc.current && JSON.stringify(calc) !== JSON.stringify(prevCalc.current)) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1400);
      prevCalc.current = calc;
      return () => clearTimeout(t);
    }
    prevCalc.current = calc;
  }, [calc]);

  const status = !calc
    ? "Pending"
    : verdict === "Not Eligible"
      ? "Fail"
      : verdict === "Manual Review"
        ? "Review"
        : verdict === "Eligible with Warnings"
          ? "Warning"
          : "Pass";
  const settled = !evaluating && debouncedOverrides === overrides;
  const [rerunning, setRerunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ at: Date; status: string } | null>(null);
  const rerun = async () => {
    setRerunning(true);
    const [{ data }] = await Promise.all([reevaluate(), new Promise((resolve) => setTimeout(resolve, 700))]);
    setRerunning(false);
    setLastRun({ at: new Date(), status: STAGE_STATUS_LABEL[data?.verdict ?? ""] ?? "No result" });
  };
  const linesValid = obligationLines.every((line) => line.source.trim());
  const isEligible = !!calc && settled && linesValid && verdict !== "Not Eligible";
  const overEligible = !!calc && verdict !== "Not Eligible" && requested > calc.eligibleAmount;
  const reason = evaluationReason(evaluation);
  const amountNote = overEligible
    ? ` Requested ${zmw(requested)} is above the eligible ${zmw(calc!.eligibleAmount)}; appraisal will start from the eligible amount.`
    : "";
  const message = !linesValid
    ? "Give every additional liability a type."
    : !evaluation
    ? null
    : verdict === "Not Eligible"
      ? `Not eligible — ${reason ?? "see the checks above"}.`
      : verdict === "Manual Review"
        ? `Manual review — ${reason ?? "the officer decides"}.${amountNote}`
        : verdict === "Eligible with Warnings"
          ? `Warning — ${reason ?? "see the checks above"}.${amountNote}`
          : overEligible
            ? amountNote.trim()
            : null;

  useEffect(() => {
    if (!onChange) return;
    onChange({
      ready: isEligible,
      warning: overEligible || verdict === "Eligible with Warnings" || verdict === "Manual Review",
      message,
      overrides,
      payload: {
        custom_status: status,
        monthly_income: totalIncome,
        monthly_obligations: totalObligations,
        eligible_amount: evaluation?.eligible_amount ?? null,
        prescreening_data: {
          result: status,
          verdict: verdict ?? null,
          policy: { max_dti: eligibility?.max_dti_ratio ?? null, product_max: productMax || null, rate },
          dti: calc ? Math.round(calc.customerDTI * 10) / 10 : null,
          risk_score: riskScore?.score ?? null,
          risk_band: riskScore?.band ?? null,
          engine: storedEvaluation ?? null,
        },
      },
    });
  }, [calc, riskScore, totalIncome, totalObligations, isEligible, message, overrides, evaluation]);

  const missing: string[] = [];
  if (creditScore == null) missing.push("Credit score");
  if (totalIncome == null) missing.push("Income");

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <TopTabs
        tab={topTab}
        setTab={setTopTab}
        evaluating={!readOnly && (!settled || rerunning)}
        lastRun={lastRun}
        onRerun={readOnly ? undefined : rerun}
      />

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background:
            topTab === "details"
              ? "linear-gradient(180deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-slate-0) 280px)"
              : undefined,
        }}
      >
        {topTab === "details" ? (
          <Box px={14} pt={8} pb={8}>
            <PrescreeningOverview
              credit={credit}
              onRefreshCredit={() => setCredit((current) => ({ ...current, status: "loading" }))}
              incomeLines={incomeLines}
              obligationLines={obligationLines}
              original={original}
              onEditIncome={() => setEditing("income")}
              onEditObligations={() => setEditing("obligations")}
              readOnly={readOnly}
              calc={calc}
              requested={requested}
              maxDTI={maxDTI}
              riskScore={riskScore}
            />

            {flash && (
              <Badge
                className="ps-fade-up"
                size="xs"
                radius="xl"
                color="brand"
                variant="light"
                mt={12}
                leftSection={<IconRefresh size={11} />}
              >
                Recalculated
              </Badge>
            )}

            {!calc && missing.length > 0 && (
              <Paper
                withBorder
                radius="lg"
                p="md"
                ta="center"
                mt={10}
                bg="white"
                style={{
                  borderStyle: "dashed",
                  borderColor: "var(--mantine-color-slate-3)",
                }}
              >
                <Box
                  mx="auto"
                  mb={10}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--mantine-color-slate-1)",
                  }}
                >
                  <IconHelp size={20} color="var(--mantine-color-slate-5)" />
                </Box>
                <Text fz={14} fw={700} c="slate.9">
                  Prescreening incomplete
                </Text>
                <Text fz={12.5} c="slate.5" mt={4}>
                  Missing: {missing.join(", ")}. Fetch or enter these above to run
                  the calculation.
                </Text>
              </Paper>
            )}

          </Box>
        ) : topTab === "prescreeningAssessment" ? (
          <PrescreeningAssessment evaluation={evaluation} />
        ) : (
          <LimitAssessment
            requested={requested}
            limits={eligibility?.limits}
            productCode={evaluation?.loan_product ?? null}
            ruleLabel={eligibility?.rule ? `${eligibility.rule} v${eligibility.version}` : null}
            decision={eligibility?.skipped ? null : eligibility?.decision ?? null}
            reasons={eligibility?.reasons ?? []}
            eligibleAmount={evaluation?.eligible_amount ?? null}
            limitingFactor={eligibility?.limiting_factor ?? null}
          />
        )}
      </Box>

      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={
          <Group gap={10} wrap="nowrap">
            <IconTile icon={editing === "obligations" ? IconCircleDot : IconCoins} color="brand" size={28} iconSize={15} />
            <Box>
              <Text fz={14.5} fw={700} c="slate.9" lh={1.25}>
                {editing === "obligations" ? "Existing liabilities" : "Income"}
              </Text>
              <Text fz={11} c="slate.5" lh={1.3}>
                {editing === "obligations"
                  ? "Declared obligations, bureau facilities and anything added by hand — saved to the application on Save / Approve"
                  : "Same breakdown as the loan application — changes are saved to it on Save / Approve"}
              </Text>
            </Box>
          </Group>
        }
        radius="lg"
        size={editing === "obligations" ? "xl" : "lg"}
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        {editing && (
          <>
            {editing === "obligations" ? (
              <LiabilitiesEditor lines={obligationLines} original={original.obligations} readOnly={readOnly} onChange={setObligationLines} />
            ) : (
              <FinancialLines
                title="Monthly income"
                color="success"
                sources={INCOME_SOURCES}
                lines={incomeLines}
                original={original.income}
                readOnly={readOnly}
                onChange={setIncomeLines}
              />
            )}
            <Group justify="space-between" mt="md">
              <Text fz={12.5} c="slate.6">
                Total{" "}
                <Text span fw={800} c="slate.9" style={NUMERIC}>
                  {zmw(lineTotal(editing === "obligations" ? obligationLines : incomeLines))}
                </Text>
              </Text>
              <Button size="xs" radius="md" onClick={() => setEditing(null)}>
                Done
              </Button>
            </Group>
          </>
        )}
      </Modal>

    </Box>
  );
}
















