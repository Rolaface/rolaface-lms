import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  SimpleGrid,
  Stack,
  Group,
  Text,
  Checkbox,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconCircleX, IconAlertTriangle } from "@tabler/icons-react";
import { Pill, SectionLabel, LabeledField, computeEligibility, type EligibilityInputs } from "./shared";

function NumberField({ label, value, onChange, prefix = "ZMW" }: { label: string; value: any; onChange: (v: any) => void; prefix?: string }) {
  return (
    <LabeledField label={label}>
      <Group gap={0} style={{ border: "1px solid var(--mantine-color-slate-3)", borderRadius: "var(--mantine-radius-sm)", overflow: "hidden" }}>
        {prefix && (
          <Box px={8} py={8} style={{ background: "var(--mantine-color-slate-0)" }}>
            <Text fz="xs" c="slate.5">{prefix}</Text>
          </Box>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ flex: 1, border: "none", outline: "none", padding: "8px 10px", fontSize: 13.5, width: "100%" }}
        />
      </Group>
    </LabeledField>
  );
}

const DEFAULT_INPUTS: EligibilityInputs = {
  basicSalary: 15000, netSalary: 12500, otherIncome: 3000, existingEMI: 2000,
  existingBalance: 20000, creditScore: 735, onTime: 94, maxDPD: 12, npa: false,
  collateral: 100000, tenure: 24, productMax: 100000,
};

