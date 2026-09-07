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
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Box>
          <Text fz="lg" fw={600} c="slate.8">Configured Eligibility Rules</Text>
          <Text fz="sm" mt={4} maw={520} c="slate.5">
            Rules used to determine customer eligibility, risk category, maximum loan amount and pre-approved loan amount.
          </Text>
        </Box>
        <Group gap={8} wrap="wrap">
          <Button size="sm" radius="xl" leftSection={<IconPlus size={15} />} color="brand" onClick={onCreateRule}>Create Rule</Button>
          <Button size="sm" radius="xl" variant="default" leftSection={<IconFlask size={15} />} onClick={onSimulate}>Test Eligibility</Button>
          <Button size="sm" radius="xl" variant="default" leftSection={<IconUpload size={15} />}>Import Rules</Button>
          <Button size="sm" radius="xl" variant="default" leftSection={<IconDownload size={15} />}>Export Rules</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, md: 5 }} spacing="sm" mt={28}>
        {STAT_CARDS.map((c) => (
          <Paper key={c.label} radius="md" p="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }}>
            <Text fz="xs" c="slate.5">{c.label}</Text>
            <Text fz="lg" fw={600} mt={4} style={{ color: c.color }}>{c.value}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Group justify="space-between" mt={32} mb={12}>
        <Text fz="sm" fw={600} c="slate.8">Configured rules</Text>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search rules"
          leftSection={<IconSearch size={14} />}
          size="xs"
          radius="sm"
          w={220}
        />
      </Group>

      <Paper radius="md" style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
        <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm">
          <Table.Thead>
            <Table.Tr>
              {["Rule Name", "Loan Product", "Customer Type", "Risk", "Priority", "Status", "Version", "Updated", "By", ""].map((h) => (
                <Table.Th key={h} c="slate.5" fw={600} style={{ borderColor: "var(--mantine-color-slate-2)", whiteSpace: "nowrap" }}>{h}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((r) => (
              <Table.Tr key={r.name}>
                <Table.Td fw={600} c="slate.8" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.name}</Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.product}</Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.type}</Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}><Pill tone={r.risk}>{r.risk === "low" ? "Low Risk" : r.risk === "medium" ? "Medium Risk" : "High Risk"}</Pill></Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.priority}</Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}><Pill tone={r.status}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill></Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.version}</Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)", whiteSpace: "nowrap" }}>{r.updated}</Table.Td>
                <Table.Td c="slate.6" style={{ borderColor: "var(--mantine-color-slate-2)" }}>{r.by}</Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-2)" }}>
                  <Group gap={6} wrap="nowrap">
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