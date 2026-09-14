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
  Grid,
} from "@mantine/core";
import {
  IconFileText,
  IconGauge,
  IconCheck,
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
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
} from "./Dummyloanapplicationdata";

import type {
  PreScreeningModalProps,
  SourceKind,
  LiabilityRecord,
  ScenarioDef,
  EligibilityCalc,
  Section,
  FieldState,
  CreditState,
  LiabilitiesState,
  IncomeState,
  PrescreeningState
} from './PreScreeningShared';
import {
  POLICY,
  SCENARIOS,
  DEFAULT_SCENARIO,
  zmw,
  fmtDate,
  calcEligibility,
  SOURCE_MAP,
  SourceBadge,
  MiniStat,
  CalcRow,
  CheckLine,
  RuleRow,
  ContextHeader,
  LeftNav,
  buildInitialState,
  ComparisonBar,
  creditScoreBand,
  CreditGaugeVisual,
  CompactRow,
  StatMini
} from './PreScreeningShared';
function PrescreeningOverview({
  state,
  dispatch,
  readOnly,
  calc,
  requested,
  maxDTI,
  productMax,
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

  return (
    <Box mb={6}>
      {/* Left: Monthly Income + DTI | Right: Credit Score + Liabilities in ONE card */}
      <SimpleGrid
        cols={{ base: 1, sm: 2 }}
        spacing={24}
        style={{
          alignItems: "start",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        }}
      >
        <Stack gap={6} w="100%" style={{ minWidth: 0 }}>
          <Paper withBorder radius="md" p={8}>
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
                    : income.source === "none"
                      ? "—"
                      : zmw(income.value)
              }
              subtext={
                income.manual
                  ? undefined
                  : income.source === "hrms"
                    ? "Confirmed via HRMS payroll"
                    : income.source === "application"
                      ? "Reused from the loan application"
                      : income.source === "none"
                        ? "Not available"
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
                    {!income.manual && (
                      <UnstyledButton onClick={() => dispatch({ type: "fetchIncome" })}>
                        <Group gap={4} wrap="nowrap">
                          <IconRefresh size={11} color="var(--mantine-color-brand-6)" />
                          <Text fz={11.5} fw={600} c="brand.6">
                            Refresh
                          </Text>
                        </Group>
                      </UnstyledButton>
                    )}
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
          </Paper>

          <Paper withBorder radius="md" px={8} py={5}>
            <Group justify="space-between">
              <Text fz={12.5} fw={600} c="slate.9">
                Debt-to-Income Ratio
              </Text>
              <Group gap={6}>
                <Text fz={14} fw={500} c="slate.7">
                  {calc ? `${calc.customerDTI.toFixed(0)}%` : "—"}
                </Text>
                {calc && (
                  <Group gap={3}>
                    {calc.dtiPassed ? (
                      <IconCheck size={12} color="var(--mantine-color-green-6)" />
                    ) : (
                      <IconX size={12} color="var(--mantine-color-red-6)" />
                    )}
                    <Text fz={11.5} fw={600} c={calc.dtiPassed ? "green.7" : "red.6"}>
                      {calc.dtiPassed ? "Within limit" : `Exceeds ${maxDTI}% limit`}
                    </Text>
                  </Group>
                )}
              </Group>
            </Group>
          </Paper>

          {calc && calc.mandatoryPassed && (
            <Paper withBorder radius="md" p={8}>
              <Group justify="space-between" mb={3}>
                <Box>
                  <Text fz={12.5} fw={600} c="slate.9">
                    Requested loan
                  </Text>
                  <Text fz={14} fw={500} c="slate.7">
                    {zmw(requested)}
                  </Text>
                </Box>
                <Box ta="right">
                  <Text fz={12.5} fw={600} c="slate.9">
                    Maximum eligible amount
                  </Text>
                  <Text fz={14} fw={500} c="slate.7">
                    {zmw(calc.eligibleAmount)}
                  </Text>
                </Box>
              </Group>
              <ComparisonBar
                requested={requested}
                eligible={calc.eligibleAmount}
                productMax={productMax}
              />
            </Paper>
          )}

          {leftSlot && <Box mt={6}>{leftSlot}</Box>}
        </Stack>

        <Stack gap={10} w="100%" style={{ minWidth: 0 }}>
          <Paper
            withBorder
            radius="md"
            p={8}
            w="100%"
            style={{ minWidth: 0, overflow: "visible" }}
          >
          <Group justify="space-between" align="center" mb={0}>
            <Group gap={6}>
              <ThemeIcon radius="sm" size={20} variant="light" color="brand">
                <IconGauge size={11} />
              </ThemeIcon>
              <Text fz={12} fw={700} c="slate.9">
                Credit bureau summary
              </Text>
            </Group>
            {!readOnly && credit.status !== "loading" && (
              <UnstyledButton onClick={() => dispatch({ type: "fetchCredit" })}>
                <Group gap={3} wrap="nowrap">
                  <IconRefresh size={10} color="var(--mantine-color-brand-6)" />
                  <Text fz={11} fw={600} c="brand.6">
                    Refresh
                  </Text>
                </Group>
              </UnstyledButton>
            )}
          </Group>

          <CreditGaugeVisual
            score={credit.status === "loading" ? null : credit.value}
            unavailable={credit.source === "unavailable" && !credit.manual}
            loading={credit.status === "loading"}
          />

          {credit.status !== "loading" && credit.riskBand != null && (
            <SimpleGrid cols={3} spacing={10} mt={6}>
              <StatMini
                icon={IconAlertCircle}
                label="Risk Band"
                sublabel="BUREAU"
                value={credit.riskBand ?? "—"}
              />
              <StatMini
                icon={IconFileText}
                label="Active Accounts"
                sublabel="BUREAU"
                value={credit.activeAccounts ?? "—"}
              />
              <StatMini
                icon={IconAlertTriangle}
                label="Delinquent Accounts"
                sublabel="BUREAU"
                value={credit.delinquentAccounts ?? "—"}
              />
              <StatMini
                icon={IconGauge}
                label="Total Outstanding"
                sublabel="BUREAU"
                value={zmw(liab.outstanding)}
              />
              <StatMini
                icon={IconRefresh}
                label="Monthly Obligations"
                sublabel="BUREAU"
                value={zmw(liab.obligations)}
              />
              <StatMini
                icon={IconHelp}
                label="Recent Enquiries"
                sublabel="BUREAU"
                value={credit.recentEnquiries ?? "—"}
              />
            </SimpleGrid>
          )}

        </Paper>

        {/* Existing liabilities — separate card */}
        <Paper
          withBorder
          radius="md"
          p={10}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group justify="space-between" mb={8}>
            <Group gap={6}>
              <ThemeIcon size={20} radius="xl" variant="light" color="indigo">
                <IconCircleDot size={12} stroke={2.5} />
              </ThemeIcon>
              <Text fz={13.5} fw={700} c="slate.9">
                Existing liabilities
              </Text>
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
                {liab.manual ? (
                  <UnstyledButton onClick={() => dispatch({ type: "manualLiabilities", on: false })}>
                    <Text fz={11.5} fw={600} c="brand.6">
                      Use source value
                    </Text>
                  </UnstyledButton>
                ) : (
                  <UnstyledButton onClick={() => dispatch({ type: "openLiabilitiesModal" })}>
                    <Text fz={11.5} fw={600} c="brand.6">
                      Additional liabilities
                    </Text>
                  </UnstyledButton>
                )}
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
                  : liab.manual
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
                    : liab.source === "unavailable"
                      ? "—"
                      : `${zmw(liab.obligations)}/mo`
              }
              subtext={
                liab.manual
                  ? undefined
                  : liab.source === "unavailable"
                    ? "Bureau unavailable"
                    : liab.status !== "loading"
                      ? `${liab.activeLoans ?? "—"} active loans · ${zmw(liab.outstanding)} outstanding`
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
            {(liab.records ?? []).length > 0 && !liab.manual && liab.status !== "loading" && (
              <Box mt={4}>
                <Badge
                  size="xs"
                  radius="xl"
                  color="orange"
                  variant="light"
                  style={{ cursor: "pointer" }}
                  onClick={() => dispatch({ type: "openLiabilitiesModal" })}
                >
                  {(liab.records ?? []).length} liabilities found
                </Badge>
              </Box>
            )}
          </Box>
        </Paper>
        {rightSlot && <Box mt={4}>{rightSlot}</Box>}
        </Stack>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Clickable action row (used for "How was eligibility calculated?" /
// "View calculation") — bordered, hoverable, with a trailing chevron so it
// visually reads as clickable.
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
      px={14}
      py={10}
      style={{
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-md)",
        background: hover ? "var(--mantine-color-slate-0)" : "white",
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={8} wrap="nowrap">
          <Icon size={15} color="var(--mantine-color-brand-6)" />
          <Text fz={12.5} fw={600} c="slate.9">
            {label}
          </Text>
        </Group>
        <IconArrowRight size={14} color="var(--mantine-color-slate-4)" />
      </Group>
    </UnstyledButton>
  );
}

function RiskMeter({ riskBand }: { riskBand: string | null }) {
  if (!riskBand) return null;
  const isLow = riskBand.toLowerCase() === "low";
  const isMedium = riskBand.toLowerCase() === "medium";
  const isHigh = riskBand.toLowerCase() === "high";

  let color = "gray";
  let title = "Unknown risk";
  let desc = "Risk profile could not be determined.";
  let markerLeft = "0%";
  let badgeColor = "gray";
  
  if (isLow) {
    color = "green";
    badgeColor = "green";
    title = "Low risk";
    desc = "The customer shows a healthy credit profile with low risk of default.";
    markerLeft = "16%"; // center of first third
  } else if (isMedium) {
    color = "orange";
    badgeColor = "orange";
    title = "Medium risk";
    desc = "The customer shows an acceptable credit profile with moderate risk of default.";
    markerLeft = "50%"; // center of middle third
  } else if (isHigh) {
    color = "red";
    badgeColor = "red";
    title = "High risk";
    desc = "The customer shows a concerning credit profile with high risk of default.";
    markerLeft = "83.3%"; // center of last third
  }

  return (
    <Paper
          withBorder
          radius="md"
          p={10}
      bg="white"
      style={{ border: "1px solid var(--mantine-color-slate-2)" }}
    >
      <Group justify="space-between" mb={6}>
        <Group gap={8}>
          <ThemeIcon size={20} radius="xl" variant="light" color="indigo">
            <IconGauge size={12} stroke={2.5} />
          </ThemeIcon>
          <Text fz={13.5} fw={700} c="slate.9">
            Risk Meter
          </Text>
          <Badge color={badgeColor} variant="light" radius="sm" size="sm">
            {title}
          </Badge>
        </Group>
        <UnstyledButton>
          <Group gap={4}>
            <IconRefresh size={12} stroke={2.5} color="var(--mantine-color-brand-6)" />
            <Text fz={11.5} fw={600} c="brand.6">
              Refresh
            </Text>
          </Group>
        </UnstyledButton>
      </Group>

      {/* Marker Triangle */}
      <Box style={{ position: "relative", height: 5, width: "100%", marginBottom: 2 }}>
        <Box
          style={{
            position: "absolute",
            left: markerLeft,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `5px solid var(--mantine-color-${color}-6)`,
          }}
        />
      </Box>

      {/* Segmented Bar */}
      <Box style={{ display: "flex", gap: 3, height: 5, width: "100%", marginBottom: 12 }}>
        <Box style={{ flex: 1, backgroundColor: "var(--mantine-color-green-5)", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
        <Box style={{ flex: 1, backgroundColor: "var(--mantine-color-yellow-4)" }} />
        <Box style={{ flex: 1, backgroundColor: "var(--mantine-color-red-4)", borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
      </Box>

      <Box>
        <Text fz={12.5} fw={700} c="slate.9" mb={0}>
          {title}
        </Text>
        <Text fz={11.5} c="slate.5">
          {desc}
        </Text>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Eligibility calculation section
// ---------------------------------------------------------------------------

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
  riskBand,
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
  riskBand: string | null;
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
            p="xl"
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
      rightNode: decisionSlot ? <Box>{decisionSlot}</Box> : null,
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
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isFailed = !mandatoryPassed;

  const leftNode = (
    <Box>
      {isEligible && (
        <Box mb={10}>
          <Text fz={12.5} fw={600} c="slate.9" mb={6}>
            Why this passes
          </Text>
          <Stack gap={4}>
            <CheckLine ok>Credit score meets minimum requirement</CheckLine>
            <CheckLine ok>Debt-to-income ratio is within the allowed limit</CheckLine>
            <CheckLine ok>Monthly repayment is within the affordability limit</CheckLine>
            <CheckLine ok>Requested amount is within the product and customer limit</CheckLine>
          </Stack>
        </Box>
      )}

      {isFailed && (
        <Box mb={10}>
          <Text fz={12.5} fw={600} c="slate.9" mb={6}>
            Why this fails
          </Text>
          <Stack gap={4}>
            <CheckLine ok={creditPassed}>
              Credit score {creditPassed ? "meets" : "is below"} the minimum
              requirement ({minCreditScore})
            </CheckLine>
            <CheckLine ok={dtiPassed}>
              Debt-to-income ratio {dtiPassed ? "is within" : "exceeds"} the
              allowed limit ({maxDTI}%)
            </CheckLine>
          </Stack>
        </Box>
      )}

      <Stack gap={4}>
        <ActionRow
          icon={IconPercentage}
          label="View calculation"
          onClick={() => setCalcOpen(true)}
        />
        <ActionRow
          icon={IconInfoCircle}
          label="How was eligibility calculated?"
          onClick={() => setRulesOpen(true)}
        />
      </Stack>
    </Box>
  );

  const rightNode = (
    <Stack gap={4}>
      <RiskMeter riskBand={riskBand} />
      {decisionSlot}
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
        <SimpleGrid cols={2} spacing={18} mb={16}>
          <Box>
            <Text fz={11.5} c="slate.5">
              Requested loan
            </Text>
            <Text fz={16} fw={700} c="slate.9">
              {zmw(requested)}
            </Text>
          </Box>
          <Box>
            <Text fz={11.5} c="slate.5">
              Maximum eligible amount
            </Text>
            <Text fz={16} fw={700} c="slate.4">
              —
            </Text>
          </Box>
        </SimpleGrid>
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

  return { leftNode, rightNode, modals };
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
    ? { bg: "green.0", border: "green.2", icon: IconCircleCheck, color: "green.7" }
    : isPartial
      ? { bg: "orange.0", border: "orange.2", icon: IconAlertTriangle, color: "orange.7" }
      : { bg: "red.0", border: "red.2", icon: IconCircleX, color: "red.6" };
  const Icon = tone.icon;

  // Full-width card status
  return (
    <Box
      p={10}
      bg={tone.bg}
      style={{
        border: `1px solid var(--mantine-color-${tone.border.replace(".", "-")})`,
        borderRadius: "var(--mantine-radius-md)",
      }}
    >
      {isEligible ? (
        <Group justify="space-between" align="center" wrap="nowrap" gap={16}>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} wrap="nowrap">
              <Icon size={18} color={`var(--mantine-color-${tone.color.replace(".", "-")})`} />
              <Text fz={14.5} fw={700} c="slate.9">
                Prescreening passed
              </Text>
            </Group>
            <Text fz={12.5} fw={500} c="green.8" mt={4}>
              The requested amount of {zmw(requested)} is within the customer's eligibility.
            </Text>
          </Box>
          {!readOnly && (
            <Button
              size="xs"
              color="green.6"
              radius="md"
              onClick={onContinue}
              rightSection={<IconArrowRight size={14} />}
              style={{ flexShrink: 0 }}
            >
              Continue to enrichment
            </Button>
          )}
        </Group>
      ) : (
        <Stack gap={4}>
          <Group gap={8} wrap="nowrap">
            <Icon size={18} color={`var(--mantine-color-${tone.color.replace(".", "-")})`} />
            {isPartial && (
              <Text fz={14.5} fw={700} c="orange.8">
                Amount adjustment required
              </Text>
            )}
            {isFailed && (
              <Text fz={14.5} fw={700} c="red.7">
                Prescreening failed
              </Text>
            )}
          </Group>

          {isPartial && (
            <Group gap={16}>
              <MiniStat label="Requested" value={zmw(requested)} />
              <MiniStat label="Eligible" value={zmw(eligibleAmount)} accent />
            </Group>
          )}

          {confirm && !readOnly && (
            <Group
              gap={10}
              p="xs"
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

          {!readOnly && (
            <Box mt={2}>
              {isPartial && !confirm && (
                <Button
                  size="sm"
                  variant="light"
                  color="orange"
                  radius="md"
                  onClick={() => onReview("useEligible")}
                >
                  Use eligible amount
                </Button>
              )}
              {isFailed && (
                <Button
                  size="sm"
                  variant="default"
                  radius="md"
                  onClick={() => onReview("review")}
                >
                  Review overrides
                </Button>
              )}
            </Box>
          )}
        </Stack>
      )}
    </Box>
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
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          manual: action.on,
          source: action.on ? "manual" : (state.liabilities.records.length > 0 ? "bureau" : "unavailable"),
          manualRecords: state.liabilities.manualRecords.length > 0
            ? state.liabilities.manualRecords
            : (state.liabilities.records || []).map(r => ({ ...r, source: "manual" as SourceKind })),
        },
      };
    case "addManualRecord":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          manualRecords: [
            ...state.liabilities.manualRecords,
            { institution: "", facilityType: "Personal Loan", outstanding: 0, monthlyPayment: 0, status: "Active", source: "manual" }
          ]
        }
      };
    case "updateManualRecord":
      const updated = [...state.liabilities.manualRecords];
      updated[action.index] = { ...updated[action.index], ...action.changes };
      return {
        ...state,
        liabilities: { ...state.liabilities, manualRecords: updated }
      };
    case "removeManualRecord":
      return {
        ...state,
        liabilities: {
          ...state.liabilities,
          manualRecords: state.liabilities.manualRecords.filter((_, i) => i !== action.index)
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

    default:
      return state;
  }
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

  function dispatch(action: any) {
    if (action.type === "openLiabilitiesModal") {
      setLiabOpen(true);
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

  const calc = useMemo(() => {
    return calcEligibility({
      income: state.income.value,
      obligations: state.liabilities.obligations,
      maxDTI: policy.maxDTI,
      annualRate: rate,
      tenureMonths: tenure,
      productMax: policy.productMax,
      creditScore: state.credit.value,
      minCreditScore: policy.minCreditScore,
    });
  }, [
    state.credit.value,
    state.liabilities.obligations,
    state.income.value,
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

  const { leftNode, rightNode, modals } = useEligibilityUI({
    calc,
    requested,
    tenure,
    rate,
    maxDTI: policy.maxDTI,
    minCreditScore: policy.minCreditScore,
    productMax: policy.productMax,
    income: state.income.value,
    obligations: state.liabilities.obligations,
    creditScore: state.credit.value,
    riskBand: state.credit.riskBand,
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
    <Box px={30} pt={12} pb={16}>
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
                <Table.Th>Source</Table.Th>
                <Table.Th>Institution</Table.Th>
                <Table.Th>liabilities  Type</Table.Th>
                <Table.Th>Outstanding</Table.Th>
                <Table.Th>Monthly Payment</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {state.liabilities.manual ? (
                state.liabilities.manualRecords.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Badge size="xs" radius="sm" color="orange" variant="light">
                        Manual
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={r.institution}
                        onChange={(e) => dispatch({ type: "updateManualRecord", index: i, changes: { institution: e.currentTarget.value } })}
                        placeholder="Institution"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={r.facilityType}
                        onChange={(e) => dispatch({ type: "updateManualRecord", index: i, changes: { facilityType: e.currentTarget.value } })}
                        placeholder="Type"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="number"
                        value={r.outstanding || ""}
                        onChange={(e) => dispatch({ type: "updateManualRecord", index: i, changes: { outstanding: Number(e.currentTarget.value) } })}
                        placeholder="0"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="number"
                        value={r.monthlyPayment || ""}
                        onChange={(e) => dispatch({ type: "updateManualRecord", index: i, changes: { monthlyPayment: Number(e.currentTarget.value) } })}
                        placeholder="0"
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon size="sm" color="red" variant="subtle" onClick={() => dispatch({ type: "removeManualRecord", index: i })}>
                        <IconX size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                state.liabilities.records && state.liabilities.records.length > 0 ? (
                  state.liabilities.records.map((r, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Badge size="xs" radius="sm" color="orange" variant="light">
                          Bureau
                        </Badge>
                      </Table.Td>
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
                    <Table.Td colSpan={6}>
                      <Text fz={12.5} c="slate.5" ta="center" py="md">
                        No liabilities found.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )
              )}
            </Table.Tbody>
          </Table>
        </Box>
        {!readOnly && (
          <Box mt="md" p={10} bg="slate.0" style={{ borderRadius: "var(--mantine-radius-md)" }}>
            <Group justify="space-between" align="center">
              <Box>
                <Text fz={12.5} fw={600} c="slate.9">Manual Entry Mode</Text>
                <Text fz={11.5} c="slate.5">
                  {state.liabilities.manual 
                    ? "Add or edit multiple liabilities manually." 
                    : "If bureau data is incorrect, you can manually enter multiple liabilities."}
                </Text>
              </Box>
              {state.liabilities.manual ? (
                <Group gap={8}>
                  <Button size="xs" variant="default" onClick={() => dispatch({ type: "addManualRecord" })}>
                    Add liability
                  </Button>
                  <Button size="xs" variant="light" color="red" onClick={() => dispatch({ type: "manualLiabilities", on: false })}>
                    Cancel manual entry
                  </Button>
                </Group>
              ) : (
                <Button size="xs" variant="light" color="brand" onClick={() => dispatch({ type: "manualLiabilities", on: true })}>
                  Enter manually
                </Button>
              )}
            </Group>
          </Box>
        )}
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
          py="sm"
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap={10}>
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconGauge size={16} />
            </ThemeIcon>
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
          py="md"
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
      lockScroll
      styles={{
        content: {
          height: "92vh",
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