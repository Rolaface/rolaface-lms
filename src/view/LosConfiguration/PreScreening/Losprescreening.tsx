import { useState, useEffect } from "react";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { create, getAll, remove, update, getById, setStatus, getFields } from "../../../api/LosConfiguration/PreScreeningApi";
import { useLoanProductOptions } from "../../../components/Modal/OriginationSetup/LoanProductAssignmentModal";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Table,
  Text,
  Title,
  Stack,
  Tabs,
  Modal,
  useMantineTheme,
  TextInput,
  Textarea,
  Select,
  ActionIcon,
  Loader,
  Menu,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconChevronLeft,
  IconListCheck,
  IconTestPipe,
  IconHistory,
  IconClipboardList,
  IconDeviceDesktopCog,
  IconX,
  IconTrash,
  IconPencil,
  IconEye,
  IconDotsVertical,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
import {
  computeValidation,
  setPrescreeningConfig,
  isListOp,
  isBetweenOp,
  isRelativeOp,
  formatDate,
  type Rule,
  type RuleSet,
  type RuleSetSummary,
} from "./types";
import { StatusBadge, Toast } from "./shared";
import BuilderTab from "./Builder";
import TestTab from "./Test";
import VersionsTab from "./Versions";
import AuditTab from "./Audit";
import { DateInput } from "@mantine/dates";

/* ============================================================
   HELPERS
   ============================================================ */
const getSafeErrorMessage = (err: any): string => {
  try {
    const msg = parseFrappeError(err);
    if (typeof msg === "string") return msg;
    if (typeof msg === "object") return JSON.stringify(msg);
    return String(msg);
  } catch {
    return "An unknown error occurred.";
  }
};

const showError = (heading: string, error: any) => {
  openCommonModal({
    heading,
    subtitle: "We couldn't complete your request.",
    body: getSafeErrorMessage(error),
    color: "red",
    buttons: [{ label: "Close", color: "red" }],
  });
};

const showSuccess = (heading: string, body: string) => {
  openCommonModal({
    heading,
    subtitle: "",
    body,
    color: "green",
    buttons: [{ label: "Close", color: "green" }],
  });
};

const unwrap = (res: any) => res?.data ?? res?.message?.data ?? res?.message ?? null;

/* ============================================================
   PAYLOAD BUILDERS
   ============================================================ */
const buildRulePayload = (r: any) => {
  const base: any = {
    field: r.fieldId,
    operator: r.operator,
    severity: r.severity,
    action: r.action,
  };
  if (isListOp(r.operator)) {
    base.values = r.values ?? [];
  } else if (isBetweenOp(r.operator)) {
    base.value = r.value;
    base.value2 = r.value2;
  } else if (isRelativeOp(r.operator)) {
    base.value = r.value;
    base.date_unit = r.dateUnit || "months";
  } else {
    base.value = r.value;
  }
  return base;
};

const buildGroupsPayload = (rs: RuleSet) => ({
  ruleset_name: rs.name,
  description: rs.description,
  effective_from: rs.effectiveFrom || null,
  groups: rs.groups.map((g: any) => ({
    name: g.name,
    logic: g.logic,
    rules: g.rules.map(buildRulePayload),
  })),
});

const snapshotOf = (rs: RuleSet) => JSON.stringify(buildGroupsPayload(rs));

const mapRuleFromApi = (r: any, fallbackId: string) => {
  const list = isListOp(r.operator);
  return {
    ...r,
    id: r.id || fallbackId,
    fieldId: r.field || r.fieldId || r.field_id,
    values: list ? (Array.isArray(r.values) ? r.values : Array.isArray(r.value) ? r.value : []) : r.values,
    value: list ? undefined : r.value,
    dateUnit: r.date_unit ?? r.dateUnit,
  };
};

const toRuleSet = (item: any, id: string): RuleSet =>
  ({
    id: item.name ?? id,
    name: item.ruleset_name,
    product: item.loan_product,
    productName: item.product_name || item.loan_product,
    draftId: item.draft_id ?? null,
    description: item.description ?? "",
    status: item.status,
    version: String(item.version ?? "1.0"),
    effectiveFrom: item.effective_from ?? "",
    effectiveTo: item.effective_to ?? "",
    createdBy: item.owner ?? "",
    modifiedDate: item.modified,
    modifiedBy: item.modified_by,
    groups: Array.isArray(item.groups)
      ? item.groups.map((g: any, gi: number) => ({
          ...g,
          id: g.id || `g${gi}`,
          rules: Array.isArray(g.rules) ? g.rules.map((r: any, ri: number) => mapRuleFromApi(r, `r${gi}-${ri}`)) : [],
        }))
      : [],
    versions: [],
    audit: [],
  }) as unknown as RuleSet;

