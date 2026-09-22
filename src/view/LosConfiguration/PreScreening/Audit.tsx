import { Paper, Box, Text, Divider, Badge } from "@mantine/core";
import { IconCheck, IconEdit, IconPlus, IconUpload } from "@tabler/icons-react";
import type { RuleSet } from "./types";

export interface AuditTabProps {
  ruleSet: RuleSet;
}

export default function AuditTab({ ruleSet }: AuditTabProps) {
  const eventStyle = (action: string) => {
    if (action.toLowerCase().includes("published")) return { color: "var(--mantine-color-green-7)", wash: "var(--mantine-color-green-0)", icon: <IconCheck size={13} /> };
    if (action.toLowerCase().includes("added")) return { color: "var(--mantine-color-brand-7)", wash: "var(--mantine-color-brand-0)", icon: <IconPlus size={13} /> };
    if (action.toLowerCase().includes("edited")) return { color: "var(--mantine-color-orange-7)", wash: "var(--mantine-color-orange-0)", icon: <IconEdit size={13} /> };
    return { color: "var(--mantine-color-blue-7)", wash: "var(--mantine-color-blue-0)", icon: <IconUpload size={13} /> };
  };

  return (
    <Paper withBorder radius="lg" shadow="xs" maw={800} style={{ overflow: "hidden" }}>
      {ruleSet.audit.map((a, i) => (
        <Box key={i}>
          {i > 0 && <Divider />}
          {(() => {
            const style = eventStyle(a.action);
            return (
          <Box
            px="lg"
            py="md"
            style={{ display: "grid", gridTemplateColumns: "150px 130px 1fr", gap: 12, borderLeft: `3px solid ${style.color}` }}
          >
            <Box>
              <Badge color="gray" variant="light" size="sm" radius="sm" style={{ background: style.wash, color: style.color, fontFamily: "Inter, var(--font-main), sans-serif" }}>
                {a.date}
              </Badge>
            </Box>
            <Text fz={13} fw={600}>{a.user}</Text>
            <Text fz={13}>
              <Text span fw={700} c={style.color} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                {style.icon}{a.action}
              </Text>
              <Text span c="dimmed"> — {a.detail}</Text>
            </Text>
          </Box>
            );
          })()}
        </Box>
      ))}
    </Paper>
  );
}