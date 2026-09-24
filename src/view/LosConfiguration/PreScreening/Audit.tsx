import { Paper, Box, Group, Stack, Table, Text, Title } from "@mantine/core";
import { IconCheck, IconClipboardList, IconPencil, IconPlus, IconUpload } from "@tabler/icons-react";
import type { RuleSet } from "./types";

export interface AuditTabProps {
  ruleSet: RuleSet;
}

const headStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "var(--mantine-color-slate-5)",
  whiteSpace: "nowrap" as const,
  padding: "0 10px 4px",
  border: "none",
};

const cellStyle = {
  padding: "7px 10px",
  border: "none",
  boxShadow: "var(--mantine-shadow-xs)",
  background: "var(--mantine-color-white)",
  verticalAlign: "middle" as const,
};

export default function AuditTab({ ruleSet }: AuditTabProps) {
  const eventStyle = (action: string) => {
    if (action.toLowerCase().includes("published")) return { color: "green", icon: <IconCheck size={11} stroke={2.4} /> };
    if (action.toLowerCase().includes("added")) return { color: "brand", icon: <IconPlus size={11} stroke={2.4} /> };
    if (action.toLowerCase().includes("edited")) return { color: "orange", icon: <IconPencil size={11} stroke={2.2} /> };
    return { color: "blue", icon: <IconUpload size={11} stroke={2.2} /> };
  };

  return (
    <Box maw={900}>
      <Group gap={8} align="center" mb={10} wrap="nowrap">
        <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
          <IconClipboardList size={13} stroke={2} />
        </Box>
        <Title order={4} fz={13} c="slate.8">Audit Trail</Title>
        <Text fz={11.5} c="slate.5">{ruleSet.audit.length} events</Text>
      </Group>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Table verticalSpacing={5} horizontalSpacing="sm" fz={12.5} w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 5px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 140 }} />
            <col style={{ width: 120 }} />
            <col />
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              {["When", "User", "Event"].map((h) => (
                <Table.Th key={h} style={headStyle}>{h}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {ruleSet.audit.map((a, i) => {
              const style = eventStyle(a.action);
              return (
                <Table.Tr key={i}>
                  <Table.Td style={{ ...cellStyle, borderLeft: `3px solid var(--mantine-color-${style.color}-4)`, borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)" }}>
                    <Text fz={11.5} c="slate.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>{a.date}</Text>
                  </Table.Td>
                  <Table.Td style={cellStyle}>
                    <Text fz={11.5} fw={600} c="slate.8" truncate>{a.user}</Text>
                  </Table.Td>
                  <Table.Td style={{ ...cellStyle, borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)" }}>
                    <Stack gap={1}>
                      <Group gap={5} wrap="nowrap">
                        <Box style={{ display: "inline-flex", color: `var(--mantine-color-${style.color}-7)` }}>{style.icon}</Box>
                        <Text fz={11.5} fw={600} c={`${style.color}.7`}>{a.action}</Text>
                      </Group>
                      <Text fz={11} c="slate.5">{a.detail}</Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Box>
  );
}
