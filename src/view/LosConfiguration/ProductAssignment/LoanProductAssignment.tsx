import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CheckIcon,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAdjustmentsHorizontal,
  IconAffiliate,
  IconArrowRight,
  IconBuildingBank,
  IconCheck,
  IconChevronDown,
  IconDeviceMobile,
  IconGripVertical,
  IconHash,
  IconPencil,
  IconPlus,
  IconRoute,
  IconShieldCog,
  IconStack2,
  IconTrash,
  IconWorldWww,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import { showSuccess } from "../../../utils/alert";
import {
  FALLBACKS,
  LOAN_TYPES,
  MATCH_MODES,
  SOURCES,
  VARIABLES,
  clauseText,
  conditionText,
  isShadowed,
  hasCondition,
  newClause,
  newGroup,
  operatorsFor,
  productByCode,
  productsFor,
  rowError,
  uid,
  variableByName,
  type AssignmentRow,
  type Clause,
  type ConditionGroup,
  type Fallback,
  type Joiner,
  type MatchMode,
  type Operator,
} from "./shared";

interface Config {
  rows: AssignmentRow[];
  matchMode: MatchMode;
  fallback: Fallback;
  defaultProduct: string;
}

const c = (variable: string, operator: Operator, value: string): Clause => ({ id: uid(), variable, operator, value });
const g = (join: Joiner, ...clauses: Clause[]): ConditionGroup => ({ id: uid(), name: "", join, clauses });
const named = (name: string, group: ConditionGroup): ConditionGroup => ({ ...group, name });

const SEED: Config = {
  matchMode: "first",
  fallback: "manual",
  defaultProduct: "",
  rows: [
    { id: "r1", sources: ["Branch"], loanTypes: ["Personal"], join: "AND", groups: [g("AND", c("customer_type", "=", "Staff"))], productCode: "PL-STF" },
    {
      id: "r2",
      sources: ["Branch", "Online Portal"],
      loanTypes: ["Personal"],
      join: "AND",
      groups: [g("AND", c("employment_type", "=", "Salaried"), c("net_monthly_income", ">=", "15000"))],
      productCode: "PL-SAL",
    },
    {
      id: "r3",
      sources: ["Branch"],
      loanTypes: ["Personal"],
      join: "AND",
      groups: [g("OR", c("employment_type", "=", "Self-employed"), c("employment_type", "=", "Business owner"))],
      productCode: "PL-SE",
    },
    {
      id: "r4",
      sources: ["Mobile Banking", "USSD"],
      loanTypes: ["Personal"],
      join: "AND",
      groups: [
        named("Employment", g("OR", c("employment_type", "=", "Salaried"), c("employment_type", "=", "Pensioner"))),
        named("Credit profile", g("OR", c("credit_score", ">=", "700"), c("customer_type", "=", "Existing customer"))),
      ],
      productCode: "PL-SAL",
    },
    {
      id: "r5",
      sources: ["Mobile Banking"],
      loanTypes: ["Personal"],
      join: "AND",
      groups: [g("AND", c("employment_type", "=", "Self-employed"), c("credit_score", ">=", "650"))],
      productCode: "PL-SE",
    },
    {
      id: "r6",
      sources: ["Branch", "Third Party"],
      loanTypes: ["Business"],
      join: "AND",
      groups: [g("AND", c("years_in_business", ">=", "2"), c("loan_amount", "<=", "5000000"))],
      productCode: "SME-WC",
    },
    {
      id: "r7",
      sources: ["Branch"],
      loanTypes: ["Business"],
      join: "AND",
      groups: [
        named("Business profile", g("OR", c("years_in_business", ">=", "3"), c("customer_type", "=", "Existing customer"))),
        named("Loan size", g("AND", c("loan_amount", ">", "2000000"))),
      ],
      productCode: "SME-TL",
    },
    { id: "r8", sources: ["Branch", "Third Party"], loanTypes: ["Auto"], join: "AND", groups: [g("AND", c("vehicle_condition", "=", "New"))], productCode: "AL-NEW" },
    {
      id: "r9",
      sources: ["Branch"],
      loanTypes: ["Auto"],
      join: "AND",
      groups: [g("AND", c("vehicle_condition", "=", "Used"), c("tenor", "<=", "48"))],
      productCode: "AL-USED",
    },
    { id: "r10", sources: ["Third Party"], loanTypes: ["Auto"], join: "AND", groups: [], productCode: "AL-USED" },
    {
      id: "r11",
      sources: ["Third Party"],
      loanTypes: ["Mortgage"],
      join: "AND",
      groups: [g("AND", c("customer_type", "=", "Existing customer"), c("loan_amount", "<=", "1500000"))],
      productCode: "HL-TOP",
    },
    { id: "r12", sources: [...SOURCES], loanTypes: ["Mortgage"], join: "AND", groups: [], productCode: "HL-PUR" },
    { id: "r13", sources: ["Mobile Banking", "Online Portal"], loanTypes: ["Education"], join: "AND", groups: [], productCode: "EDU-01" },
  ],
};

