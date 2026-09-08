import { useState, useEffect } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
  Box,
} from "@mantine/core";
import {
  IconArrowRight,
  IconChevronUp,
  IconCopy,
  IconGridDots,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import {
  FIELDS,
  PRODUCT_OPTIONS,
  colorForProduct,
  emptyRuleGroup,
  fieldById,
  uid,
  type Condition,
  type JoinType,
  type RuleGroup,
} from "./shared";

interface RuleGroupsTabProps {
  groups: RuleGroup[];
  startIndex?: number;
  productLine: string;
  onChange: (groups: RuleGroup[]) => void;
}

export function RuleGroupsTab({ groups, startIndex = 0, onChange, productLine }: RuleGroupsTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Use local state for smooth dragging without interrupting the HTML5 drag event
  const [localGroups, setLocalGroups] = useState(groups);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Keep local groups in sync with parent when items are added/removed
  useEffect(() => {
    if (draggedIndex === null) {
      setLocalGroups(groups);
    }
  }, [groups, draggedIndex]);

  const updateGroup = (id: string, patch: Partial<RuleGroup>) =>
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const addGroup = () => {
    const group = emptyRuleGroup();
    onChange([...groups, group]);
    setExpanded((e) => ({ ...e, [group.id]: true }));
  };

  const duplicateGroup = (id: string) => {
    const src = groups.find((g) => g.id === id);
    if (!src) return;
    const copy: RuleGroup = {
      ...src,
      id: uid(),
      conditions: src.conditions.map((c) => ({ ...c, id: uid() })),
    };
    const idx = groups.findIndex((g) => g.id === id);
    const next = [...groups];
    next.splice(idx + 1, 0, copy);
    onChange(next);
    setExpanded((e) => ({ ...e, [copy.id]: true }));
  };

  const removeGroup = (id: string) => onChange(groups.filter((g) => g.id !== id));

  // --- HTML5 Drag and Drop Handlers (Local State Fix) ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };
  
  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newGroups = [...localGroups];
    const [draggedItem] = newGroups.splice(draggedIndex, 1);
    newGroups.splice(index, 0, draggedItem);
    
    setLocalGroups(newGroups); // Update UI visually instantly
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    onChange(localGroups); // Commit the new order to the parent ONLY when dropped
    setDraggedIndex(null);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4} c="slate.8" fw={600}>
          Rule groups
        </Title>
        <Text fz="xs" c="slate.5">
          Evaluated top to bottom — the first full match is assigned
        </Text>
      </Group>

      {localGroups.map((group, index) => {
        // Default to false so they start collapsed, allowing "Edit" to open them
        const isExpanded = expanded[group.id] ?? false; 

        return (
          <Box
            key={group.id}
            draggable
            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()} // Required to allow dropping
            style={{
              opacity: draggedIndex === index ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <RuleGroupCard
              group={group}
              index={startIndex + index}
              expanded={isExpanded}
               productLine={productLine}
              onToggleExpand={() => setExpanded((e) => ({ ...e, [group.id]: !isExpanded }))}
              onUpdateGroup={(patch) => updateGroup(group.id, patch)}
              onDuplicate={() => duplicateGroup(group.id)}
              onRemove={() => removeGroup(group.id)}
            />
          </Box>
        );
      })}

      <Button
        variant="outline"
        color="slate"
        c="brand.6"
        radius="md"
        leftSection={<IconPlus size={16} />}
        onClick={addGroup}
        styles={{ root: { borderStyle: "dashed" } }}
      >
        Add rule group
      </Button>
    </Stack>
  );
}
// ---------------------------------------------------------------------------
// Rule group card
// ---------------------------------------------------------------------------
interface RuleGroupCardProps {
  group: RuleGroup;
  index: number;
  expanded: boolean;
  productLine: string;
  onToggleExpand: () => void;
  onUpdateGroup: (patch: Partial<RuleGroup>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function RuleGroupCard({
  group,
  index,
  expanded,
  productLine,
  onToggleExpand,
  onUpdateGroup,
  onDuplicate,
  onRemove,
}: RuleGroupCardProps) {
  const color = colorForProduct(productLine);

  const updateCondition = (condId: string, patch: Partial<Condition>) =>
    onUpdateGroup({
      conditions: group.conditions.map((c) => (c.id === condId ? { ...c, ...patch } : c)),
    });

  const toggleJoin = (condId: string) =>
    onUpdateGroup({
      conditions: group.conditions.map((c) =>
        c.id === condId ? { ...c, join: (c.join === "AND" ? "OR" : "AND") as JoinType } : c
      ),
    });

  const removeCondition = (condId: string) => {
    const remaining = group.conditions.filter((c) => c.id !== condId);
    if (remaining.length) remaining[0] = { ...remaining[0], join: null };
    onUpdateGroup({ conditions: remaining });
  };

  const addCondition = () =>
    onUpdateGroup({
      conditions: [
        ...group.conditions,
        {
          id: uid(),
          field: FIELDS[0].id,
          operator: "gte",
          value: 0,
          join: group.conditions.length ? "AND" : null,
        },
      ],
    });

  const getConditionSummary = () => {
    if (!group.conditions.length) return `Rule Group ${index + 1}`;
    const c = group.conditions[0];
    const fieldObj = FIELDS.find((f) => f.id === c.field);
    const label = fieldObj ? fieldObj.label : c.field;

    let op = "is";
    if (c.operator === "gte") op = "is at least";
    if (c.operator === "lte") op = "is at most";
    if (c.operator === "gt") op = "is greater than";
    if (c.operator === "lt") op = "is less than";

    return `${label} ${op} ${c.value}`;
  };

  // --- COMPACT VIEW (Collapsed) ---
  if (!expanded) {
    return (
      <Card withBorder radius="md" p="md" style={{ background: "var(--mantine-color-white)" }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group align="center" gap="md" style={{ minWidth: 0 }}>
            <IconGridDots
              size={16}
              color="var(--mantine-color-slate-4)"
              style={{ cursor: "grab", flexShrink: 0 }}
            />
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text fz="sm" fw={600} c="slate.8" truncate>
                {getConditionSummary()}
              </Text>
              <Text fz="xs" c="slate.5">
                If not met → Reject Application
              </Text>
            </Stack>
          </Group>

          <Group gap="lg" align="center">
            <Badge color="red" variant="light" size="sm" radius="sm">
              Blocking
            </Badge>
            <Text fz="sm" fw={600} c="slate.8" style={{ cursor: "pointer" }}>
              Disable
            </Text>
            <Text fz="sm" fw={600} c="slate.8" style={{ cursor: "pointer" }} onClick={onDuplicate}>
              Duplicate
            </Text>
            <Text fz="sm" fw={600} c="slate.8" style={{ cursor: "pointer" }} onClick={onToggleExpand}>
              Edit
            </Text>
          </Group>
        </Group>
      </Card>
    );
  }

  // --- FULL VIEW (Expanded) ---
  return (
    <Card withBorder radius="md" p="lg" style={{ background: "var(--mantine-color-white)" }}>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Group align="flex-start" gap="sm" style={{ minWidth: 0 }}>
          <Text
            fz="sm"
            fw={600}
            c="slate.6"
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "50%",
              background: "var(--mantine-color-slate-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {index + 1}
          </Text>
          <Stack gap={4} style={{ minWidth: 0 }}>
            {/* <Badge 
              size="sm" 
              variant="light" 
              color={color} 
              w="fit-content"
              leftSection={<Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: `var(--mantine-color-${color}-6)` }} />}
            >
              {group.product || "Unassigned product"}
            </Badge> */}
            {/* <Title order={5} c="slate.8" fw={600} truncate style={{ fontFamily: "serif" }}>
              Rule Group {index + 1} — {group.product || "Untitled product"}
            </Title> */}
            <Title order={5} c="slate.8" fw={600} truncate style={{ fontFamily: "serif" }}>
  Rule Group {index + 1} — {getConditionSummary()}
</Title>
            <Text fz="xs" c="slate.5">
              {group.conditions.length} condition{group.conditions.length !== 1 ? "s" : ""}
            </Text>
          </Stack>
        </Group>

        <Group gap={4}>
          <ActionIcon variant="subtle" color="slate" onClick={onDuplicate} aria-label="Duplicate group">
            <IconCopy size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="amber" onClick={onRemove} aria-label="Delete group">
            <IconTrash size={16} />
          </ActionIcon>
          <ActionIcon variant="default" onClick={onToggleExpand} aria-label="Toggle group" style={{ borderColor: 'var(--mantine-color-slate-3)' }}>
            <IconChevronUp size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Stack gap="xs" mt="lg">
        <Text fz="xs" fw={600} c="slate.5">
          Conditions
        </Text>

        {group.conditions.map((cond, i) => (
          <Stack key={cond.id} gap="xs">
            {i > 0 && (
              <Group gap="sm" pl={4}>
                <Button
                  size="compact-xs"
                  radius="xl"
                  variant="light"
                  color={cond.join === "OR" ? "amber" : "brand"}
                  onClick={() => toggleJoin(cond.id)}
                >
                  {cond.join}
                </Button>
                <Group style={{ flex: 1, borderTop: "1px dashed var(--mantine-color-slate-2)" }} />
              </Group>
            )}
            <ConditionRow
              cond={cond}
              onChange={(patch) => updateCondition(cond.id, patch)}
              onRemove={() => removeCondition(cond.id)}
            />
          </Stack>
        ))}

        <Button
          variant="outline"
          color="slate"
          c="brand.6"
          size="xs"
          radius="md"
          leftSection={<IconPlus size={14} />}
          onClick={addCondition}
          styles={{ root: { borderStyle: "dashed", alignSelf: "flex-start", marginTop: 8 } }}
        >
          Add condition
        </Button>

        {/* <Group
          gap="sm"
          p="md"
          mt="md"
          wrap="wrap"
          style={{
            borderRadius: "var(--mantine-radius-md)",
            background: `var(--mantine-color-${color}-0)`,
          }}
        >
          <Text fz="sm" fw={600} c={`${color}.7`}>
            Then
          </Text>
          <IconArrowRight size={15} color={`var(--mantine-color-${color}-7)`} />
          <Text fz="sm" c={`${color}.7`}>
            Assign product
          </Text>
          <Select
            data={PRODUCT_OPTIONS}
            value={group.product}
            onChange={(v) => v && onUpdateGroup({ product: v })}
            allowDeselect={false}
            ml="auto"
            w={220}
            styles={{ input: { fontWeight: 600 } }}
          />
        </Group> */}
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Condition row
// ---------------------------------------------------------------------------
interface ConditionRowProps {
  cond: Condition;
  onChange: (patch: Partial<Condition>) => void;
  onRemove: () => void;
}

function ConditionRow({ cond, onChange, onRemove }: ConditionRowProps) {
  return (
    <Group
      gap="xs"
      p="xs"
      wrap="wrap"
      style={{
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-sm)",
        background: "var(--mantine-color-slate-0)",
      }}
    >
      <Select
        data={FIELDS.map((f) => ({ value: f.id, label: f.label }))}
        value={cond.field}
        onChange={(v) => v && onChange({ field: v })}
        allowDeselect={false}
        w={190}
        size="sm"
      />
      <Select
        data={[
          { value: "gte", label: "Greater than or equal to" },
          { value: "lte", label: "Less than or equal to" },
          { value: "gt", label: "Greater than" },
          { value: "lt", label: "Less than" },
          { value: "eq", label: "Equal to" },
        ]}
        value={cond.operator}
        onChange={(v) => v && onChange({ operator: v as Condition["operator"] })}
        allowDeselect={false}
        w={220}
        size="sm"
      />
      <NumberInput
        value={cond.value}
        onChange={(v) => onChange({ value: v === "" ? "" : Number(v) })}
        w={120}
        size="sm"
        suffix={fieldById(cond.field)?.unit === "percent" ? " %" : undefined}
      />

      <ActionIcon variant="subtle" color="slate" ml="auto" onClick={onRemove} aria-label="Remove condition">
        <IconTrash size={15} />
      </ActionIcon>
    </Group>
  );
}

export default RuleGroupsTab;