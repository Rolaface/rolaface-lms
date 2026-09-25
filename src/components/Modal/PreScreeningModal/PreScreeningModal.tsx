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
  Table,
  TextInput,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconHelp,
  IconRefresh,
  IconArrowRight,
  IconMinus,
  IconCircleDot,
  IconTargetArrow,
  IconClipboardList,
  IconPlus,
  IconEye,
  IconCoins,
  IconBuildingBank,
  IconGauge as IconGaugeTab,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
} from "./Dummyloanapplicationdata";

import type {
  PreScreeningModalProps,
  EligibilityCalc,
  Section,
  PrescreeningState
} from './PreScreeningShared';
import {
  POLICY,
  SCENARIOS,
  DEFAULT_SCENARIO,
  zmw,
  calcEligibility,
  calcRiskScore,
  type RiskScoreResult,
  SourceBadge,
  ContextHeader,
  LeftNav,
  buildInitialState,
  CreditGaugeVisual,
  CompactRow,
  StatMini,
  SectionCard,
  InlineAction,
  MicroLabel,
  IconTile,
  NUMERIC,
} from './PreScreeningShared';
import { LimitAssessment } from './Limitassessment';

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

  const R = 23;
  const C = 2 * Math.PI * R;

  return (
    <Group gap={14} wrap="nowrap" align="center" mt={10}>
      <Box style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="30"
            cy="30"
            r={R}
            fill="none"
            stroke="var(--mantine-color-slate-1)"
            strokeWidth="7"
          />
          <circle
            cx="30"
            cy="30"
            r={R}
            fill="none"
            stroke={`var(--mantine-color-${tone}-5)`}
            strokeWidth="7"
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
      <Group justify="space-between" align="center" mb={8} wrap="nowrap">
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
      <Group justify="space-between" align="flex-end" mb={12} wrap="nowrap">
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
  state,
  dispatch,
  readOnly,
  calc,
  requested,
  maxDTI,
  riskScore,
  creditLoading,
}: {
  state: PrescreeningState;
  dispatch: (a: any) => void;
  readOnly?: boolean;
  calc: EligibilityCalc | null;
  requested: number;
  maxDTI: number;
  productMax: number;
  riskScore: RiskScoreResult | null;
  creditLoading: boolean;
}) {
  const credit = state.credit;
  const liab = state.liabilities;
  const income = state.income;
  const additionalTotal = liab.additionalRecords.reduce((sum, r) => sum + (r.monthlyPayment || 0), 0);
  const totalObligations = liab.obligations == null && additionalTotal === 0 ? null : (liab.obligations ?? 0) + additionalTotal;
  const additionalIncomeTotal = income.additionalIncome.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalIncome = income.value == null && additionalIncomeTotal === 0 ? null : (income.value ?? 0) + additionalIncomeTotal;

  return (
    <SimpleGrid
      cols={{ base: 1, md: 2 }}
      spacing={14}
      verticalSpacing={14}
      style={{ alignItems: "start" }}
    >
      {/* ---------------- Left: affordability ---------------- */}
      <Stack gap={14} style={{ minWidth: 0 }}>
        <SectionCard
          icon={IconCoins}
          color="brand"
          title="Income & affordability"
          subtitle="What the customer earns and can comfortably repay"
          actions={
            !readOnly ? (
              <>
                <InlineAction
                  label="Refresh"
                  icon={IconRefresh}
                  onClick={() => dispatch({ type: "fetchIncome" })}
                  disabled={income.status === "loading"}
                />
                <InlineAction
                  label="Add income"
                  icon={IconPlus}
                  variant="ghost"
                  onClick={() => dispatch({ type: "openIncomeModal" })}
                />
              </>
            ) : undefined
          }
        >
          <Stack gap={12}>
            <CompactRow
              last
              label="Monthly income"
              value={
                income.status === "loading" ? (
                  <Text fz={13} c="slate.4" fw={500}>
                    Checking HRMS…
                  </Text>
                ) : income.manual ? (
                  <TextInput
                    radius="md"
                    size="xs"
                    type="number"
                    value={income.value ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "setIncome",
                        value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
                      })
                    }
                    placeholder="e.g. 12000"
                    styles={{ input: { fontSize: 15, fontWeight: 700, height: 32 } }}
                  />
                ) : income.source === "none" && additionalIncomeTotal === 0 ? (
                  "—"
                ) : (
                  zmw(totalIncome)
                )
              }
              subtext={
                income.manual
                  ? additionalIncomeTotal > 0
                    ? `+${zmw(additionalIncomeTotal)} additional`
                    : undefined
                  : income.source === "hrms"
                    ? `Confirmed via HRMS payroll${additionalIncomeTotal > 0 ? ` · +${zmw(additionalIncomeTotal)} additional` : ""}`
                    : income.source === "application"
                      ? "Reused from the loan application"
                      : income.source === "none"
                        ? additionalIncomeTotal > 0
                          ? "HRMS not available — additional income only"
                          : "Not available"
                        : undefined
              }
              badge={
                !income.manual && income.status !== "loading" ? (
                  <SourceBadge source={income.source} />
                ) : income.manual ? (
                  <SourceBadge source="manual" />
                ) : undefined
              }
              action={
                !readOnly && income.status !== "loading" ? (
                  income.manual ? (
                    <InlineAction
                      label="Use source value"
                      variant="ghost"
                      onClick={() => dispatch({ type: "manualIncome", on: false })}
                    />
                  ) : (
                    <InlineAction
                      label="Enter manually"
                      variant="ghost"
                      onClick={() => dispatch({ type: "manualIncome", on: true })}
                    />
                  )
                ) : undefined
              }
            />

            {income.additionalIncome.length > 0 && income.status !== "loading" && (
              <Badge
                size="xs"
                radius="xl"
                color="brand"
                variant="light"
                style={{ cursor: "pointer", alignSelf: "flex-start" }}
                onClick={() => dispatch({ type: "openIncomeModal" })}
                leftSection={<IconPlus size={10} />}
              >
                {income.additionalIncome.length} additional income source
                {income.additionalIncome.length > 1 ? "s" : ""}
              </Badge>
            )}

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
          onRefresh={() => dispatch({ type: "fetchCredit" })}
        />
      </Stack>

      {/* ---------------- Right: bureau data ---------------- */}
      <Stack gap={14} style={{ minWidth: 0 }}>
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
                onClick={() => dispatch({ type: "fetchCredit" })}
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
              <StatMini icon={IconGauge} label="Outstanding" value={zmw(liab.outstanding)} />
              <StatMini icon={IconRefresh} label="Obligations" value={zmw(liab.obligations)} />
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
            !readOnly && liab.status !== "loading" ? (
              <>
                {!liab.manual && (
                  <InlineAction
                    label="Refresh"
                    icon={IconRefresh}
                    onClick={() => dispatch({ type: "fetchLiabilities" })}
                  />
                )}
                {liab.manual && (
                  <InlineAction
                    label="Use source value"
                    variant="ghost"
                    onClick={() => dispatch({ type: "manualLiabilities", on: false })}
                  />
                )}
                <InlineAction
                  label="View"
                  icon={IconEye}
                  variant="ghost"
                  onClick={() => dispatch({ type: "openLiabilitiesModal" })}
                />
                <InlineAction
                  label="Add"
                  icon={IconPlus}
                  variant="ghost"
                  onClick={() => {
                    dispatch({ type: "addAdditionalRecord" });
                    dispatch({ type: "openLiabilitiesModal" });
                  }}
                />
              </>
            ) : undefined
          }
        >
          <CompactRow
            last
            label="Total monthly obligations"
            value={
              liab.status === "loading" ? (
                <Text fz={13} c="slate.4" fw={500}>
                  Fetching…
                </Text>
              ) : liab.manual && liab.obligations == null && additionalTotal === 0 ? (
                <TextInput
                  radius="md"
                  size="xs"
                  type="number"
                  value={liab.obligations ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "setObligations",
                      value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
                    })
                  }
                  placeholder="e.g. 5000"
                  styles={{ input: { fontSize: 15, fontWeight: 700, height: 32 } }}
                />
              ) : totalObligations == null ? (
                "—"
              ) : (
                `${zmw(totalObligations)}/mo`
              )
            }
            subtext={
              liab.manual
                ? additionalTotal > 0
                  ? `Bureau unavailable · +${zmw(additionalTotal)} additional`
                  : "Bureau unavailable — enter manually"
                : liab.status !== "loading"
                  ? `${liab.activeLoans ?? "—"} active loans · ${zmw(liab.outstanding)} outstanding${additionalTotal > 0 ? ` · +${zmw(additionalTotal)} additional` : ""}`
                  : undefined
            }
            badge={
              !liab.manual && liab.status !== "loading" ? (
                <SourceBadge source={liab.source} />
              ) : liab.manual ? (
                <SourceBadge source="manual" />
              ) : undefined
            }
          />

          {liab.status !== "loading" &&
            ((liab.records ?? []).length > 0 || liab.additionalRecords.length > 0) && (
              <Group gap={6} mt={10}>
                {(liab.records ?? []).length > 0 && (
                  <Badge
                    size="xs"
                    radius="xl"
                    color="warning"
                    variant="light"
                    style={{ cursor: "pointer" }}
                    onClick={() => dispatch({ type: "openLiabilitiesModal" })}
                  >
                    {(liab.records ?? []).length} from bureau
                  </Badge>
                )}
                {liab.additionalRecords.length > 0 && (
                  <Badge
                    size="xs"
                    radius="xl"
                    color="brand"
                    variant="light"
                    style={{ cursor: "pointer" }}
                    onClick={() => dispatch({ type: "openLiabilitiesModal" })}
                  >
                    {liab.additionalRecords.length} additional
                  </Badge>
                )}
              </Group>
            )}
        </SectionCard>
      </Stack>
    </SimpleGrid>
  );
}

