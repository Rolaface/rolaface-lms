import { useState } from "react";
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
} from "@tabler/icons-react";
import {
  STEPS,
  DEFAULT_PARAMS,
  DEFAULT_WEIGHTS,
  Pill,
  SectionLabel,
  LabeledField,
  type WeightItem,
} from "./shared";

const INCOME_SOURCES: [string, number, boolean, boolean][] = [
  ["Salary", 100, true, true], ["Business Income", 70, true, true], ["Rental Income", 80, true, true],
  ["Commission", 50, true, true], ["Agricultural Income", 60, true, false], ["Pension", 90, false, true],
  ["Investment Income", 70, true, false], ["Spouse Income", 50, true, false],
];

const CREDIT_BANDS: [string, string, string, string, string][] = [
  ["800–900", "A", "8× income", "Eligible", "low"],
  ["700–799", "B", "6× income", "Eligible", "low"],
  ["600–699", "C", "4× income", "Conditional", "medium"],
  ["500–599", "D", "2× income", "Manual Review", "medium"],
  ["Below 500", "E", "0× income", "Decline", "high"],
];

const REPAYMENT_ROWS: [string, string, "low" | "medium" | "high"][] = [
  ["On-Time Payment ≥ 95%", "+15 risk points", "low"],
  ["On-Time Payment 85–94%", "+5 risk points", "low"],
  ["On-Time Payment 70–84%", "No adjustment", "medium"],
  ["On-Time Payment < 70%", "−30% eligibility", "high"],
  ["Previous loan default = Yes", "Manual Review / Decline", "high"],
];

const COLLATERAL_TYPES = ["Property", "Vehicle", "Equipment", "Fixed Deposit", "Securities", "Guarantor", "Salary Assignment", "None"];

const OBLIGATION_TYPES = ["Existing Loan Balance", "Existing Monthly EMI", "Number of Active Loans", "Credit Card Balance", "Overdraft Balance", "Mortgage Payment", "Other Monthly Debt"];

const FORMULA_STEPS = ["Salary Limit", "Affordability Limit", "Credit Limit", "Existing Exposure Limit", "Collateral Limit", "Product Limit"];

const TIERS = [
  { t: "Tier 1 — Low Risk", cond: "Score ≥ 750 · DTI ≤ 30% · On-time ≥ 95%", pct: "90%", max: "ZMW 100,000", tone: "low" as const },
  { t: "Tier 2 — Medium Risk", cond: "Score 650–749 · DTI ≤ 40% · On-time ≥ 85%", pct: "75%", max: "ZMW 60,000", tone: "medium" as const },
  { t: "Tier 3 — High Risk", cond: "Score 550–649", pct: "50%", max: "ZMW 25,000", tone: "high" as const },
  { t: "Tier 4 — Very High Risk", cond: "Score < 550", pct: "Not automatic", max: "Manual Review / Decline", tone: "high" as const },
];

const HARD_STOPS = ["Active NPA", "Fraud Flag", "Blacklisted Customer", "Credit Score Below Minimum", "Existing Loan Default"];

