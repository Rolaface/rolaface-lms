import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  SimpleGrid,
  Stack,
  Group,
  Text,
  Checkbox,
  Pill,
} from "@mantine/core";
import { IconCheck, IconCircleX, IconAlertTriangle } from "@tabler/icons-react";
import { SectionLabel, LabeledField, computeEligibility, type EligibilityInputs } from "./shared";

function NumberField({ label, value, onChange, prefix = "ZMW" }: { label: string; value: any; onChange: (v: any) => void; prefix?: string }) {
  return (
    <LabeledField label={label}>
      <Group gap={0} wrap="nowrap" style={{ border: "1px solid var(--mantine-color-slate-3)", borderRadius: 2, overflow: "hidden" }}>
        {prefix && (
          <Box px={6} py={4} style={{ background: "var(--mantine-color-slate-0)", borderRight: "1px solid var(--mantine-color-slate-2)" }}>
            <Text fz={9} fw={600} c="slate.5">{prefix}</Text>
          </Box>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ flex: 1, border: "none", outline: "none", padding: "4px 8px", fontSize: 11, height: 24, minHeight: 24, width: "100%", boxSizing: "border-box" }}
        />
      </Group>
    </LabeledField>
  );
}

const DEFAULT_INPUTS: EligibilityInputs = {
  basicSalary: 15000, netSalary: 12500, otherIncome: 3000, existingEMI: 2000,
  existingBalance: 20000, creditScore: 735, onTime: 94, maxDPD: 12, npa: false,
  tenure: 24, productMax: 100000,
};

