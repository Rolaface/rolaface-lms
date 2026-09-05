import { useState } from "react";
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
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import {
  seedRuleSet,
  OTHER_RULE_SETS,
  computeValidation,
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

function RuleSetList({
  ruleSet,
  onOpen,
  onCreate,
  showEmpty,
  setShowEmpty,
}: {
  ruleSet: RuleSet;
  onOpen: (id: string) => void;
  onCreate: () => void;
  showEmpty: boolean;
  setShowEmpty: (v: boolean) => void;
}) {
  const theme = useMantineTheme();
  const rows: RuleSetSummary[] = showEmpty
    ? []
    : [
        { id: ruleSet.id, name: ruleSet.name, product: ruleSet.product, status: ruleSet.status, version: ruleSet.version, rulesCount: ruleSet.groups.reduce((a, g) => a + g.rules.length, 0), modifiedDate: ruleSet.modifiedDate, modifiedBy: ruleSet.modifiedBy },
        ...OTHER_RULE_SETS,
      ];

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
            <IconShieldCheck size={20} color="var(--mantine-color-white)" stroke={1.8} />
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

      {rows.length === 0 ? (
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
          <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <Table.Thead>
              <Table.Tr>
                {["Rule Set", "Product", "Rules", "Version", "Last modified", ""].map((h) => (
                  <Table.Th key={h} c="slate.5" fw={700} style={{ fontSize: "var(--mantine-font-size-xs)", padding: "0 10px 6px", textTransform: "uppercase", letterSpacing: "0.04em", border: "none" }}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id} onClick={() => onOpen(r.id)} style={{ cursor: "pointer" }}>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)", borderLeft: "3px solid var(--mantine-color-brand-4)", borderTopLeftRadius: "var(--mantine-radius-md)", borderBottomLeftRadius: "var(--mantine-radius-md)" }}>
                    <Text fz="sm" fw={600} c="slate.8">{r.name}</Text>
                    <Box mt={4}><StatusBadge status={r.status} /></Box>
                  </Table.Td>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)" }}><Text fz="xs" c="slate.6">{r.product}</Text></Table.Td>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)" }}><Text fz="xs" c="slate.6">{r.rulesCount}</Text></Table.Td>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)" }}><Text fz="xs" c="slate.6">v{r.version}</Text></Table.Td>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)" }}><Text fz="xs" c="slate.6">{r.modifiedDate} · {r.modifiedBy}</Text></Table.Td>
                  <Table.Td style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", background: "var(--mantine-color-white)", borderTopRightRadius: "var(--mantine-radius-md)", borderBottomRightRadius: "var(--mantine-radius-md)", textAlign: "right", color: "var(--mantine-color-slate-4)" }}>
                    <IconChevronRight size={14} />
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
  const [product, setProduct] = useState<string | null>("Personal Loan");
  const [desc, setDesc] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);

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
            <IconShieldCheck size={32} stroke={1.8} />
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
            data={[
              "Personal Loan",
              "Business Loan",
              "Salary Advance",
              "Education Loan",
              "Home Improvement Loan",
            ]}
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
              disabled={!name.trim()}
              onClick={() => onCreate({ name, product: product || "Personal Loan", desc, effectiveDate })}
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
  toast,
}: {
  ruleSet: RuleSet;
  setRuleSet: (rs: RuleSet) => void;
  onBack: () => void;
  toast: (m: string) => void;
}) {
  const theme = useMantineTheme();
  const [tab, setTab] = useState<string>("builder");
  const [activating, setActivating] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);

  const v = computeValidation(ruleSet);
  const rulesCount = v.rulesCount;

  const addGroup = () => {
    const id = "g" + Date.now();
    setRuleSet({ ...ruleSet, groups: [...ruleSet.groups, { id, name: "New Rule Group", logic: "ALL", rules: [] }] });
  };
  const renameGroup = (gid: string, name: string) => setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id === gid ? { ...g, name } : g)) });
  const setLogic = (gid: string, logic: "ALL" | "ANY") => setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id === gid ? { ...g, logic } : g)) });
  const deleteGroup = (gid: string) => setRuleSet({ ...ruleSet, groups: ruleSet.groups.filter((g) => g.id !== gid) });

  const toggleRule = (gid: string, rid: string) =>
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id !== gid ? g : { ...g, rules: g.rules.map((r) => (r.id === rid ? { ...r, disabled: !r.disabled } : r)) })) });
  const duplicateRule = (gid: string, rule: Rule) =>
    setRuleSet({ ...ruleSet, groups: ruleSet.groups.map((g) => (g.id !== gid ? g : { ...g, rules: [...g.rules, { ...rule, id: "r" + Date.now() }] })) });

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

  const doActivate = () => {
    setActivating(true);
    setTimeout(() => {
      setActivating(false);
      setShowActivateConfirm(false);
      const nextVersion = (parseFloat(ruleSet.version) + 0.1).toFixed(1);
      setRuleSet({
        ...ruleSet,
        status: "Active",
        version: nextVersion,
        versions: [...ruleSet.versions.map((x) => (x.status === "Active" ? { ...x, status: "Archived" } : x)), { version: nextVersion, status: "Active", effective: "2026-09-04 – present", by: "You", note: "Activated from the Builder tab." }],
        audit: [{ date: "2026-09-04 12:00", user: "You", action: `Published version ${nextVersion}`, detail: "Rule set activated." }, ...ruleSet.audit],
      });
      toast(`Rule set activated as v${nextVersion}`);
    }, 900);
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
                <IconShieldCheck size={20} color="var(--mantine-color-white)" stroke={1.8} />
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
              <Button variant="default" radius="xl" onClick={() => toast("Draft saved")}>Save Draft</Button>
              <Button
                radius="xl"
                leftSection={<IconShieldCheck size={14} />}
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
            onDeleteGroup={deleteGroup}
            onToggleRule={toggleRule}
            onDuplicateRule={duplicateRule}
            onSaveRule={saveRule}
            onDeleteRule={deleteRule}
            onActivateClick={() => setShowActivateConfirm(true)}
          />
        )}
        {tab === "test" && <TestTab ruleSet={ruleSet} />}
        {tab === "versions" && <VersionsTab ruleSet={ruleSet} />}
        {tab === "audit" && <AuditTab ruleSet={ruleSet} />}
      </div>

      {showActivateConfirm && (
        <Modal opened onClose={() => !activating && setShowActivateConfirm(false)} title="Activate Rule Set" radius="lg" centered size="md">
          <Text fz={13} c="slate.6" mb={18} mt={-8}>This publishes a new version and applies it to new applications immediately.</Text>
          <div style={{ fontSize: 13.5, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mantine-color-slate-2)" }}><span style={{ color: "var(--mantine-color-slate-6)" }}>Current version</span><span style={{ fontWeight: 600 }}>v{ruleSet.version}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--mantine-color-slate-2)" }}><span style={{ color: "var(--mantine-color-slate-6)" }}>New version</span><span style={{ fontWeight: 600 }}>v{(parseFloat(ruleSet.version) + 0.1).toFixed(1)}</span></div>
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
  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [ruleSet, setRuleSet] = useState<RuleSet>(seedRuleSet());
  const [showEmpty, setShowEmpty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 2600);
  };

const handleCreate = ({ name, product, desc, effectiveDate }: { name: string; product: string; desc: string; effectiveDate: string | null }) => {
  setRuleSet({
    ...seedRuleSet(),
    id: "rs-new",
    name: name || "Untitled Rule Set",
    product,
    description: desc || "Newly created rule set.",
    status: "Draft",
    version: "0.1",
    effectiveFrom: effectiveDate || "",
    groups: [],
    versions: [],
    audit: [{ date: "2026-09-04 12:00", user: "You", action: "Created rule set", detail: "Draft created." }],
  });
  setShowCreate(false);
  setScreen("detail");
};

  return (
    <div>
      {screen === "list" && (
        <RuleSetList ruleSet={ruleSet} onOpen={() => setScreen("detail")} onCreate={() => setShowCreate(true)} showEmpty={showEmpty} setShowEmpty={setShowEmpty} />
      )}
      {screen === "detail" && <RuleSetDetail ruleSet={ruleSet} setRuleSet={setRuleSet} onBack={() => setScreen("list")} toast={toast} />}
      {showCreate && <CreateRuleSetModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      <Toast message={toastMsg} />
    </div>
  );
}