export function CreateRule({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [params, setParams] = useState<Record<string, string>>(DEFAULT_PARAMS);
  const [weights, setWeights] = useState<WeightItem[]>(DEFAULT_WEIGHTS);
  const totalWeight = weights.reduce((s, x) => s + Number(x.w || 0), 0);

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
                  <LabeledField label="Rule Name"><TextInput defaultValue="Standard Personal Loan Eligibility" /></LabeledField>
                  <LabeledField label="Rule Version"><TextInput defaultValue="v1.0" disabled /></LabeledField>
                  <LabeledField label="Loan Product">
                    <Select defaultValue="Personal Loan" data={["Personal Loan", "Staff Loan", "SME Loan", "Salary Advance", "Asset Finance", "Emergency Loan"]} />
                  </LabeledField>
                  <LabeledField label="Customer Type">
                    <Select defaultValue="Individual" data={["Individual", "Employee", "SME", "Corporate"]} />
                  </LabeledField>
                  <LabeledField label="Customer Segment">
                    <Select defaultValue="New Customer" data={["New Customer", "Existing Customer", "Repeat Borrower", "Preferred Customer"]} />
                  </LabeledField>
                  <LabeledField label="Risk Category">
                    <Select defaultValue="Medium Risk" data={["Low Risk", "Medium Risk", "High Risk"]} />
                  </LabeledField>
                  <LabeledField label="Priority" hint="Lower number is evaluated first when multiple rules match."><TextInput type="number" defaultValue={1} /></LabeledField>
                  <LabeledField label="Rule Status">
                    <Select defaultValue="Draft" data={["Draft", "Active", "Disabled"]} />
                  </LabeledField>
                  <LabeledField label="Effective From"><TextInput type="date" defaultValue="2026-09-05" /></LabeledField>
                  <LabeledField label="Effective Until"><TextInput type="date" /></LabeledField>
                </SimpleGrid>
              </Box>
            )}

            {step === 1 && (
              <Box>
                <SectionLabel sub="Choose which customer attributes this rule checks, and whether each is required to proceed.">Customer Parameters</SectionLabel>
                <Stack gap={0}>
                  {Object.keys(params).map((k, i) => (
                    <Group key={k} justify="space-between" py={10} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : undefined }}>
                      <Text fz="sm" c="slate.8">{k}</Text>
                      <SegmentedControl
                        size="xs"
                        color="brand"
                        value={params[k]}
                        onChange={(v) => setParams((p) => ({ ...p, [k]: v }))}
                        data={["Required", "Optional", "Ignored"]}
                      />
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}

            {step === 2 && (
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

            {step === 3 && (
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

            {step === 4 && (
              <Box>
                <SectionLabel sub="Map credit score bands to risk grade, borrowing multiple and decision.">Credit &amp; Payment History</SectionLabel>
                <Table verticalSpacing="xs" fz="sm" mb="xl">
                  <Table.Thead>
                    <Table.Tr>
                      {["Credit Score", "Risk Grade", "Max Loan Multiple", "Decision"].map((h) => (
                        <Table.Th key={h} c="slate.5" fw={600} style={{ borderColor: "var(--mantine-color-slate-2)" }}>{h}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {CREDIT_BANDS.map((row) => (
                      <Table.Tr key={row[0]}>
                        <Table.Td c="slate.8" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{row[0]}</Table.Td>
                        <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{row[1]}</Table.Td>
                        <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{row[2]}</Table.Td>
                        <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}><Pill tone={row[4] as "low" | "medium" | "high"}>{row[3]}</Pill></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <SectionLabel sub="Bonuses and penalties based on on-time repayment percentage.">Repayment behaviour</SectionLabel>
                <Stack gap={8}>
                  {REPAYMENT_ROWS.map((r) => (
                    <Group key={r[0]} justify="space-between" px="sm" py={8} style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-sm)" }}>
                      <Text fz="sm" c="slate.8">{r[0]}</Text>
                      <Pill tone={r[2]}>{r[1]}</Pill>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}

            {step === 5 && (
              <Box>
                <SectionLabel sub="Configure how each collateral type converts to a maximum secured loan amount.">Collateral</SectionLabel>
                <SimpleGrid cols={2} spacing="sm" mb="xl">
                  {COLLATERAL_TYPES.map((c) => (
                    <Checkbox key={c} defaultChecked={c === "Property"} label={<Text fz="sm" c="slate.8">{c}</Text>}
                      styles={{ body: { border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-sm)", padding: "8px 12px" } }} />
                  ))}
                </SimpleGrid>
                <Paper radius="md" p="md" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
                  <Text fz="xs" fw={600} mb="sm" c="slate.8">Worked example — Property</Text>
                  <SimpleGrid cols={3} spacing="md" style={{ textAlign: "center" }}>
                    <Box><Text fz="xs" c="slate.5">Market Value</Text><Text fz="sm" fw={600}>500,000</Text></Box>
                    <Box><Text fz="xs" c="slate.5">Haircut 20%</Text><Text fz="sm" fw={600}>400,000</Text></Box>
                    <Box><Text fz="xs" c="slate.5">Max LTV 70%</Text><Text fz="sm" fw={600} c="brand.6">280,000</Text></Box>
                  </SimpleGrid>
                </Paper>
              </Box>
            )}

            {step === 6 && (
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

            {step === 7 && (
              <Box>
                <SectionLabel sub="The eligible amount is always the lowest of the limits below — no code required.">Eligibility Formula</SectionLabel>
                <Stack gap={0}>
                  {FORMULA_STEPS.map((s, i, arr) => (
                    <Box key={s}>
                      <Group gap="sm" px="sm" py={8} style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-sm)" }}>
                        <ThemeIcon size={20} radius="xl" variant="light" color="brand"><Text fz={10} fw={700}>{i + 1}</Text></ThemeIcon>
                        <Text fz="sm" c="slate.8">{s}</Text>
                      </Group>
                      {i < arr.length - 1 && (
                        <Group justify="center" py={2}><IconChevronDown size={14} color="var(--mantine-color-slate-5)" /></Group>
                      )}
                    </Box>
                  ))}
                </Stack>
                <Group gap="xs" mt="md" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                  <IconShieldCheck size={14} color="var(--mantine-color-brand-7)" />
                  <Text fz="xs" fw={600} c="brand.7">Final Eligible Amount = MIN(all limits above)</Text>
                </Group>
                <Button variant="subtle" color="slate" size="xs" px={0} mt="md">Switch to advanced formula editor (optional)</Button>
              </Box>
            )}

            {step === 8 && (
              <Box>
                <SectionLabel sub="Set how much of the eligible amount is offered automatically, by risk tier.">Pre-Approval Limits</SectionLabel>
                <SimpleGrid cols={2} spacing="sm">
                  {TIERS.map((t) => (
                    <Paper key={t.t} radius="md" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
                      <Group justify="space-between" mb={4}>
                        <Text fz="sm" fw={600} c="slate.8">{t.t}</Text>
                        <Pill tone={t.tone}>{t.pct}</Pill>
                      </Group>
                      <Text fz="xs" c="slate.5">{t.cond}</Text>
                      <Text fz="xs" mt={8} c="slate.5">Maximum: <Text span fw={600} c="slate.8">{t.max}</Text></Text>
                    </Paper>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {step === 9 && (
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

            {step === 10 && (
              <Box>
                <SectionLabel sub="Confirm the configuration below. Publishing creates a new version — the active rule is never edited in place.">Review &amp; Publish</SectionLabel>
                <SimpleGrid cols={2} spacing="sm">
                  {[["Rule Name", "Standard Personal Loan Eligibility"], ["Loan Product", "Personal Loan"], ["Risk Category", "Medium Risk"], ["Max DTI", "40%"], ["Max EMI Ratio", "30%"], ["Risk Weight Total", `${totalWeight}%`], ["Pre-Approval Tiers", "4 configured"], ["Hard Stops", "5 configured"]].map(([k, val]) => (
                    <Group key={k} justify="space-between" px="sm" py={8} style={{ background: "var(--mantine-color-slate-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                      <Text fz="sm" c="slate.5">{k}</Text>
                      <Text fz="sm" fw={600} c="slate.8">{val}</Text>
                    </Group>
                  ))}
                </SimpleGrid>
                <Group gap="sm" mt="xl">
                  <Button color="brand" radius="xl">Publish as v1.0</Button>
                  <Button variant="default" radius="xl">Save as Draft</Button>
                </Group>
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