/* ============================================================
   TABLE STYLES
   ============================================================ */
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
  height: 44,
  border: "none",
  boxShadow: "var(--mantine-shadow-xs)",
  background: "var(--mantine-color-white)",
  verticalAlign: "middle" as const,
};

/* ============================================================
   STATUS CHANGE (shared by list and detail)
   ============================================================ */
const confirmStatusChange = ({
  name,
  versionLabel,
  product,
  activating,
  onConfirm,
}: {
  name: string;
  versionLabel: string;
  product: string;
  activating: boolean;
  onConfirm: () => void;
}) =>
  openCommonModal({
    heading: activating ? "Activate Rule Set" : "Deactivate Rule Set",
    subtitle: "",
    body: activating ? (
      <>
        Activate{" "}
        <Text span fw={600}>
          {name}
        </Text>{" "}
        ({versionLabel})? New {product} applications will be screened with it, and any previously live version is
        archived.
      </>
    ) : (
      <>
        Deactivate{" "}
        <Text span fw={600}>
          {name}
        </Text>{" "}
        ({versionLabel})? New {product} applications will not be pre-screened until a rule set is activated.
      </>
    ),
    color: activating ? "blue" : "orange",
    buttons: [
      { label: "Cancel", variant: "default" },
      { label: activating ? "Activate" : "Deactivate", color: activating ? "blue" : "orange", onClick: onConfirm },
    ],
  });

/* ============================================================
   RULE SET LIST
   ============================================================ */
