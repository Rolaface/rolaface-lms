import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  Group,
  Text,
  Checkbox,
  Badge,
  Tabs,
} from "@mantine/core";
import { IconCheck, IconAlertTriangle, IconCircleX } from "@tabler/icons-react";
import { riskTier } from "../shared";
import {
  SectionHead,
  ReviewRow,
  TIERS,
  creditBandFor,
  type IncomeSourceTuple,
  type ObligationDef,
  type CreditBand,
  type CollateralItem,
  type FormulaParams,
  type HardStop,
  type computeFormulaPreview,
} from "./Ruleshared";

interface ReviewPublishProps {
  readyToPublish: boolean;
  reviewIssues: { label: string; ok: boolean }[];
  ruleName: string;
  loanProduct: string | null;
  ruleStatus: string | null;
  incomeSources: IncomeSourceTuple[];
  obligationSources: ObligationDef[];
  formulaParams: FormulaParams;
  creditBands: CreditBand[];
  collateralItems: CollateralItem[];
  totalCollateralLimit: number;
  hardStops: HardStop[];
  formulaPreview: ReturnType<typeof computeFormulaPreview>;
  preApprovedPreview: number;
}

export function ReviewPublish({
  readyToPublish,
  reviewIssues,
  ruleName,
  loanProduct,
  ruleStatus,
  incomeSources,
  obligationSources,
  formulaParams,
  creditBands,
  collateralItems,
  totalCollateralLimit,
  hardStops,
  formulaPreview,
  preApprovedPreview,
}: ReviewPublishProps) {
  return (
    <Box>
      <SectionHead
        title="Review & Publish"
        description="Confirm the configuration below. You can simulate the rule with dynamic inputs before saving."
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
                <IconCheck size={13} color="var(--mantine-color-green-7)" />
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
                    `${obligationSources.filter((s) => s.inc).length} configured`,
                  ],
                  ["Max EMI-to-Income Ratio", `${formulaParams.maxEmiRatio}%`],
                ] as [string, ReactNode][],
              },
              {
                title: "Credit & Risk Scoring",
                rows: [
                  ["Credit Bands", `${creditBands.length} configured`],
                  ["Income Multiple", `${formulaParams.salaryMultiple}x`],
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
                  ["Pre-Approval Tiers", `${TIERS.length} configured`],
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
                  <ReviewRow key={k as string} label={k as string} value={val} />
                ))}
              </Paper>
            ))}
          </SimpleGrid>
          {!readyToPublish && (
            <Text fz={11} c="orange.7" mt={6}>
              Resolve the items above before activating this rule.
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
        <Text fz={11} fw={500} c="slate.7">
          {label}
        </Text>
        {hint && (
          <Text fz={10} c="slate.4">
            {hint}
          </Text>
        )}
      </Group>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
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
  incomeSources: IncomeSourceTuple[];
  obligationSources: ObligationDef[];
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
    "Rental Obligation": 0,
    "Other Monthly Debt": 500,
  });
  const [collaterals, setCollaterals] = useState<Record<string, number>>({});
  const [creditScore, setCreditScore] = useState(735);
  const [tenure, setTenure] = useState(24);
  const [onTime, setOnTime] = useState(94);
  const [maxDPD, setMaxDPD] = useState(12);
  const [npa, setNpa] = useState(false);

  const activeIncomes = incomeSources.filter((s) => s[3]);
  const activeObligations = obligationSources.filter((s) => s.inc);

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
      sum + (s.inc ? Number(obligations[s.name] || 0) * (s.pct / 100) : 0),
    0,
  );
  const existingDSR = activeObligations.reduce(
    (sum, s) =>
      sum + (s.inc ? Number(obligations[s.name] || 0) * (s.pct / 100) : 0),
    0,
  );

  const incomeLimit = eligibleIncome * formulaParams.salaryMultiple;

  let maxEMI = eligibleIncome * (formulaParams.maxEmiRatio / 100) - existingEMI;
  if (maxEMI < 0) maxEMI = 0;
  const affordabilityLimit =
    maxEMI * tenure * (formulaParams.affordabilityBuffer / 100);

  const matchedBand = creditBandFor(creditScore, creditBands);
  const creditMultiple = matchedBand ? Number(matchedBand.multiple) : 0;
  const netSalaryValue = Number(incomes["Net Salary"] || 0);
  const creditLimit = netSalaryValue * creditMultiple;

  const collateralLimit = collateralItems.reduce((sum, item) => {
    return (
      sum +
      (collaterals[item.id] || 0) *
        (1 - item.haircutPct / 100) *
        (item.maxLtvPct / 100)
    );
  }, 0);

  const limits = [
    { name: "Income limit", value: incomeLimit },
    { name: "Affordability limit", value: affordabilityLimit },
    { name: "Credit limit", value: creditLimit },
    ...(collateralItems.length > 0
      ? [{ name: "Collateral limit", value: collateralLimit }]
      : []),
    { name: "Product limit", value: formulaParams.productMax },
  ];

  let final = Math.min(...limits.map((l) => l.value));
  let limitingFactor = limits.find((l) => l.value === final)?.name || "";
  let decision = "Eligible";

  const risk = riskTier(creditScore, onTime, maxDPD, npa);
  const existingDti = existingDSR / (eligibleIncome || 1);

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
  } else if (existingDti > formulaParams.maxDtiRatio / 100) {
    final = 0;
    decision = "Decline";
    limitingFactor = "DSR Limit";
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
          <Paper
            radius="sm"
            p="md"
            style={{ border: "1px solid var(--mantine-color-slate-2)" }}
          >
            <Text fz="md" fw={700} c="slate.8" mb="sm">
              Income and affordability
            </Text>
            <SimpleGrid cols={2} spacing="sm">
              <SimField
                label="Basic salary,"
                hint="for multipliers"
                value={basicSalary}
                onChange={setBasicSalary}
              />
              {activeIncomes.map((s) => (
                <SimField
                  key={s[0]}
                  label={s[0]}
                  hint={`${s[1]}% recognized`}
                  value={incomes[s[0]] || 0}
                  onChange={setInc(s[0])}
                />
              ))}
              <SimField
                label="Requested tenure,"
                hint="months"
                value={tenure}
                onChange={setTenure}
              />
            </SimpleGrid>
          </Paper>

          {/* Card 2 — Risk and collateral */}
          <Paper
            radius="sm"
            p="md"
            style={{ border: "1px solid var(--mantine-color-slate-2)" }}
          >
            <Text fz="md" fw={700} c="slate.8" mb="sm">
              Risk and collateral
            </Text>
            <SimpleGrid cols={2} spacing="sm">
              <SimField
                label="Credit score"
                value={creditScore}
                onChange={setCreditScore}
              />
              <SimField
                label="On time payment"
                value={onTime}
                onChange={setOnTime}
              />
              <SimField
                label="Maximum days past due"
                value={maxDPD}
                onChange={setMaxDPD}
              />
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
              label={
                <Text fz={12} c="slate.7">
                  Active non-performing asset
                </Text>
              }
            />
          </Paper>

          {/* Card 3 — Existing obligations */}
          {activeObligations.length > 0 && (
            <Paper
              radius="sm"
              p="md"
              style={{ border: "1px solid var(--mantine-color-slate-2)" }}
            >
              <Text fz="md" fw={700} c="slate.8" mb="sm">
                Existing obligations
              </Text>
              <SimpleGrid cols={2} spacing="sm">
                {activeObligations.map((s) => (
                  <SimField
                    key={s.name}
                    label={s.name}
                    value={obligations[s.name] || 0}
                    onChange={setObl(s.name)}
                  />
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Stack>
      </Box>

      {/* ── RIGHT: Results ── */}
      <Box
        style={{
          gridColumn: "span 5",
          position: "sticky",
          top: 12,
          alignSelf: "start",
        }}
      >
        <Paper
          radius="sm"
          p="md"
          style={{
            border: `1px solid ${decision === "Decline" ? "var(--mantine-color-red-3)" : "var(--mantine-color-slate-2)"}`,
            background:
              decision === "Decline" ? "var(--mantine-color-red-0)" : "white",
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
              <Text
                fz="sm"
                fw={700}
                c={decision === "Eligible" ? "green.7" : "red.7"}
              >
                {decision}
              </Text>
            </Group>
            <Badge
              color={
                risk.tone === "high"
                  ? "red.7"
                  : risk.tone === "medium"
                    ? "orange.7"
                    : "green.7"
              }
              variant="light"
              size="sm"
              radius="sm"
            >
              {risk.label}
            </Badge>
          </Group>

          {/* Eligible amount */}
          <Box mb={4}>
            <Text
              fz={10}
              fw={600}
              c="slate.5"
              tt="uppercase"
              style={{ letterSpacing: "0.04em" }}
            >
              Eligible amount
            </Text>
            <Text fz={24} fw={700} c="slate.8" lh={1.2}>
              ZMW&nbsp;&nbsp;{Math.round(final).toLocaleString()}
            </Text>
          </Box>

          {/* Pre-approved amount */}
          <Box mb="xs">
            <Text
              fz={10}
              fw={600}
              c="slate.5"
              tt="uppercase"
              style={{ letterSpacing: "0.04em" }}
            >
              Pre-approved
            </Text>
            <Text fz={18} fw={700} c="brand.6" lh={1.2}>
              ZMW&nbsp;&nbsp;{Math.round(preApproved).toLocaleString()}
            </Text>
          </Box>

          <Paper
            px={8}
            py={7}
            mb="sm"
            radius="sm"
            style={{
              border: "1px solid var(--mantine-color-slate-2)",
              background: "var(--mantine-color-slate-0)",
            }}
          >
            <Text fz={10} fw={700} c="slate.6" mb={4}>
              Debt Service Ratio (DSR) calculation
            </Text>
            <Group justify="space-between" gap="xs">
              <Text fz={11} c="slate.6">
                Total qualifying monthly debt ={" "}
                {Math.round(existingDSR).toLocaleString()} ZMW
              </Text>
              <Text
                fz={11}
                fw={700}
                c={
                  existingDti <= formulaParams.maxDtiRatio / 100
                    ? "green.7"
                    : "red.7"
                }
              >
                DSR = {((existingDti || 0) * 100).toFixed(1)}% /{" "}
                {formulaParams.maxDtiRatio}%
              </Text>
            </Group>
            <Text fz={9} c="slate.5" mt={3}>
              Includes parameters checked for DSR, adjusted by their consider
              percentage.
            </Text>
          </Paper>

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
              Amount is limited by{" "}
              <b>{limitingFactor.replace(" limit", "").toLowerCase()}</b>.
            </Text>
          )}

          {/* Eligibility breakdown — compact 2-col grid */}
          <Text fz={11} fw={600} c="slate.6" mb={6}>
            Eligibility breakdown
          </Text>
          <SimpleGrid cols={2} spacing={6}>
            {limits.map((l) => {
              const isLimiting =
                l.name === limitingFactor && decision === "Eligible";
              return (
                <Box
                  key={l.name}
                  px={8}
                  py={6}
                  style={{
                    border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "transparent"}`,
                    background: isLimiting
                      ? "var(--mantine-color-yellow-0)"
                      : "transparent",
                    borderRadius: 4,
                  }}
                >
                  <Group gap={4} wrap="nowrap">
                    <Text fz={10} c="slate.5" style={{ whiteSpace: "nowrap" }}>
                      {l.name}
                    </Text>
                    {isLimiting && (
                      <Text fz={10} c="yellow.7">
                        ☆
                      </Text>
                    )}
                  </Group>
                  <Text fz={13} fw={700} c="slate.8" mt={1}>
                    {Math.round(l.value).toLocaleString()}
                  </Text>
                </Box>
              );
            })}
          </SimpleGrid>
        </Paper>
      </Box>
    </SimpleGrid>
  );
}