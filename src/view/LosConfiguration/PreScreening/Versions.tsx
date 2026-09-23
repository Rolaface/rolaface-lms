import { Paper, Box, Group, Stack, Text, Title } from "@mantine/core";
import { IconArchive, IconCheck, IconClock, IconHistory } from "@tabler/icons-react";
import type { RuleSet } from "./types";
import { StatusBadge } from "./shared";

export interface VersionsTabProps {
  ruleSet: RuleSet;
}

const toneFor = (status: string) =>
  status === "Active" ? "green" : status === "Scheduled" ? "blue" : "slate";

export default function VersionsTab({ ruleSet }: VersionsTabProps) {
  const versions = ruleSet.versions.slice().reverse();

  return (
    <Box maw={760}>
      <Group gap={8} align="center" mb={10} wrap="nowrap">
        <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
          <IconHistory size={13} stroke={2} />
        </Box>
        <Title order={4} fz={13} c="slate.8">Version History</Title>
        <Text fz={11.5} c="slate.5">{versions.length} versions</Text>
      </Group>

      {versions.length === 0 ? (
        <Paper withBorder radius="md" p={14} style={{ border: "1px dashed var(--mantine-color-slate-3)", textAlign: "center", background: "var(--mantine-color-slate-0)" }}>
          <Text fz={11.5} c="dimmed">No versions published yet.</Text>
        </Paper>
      ) : (
        versions.map((v) => {
          const tone = toneFor(v.status);
          return (
            <Paper
              withBorder
              radius="md"
              p={12}
              mb={8}
              key={v.version}
              style={{
                background: "var(--mantine-color-white)",
                borderColor: "var(--mantine-color-slate-2)",
                borderLeft: `3px solid var(--mantine-color-${tone}-4)`,
              }}
            >
              <Group align="flex-start" gap={10} wrap="nowrap">
                <Box
                  w={46}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "6px 4px",
                    borderRadius: 6,
                    background: `var(--mantine-color-${tone}-0)`,
                    color: `var(--mantine-color-${tone}-7)`,
                  }}
                >
                  {v.status === "Active" ? <IconCheck size={13} stroke={2.2} /> : v.status === "Scheduled" ? <IconClock size={13} stroke={2.2} /> : <IconArchive size={13} stroke={2.2} />}
                  <Text fz={12} fw={700} lh={1}>v{v.version}</Text>
                </Box>
                <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8} align="center" wrap="nowrap">
                    <StatusBadge status={v.status} />
                    <Text fz={11} c="slate.5" truncate>{v.effective}</Text>
                  </Group>
                  <Text fz={12} c="slate.8">{v.note}</Text>
                  <Text fz={11} c="slate.5">Published by {v.by}</Text>
                </Stack>
              </Group>
            </Paper>
          );
        })
      )}
    </Box>
  );
}
