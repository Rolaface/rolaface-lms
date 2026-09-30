import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CheckIcon,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
  Popover
} from "@mantine/core";
import {
  IconAffiliate,
  IconArrowRight,
  IconBuildingBank,
  IconChevronDown,
  IconDeviceMobile,
  IconHash,
  IconPencil,
  IconPlus,
  IconRoute,
  IconStack2,
  IconTrash,
  IconWorldWww,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import {
  LOAN_TYPES,
  SOURCES,
  VARIABLES,
  clauseText,
  hasCondition,
  newClause,
  newGroup,
  operatorsFor,
  productByCode,
  productsFor,
  rowError,
  variableByName,
  type AssignmentRow,
  type Clause,
  type ConditionGroup,
  type Joiner,
  type Operator,
} from "../../../view/LosConfiguration/ProductAssignment/shared";
import { getAllLoanTypes } from "../../../api/OriginationSetupAPi/loanSetupApi";
import {type CreateLoantypeResponse } from "../../../types/OriginationSetup/loanTypeForm";
import { getAllLoanProducts } from "../../../api/productApi";
import { useQuery } from "@tanstack/react-query";

export const FIELD = { input: { height: 30, minHeight: 30, fontSize: 12.5, paddingLeft: 10 } };

export const codeBadge = {
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 6px",
  borderRadius: "var(--mantine-radius-sm)",
  color: "var(--mantine-color-brand-8)",
  background: "var(--mantine-color-brand-0)",
  fontFamily: "var(--mantine-font-family-monospace)",
  flexShrink: 0,
};

const SOURCE_ICON: Record<string, Icon> = {
  Branch: IconBuildingBank,
  "Mobile Banking": IconDeviceMobile,
  "Online Portal": IconWorldWww,
  USSD: IconHash,
  "Third Party": IconAffiliate,
};

export const LOAN_TONE: Record<string, string> = { Personal: "brand", Business: "info", Auto: "orange", Mortgage: "teal", Education: "grape" };

type PickerKind = "source" | "loanType";

export interface PickerOption {
  value: string;
  label: string;
}

export const SOURCE_OPTIONS: PickerOption[] = SOURCES.map((s) => ({ value: s, label: s }));

const PICKER = {
  source: { label: "Sources", allLabel: "All sources" },
  loanType: { label: "Loan types", allLabel: "All loan types" },
};

export function OptionMark({ kind, value, label = value, size = 20 }: { kind: PickerKind; value: string; label?: string; size?: number }) {
  if (kind === "loanType") {
    return <Box style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: `var(--mantine-color-${LOAN_TONE[label] ?? "slate"}-5)` }} />;
  }
  const SourceIcon = SOURCE_ICON[value] ?? IconBuildingBank;
  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--mantine-color-slate-1)",
        color: "var(--mantine-color-slate-6)",
      }}
    >
      <SourceIcon size={size * 0.62} stroke={1.8} />
    </Box>
  );
}

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  height: 22,
  padding: "0 8px 0 4px",
  borderRadius: 6,
  fontSize: 11.5,
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
};

function PickerSummary({ kind, options, values, grid = true }: { kind: PickerKind; options: PickerOption[]; values: string[]; grid?: boolean }) {
  const { allLabel } = PICKER[kind];
  const ordered = options.filter((o) => values.includes(o.value));

  if (options.length > 0 && ordered.length === options.length) {
    return (
      <span style={{ ...chipBase, color: "var(--mantine-color-brand-8)", background: "var(--mantine-color-brand-0)" }}>
        <IconStack2 size={13} />
        {allLabel}
      </span>
    );
  }

  return (
    <Box
      style={
        kind === "loanType" && grid
          ? { display: "grid", gridTemplateColumns: "repeat(2, max-content)", gap: 4, justifyContent: "start", minWidth: 0 }
          : { display: "flex", flexWrap: "wrap", gap: 4, minWidth: 0 }
      }
    >
      {ordered.map((o) => {
        if (kind === "loanType") {
          const tone = LOAN_TONE[o.label] ?? "slate";
          return (
            <span key={o.value} style={{ ...chipBase, paddingLeft: 8, color: `var(--mantine-color-${tone}-8)`, background: `var(--mantine-color-${tone}-0)` }}>
              <OptionMark kind="loanType" value={o.value} label={o.label} />
              {o.label}
            </span>
          );
        }
        return (
          <span key={o.value} style={{ ...chipBase, color: "var(--mantine-color-slate-8)", background: "var(--mantine-color-slate-1)" }}>
            <OptionMark kind="source" value={o.value} size={16} />
            {o.label}
          </span>
        );
      })}
    </Box>
  );
}