function RuleSetList({
  onOpen,
  onCreate,
  onLoaded,
  refreshKey,
}: {
  onOpen: (id: string, viewOnly?: boolean) => void;
  onCreate: () => void;
  onLoaded: (productCodes: string[]) => void;
  refreshKey: number;
}) {
  const theme = useMantineTheme();
  const [rows, setRows] = useState<RuleSetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRuleSets = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getAll({ page: 1, page_size: 100 });
      const list = unwrap(response);
      const apiRows: RuleSetSummary[] = (Array.isArray(list) ? list : []).map((item: any) => ({
        id: item.name,
        draftId: item.draft_id ?? null,
        name: item.ruleset_name,
        productCode: item.loan_product,
        product: item.product_name || item.loan_product,
        status: item.status,
        version: item.version,
        rulesCount: item.rules_count || 0,
        modifiedDate: item.modified,
        modifiedBy: item.modified_by,
      }));
      setRows(apiRows);
      onLoaded(apiRows.map((r) => r.productCode));
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuleSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleDelete = (r: RuleSetSummary, draftOnly = false) => {
    const target = draftOnly ? (r.draftId as string) : r.id;
    openCommonModal({
      heading: draftOnly ? "Discard Draft" : "Delete Rule Set",
      subtitle: "This action cannot be undone.",
      body: draftOnly
        ? `Discard the unpublished draft of "${r.name}"? The v${r.version} version is kept.`
        : `Are you sure you want to delete the draft rule set "${r.name}"?`,
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: draftOnly ? "Discard" : "Delete",
          color: "red",
          onClick: async () => {
            setBusyId(r.id);
            try {
              await remove(target);
              showSuccess(
                draftOnly ? "Draft Discarded" : "Rule Set Deleted",
                draftOnly ? `The draft of "${r.name}" was discarded.` : `Rule set "${r.name}" deleted successfully.`,
              );
              fetchRuleSets();
            } catch (err: any) {
              showError("Delete Failed", err);
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    });
  };

  const changeStatus = (r: RuleSetSummary, activating: boolean) =>
    confirmStatusChange({
      name: r.name,
      versionLabel: activating && r.draftId ? "latest draft" : `v${r.version}`,
      product: r.product,
      activating,
      onConfirm: async () => {
        setBusyId(r.id);
        try {
          await setStatus(activating ? r.draftId ?? r.id : r.id, activating ? "Active" : "Inactive");
          showSuccess(
            activating ? "Rule Set Activated" : "Rule Set Deactivated",
            `Rule set "${r.name}" is now ${activating ? "active" : "inactive"}.`,
          );
          fetchRuleSets();
        } catch (err: any) {
          showError(activating ? "Activation Failed" : "Deactivation Failed", err);
        } finally {
          setBusyId(null);
        }
      },
    });

  const panel = { background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)", textAlign: "center" as const, padding: "72px 40px" };

  return (
    <Stack gap="lg" p="lg" style={{ margin: "0 auto" }}>
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other?.brandGradient || "var(--mantine-color-slate-0)",
              boxShadow: theme.other?.brandGlowShadow || "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconDeviceDesktopCog size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>Pre-Screening Rule Sets</Title>
            <Text fz="sm" c="slate.5">Define the eligibility policy applicants must meet before applications proceed to credit assessment.</Text>
          </Stack>
        </Group>
        <Button
          size="sm"
          radius="xl"
          leftSection={<IconPlus size={14} />}
          style={{ background: theme.other?.brandGradient || "var(--mantine-color-brand-6)" }}
          onClick={onCreate}
        >
          New Rule Set
        </Button>
      </Group>

      {loading ? (
        <Paper radius="lg" p="xl" style={panel}>
          <Loader size="sm" color="brand" />
        </Paper>
      ) : loadError ? (
        <Paper radius="lg" p="xl" style={panel}>
          <Text fw={600} c="slate.8" mb={6}>Rule sets could not be loaded.</Text>
          <Text fz="sm" c="slate.5" mb={16}>{getSafeErrorMessage(loadError)}</Text>
          <Button radius="xl" variant="default" onClick={fetchRuleSets}>Retry</Button>
        </Paper>
      ) : rows.length === 0 ? (
        <Paper radius="lg" p="xl" style={panel}>
          <Box
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--mantine-color-white)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <IconListCheck size={22} color="var(--mantine-color-slate-4)" />
          </Box>
          <Title order={3} fz={19} mb={8}>No pre-screening rules configured</Title>
          <Text c="slate.5" fz={13.5} maw={380} mx="auto" mb={22}>Define eligibility criteria that applicants must meet before continuing with the loan application.</Text>
          <Button radius="xl" mx="auto" leftSection={<IconPlus size={14} />} style={{ background: theme.other?.brandGradient || "var(--mantine-color-brand-6)" }} onClick={onCreate}>Create First Rule Set</Button>
        </Paper>
      ) : (
        <Paper
          radius="lg"
          p="sm"
          style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Table.ScrollContainer minWidth={860}>
          <Table verticalSpacing={5} horizontalSpacing="sm" fz={12.5} w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 5px" }}>
            <Table.Thead>
              <Table.Tr>
                {["Rule Set", "Product", "Rules", "Version", "Last modified", ""].map((h) => (
                  <Table.Th key={h} style={headStyle}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => {
                const editId = r.draftId ?? r.id;
                return (
                  <Table.Tr key={r.id} onClick={() => onOpen(r.id, true)} style={{ cursor: "pointer" }}>
                    <Table.Td style={{ ...cellStyle, borderLeft: "3px solid var(--mantine-color-brand-4)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)" }}>
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Tooltip label={r.name} withArrow openDelay={400}>
                          <Text fz={12.5} fw={600} c="slate.8" truncate maw={280}>{r.name}</Text>
                        </Tooltip>
                        <Box style={{ flexShrink: 0 }}>
                          <StatusBadge status={r.status} />
                        </Box>
                        {r.draftId && r.draftId !== r.id && (
                          <Box style={{ flexShrink: 0 }}>
                            <StatusBadge status="Draft" />
                          </Box>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">{r.product}</Text></Table.Td>
                    <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">{r.rulesCount}</Text></Table.Td>
                    <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">v{r.version}</Text></Table.Td>
                    <Table.Td style={{ ...cellStyle, whiteSpace: "nowrap" }}><Text fz={11.5} c="slate.6">{formatDate(r.modifiedDate)} · {r.modifiedBy}</Text></Table.Td>
                    <Table.Td
                      style={{ ...cellStyle, borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", textAlign: "right" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        <Tooltip label="View" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onOpen(r.id, true)}>
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={r.draftId && r.draftId !== r.id ? "Edit draft" : "Edit"} withArrow>
                          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onOpen(editId)}>
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={r.status === "Draft" ? "Delete" : "Only drafts can be deleted"} withArrow>
                          <ActionIcon size="sm" variant="subtle" color="red" disabled={r.status !== "Draft"} onClick={() => handleDelete(r)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" width={180} position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon size="sm" variant="subtle" color="gray" loading={busyId === r.id} aria-label="More actions">
                              <IconDotsVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {(r.status !== "Active" || (r.draftId && r.draftId !== r.id)) && (
                              <Menu.Item leftSection={<IconPlayerPlay size={14} />} onClick={() => changeStatus(r, true)}>
                                {r.draftId && r.draftId !== r.id ? "Activate draft" : "Activate"}
                              </Menu.Item>
                            )}
                            {r.status === "Active" && (
                              <Menu.Item color="orange" leftSection={<IconPlayerPause size={14} />} onClick={() => changeStatus(r, false)}>
                                Deactivate
                              </Menu.Item>
                            )}
                            {r.draftId && r.draftId !== r.id && (
                              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(r, true)}>
                                Discard draft
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
          </Table.ScrollContainer>
        </Paper>
      )}
    </Stack>
  );
}

/* ============================================================
   CREATE RULE SET MODAL
   ============================================================ */
function CreateRuleSetModal({
  existingProducts,
  onClose,
  onCreate,
}: {
  existingProducts: string[];
  onClose: () => void;
  onCreate: (v: { name: string; product: string; desc: string; effectiveDate: string | null }) => Promise<void>;
}) {
  const theme = useMantineTheme();
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { options } = useLoanProductOptions();
  const productOptions = options.map((o) => ({
    ...o,
    disabled: existingProducts.includes(o.value),
  }));

  const submit = async () => {
    setCreating(true);
    try {
      await onCreate({ name: name.trim(), product: product as string, desc: desc.trim(), effectiveDate });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      opened
      onClose={() => !creating && onClose()}
      centered
      withCloseButton={false}
      size="md"
      radius="lg"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      styles={{
        body: { padding: 0 },
        content: { overflow: "hidden", borderTop: "4px solid var(--mantine-color-brand-6)" },
      }}
    >
      <Stack gap={0}>
        <Box
          pos="relative"
          pt={44}
          pb={24}
          style={{
            background: "linear-gradient(to bottom, var(--mantine-color-brand-1) 0%, var(--mantine-color-brand-0) 40%, transparent 100%)",
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={onClose}
            disabled={creating}
            style={{ position: "absolute", top: 16, right: 16 }}
            aria-label="Close"
          >
            <IconX size={18} />
          </ActionIcon>

          <Box
            mx="auto"
            style={{
              width: 84,
              height: 84,
              borderRadius: "var(--mantine-radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: theme.other?.brandGradient || "var(--mantine-color-brand-6)",
              boxShadow: theme.other?.brandGlowShadow || "none",
              color: "var(--mantine-color-white)",
            }}
          >
            <IconDeviceDesktopCog size={32} stroke={1.8} />
          </Box>
        </Box>

        <Stack align="center" gap="md" px="xl" pb="xl">
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">New Rule Set</Text>
            <Text size="sm" c="dimmed" ta="center">
              Rule sets group the eligibility checks for one loan product.
            </Text>
          </Stack>

          <TextInput
            w="100%"
            radius="md"
            label="Rule Set Name"
            withAsterisk
            placeholder="e.g. Personal Loan — Pre-Screening Rules"
            maxLength={140}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <Select
            w="100%"
            radius="md"
            label="Loan Product"
            withAsterisk
            description="Each product can have one rule set."
            value={product}
            onChange={setProduct}
            data={productOptions}
            searchable
            nothingFoundMessage="No products found"
            placeholder="Select product"
            renderOption={({ option }) => (
              <Group wrap="nowrap" gap="md" py={2} style={{ flex: 1 }}>
                <Text fz={12} fw={600} c="brand.7" miw={60} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                  {option.value}
                </Text>
                <Text size="sm" fw={500} c="slate.8" style={{ flex: 1 }}>
                  {option.label}
                </Text>
                {existingProducts.includes(option.value) && (
                  <Text fz={10.5} c="slate.5">Has a rule set</Text>
                )}
              </Group>
            )}
          />

          <DateInput
            w="100%"
            radius="md"
            label="Effective From"
            description="Leave empty to take effect when activated."
            valueFormat="DD-MMM-YYYY"
            placeholder="DD-MMM-YYYY"
            clearable
            value={effectiveDate}
            onChange={setEffectiveDate}
          />

          <Textarea
            w="100%"
            radius="md"
            label="Description"
            rows={3}
            placeholder="What is this rule set checking for?"
            value={desc}
            onChange={(e) => setDesc(e.currentTarget.value)}
          />

          <Group justify="flex-end" gap={8} w="100%">
            <Button variant="default" radius="xl" onClick={onClose} disabled={creating}>Cancel</Button>
            <Button color="brand" radius="xl" loading={creating} disabled={!name.trim() || !product} onClick={submit}>
              Create Rule Set
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}

/* ============================================================
   RULE SET DETAIL (workspace with tab strip)
   ============================================================ */
const TAB_ITEMS = [
  { value: "builder", label: "Builder", icon: IconListCheck },
  { value: "test", label: "Test", icon: IconTestPipe },
  { value: "versions", label: "Versions", icon: IconHistory },
  { value: "audit", label: "Audit", icon: IconClipboardList },
];

function RuleSetDetail({
  ruleSet,
  setRuleSet,
  dirty,
  viewOnly,
  onBack,
  onReload,
  onEdit,
  toast,
}: {
  ruleSet: RuleSet;
  setRuleSet: (rs: RuleSet) => void;
  dirty: boolean;
  viewOnly: boolean;
  onBack: () => void;
  onReload: (id: string) => Promise<void>;
  onEdit: () => void;
  toast: (m: string) => void;
}) {
  const theme = useMantineTheme();
  const [tab, setTab] = useState<string>("builder");
  const [busy, setBusy] = useState<"save" | "status" | null>(null);

  const v = computeValidation(ruleSet);
  const isLive = ruleSet.status === "Active" && !dirty;

  const handleSaveDraft = async () => {
    setBusy("save");
    try {
      const saved = unwrap(await update(ruleSet.id, buildGroupsPayload(ruleSet)));
      showSuccess("Draft Saved", `Saved as draft version ${saved?.version ?? ruleSet.version}.`);
      await onReload(typeof saved?.name === "string" ? saved.name : ruleSet.id);
    } catch (err: any) {
      showError("Save Failed", err);
    } finally {
      setBusy(null);
    }
  };

  const reorderRules = (groupId: string, rules: Rule[]) =>
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id !== groupId ? g : { ...g, rules })) });
  const rulesCount = v.rulesCount;

  const addGroup = () => {
    const id = "g" + Date.now();
    setRuleSet({ ...ruleSet, groups: [...ruleSet.groups, { id, name: "New Rule Group", logic: "ALL", rules: [] }] });
    toast("Rule group added");
  };
  const renameGroup = (gid: string, name: string) => setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id === gid ? { ...g, name } : g)) });
  const setLogic = (gid: string, logic: "ALL" | "ANY") => setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id === gid ? { ...g, logic } : g)) });
  const deleteGroup = (gid: string) => {
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.filter((g) => g.id !== gid) });
    toast("Rule group removed");
  };

  const duplicateRule = (gid: string, rule: Rule) => {
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id !== gid ? g : { ...g, rules: [...g.rules, { ...rule, id: "r" + Date.now() }] })) });
    toast("Rule duplicated");
  };

  const saveRule = (groupId: string, rule: Rule, isNew: boolean) => {
    setRuleSet({
      ...ruleSet,
      groups: ruleSet.groups.map((g) => {
        if (g.id !== groupId) return g;
        const exists = g.rules.some((r) => r.id === rule.id);
        return { ...g, rules: exists ? g.rules.map((r) => (r.id === rule.id ? rule : r)) : [...g.rules, rule] };
      }),
    });
    toast(isNew ? "Rule added" : "Rule updated");
  };
  const deleteRule = (groupId: string, ruleId: string) => {
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id !== groupId ? g : { ...g, rules: g.rules.filter((r) => r.id !== ruleId) })) });
    toast("Rule removed");
  };

  const changeStatus = (activating: boolean) =>
    confirmStatusChange({
      name: ruleSet.name,
      versionLabel: dirty ? "with your changes, as a new version" : `v${ruleSet.version}`,
      product: ruleSet.productName,
      activating,
      onConfirm: async () => {
        setBusy("status");
        try {
          let id = ruleSet.id;
          if (activating && dirty) {
            const saved = unwrap(await update(ruleSet.id, buildGroupsPayload(ruleSet)));
            if (typeof saved?.name === "string") id = saved.name;
          }
          const result = unwrap(await setStatus(id, activating ? "Active" : "Inactive"));
          showSuccess(
            activating ? "Rule Set Activated" : "Rule Set Deactivated",
            activating
              ? `Version ${result?.version ?? ""} of "${ruleSet.name}" is now active.`
              : `"${ruleSet.name}" is now inactive.`,
          );
          await onReload(id);
        } catch (err: any) {
          showError(activating ? "Activation Failed" : "Deactivation Failed", err);
        } finally {
          setBusy(null);
        }
      },
    });

  return (
    <div>
      <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-white)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ margin: "0 auto", padding: "16px 32px 0" }}>
          <Button variant="subtle" color="slate" size="xs" pl={0} mb={10} leftSection={<IconChevronLeft size={14} />} onClick={onBack}>Rule Sets</Button>

          <Group justify="space-between" align="flex-start" mb={16} wrap="nowrap">
            <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--mantine-radius-md)",
                  background: theme.other?.brandGradient || "var(--mantine-color-brand-6)",
                  boxShadow: theme.other?.brandGlowShadow || "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconDeviceDesktopCog size={20} color="var(--mantine-color-white)" stroke={1.8} />
              </Box>
              <div style={{ minWidth: 0 }}>
                <Group gap={10} mb={4}>
                  <Title order={2} c="slate.8" fw={700} fz={20}>{ruleSet.name}</Title>
                  <StatusBadge status={ruleSet.status} />
                  <Text fz={12.5} c="slate.5" fw={600}>v{ruleSet.version}</Text>
                  {viewOnly && <Badge size="sm" radius="sm" variant="light" color="gray">View only</Badge>}
                  {dirty && <Text fz={12} c="orange.7" fw={600}>Unsaved changes</Text>}
                </Group>
                {ruleSet.description && <Text fz={13.5} c="slate.5" m={0} maw={620}>{ruleSet.description}</Text>}
              </div>
            </Group>
            {viewOnly ? (
              <Button radius="xl" variant="light" color="blue" leftSection={<IconPencil size={14} />} style={{ flexShrink: 0 }} onClick={onEdit}>
                {ruleSet.draftId && ruleSet.draftId !== ruleSet.id ? "Edit draft" : "Edit"}
              </Button>
            ) : (
            <Group gap={8} style={{ flexShrink: 0 }}>
              <Button variant="default" radius="xl" loading={busy === "save"} disabled={!dirty || busy !== null} onClick={handleSaveDraft}>
                Save Draft
              </Button>
              {isLive ? (
                <Button
                  radius="xl"
                  variant="light"
                  color="orange"
                  leftSection={<IconPlayerPause size={14} />}
                  loading={busy === "status"}
                  disabled={busy !== null}
                  onClick={() => changeStatus(false)}
                >
                  Deactivate
                </Button>
              ) : (
                <Tooltip label={v.ok ? "" : "Complete the items under “Before you activate” first"} disabled={v.ok} withArrow>
                  <Button
                    radius="xl"
                    leftSection={<IconPlayerPlay size={14} />}
                    loading={busy === "status"}
                    disabled={!v.ok || busy !== null}
                    style={{ background: v.ok ? (theme.other?.brandGradient || "var(--mantine-color-brand-6)") : undefined }}
                    onClick={() => changeStatus(true)}
                  >
                    Activate Rule Set
                  </Button>
                </Tooltip>
              )}
            </Group>
            )}
          </Group>

          <Tabs value={tab} onChange={(val) => val && setTab(val)} color="brand" variant="default">
            <Tabs.List style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", gap: 4 }}>
              {TAB_ITEMS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.value;
                return (
                  <Tabs.Tab
                    key={t.value}
                    value={t.value}
                    leftSection={<Icon size={15} />}
                    style={{
                      color: isActive ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-6)",
                      backgroundColor: isActive ? "var(--mantine-color-brand-0)" : "transparent",
                      border: isActive ? "1px solid var(--mantine-color-brand-2)" : "1px solid transparent",
                      borderRadius: "6px 6px 0 0",
                      fontWeight: 600,
                      padding: "10px 16px",
                    }}
                  >
                    {t.label}{t.value === "builder" && ` (${rulesCount})`}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs>
        </div>
      </div>

      <div style={{ margin: "0 auto", padding: "28px 32px 80px" }}>
        {tab === "builder" && (
          <BuilderTab
            ruleSet={ruleSet}
            readOnly={viewOnly}
            onSetEffectiveFrom={(effectiveFrom) => setRuleSet({ ...ruleSet, effectiveFrom })}
            onAddGroup={addGroup}
            onRenameGroup={renameGroup}
            onSetLogic={setLogic}
            onReorderRules={reorderRules}
            onDeleteGroup={deleteGroup}
            onDuplicateRule={duplicateRule}
            onSaveRule={saveRule}
            onDeleteRule={deleteRule}
          />
        )}
        {tab === "test" && <TestTab ruleSet={ruleSet} dirty={dirty} />}
        {tab === "versions" && <VersionsTab ruleSet={ruleSet} />}
        {tab === "audit" && <AuditTab ruleSet={ruleSet} />}
      </div>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function LOSPreScreening() {
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [configError, setConfigError] = useState<any>(null);

  useEffect(() => {
    getFields()
      .then((res) => {
        const payload = unwrap(res);
        const cfg = Array.isArray(payload) ? { fields: payload } : payload;
        if (!cfg || !Array.isArray(cfg.fields) || cfg.fields.length === 0) {
          throw new Error("No pre-screening fields were returned.");
        }
        setPrescreeningConfig(cfg);
      })
      .catch((e) => setConfigError(e))
      .finally(() => setFieldsLoaded(true));
  }, []);

  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const [existingProducts, setExistingProducts] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const dirty = !!ruleSet && snapshotOf(ruleSet) !== savedSnapshot;

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 2600);
  };

  const openRuleSet = async (id: string, readOnly = false) => {
    try {
      const item = unwrap(await getById(id));
      if (!item || typeof item !== "object") {
        showError("Load Failed", { message: "The rule set could not be found." });
        return;
      }
      const loaded = toRuleSet(item, id);
      setRuleSet(loaded);
      setSavedSnapshot(snapshotOf(loaded));
      setViewOnly(readOnly);
      setScreen("detail");
    } catch (e: any) {
      showError("Load Failed", e);
    }
  };

  const backToList = () => {
    const leave = () => {
      setScreen("list");
      setRuleSet(null);
      setRefreshKey((k) => k + 1);
    };
    if (!dirty) return leave();
    openCommonModal({
      heading: "Discard changes?",
      subtitle: "",
      body: "You have unsaved changes to this rule set. Leave without saving?",
      color: "red",
      buttons: [
        { label: "Keep editing", variant: "default" },
        { label: "Discard", color: "red", onClick: leave },
      ],
    });
  };

  const handleCreate = async ({ name, product, desc, effectiveDate }: { name: string; product: string; desc: string; effectiveDate: string | null }) => {
    try {
      const created = unwrap(
        await create({
          ruleset_name: name,
          loan_product: product,
          description: desc || undefined,
          effective_from: effectiveDate ? String(effectiveDate).slice(0, 10) : undefined,
          groups: [],
        }),
      );
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
      const newId = created?.name ?? created?.id;
      if (newId) {
        toast("Rule set created");
        await openRuleSet(newId);
      }
    } catch (err: any) {
      showError("Creation Failed", err);
    }
  };

  if (!fieldsLoaded) {
    return (
      <Stack align="center" justify="center" p="xl" mih={240}>
        <Loader size="sm" color="brand" />
      </Stack>
    );
  }
  if (configError) {
    return (
      <Stack align="center" p="xl" gap="sm">
        <Text fw={700}>Pre-screening configuration could not be loaded.</Text>
        <Text fz="sm" c="dimmed">{getSafeErrorMessage(configError)}</Text>
        <Button radius="xl" onClick={() => window.location.reload()}>Retry</Button>
      </Stack>
    );
  }
  return (
    <div>
      {screen === "list" && (
        <RuleSetList
          onOpen={openRuleSet}
          onCreate={() => setShowCreate(true)}
          onLoaded={setExistingProducts}
          refreshKey={refreshKey}
        />
      )}
      {screen === "detail" && ruleSet && (
        <RuleSetDetail
          ruleSet={ruleSet}
          setRuleSet={setRuleSet}
          dirty={dirty}
          viewOnly={viewOnly}
          onBack={backToList}
          onReload={(id) => openRuleSet(id)}
          onEdit={() => openRuleSet(ruleSet.draftId ?? ruleSet.id)}
          toast={toast}
        />
      )}
      {showCreate && (
        <CreateRuleSetModal existingProducts={existingProducts} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      <Toast message={toastMsg} />
    </div>
  );
}
