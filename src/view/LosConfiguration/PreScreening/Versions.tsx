import { Paper, Box, Group, Text } from "@mantine/core";
import { IconArchive, IconCheck, IconClock } from "@tabler/icons-react";
import type { RuleSet } from "./types";
import { StatusBadge } from "./shared";

export interface VersionsTabProps {
  ruleSet: RuleSet;
}

export default function VersionsTab({ ruleSet }: VersionsTabProps) {
  return (
    <Box maw={720}>
      {ruleSet.versions.slice().reverse().map((v) => (
        <Paper
          withBorder
          radius="lg"
          shadow="xs"
          p="lg"
          mb="md"
          key={v.version}
          style={{
            borderLeft: `3px solid ${v.status === "Active" ? "var(--mantine-color-green-6)" : v.status === "Scheduled" ? "var(--mantine-color-blue-6)" : "var(--mantine-color-slate-4)"}`,
          }}
        >
          <Group align="flex-start" gap="lg" wrap="nowrap">
            <Box
              w={58}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 4px",
                borderRadius: "var(--mantine-radius-md)",
                background: v.status === "Active" ? "var(--mantine-color-green-0)" : v.status === "Scheduled" ? "var(--mantine-color-blue-0)" : "var(--mantine-color-slate-1)",
                color: v.status === "Active" ? "var(--mantine-color-green-7)" : v.status === "Scheduled" ? "var(--mantine-color-blue-7)" : "var(--mantine-color-slate-6)",
              }}
            >
              {v.status === "Active" ? <IconCheck size={16} /> : v.status === "Scheduled" ? <IconClock size={16} /> : <IconArchive size={16} />}
              <Text fz={16} fw={700} lh={1}>v{v.version}</Text>
            </Box>
            <Box style={{ flex: 1 }}>
              <Group gap="sm" mb={6}>
                <StatusBadge status={v.status} />
                <Text fz={12.5} c="dimmed">{v.effective}</Text>
              </Group>
              <Text fz={13.5} mb={4}>{v.note}</Text>
              <Text fz={12} c="dimmed">Published by {v.by}</Text>
            </Box>
          </Group>
        </Paper>
      ))}
    </Box>
  );
}