// ---------------------------------------------------------------------------
// Decision card
// ---------------------------------------------------------------------------

function DecisionCard({
  calc,
}: {
  calc: EligibilityCalc | null;
  requested: number;
  onContinue: () => void;
  onUseEligible: (confirmed: boolean) => void;
  onReview: (action: "useEligible" | "review") => void;
  confirm: boolean;
  readOnly?: boolean;
}) {
  if (!calc) {
    return (
      <Paper
        className="ps-surface"
        withBorder
        radius="lg"
        p="md"
        bg="white"
        style={{ borderColor: "var(--mantine-color-slate-2)" }}
      >
        <Group gap={12} wrap="nowrap">
          <Box
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "var(--mantine-color-slate-1)",
            }}
          >
            <IconHelp size={18} color="var(--mantine-color-slate-5)" />
          </Box>
          <Box>
            <Text fz={13.5} fw={700} c="slate.9">
              Prescreening incomplete
            </Text>
            <Text fz={12} c="slate.5">
              Resolve the missing data above to reach a decision.
            </Text>
          </Box>
        </Group>
      </Paper>
    );
  }
}

function reducer(state: PrescreeningState, action: any): PrescreeningState {
  switch (action.type) {
    case "fetchCredit":
      return { ...state, credit: { ...state.credit, status: "loading" } };
    case "resolveCreditFetch":
      return {
        ...state,
        credit: {
          ...state.credit,
          status: "idle",
          value: action.value,
          source: action.source,
          riskBand: action.riskBand ?? state.credit.riskBand,
          activeAccounts: action.activeAccounts ?? state.credit.activeAccounts,
          delinquentAccounts: action.delinquentAccounts ?? state.credit.delinquentAccounts,
          recentEnquiries: action.recentEnquiries ?? state.credit.recentEnquiries,
        },
      };
    case "manualCredit":
      return {
        ...state,
        credit: {
          ...state.credit,
          manual: action.on,
          source: action.on ? "manual" : state.credit.source,
        },
      };
    case "setCredit":
      return { ...state, credit: { ...state.credit, value: action.value } };
    case "setCreditReason":
      return { ...state, credit: { ...state.credit, reason: action.value } };

    case "fetchLiabilities":
      return { ...state, liabilities: { ...state.liabilities, status: "loading" } };
    case "resolveLiabFetch":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          status: "idle",
          obligations: action.obligations,
          activeLoans: action.activeLoans,
          outstanding: action.outstanding,
          source: action.source,
          records: action.records ?? state.liabilities.records ?? [],
        },
      };
    case "manualLiabilities":
      // Only relevant when the bureau has no data at all — lets the user key
      // in a total obligations figure by hand instead of a bureau read.
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          manual: action.on,
          source: action.on ? "manual" : (state.liabilities.records.length > 0 ? "bureau" : "unavailable"),
        },
      };
    case "addAdditionalRecord":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          additionalRecords: [
            ...state.liabilities.additionalRecords,
            { institution: "", facilityType: "Personal Loan", outstanding: 0, monthlyPayment: 0, status: "Active", source: "manual" }
          ]
        }
      };
    case "updateAdditionalRecord":
      const updated = [...state.liabilities.additionalRecords];
      updated[action.index] = { ...updated[action.index], ...action.changes };
      return {
        ...state,
        liabilities: { ...state.liabilities, additionalRecords: updated }
      };
    case "removeAdditionalRecord":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          additionalRecords: state.liabilities.additionalRecords.filter((_, i) => i !== action.index)
        }
      };
    case "setObligations":
      return {
        ...state,
        liabilities: { ...state.liabilities, obligations: action.value },
      };
    case "setLiabReason":
      return { ...state, liabilities: { ...state.liabilities, reason: action.value } };

    case "fetchIncome":
      return { ...state, income: { ...state.income, status: "loading" } };
    case "resolveIncomeFetch":
      return {
        ...state,
        income: { ...state.income, status: "idle", value: action.value, source: action.source },
      };
    case "manualIncome":
      return {
        ...state,
        income: {
          ...state.income,
          manual: action.on,
          source: action.on ? "manual" : state.income.source,
        },
      };
    case "setIncome":
      return { ...state, income: { ...state.income, value: action.value } };
    case "setIncomeReason":
      return { ...state, income: { ...state.income, reason: action.value } };
    case "addIncomeRecord":
      return {
        ...state,
        income: {
          ...state.income,
          additionalIncome: [
            ...state.income.additionalIncome,
            { type: "Rental", amount: 0 },
          ],
        },
      };
    case "updateIncomeRecord": {
      const updated = [...state.income.additionalIncome];
      updated[action.index] = { ...updated[action.index], ...action.changes };
      return {
        ...state,
        income: { ...state.income, additionalIncome: updated },
      };
    }
    case "removeIncomeRecord":
      return {
        ...state,
        income: {
          ...state.income,
          additionalIncome: state.income.additionalIncome.filter((_, i) => i !== action.index),
        },
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Top-level tabs: Details | Limit Assessment
// ---------------------------------------------------------------------------

type TopTab = "details" | "limitAssessment";

function TopTabs({ tab, setTab }: { tab: TopTab; setTab: (t: TopTab) => void }) {
  const tabs: { key: TopTab; label: string; icon: React.FC<any> }[] = [
    { key: "details", label: "Details", icon: IconClipboardList },
    { key: "limitAssessment", label: "Limit Assessment", icon: IconGaugeTab },
  ];
  return (
    <Group
      gap={2}
      px={20}
      pt={8}
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
            py={9}
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
    </Group>
  );
}

function PrescreeningWorkspace({
  values,
  readOnly = false,
  onSubmitReady,
}: {
  values: LoanApplicationValues;
  readOnly?: boolean;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
}) {
  const loanTypeId = DUMMY_PRESCREENING_CONTEXT.loanTypeId;
  const policy = POLICY[loanTypeId];
  const rate = DUMMY_PRESCREENING_CONTEXT.loanRate;
  const tenure = Number(values.tenureMonths) || 0;

  const [state, setState] = useState<PrescreeningState>(() =>
    buildInitialState(DEFAULT_SCENARIO),
  );
  const [requested, setRequested] = useState(values.loanAmount);
  const [confirm, setConfirm] = useState(false);
  const [continued, setContinued] = useState(false);
  const [liabOpen, setLiabOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [topTab, setTopTab] = useState<TopTab>("details");

  function dispatch(action: any) {
    if (action.type === "openLiabilitiesModal") {
      setLiabOpen(true);
      return;
    }
    if (action.type === "openIncomeModal") {
      setIncomeOpen(true);
      return;
    }
    setState((s) => reducer(s, action));
  }

  useEffect(() => {
    if (state.credit.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({
          type: "resolveCreditFetch",
          value: s.credit,
          source: s.creditSource,
          riskBand: s.riskBand ?? null,
          activeAccounts: s.activeAccounts ?? null,
          delinquentAccounts: s.delinquentAccounts ?? null,
          recentEnquiries: s.recentEnquiries ?? null,
        });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.credit.status]);

  useEffect(() => {
    if (state.liabilities.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        const records = s.liabilities ?? [];
        dispatch({
          type: "resolveLiabFetch",
          obligations: s.obligations,
          activeLoans: records.length || (s.obligations != null ? 2 : null),
          outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null,
          source: s.obligationsSource,
          records,
        });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.liabilities.status]);

  useEffect(() => {
    if (state.income.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveIncomeFetch", value: s.income, source: s.incomeSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.income.status]);

  const riskScore = useMemo(
    () =>
      calcRiskScore({
        creditScore: state.credit.value,
        delinquentAccounts: state.credit.delinquentAccounts,
        recentEnquiries: state.credit.recentEnquiries,
        liabilityRecords: state.liabilities.records,
      }),
    [
      state.credit.value,
      state.credit.delinquentAccounts,
      state.credit.recentEnquiries,
      state.liabilities.records,
    ],
  );

  const additionalObligationsTotal = useMemo(
    () => state.liabilities.additionalRecords.reduce((sum, r) => sum + (r.monthlyPayment || 0), 0),
    [state.liabilities.additionalRecords],
  );
  const totalObligations =
    state.liabilities.obligations == null && additionalObligationsTotal === 0
      ? null
      : (state.liabilities.obligations ?? 0) + additionalObligationsTotal;

  const additionalIncomeTotal = useMemo(
    () => state.income.additionalIncome.reduce((sum, r) => sum + (r.amount || 0), 0),
    [state.income.additionalIncome],
  );
  const totalIncome =
    state.income.value == null && additionalIncomeTotal === 0
      ? null
      : (state.income.value ?? 0) + additionalIncomeTotal;

  const calc = useMemo(() => {
    return calcEligibility({
      income: totalIncome,
      obligations: totalObligations,
      maxDTI: policy.maxDTI,
      annualRate: rate,
      tenureMonths: tenure,
      productMax: policy.productMax,
      creditScore: state.credit.value,
      minCreditScore: policy.minCreditScore,
    });
  }, [
    state.credit.value,
    totalObligations,
    totalIncome,
    policy,
    rate,
    tenure,
  ]);

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

  function handleUseEligible(confirmed: boolean) {
    if (confirmed && calc) {
      setRequested(Math.round(calc.eligibleAmount));
    }
    setConfirm(false);
  }
  const isEligible = !!calc && calc.mandatoryPassed && calc.eligibleAmount >= requested;

  useEffect(() => {
    onSubmitReady?.(isEligible, () => setContinued(true));
  }, [isEligible]);

  if (continued) {
    return (
      <Box
        py={80}
        px={30}
        ta="center"
        className="ps-fade-up"
        style={{
          height: "100%",
          background:
            "linear-gradient(180deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-slate-0) 320px)",
        }}
      >
        <Box
          mx="auto"
          mb={16}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, var(--mantine-color-success-4), var(--mantine-color-success-6))",
            boxShadow:
              "0 10px 26px -10px color-mix(in srgb, var(--mantine-color-success-6) 80%, transparent)",
          }}
        >
          <IconCircleCheck size={30} color="var(--mantine-color-white)" />
        </Box>
        <Text fz={17} fw={800} c="slate.9">
          Moving to Stage 3 — Loan Appraisal
        </Text>
        <Text fz={13} c="slate.5" mt={6} style={NUMERIC}>
          Requested amount confirmed at {zmw(requested)}.
        </Text>
      </Box>
    );
  }

  const decisionNode = (
    <DecisionCard
      calc={calc}
      requested={requested}
      onContinue={() => setContinued(true)}
      onUseEligible={handleUseEligible}
      onReview={(a) => a === "useEligible" && setConfirm(true)}
      confirm={confirm}
      readOnly={readOnly}
    />
  );

  const missing: string[] = [];
  if (state.credit.value == null) missing.push("Credit score");
  if (totalObligations == null) missing.push("Liability information");
  if (totalIncome == null) missing.push("Income");

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <TopTabs tab={topTab} setTab={setTopTab} />

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
          <Box px={18} pt={16} pb={16}>
            <PrescreeningOverview
              state={state}
              dispatch={dispatch}
              readOnly={readOnly}
              calc={calc}
              requested={requested}
              maxDTI={policy.maxDTI}
              productMax={policy.productMax}
              riskScore={riskScore}
              creditLoading={state.credit.status === "loading"}
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

            {!calc && (
              <Paper
                withBorder
                radius="lg"
                p="xl"
                ta="center"
                mt={14}
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

            {/* Decision — full width */}
            <Box mt={14}>{decisionNode}</Box>
          </Box>
        ) : (
          <LimitAssessment
            state={state}
            calc={calc}
            requested={requested}
            income={totalIncome}
            obligations={totalObligations}
            maxDTI={policy.maxDTI}
            minCreditScore={policy.minCreditScore}
            productMax={policy.productMax}
            rate={rate}
            tenure={tenure}
            onRefreshAll={() => {
              dispatch({ type: "fetchCredit" });
              dispatch({ type: "fetchLiabilities" });
              dispatch({ type: "fetchIncome" });
            }}
          />
        )}
      </Box>

      <Modal
        opened={liabOpen}
        onClose={() => setLiabOpen(false)}
        title={
          <Group gap={10} wrap="nowrap">
            <IconTile icon={IconCircleDot} color="brand" size={28} iconSize={15} />
            <Box>
              <Text fz={14.5} fw={700} c="slate.9" lh={1.25}>
                Existing liabilities
              </Text>
              <Text fz={11} c="slate.5" lh={1.3}>
                Bureau facilities plus anything added by hand
              </Text>
            </Box>
          </Group>
        }
        radius="lg"
        size="lg"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Group gap={8} mb={8}>
          <MicroLabel c="slate.5">From credit bureau</MicroLabel>
          <Badge size="xs" radius="xl" color="slate" variant="light">
            View only
          </Badge>
        </Group>

        {state.liabilities.source === "unavailable" ? (
          <Box
            p={10}
            bg="slate.0"
            style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)" }}
          >
            {state.liabilities.manual ? (
              <Group justify="space-between" align="flex-end" wrap="nowrap">
                <TextInput
                  label="Total monthly obligations (bureau unavailable)"
                  size="xs"
                  type="number"
                  value={state.liabilities.obligations ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "setObligations",
                      value: e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
                    })
                  }
                  placeholder="e.g. 5000"
                  style={{ flex: 1 }}
                  disabled={readOnly}
                />
              </Group>
            ) : (
              <Text fz={12.5} c="slate.5">
                Bureau data is unavailable for this customer.
              </Text>
            )}
          </Box>
        ) : (
          <Box
            style={{
              border: "1px solid var(--mantine-color-slate-2)",
              borderRadius: "var(--mantine-radius-lg)",
              overflow: "hidden",
            }}
          >
            <Table fz={12.5}>
              <Table.Thead bg="slate.0">
                <Table.Tr>
                  <Table.Th>Institution</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Outstanding</Table.Th>
                  <Table.Th>Monthly Payment</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {state.liabilities.records && state.liabilities.records.length > 0 ? (
                  state.liabilities.records.map((r, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Text fz={12.5} c="slate.9">{r.institution}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz={12.5} c="slate.7">{r.facilityType}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz={12.5} c="slate.9">{zmw(r.outstanding)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz={12.5} c="slate.9">{zmw(r.monthlyPayment)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz={11.5} fw={600} c={r.status === "Active" ? "green.7" : "red.6"}>
                          {r.status}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text fz={12.5} c="slate.5" ta="center" py="md">
                        No liabilities found.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        )}

        <Group justify="space-between" align="center" mt="lg" mb={8} wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <MicroLabel c="slate.5">Additional liabilities</MicroLabel>
            <Text fz={11} c="slate.5" mt={2}>
              Facilities the bureau can't see — added on top of the figures above.
            </Text>
          </Box>
          {!readOnly && (
            <Button
              size="compact-sm"
              radius="md"
              variant="light"
              style={{ flexShrink: 0 }}
              leftSection={<IconPlus size={13} />}
              onClick={() => dispatch({ type: "addAdditionalRecord" })}
            >
              Add liability
            </Button>
          )}
        </Group>

        <Box
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-lg)",
            overflow: "hidden",
          }}
        >
          <Table fz={12.5}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th>Institution</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Outstanding</Table.Th>
                <Table.Th>Monthly Payment</Table.Th>
                {!readOnly && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {state.liabilities.additionalRecords.length > 0 ? (
                state.liabilities.additionalRecords.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={r.institution}
                        onChange={(e) => dispatch({ type: "updateAdditionalRecord", index: i, changes: { institution: e.currentTarget.value } })}
                        placeholder="Institution"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={r.facilityType}
                        onChange={(e) => dispatch({ type: "updateAdditionalRecord", index: i, changes: { facilityType: e.currentTarget.value } })}
                        placeholder="Type"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="number"
                        value={r.outstanding || ""}
                        onChange={(e) => dispatch({ type: "updateAdditionalRecord", index: i, changes: { outstanding: Number(e.currentTarget.value) } })}
                        placeholder="0"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="number"
                        value={r.monthlyPayment || ""}
                        onChange={(e) => dispatch({ type: "updateAdditionalRecord", index: i, changes: { monthlyPayment: Number(e.currentTarget.value) } })}
                        placeholder="0"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    {!readOnly && (
                      <Table.Td>
                        <ActionIcon size="sm" color="red" variant="subtle" onClick={() => dispatch({ type: "removeAdditionalRecord", index: i })}>
                          <IconX size={14} />
                        </ActionIcon>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={readOnly ? 4 : 5}>
                    <Text fz={12.5} c="slate.5" ta="center" py="md">
                      No additional liabilities added.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Modal>

      <Modal
        opened={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        title={
          <Group gap={10} wrap="nowrap">
            <IconTile icon={IconCoins} color="brand" size={28} iconSize={15} />
            <Box>
              <Text fz={14.5} fw={700} c="slate.9" lh={1.25}>
                Additional income
              </Text>
              <Text fz={11} c="slate.5" lh={1.3}>
                Counted on top of the primary {zmw(state.income.value)} payroll income
              </Text>
            </Box>
          </Group>
        }
        radius="lg"
        size="lg"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Group justify="space-between" align="center" mb={8} wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <MicroLabel c="slate.5">Income sources</MicroLabel>
            <Text fz={11} c="slate.5" mt={2}>
              Rental, pension, business or any other recurring income.
            </Text>
          </Box>
          {!readOnly && (
            <Button
              size="compact-sm"
              radius="md"
              variant="light"
              style={{ flexShrink: 0 }}
              leftSection={<IconPlus size={13} />}
              onClick={() => dispatch({ type: "addIncomeRecord" })}
            >
              Add income source
            </Button>
          )}
        </Group>

        <Box
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-lg)",
            overflow: "hidden",
          }}
        >
          <Table fz={12.5}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Monthly amount</Table.Th>
                {!readOnly && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {state.income.additionalIncome.length > 0 ? (
                state.income.additionalIncome.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={r.type}
                        onChange={(e) => dispatch({ type: "updateIncomeRecord", index: i, changes: { type: e.currentTarget.value } })}
                        placeholder="e.g. Rental, Pension"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="number"
                        value={r.amount || ""}
                        onChange={(e) => dispatch({ type: "updateIncomeRecord", index: i, changes: { amount: Number(e.currentTarget.value) } })}
                        placeholder="0"
                        disabled={readOnly}
                      />
                    </Table.Td>
                    {!readOnly && (
                      <Table.Td>
                        <ActionIcon size="sm" color="red" variant="subtle" onClick={() => dispatch({ type: "removeIncomeRecord", index: i })}>
                          <IconX size={14} />
                        </ActionIcon>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={readOnly ? 2 : 3}>
                    <Text fz={12.5} c="slate.5" ta="center" py="md">
                      No additional income sources added.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Modal>
    </Box>
  );
}

export function PreScreeningModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  embedded = false,
  readOnly = false,
  onMinimize,
}: PreScreeningModalProps) {
  const [section, setSection] = useState<Section>("prescreening");
  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  // Add this early return for the embedded state
  if (embedded) {
    return (
      <PrescreeningWorkspace
        values={applicationValues}
        readOnly={readOnly}
        onSubmitReady={handleSubmitReady}
      />
    );
  }
  const bodyContent = (
    <Box
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {!embedded && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={10}
          style={{
            background:
              "linear-gradient(120deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-5) 55%, var(--mantine-color-brand-6) 100%)",
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap={11}>
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                display: "grid",
                placeItems: "center",
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
              }}
            >
              <IconGauge size={17} color="var(--mantine-color-white)" stroke={2} />
            </Box>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Loan application
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Stage 2 — Prescreening
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
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={onClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>
      )}

      <ContextHeader
        values={applicationValues}
        applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
      />

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <LeftNav section={section} setSection={setSection} />

        <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {section === "application" ? (
            <Box style={{ height: "100%" }}>
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

          ) : (
            <PrescreeningWorkspace
              values={applicationValues}
              readOnly={readOnly}
              onSubmitReady={handleSubmitReady}
            />
          )}
        </Box>
      </Box>
      {!embedded && !readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={12}
          bg="white"
          style={{
            borderTop: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "0 -6px 18px -14px rgba(15, 23, 42, 0.45)",
            flexShrink: 0,
          }}
        >
          <Group gap={8} wrap="nowrap">
            {canSubmit ? (
              <IconCircleCheck size={15} color="var(--mantine-color-success-6)" />
            ) : (
              <IconInfoCircle size={15} color="var(--mantine-color-slate-4)" />
            )}
            <Text fz={12} c={canSubmit ? "success.7" : "slate.5"} fw={canSubmit ? 600 : 500}>
              {canSubmit
                ? "All prescreening checks passed — ready for appraisal."
                : "Resolve the outstanding checks to continue."}
            </Text>
          </Group>
          <Group gap={10}>
            <Button variant="subtle" color="slate" radius="md" fw={600} onClick={onClose}>
              Cancel
            </Button>
            <Button
              radius="md"
              onClick={handleSubmit}
              disabled={!canSubmit}
              rightSection={<IconArrowRight size={16} />}
              styles={{
                root: canSubmit
                  ? {
                      background:
                        "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                      boxShadow:
                        "0 8px 18px -10px color-mix(in srgb, var(--mantine-color-brand-6) 90%, transparent)",
                    }
                  : undefined,
              }}
            >
              Submit
            </Button>
          </Group>
        </Group>
      )}
    </Box>
  );

  if (embedded) {
    return (
      <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {bodyContent}
      </Box>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1400}
      padding={0}
      closeOnClickOutside={false}
        closeOnEscape={false}
      lockScroll
      styles={{
        content: {
          height: "95vh",
          maxHeight: "95vh",
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
      {bodyContent}
    </Modal>
  );
}