export function Simulator() {
  const [inputs, setInputs] = useState<EligibilityInputs>(DEFAULT_INPUTS);
  // const set = <K extends keyof EligibilityInputs>(k: K) => (v: EligibilityInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));
  const set = (k: keyof EligibilityInputs) => (v: any) => setInputs((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => computeEligibility(inputs), [inputs]);

  return (
    <Box style={{margin: "0 auto" }}>
      <Text fz="lg" fw={600} c="slate.8">Eligibility Simulator</Text>
      <Text fz="sm" mt={4} mb="lg" c="slate.5">Enter a sample customer to see, in real time, how their eligible and pre-approved amounts are calculated — and why.</Text>

      <SimpleGrid cols={{ base: 1, md: 12 }} spacing="lg">
        <Box style={{ gridColumn: "span 5" }}>
          <Paper radius="md" p="lg" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel>Customer profile — John Mwansa</SectionLabel>
            <SimpleGrid cols={2} spacing="md">
              <NumberField label="Basic Salary" value={inputs.basicSalary} onChange={set("basicSalary")} />
              <NumberField label="Net Salary" value={inputs.netSalary} onChange={set("netSalary")} />
              <NumberField label="Other Income" value={inputs.otherIncome} onChange={set("otherIncome")} />
              <NumberField label="Existing Monthly EMI" value={inputs.existingEMI} onChange={set("existingEMI")} />
              <NumberField label="Existing Loan Balance" value={inputs.existingBalance} onChange={set("existingBalance")} />
              <NumberField label="Collateral Value" value={inputs.collateral} onChange={set("collateral")} />
              <NumberField label="Credit Score" prefix="" value={inputs.creditScore} onChange={set("creditScore")} />
              <NumberField label="On-Time Payment %" prefix="" value={inputs.onTime} onChange={set("onTime")} />
              <NumberField label="Maximum DPD (days)" prefix="" value={inputs.maxDPD} onChange={set("maxDPD")} />
              <NumberField label="Requested Tenure (months)" prefix="" value={inputs.tenure} onChange={set("tenure")} />
            </SimpleGrid>
            <Checkbox
              mt="md"
              checked={inputs.npa}
              onChange={(e) => set("npa")(e.currentTarget.checked)}
              label={<Text fz="sm" c="slate.8">Current NPA status = Active</Text>}
            />
          </Paper>
        </Box>

        <Box style={{ gridColumn: "span 7" }}>
          <Paper radius="md" p="lg" style={{ border: `1px solid ${r.decision === "Decline" ? "var(--mantine-color-red-2)" : "var(--mantine-color-slate-2)"}` }}>
            <Group justify="space-between">
              <Group gap={8}>
                {r.decision === "Eligible" ? <IconCheck size={18} color="var(--mantine-color-green-6)" /> : <IconCircleX size={18} color="var(--mantine-color-red-6)" />}
                <Text fz="sm" fw={700} c={r.decision === "Eligible" ? "green.7" : "red.7"}>{r.decision}</Text>
              </Group>
              <Pill tone={r.risk.tone}>{r.risk.label}</Pill>
            </Group>
            <SimpleGrid cols={2} spacing="md" mt="md">
              <Box>
                <Text fz="xs" c="slate.5">Eligible Amount</Text>
                <Text fz={24} fw={700} c="slate.8">ZMW {Math.round(r.final).toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fz="xs" c="slate.5">Pre-Approved Amount</Text>
                <Text fz={24} fw={700} c="brand.6">ZMW {Math.round(r.preApproved).toLocaleString()}</Text>
              </Box>
            </SimpleGrid>
            {r.decision === "Eligible" && (
              <Text fz="xs" mt="md" p="sm" style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)", color: "var(--mantine-color-brand-7)" }}>
                Your pre-approved amount is limited by {r.limitingFactor.replace(" Limit", "")}.
              </Text>
            )}
          </Paper>

          <Paper radius="md" p="lg" mt="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel sub="Every limit is calculated; the lowest one wins.">Eligibility Breakdown</SectionLabel>
            <Stack gap={8}>
              {r.limits.map((l) => {
                const isLimiting = l.name === r.limitingFactor && r.decision === "Eligible";
                return (
                  <Group
                    key={l.name}
                    justify="space-between"
                    px="sm"
                    py={10}
                    style={{
                      border: `1px solid ${isLimiting ? "var(--mantine-color-yellow-3)" : "var(--mantine-color-slate-2)"}`,
                      background: isLimiting ? "var(--mantine-color-yellow-0)" : "var(--mantine-color-white)",
                      borderRadius: "var(--mantine-radius-sm)",
                    }}
                  >
                    <Text fz="sm" c="slate.8">{l.name}</Text>
                    <Group gap={8}>
                      <Text fz="sm" fw={600} c="slate.8">ZMW {Math.round(l.value).toLocaleString()}</Text>
                      {isLimiting ? (
                        <Pill tone="medium" leftSection={<IconAlertTriangle size={11} />}>Limiting Factor</Pill>
                      ) : (
                        <Pill tone="low" leftSection={<IconCheck size={11} />}>Passed</Pill>
                      )}
                    </Group>
                  </Group>
                );
              })}
            </Stack>
          </Paper>

          <Paper radius="md" p="lg" mt="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <SectionLabel>Decision Summary</SectionLabel>
            <SimpleGrid cols={3} spacing="md">
              {[
                ["Eligible Amount", `ZMW ${Math.round(r.final).toLocaleString()}`],
                ["Pre-Approved Amount", `ZMW ${Math.round(r.preApproved).toLocaleString()}`],
                ["Maximum Tenure", `${inputs.tenure} Months`],
                ["Maximum EMI", `ZMW ${Math.round(r.maxEMIOut).toLocaleString()}`],
                ["Risk Grade", r.tier.grade],
                ["Credit Score", String(inputs.creditScore)],
                ["Limiting Factor", r.decision === "Eligible" ? r.limitingFactor : "—"],
                ["Required Action", r.decision === "Eligible" ? (r.risk.pct > 0 ? "Automatic Approval" : "Manual Review") : "Decline"],
              ].map(([k, val]) => (
                <Box key={k} px="sm" py={8} style={{ background: "var(--mantine-color-slate-0)", borderRadius: "var(--mantine-radius-sm)" }}>
                  <Text fz="xs" c="slate.5">{k}</Text>
                  <Text fz="sm" fw={600} mt={2} c="slate.8">{val}</Text>
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