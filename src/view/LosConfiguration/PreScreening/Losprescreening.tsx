import { useState, useEffect } from "react";
import { getLoanProducts } from "../../../api/LoanProduct/LoanProductAPi";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { create, getAll, remove, update, getById, setStatus, getFields } from "../../../api/LosConfiguration/PreScreeningApi";
import {
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
} from "@mantine/core";
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconListCheck,
  IconTestPipe,
  IconHistory,
  IconClipboardList,
  IconDeviceDesktopCog,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import {
  computeValidation,
  setPrescreeningConfig,
  isListOp,
  isBetweenOp,
  isRelativeOp,
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
  } catch (e) {
    return "An unknown error occurred.";
  }
};

const showError = (heading: string, error: any) => {
  openCommonModal({
    heading,
    subtitle: "We couldn't complete your request.",
    body: getSafeErrorMessage(error),
    color: "red",
    buttons: [{ label: "OK", color: "red" }],
  });
};

const showSuccess = (heading: string, body: string) => {
  openCommonModal({
    heading,
    subtitle: "",
    body,
    color: "green",
    buttons: [{ label: "OK", color: "green" }],
  });
};

const unwrap = (res: any) => res?.data ?? res?.message?.data ?? res?.message ?? null;

const formatDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(String(d).replace(" ", "T").slice(0, 19));
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
};

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
    base.value = r.values ?? [];
  } else if (isBetweenOp(r.operator)) {
    base.value = r.value;
    base.value2 = r.value2;
  } else if (isRelativeOp(r.operator)) {
    base.value = r.value;
    base.date_unit = r.dateUnit;
  } else {
    base.value = r.value;
  }
  return base;
};

const buildGroupsPayload = (rs: RuleSet) => ({
  ruleset_name: rs.name,
  description: rs.description,
  effective_from: rs.effectiveFrom || undefined,
  groups: rs.groups.map((g: any) => ({
    name: g.name,
    logic: g.logic,
    rules: g.rules.map(buildRulePayload),
  })),
});

const mapRuleFromApi = (r: any) => {
  const list = isListOp(r.operator);
  return {
    ...r,
    fieldId: r.field || r.fieldId || r.field_id,
    values: list ? (Array.isArray(r.value) ? r.value : r.values ?? []) : r.values,
    value: list ? undefined : r.value,
    dateUnit: r.date_unit ?? r.dateUnit,
  };
};

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
   RULE SET LIST
   ============================================================ */
