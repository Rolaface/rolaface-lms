import { useEffect, useRef, useState } from "react";
import {
  Button,
  TextInput,
  Paper,
  Box,
  Group,
  Stack,
  Text,
  Title,
  Divider,
  Drawer,
  Select,
  SegmentedControl,
  Chip,
  Pill,
  PillsInput,
  NavLink,
  Input,
  Grid,
} from "@mantine/core";
import {
  IconPlus,
  IconChevronDown,
  IconSearch,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";
import {
  FIELDS,
  CATEGORY_ORDER,
  OPERATORS,
  SEVERITIES,
  ACTIONS,
  fieldById,
  ruleSentence,
  ruleIsComplete,
  computeValidation,
  type Rule,
  type RuleGroup,
  type RuleSet,
  type Severity,
} from "./types";
import { SeverityBadge, ValidationLine } from "./shared";

/* ============================================================
   FIELD PICKER
   ============================================================ */
function FieldPicker({ value, onSelect }: { value: string | null; onSelect: (fid: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const field = fieldById(value);
  const filtered = FIELDS.filter((f) => f.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <Box ref={ref} pos="relative">
      <Button
        fullWidth
        variant="default"
        rightSection={<IconChevronDown size={14} color="var(--mantine-color-slate-4)" />}
        onClick={() => setOpen(!open)}
        styles={{
          inner: { justifyContent: "space-between", width: "100%" },
          label: { fontWeight: field ? 600 : 400, color: field ? "var(--mantine-color-slate-8)" : "var(--mantine-color-slate-4)" },
        }}
      >
        {field ? field.label : "Search criteria…"}
      </Button>
      {open && (
        <Paper
          withBorder
          shadow="md"
          radius="md"
          pos="absolute"
          top="calc(100% + 6px)"
          left={0}
          right={0}
          style={{ zIndex: 40, maxHeight: 320, overflow: "auto" }}
        >
          <Box p="sm" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", position: "sticky", top: 0, background: "var(--mantine-color-white)", zIndex: 1 }}>
            <TextInput
              autoFocus
              leftSection={<IconSearch size={14} />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search criteria…"
            />
          </Box>
          {CATEGORY_ORDER.map((cat) => {
            const items = filtered.filter((f) => f.category === cat);
            if (!items.length) return null;
            return (
              <Box key={cat} py="xs">
                <Text fz={10.5} fw={700} c="dimmed" tt="uppercase" px="sm" py={4} style={{ letterSpacing: ".04em" }}>
                  {cat}
                </Text>
                {items.map((f) => (
                  <NavLink
                    key={f.id}
                    label={f.label}
                    onClick={() => { onSelect(f.id); setOpen(false); setQ(""); }}
                    styles={{ label: { fontSize: 13.5 }, root: { borderRadius: "var(--mantine-radius-sm)" } }}
                  />
                ))}
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Text p="md" fz="sm" c="dimmed">No matching criteria.</Text>
          )}
        </Paper>
      )}
    </Box>
  );
}

/* ============================================================
   CHIP INPUT (free-text multi value)
   ============================================================ */
function ChipInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  return (
    <PillsInput>
      <Pill.Group>
        {values.map((v) => (
          <Pill key={v} withRemoveButton onRemove={() => onChange(values.filter((x) => x !== v))}>
            {v}
          </Pill>
        ))}
        <PillsInput.Field
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onChange([...values, text.trim()]); setText(""); } }}
        />
      </Pill.Group>
    </PillsInput>
  );
}

/* ============================================================
   VALUE EDITOR
   ============================================================ */
function ValueEditor({ field, rule, setRule }: { field: ReturnType<typeof fieldById>; rule: Rule; setRule: (r: Rule) => void }) {
  if (!field) return null;

  if (field.type === "numeric") {
    if (rule.operator === "between") {
      return (
        <Group gap="sm" align="center" wrap="nowrap">
          <Input component="input" type="number" placeholder="From" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Text c="dimmed" fz="sm">and</Text>
          <Input component="input" type="number" placeholder="To" value={rule.value2 ?? ""} onChange={(e: any) => setRule({ ...rule, value2: e.target.value })} style={{ flex: 1 }} />
          {field.unit && <Text c="dimmed" fz="sm" style={{ whiteSpace: "nowrap" }}>{field.unit}</Text>}
        </Group>
      );
    }
    return (
      <Group gap="sm" align="center" wrap="nowrap">
        <Input component="input" type="number" placeholder="Value" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
        {field.unit && <Text c="dimmed" fz="sm" style={{ whiteSpace: "nowrap" }}>{field.unit}</Text>}
      </Group>
    );
  }
  if (field.type === "text") {
    if (rule.operator === "oneOf") return <ChipInput values={rule.values || []} onChange={(vals) => setRule({ ...rule, values: vals })} placeholder="Type a value and press Enter" />;
    return <Input component="input" placeholder="Value" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} />;
  }
  if (field.type === "dropdown") {
    if (rule.operator === "isOneOf" || rule.operator === "isNotOneOf") {
      return (
        <Chip.Group multiple value={rule.values || []} onChange={(vals) => setRule({ ...rule, values: vals })}>
          <Group gap="xs">
            {field.options!.map((o) => (
              <Chip key={o} value={o} variant="light" color="brand" radius="sm">
                {o}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      );
    }
    return (
      <Select
        placeholder="Select a value…"
        data={field.options!}
        value={rule.value ?? null}
        onChange={(val) => setRule({ ...rule, value: val ?? undefined })}
      />
    );
  }
  if (field.type === "boolean") {
    return (
      <SegmentedControl
        fullWidth
        color="brand"
        value={rule.value === true ? "yes" : rule.value === false ? "no" : ""}
        onChange={(val) => setRule({ ...rule, value: val === "yes" })}
        data={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
      />
    );
  }
  if (field.type === "date") {
    if (rule.operator === "relative") {
      return (
        <Group gap="sm" wrap="nowrap">
          <Input component="input" type="number" placeholder="Number" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Select
            data={[
              { value: "days", label: "days ago" },
              { value: "months", label: "months ago" },
              { value: "years", label: "years ago" },
            ]}
            value={rule.dateUnit || "months"}
            onChange={(val) => setRule({ ...rule, dateUnit: val ?? "months" })}
            style={{ flex: 1 }}
          />
        </Group>
      );
    }
    if (rule.operator === "between") {
      return (
        <Group gap="sm" align="center" wrap="nowrap">
          <Input component="input" type="date" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Text c="dimmed" fz="sm">and</Text>
          <Input component="input" type="date" value={rule.value2 ?? ""} onChange={(e: any) => setRule({ ...rule, value2: e.target.value })} style={{ flex: 1 }} />
        </Group>
      );
    }
    return <Input component="input" type="date" value={rule.value ?? ""} onChange={(e: any) => setRule({ ...rule, value: e.target.value })} />;
  }
  return null;
}

/* ============================================================
   RULE DRAWER (add / edit)
   ============================================================ */
function RuleDrawer({
  initial,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: { groupId: string; rule: Rule | null };
  onCancel: () => void;
  onSave: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
}) {
  const [rule, setRule] = useState<Rule>(initial.rule || { id: "r" + Date.now(), fieldId: null, severity: "Blocking" });
  const field = fieldById(rule.fieldId);
  const operators = field ? OPERATORS[field.type] : [];

  const chooseField = (fid: string) => {
    const f = fieldById(fid)!;
    setRule({ id: rule.id, fieldId: fid, operator: OPERATORS[f.type][0].id, severity: rule.severity || "Blocking", action: rule.action, value: undefined, values: undefined, value2: undefined });
  };
  const changeOperator = (opId: string) => setRule({ ...rule, operator: opId, value: undefined, values: undefined, value2: undefined });
  const changeSeverity = (sev: Severity) => setRule({ ...rule, severity: sev, action: rule.actionTouched ? rule.action : SEVERITIES[sev].defaultAction });

  const complete = !!field && !!rule.operator && ruleIsComplete(rule);

  return (
    <Drawer
      opened
      onClose={onCancel}
      position="right"
      size="460px"
      padding="lg"
      radius="md"
      title={initial.rule ? "Edit Rule" : "Add Rule"}
      overlayProps={{ opacity: 0.4 }}
      styles={{ title: { fontSize: 18, fontWeight: 700 } }}
    >
      <Stack gap="md">
        <Box>
          <Text fz="sm" fw={600} mb={6}>Criterion</Text>
          <FieldPicker value={rule.fieldId} onSelect={chooseField} />
        </Box>

        {field && (
          <>
            <Select
              label="Condition"
              data={operators.map((o) => ({ value: o.id, label: o.label }))}
              value={rule.operator}
              onChange={(val) => val && changeOperator(val)}
            />

            <Box>
              <Text fz="sm" fw={600} mb={6}>Value</Text>
              <ValueEditor field={field} rule={rule} setRule={setRule} />
            </Box>

            <Box>
              <Text fz="sm" fw={600} mb={6}>If this condition is not met</Text>
              <Group grow gap="xs" mb={6}>
                {(Object.keys(SEVERITIES) as Severity[]).map((sev) => (
                  <Button
                    key={sev}
                    size="xs"
                    variant={rule.severity === sev ? "light" : "default"}
                    styles={{
                      root: {
                        borderColor: rule.severity === sev ? SEVERITIES[sev].color : "var(--mantine-color-slate-3)",
                        background: rule.severity === sev ? SEVERITIES[sev].wash : "var(--mantine-color-white)",
                        color: rule.severity === sev ? SEVERITIES[sev].color : "var(--mantine-color-slate-6)",
                      },
                    }}
                    onClick={() => changeSeverity(sev)}
                  >
                    {sev}
                  </Button>
                ))}
              </Group>
              <Text fz={12.5} c="dimmed">{SEVERITIES[rule.severity]?.desc}</Text>
            </Box>

            <Select
              label="Outcome"
              data={ACTIONS}
              value={rule.action || SEVERITIES[rule.severity].defaultAction}
              onChange={(val) => val && setRule({ ...rule, action: val, actionTouched: true })}
            />

            <Paper withBorder radius="md" p="md" style={{ background: "var(--mantine-color-brand-0)" }}>
              <Text fz={10.5} fw={700} c="brand.7" tt="uppercase" mb={6} style={{ letterSpacing: ".04em" }}>
                Rule Preview
              </Text>
              <Text fz={15.5} style={{ lineHeight: 1.5 }}>
                If <Text span fw={700}>{ruleSentence(rule)}</Text> is not true → <Text span fw={700}>{rule.action || SEVERITIES[rule.severity].defaultAction}</Text>
              </Text>
            </Paper>
          </>
        )}
      </Stack>

      <Divider my="lg" />

      <Group justify="space-between">
        {initial.rule ? (
          <Button variant="subtle" color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(rule.id)}>Remove Rule</Button>
        ) : <span />}
        <Group gap="sm">
          <Button variant="default" onClick={onCancel}>Cancel</Button>
          <Button color="brand" disabled={!complete} onClick={() => onSave(rule)}>Save Rule</Button>
        </Group>
      </Group>
    </Drawer>
  );
}

/* ============================================================
   RULE ROW
   ============================================================ */
function RuleRow({ rule, onEdit, onToggle, onDuplicate }: { rule: Rule; onEdit: (r: Rule) => void; onToggle: (id: string) => void; onDuplicate: (r: Rule) => void }) {
  const disabled = rule.disabled;
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      mb="sm"
      style={{ background: disabled ? "var(--mantine-color-slate-0)" : "var(--mantine-color-white)", opacity: disabled ? 0.6 : 1 }}
    >
      <Group wrap="nowrap" gap="sm" align="center">
        <IconGripVertical size={14} color="var(--mantine-color-slate-4)" style={{ cursor: "grab", flexShrink: 0 }} />
        <Box style={{ flex: 1, cursor: "pointer" }} onClick={() => onEdit(rule)}>
          <Text fz={14.5} fw={500} c="slate.8">{ruleSentence(rule)}</Text>
          <Text fz={12} c="dimmed" mt={3}>If not met → {rule.action || SEVERITIES[rule.severity].defaultAction}</Text>
        </Box>
        <SeverityBadge severity={rule.severity} />
        <Group gap={4} wrap="nowrap">
          <Button size="xs" variant="subtle" color="gray" onClick={() => onToggle(rule.id)}>{disabled ? "Enable" : "Disable"}</Button>
          <Button size="xs" variant="subtle" color="gray" onClick={() => onDuplicate(rule)}>Duplicate</Button>
          <Button size="xs" variant="subtle" color="gray" onClick={() => onEdit(rule)}>Edit</Button>
        </Group>
      </Group>
    </Paper>
  );
}

/* ============================================================
   GROUP CARD
   ============================================================ */
function GroupCard({
  group,
  onEditRule,
  onAddRule,
  onToggleRule,
  onDuplicateRule,
  onDeleteGroup,
  onRenameGroup,
  onSetLogic,
}: {
  group: RuleGroup;
  onEditRule: (gid: string, rule: Rule) => void;
  onAddRule: (gid: string) => void;
  onToggleRule: (gid: string, rid: string) => void;
  onDuplicateRule: (gid: string, rule: Rule) => void;
  onDeleteGroup: (gid: string) => void;
  onRenameGroup: (gid: string, name: string) => void;
  onSetLogic: (gid: string, logic: "ALL" | "ANY") => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);

  return (
    <Paper withBorder radius="lg" shadow="xs" p="lg" mb="lg" style={{ background: "var(--mantine-color-white)" }}>
      <Group justify="space-between" align="center" mb="md">
        {editingName ? (
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onBlur={() => { onRenameGroup(group.id, name); setEditingName(false); }}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            w={260}
          />
        ) : (
          <Title order={4} fz={17} c="slate.8" style={{ cursor: "text" }} onClick={() => setEditingName(true)}>
            {group.name}
          </Title>
        )}
        <Button size="xs" variant="subtle" color="red" leftSection={<IconTrash size={13} />} onClick={() => onDeleteGroup(group.id)}>Remove Group</Button>
      </Group>

      <Group gap="sm" align="center" mb="md">
        <Text fz={13} c="dimmed">Applicant must meet</Text>
        <SegmentedControl
          value={group.logic}
          onChange={(val) => onSetLogic(group.id, val as "ALL" | "ANY")}
          color="brand"
          data={[
            { label: "ALL of the following", value: "ALL" },
            { label: "ANY of the following", value: "ANY" },
          ]}
        />
      </Group>

      {group.rules.length === 0 ? (
        <Paper
          radius="md"
          p="lg"
          mb="sm"
          style={{ border: "1px dashed var(--mantine-color-slate-3)", textAlign: "center", background: "transparent" }}
        >
          <Text fz={13} c="dimmed">No rules in this group yet.</Text>
        </Paper>
      ) : (
        group.rules.map((r) => (
          <RuleRow key={r.id} rule={r} onEdit={(rule) => onEditRule(group.id, rule)} onToggle={(id) => onToggleRule(group.id, id)} onDuplicate={(rule) => onDuplicateRule(group.id, rule)} />
        ))
      )}

      <Button size="xs" variant="light" color="brand" leftSection={<IconPlus size={13} />} onClick={() => onAddRule(group.id)}>Add Rule</Button>
    </Paper>
  );
}

/* ============================================================
   BUILDER TAB (exported)
   ============================================================ */
export interface BuilderTabProps {
  ruleSet: RuleSet;
  onAddGroup: () => void;
  onRenameGroup: (gid: string, name: string) => void;
  onSetLogic: (gid: string, logic: "ALL" | "ANY") => void;
  onDeleteGroup: (gid: string) => void;
  onToggleRule: (gid: string, rid: string) => void;
  onDuplicateRule: (gid: string, rule: Rule) => void;
  onSaveRule: (groupId: string, rule: Rule, isNew: boolean) => void;
  onDeleteRule: (groupId: string, ruleId: string) => void;
  onActivateClick: () => void;
}

export default function BuilderTab({
  ruleSet,
  onAddGroup,
  onRenameGroup,
  onSetLogic,
  onDeleteGroup,
  onToggleRule,
  onDuplicateRule,
  onSaveRule,
  onDeleteRule,
  onActivateClick,
}: BuilderTabProps) {
  const [drawer, setDrawer] = useState<{ groupId: string; rule: Rule | null } | null>(null);
  const v = computeValidation(ruleSet);

  const saveRule = (rule: Rule) => {
    if (!drawer) return;
    onSaveRule(drawer.groupId, rule, !drawer.rule);
    setDrawer(null);
  };
  const deleteRule = (rid: string) => {
    if (!drawer) return;
    onDeleteRule(drawer.groupId, rid);
    setDrawer(null);
  };

  return (
    <>
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          {ruleSet.groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onEditRule={(gid, rule) => setDrawer({ groupId: gid, rule })}
              onAddRule={(gid) => setDrawer({ groupId: gid, rule: null })}
              onToggleRule={onToggleRule}
              onDuplicateRule={onDuplicateRule}
              onDeleteGroup={onDeleteGroup}
              onRenameGroup={onRenameGroup}
              onSetLogic={onSetLogic}
            />
          ))}
          <Button variant="default" leftSection={<IconPlus size={14} />} onClick={onAddGroup}>Add Rule Group</Button>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Box style={{ position: "sticky", top: 130 }}>
            <Paper withBorder radius="lg" shadow="xs" p="lg" mb="md">
              <Text fz={11} fw={700} c="dimmed" tt="uppercase" mb="sm" style={{ letterSpacing: ".04em" }}>
                Rule Set Details
              </Text>
              <Stack gap={0}>
                {([
                  ["Loan Product", ruleSet.product],
                  ["Effective From", ruleSet.effectiveFrom],
                  ["Created By", ruleSet.createdBy],
                  ["Last Modified", `${ruleSet.modifiedDate} · ${ruleSet.modifiedBy}`],
                ] as const).map(([k, val], i) => (
                  <Box key={k}>
                    {i > 0 && <Divider />}
                    <Group justify="space-between" py={6}>
                      <Text fz={12.5} c="dimmed">{k}</Text>
                      <Text fz={12.5} fw={600} ta="right">{val}</Text>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" shadow="xs" p="lg">
              <Text fz={11} fw={700} c="dimmed" tt="uppercase" mb="sm" style={{ letterSpacing: ".04em" }}>
                Before you activate
              </Text>
              <Stack gap="xs">
                <ValidationLine ok={v.issues.length === 0} text={v.issues.length === 0 ? "Conditions complete" : `${v.issues.length} incomplete`} />
                <ValidationLine ok={v.warnings.length === 0} text={v.warnings.length === 0 ? "No conflicts" : `${v.warnings.length} possible conflict`} warnOnly />
              </Stack>
              <Button size="xs" variant="light" color="brand" fullWidth mt={12} disabled={!v.ok} onClick={onActivateClick}>
                Activate Rule Set
              </Button>
            </Paper>
          </Box>
        </Grid.Col>
      </Grid>

      {drawer && <RuleDrawer initial={drawer} onCancel={() => setDrawer(null)} onSave={saveRule} onDelete={deleteRule} />}
    </>
  );
}