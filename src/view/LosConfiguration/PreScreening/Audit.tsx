import { Paper, Box, Text, Divider } from "@mantine/core";
import type { RuleSet } from "./types";

export interface AuditTabProps {
  ruleSet: RuleSet;
}

export default function AuditTab({ ruleSet }: AuditTabProps) {
  return (
    <Paper withBorder radius="lg" shadow="xs" maw={800} style={{ overflow: "hidden" }}>
      {ruleSet.audit.map((a, i) => (
        <Box key={i}>
          {i > 0 && <Divider />}
          <Box
            px="lg"
            py="md"
            style={{ display: "grid", gridTemplateColumns: "150px 130px 1fr", gap: 12 }}
          >
            <Text fz={13} c="dimmed">{a.date}</Text>
            <Text fz={13} fw={600}>{a.user}</Text>
            <Text fz={13}>
              <Text span fw={600}>{a.action}</Text> — <Text span c="dimmed">{a.detail}</Text>
            </Text>
          </Box>
        </Box>
      ))}
    </Paper>
  );
}