function RuleSetList({
  onOpen,
  onCreate,
  showEmpty,
  setShowEmpty,
  refreshKey,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
  showEmpty: boolean;
  setShowEmpty: (v: boolean) => void;
  refreshKey: number;
}) {
  const theme = useMantineTheme();
  const [rows, setRows] = useState<RuleSetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuleSets = async () => {
    setLoading(true);
    try {
      const response = await getAll({ page: 1, page_size: 50 });
      const list = unwrap(response);
      if (Array.isArray(list)) {
        const apiRows = list.map((item: any) => ({
          id: item.name,
          name: item.ruleset_name,
          product: item.product_name || item.loan_product,
          status: item.status,
          version: item.version,
          rulesCount: item.rules_count || 0,
          modifiedDate: item.modified,
          modifiedBy: item.modified_by,
        }));
        setRows(apiRows);
      }
    } catch (err) {
      console.error("Failed to fetch rule sets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showEmpty) {
      fetchRuleSets();
    } else {
      setRows([]);
      setLoading(false);
    }
  }, [showEmpty, refreshKey]);

  const handleDelete = (e: React.MouseEvent, r: any) => {
    e.stopPropagation();
    openCommonModal({
      heading: "Delete Rule Set",
      subtitle: "This action cannot be undone.",
      body: `Are you sure you want to delete rule set "${r.name}"?`,
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: async () => {
            try {
              await remove(r.id);
              showSuccess("Rule Set Deleted", "Rule set deleted successfully.");
              fetchRuleSets();
            } catch (err: any) {
              showError("Delete Failed", err);
            }
          },
        },
      ],
    });
  };

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
        <Group gap={8}>
          <Button size="sm" radius="xl" variant="default" onClick={() => setShowEmpty(!showEmpty)}>{showEmpty ? "Show rule sets" : "Preview empty state"}</Button>
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
      </Group>

      {loading ? (
        <Paper radius="lg" p="xl" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)", textAlign: "center", padding: "72px 40px" }}>
          <Text c="slate.5">Loading rule sets...</Text>
        </Paper>
      ) : rows.length === 0 ? (
        <Paper radius="lg" p="xl" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)", textAlign: "center", padding: "72px 40px" }}>
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
          <Button radius="xl" mx="auto" leftSection={<IconPlus size={14} />} style={{ background: theme.other?.brandGradient || "var(--mantine-color-brand-6)" }} onClick={onCreate}>Create First Rule</Button>
        </Paper>
      ) : (
        <Paper
          radius="lg"
          p="sm"
          style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}
        >
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
              {rows.map((r) => (
                <Table.Tr key={r.id} onClick={() => onOpen(r.id)} style={{ cursor: "pointer" }}>
                  <Table.Td style={{ ...cellStyle, borderLeft: "3px solid var(--mantine-color-brand-4)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)" }}>
                    <Group gap={6} wrap="nowrap">
                      <Text fz={12.5} fw={600} c="slate.8">{r.name}</Text>
                      <StatusBadge status={r.status} />
                    </Group>
                  </Table.Td>
                  <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">{r.product}</Text></Table.Td>
                  <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">{r.rulesCount}</Text></Table.Td>
                  <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">v{r.version}</Text></Table.Td>
                  <Table.Td style={cellStyle}><Text fz={11.5} c="slate.6">{formatDate(r.modifiedDate)} · {r.modifiedBy}</Text></Table.Td>
                  <Table.Td style={{ ...cellStyle, borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", textAlign: "right" }}>
                    <Group gap={8} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" color="red" onClick={(e) => handleDelete(e, r)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                      <IconChevronRight size={14} color="var(--mantine-color-slate-4)" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}

/* ============================================================
   CREATE RULE SET MODAL
   ============================================================ */
function CreateRuleSetModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (v: { name: string; product: string; desc: string; effectiveDate: string | null }) => void;
}) {
  const theme = useMantineTheme();
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await getLoanProducts({ disabled: 0 });
        const dataArray = Array.isArray(response?.data) ? response.data : [];
        if (dataArray.length > 0) {
          const options = dataArray.map((p: any) => ({
            value: p.name || p.product_name || "Unknown",
            label: p.product_name || p.name || "Unknown",
          }));
          setProductOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch loan products", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <Modal
      opened
      onClose={onClose}
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

          <DateInput
            w="100%"
            radius="md"
            label="Effective Date"
            valueFormat="DD-MMM-YYYY"
            placeholder="DD-MMM-YYYY"
            value={effectiveDate}
            onChange={setEffectiveDate}
          />

          <TextInput
            w="100%"
            radius="md"
            label="Rule Set Name"
            placeholder="e.g. Personal Loan — Pre-Screening Rules"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            w="100%"
            radius="md"
            label="Loan Product"
            value={product ?? null}
            onChange={setProduct}
            data={[{ value: "HEADER", label: "HEADER", disabled: true }, ...productOptions]}
            disabled={loadingProducts}
            placeholder={loadingProducts ? "Loading..." : "Select product"}
            leftSection={product ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mantine-color-brand-7)", fontFamily: "var(--mantine-font-family-monospace)", display: "inline-block", marginLeft: 8 }}>{product}</span> : undefined}
            leftSectionWidth={product ? 70 : 30}
            renderOption={({ option, checked }) => {
              if (option.value === "HEADER") {
                return (
                  <Group wrap="nowrap" gap="xl" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                    <Text fz={10} fw={700} c="slate.5" miw={60}>CODE</Text>
                    <Text fz={10} fw={700} c="slate.5">PRODUCT NAME</Text>
                  </Group>
                );
              }

              return (
                <Group wrap="nowrap" gap="xl" py={2} style={{ flex: 1 }}>
                  <Text fz={12} fw={600} c="brand.7" miw={60} style={{ fontFamily: "var(--mantine-font-family-monospace)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {option.value}
                  </Text>
                  <Text size="sm" fw={500} c="slate.8">
                    {option.label}
                  </Text>
                </Group>
              );
            }}
          />

          <Textarea
            w="100%"
            radius="md"
            label="Description"
            rows={3}
            placeholder="What is this rule set checking for?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <Group justify="flex-end" gap={8} w="100%">
            <Button variant="default" radius="xl" onClick={onClose}>Cancel</Button>
            <Button
              color="brand"
              radius="xl"
              disabled={!name.trim() || !product}
              onClick={() => onCreate({ name, product: product as string, desc, effectiveDate })}
            >
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
  onBack,
  onReload,
  toast,
}: {
  ruleSet: RuleSet;
  setRuleSet: (rs: RuleSet) => void;
  onBack: () => void;
  onReload: (id: string) => Promise<void>;
  toast: (m: string) => void;
}) {
  const theme = useMantineTheme();
  const [tab, setTab] = useState<string>("builder");
  const [activating, setActivating] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);

  const v = computeValidation(ruleSet);

  const [saving, setSaving] = useState(false);

  const handleSaveDraft = async () => {
    if (!ruleSet.id) {
      showError("Load Failed", { message: "Rule set ID missing hai" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildGroupsPayload(ruleSet);
      console.log("update ->", ruleSet.id, payload);
      const res = await update(ruleSet.id, payload);
      console.log("update response:", res);
      showSuccess("Draft Saved", "Draft saved successfully!");
      const saved = unwrap(res);
      const nextId = typeof saved?.name === "string" ? saved.name : ruleSet.id;
      await onReload(nextId);
    } catch (err: any) {
      console.error("update failed:", err?.response ?? err);
      showError("Save Failed", err);
    } finally {
      setSaving(false);
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

  const doActivate = async () => {
    setActivating(true);
    try {
      const saveRes = await update(ruleSet.id, buildGroupsPayload(ruleSet));
      const saved = unwrap(saveRes);
      const idToActivate = typeof saved?.name === "string" ? saved.name : ruleSet.id;

      await setStatus(idToActivate, "Active");
      setShowActivateConfirm(false);
      showSuccess("Rule Set Activated", "Rule set activated successfully.");
      await onReload(idToActivate);
    } catch (err: any) {
      console.error("setStatus failed:", err?.response ?? err);
      showError("Activation Failed", err);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div>
      {/* header */}
      <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-white)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ margin: "0 auto", padding: "16px 32px 0" }}>
          <Button variant="subtle" color="slate" size="xs" pl={0} mb={10} leftSection={<IconChevronLeft size={14} />} onClick={onBack}>Rule Sets</Button>

          <Group justify="space-between" align="flex-start" mb={16}>
            <Group gap="sm" align="flex-start">
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
              <div>
                <Group gap={10} mb={4}>
                  <Title order={2} c="slate.8" fw={700} fz={20}>{ruleSet.name}</Title>
                  <StatusBadge status={ruleSet.status} />
                  <Text fz={12.5} c="slate.5" fw={600}>v{ruleSet.version}</Text>
                </Group>
                <Text fz={13.5} c="slate.5" m={0} maw={620}>{ruleSet.description}</Text>
              </div>
            </Group>
            <Group gap={8} style={{ flexShrink: 0 }}>
              <Button variant="default" radius="xl" loading={saving} onClick={handleSaveDraft}>Save Draft</Button>
              <Button
                radius="xl"
                leftSection={<IconDeviceDesktopCog size={14} />}
                disabled={!v.ok}
                style={{ background: v.ok ? (theme.other?.brandGradient || "var(--mantine-color-brand-6)") : undefined }}
                onClick={() => setShowActivateConfirm(true)}
              >
                Activate Rule Set
              </Button>
            </Group>
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
        {tab === "test" && <TestTab ruleSet={ruleSet} />}
        {tab === "versions" && <VersionsTab ruleSet={ruleSet} />}
        {tab === "audit" && <AuditTab ruleSet={ruleSet} />}
      </div>

      {showActivateConfirm && (
        <Modal opened onClose={() => !activating && setShowActivateConfirm(false)} title="Activate Rule Set" radius="lg" centered size="md">
          <Text fz={13} c="slate.6" mb={18} mt={8}>This publishes a new version and applies it to new applications immediately.</Text>
          <div style={{ fontSize: 13.5, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mantine-color-slate-2)" }}><span style={{ color: "var(--mantine-color-slate-6)" }}>Current version</span><span style={{ fontWeight: 600 }}>v{ruleSet.version}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mantine-color-slate-2)" }}><span style={{ color: "var(--mantine-color-slate-6)" }}>New version</span><span style={{ fontWeight: 600 }}>v{(parseFloat(String(ruleSet.version)) + 0.1).toFixed(1)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mantine-color-slate-2)", borderBottom: "1px solid var(--mantine-color-slate-2)" }}><span style={{ color: "var(--mantine-color-slate-6)" }}>Effective from</span><span style={{ fontWeight: 600 }}>Immediately</span></div>
          </div>
          <Group justify="flex-end" gap={8}>
            <Button variant="default" radius="xl" disabled={activating} onClick={() => setShowActivateConfirm(false)}>Cancel</Button>
            <Button color="brand" radius="xl" disabled={activating} onClick={doActivate}>{activating ? "Activating…" : "Confirm & Activate"}</Button>
          </Group>
        </Modal>
      )}
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
        console.log("prescreening_fields payload:", payload);
        const cfg = Array.isArray(payload) ? { fields: payload } : payload;
        if (!cfg || !Array.isArray(cfg.fields) || cfg.fields.length === 0) {
          throw new Error("get_prescreening_fields returned no fields.");
        }
        setPrescreeningConfig(cfg);
      })
      .catch((e) => {
        console.error("Error loading pre-screening config", e);
        setConfigError(e);
      })
      .finally(() => setFieldsLoaded(true));
  }, []);

  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 2600);
  };

  const openRuleSet = async (id: string) => {
    try {
      const response = await getById(id);
      console.log("getById response:", response);

      const item = unwrap(response);
      if (!item || typeof item !== "object") {
        showError("Load Failed", { message: "Rule set data nahi mila" });
        return;
      }

      setRuleSet({
        id: item.name ?? id,
        name: item.ruleset_name,
        product: item.loan_product,
        description: item.description ?? "",
        status: item.status,
        version: String(item.version ?? "1.0"),
        effectiveFrom: item.effective_from,
        modifiedDate: item.modified,
        modifiedBy: item.modified_by,
        groups: Array.isArray(item.groups)
          ? item.groups.map((g: any) => ({
              ...g,
              rules: Array.isArray(g.rules) ? g.rules.map(mapRuleFromApi) : [],
            }))
          : [],
        versions: Array.isArray(item.versions) ? item.versions : [],
        audit: Array.isArray(item.audit) ? item.audit : [],
      } as RuleSet);
      setScreen("detail");
    } catch (e: any) {
      console.error("getById failed:", e?.response ?? e);
      showError("Load Failed", e);
    }
  };

  const handleCreate = async ({ name, product, desc, effectiveDate }: { name: string; product: string; desc: string; effectiveDate: string | null }) => {
    try {
      const payload = {
        ruleset_name: name || "Untitled Rule Set",
        loan_product: product,
        description: desc || "Newly created rule set.",
        effective_from: effectiveDate ? new Date(effectiveDate).toISOString().split("T")[0] : undefined,
        groups: [],
      };
      const res = await create(payload);
      console.log("create response:", res);

      const created = unwrap(res);
      const newId = created?.name ?? created?.id;

      setShowCreate(false);
      setRefreshKey((k) => k + 1);

      if (newId) {
        showSuccess("Rule Set Created", "Rule set created successfully!");
        await openRuleSet(newId);
      } else {
        showSuccess("Rule Set Created", "Rule set created successfully, but ID was missing.");
      }
    } catch (err: any) {
      showError("Creation Failed", err);
      console.error(err);
    }
  };

  if (!fieldsLoaded) return null;
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
          showEmpty={showEmpty}
          setShowEmpty={setShowEmpty}
          refreshKey={refreshKey}
        />
      )}
      {screen === "detail" && ruleSet && (
        <RuleSetDetail
          ruleSet={ruleSet}
          setRuleSet={setRuleSet}
          onBack={() => {
            setScreen("list");
            setRefreshKey((k) => k + 1);
          }}
          onReload={openRuleSet}
          toast={toast}
        />
      )}
      {showCreate && <CreateRuleSetModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      <Toast message={toastMsg} />
    </div>
  );
}