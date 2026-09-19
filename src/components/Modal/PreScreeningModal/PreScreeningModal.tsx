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
  IconPercentage,
  IconArrowRight,
  IconMinus,
  IconCircleDot,
  IconCalculator,
  IconTargetArrow,
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
  PrescreeningState,
} from "./PreScreeningShared";
import {
  POLICY,
  SCENARIOS,
  DEFAULT_SCENARIO,
  zmw,
  calcEligibility,
  calcRiskScore,
  type RiskScoreResult,
  SourceBadge,
  MiniStat,
  CalcRow,
  RuleRow,
  ContextHeader,
  buildInitialState,
  CompactRow,
} from "./PreScreeningShared";
// ---------------------------------------------------------------------------
// Requested vs. eligible amount — donut utilization gauge with a headroom
// readout, instead of a linear track-and-tick bar.
// ---------------------------------------------------------------------------

// function AmountUtilizationGauge({
//   requested,
//   eligible,
// }: {
//   requested: number;
//   eligible: number;
// }) {
//   const ratio = eligible > 0 ? requested / eligible : 0;
//   const pctClamped = Math.max(0, Math.min(100, ratio * 100));
//   const exceeds = requested > eligible;
//   const headroom = eligible - requested;
//   const tone = exceeds ? "orange" : "green";

//   return (
//     <Group gap={12} wrap="nowrap" align="center" mt={8}>
//       <Box
//         style={{
//           position: "relative",
//           width: 56,
//           height: 56,
//           flexShrink: 0,
//           borderRadius: "50%",
//           background: `conic-gradient(var(--mantine-color-${tone}-5) ${pctClamped}%, var(--mantine-color-slate-2) ${pctClamped}% 100%)`,
//           transition: "background 300ms ease",
//         }}
//       >
//         <Box
//           style={{
//             position: "absolute",
//             inset: 5,
//             borderRadius: "50%",
//             background: "white",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Text fz={13} fw={800} c="slate.9" style={{ lineHeight: 1 }}>
//             {Math.round(ratio * 100)}%
//           </Text>
//         </Box>
//       </Box>

//       <Box style={{ flex: 1, minWidth: 0 }}>
//         <Group gap={10} mb={5}>
//           <Group gap={4} wrap="nowrap">
//             <Box style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mantine-color-indigo-5)", flexShrink: 0 }} />
//             <Text fz={10.5} c="slate.5" truncate>
//               Requested {zmw(requested)}
//             </Text>
//           </Group>
//           <Group gap={4} wrap="nowrap">
//             <Box style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mantine-color-teal-5)", flexShrink: 0 }} />
//             <Text fz={10.5} c="slate.5" truncate>
//               Eligible {zmw(eligible)}
//             </Text>
//           </Group>
//         </Group>
//         <Group gap={5} wrap="nowrap">
//           <ThemeIcon size={14} radius="xl" variant="light" color={tone}>
//             {exceeds ? <IconAlertTriangle size={9} /> : <IconCircleCheck size={9} />}
//           </ThemeIcon>
//           <Text fz={11.5} fw={700} c={`${tone}.7`}>
//             {exceeds
//               ? `${zmw(Math.abs(headroom))} over eligible limit`
//               : `${zmw(headroom)} headroom remaining`}
//           </Text>
//         </Group>
//       </Box>
//     </Group>
//   );
// }
function AmountUtilizationGauge({
  requested,
  eligible,
}: {
  requested: number;
  eligible: number;
}) {
  const ratio = eligible > 0 ? requested / eligible : 0;
  const pct = Math.max(0, Math.min(100, ratio * 100));
  const exceeds = requested > eligible;
  const headroom = eligible - requested;
  const tone = exceeds ? "orange" : "green";

  return (
    // LAYOUT: mt 12 -> 8
    <Box mt={8}>
      <Group justify="space-between" align="center" mb={6}>
        <Group gap={6} wrap="nowrap">
          <Box
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--mantine-color-indigo-5)",
            }}
          />
          <Text fz={11.5} fw={600} c="slate.6">
            Requested: {zmw(requested)}
          </Text>
        </Group>

        <Group gap={6} wrap="nowrap">
          <Text fz={11.5} fw={600} c="slate.6">
            Maximum eligible: {zmw(eligible)}
          </Text>
        </Group>
      </Group>

      <Box
        style={{
          height: 7,
          borderRadius: 99,
          background: "var(--mantine-color-slate-2)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `var(--mantine-color-${tone}-5)`,
            borderRadius: 99,
            transition: "width 250ms ease",
          }}
        />
      </Box>

      {/* LAYOUT: mt 8 -> 6 */}
      <Group justify="space-between" mt={6} gap={10} wrap="nowrap">
        <Text fz={11} c="slate.5">
          Capacity utilization
        </Text>

        <Badge size="sm" radius="sm" color={tone} variant="light">
          {exceeds
            ? `${zmw(Math.abs(headroom))} over eligible limit`
            : `${Math.round(ratio * 100)}% utilized · ${zmw(headroom)} headroom remaining`}
        </Badge>
      </Group>
    </Box>
  );
}

