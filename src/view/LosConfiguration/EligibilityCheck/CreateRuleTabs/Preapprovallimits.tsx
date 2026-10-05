import { Box, SimpleGrid, Paper, Group, Text } from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { Pill, type riskTier } from "../shared";
import {
  SectionHead,
  InfoCard,
  TIERS,
  type computeFormulaPreview,
} from "./Ruleshared";

interface PreApprovalLimitsProps {
  formulaPreview: ReturnType<typeof computeFormulaPreview>;
  sampleRisk: ReturnType<typeof riskTier>;
  sampleTier: (typeof TIERS)[number] | undefined;
  preApprovedPreview: number;
}

export function PreApprovalLimits({
  formulaPreview,
  sampleRisk,
  sampleTier,
  preApprovedPreview,
}: PreApprovalLimitsProps) {
  return (
    <Box>
      <SectionHead
        title="Pre-Approval Limits"
        description="Once the eligible amount is known, the applicant's risk tier decides how much of it is offered automatically."
      />
      <InfoCard color="brand">
        <Group gap={6}>
          <IconShieldCheck size={12} color="var(--mantine-color-brand-6)" />
          <Text fz={11} fw={600} c="brand.7">
            Pre-Approved Amount = MIN(Eligible Amount x Tier %, Tier Maximum)
          </Text>
        </Group>
      </InfoCard>
      <SimpleGrid cols={2} spacing="sm" mt="sm">
        {TIERS.map((t) => {
          const isSample = t.label === sampleRisk.label;
          const isHardStop = t.pct === 0;
          return (
            <Paper
              key={t.t}
              radius="sm"
              px="sm"
              py="sm"
              style={{
                border: `1px solid ${isSample ? "var(--mantine-color-yellow-3)" : isHardStop ? "var(--mantine-color-red-2)" : "var(--mantine-color-slate-2)"}`,
                background: isSample
                  ? "var(--mantine-color-yellow-0)"
                  : isHardStop
                    ? "var(--mantine-color-red-0)"
                    : "var(--mantine-color-white)",
              }}
            >
              <Group justify="space-between" mb={4}>
                <Text fz="xs" fw={700} c="slate.8">
                  {t.t}
                </Text>
                <Group gap={4}>
                  {isSample && <Pill tone="medium">Sample</Pill>}
                  <Pill tone={t.tone}>
                    {isHardStop ? "Hard Stop" : `${t.pct}%`}
                  </Pill>
                </Group>
              </Group>
              <Text fz={10} c="slate.5" mb={4}>
                {t.cond}
              </Text>
              <Text fz={10} c="slate.5">
                Max:{" "}
                <Text span fw={600} c="slate.7">
                  {isHardStop
                    ? "Manual Review / Decline"
                    : `ZMW ${t.max.toLocaleString()}`}
                </Text>
              </Text>
            </Paper>
          );
        })}
      </SimpleGrid>
      <Paper
        radius="sm"
        px="sm"
        py="sm"
        mt="sm"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          background: "var(--mantine-color-slate-0)",
        }}
      >
        <Text fz={11} fw={700} mb={6} c="slate.7">
          Worked example — same sample applicant
        </Text>
        <SimpleGrid cols={4} spacing="sm" style={{ textAlign: "center" }}>
          {[
            [
              "Eligible Amount",
              `ZMW ${Math.round(formulaPreview.final).toLocaleString()}`,
            ],
            ["Risk Tier", sampleRisk.label],
            ["Tier %", sampleTier ? `${sampleTier.pct}%` : "—"],
            [
              "Pre-Approved",
              `ZMW ${Math.round(preApprovedPreview).toLocaleString()}`,
            ],
          ].map(([label, value], idx) => (
            <Box key={label}>
              <Text
                fz={9}
                c="slate.5"
                tt="uppercase"
                style={{ letterSpacing: ".04em" }}
              >
                {label}
              </Text>
              <Text fz="xs" fw={700} c={idx === 3 ? "brand.6" : "slate.8"} mt={2}>
                {value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Paper>
    </Box>
  );
}