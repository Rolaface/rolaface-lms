import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { Pill } from "./shared";
import { getEligibilityRules, deleteEligibilityRule } from "../../../api/OriginationSetupAPi/createRuleApi"; 
import { CreateRule } from "../EligibilityCheck/CreateRuleTabs/CreateRule";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
 export interface EligibilityRuleListItem {
  name: string;
  modified_by: string;
  modified: string;
  rule_name: string;
  version: string;
  status: string;
  loan_product: string;
  effective_to: string | null;
  effective_from: string;
  draft_id: string | null;
  product_name: string;
}

export interface GetEligibilityRulesResponse {
  status_code: number;
  status: string;
  message: string;
  data: EligibilityRuleListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

  const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatVersion = (v?: string | null) =>
  v ? (/^v/i.test(v) ? v : `v${v}`) : "—";

export function EligibilityRules({ onSimulate }: { onSimulate: () => void }) {
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

 const [viewOnly, setViewOnly] = useState(false);

const openCreate = () => {
  setSelectedRuleId(null);
  setViewOnly(false);
  setCreateOpen(true);
};
const openRule = (id: string, readOnly: boolean) => {
  setSelectedRuleId(id);
  setViewOnly(readOnly);
  setCreateOpen(true);
};
const closeModal = () => {
  setCreateOpen(false);
  setSelectedRuleId(null);
  setViewOnly(false);
};
  const { data: response, isLoading, isError } = useQuery<GetEligibilityRulesResponse>({
    queryKey: ["eligibility-rules"],
    queryFn: getEligibilityRules,
  });

  const rules = response?.data ?? [];
  const queryClient = useQueryClient();
   const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "OK", color: "green" }],
    });
  };
  const deleteMutation = useMutation({
  mutationFn: deleteEligibilityRule,
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: ["eligibility-rules"] });
    showSuccess(
      "Rule Deleted",
      `Eligibility rule ${variables} deleted successfully.`,
    );
  },
  onError: (error: any) => {
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "OK", color: "red" }],
    });
  },
});

const confirmDelete = (id: string) => {
  openCommonModal({
    heading: "Delete Eligibility Rule",
    subtitle: "This action cannot be undone.",
    body: (
      <>
        Are you sure you want to delete{" "}
        <Text span fw={600}>
          {id}
        </Text>
        ?
      </>
    ),
    color: "red",
    buttons: [
      { label: "Cancel", variant: "default" },
      {
        label: "Delete",
        color: "red",
        onClick: () => deleteMutation.mutate(id),
      },
    ],
  });
};

  const filtered = rules.filter((r) =>
    (r.rule_name || "").toLowerCase().includes(query.toLowerCase()),
  );

  const statCards = useMemo(() => {
    const active = rules.filter((r) => r.status?.toLowerCase() === "active").length;
    const draft = rules.filter((r) => r.status?.toLowerCase() === "draft").length;
    const latest = [...rules].sort((a, b) => (b.modified || "").localeCompare(a.modified || ""))[0];
    return [
      { label: "Active Rules", value: String(active), color: "var(--mantine-color-green-7)" },
      { label: "Draft Rules", value: String(draft), color: "var(--mantine-color-yellow-7)" },
      { label: "High-Risk Rules", value: "—", color: "var(--mantine-color-red-7)" },
      { label: "Last Updated", value: formatDate(latest?.modified), color: "var(--mantine-color-slate-8)" },
      { label: "Current Rule Version", value: formatVersion(latest?.version), color: "var(--mantine-color-slate-8)" },
    ];
  }, [rules]);

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
       <Button
  size="xs"
  radius="sm"
  color="brand"
  leftSection={<IconPlus size={14} />}
  style={{ height: 26 }}
  onClick={openCreate}
>
  Create Rule
</Button>
      </Group>

      <SimpleGrid cols={{ base: 2, md: 5 }} spacing="sm" mt="md">
        {statCards.map((c) => (
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
            {isLoading && (
              <Table.Tr>
                <Table.Td colSpan={10} c="slate.5" ta="center" style={{ border: "none" }}>Loading rules...</Table.Td>
              </Table.Tr>
            )}
            {isError && (
              <Table.Tr>
                <Table.Td colSpan={10} c="red.7" ta="center" style={{ border: "none" }}>Failed to load eligibility rules.</Table.Td>
              </Table.Tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={10} c="slate.5" ta="center" style={{ border: "none" }}>No eligibility rules found.</Table.Td>
              </Table.Tr>
            )}
            {filtered.map((r) => {
              const status = (r.status || "").toLowerCase();
              return (
                <Table.Tr key={r.name} className="lms-row">
                  <Table.Td fw={600} c="slate.8" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)", padding: "8px 12px", borderLeft: status === "active" ? "3px solid var(--mantine-color-green-4)" : status === "draft" ? "3px solid var(--mantine-color-yellow-4)" : "3px solid var(--mantine-color-slate-3)" }}>{r.rule_name}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.product_name || r.loan_product}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>—</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>—</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>—</Table.Td>
                  <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}><Pill tone={status}>{r.status}</Pill></Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{formatVersion(r.version)}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", whiteSpace: "nowrap", padding: "8px 12px" }}>{formatDate(r.modified)}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.modified_by}</Table.Td>
                  <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", padding: "8px 12px" }}>
                    <Group gap={2} wrap="nowrap" justify="flex-end">
                      <Tooltip label="View" withArrow><ActionIcon size="sm" variant="subtle" color="slate" onClick={() => openRule(r.name, true)}><IconEye size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Edit" withArrow><ActionIcon size="sm" variant="subtle" color="slate" onClick={() => openRule(r.name, false)}><IconPencil size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Delete" withArrow><ActionIcon size="sm" variant="subtle" color="danger" onClick={() => confirmDelete(r.name)}><IconTrash size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Duplicate" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconCopy size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Version history" withArrow><ActionIcon size="sm" variant="subtle" color="slate"><IconHistory size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Disable" withArrow><ActionIcon size="sm" variant="subtle" color="orange"><IconPlayerPause size={14} /></ActionIcon></Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
      {createOpen && (
  <CreateRule
  opened={createOpen}
  ruleId={selectedRuleId ?? undefined}
  viewOnly={viewOnly}
  onExit={closeModal}
/>
)}
    </Box>
  );
}

export default EligibilityRules;