function PrescreeningOverview({
  state,
  dispatch,
  readOnly,
  calc,
  requested,
  maxDTI,
  leftSlot,
  rightSlot,
}: {
  state: PrescreeningState;
  dispatch: (a: any) => void;
  readOnly?: boolean;
  calc: EligibilityCalc | null;
  requested: number;
  maxDTI: number;
  productMax: number;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const credit = state.credit;
  const liab = state.liabilities;
  const income = state.income;
  const additionalTotal = liab.additionalRecords.reduce((sum, r) => sum + (r.monthlyPayment || 0), 0);
  const totalObligations = liab.obligations == null && additionalTotal === 0 ? null : (liab.obligations ?? 0) + additionalTotal;
  const additionalIncomeTotal = income.additionalIncome.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalIncome = income.value == null && additionalIncomeTotal === 0 ? null : (income.value ?? 0) + additionalIncomeTotal;

  const rawCreditScore = credit.value;

  const scoreRatio =
    rawCreditScore == null
      ? 0
      : Math.max(
        0,
        Math.min(1, (rawCreditScore - 300) / (850 - 300)),
      );

  const gaugeAngle = Math.PI - scoreRatio * Math.PI;

  const needleLength = 46;

  const needleX = 90 + Math.cos(gaugeAngle) * needleLength;
  const needleY = 88 - Math.sin(gaugeAngle) * needleLength;

  const creditStatus =
    credit.status === "loading"
      ? "Refreshing…"
      : credit.source === "unavailable" && !credit.manual
        ? "Unavailable"
        : credit.manual
          ? "Manual entry"
          : "Verified feed";

  const creditStatusColor =
    credit.status === "loading"
      ? "gray"
      : credit.source === "unavailable" && !credit.manual
        ? "orange"
        : credit.manual
          ? "indigo"
          : "green";

  const obligationRatio =
    totalIncome && totalIncome > 0 && totalObligations != null
      ? Math.round((totalObligations / totalIncome) * 100)
      : null;


  return (
    // LAYOUT: fills the height handed down by the workspace instead of
    // sizing to its own content.
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
      }}
    >
      {/* Left: Monthly Income + DTI | Right: Credit Score + Liabilities in ONE card */}
      <SimpleGrid
        cols={{ base: 1, sm: 2 }}
        spacing={12}
        style={{
          flex: 1,
          minHeight: 0,
          alignItems: "stretch",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        }}
      >
        <Paper
          withBorder
          radius="lg"
          w="100%"
          style={{
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",        // was "visible" — this is what let it bleed
            flex: "0 0 auto",          // was "1 1 0"
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            px={12}
            py={8}
            style={{
              borderBottom: "1px solid var(--mantine-color-slate-1)",
              flexShrink: 0,
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap={7}>
                <ThemeIcon radius="md" size={22} variant="light" color="brand">
                  <IconFileText size={12} />
                </ThemeIcon>
                {/* <Text fz={13} fw={700} c="slate.9">
                  Loan Details
                </Text> */}
                <Box>
                  <Text fz={14} fw={700} c="slate.9">
                    Loan Details
                  </Text>

                  <Text fz={11.5} c="slate.5" mt={2}>
                    Primary income verification and headroom analysis
                  </Text>
                </Box>
              </Group>
              {!readOnly && (
                <Group gap={12} wrap="nowrap">
                  <UnstyledButton onClick={() => dispatch({ type: "fetchIncome" })}>
                    <Group gap={4} wrap="nowrap">
                      <IconRefresh size={11} color="var(--mantine-color-brand-6)" />
                      <Text fz={11} fw={600} c="brand.6">
                        Refresh
                      </Text>
                    </Group>
                  </UnstyledButton>
                  <UnstyledButton onClick={() => dispatch({ type: "openIncomeModal" })}>
                    <Text fz={11} fw={600} c="brand.6">
                      Additional income
                    </Text>
                  </UnstyledButton>
                </Group>
              )}
            </Group>
          </Box>

          {/* LAYOUT: gap 10 -> 8, p 16 -> 12 */}
          <Stack
            gap={8}
            p={12}
            style={{
              flex: 1,
              minHeight: 0,
              justifyContent: "space-between",
            }}
          >
            {/* LAYOUT: minHeight 140 removed — this block now shares leftover
                space with the requested/eligible block below it. */}
            <Box
              p={10}
              bg="slate.0"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                border: "1px solid var(--mantine-color-slate-1)",
                borderRadius: "var(--mantine-radius-md)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <CompactRow
                last
                label="Monthly income"
                value={
                  income.status === "loading"
                    ? "Checking HRMS…"
                    : income.manual
                      ? (
                        <TextInput
                          radius="sm"
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
                          styles={{ input: { fontSize: 14, fontWeight: 700, height: 30 } }}
                        />
                      )
                      : income.source === "none" && additionalIncomeTotal === 0
                        ? "—"
                        : zmw(totalIncome)
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
                    <Group gap={12} wrap="nowrap">
                      {income.manual ? (
                        <UnstyledButton onClick={() => dispatch({ type: "manualIncome", on: false })}>
                          <Text fz={11.5} fw={600} c="brand.6">
                            Use source value
                          </Text>
                        </UnstyledButton>
                      ) : (
                        <UnstyledButton onClick={() => dispatch({ type: "manualIncome", on: true })}>
                          <Text fz={11.5} fw={600} c="brand.6">
                            Enter manually
                          </Text>
                        </UnstyledButton>
                      )}
                    </Group>
                  ) : undefined
                }
              />
              {income.additionalIncome.length > 0 && income.status !== "loading" && (
                <Box mt={4}>
                  <Badge
                    size="xs"
                    radius="xl"
                    color="indigo"
                    variant="light"
                    style={{ cursor: "pointer" }}
                    onClick={() => dispatch({ type: "openIncomeModal" })}
                  >
                    {income.additionalIncome.length} additional income source
                    {income.additionalIncome.length > 1 ? "s" : ""}
                  </Badge>
                </Box>
              )}
            </Box>

            {/* LAYOUT: minHeight 82 removed, p 12 -> 10, fixed height band. */}
            <Box
              p={10}
              bg={calc ? (calc.dtiPassed ? "green.0" : "red.0") : "slate.0"}
              style={{
                flex: "0 0 auto",
                borderRadius: "var(--mantine-radius-md)",
                border: `1px solid var(--mantine-color-${calc ? (calc.dtiPassed ? "green" : "red") : "slate"}-2)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Group justify="space-between" mb={5}>
                <Group gap={6}>
                  <IconInfoCircle size={12} color={`var(--mantine-color-${calc ? (calc.dtiPassed ? "green" : "red") : "slate"}-6)`} />
                  <Text fz={12} fw={700} c="slate.9">
                    Debt-to-Income Ratio
                  </Text>
                </Group>
                <Group gap={7}>
                  <Text fz={13} fw={700} c="slate.9">
                    {calc ? `${calc.customerDTI.toFixed(0)}%` : "—"}
                  </Text>
                  {calc && (
                    <Badge
                      size="xs"
                      radius="xl"
                      variant="light"
                      color={calc.dtiPassed ? "green" : "red"}
                    >
                      {calc.dtiPassed ? "Within limit" : `Exceeds ${maxDTI}%`}
                    </Badge>
                  )}
                </Group>
              </Group>
              <Box style={{ height: 4, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <Box
                  style={{
                    height: "100%",
                    width: calc ? `${Math.min(100, (calc.customerDTI / maxDTI) * 100)}%` : "0%",
                    background: `var(--mantine-color-${calc ? (calc.dtiPassed ? "green" : "red") : "slate"}-5)`,
                    borderRadius: 99,
                    transition: "width 300ms ease",
                  }}
                />
              </Box>
            </Box>

            {calc && calc.mandatoryPassed && (
              // LAYOUT: minHeight 120 removed, p 12 -> 10, shares leftover space.
              <Box
                p={10}
                style={{
                  flex: "1 1 0",
                  minHeight: 0,
                  border: "1px solid var(--mantine-color-slate-2)",
                  borderRadius: "var(--mantine-radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Group justify="space-between" mb={6} align="flex-start">
                  <Group gap={7} align="flex-start">
                    <ThemeIcon radius="md" size={22} variant="light" color="indigo">
                      <IconTargetArrow size={12} />
                    </ThemeIcon>
                    <Box>
                      <Text fz={11} c="slate.5">
                        Requested loan
                      </Text>
                      <Text fz={13.5} fw={700} c="slate.9">
                        {zmw(requested)}
                      </Text>
                    </Box>
                  </Group>
                  <Group gap={7} align="flex-start">
                    <Box ta="right">
                      <Text fz={11} c="slate.5">
                        Maximum eligible amount
                      </Text>
                      <Text fz={13.5} fw={700} c="slate.9">
                        {zmw(calc.eligibleAmount)}
                      </Text>
                    </Box>
                    <ThemeIcon radius="md" size={22} variant="light" color="teal">
                      <IconGauge size={12} />
                    </ThemeIcon>
                  </Group>
                </Group>
                <AmountUtilizationGauge
                  requested={requested}
                  eligible={calc.eligibleAmount}
                />
              </Box>
            )}

            {leftSlot && (
              <Box style={{ flexShrink: 0 }}>{leftSlot}</Box>
            )}
          </Stack>
        </Paper>

        <Stack
          gap={6}
          w="100%"
          style={{
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >

          <Paper
            withBorder
            radius="lg"
            p={0}
            w="100%"
            style={{
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--mantine-color-slate-2)",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              background: "white",
            }}
          >
            {/* ============================================================
      HEADER
      ============================================================ */}
            <Box
              px={10}
              py={8}
              style={{
                flexShrink: 0,
                borderBottom: "1px solid var(--mantine-color-slate-1)",
                background:
                  "linear-gradient(90deg, rgba(248,250,252,0.7), #fff 55%, #fff)",
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group
                  gap={8}
                  align="center"
                  wrap="nowrap"
                  style={{ minWidth: 0 }}
                >
                  <ThemeIcon
                    radius="md"
                    size={24}
                    variant="light"
                    color="indigo"
                    style={{
                      border: "1px solid var(--mantine-color-indigo-1)",
                      flexShrink: 0,
                    }}
                  >
                    <IconCircleCheck size={13} />
                  </ThemeIcon>

                  <Box style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <Text
                        fz={13}
                        fw={800}
                        c="slate.9"
                        style={{
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Credit Bureau Summary
                      </Text>

                      <Badge
                        size="xs"
                        radius="sm"
                        color={creditStatusColor}
                        variant="light"
                        styles={{
                          root: {
                            textTransform: "none",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          },
                        }}
                      >
                        {creditStatus}
                      </Badge>
                    </Group>

                    <Text fz={10.5} c="slate.5" mt={1}>
                      Credit reporting &amp; score summary
                    </Text>
                  </Box>
                </Group>

                {!readOnly && credit.status !== "loading" && (
                  <UnstyledButton
                    onClick={() => dispatch({ type: "fetchCredit" })}
                    style={{
                      flexShrink: 0,
                      border: "1px solid var(--mantine-color-slate-2)",
                      borderRadius: "var(--mantine-radius-md)",
                      padding: "5px 8px",
                      background: "white",
                    }}
                  >
                    <Group gap={4} wrap="nowrap">
                      <IconRefresh
                        size={11}
                        color="var(--mantine-color-slate-5)"
                      />

                      <Text fz={10.5} fw={700} c="slate.7">
                        Refresh
                      </Text>
                    </Group>
                  </UnstyledButton>
                )}
              </Group>
            </Box>

            {/* ============================================================
      SCORE COCKPIT
      ============================================================ */}
            <Box
              px={10}
              py={8}
              style={{
                flexShrink: 0,
                borderBottom: "1px solid var(--mantine-color-slate-1)",
                background:
                  "linear-gradient(180deg, rgba(248,250,252,0.55), #fff)",
              }}
            >
              <SimpleGrid
                cols={2}
                spacing={8}
                style={{
                  alignItems: "center",
                }}
              >
                {/* ----------------------------------------------------------
          GAUGE
          ---------------------------------------------------------- */}
                <Box
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    style={{
                      width: "100%",
                      height: 82,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-end",
                      overflow: "hidden",
                    }}
                  >
                    <svg
                      viewBox="0 0 180 100"
                      width="100%"
                      height="82"
                      preserveAspectRatio="xMidYMid meet"
                      aria-label="Credit score gauge"
                    >
                      <defs>
                        <linearGradient
                          id="creditScoreGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="30%" stopColor="#F97316" />
                          <stop offset="65%" stopColor="#EAB308" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>

                      {/* Background rail */}
                      <path
                        d="M 20 88 A 70 70 0 0 1 160 88"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="11"
                        strokeLinecap="round"
                      />

                      {/* Score rail */}
                      {rawCreditScore != null && (
                        <path
                          d="M 20 88 A 70 70 0 0 1 160 88"
                          fill="none"
                          stroke="url(#creditScoreGradient)"
                          strokeWidth="11"
                          strokeLinecap="round"
                          pathLength={1}
                          strokeDasharray={`${scoreRatio} 1`}
                        />
                      )}

                      {/* Left threshold tick */}
                      <line
                        x1="22"
                        y1="88"
                        x2="14"
                        y2="88"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                      />

                      {/* Right threshold tick */}
                      <line
                        x1="158"
                        y1="88"
                        x2="166"
                        y2="88"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                      />

                      {/* Needle */}
                      {rawCreditScore != null && (
                        <g>
                          <line
                            x1="90"
                            y1="88"
                            x2={needleX}
                            y2={needleY}
                            stroke="#1E293B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          <circle
                            cx="90"
                            cy="88"
                            r="6"
                            fill="#0F172A"
                          />

                          <circle
                            cx="90"
                            cy="88"
                            r="2.5"
                            fill="white"
                          />
                        </g>
                      )}
                    </svg>
                  </Box>

                  <Group
                    justify="space-between"
                    w="100%"
                    px={4}
                    mt={-1}
                    wrap="nowrap"
                  >
                    <Text
                      fz={8.5}
                      fw={700}
                      c="slate.4"
                      style={{
                        fontFamily: "monospace",
                      }}
                    >
                      300 POOR
                    </Text>

                    <Text
                      fz={8.5}
                      fw={700}
                      c="slate.4"
                      style={{
                        fontFamily: "monospace",
                      }}
                    >
                      850 EXCELLENT
                    </Text>
                  </Group>
                </Box>

                {/* ----------------------------------------------------------
          SCORE DETAILS
          ---------------------------------------------------------- */}
                <Box
                  pl={8}
                  style={{
                    minWidth: 0,
                    borderLeft: "1px solid var(--mantine-color-slate-1)",
                  }}
                >
                  <Text
                    fz={8.5}
                    fw={800}
                    c="slate.4"
                    tt="uppercase"
                    style={{
                      letterSpacing: "0.08em",
                      fontFamily: "monospace",
                    }}
                  >
                    Consumer credit score
                  </Text>

                  <Group
                    gap={7}
                    align="flex-end"
                    mt={2}
                    wrap="nowrap"
                  >
                    <Text
                      fz={27}
                      fw={800}
                      c={rawCreditScore != null ? "slate.9" : "slate.4"}
                      style={{
                        lineHeight: 1,
                        fontFamily: "monospace",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {rawCreditScore ?? "—"}
                    </Text>

                    <Text
                      fz={10}
                      fw={700}
                      c="slate.4"
                      mb={1}
                      style={{
                        fontFamily: "monospace",
                      }}
                    >
                      /850
                    </Text>
                  </Group>

                  <Group gap={5} mt={4} wrap="nowrap">
                    <Badge
                      size="xs"
                      radius="sm"
                      color={
                        credit.riskBand?.toLowerCase() === "low"
                          ? "green"
                          : credit.riskBand?.toLowerCase() === "medium"
                            ? "orange"
                            : "gray"
                      }
                      variant="light"
                    >
                      {credit.riskBand
                        ? `${credit.riskBand} risk`
                        : "Risk band unavailable"}
                    </Badge>
                  </Group>

                  <Box
                    mt={7}
                    p={6}
                    bg="slate.0"
                    style={{
                      border: "1px solid var(--mantine-color-slate-1)",
                      borderRadius: "var(--mantine-radius-md)",
                    }}
                  >
                    <Group justify="space-between" gap={6}>
                      <Text
                        fz={9.5}
                        fw={600}
                        c="slate.5"
                      >
                        Score source
                      </Text>

                      <Text
                        fz={9.5}
                        fw={700}
                        c="slate.8"
                        ta="right"
                      >
                        {credit.manual
                          ? "Manual"
                          : credit.source === "unavailable"
                            ? "Unavailable"
                            : "Bureau"}
                      </Text>
                    </Group>
                  </Box>
                </Box>
              </SimpleGrid>
            </Box>

            {/* ============================================================
      6-METRIC GRID
      ============================================================ */}
            <Box
              px={10}
              py={8}
              style={{
                flex: "1 1 0",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                mb={6}
                wrap="nowrap"
              >
                <Text
                  fz={9.5}
                  fw={800}
                  c="slate.5"
                  tt="uppercase"
                  style={{
                    letterSpacing: "0.07em",
                    fontFamily: "monospace",
                  }}
                >
                  Registry metrics
                </Text>

                <Text
                  fz={9}
                  c="slate.4"
                  ta="right"
                >
                  Bureau exposure
                </Text>
              </Group>

              <SimpleGrid
                cols={3}
                spacing={5}
                verticalSpacing={5}
                style={{
                  height: "calc(100% - 22px)",
                }}
              >
                {/* Risk Band */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Risk band
                  </Text>

                  <Text
                    fz={13}
                    fw={800}
                    c="slate.9"
                    mt={3}
                    truncate
                  >
                    {credit.riskBand ?? "—"}
                  </Text>
                </Box>

                {/* Active Accounts */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Active accounts
                  </Text>

                  <Text
                    fz={13}
                    fw={800}
                    c="slate.9"
                    mt={3}
                    style={{ fontFamily: "monospace" }}
                  >
                    {credit.activeAccounts ?? "—"}
                  </Text>
                </Box>

                {/* Delinquent Accounts */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Delinquent
                  </Text>

                  <Text
                    fz={13}
                    fw={800}
                    mt={3}
                    c={
                      credit.delinquentAccounts === 0
                        ? "green.7"
                        : "slate.9"
                    }
                    style={{ fontFamily: "monospace" }}
                  >
                    {credit.delinquentAccounts ?? "—"}
                  </Text>
                </Box>

                {/* Total Outstanding */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Outstanding
                  </Text>

                  <Text
                    fz={11.5}
                    fw={800}
                    c="slate.9"
                    mt={3}
                    truncate
                    style={{ fontFamily: "monospace" }}
                  >
                    {liab.outstanding != null
                      ? zmw(liab.outstanding)
                      : "—"}
                  </Text>
                </Box>

                {/* Monthly Obligations */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Monthly obligations
                  </Text>

                  <Text
                    fz={11.5}
                    fw={800}
                    c="slate.9"
                    mt={3}
                    truncate
                    style={{ fontFamily: "monospace" }}
                  >
                    {totalObligations != null
                      ? `${zmw(totalObligations)}/mo`
                      : "—"}
                  </Text>

                  {obligationRatio != null && (
                    <Text fz={8.5} c="slate.4" mt={1}>
                      {obligationRatio}% of income
                    </Text>
                  )}
                </Box>

                {/* Recent Enquiries */}
                <Box
                  p={6}
                  bg="white"
                  style={{
                    minWidth: 0,
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Text fz={9.5} fw={600} c="slate.5">
                    Recent enquiries
                  </Text>

                  <Text
                    fz={13}
                    fw={800}
                    c="slate.9"
                    mt={3}
                    style={{ fontFamily: "monospace" }}
                  >
                    {credit.recentEnquiries ?? "—"}
                  </Text>

                  <Text fz={8.5} c="slate.4" mt={1}>
                    Past 90 days
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* ============================================================
      FOOTER
      ============================================================ */}
            <Box
              px={10}
              py={6}
              style={{
                flexShrink: 0,
                borderTop: "1px solid var(--mantine-color-slate-1)",
                background: "var(--mantine-color-slate-0)",
              }}
            >
              <Group justify="space-between" align="center" gap={8}>
                <Group gap={5} wrap="nowrap">
                  {rawCreditScore != null ? (
                    <IconCircleCheck
                      size={12}
                      color="var(--mantine-color-green-6)"
                    />
                  ) : (
                    <IconAlertCircle
                      size={12}
                      color="var(--mantine-color-orange-6)"
                    />
                  )}

                  <Text
                    fz={9.5}
                    fw={600}
                    c="slate.6"
                    truncate
                  >
                    {rawCreditScore != null
                      ? "Bureau score available for prescreening."
                      : "Credit score unavailable."}
                  </Text>
                </Group>

                <Text
                  fz={8.5}
                  fw={700}
                  c="slate.4"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {credit.manual ? "Manual" : "Bureau"}
                </Text>
              </Group>
            </Box>
          </Paper>

          {/* Existing liabilities — separate card */}
          <Paper
            withBorder
            radius="md"
            p={7}
            bg="white"
            style={{
              border: "1px solid var(--mantine-color-slate-2)",
              flexShrink: 0,
            }}
          >
            <Group justify="space-between" mb={6}>
              <Group gap={6}>
                <ThemeIcon size={18} radius="xl" variant="light" color="indigo">
                  <IconCircleDot size={10} stroke={2.5} />
                </ThemeIcon>
                <Box>
                  <Text fz={14} fw={700} c="slate.9">
                    Existing &amp; Additional Liabilities
                  </Text>

                  <Text fz={11.5} c="slate.5" mt={2}>
                    Declared and bureau-detected obligations
                  </Text>
                </Box>
              </Group>
              {/* The action buttons used to be inside CompactRow action, let's put them here */}
              {!readOnly && liab.status !== "loading" && (
                <Group gap={12} wrap="nowrap">
                  {!liab.manual && (
                    <UnstyledButton onClick={() => dispatch({ type: "fetchLiabilities" })}>
                      <Group gap={4} wrap="nowrap">
                        <IconRefresh size={11} color="var(--mantine-color-brand-6)" />
                        <Text fz={11.5} fw={600} c="brand.6">
                          Refresh
                        </Text>
                      </Group>
                    </UnstyledButton>
                  )}
                  {liab.manual && (
                    <UnstyledButton onClick={() => dispatch({ type: "manualLiabilities", on: false })}>
                      <Text fz={11.5} fw={600} c="brand.6">
                        Use source value
                      </Text>
                    </UnstyledButton>
                  )}
                  <UnstyledButton onClick={() => dispatch({ type: "openLiabilitiesModal" })}>
                    <Text fz={11.5} fw={600} c="brand.6">
                      View
                    </Text>
                  </UnstyledButton>
                  <UnstyledButton
                    onClick={() => {
                      dispatch({ type: "addAdditionalRecord" });
                      dispatch({ type: "openLiabilitiesModal" });
                    }}
                  >
                    <Text fz={11.5} fw={600} c="brand.6">
                      Additional liabilities
                    </Text>
                  </UnstyledButton>
                </Group>
              )}
            </Group>
            <Box>
              <CompactRow
                last
                label=""
                value={
                  liab.status === "loading"
                    ? "Fetching…"
                    : liab.manual && liab.obligations == null && additionalTotal === 0
                      ? (
                        <TextInput
                          radius="sm"
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
                          styles={{ input: { fontSize: 14, fontWeight: 700, height: 30 } }}
                        />
                      )
                      : totalObligations == null
                        ? "—"
                        : `${zmw(totalObligations)}/mo`
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
              {liab.status !== "loading" && ((liab.records ?? []).length > 0 || liab.additionalRecords.length > 0) && (
                <Group gap={6} mt={4}>
                  {(liab.records ?? []).length > 0 && (
                    <Badge
                      size="xs"
                      radius="xl"
                      color="orange"
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
                      color="indigo"
                      variant="light"
                      style={{ cursor: "pointer" }}
                      onClick={() => dispatch({ type: "openLiabilitiesModal" })}
                    >
                      {liab.additionalRecords.length} additional
                    </Badge>
                  )}
                </Group>
              )}
            </Box>
          </Paper>
          {rightSlot && (
            <Box
              mt={2}
              style={{
                flex: "1 1 0",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {rightSlot}
            </Box>
          )}
        </Stack>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Clickable action row (used for "How was eligibility calculated?" /
// "View calculation") — bordered, hoverable, with a trailing info icon (these
// open a modal, not an inline expansion, so a chevron would be misleading).
// ---------------------------------------------------------------------------

function ActionRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      px={12}
      py={8}
      style={{
        minHeight: 36,
        width: "100%",
        display: "flex",
        alignItems: "center",
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-md)",
        background: hover
          ? "var(--mantine-color-slate-0)"
          : "white",
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" style={{ width: "100%" }}>
        <Group gap={8} wrap="nowrap">
          <ThemeIcon radius="md" size={20} variant="light" color="brand">
            <Icon size={11} />
          </ThemeIcon>
          <Text fz={12} fw={600} c="slate.9">
            {label}
          </Text>
        </Group>
        <IconInfoCircle size={14} color="var(--mantine-color-slate-4)" />
      </Group>
    </UnstyledButton>
  );
}

const RISK_LEVELS = [
  {
    key: "low",
    label: "Low",
    color: "green",
    icon: IconCircleCheck,
    title: "Low risk",
    desc: "The customer shows a healthy credit profile with low risk of default.",
  },
  {
    key: "medium",
    label: "Medium",
    color: "orange",
    icon: IconAlertTriangle,
    title: "Medium risk",
    desc: "The customer shows an acceptable credit profile with moderate risk of default.",
  },
  {
    key: "high",
    label: "High",
    color: "red",
    icon: IconCircleX,
    title: "High risk",
    desc: "The customer shows a concerning credit profile with high risk of default.",
  },
] as const;

// function RiskMeter({
//   riskScore,
//   loading,
//   readOnly,
//   onRefresh,
// }: {
//   riskScore: RiskScoreResult | null;
//   loading?: boolean;
//   readOnly?: boolean;
//   onRefresh?: () => void;
// }) {
//   const activeIndex = riskScore
//     ? RISK_LEVELS.findIndex((l) => l.key === riskScore.band.toLowerCase())
//     : -1;
//   const active = activeIndex >= 0 ? RISK_LEVELS[activeIndex] : null;
//   const color = active?.color ?? "gray";
//   const title = loading
//     ? "Checking risk profile…"
//     : active?.title ?? "Not yet assessed";
//   const desc = loading
//     ? "Recalculating from the customer's repayment history, defaults and recent enquiries."
//     : active?.desc ?? "Refresh to calculate from the customer's repayment history, defaults and recent enquiries.";
//   const ICON_SIZE = 22;

//   return (
//     <Paper
//       withBorder
//       radius="md"
//       p={7}
//       bg="white"
//       style={{ border: "1px solid var(--mantine-color-slate-2)" }}
//     >
//       <Group justify="space-between" mb={6}>
//         <Group gap={6}>
//           <ThemeIcon size={18} radius="xl" variant="light" color="indigo">
//             <IconGauge size={10} stroke={2.5} />
//           </ThemeIcon>
//           <Text fz={13} fw={700} c="slate.9">
//             Risk Meter
//           </Text>
//         </Group>
//         {!readOnly && (
//           <UnstyledButton onClick={onRefresh} disabled={loading}>
//             <Group gap={4}>
//               <IconRefresh size={11} stroke={2.5} color="var(--mantine-color-brand-6)" />
//               <Text fz={11} fw={600} c="brand.6">
//                 Refresh
//               </Text>
//             </Group>
//           </UnstyledButton>
//         )}
//       </Group>

//       <Group justify="space-between" align="flex-end" mb={6}>
//         <Box>
//           <Group gap={4} align="flex-end">
//             <Text fz={22} fw={800} c={active ? `${color}.7` : "slate.4"} style={{ lineHeight: 1 }}>
//               {riskScore ? riskScore.score : "—"}
//             </Text>
//             <Text fz={11} fw={600} c="slate.4" mb={1}>
//               /100
//             </Text>
//           </Group>
//           <Text fz={10} c="slate.5">
//             Internal risk score
//           </Text>
//         </Box>
//         {active && (
//           <Badge color={color} variant="light" radius="sm" size="sm">
//             {title}
//           </Badge>
//         )}
//       </Group>

//       {/* Step tracker: Low → Medium → High, with the customer's band highlighted */}
//       <Group gap={0} align="flex-start" wrap="nowrap" mb={6}>
//         {RISK_LEVELS.map((level, i) => {
//           const isActive = i === activeIndex;
//           const isPast = activeIndex >= 0 && i < activeIndex;
//           const Icon = level.icon;
//           return (
//             <Box key={level.key} style={{ display: "contents" }}>
//               <Stack align="center" gap={3} style={{ flex: "0 0 auto" }}>
//                 <ThemeIcon
//                   radius="xl"
//                   size={ICON_SIZE}
//                   variant={isActive ? "filled" : "light"}
//                   color={isActive || isPast ? level.color : "slate"}
//                   style={isActive ? { boxShadow: `0 0 0 4px var(--mantine-color-${level.color}-1)` } : undefined}
//                 >
//                   <Icon size={13} />
//                 </ThemeIcon>
//                 <Text fz={10} fw={isActive ? 700 : 500} c={isActive ? `${level.color}.7` : "slate.5"}>
//                   {level.label}
//                 </Text>
//               </Stack>
//               {i < RISK_LEVELS.length - 1 && (
//                 <Box
//                   style={{
//                     flex: 1,
//                     height: 2,
//                     marginTop: ICON_SIZE / 2 - 1,
//                     background: isPast
//                       ? `var(--mantine-color-${level.color}-3)`
//                       : "var(--mantine-color-slate-2)",
//                   }}
//                 />
//               )}
//             </Box>
//           );
//         })}
//       </Group>

//       <Box
//         p={6}
//         bg={`${color}.0`}
//         style={{ border: `1px solid var(--mantine-color-${color}-2)`, borderRadius: "var(--mantine-radius-sm)" }}
//       >
//         <Text fz={11.5} fw={700} c={`${color}.9`} mb={1}>
//           {title}
//         </Text>
//         <Text fz={11} c="slate.6">
//           {desc}
//         </Text>
//       </Box>
//     </Paper>
//   );
// }

// ---------------------------------------------------------------------------
// Eligibility calculation section
// ---------------------------------------------------------------------------
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
    ? RISK_LEVELS.findIndex(
      (level) => level.key === riskScore.band.toLowerCase(),
    )
    : -1;

  const active =
    activeIndex >= 0 ? RISK_LEVELS[activeIndex] : null;

  const color = active?.color ?? "gray";
  const score = Math.max(
    0,
    Math.min(100, riskScore?.score ?? 0),
  );

  const title = loading
    ? "Checking risk profile…"
    : active?.title ?? "Not yet assessed";

  const desc = loading
    ? "Recalculating from the customer's repayment history, defaults and recent enquiries."
    : active?.desc ??
    "Refresh to calculate from the customer's repayment history, defaults and recent enquiries.";

  return (
    // LAYOUT: p 16 -> 12, section margins 14 -> 8
    <Paper
      withBorder
      radius="md"
      p={8}
      bg="white"
      style={{
        border: "1px solid var(--mantine-color-slate-2)",
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Group justify="space-between" align="flex-start" mb={5}>
        <Box>
          <Text fz={14} fw={700} c="slate.9">
            Overall Risk Assessment
          </Text>

          <Text fz={11.5} c="slate.5" mt={2}>
            Internal scoring model &amp; rule finding
          </Text>
        </Box>

        {!readOnly && (
          <UnstyledButton
            onClick={onRefresh}
            disabled={loading}
          >
            <Group gap={5}>
              <IconRefresh
                size={12}
                color="var(--mantine-color-brand-6)"
              />

              <Text fz={11.5} fw={600} c="brand.6">
                Refresh
              </Text>
            </Group>
          </UnstyledButton>
        )}
      </Group>

      <Group
        justify="space-between"
        align="flex-end"
        mb={6}
      >
        <Box>
          <Group gap={5} align="flex-end">
            <Text
              fz={26}
              fw={800}
              c="slate.9"
              style={{ lineHeight: 1 }}
            >
              {riskScore ? riskScore.score : "—"}
            </Text>

            <Text
              fz={12}
              fw={600}
              c="slate.4"
              mb={2}
            >
              / 100
            </Text>
          </Group>

          <Text fz={11} c="slate.5" mt={3}>
            Internal risk score (lower is safer)
          </Text>
        </Box>

        {active && (
          <Badge
            color={color}
            variant="light"
            radius="sm"
            size="sm"
          >
            {title}
          </Badge>
        )}
      </Group>

      <Box
        style={{
          position: "relative",
          height: 8,
          display: "flex",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            flex: 30,
            background: "var(--mantine-color-green-5)",
          }}
        />

        <Box
          style={{
            flex: 35,
            background: "var(--mantine-color-orange-5)",
          }}
        />

        <Box
          style={{
            flex: 35,
            background: "var(--mantine-color-red-5)",
          }}
        />

        <Box
          style={{
            position: "absolute",
            left: `${score}%`,
            top: -5,
            width: 2,
            height: 18,
            background: "var(--mantine-color-slate-9)",
            transform: "translateX(-1px)",
          }}
        />
      </Box>

      <Group justify="space-between" mt={5} mb={6}>
        <Text fz={10.5} fw={600} c="green.7">
          Low (0 – 30)
        </Text>

        <Text fz={10.5} c="slate.4">
          Medium (31 – 65)
        </Text>

        <Text fz={10.5} c="slate.4">
          High (66 – 100)
        </Text>
      </Group>

      <Box
        p={7}
        bg={`${color}.0`}
        style={{
          border: `1px solid var(--mantine-color-${color}-2)`,
          borderRadius: "var(--mantine-radius-md)",
        }}
      >
        <Group gap={8} align="flex-start">
          <Box
            style={{
              width: 8,
              height: 8,
              marginTop: 4,
              borderRadius: "50%",
              background: `var(--mantine-color-${color}-5)`,
              flexShrink: 0,
            }}
          />

          <Text fz={11.5} c="slate.7">
            <Text span fw={700} c="slate.9">
              Prescreening Rule Evaluation:
            </Text>{" "}
            {active
              ? `${active.title} assessment`
              : title}
          </Text>
        </Group>

        <Text
          fz={10.5}
          c="slate.6"
          mt={4}
          lineClamp={1}
        >
          {desc}
        </Text>
      </Box>
    </Paper>
  );
}
function useEligibilityUI({
  calc,
  requested,
  tenure,
  rate,
  maxDTI,
  minCreditScore,
  productMax,
  income,
  obligations,
  creditScore,
  riskScore,
  creditLoading,
  dispatch,
  readOnly,
  rulesOpen,
  setRulesOpen,
  calcOpen,
  setCalcOpen,
  recalcFlash,
  decisionSlot,
}: {
  calc: EligibilityCalc | null;
  requested: number;
  tenure: number;
  rate: number;
  maxDTI: number;
  minCreditScore: number;
  productMax: number;
  income: number | null;
  obligations: number | null;
  creditScore: number | null;
  riskScore: RiskScoreResult | null;
  creditLoading: boolean;
  dispatch: (a: any) => void;
  readOnly?: boolean;
  rulesOpen: boolean;
  setRulesOpen: (v: boolean) => void;
  calcOpen: boolean;
  setCalcOpen: (v: boolean) => void;
  recalcFlash: boolean;
  decisionSlot?: React.ReactNode;
}) {
  if (!calc) {
    const missing: string[] = [];
    if (creditScore == null) missing.push("Credit score");
    if (obligations == null) missing.push("Liability information");
    if (income == null) missing.push("Income");
    return {
      leftNode: (
        <Box>
          <Paper
            withBorder
            radius="md"
            p="lg"
            ta="center"
            style={{ borderStyle: "dashed" }}
          >
            <IconHelp size={22} color="var(--mantine-color-slate-4)" />
            <Text fz={13.5} fw={600} c="slate.9" mt={6}>
              Prescreening incomplete
            </Text>
            <Text fz={12.5} c="slate.5" mt={4}>
              Missing: {missing.join(", ")}. Fetch or enter these above to run
              the calculation.
            </Text>
          </Paper>
        </Box>
      ),
      rightNode: null,
      decisionNode: decisionSlot ?? null,
      modals: null,
    };
  }

  const {
    eligibleAmount,
    mandatoryPassed,
    creditPassed,
    dtiPassed,
    customerDTI,
    maxAffordableMonthly,
    capacity,
    affordabilityAmount,
  } = calc;
  const isFailed = !mandatoryPassed;

  const leftNode = (
    <Stack gap={6}>
      {isFailed && (
        // <Box
        //   p={8}
        //   bg="red.0"
        //   style={{ border: "1px solid var(--mantine-color-red-2)", borderRadius: "var(--mantine-radius-md)" }}
        // >
        //   <Group gap={6} mb={5}>
        //     <ThemeIcon radius="xl" size={16} color="red" variant="filled">
        //       <IconX size={10} />
        //     </ThemeIcon>
        //     <Text fz={12} fw={700} c="red.9">
        //       Why this fails?
        //     </Text>
        //   </Group>
        //   <Stack gap={3}>
        //     <CheckLine ok={creditPassed}>
        //       Credit score {creditPassed ? "meets" : "is below"} the minimum
        //       requirement ({minCreditScore})
        //     </CheckLine>
        //     <CheckLine ok={dtiPassed}>
        //       Debt-to-income ratio {dtiPassed ? "is within" : "exceeds"} the
        //       allowed limit ({maxDTI}%)
        //     </CheckLine>
        //   </Stack>
        // </Box>
        <Box
          p={10}
          bg={calc ? (calc.dtiPassed ? "green.0" : "red.0") : "slate.0"}
          style={{
            borderRadius: "var(--mantine-radius-md)",
            border: `1px solid var(--mantine-color-${calc
              ? calc.dtiPassed
                ? "green"
                : "red"
              : "slate"
              }-2)`,
          }}
        >
          <Group justify="space-between" align="flex-start" gap={12}>
            <Box style={{ minWidth: 0 }}>
              <Group gap={6} mb={3}>
                <IconInfoCircle
                  size={13}
                  color={`var(--mantine-color-${calc
                    ? calc.dtiPassed
                      ? "green"
                      : "red"
                    : "slate"
                    }-6)`}
                />

                <Text fz={12.5} fw={700} c="slate.9">
                  Debt-to-Income Ratio (DTI)
                </Text>
              </Group>

              <Text fz={11} c="slate.6">
                Threshold maximum is {maxDTI}% for uncollateralized payroll lending
              </Text>
            </Box>

            <Group gap={8} wrap="nowrap">
              <Text fz={20} fw={800} c="slate.9">
                {calc ? `${calc.customerDTI.toFixed(0)}%` : "—"}
              </Text>

              {calc && (
                <Badge
                  size="sm"
                  radius="sm"
                  variant="light"
                  color={calc.dtiPassed ? "green" : "red"}
                >
                  {calc.dtiPassed
                    ? "Within limit"
                    : `Exceeds ${maxDTI}%`}
                </Badge>
              )}
            </Group>
          </Group>
        </Box>
      )}

      <Stack gap={5}>
        <ActionRow
          icon={IconCalculator}
          label="View calculation"
          onClick={() => setCalcOpen(true)}
        />
        <ActionRow
          icon={IconInfoCircle}
          label="How was eligibility calculated?"
          onClick={() => setRulesOpen(true)}
        />
      </Stack>
    </Stack>
  );

  const rightNode = (
    <Stack gap={10}>
      <RiskMeter
        riskScore={riskScore}
        loading={creditLoading}
        readOnly={readOnly}
        onRefresh={() => dispatch({ type: "fetchCredit" })}
      />
    </Stack>
  );

  const modals = (
    <>
      {recalcFlash && (
        <Badge
          size="xs"
          radius="xl"
          color="brand"
          variant="light"
          mb={8}
          leftSection={<IconRefresh size={11} />}
        >
          Recalculated
        </Badge>
      )}

      {isFailed && (
        <Text fz={11.5} c="slate.5" mb={4}>
          Requested loan{" "}
          <Text span fw={700} c="slate.9">
            {zmw(requested)}
          </Text>
          {" · "}Maximum eligible amount{" "}
          <Text span fw={700} c="slate.4">
            —
          </Text>
        </Text>
      )}

      <Modal
        opened={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            How eligibility was calculated
          </Text>
        }
        radius="md"
        size="lg"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Box
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Table fz={12.5}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th>Rule</Table.Th>
                <Table.Th>Requirement</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Result</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <RuleRow
                rule="Minimum credit score"
                req={`≥ ${minCreditScore}`}
                customer={String(creditScore)}
                pass={creditPassed}
              />
              <RuleRow
                rule="Maximum debt-to-income"
                req={`≤ ${maxDTI}%`}
                customer={`${customerDTI.toFixed(0)}%`}
                pass={dtiPassed}
              />
              <RuleRow
                rule="Maximum loan amount"
                req="Based on affordability"
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                pass={mandatoryPassed}
                calculated
              />
              <RuleRow
                rule="Product maximum"
                req={`≤ ${zmw(productMax)}`}
                customer={mandatoryPassed ? zmw(eligibleAmount) : "—"}
                pass={mandatoryPassed}
              />
            </Table.Tbody>
          </Table>
        </Box>
      </Modal>

      <Modal
        opened={calcOpen}
        onClose={() => setCalcOpen(false)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            Eligibility calculation
          </Text>
        }
        radius="md"
        size="md"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Box
          px="md"
          bg="slate.0"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <CalcRow label="Monthly income" value={zmw(income)} />
          <CalcRow label="Existing monthly obligations" value={zmw(obligations)} />
          <CalcRow label="Maximum allowed debt ratio" value={`${maxDTI}%`} />
          <CalcRow
            label="Maximum affordable monthly payment"
            value={zmw(maxAffordableMonthly)}
          />
          <CalcRow label="Available repayment capacity" value={zmw(capacity)} />
          <CalcRow
            label={`Maximum loan amount at ${rate}% over ${tenure} months`}
            value={zmw(affordabilityAmount)}
          />
          <CalcRow label="Product maximum" value={zmw(productMax)} />
          <CalcRow
            label="Final eligible amount"
            value={
              mandatoryPassed
                ? zmw(eligibleAmount)
                : "Not calculated — mandatory rule failed"
            }
            last
            strong
          />
        </Box>
      </Modal>
    </>
  );

  return { leftNode, rightNode, decisionNode: decisionSlot ?? null, modals };
}

function DecisionCard({
  calc,
  requested,
  onContinue,
  onUseEligible,
  onReview,
  confirm,
  readOnly,
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
      <Paper withBorder radius="md" p="md">
        <Group gap={12}>
          <IconHelp size={20} color="var(--mantine-color-slate-4)" />
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

  const { eligibleAmount, mandatoryPassed } = calc;
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isPartial = mandatoryPassed && eligibleAmount < requested;
  const isFailed = !mandatoryPassed;

  const tone = isEligible
    ? {
      accent: "green",
      icon: IconCircleCheck,
      title: "Prescreening passed",
      gradient: "linear-gradient(120deg, #ECFDF5 0%, #F0FDF4 100%)",
    }
    : isPartial
      ? {
        accent: "orange",
        icon: IconAlertTriangle,
        title: "Amount adjustment required",
        gradient: "linear-gradient(120deg, #FFF7ED 0%, #FFFBEB 100%)",
      }
      : {
        accent: "red",
        icon: IconCircleX,
        title: "Prescreening failed",
        gradient: "linear-gradient(120deg, #FEF2F2 0%, #FEF2F2 100%)",
      };
  const Icon = tone.icon;

  // Full-width decision banner
  return (
    <Paper
      radius="lg"
      style={{
        overflow: "hidden",
        border: `1px solid var(--mantine-color-${tone.accent}-2)`,
        boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
      }}
    >
      <Box style={{ height: 3, background: `var(--mantine-color-${tone.accent}-5)` }} />
      <Box p={10} style={{ background: tone.gradient }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap={16}>
          <Group gap={10} align="flex-start" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <ThemeIcon radius="xl" size={30} variant="light" color={tone.accent} style={{ flexShrink: 0 }}>
              <Icon size={16} />
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text fz={14} fw={700} c="slate.9">
                {tone.title}
              </Text>

              {isEligible && (
                <Text fz={12} c="slate.6" mt={2}>
                  The requested amount of <Text span fw={700} c="slate.9">{zmw(requested)}</Text> is within the customer's eligibility.
                </Text>
              )}

              {isPartial && (
                <>
                  <Text fz={12} c="slate.6" mt={2} mb={8}>
                    The requested amount exceeds what this customer is eligible for.
                  </Text>
                  <Group gap={18}>
                    <MiniStat label="Requested" value={zmw(requested)} />
                    <MiniStat label="Eligible" value={zmw(eligibleAmount)} accent />
                  </Group>
                </>
              )}

              {isFailed && (
                <Text fz={12} c="slate.6" mt={2}>
                  This application does not meet the mandatory credit or debt-to-income requirements.
                </Text>
              )}

              {confirm && !readOnly && (
                <Group
                  gap={10}
                  p="xs"
                  mt={12}
                  bg="white"
                  style={{
                    border: "1px solid var(--mantine-color-slate-2)",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                >
                  <Text fz={11.5} style={{ flex: 1 }}>
                    Set requested amount to {zmw(calc.eligibleAmount)}?
                  </Text>
                  <Button size="xs" color="dark" radius="sm" onClick={() => onUseEligible(true)}>
                    Confirm
                  </Button>
                  <Button size="xs" variant="default" radius="sm" onClick={() => onUseEligible(false)}>
                    Cancel
                  </Button>
                </Group>
              )}
            </Box>
          </Group>

          {!readOnly && (
            <Box style={{ flexShrink: 0 }}>
              {isEligible && (
                <Button
                  size="sm"
                  color={tone.accent}
                  radius="md"
                  onClick={onContinue}
                  rightSection={<IconArrowRight size={15} />}
                >
                  Continue to enrichment
                </Button>
              )}
              {isPartial && !confirm && (
                <Button
                  size="sm"
                  color={tone.accent}
                  radius="md"
                  onClick={() => onReview("useEligible")}
                >
                  Use eligible amount
                </Button>
              )}
              {isFailed && (
                <Button
                  size="sm"
                  variant="white"
                  color={tone.accent}
                  radius="md"
                  onClick={() => onReview("review")}
                  style={{ border: `1px solid var(--mantine-color-${tone.accent}-3)` }}
                >
                  Review overrides
                </Button>
              )}
            </Box>
          )}
        </Group>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Reducer for prescreening inputs
// ---------------------------------------------------------------------------

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

function StageNavigation({
  section,
  setSection,
}: {
  section: Section;
  setSection: (section: Section) => void;
}) {
  const stages = [
    {
      label: "Loan application",
      section: "application" as Section,
      done: true,
    },
    {
      label: "Prescreening",
      section: "prescreening" as Section,
      active: true,
    },
    {
      label: "Underwriting & Risk",
    },
    {
      label: "Offer",
    },
  ];

  return (
    // LAYOUT: py 10 -> 7
    <Box
      px={{ base: 16, md: 20 }}
      py={7}
      bg="white"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-2)",
        flexShrink: 0,
      }}
    >
      <Group
        justify="space-between"
        align="center"
        gap={16}
        wrap="nowrap"
      >
        <Text
          fz={10.5}
          fw={700}
          c="slate.5"
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          Stage 2 OF 5
        </Text>

        <Group
          gap={6}
          wrap="nowrap"
          style={{
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {stages.map((stage, index) => {
            const isActive = stage.section === section;
            const clickable = Boolean(stage.section);

            return (
              <Group key={stage.label} gap={6} wrap="nowrap">
                {index > 0 && (
                  <Text fz={12} c="slate.3">
                    ›
                  </Text>
                )}

                {clickable ? (
                  <UnstyledButton
                    onClick={() => setSection(stage.section!)}
                  >
                    <Box
                      px={10}
                      py={5}
                      style={{
                        borderRadius: 7,
                        border: `1px solid ${isActive
                          ? "var(--mantine-color-brand-6)"
                          : "var(--mantine-color-indigo-2)"
                          }`,
                        background: isActive
                          ? "var(--mantine-color-brand-6)"
                          : "var(--mantine-color-indigo-0)",
                      }}
                    >
                      <Text
                        fz={11.5}
                        fw={isActive ? 700 : 600}
                        c={isActive ? "white" : "brand.7"}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {stage.done && !isActive ? "✓ " : ""}
                        {index + 1}. {stage.label}
                      </Text>
                    </Box>
                  </UnstyledButton>
                ) : (
                  <Text
                    fz={11.5}
                    fw={500}
                    c="slate.4"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {index + 1}. {stage.label}
                  </Text>
                )}
              </Group>
            );
          })}
        </Group>
      </Group>
    </Box>
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
  const [rulesOpen, setRulesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [continued, setContinued] = useState(false);
  const [liabOpen, setLiabOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

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
      <Box py={70} px={30} ta="center">
        <ThemeIcon radius="xl" size={44} color="green" variant="light" mx="auto" mb={10}>
          <IconCircleCheck size={26} />
        </ThemeIcon>
        <Text fz="md" fw={700} c="slate.9">
          Moving to Stage 3 — Enrichment
        </Text>
        <Text fz={12.5} c="slate.5" mt={6}>
          Requested amount confirmed at {zmw(requested)}.
        </Text>
      </Box>
    );
  }

  const { leftNode, rightNode, decisionNode, modals } = useEligibilityUI({
    calc,
    requested,
    tenure,
    rate,
    maxDTI: policy.maxDTI,
    minCreditScore: policy.minCreditScore,
    productMax: policy.productMax,
    income: totalIncome,
    obligations: totalObligations,
    creditScore: state.credit.value,
    riskScore,
    creditLoading: state.credit.status === "loading",
    dispatch,
    readOnly,
    rulesOpen,
    setRulesOpen,
    calcOpen,
    setCalcOpen,
    recalcFlash: flash,
    decisionSlot: (
      <DecisionCard
        calc={calc}
        requested={requested}
        onContinue={() => setContinued(true)}
        onUseEligible={handleUseEligible}
        onReview={(a) => a === "useEligible" && setConfirm(true)}
        confirm={confirm}
        readOnly={readOnly}
      />
    ),
  });

  return (
    // LAYOUT: this is the link that used to be missing — the workspace now
    // fills the height it is given and passes it down as a flex column.
    <Box
      px={20}
      pt={6}
      pb={8}
      style={{
        flex: "1 1 0",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
      }}
    >
      <PrescreeningOverview
        state={state}
        dispatch={dispatch}
        readOnly={readOnly}
        calc={calc}
        requested={requested}
        maxDTI={policy.maxDTI}
        productMax={policy.productMax}
        leftSlot={leftNode}
        rightSlot={rightNode}
      />

      {modals}

      {/* Decision — full width so it never gets cramped or cut off, and
          balances the two columns above it */}
      {/* {decisionNode && <Box mt={6}>{decisionNode}</Box>} */}
      {decisionNode && !isEligible && (
        <Box style={{ flexShrink: 0 }}>
          {decisionNode}
        </Box>
      )}

      <Modal
        opened={liabOpen}
        onClose={() => setLiabOpen(false)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            Existing Liabilities
          </Text>
        }
        radius="md"
        size="lg"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Group gap={6} mb={6}>
          <Text fz={12.5} fw={700} c="slate.9">
            From credit bureau
          </Text>
          <Badge size="xs" radius="sm" color="slate" variant="light">
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
              borderRadius: "var(--mantine-radius-md)",
              overflow: "auto",
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

        <Group justify="space-between" align="center" mt="lg" mb={6}>
          <Box>
            <Text fz={12.5} fw={700} c="slate.9">
              Additional liabilities
            </Text>
            <Text fz={11} c="slate.5">
              Facilities with other lenders that the bureau can't see — added on top of the bureau figures above.
            </Text>
          </Box>
          {!readOnly && (
            <Button size="xs" variant="light" color="indigo" onClick={() => dispatch({ type: "addAdditionalRecord" })}>
              Add liability
            </Button>
          )}
        </Group>

        <Box
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "auto",
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
          <Text fz={14.5} fw={700} c="slate.9">
            Additional Income
          </Text>
        }
        radius="md"
        size="lg"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Text fz={11.5} c="slate.5" mb={10}>
          Other income the customer receives — rental, pension, business, etc. — on top of the primary {zmw(state.income.value)} above.
        </Text>

        <Group justify="space-between" align="center" mb={6}>
          <Text fz={12.5} fw={700} c="slate.9">
            Income sources
          </Text>
          {!readOnly && (
            <Button size="xs" variant="light" color="indigo" onClick={() => dispatch({ type: "addIncomeRecord" })}>
              Add income source
            </Button>
          )}
        </Group>

        <Box
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "auto",
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
  const submitRef = useRef<() => void>(() => { });

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
          py={6}
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap={6}>
            <ThemeIcon radius="sm" size={18} variant="light" color="brand">
              <IconGauge size={10} />
            </ThemeIcon>
            <Box>
              <Text fz={14} fw={700} c="white">Loan Application </Text>
              <Text fz={11.5} c="slate.1" mt={2}>Credit reporting &amp; score summary</Text>
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

      {/* <Box
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
                  onClose={() => { }}
                  onMinimize={() => { }}
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
      </Box> */}
      <StageNavigation
        section={section}
        setSection={setSection}
      />

      {/* LAYOUT: was overflowY "auto" — this was the scrollbar you saw. It is
          now a fill-height flex parent, so its child sizes to the space left
          over instead of growing past it. The "application" branch keeps its
          own scroll, since that form genuinely is taller than the viewport. */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: section === "application" ? "auto" : "hidden",
        }}
      >
        {section === "application" ? (
          <Box style={{ height: "100%" }}>
            <Box style={{ height: "calc(100% - 70px)" }}>
              <LoanApplicationModal
                embedded
                readOnly
                initialValues={applicationValues}
                opened={false}
                onClose={() => { }}
                onMinimize={() => { }}
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
      {!embedded && !readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={8}
          bg="white"
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            flexShrink: 0,
          }}
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