type RowKind = "all" | "conditional" | "direct";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const FIELD = { input: { height: 30, minHeight: 30, fontSize: 12.5, paddingLeft: 10 } };

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

const codeBadge = {
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

const LOAN_TONE: Record<string, string> = { Personal: "brand", Business: "info", Auto: "orange", Mortgage: "teal", Education: "grape" };

type PickerKind = "source" | "loanType";

const PICKER = {
  source: { options: SOURCES, label: "Sources", allLabel: "All sources" },
  loanType: { options: LOAN_TYPES, label: "Loan types", allLabel: "All loan types" },
};

function OptionMark({ kind, value, size = 20 }: { kind: PickerKind; value: string; size?: number }) {
  if (kind === "loanType") {
    return <Box style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: `var(--mantine-color-${LOAN_TONE[value] ?? "slate"}-5)` }} />;
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

function PickerSummary({ kind, values, grid = true }: { kind: PickerKind; values: string[]; grid?: boolean }) {
  const { options, allLabel } = PICKER[kind];
  const ordered = options.filter((o) => values.includes(o));

  if (ordered.length === options.length) {
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
          const tone = LOAN_TONE[o] ?? "slate";
          return (
            <span key={o} style={{ ...chipBase, paddingLeft: 8, color: `var(--mantine-color-${tone}-8)`, background: `var(--mantine-color-${tone}-0)` }}>
              <OptionMark kind="loanType" value={o} />
              {o}
            </span>
          );
        }
        return (
          <span key={o} style={{ ...chipBase, color: "var(--mantine-color-slate-8)", background: "var(--mantine-color-slate-1)" }}>
            <OptionMark kind="source" value={o} size={16} />
            {o}
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

function InlinePicker({ kind, value, onChange, field }: { kind: PickerKind; value: string[]; onChange: (value: string[]) => void; field?: boolean }) {
  const { options, label } = PICKER[kind];
  const all = value.length === options.length;
  const toggle = (item: string) => onChange(options.filter((o) => (o === item ? !value.includes(o) : value.includes(o))));

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
                <PickerSummary kind={kind} values={value} grid={!field} />
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
            onClick={() => onChange(all ? [] : [...options])}
          >
            <CheckMark checked={all} indeterminate={value.length > 0 && !all} />
            <Text fz={12} fw={600} c="slate.8" style={{ flex: 1 }}>
              Select all {label.toLowerCase()}
            </Text>
            <Text fz={10.5} c="slate.5">
              {value.length}/{options.length}
            </Text>
          </UnstyledButton>
          <Box my={4} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }} />
          <Stack gap={1}>
            {options.map((o) => {
              const on = value.includes(o);
              return (
                <UnstyledButton key={o} onClick={() => toggle(o)} role="checkbox" aria-checked={on} className="pa-option">
                  <CheckMark checked={on} />
                  <OptionMark kind={kind} value={o} />
                  <Text fz={12.5} fw={on ? 600 : 500} c={on ? "slate.8" : "slate.7"} style={{ flex: 1 }}>
                    {o}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
}

function ProductPicker({ loanTypes, value, onChange }: { loanTypes: string[]; value: string; onChange: (code: string) => void }) {
  const [opened, setOpened] = useState(false);
  const product = productByCode(value);
  const products = productsFor(loanTypes);
  const groups = loanTypes.map((lt) => ({ loanType: lt, items: products.filter((p) => p.loanType === lt) })).filter((g) => g.items.length > 0);
  const disabled = loanTypes.length === 0;

  return (
    <Box onClick={(e) => e.stopPropagation()} style={{ minWidth: 0 }}>
      <Popover opened={opened} onChange={setOpened} position="bottom-start" width={290} shadow="md" radius="md" withinPortal disabled={disabled}>
        <Popover.Target>
          <UnstyledButton className="pa-cell" aria-label="Edit product" onClick={() => setOpened((o) => !o)} aria-expanded={opened} disabled={disabled}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              {product ? (
                <Group gap={8} wrap="nowrap">
                  <span style={codeBadge}>{product.code}</span>
                  <Text fz={11.5} fw={600} c="slate.8" truncate>
                    {product.name}
                  </Text>
                </Group>
              ) : (
                <Text fz={11.5} fw={600} c={disabled ? "slate.4" : "danger.6"}>
                  {disabled ? "Pick a loan type first" : "Choose product"}
                </Text>
              )}
            </Box>
            <IconChevronDown className="pa-chev" size={13} />
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p={6}>
          <Stack gap={2}>
            {groups.map((g) => (
              <Fragment key={g.loanType}>
                {groups.length > 1 && (
                  <Group gap={6} px={8} pt={6} pb={2}>
                    <OptionMark kind="loanType" value={g.loanType} />
                    <Text fz={10} fw={700} c="slate.5" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {g.loanType}
                    </Text>
                  </Group>
                )}
                {g.items.map((p) => {
                  const on = p.code === value;
                  return (
                    <UnstyledButton
                      key={p.code}
                      className="pa-option"
                      aria-pressed={on}
                      onClick={() => {
                        onChange(p.code);
                        setOpened(false);
                      }}
                      style={{ background: on ? "var(--mantine-color-brand-0)" : undefined }}
                    >
                      <span style={{ ...codeBadge, minWidth: 58, textAlign: "center" }}>{p.code}</span>
                      <Text fz={12.5} fw={on ? 600 : 500} c={on ? "slate.8" : "slate.7"} style={{ flex: 1 }}>
                        {p.name}
                      </Text>
                      {on && <IconCheck size={14} color="var(--mantine-color-brand-6)" />}
                    </UnstyledButton>
                  );
                })}
              </Fragment>
            ))}
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

function ConditionText({ row }: { row: Pick<AssignmentRow, "join" | "groups"> }) {
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

function ConditionSummary({ row }: { row: AssignmentRow }) {
  if (!hasCondition(row)) {
    return (
      <Group gap={8} wrap="nowrap">
        <Text fz={10} fw={700} c="success.8" px={7} py={1} style={{ background: "var(--mantine-color-success-0)", borderRadius: 4, flexShrink: 0 }}>
          ALWAYS
        </Text>
        <Text fz={11.5} c="slate.5" truncate>
          No condition — direct mapping
        </Text>
      </Group>
    );
  }
  return (
    <Text fz={11.5} c="slate.8" lineClamp={1}>
      <ConditionText row={row} />
    </Text>
  );
}

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

function RuleSummary({ row }: { row: AssignmentRow }) {
  const product = productByCode(row.productCode);
  const strong = (text: ReactNode) => (
    <Text span inherit fw={600} c="slate.9">
      {text}
    </Text>
  );
  const loanList = joinWords(row.loanTypes);
  const sources = row.sources.length === SOURCES.length ? "any source" : joinWords(row.sources);
  const loanTypes = row.loanTypes.length === LOAN_TYPES.length ? "any loan type" : `${/^[AEIOU]/.test(loanList) ? "an" : "a"} ${loanList} loan`;
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
      get {product ? strong(`${product.name} (${product.code})`) : strong("…")}.
    </Text>
  );
}

export function LoanProductAssignment() {
  const theme = useMantineTheme();
  const [saved, setSaved] = useState<Config>(SEED);
  const [draft, setDraft] = useState<Config>(SEED);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [loanTypeFilter, setLoanTypeFilter] = useState<string[]>([]);
  const [kind, setKind] = useState<RowKind>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [editing, setEditing] = useState<{ mode: "add" | "edit"; row: AssignmentRow; original: string; attempted: boolean } | null>(null);
  const [dragArmed, setDragArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const { rows } = draft;
  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (sourceFilter.length === 0 || r.sources.some((v) => sourceFilter.includes(v))) &&
          (loanTypeFilter.length === 0 || r.loanTypes.some((v) => loanTypeFilter.includes(v))) &&
          (kind === "all" || (kind === "direct") === !hasCondition(r))
      ),
    [rows, sourceFilter, loanTypeFilter, kind]
  );

  const totalRows = visible.length;
  const { pageSize } = pagination;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const pageRows = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const defaultMissing = draft.fallback === "default" && !productByCode(draft.defaultProduct);
  const errorCount = rows.filter((r) => rowError(r)).length + (defaultMissing ? 1 : 0);

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const fitsProduct = (loanTypes: string[], code: string) => (productsFor(loanTypes).some((p) => p.code === code) ? code : "");
  const changeRowLoanTypes = (row: AssignmentRow, loanTypes: string[]) => updateRow(row.id, { loanTypes, productCode: fitsProduct(loanTypes, row.productCode) });

  const openAdd = () => {
    const row: AssignmentRow = { id: uid(), sources: [...sourceFilter], loanTypes: [...loanTypeFilter], join: "AND", groups: [], productCode: "" };
    setEditing({ mode: "add", attempted: false, row, original: JSON.stringify(row) });
  };

  const editRow = (patch: Partial<AssignmentRow>) => setEditing((e) => e && { ...e, row: { ...e.row, ...patch } });

  const changeLoanTypes = (loanTypes: string[]) => setEditing((e) => e && { ...e, row: { ...e.row, loanTypes, productCode: fitsProduct(loanTypes, e.row.productCode) } });

  const editingError = editing ? rowError(editing.row) : null;

  const saveRule = () => {
    if (!editing) return;
    if (editingError) {
      setEditing({ ...editing, attempted: true });
      return;
    }
    const { mode, row } = editing;
    setDraft((d) => ({ ...d, rows: mode === "add" ? [row, ...d.rows] : d.rows.map((r) => (r.id === row.id ? row : r)) }));
    if (mode === "add") {
      setKind("all");
      resetPage();
    }
    setEditing(null);
  };

  const moveRow = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setDraft((d) => {
      const from = d.rows.findIndex((r) => r.id === fromId);
      const to = d.rows.findIndex((r) => r.id === toId);
      const next = [...d.rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...d, rows: next };
    });
  };

  const endDrag = () => {
    if (dragging && dragOver) moveRow(dragging, dragOver);
    setDragging(null);
    setDragOver(null);
    setDragArmed(null);
  };

  const save = () => {
    setSaved(draft);
    showSuccess(`${rows.length} ${rows.length === 1 ? "rule" : "rules"} in effect for new applications.`, "Product rules saved");
  };

  const modalProducts = editing ? productsFor(editing.row.loanTypes) : [];
  const modalProductData =
    editing && editing.row.loanTypes.length > 1
      ? editing.row.loanTypes
          .map((lt) => ({ group: lt, items: modalProducts.filter((p) => p.loanType === lt).map((p) => ({ value: p.code, label: p.name })) }))
          .filter((g) => g.items.length > 0)
      : modalProducts.map((p) => ({ value: p.code, label: p.name }));
  const modalProduct = editing ? productByCode(editing.row.productCode) : undefined;
  const editingChanged = editing ? JSON.stringify(editing.row) !== editing.original : false;

  return (
    <Stack gap="md" p="lg">
      <style>{`
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other?.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-row .pa-grip { opacity: 0.3; transition: opacity 120ms ease; }
        .lms-row:hover .pa-grip { opacity: 0.9; }
        .pa-cell { position: relative; display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0; min-height: 30px; padding: 3px 6px; border-radius: 8px; transition: background-color 120ms ease, box-shadow 120ms ease; }
        .pa-cell .pa-chev { position: absolute; right: 6px; top: 50%; margin-top: -6.5px; padding: 1px; border-radius: 4px; background: var(--mantine-color-white); opacity: 0; color: var(--mantine-color-slate-5); transition: opacity 120ms ease; }
        .pa-cell:hover, .pa-cell[aria-expanded="true"] { background: var(--mantine-color-white); box-shadow: 0 0 0 1px var(--mantine-color-slate-2); }
        .pa-cell:hover .pa-chev, .pa-cell[aria-expanded="true"] .pa-chev { opacity: 1; }
        .pa-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px; border-radius: 8px; transition: background-color 100ms ease; }
        .pa-option:hover { background: var(--mantine-color-slate-0); }
        .pa-field { position: relative; display: flex; align-items: center; width: 100%; min-width: 0; min-height: 32px; padding: 4px 30px 4px 6px; border: 1px solid var(--mantine-color-slate-3); border-radius: var(--mantine-radius-lg); background: var(--mantine-color-white); transition: border-color 120ms ease; }
        .pa-field:hover { border-color: var(--mantine-color-slate-4); }
        .pa-field[aria-expanded="true"] { border-color: var(--mantine-color-brand-5); }
        .pa-field .pa-chev { position: absolute; right: 10px; top: 50%; margin-top: -6.5px; color: var(--mantine-color-slate-5); }
        .pa-name input { height: 24px !important; min-height: 24px !important; padding: 0 22px 0 6px !important; border-radius: 6px !important; font-size: 12.5px !important; font-weight: 600 !important; color: var(--mantine-color-slate-8) !important; background: transparent !important; border: 1px solid transparent !important; transition: background-color 120ms ease, border-color 120ms ease; }
        .pa-name [data-position="right"] { color: var(--mantine-color-slate-4); transition: color 120ms ease; }
        .pa-name:hover [data-position="right"], .pa-name:focus-within [data-position="right"] { color: var(--mantine-color-brand-6); }
        .pa-name input::placeholder { font-weight: 400; color: var(--mantine-color-slate-4); }
        .pa-name input:hover { background: var(--mantine-color-white) !important; border-color: var(--mantine-color-slate-3) !important; }
        .pa-name input:focus { background: var(--mantine-color-white) !important; border-color: var(--mantine-color-brand-5) !important; outline: none; }
        .pa-dashed { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 24px; padding: 0 10px; border-radius: 6px; border: 1px dashed var(--mantine-color-slate-3); font-size: 11.5px; font-weight: 500; color: var(--mantine-color-slate-6); transition: border-color 120ms ease, color 120ms ease, background-color 120ms ease; }
        .pa-dashed:hover { border-color: var(--mantine-color-brand-4); color: var(--mantine-color-brand-6); background: var(--mantine-color-brand-0); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center" wrap="nowrap">
          <Box
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other?.brandGradient,
              boxShadow: theme.other?.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconShieldCog size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Product Auto Assignment
            </Title>
            <Text fz="sm" c="slate.5">
              Rules are checked from the top. Drag a rule by its handle to change priority.
            </Text>
          </Stack>
        </Group>
        <Group gap={8}>
          <Popover position="bottom-end" width={320} shadow="md" radius="md" withinPortal>
            <Popover.Target>
              <Button
                size="sm"
                radius="xl"
                variant="default"
                leftSection={<IconAdjustmentsHorizontal size={15} />}
                rightSection={
                  defaultMissing ? <Box style={{ width: 7, height: 7, borderRadius: 999, background: "var(--mantine-color-danger-6)" }} /> : undefined
                }
              >
                Matching
              </Button>
            </Popover.Target>
            <Popover.Dropdown p="md">
              <Stack gap="sm">
                <Box>
                  <Text fz={13} fw={700} c="slate.8">
                    Matching
                  </Text>
                  <Text fz={11.5} c="slate.5">
                    Applies to every rule on this page.
                  </Text>
                </Box>
                <Select
                  label="When several rules match"
                  data={MATCH_MODES}
                  value={draft.matchMode}
                  onChange={(v) => v && setDraft((d) => ({ ...d, matchMode: v as MatchMode }))}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: false }}
                  styles={{ input: FIELD.input, label: { fontSize: 12, fontWeight: 500, marginBottom: 4 } }}
                />
                <Select
                  label="If nothing matches"
                  data={FALLBACKS}
                  value={draft.fallback}
                  onChange={(v) => v && setDraft((d) => ({ ...d, fallback: v as Fallback }))}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: false }}
                  styles={{ input: FIELD.input, label: { fontSize: 12, fontWeight: 500, marginBottom: 4 } }}
                />
                {draft.fallback === "default" && (
                  <Select
                    label="Default product"
                    placeholder="Choose default product"
                    data={LOAN_TYPES.map((lt) => ({
                      group: lt,
                      items: productsFor([lt]).map((p) => ({ value: p.code, label: `${p.code} — ${p.name}` })),
                    }))}
                    value={draft.defaultProduct || null}
                    onChange={(v) => setDraft((d) => ({ ...d, defaultProduct: v ?? "" }))}
                    allowDeselect={false}
                    searchable
                    error={defaultMissing ? "Required when no rule matches" : undefined}
                    comboboxProps={{ withinPortal: false }}
                    styles={{ input: FIELD.input, label: { fontSize: 12, fontWeight: 500, marginBottom: 4 } }}
                  />
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          <Button size="sm" radius="xl" variant="default" leftSection={<IconPlus size={14} />} onClick={openAdd}>
            Add rule
          </Button>
          {dirty && (
            <Button size="sm" radius="xl" variant="default" onClick={() => setDraft(saved)}>
              Discard
            </Button>
          )}
          <Tooltip label={defaultMissing && errorCount === 1 ? "Choose the default product first" : `Fix ${errorCount} ${errorCount === 1 ? "issue" : "issues"} first`} disabled={errorCount === 0} withinPortal>
            <Box>
              <Button
                size="sm"
                radius="xl"
                disabled={!dirty || errorCount > 0}
                style={dirty && errorCount === 0 ? { background: theme.other?.brandGradient } : undefined}
                onClick={save}
              >
                Save changes
              </Button>
            </Box>
          </Tooltip>
        </Group>
      </Group>

      <Paper radius="xl" p="xs" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Group gap="sm" wrap="wrap" align="center">
          <FilterMultiSelect
            placeholder="All sources"
            data={SOURCES.map((v) => ({ value: v, label: v }))}
            value={sourceFilter}
            onChange={(v) => {
              setSourceFilter(SOURCES.filter((o) => v.includes(o)));
              resetPage();
            }}
            withSelectAll
            width={166}
          />
          <FilterMultiSelect
            placeholder="All loan types"
            data={LOAN_TYPES.map((v) => ({ value: v, label: v }))}
            value={loanTypeFilter}
            onChange={(v) => {
              setLoanTypeFilter(LOAN_TYPES.filter((o) => v.includes(o)));
              resetPage();
            }}
            withSelectAll
            width={166}
          />
          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={kind}
            onChange={(v) => {
              setKind(v as RowKind);
              resetPage();
            }}
            data={[
              { label: "All", value: "all" },
              { label: "Conditional", value: "conditional" },
              { label: "Direct mapping", value: "direct" },
            ]}
          />
          <Text fz={12} c="slate.5" ml="auto" pr="xs">
            {totalRows} of {rows.length} {rows.length === 1 ? "rule" : "rules"}
          </Text>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Table.ScrollContainer minWidth={980}>
          <Table w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 5px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 250 }} />
              <col style={{ width: 204 }} />
              <col />
              <col style={{ width: 272 }} />
              <col style={{ width: 84 }} />
            </colgroup>
            <Table.Thead>
              <Table.Tr>
                {["Source", "Loan type", "Condition", "Product", ""].map((h, i) => (
                  <Table.Th key={h || i} style={{ ...headStyle, paddingLeft: i === 0 ? 34 : 10 }}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ border: "none" }}>
                    <Stack align="center" gap="xs" py="xl">
                      <Box
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: "var(--mantine-color-white)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <IconShieldCog size={26} color="var(--mantine-color-slate-4)" />
                      </Box>
                      <Text ta="center" c="slate.5" fz={11}>
                        No rules match your filters.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                pageRows.map((row) => {
                  const error = rowError(row);
                  const shadow = !error && draft.matchMode === "first" && isShadowed(rows, rows.indexOf(row));
                  const stripe = error ? "danger" : shadow ? "orange" : !hasCondition(row) ? "success" : "brand";
                  const isDropTarget = dragOver === row.id && dragging !== null && dragging !== row.id;
                  const cell = {
                    padding: "7px 10px",
                    border: "none",
                    boxShadow: isDropTarget ? "inset 0 2px 0 var(--mantine-color-brand-5), var(--mantine-shadow-xs)" : "var(--mantine-shadow-xs)",
                    verticalAlign: "middle" as const,
                  };
                  const open = () => setEditing({ mode: "edit", row, attempted: false, original: JSON.stringify(row) });
                  return (
                    <Table.Tr
                      key={row.id}
                      className="lms-row"
                      onClick={open}
                      draggable={dragArmed === row.id}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(row.id);
                      }}
                      onDragEnter={() => dragging && setDragOver(row.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={endDrag}
                      style={{ cursor: "pointer", opacity: dragging === row.id ? 0.35 : shadow ? 0.7 : 1, transition: "opacity 120ms ease" }}
                    >
                      <Table.Td style={{ ...cell, borderLeft: `3px solid var(--mantine-color-${stripe}-4)`, paddingLeft: 4 }}>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Drag to change priority" openDelay={500}>
                            <Box
                              className="pa-grip"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={() => setDragArmed(row.id)}
                              onMouseUp={() => setDragArmed(null)}
                              aria-label="Drag to reorder"
                              style={{ cursor: "grab", display: "flex", padding: "4px 2px", color: "var(--mantine-color-brand-6)", flexShrink: 0 }}
                            >
                              <IconGripVertical size={15} />
                            </Box>
                          </Tooltip>
                          <InlinePicker kind="source" value={row.sources} onChange={(sources) => updateRow(row.id, { sources })} />
                        </Group>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <InlinePicker kind="loanType" value={row.loanTypes} onChange={(loanTypes) => changeRowLoanTypes(row, loanTypes)} />
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Tooltip label={conditionText(row)} disabled={!hasCondition(row)} multiline w={380} openDelay={250} position="top-start" withinPortal>
                          <Box>
                            <ConditionSummary row={row} />
                            {(error || shadow) && (
                              <Text fz={10} c={error ? "danger.7" : "orange.8"} mt={2} truncate>
                                {error ?? "Never used: a rule above has no condition and already covers these applications."}
                              </Text>
                            )}
                          </Box>
                        </Tooltip>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <ProductPicker loanTypes={row.loanTypes} value={row.productCode} onChange={(productCode) => updateRow(row.id, { productCode })} />
                      </Table.Td>
                      <Table.Td style={cell} onClick={(e) => e.stopPropagation()}>
                        <Group gap={2} justify="flex-end" wrap="nowrap">
                          <ActionIcon variant="subtle" color="slate" size="sm" radius="xl" onClick={open} aria-label="Edit rule">
                            <IconPencil size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="danger"
                            size="sm"
                            radius="xl"
                            onClick={() => setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== row.id) }))}
                            aria-label="Delete rule"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
            <span>{totalRows === 0 ? "Showing 0 of 0" : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                allowDeselect={false}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination total={pageCount} value={pageIndex + 1} onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))} color="brand" size="xs" radius="xl" />
        </Group>
      </Paper>

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
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
              <ActionIcon variant="subtle" color="slate" radius="xl" size="lg" onClick={() => setEditing(null)} aria-label="Close">
                <IconX size={18} />
              </ActionIcon>
            </Group>

            <Stack gap={16} px={24} py={16} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <Box>
                <Box style={{ display: "grid", gridTemplateColumns: "minmax(0, 35fr) minmax(0, 35fr) minmax(0, 30fr)", columnGap: 32, alignItems: "start" }}>
                  <Box style={{ minWidth: 0 }}>
                    <FieldLabel>Source</FieldLabel>
                    <InlinePicker field kind="source" value={editing.row.sources} onChange={(sources) => editRow({ sources })} />
                  </Box>
                  <Box style={{ minWidth: 0 }}>
                    <FieldLabel>Loan type</FieldLabel>
                    <InlinePicker field kind="loanType" value={editing.row.loanTypes} onChange={changeLoanTypes} />
                  </Box>
                  <Box style={{ minWidth: 0, position: "relative" }}>
                    <Box style={{ position: "absolute", left: -24, top: 23, height: 32, width: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mantine-color-slate-4)" }}>
                      <IconArrowRight size={16} />
                    </Box>
                    <FieldLabel>Product</FieldLabel>
                    <Select
                      aria-label="Product"
                      placeholder={editing.row.loanTypes.length ? "Select product" : "Pick a loan type first"}
                      data={modalProductData}
                      value={editing.row.productCode || null}
                      onChange={(v) => editRow({ productCode: v ?? "" })}
                      allowDeselect={false}
                      disabled={editing.row.loanTypes.length === 0}
                      searchable
                      leftSection={modalProduct ? <span style={codeBadge}>{modalProduct.code}</span> : null}
                      leftSectionWidth={modalProduct ? 76 : undefined}
                      leftSectionPointerEvents="none"
                      renderOption={({ option }) => (
                        <Group gap={8} wrap="nowrap">
                          <Text fz={10} fw={700} c="brand.8" w={56} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                            {option.value}
                          </Text>
                          <Text fz={13}>{option.label}</Text>
                        </Group>
                      )}
                      styles={{ input: { ...FIELD.input, paddingLeft: modalProduct ? 78 : 12, fontWeight: 600 } }}
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
                      <Button size="compact-xs" variant="subtle" color="danger" onClick={() => editRow({ groups: [] })}>
                        Clear condition
                      </Button>
                    ) : undefined
                  }
                />
                {hasCondition(editing.row) ? (
                  <ConditionBuilder groups={editing.row.groups} onChange={(groups) => editRow({ join: "AND", groups })} />
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
                    <Button size="xs" radius="md" variant="light" color="brand" leftSection={<IconPlus size={13} />} onClick={() => editRow({ join: "AND", groups: [newGroup()] })}>
                      Add condition
                    </Button>
                  </Group>
                )}
              </Box>

              <Box px={14} py={10} style={{ borderRadius: 10, background: "var(--mantine-color-brand-0)", borderLeft: "3px solid var(--mantine-color-brand-5)", flexShrink: 0 }}>
                <RuleSummary row={editing.row} />
              </Box>
            </Stack>

            <Group justify="space-between" align="center" px={24} py={14} style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
              <Text fz={12.5} c={editing.attempted && editingError ? "danger.6" : editingChanged ? "brand.6" : "slate.5"} fw={editing.attempted && editingError ? 600 : 400}>
                {editing.attempted && editingError ? editingError : editingChanged ? "Unsaved changes" : "No changes yet"}
              </Text>
              <Group gap="xs">
                <Button size="sm" variant="subtle" color="slate" radius="md" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  radius="md"
                  px="lg"
                  disabled={!editingChanged}
                  onClick={saveRule}
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
    </Stack>
  );
}

export default LoanProductAssignment;
