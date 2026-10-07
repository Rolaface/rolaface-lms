import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Table,
  Text,
  TextInput,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconPencil,
  IconTrash,
  IconDotsVertical,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
import { Pill } from "./shared";
import { getEligibilityRules, deleteEligibilityRule, setEligibilityRuleStatus } from "../../../api/OriginationSetupAPi/createRuleApi";
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
  const { data: response, isPending: isLoading, isError } = useQuery<GetEligibilityRulesResponse>({
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
  mutationFn: (rule: EligibilityRuleListItem) => deleteEligibilityRule(rule.name),
  onSuccess: (_, rule) => {
    queryClient.invalidateQueries({ queryKey: ["eligibility-rules"] });
    showSuccess(
      "Rule Deleted",
      `Eligibility rule "${rule.rule_name}" deleted successfully.`,
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

const confirmDelete = (rule: EligibilityRuleListItem) => {
  openCommonModal({
    heading: "Delete Eligibility Rule",
    subtitle: "This action cannot be undone.",
    body: (
      <>
        Are you sure you want to delete{" "}
        <Text span fw={600}>
          {rule.rule_name}
        </Text>{" "}
        ({formatVersion(rule.version)})?
      </>
    ),
    color: "red",
    buttons: [
      { label: "Cancel", variant: "default" },
      {
        label: "Delete",
        color: "red",
        onClick: () => deleteMutation.mutate(rule),
      },
    ],
  });
};

const statusMutation = useMutation({
  mutationFn: ({ id, status }: { rule: EligibilityRuleListItem; id: string; status: "Active" | "Inactive" }) =>
    setEligibilityRuleStatus(id, status),
  onSuccess: (_, { rule, status }) => {
    queryClient.invalidateQueries({ queryKey: ["eligibility-rules"] });
    showSuccess(
      status === "Active" ? "Rule Activated" : "Rule Deactivated",
      `Eligibility rule "${rule.rule_name}" is now ${status === "Active" ? "active" : "inactive"}.`,
    );
  },
  onError: (error: any) => {
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  },
});

const confirmStatus = (rule: EligibilityRuleListItem, status: "Active" | "Inactive") => {
  const activating = status === "Active";
  const target = activating ? rule.draft_id ?? rule.name : rule.name;
  const product = rule.product_name || rule.loan_product;
  openCommonModal({
    heading: activating ? (rule.draft_id ? "Activate Draft" : "Activate Rule") : "Deactivate Rule",
    subtitle: "",
    body: activating ? (
      <>
        Activate{" "}
        <Text span fw={600}>
          {rule.rule_name}
        </Text>
        {rule.draft_id ? " (latest draft)" : ` (${formatVersion(rule.version)})`}? Applications for {product} will be
        checked against it, and any previously live version is archived.
      </>
    ) : (
      <>
        Deactivate{" "}
        <Text span fw={600}>
          {rule.rule_name}
        </Text>{" "}
        ({formatVersion(rule.version)})? Applications for {product} will have no active eligibility rule until one is
        activated.
      </>
    ),
    color: activating ? "blue" : "orange",
    buttons: [
      { label: "Cancel", variant: "default" },
      {
        label: activating ? "Activate" : "Deactivate",
        color: activating ? "blue" : "orange",
        onClick: () => statusMutation.mutate({ rule, id: target, status }),
      },
    ],
  });
};

  const filtered = rules.filter((r) =>
    (r.rule_name || "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Box style={{ margin: "0 auto" }}>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm" mb="sm">
        <Group gap={8} align="center">
          <Text fz="sm" fw={600} c="slate.8">Configured rules</Text>
          {!isLoading && !isError && (
            <Badge size="sm" radius="sm" variant="light" color="slate">{rules.length}</Badge>
          )}
        </Group>
        <Group gap={8} wrap="nowrap">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search rules"
            leftSection={<IconSearch size={12} />}
            size="xs"
            radius="sm"
            w={220}
            styles={{ input: { height: 28, minHeight: 28, fontSize: 11 } }}
          />
          <Button size="xs" radius="sm" color="brand" leftSection={<IconPlus size={14} />} style={{ height: 28 }} onClick={openCreate}>
            Create Rule
          </Button>
        </Group>
      </Group>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <style>{`
  .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
  .lms-row:hover td { background: var(--mantine-color-slate-0) !important; }
        `}</style>
        <Table verticalSpacing={6} horizontalSpacing="sm" fz={11} w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <Table.Thead>
            <Table.Tr>
              {["Rule Name", "Loan Product", "Status", "Version", "Updated", "By", ""].map((h) => (
                <Table.Th key={h} c="slate.5" fw={700} style={{ fontSize: 10, padding: "0 12px 4px", textTransform: "uppercase", letterSpacing: "0.04em", border: "none", whiteSpace: "nowrap" }}>{h}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading && (
              <Table.Tr>
                <Table.Td colSpan={7} c="slate.5" ta="center" style={{ border: "none" }}>Loading rules...</Table.Td>
              </Table.Tr>
            )}
            {isError && (
              <Table.Tr>
                <Table.Td colSpan={7} c="red.7" ta="center" style={{ border: "none" }}>Failed to load eligibility rules.</Table.Td>
              </Table.Tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} c="slate.5" ta="center" style={{ border: "none" }}>No eligibility rules found.</Table.Td>
              </Table.Tr>
            )}
            {filtered.map((r) => {
              const status = (r.status || "").toLowerCase();
              return (
                <Table.Tr key={r.name} className="lms-row">
                  <Table.Td fw={600} c="slate.8" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)", padding: "8px 12px", borderLeft: status === "active" ? "3px solid var(--mantine-color-green-4)" : status === "draft" ? "3px solid var(--mantine-color-yellow-4)" : "3px solid var(--mantine-color-slate-3)" }}>{r.rule_name}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.product_name || r.loan_product}</Table.Td>
                  <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}><Pill tone={status}>{r.status}</Pill></Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{formatVersion(r.version)}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", whiteSpace: "nowrap", padding: "8px 12px" }}>{formatDate(r.modified)}</Table.Td>
                  <Table.Td c="slate.6" style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", padding: "8px 12px" }}>{r.modified_by}</Table.Td>
                  <Table.Td style={{ border: "none", boxShadow: "var(--mantine-shadow-xs)", borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", padding: "8px 12px" }}>
                    <Group gap={2} wrap="nowrap" justify="flex-end">
                      <Tooltip label="View" withArrow>
                        <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openRule(r.name, true)}>
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit" withArrow>
                        <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => openRule(r.draft_id ?? r.name, false)}>
                          <IconPencil size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={status === "draft" ? "Delete" : "Only drafts can be deleted"} withArrow>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          disabled={status !== "draft"}
                          loading={deleteMutation.isPending && deleteMutation.variables?.name === r.name}
                          onClick={() => confirmDelete(r)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Menu shadow="md" width={190} position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            loading={statusMutation.isPending && statusMutation.variables?.rule.name === r.name}
                            aria-label="More actions"
                          >
                            <IconDotsVertical size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {(status !== "active" || r.draft_id) && (
                            <Menu.Item
                              leftSection={<IconPlayerPlay size={14} />}
                              onClick={() => confirmStatus(r, "Active")}
                            >
                              {r.draft_id ? "Activate draft" : "Activate"}
                            </Menu.Item>
                          )}
                          {status === "active" && (
                            <Menu.Item
                              color="orange"
                              leftSection={<IconPlayerPause size={14} />}
                              onClick={() => confirmStatus(r, "Inactive")}
                            >
                              Deactivate
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
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