export function Simulator() {
  const [inputs, setInputs] = useState<EligibilityInputs>(DEFAULT_INPUTS);
  const set = (k: keyof EligibilityInputs) => (v: any) => setInputs((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => computeEligibility(inputs), [inputs]);

  return (
    <Box style={{margin: "0 auto" }}>
      <Group justify="space-between" mb="sm" align="flex-end">
        <Box>
          <Text fz="md" fw={600} c="slate.8">Eligibility Simulator</Text>
          <Text fz="xs" mt={2} c="slate.5">Enter a sample customer to see, in real time, how their eligible and pre-approved amounts are calculated — and why.</Text>
        </Box>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 12 }} spacing="sm">
        <Box style={{ gridColumn: "span 4" }}>
          <Paper radius="sm" p="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel>Sample Applicant Inputs</SectionLabel>
            <Stack gap="xs" mt="sm">
              <NumberField label="Basic Salary" value={inputs.basicSalary} onChange={set("basicSalary")} />
              <NumberField label="Net Salary" value={inputs.netSalary} onChange={set("netSalary")} />
              <NumberField label="Other Income" value={inputs.otherIncome} onChange={set("otherIncome")} />
              <NumberField label="Existing Monthly EMI" value={inputs.existingEMI} onChange={set("existingEMI")} />
              <NumberField label="Existing Loan Balance" value={inputs.existingBalance} onChange={set("existingBalance")} />
              <NumberField label="Credit Score" prefix="PTS" value={inputs.creditScore} onChange={set("creditScore")} />
              <NumberField label="On-Time Payment %" prefix="%" value={inputs.onTime} onChange={set("onTime")} />
              <NumberField label="Maximum DPD (days)" prefix="DAY" value={inputs.maxDPD} onChange={set("maxDPD")} />
              <NumberField label="Requested Tenure (months)" prefix="MTH" value={inputs.tenure} onChange={set("tenure")} />
            </Stack>
            <Checkbox
              mt="md"
              size="xs"
              checked={inputs.npa}
              onChange={(e) => set("npa")(e.currentTarget.checked)}
              label={<Text fz={11} c="slate.8">Current NPA status = Active</Text>}
            />
          </Paper>
        </Box>

        <Box style={{ gridColumn: "span 8" }}>
          <Paper radius="sm" p="sm" style={{ border: `1px solid ${r.decision === "Decline" ? "var(--mantine-color-red-3)" : "var(--mantine-color-slate-2)"}`, background: r.decision === "Decline" ? "var(--mantine-color-red-0)" : "white" }}>
            <Group justify="space-between">
              <Group gap={8}>
                {r.decision === "Eligible" ? <IconCheck size={16} color="var(--mantine-color-green-6)" /> : <IconCircleX size={16} color="var(--mantine-color-red-6)" />}
                <Text fz="sm" fw={700} c={r.decision === "Eligible" ? "green.7" : "red.7"}>{r.decision}</Text>
              </Group>
              <Pill bg={r.risk.tone === "high" ? "red.7" : r.risk.tone === "medium" ? "orange.7" : "green.7"} c="white" fz={10}>{r.risk.label}</Pill>
            </Group>
            <SimpleGrid cols={2} spacing="md" mt="sm">
              <Box>
                <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: '0.04em' }}>Eligible Amount</Text>
                <Text fz={20} fw={700} c="slate.8">ZMW {Math.round(r.final).toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: '0.04em' }}>Pre-Approved Amount</Text>
                <Text fz={20} fw={700} c="brand.6">ZMW {Math.round(r.preApproved).toLocaleString()}</Text>
              </Box>
            </SimpleGrid>
            {r.decision === "Eligible" && (
              <Text fz={11} mt="sm" p={8} style={{ background: "var(--mantine-color-brand-0)", borderRadius: 2, color: "var(--mantine-color-brand-7)" }}>
                Pre-approved amount is limited by <b>{r.limitingFactor.replace(" Limit", "")}</b>.
              </Text>
            )}
          </Paper>

          <Paper radius="sm" p="sm" mt="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel sub="Lowest limit is applied.">Eligibility Breakdown</SectionLabel>
            <Stack gap={6} mt="xs">
              {r.limits.map((l) => {
                const isLimiting = l.name === r.limitingFactor && r.decision === "Eligible";
                return (
                  <Group
                    key={l.name}
                    justify="space-between"
                    px="xs"
                    py={6}
                    style={{
                      border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`,
                      background: isLimiting ? "var(--mantine-color-yellow-0)" : "var(--mantine-color-white)",
                      borderRadius: 2,
                    }}
                  >
                    <Text fz={11} c="slate.8">{l.name}</Text>
                    <Group gap={6}>
                      <Text fz={11} fw={700} c="slate.8">ZMW {Math.round(l.value).toLocaleString()}</Text>
                      {isLimiting ? (
                        <Text fz={9} fw={700} bg="yellow.2" c="yellow.8" px={4} py={2} style={{ borderRadius: 2 }}>Limiting Factor</Text>
                      ) : (
                        <Text fz={9} fw={700} bg="slate.1" c="slate.6" px={4} py={2} style={{ borderRadius: 2 }}>Passed</Text>
                      )}
                    </Group>
                  </Group>
                );
              })}
            </Stack>
          </Paper>

          <Paper radius="sm" p="sm" mt="sm" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel>Decision Summary</SectionLabel>
            <SimpleGrid cols={4} spacing="xs" mt="xs">
              {[
                ["Maximum Tenure", `${inputs.tenure} Months`],
                ["Maximum EMI", `ZMW ${Math.round(r.maxEMIOut).toLocaleString()}`],
                ["Risk Grade", r.tier.grade],
                ["Required Action", r.decision === "Eligible" ? (r.risk.pct > 0 ? "Automatic Approval" : "Manual Review") : "Decline"],
              ].map(([k, val]) => (
                <Box key={k} px={8} py={6} style={{ background: "var(--mantine-color-slate-0)", borderRadius: 2, border: '1px solid var(--mantine-color-slate-2)' }}>
                  <Text fz={9} fw={600} c="slate.5" tt="uppercase">{k}</Text>
                  <Text fz={11} fw={700} mt={2} c="slate.8">{val}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Paper>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

export default Simulator;