function CheckMark({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  const filled = checked || indeterminate;
  return (
    <Box
      style={{
        width: 16,
        height: 16,
        borderRadius: "var(--mantine-radius-xs)",
        border: `1px solid ${filled ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-3)"}`,
        background: filled ? "var(--mantine-color-brand-6)" : "var(--mantine-color-white)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {checked ? (
        <CheckIcon size={10} color="var(--mantine-color-white)" />
      ) : indeterminate ? (
        <Box style={{ width: 8, height: 2, borderRadius: 1, background: "var(--mantine-color-white)" }} />
      ) : null}
    </Box>
  );
}

export function InlinePicker({
  kind,
  value,
  onChange,
  field,
  options,
}: {
  kind: PickerKind;
  value: string[];
  onChange: (value: string[]) => void;
  field?: boolean;
  options?: PickerOption[];
}) {
  const { label } = PICKER[kind];
  const opts = options ?? (kind === "source" ? SOURCE_OPTIONS : []);
  const all = opts.length > 0 && value.length === opts.length;
  const toggle = (item: string) => onChange(opts.map((o) => o.value).filter((v) => (v === item ? !value.includes(v) : value.includes(v))));

  return (
    <Box onClick={(e) => e.stopPropagation()} style={{ minWidth: 0, flex: 1 }}>
      <Popover position="bottom-start" width={field ? "target" : 236} shadow="md" radius="md" withinPortal>
        <Popover.Target>
          <UnstyledButton className={field ? "pa-field" : "pa-cell"} aria-label={`Edit ${label.toLowerCase()}`}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              {value.length === 0 ? (
                <Text fz={field ? 12.5 : 11.5} fw={field ? 400 : 600} c={field ? "slate.4" : "danger.6"}>
                  Choose {label.toLowerCase()}
                </Text>
              ) : (
                <PickerSummary kind={kind} options={opts} values={value} grid={!field} />
              )}
            </Box>
            <IconChevronDown className="pa-chev" size={13} />
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p={6}>
          <UnstyledButton
            className="pa-option"
            role="checkbox"
            aria-checked={all ? "true" : value.length > 0 ? "mixed" : "false"}
            onClick={() => onChange(all ? [] : opts.map((o) => o.value))}
          >
            <CheckMark checked={all} indeterminate={value.length > 0 && !all} />
            <Text fz={12} fw={600} c="slate.8" style={{ flex: 1 }}>
              Select all {label.toLowerCase()}
            </Text>
            <Text fz={10.5} c="slate.5">
              {value.length}/{opts.length}
            </Text>
          </UnstyledButton>
          <Box my={4} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }} />
          <Stack gap={1}>
            {opts.length === 0 ? (
              <Text fz={12} c="slate.5" px={8} py={6}>
                No {label.toLowerCase()} available
              </Text>
            ) : (
              opts.map((o) => {
                const on = value.includes(o.value);
                return (
                  <UnstyledButton key={o.value} onClick={() => toggle(o.value)} role="checkbox" aria-checked={on} className="pa-option">
                    <CheckMark checked={on} />
                    <OptionMark kind={kind} value={o.value} label={o.label} />
                    <Text fz={12.5} fw={on ? 600 : 500} c={on ? "slate.8" : "slate.7"} style={{ flex: 1 }}>
                      {o.label}
                    </Text>
                  </UnstyledButton>
                );
              })
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
}

const JOIN_TONE: Record<Joiner, string> = { AND: "brand", OR: "orange" };

const JoinWord = ({ join }: { join: Joiner }) => (
  <Text span inherit fw={700} c={`${JOIN_TONE[join]}.7`}>
    {` ${join.toLowerCase()} `}
  </Text>
);

export function ConditionText({ row }: { row: Pick<AssignmentRow, "join" | "groups"> }) {
  const groups = row.groups.filter((gr) => gr.clauses.length > 0);
  return (
    <>
      {groups.map((gr, gi) => {
        const bracket = groups.length > 1 && gr.clauses.length > 1;
        return (
          <Fragment key={gr.id}>
            {gi > 0 && <JoinWord join={row.join} />}
            {bracket && "("}
            {gr.clauses.map((cl, ci) => (
              <Fragment key={cl.id}>
                {ci > 0 && <JoinWord join={gr.join} />}
                {clauseText(cl)}
              </Fragment>
            ))}
            {bracket && ")"}
          </Fragment>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modal-only pieces                                                   */
/* ------------------------------------------------------------------ */

const LINE = { input: { height: 26, minHeight: 26, fontSize: 12, paddingLeft: 8, borderRadius: 6 } };

function ConditionBuilder({ groups, onChange }: { groups: ConditionGroup[]; onChange: (groups: ConditionGroup[]) => void }) {
  const setGroups = (next: ConditionGroup[]) => onChange(next.filter((gr) => gr.clauses.length > 0));
  const updateGroup = (id: string, patch: Partial<ConditionGroup>) => setGroups(groups.map((gr) => (gr.id === id ? { ...gr, ...patch } : gr)));
  const updateClause = (gr: ConditionGroup, id: string, patch: Partial<Clause>) =>
    updateGroup(gr.id, { clauses: gr.clauses.map((cl) => (cl.id === id ? { ...cl, ...patch } : cl)) });

  return (
    <Stack gap={6}>
      {groups.map((gr) => (
        <Fragment key={gr.id}>
          <Box style={{ borderRadius: 8, border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
            <Group justify="space-between" wrap="nowrap" px={10} h={32} style={{ background: "var(--mantine-color-slate-0)", borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
              <Group gap={10} wrap="nowrap">
                <TextInput
                  className="pa-name"
                  aria-label="Group name"
                  placeholder="Name this group"
                  value={gr.name}
                  onChange={(e) => updateGroup(gr.id, { name: e.currentTarget.value })}
                  maxLength={40}
                  w={150}
                  rightSection={<IconPencil size={11} stroke={2} />}
                  rightSectionWidth={22}
                  rightSectionPointerEvents="none"
                />
                {gr.clauses.length > 1 && (
                  <Group gap={8} wrap="nowrap">
                    <SegmentedControl
                      size="xs"
                      radius="md"
                      color={gr.join === "AND" ? "brand" : "orange"}
                      value={gr.join}
                      onChange={(v) => updateGroup(gr.id, { join: v as Joiner })}
                      data={[
                        { label: "All", value: "AND" },
                        { label: "Any", value: "OR" },
                      ]}
                      aria-label="Any or all of the following"
                      styles={{ root: { padding: 2 }, label: { fontSize: 10.5, fontWeight: 700, padding: "1px 10px", minHeight: 0, lineHeight: "16px" } }}
                    />
                    <Text fz={11.5} c="slate.6">
                      of the following
                    </Text>
                  </Group>
                )}
              </Group>
              <Group gap={2} wrap="nowrap">
                <UnstyledButton
                  onClick={() => updateGroup(gr.id, { clauses: [...gr.clauses, newClause()] })}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--mantine-color-brand-6)", padding: "0 6px" }}
                >
                  <IconPlus size={11} stroke={2.4} />
                  Add rule
                </UnstyledButton>
                {groups.length > 1 && (
                  <Tooltip label="Remove group" withinPortal>
                    <ActionIcon variant="subtle" color="slate" size="sm" radius="xl" onClick={() => setGroups(groups.filter((x) => x.id !== gr.id))} aria-label="Remove group">
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
            <Stack gap={4} p={8}>
              {gr.clauses.map((clause) => {
                const variable = variableByName(clause.variable);
                return (
                  <Group key={clause.id} gap={6} wrap="nowrap">
                    <Select
                      aria-label="Variable"
                      placeholder="Variable"
                      data={VARIABLES.map((v) => ({ value: v.name, label: v.label }))}
                      value={clause.variable || null}
                      onChange={(v) => {
                        if (!v) return;
                        const allowed = operatorsFor(variableByName(v)).some((o) => o.value === clause.operator);
                        updateClause(gr, clause.id, { variable: v, operator: allowed ? clause.operator : "=", value: "" });
                      }}
                      allowDeselect={false}
                      searchable
                      styles={LINE}
                      style={{ flex: "1.3 1 0", minWidth: 0 }}
                    />
                    <Select
                      aria-label="Operator"
                      data={operatorsFor(variable)}
                      value={clause.operator}
                      onChange={(v) => v && updateClause(gr, clause.id, { operator: v as Operator })}
                      allowDeselect={false}
                      styles={{ input: { ...LINE.input, fontWeight: 500, color: "var(--mantine-color-brand-7)" } }}
                      style={{ width: 138, flexShrink: 0 }}
                    />
                    {variable?.options ? (
                      <Select
                        aria-label="Value"
                        placeholder="Value"
                        data={variable.options}
                        value={clause.value || null}
                        onChange={(v) => updateClause(gr, clause.id, { value: v ?? "" })}
                        allowDeselect={false}
                        styles={LINE}
                        style={{ flex: "1 1 0", minWidth: 0 }}
                      />
                    ) : (
                      <NumberInput
                        aria-label="Value"
                        placeholder="Value"
                        value={clause.value}
                        onChange={(v) => updateClause(gr, clause.id, { value: String(v) })}
                        hideControls
                        thousandSeparator=","
                        disabled={!variable}
                        styles={LINE}
                        style={{ flex: "1 1 0", minWidth: 0 }}
                      />
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="slate"
                      size="sm"
                      radius="xl"
                      onClick={() => updateGroup(gr.id, { clauses: gr.clauses.filter((cl) => cl.id !== clause.id) })}
                      aria-label="Remove rule"
                    >
                      <IconX size={13} />
                    </ActionIcon>
                  </Group>
                );
              })}
            </Stack>
          </Box>
        </Fragment>
      ))}
      <Box>
        <UnstyledButton className="pa-dashed" onClick={() => onChange([...groups, newGroup()])}>
          <IconPlus size={12} stroke={2.4} />
          Add group
        </UnstyledButton>
      </Box>
    </Stack>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text fz={12} fw={500} c="slate.6" mb={5}>
      {children}
    </Text>
  );
}

function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Group justify="space-between" align="center" mb={8} h={22}>
      <Group gap={8} align="baseline">
        <Text fz={13} fw={600} c="slate.8">
          {title}
        </Text>
        {hint && (
          <Text fz={12} c="slate.5">
            {hint}
          </Text>
        )}
      </Group>
      {action}
    </Group>
  );
}

const joinWords = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`);

function RuleSummary({ row, loanTypeOptions }: { row: AssignmentRow; loanTypeOptions: PickerOption[] }) {
  const strong = (text: ReactNode) => (
    <Text span inherit fw={600} c="slate.9">
      {text}
    </Text>
  );
  const loanNames = row.loanTypes.map((id) => loanTypeOptions.find((o) => o.value === id)?.label ?? id);
  const loanList = joinWords(loanNames);
  const sources = row.sources.length === SOURCES.length ? "any source" : joinWords(row.sources);
  const loanTypes =
    loanTypeOptions.length > 0 && row.loanTypes.length === loanTypeOptions.length
      ? "any loan type"
      : `${/^[AEIOU]/.test(loanList) ? "an" : "a"} ${loanList} loan`;
  return (
    <Text fz={13} c="slate.6" lh={1.65}>
      Applications from {strong(row.sources.length ? sources : "…")} for {strong(row.loanTypes.length ? loanTypes : "…")}
      {hasCondition(row) ? (
        <>
          , where {strong(<ConditionText row={row} />)},
        </>
      ) : (
        ", with no further condition,"
      )}{" "}
     </Text>
  );
}

export interface EditingState {
  mode: "add" | "edit";
  row: AssignmentRow;
  original: string;
  attempted: boolean;
}

interface LoanProductAssignmentModalProps {
  editing: EditingState | null;
  saving: boolean;
  saveError: string | null;
  onClose: () => void;
  onEditRow: (patch: Partial<AssignmentRow>) => void;
  onChangeLoanTypes: (loanTypes: string[]) => void;
  onSave: () => void;
}

export function LoanProductAssignmentModal({ editing, saving, saveError, onClose, onEditRow, onChangeLoanTypes, onSave }: LoanProductAssignmentModalProps) {
  const theme = useMantineTheme();
  const [loanTypeOptions, setLoanTypeOptions] = useState<PickerOption[]>([]);
  const [loanTypesLoading, setLoanTypesLoading] = useState(false);
  const [loanTypesError, setLoanTypesError] = useState<string | null>(null);
  const isOpen = editing !== null;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoanTypesLoading(true);
      setLoanTypesError(null);
      try {
        const res = (await getAllLoanTypes()) as CreateLoantypeResponse;
        const options = Object.values(res.message.data.setup)
          .flat()
          .map((lt) => ({ value: lt.id, label: lt.name }));
        if (!cancelled) setLoanTypeOptions(options);
      } catch (err) {
        if (!cancelled) setLoanTypesError(err instanceof Error ? err.message : "Could not load loan types.");
      } finally {
        if (!cancelled) setLoanTypesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);
  const editingError = editing ? rowError(editing.row) : null;
  const editingChanged = editing ? JSON.stringify(editing.row) !== editing.original : false;

    const { data: productResponse, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: () => getAllLoanProducts(),
  });

  const availableProduct = useMemo(() => {
    const products = productResponse?.data || [];
    return products
      .filter((p: any) => p.disabled !== 1)
      .map((p: any) => ({
        value: p.name,
        label: p.name,
      }));
  }, [productResponse]);

  return (
    <Modal
      opened={editing !== null}
      onClose={onClose}
      size={1120}
      padding={0}
      radius="lg"
      centered
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100dvh - 48px)" },
        header: { display: "none" },
        body: { padding: 0, display: "flex", flexDirection: "column", minHeight: 0, flex: 1 },
      }}
      trapFocus={false}
    >
      {editing && (
        <>
          <Group justify="space-between" align="center" wrap="nowrap" px={24} py={16} style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
            <Group gap={12} wrap="nowrap">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: theme.other?.brandGradient,
                  boxShadow: theme.other?.brandGlowShadowSm,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconRoute size={18} color="var(--mantine-color-white)" />
              </Box>
              <Box>
                <Group gap={8} wrap="nowrap">
                  <Text fz={16} fw={700} c="slate.9" lh={1.3}>
                    {editing.mode === "add" ? "Add rule" : "Edit rule"}
                  </Text>
                  <Badge variant="light" color={hasCondition(editing.row) ? "brand" : "success"} radius="sm" size="sm" tt="none" fw={600}>
                    {hasCondition(editing.row) ? "Conditional" : "Direct mapping"}
                  </Badge>
                </Group>
                {editing.mode === "add" && (
                  <Text fz={12.5} c="slate.5" lh={1.4}>
                    Added at the top of the list, so it is checked first.
                  </Text>
                )}
              </Box>
            </Group>
            <ActionIcon variant="subtle" color="slate" radius="xl" size="lg" onClick={onClose} aria-label="Close">
              <IconX size={18} />
            </ActionIcon>
          </Group>

          <Stack gap={16} px={24} py={16} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <Box>
              <Box style={{ display: "grid", gridTemplateColumns: "minmax(0, 35fr) minmax(0, 35fr) minmax(0, 30fr)", columnGap: 32, alignItems: "start" }}>
                <Box style={{ minWidth: 0 }}>
                  <FieldLabel>Source</FieldLabel>
                  <InlinePicker field kind="source" value={editing.row.sources} onChange={(sources) => onEditRow({ sources })} />
                </Box>
                                <Box style={{ minWidth: 0 }}>
                  <FieldLabel>Loan type</FieldLabel>
                  <InlinePicker field kind="loanType" options={loanTypeOptions} value={editing.row.loanTypes} onChange={onChangeLoanTypes} />
                  {loanTypesLoading && (
                    <Text fz={11} c="slate.5" mt={4}>
                      Loading loan types…
                    </Text>
                  )}
                  {loanTypesError && (
                    <Text fz={11} c="danger.6" mt={4}>
                      {loanTypesError}
                    </Text>
                  )}
                </Box>
                <Box style={{ minWidth: 0, position: "relative" }}>
  <Box style={{ position: "absolute", left: -24, top: 23, height: 32, width: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mantine-color-slate-4)" }}>
    <IconArrowRight size={16} />
  </Box>
  <FieldLabel>Product</FieldLabel>
  <Select
    aria-label="Product"
    placeholder={editing.row.loanTypes.length ? "Select product" : "Pick a loan type first"}
    data={availableProduct}
    value={editing.row.productCode || null}
    onChange={(v) => onEditRow({ productCode: v ?? "" })}
    allowDeselect={false}
    disabled={editing.row.loanTypes.length === 0}
    searchable
    leftSection={editing.row.productCode ? <span style={codeBadge}>{editing.row.productCode}</span> : null}
    leftSectionWidth={editing.row.productCode ? 76 : undefined}
    leftSectionPointerEvents="none"
    renderOption={({ option }) => (
      <Group gap={8} wrap="nowrap">
        <Text fz={10} fw={700} c="brand.8" w={56} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
          {option.value}
        </Text>
        <Text fz={13}>{option.label}</Text>
      </Group>
    )}
    styles={{ input: { ...FIELD.input, paddingLeft: editing.row.productCode ? 78 : 12, fontWeight: 600 } }}
  />
</Box>
              </Box>
            </Box>

            <Box>
              <SectionTitle
                title="Condition"
                hint="Optional"
                action={
                  hasCondition(editing.row) ? (
                    <Button size="compact-xs" variant="subtle" color="danger" onClick={() => onEditRow({ groups: [] })}>
                      Clear condition
                    </Button>
                  ) : undefined
                }
              />
              {hasCondition(editing.row) ? (
                <ConditionBuilder groups={editing.row.groups} onChange={(groups) => onEditRow({ join: "AND", groups })} />
              ) : (
                <Group justify="space-between" wrap="nowrap" px={16} py={12} style={{ borderRadius: 10, border: "1px dashed var(--mantine-color-slate-3)" }}>
                  <Box>
                    <Text fz={13} fw={600} c="slate.7">
                      No condition
                    </Text>
                    <Text fz={12} c="slate.5">
                      Every application above gets this product directly.
                    </Text>
                  </Box>
                  <Button size="xs" radius="md" variant="light" color="brand" leftSection={<IconPlus size={13} />} onClick={() => onEditRow({ join: "AND", groups: [newGroup()] })}>
                    Add condition
                  </Button>
                </Group>
              )}
            </Box>

            <Box px={14} py={10} style={{ borderRadius: 10, background: "var(--mantine-color-brand-0)", borderLeft: "3px solid var(--mantine-color-brand-5)", flexShrink: 0 }}>
                            <RuleSummary row={editing.row} loanTypeOptions={loanTypeOptions} />
            </Box>
          </Stack>

          <Group justify="space-between" align="center" px={24} py={14} style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
            <Text
              fz={12.5}
              c={saveError || (editing.attempted && editingError) ? "danger.6" : editingChanged ? "brand.6" : "slate.5"}
              fw={saveError || (editing.attempted && editingError) ? 600 : 400}
            >
              {saveError ?? (editing.attempted && editingError ? editingError : editingChanged ? "Unsaved changes" : "No changes yet")}
            </Text>
            <Group gap="xs">
              <Button size="sm" variant="subtle" color="slate" radius="md" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                radius="md"
                px="lg"
                loading={saving}
                disabled={!editingChanged}
                onClick={onSave}
                style={
                  editingChanged
                    ? { background: theme.other?.brandGradient, boxShadow: theme.other?.brandGlowShadowSm }
                    : { background: "var(--mantine-color-brand-1)", color: "var(--mantine-color-brand-4)" }
                }
              >
                {editing.mode === "add" ? "Add rule" : "Save rule"}
              </Button>
            </Group>
          </Group>
        </>
      )}
    </Modal>
  );
}

