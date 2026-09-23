import { useEffect, useRef, useState, type ChangeEvent } from "react";
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
  Select,
  SegmentedControl,
  Chip,
  Pill,
  PillsInput,
  NavLink,
  Input,
  Grid,
  SimpleGrid,
  ActionIcon,
  Modal,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconChevronDown,
  IconSearch,
  IconGripVertical,
  IconTrash,
  IconCopy,
  IconPencil,
  IconInfoCircle,
  IconSparkles,
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

const makeEmptyRule = (): Rule => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  fieldId: null,
  severity: "Blocking",
});

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
        size="xs"
        variant="default"
        rightSection={<IconChevronDown size={13} color="var(--mantine-color-slate-4)" />}
        onClick={() => setOpen(!open)}
        styles={{
          root: { height: 30, minHeight: 30, paddingLeft: 10, paddingRight: 8 },
          inner: { justifyContent: "space-between", width: "100%" },
          label: { fontSize: 12.5, fontWeight: field ? 600 : 400, color: field ? "var(--mantine-color-slate-8)" : "var(--mantine-color-slate-4)" },
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
          <Box p={8} style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", position: "sticky", top: 0, background: "var(--mantine-color-white)", zIndex: 1 }}>
            <TextInput
              autoFocus
              size="xs"
              leftSection={<IconSearch size={13} />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search criteria…"
            />
          </Box>
          {CATEGORY_ORDER.map((cat) => {
            const items = filtered.filter((f) => f.category === cat);
            if (!items.length) return null;
            return (
              <Box key={cat} py={4}>
                <Text fz={10} fw={700} c="dimmed" tt="uppercase" px={8} py={2} style={{ letterSpacing: ".04em" }}>
                  {cat}
                </Text>
                {items.map((f) => (
                  <NavLink
                    key={f.id}
                    label={f.label}
                    onClick={() => { onSelect(f.id); setOpen(false); setQ(""); }}
                    styles={{ label: { fontSize: 12.5 }, root: { borderRadius: "var(--mantine-radius-sm)", padding: "5px 8px" } }}
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
    <PillsInput size="xs">
      <Pill.Group>
        {values.map((v) => (
          <Pill key={v} size="xs" withRemoveButton onRemove={() => onChange(values.filter((x) => x !== v))}>
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
          <Input size="xs" component="input" type="number" placeholder="From" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Text c="dimmed" fz={11.5}>and</Text>
          <Input size="xs" component="input" type="number" placeholder="To" value={rule.value2 ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value2: e.target.value })} style={{ flex: 1 }} />
          {field.unit && <Text c="dimmed" fz={11.5} style={{ whiteSpace: "nowrap" }}>{field.unit}</Text>}
        </Group>
      );
    }
    return (
      <Group gap="sm" align="center" wrap="nowrap">
        <Input size="xs" component="input" type="number" placeholder="Value" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
        {field.unit && <Text c="dimmed" fz={11.5} style={{ whiteSpace: "nowrap" }}>{field.unit}</Text>}
      </Group>
    );
  }
  if (field.type === "text") {
    if (rule.operator === "oneOf") return <ChipInput values={rule.values || []} onChange={(vals) => setRule({ ...rule, values: vals })} placeholder="Type a value and press Enter" />;
    return <Input size="xs" component="input" placeholder="Value" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} />;
  }
  if (field.type === "dropdown") {
    if (rule.operator === "isOneOf" || rule.operator === "isNotOneOf") {
      return (
        <Chip.Group multiple value={rule.values || []} onChange={(vals) => setRule({ ...rule, values: vals })}>
          <Group gap="xs">
            {field.options!.map((o) => (
              <Chip key={o} size="xs" value={o} variant="light" color="brand" radius="sm">
                {o}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      );
    }
    return (
      <Select
        size="xs"
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
        size="xs"
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
          <Input size="xs" component="input" type="number" placeholder="Number" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Select
            size="xs"
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
          <Input size="xs" component="input" type="date" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} style={{ flex: 1 }} />
          <Text c="dimmed" fz={11.5}>and</Text>
          <Input size="xs" component="input" type="date" value={rule.value2 ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value2: e.target.value })} style={{ flex: 1 }} />
        </Group>
      );
    }
    return <Input size="xs" component="input" type="date" value={rule.value ?? ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setRule({ ...rule, value: e.target.value })} />;
  }
  return null;
}

/* ============================================================
   RULE ROW
   ============================================================ */
function RuleRow({
  rule, editing, isNew, displayIndex, onStartEdit, onCancelEdit, onSave, onDelete, onDuplicate,
}: {
  rule: Rule; editing: boolean; isNew?: boolean; displayIndex?: number;
  onStartEdit: () => void; onCancelEdit: () => void;
  onSave: (rule: Rule) => void; onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [draft, setDraft] = useState<Rule>(rule);

  const field = fieldById(draft.fieldId);
  const operators = field ? OPERATORS[field.type] : [];
  const complete = !!field && !!draft.operator && ruleIsComplete(draft);
  const conditionOptions = operators.map((operator) => ({
    value: operator.id,
    label: {
      oneOf: "is one of",
      isOneOf: "is one of",
      isNotOneOf: "is not one of",
      is: "is",
      eq: "equals",
      gte: "is at least",
      lte: "is at most",
      lt: "is less than",
      gt: "is greater than",
    }[operator.id] || operator.label,
  }));

  const chooseField = (fid: string) => {
    const f = fieldById(fid)!;
    setDraft({ id: draft.id, fieldId: fid, operator: OPERATORS[f.type][0].id, severity: draft.severity || "Blocking", action: draft.action, value: undefined, values: undefined, value2: undefined });
  };
  const changeOperator = (opId: string) => setDraft({ ...draft, operator: opId, value: undefined, values: undefined, value2: undefined });
  const changeSeverity = (sev: Severity) => setDraft({ ...draft, severity: sev, action: draft.actionTouched ? draft.action : SEVERITIES[sev].defaultAction });

  const handleStartEdit = () => {
    setDraft(rule);
    onStartEdit();
  };

  const handleCancelEdit = () => {
    setDraft(rule);
    onCancelEdit();
  };

  if (!editing) {
    return (
      <Paper
        withBorder
        radius="md"
        p={7}
        mb={5}
        style={{
          background: "var(--mantine-color-white)",
          borderColor: "var(--mantine-color-slate-2)",
          boxShadow: "0 1px 1px rgba(15, 23, 42, 0.04)",
          minHeight: 44,
        }}
      >
        <Group wrap="nowrap" gap={6} align="center">
          <Box
            style={{
              width: 18,
              height: 18,
              minWidth: 18,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--mantine-color-slate-1)",
              color: "var(--mantine-color-slate-6)",
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {displayIndex ?? "•"}
          </Box>
          <Tooltip label="Drag to reorder rule" withArrow position="top" transitionProps={{ transition: "fade", duration: 150 }}>
            <ActionIcon variant="subtle" color="gray" radius="sm" aria-label="Reorder rule" style={{ width: 24, height: 24, minWidth: 24, cursor: "grab", background: "var(--mantine-color-slate-0)" }}>
              <IconGripVertical size={14} stroke={1.8} />
            </ActionIcon>
          </Tooltip>
          <Box style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={handleStartEdit}>
            <Tooltip label={`If met -> ${rule.action || SEVERITIES[rule.severity].defaultAction}`} withArrow position="top-start" transitionProps={{ transition: "fade", duration: 150 }}>
              <Text fz={12.5} fw={600} c="slate.8" lineClamp={1}>{ruleSentence(rule)}</Text>
            </Tooltip>
          </Box>
          <SeverityBadge severity={rule.severity} />
          <Group gap={2} wrap="nowrap">
            <Tooltip label="Duplicate rule" withArrow transitionProps={{ transition: "fade", duration: 150 }}>
              <ActionIcon variant="subtle" color="gray" radius="sm" aria-label="Duplicate rule" onClick={onDuplicate} style={{ width: 24, height: 24, minWidth: 24 }}>
                <IconCopy size={14} stroke={2} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit rule" withArrow transitionProps={{ transition: "fade", duration: 150 }}>
              <ActionIcon variant="subtle" color="brand" radius="sm" aria-label="Edit rule" onClick={handleStartEdit} style={{ width: 24, height: 24, minWidth: 24 }}>
                <IconPencil size={14} stroke={2} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete rule" withArrow transitionProps={{ transition: "fade", duration: 150 }}>
              <ActionIcon variant="subtle" color="red" radius="sm" aria-label="Delete rule" onClick={onDelete} style={{ width: 24, height: 24, minWidth: 24 }}>
                <IconTrash size={14} stroke={2} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>
    );
  }

  return (
    <Modal
      opened
      onClose={handleCancelEdit}
      title={isNew ? "Add Rule" : "Edit Rule"}
      withCloseButton
      size={768}
      radius="lg"
      centered
      padding={0}
      overlayProps={{ backgroundOpacity: 0.52, blur: 2 }}
      styles={{
        content: { overflow: "hidden", boxShadow: "0 24px 60px -12px rgba(20,23,38,0.35)" },
        header: { padding: "12px 16px", minHeight: 0, borderBottom: "1px solid var(--mantine-color-slate-2)" },
        title: { fontSize: 13.5, fontWeight: 700, color: "var(--mantine-color-slate-9)" },
        close: { color: "var(--mantine-color-slate-4)" },
        body: { padding: 0 },
      }}
    >
      <Stack gap={0}>
        <Stack gap={12} p={16}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={12} verticalSpacing={12}>
            <Box>
              <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>Criteria</Text>
              <FieldPicker value={draft.fieldId} onSelect={chooseField} />
            </Box>
            <Box>
              <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>Condition</Text>
              <Select
                size="xs"
                data={conditionOptions}
                value={draft.operator}
                onChange={(val) => val && changeOperator(val)}
              />
            </Box>
            <Box>
              <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>Value</Text>
              {field ? <ValueEditor field={field} rule={draft} setRule={setDraft} /> : <Input size="xs" disabled placeholder="Select a criterion" />}
            </Box>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12}>
            <Box>
              <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>Severity Level</Text>
              <Group gap={0} wrap="nowrap" style={{ border: "1px solid var(--mantine-color-slate-3)", borderRadius: 6, overflow: "hidden", width: "100%" }}>
                {(Object.keys(SEVERITIES) as Severity[]).map((sev) => (
                  <Button
                    key={sev}
                    size="xs"
                    radius={0}
                    variant="subtle"
                    onClick={() => changeSeverity(sev)}
                    styles={{ root: { flex: "1 1 0", minWidth: 0, borderRight: sev !== "Review" ? "1px solid var(--mantine-color-slate-3)" : undefined, background: draft.severity === sev ? SEVERITIES[sev].wash : "var(--mantine-color-white)", color: draft.severity === sev ? SEVERITIES[sev].color : "var(--mantine-color-slate-7)", fontWeight: 700, whiteSpace: "nowrap", height: 30, minHeight: 30, paddingLeft: 5, paddingRight: 5 }, label: { overflow: "visible", fontSize: 11.5 } }}
                  >
                    {SEVERITIES[sev].label}
                  </Button>
                ))}
              </Group>
              <Text fz={11} c="slate.4" mt={5}>{SEVERITIES[draft.severity]?.desc}</Text>
            </Box>
            <Box>
              <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>Outcome</Text>
              <Select
                size="xs"
                data={ACTIONS}
                value={draft.action || SEVERITIES[draft.severity].defaultAction}
                onChange={(val) => val && setDraft({ ...draft, action: val, actionTouched: true })}
              />
              <Text fz={11} c="transparent" mt={5} aria-hidden style={{ userSelect: "none" }}>&nbsp;</Text>
            </Box>
          </SimpleGrid>

          <Paper withBorder radius="md" p={8} style={{ background: "var(--mantine-color-brand-0)", borderColor: "#d9dbfa" }}>
            <Text fz={11} c="slate.8" style={{ lineHeight: 1.45, fontFamily: "var(--font-mono, monospace)", fontWeight: 500 }}>
              If <Text span inherit fw={700} c="brand.8">{ruleSentence(draft)}</Text> is true → <Text span inherit fw={700} c="brand.8">{draft.action || SEVERITIES[draft.severity].defaultAction}</Text>
            </Text>
          </Paper>
        </Stack>

        <Group justify="flex-end" gap={8} px={16} py={12} style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
          <Button size="xs" radius="md" variant="default" onClick={handleCancelEdit}>Cancel</Button>
          <Button size="xs" radius="md" color="brand" disabled={!complete} onClick={() => onSave(draft)}>Save Rule</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
/* ============================================================
   GROUP CARD
   ============================================================ */
function GroupCard({
  group, groupIndex, onSaveRule, onDeleteRule, onReorderRules, onDuplicateRule, onDeleteGroup, onRenameGroup, onSetLogic,
}: {
  group: RuleGroup;
  groupIndex: number;
  onSaveRule: (groupId: string, rule: Rule, isNew: boolean) => void;
  onDeleteRule: (groupId: string, ruleId: string) => void;
  onReorderRules: (groupId: string, rules: Rule[]) => void;
  onDuplicateRule: (gid: string, rule: Rule) => void;
  onDeleteGroup: (gid: string) => void;
  onRenameGroup: (gid: string, name: string) => void;
  onSetLogic: (gid: string, logic: "ALL" | "ANY") => void;
}) {
  const [editingName, setEditingName] = useState(group.name === "New Rule Group");
  const [name, setName] = useState(group.name);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const [localRules, setLocalRules] = useState(() => group.rules);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const visibleRules = draggedIndex === null ? group.rules : localRules;
  const orderedRules = visibleRules.map((rule, index) => ({ ...rule, order: index + 1 }));

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const next = [...localRules];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(index, 0, moved);
    setLocalRules(next);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => { onReorderRules(group.id, localRules); setDraggedIndex(null); };

  return (
    <Paper
      withBorder
      radius="md"
      p={12}
      mb={10}
      style={{
        background: "var(--mantine-color-white)",
        borderColor: "var(--mantine-color-slate-2)",
        borderTop: "2px solid var(--mantine-color-brand-6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Group justify="space-between" align="center" mb={8} pt={0} wrap="nowrap">
        {editingName ? (
          <TextInput autoFocus size="xs" value={name} onChange={(e) => setName(e.currentTarget.value)}
            onBlur={() => { onRenameGroup(group.id, name); setEditingName(false); }}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} w={210} />
        ) : (
          <Group gap={8} align="center" wrap="nowrap">
            <Box
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "linear-gradient(135deg, var(--mantine-color-brand-6), var(--mantine-color-brand-4))",
                color: "var(--mantine-color-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10.5,
                fontWeight: 700,
                boxShadow: "0 4px 10px rgba(99, 102, 241, 0.18)",
                flexShrink: 0,
              }}
            >
              {groupIndex}
            </Box>
            <Group gap={3} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              <Title order={4} fz={13} c="slate.8" style={{ cursor: "pointer" }} onClick={() => setEditingName(true)}>{group.name}</Title>
              <Tooltip label="Rename group" withArrow transitionProps={{ transition: "fade", duration: 150 }}>
                <ActionIcon variant="subtle" color="slate" radius="sm" aria-label="Rename group" onClick={() => setEditingName(true)} style={{ width: 18, height: 18, minWidth: 18 }}>
                  <IconPencil size={11} stroke={2} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap={6} align="center" wrap="nowrap" ml={4}>
              <Text fz={11.5} c="dimmed" style={{ flexShrink: 0 }}>Match</Text>
              <SegmentedControl
                size="xs"
                radius="md"
                value={group.logic}
                onChange={(val) => onSetLogic(group.id, val as "ALL" | "ANY")}
                color="brand"
                data={[{ label: "ALL", value: "ALL" }, { label: "ANY", value: "ANY" }]}
                styles={{
                  root: { background: "var(--mantine-color-slate-1)", padding: 2, borderRadius: 6 },
                  label: { fontSize: 10.5, fontWeight: 700, padding: "1px 10px", minHeight: 0, lineHeight: "16px" },
                  indicator: { background: "var(--mantine-color-brand-6)", boxShadow: "none" },
                }}
              />
              <Text fz={11.5} c="dimmed" style={{ flexShrink: 0 }}>of the following</Text>
            </Group>
          </Group>
        )}
        <Tooltip label="Remove group" withArrow transitionProps={{ transition: "fade", duration: 150 }}>
          <ActionIcon variant="subtle" color="red" radius="sm" aria-label="Remove group" onClick={() => onDeleteGroup(group.id)} style={{ width: 24, height: 24, minWidth: 24, flexShrink: 0 }}>
            <IconTrash size={13} stroke={2} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {visibleRules.length === 0 && !addingNew ? (
        <Paper radius="md" p={14} mb={6} style={{ border: "1px dashed var(--mantine-color-slate-3)", textAlign: "center", background: "var(--mantine-color-slate-0)" }}>
          <Text fz={11.5} c="dimmed">No rules in this group yet.</Text>
        </Paper>
      ) : (
        orderedRules.map((r, i) => (
          <Box key={r.id} draggable onDragStart={() => setDraggedIndex(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} style={{ opacity: draggedIndex === i ? 0.4 : 1 }}>
            <RuleRow
              rule={r}
              editing={editingRuleId === r.id}
              displayIndex={i + 1}
              onStartEdit={() => setEditingRuleId(r.id)}
              onCancelEdit={() => setEditingRuleId(null)}
              onSave={(updated) => { onSaveRule(group.id, updated, false); setEditingRuleId(null); }}
              onDelete={() => { onDeleteRule(group.id, r.id); setEditingRuleId(null); }}
              onDuplicate={() => onDuplicateRule(group.id, r)}
            />
          </Box>
        ))
      )}

      {addingNew && (
        <RuleRow
          rule={makeEmptyRule()}
          displayIndex={visibleRules.length + 1}
          editing isNew
          onStartEdit={() => {}}
          onCancelEdit={() => setAddingNew(false)}
          onSave={(rule) => { onSaveRule(group.id, rule, true); setAddingNew(false); }}
          onDelete={() => setAddingNew(false)}
          onDuplicate={() => {}}
        />
      )}

      <Button
        size="xs"
        radius="md"
        variant="outline"
        color="brand"
        leftSection={<IconPlus size={12} stroke={2.4} />}
        onClick={() => setAddingNew(true)}
        disabled={addingNew}
        fullWidth
        styles={{ root: { height: 26, minHeight: 26 }, label: { fontSize: 11.5, fontWeight: 600 } }}
        style={{ borderStyle: "dashed", borderWidth: 1, background: "var(--mantine-color-slate-0)" }}
      >
        Add Rule
      </Button>
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
  onDuplicateRule: (gid: string, rule: Rule) => void;
  onSaveRule: (groupId: string, rule: Rule, isNew: boolean) => void;
  onDeleteRule: (groupId: string, ruleId: string) => void;
  onReorderRules: (groupId: string, rules: Rule[]) => void; // new
}

export default function BuilderTab({
  ruleSet, onAddGroup, onRenameGroup, onSetLogic, onDeleteGroup,
  onDuplicateRule, onSaveRule, onDeleteRule, onReorderRules,
}: BuilderTabProps) {
  const v = computeValidation(ruleSet);
  const summaryGroups = ruleSet.groups.filter((group) => group.rules.some((rule) => !rule.disabled));

  return (
    <Box style={{ fontFamily: "Inter, var(--font-main), sans-serif", color: "var(--mantine-color-slate-8)" }}>
      <Grid gap="lg" align="flex-start">
      <Grid.Col span={{ base: 12, md: 8 }}>
        {ruleSet.groups.map((g, index) => (
          <Box key={g.id}>
            <GroupCard
              group={g}
              groupIndex={index + 1}
              onSaveRule={onSaveRule}
              onDeleteRule={onDeleteRule}
              onReorderRules={onReorderRules}
              onDuplicateRule={onDuplicateRule}
              onDeleteGroup={onDeleteGroup}
              onRenameGroup={onRenameGroup}
              onSetLogic={onSetLogic}
            />
          </Box>
        ))}

        <Button size="xs" radius="md" variant="default" leftSection={<IconPlus size={12} stroke={2.4} />} onClick={onAddGroup}>
          Add Rule Group
        </Button>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Box style={{ position: "sticky", top: 120 }}>
          <Paper withBorder radius="md" p={12} mb={10} style={{ background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderTop: "2px solid var(--mantine-color-brand-6)" }}>
            <Group gap={8} align="center" mb={8} wrap="nowrap">
              <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
                <IconInfoCircle size={13} stroke={2} />
              </Box>
              <Title order={4} fz={13} c="slate.8">Rule Set Details</Title>
            </Group>
            <Stack gap={0}>
              {([
                ["Loan Product", ruleSet.product],
                ["Effective From", ruleSet.effectiveFrom],
                ["Created By", ruleSet.createdBy],
                ["Last Modified", `${ruleSet.modifiedDate} · ${ruleSet.modifiedBy}`],
              ] as const).map(([k, val], i) => (
                <Box key={k}>
                  {i > 0 && <Divider color="var(--mantine-color-slate-1)" />}
                  <Group justify="space-between" py={7} gap={8} wrap="nowrap">
                    <Text fz={11.5} c="slate.5">{k}</Text>
                    <Text fz={11.5} fw={600} c="slate.8" ta="right" style={{ overflowWrap: "anywhere" }}>{val}</Text>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="md" p={12} mb={10} style={{ background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderTop: "2px solid var(--mantine-color-brand-6)" }}>
            <Group gap={8} align="center" mb={8} wrap="nowrap">
              <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
                <IconSparkles size={13} stroke={2} />
              </Box>
              <Title order={4} fz={13} c="slate.8">Before you activate</Title>
            </Group>
            <Stack gap={5} p={8} style={{ borderRadius: 6, background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
              <ValidationLine ok={v.issues.length === 0} text={v.issues.length === 0 ? "Conditions complete" : `${v.issues.length} incomplete`} />
              <ValidationLine ok={v.warnings.length === 0} text={v.warnings.length === 0 ? "No conflicts" : `${v.warnings.length} possible conflict`} warnOnly />
            </Stack>
            <Group gap={5} justify="center" mt={8} pt={8} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
              <IconInfoCircle size={12} color="var(--mantine-color-slate-4)" />
              <Text fz={10.5} c="slate.4" ta="center">Activate Rule Set — complete pending items above</Text>
            </Group>
          </Paper>

          <Paper withBorder radius="md" p={12} style={{ background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderTop: "2px solid var(--mantine-color-brand-6)" }}>
            <Group gap={8} align="center" mb={8} wrap="nowrap">
              <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
                <IconSparkles size={13} stroke={2} />
              </Box>
              <Title order={4} fz={13} c="slate.8">Summary</Title>
            </Group>
            {summaryGroups.length === 0 ? (
              <Text fz={13} lh={1.65} c="slate.4" fs="italic" px={14} py={10} style={{ overflowWrap: "anywhere", borderRadius: 10, background: "var(--mantine-color-brand-0)", borderLeft: "3px solid var(--mantine-color-brand-5)" }}>
                Add a rule group with at least one rule to see a summary here.
              </Text>
            ) : (
              <Text fz={13} lh={1.65} c="slate.6" px={14} py={10} style={{ overflowWrap: "anywhere", wordBreak: "break-word", borderRadius: 10, background: "var(--mantine-color-brand-0)", borderLeft: "3px solid var(--mantine-color-brand-5)" }}>
                For <Text span inherit fw={600} c="slate.9">{ruleSet.product}</Text> applications, where{" "}
                {summaryGroups.map((group, groupIndex) => {
                  const activeRules = group.rules.filter((rule) => !rule.disabled);
                  return (
                    <Text span key={group.id} inherit>
                      {groupIndex > 0 && <Text span inherit fw={600} c="slate.9"> and </Text>}
                      <Text span inherit fw={600} c="slate.9">({group.name}: </Text>
                      {activeRules.map((rule, ruleIndex) => (
                        <Text span key={rule.id} inherit>
                          {ruleIndex > 0 && <Text span inherit fw={600} c="slate.9"> {group.logic === "ANY" ? "or" : "and"} </Text>}
                          {ruleSentence(rule)}
                        </Text>
                      ))}
                      <Text span inherit fw={600} c="slate.9">)</Text>
                    </Text>
                  );
                })}.
              </Text>
            )}
          </Paper>
        </Box>
      </Grid.Col>
      </Grid>
    </Box>
  );
}