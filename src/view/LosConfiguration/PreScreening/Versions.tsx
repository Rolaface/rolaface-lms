import { Paper, Box, Group, Text } from "@mantine/core";
import type { RuleSet } from "./types";
import { StatusBadge } from "./shared";

export interface VersionsTabProps {
  ruleSet: RuleSet;
}

export default function VersionsTab({ ruleSet }: VersionsTabProps) {
  return (
    <Box maw={720}>
      {ruleSet.versions.slice().reverse().map((v) => (
        <Paper withBorder radius="lg" shadow="xs" p="lg" mb="md" key={v.version}>
          <Group align="flex-start" gap="lg" wrap="nowrap">
            <Box w={52} style={{ flexShrink: 0 }}>
              <Text fz={18} fw={600}>v{v.version}</Text>
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