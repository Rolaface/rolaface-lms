import { useState } from "react";
import {
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Table,
  Text,
  TextInput,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconFlask,
  IconUpload,
  IconDownload,
  IconSearch,
  IconEye,
  IconFileText,
  IconCopy,
  IconHistory,
  IconPlayerPause,
} from "@tabler/icons-react";
import { Pill, RULES } from "./shared";

const STAT_CARDS = [
  { label: "Active Rules", value: "6", color: "var(--mantine-color-green-7)" },
  { label: "Draft Rules", value: "1", color: "var(--mantine-color-yellow-7)" },
  { label: "High-Risk Rules", value: "1", color: "var(--mantine-color-red-7)" },
  { label: "Last Updated", value: "2 Aug 2026", color: "var(--mantine-color-slate-8)" },
  { label: "Current Rule Version", value: "v2.0", color: "var(--mantine-color-slate-8)" },
];

export function EligibilityRules({ onCreateRule, onSimulate }: { onCreateRule: () => void; onSimulate: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = RULES.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Box style={{ margin: "0 auto" }}>
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Box>
          <Text fz="md" fw={600} c="slate.8">Configured Eligibility Rules</Text>
          <Text fz="xs" mt={2} maw={520} c="slate.5">
            Rules used to determine customer eligibility, risk category, maximum loan amount and pre-approved loan amount.
          </Text>
        </Box>
        <Group gap={6} wrap="wrap">
          <Button size="xs" radius="sm" variant="default" leftSection={<IconUpload size={14} />} style={{ height: 26 }}>Import Rules</Button>
          <Button size="xs" radius="sm" variant="default" leftSection={<IconDownload size={14} />} style={{ height: 26 }}>Export Rules</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, md: 5 }} spacing="sm" mt="md">
        {STAT_CARDS.map((c) => (
          <Paper key={c.label} radius="sm" p={10} style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <Text fz={10} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: '0.04em' }}>{c.label}</Text>
            <Text fz="md" fw={700} mt={4} style={{ color: c.color }}>{c.value}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Group justify="space-between" mt="lg" mb="sm">
        <Text fz="sm" fw={600} c="slate.8">Configured rules</Text>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search rules"
          leftSection={<IconSearch size={12} />}
          size="xs"
          radius="sm"
          w={220}
          styles={{ input: { height: 26, minHeight: 26, fontSize: 11 } }}
        />
      </Group>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <style>{`
  .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
  .lms-row:hover td { background: var(--mantine-color-slate-0) !important; }
        `}</style>
        <Table verticalSpacing={6} horizontalSpacing="sm" fz={11} w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <Table.Thead>
            <Table.Tr>
              {["Rule Name", "Loan Product", "Customer Type", "Risk", "Priority", "Status", "Version", "Updated", "By", ""].map((h) => (
                <Table.Th key={h} c="slate.5" fw={700} style={{ fontSize: 10, padding: "0 12px 4px", textTransform: "uppercase", letterSpacing: "0.04em", border: "none", whiteSpace: "nowrap" }}>{h}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((r) => (
              <Table.Tr key={r.name} className="lms-row">
                <Table.Td fw={600} c="slate.8" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)", padding: "8px 12px", borderLeft: r.status === "active" ? "3px solid var(--mantine-color-green-4)" : r.status === "draft" ? "3px solid var(--mantine-color-yellow-4)" : "3px solid var(--mantine-color-slate-3)" }}>{r.name}</Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.product}</Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.type}</Table.Td>
                <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}><Pill tone={r.risk}>{r.risk === "low" ? "Low Risk" : r.risk === "medium" ? "Medium Risk" : "High Risk"}</Pill></Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.priority}</Table.Td>
                <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}><Pill tone={r.status}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill></Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.version}</Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", whiteSpace: "nowrap", padding: "8px 12px" }}>{r.updated}</Table.Td>
                <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.by}</Table.Td>
                <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", padding: "8px 12px" }}>
                  <Group gap={2} wrap="nowrap" justify="flex-end">
                    <Tooltip label="View" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconEye size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Edit" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconFileText size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Duplicate" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconCopy size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Version history" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconHistory size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Disable" withArrow><ActionIcon size="sm" variant="subtle" color="orange"><IconPlayerPause size={14} /></ActionIcon></Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Box>
  );
}

export default EligibilityRules;