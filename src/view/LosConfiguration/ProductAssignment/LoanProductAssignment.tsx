import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Box,
  Button,
  CheckIcon,
  Chip,
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
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAffiliate,
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
import { ModalFooter } from "../../../components/shared/ModalFooter";
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
  newClause,
  operatorsFor,
  orBlocks,
  productByCode,
  productsFor,
  rowError,
  uid,
  variableByName,
  type AssignmentRow,
  type Clause,
  type Fallback,
  type Joiner,
  type MatchMode,
  type Operator,
} from "./shared";

interface Config {
  rows: AssignmentRow[];
  matchMode: MatchMode;
  fallback: Fallback;
}

const c = (variable: string, operator: Operator, value: string, joiner: Joiner = "AND"): Clause => ({ id: uid(), joiner, variable, operator, value });

const SEED: Config = {
  matchMode: "first",
  fallback: "manual",
  rows: [
    { id: "r1", sources: ["Branch"], loanTypes: ["Personal"], clauses: [c("customer_type", "=", "Staff")], productCode: "PL-STF" },
    {
      id: "r2",
      sources: ["Branch", "Online Portal"],
      loanTypes: ["Personal"],
      clauses: [c("employment_type", "=", "Salaried"), c("net_monthly_income", ">=", "15000")],
      productCode: "PL-SAL",
    },
    {
      id: "r3",
      sources: ["Branch"],
      loanTypes: ["Personal"],
      clauses: [c("employment_type", "=", "Self-employed"), c("employment_type", "=", "Business owner", "OR")],
      productCode: "PL-SE",
    },
    {
      id: "r4",
      sources: ["Mobile Banking", "USSD"],
      loanTypes: ["Personal"],
      clauses: [c("employment_type", "=", "Salaried"), c("credit_score", ">=", "700")],
      productCode: "PL-SAL",
    },
    {
      id: "r5",
      sources: ["Mobile Banking"],
      loanTypes: ["Personal"],
      clauses: [c("employment_type", "=", "Self-employed"), c("credit_score", ">=", "650")],
      productCode: "PL-SE",
    },
    {
      id: "r6",
      sources: ["Branch", "Third Party"],
      loanTypes: ["Business"],
      clauses: [c("years_in_business", ">=", "2"), c("loan_amount", "<=", "5000000")],
      productCode: "SME-WC",
    },
    { id: "r7", sources: ["Branch"], loanTypes: ["Business"], clauses: [c("years_in_business", ">=", "3"), c("loan_amount", ">", "5000000")], productCode: "SME-TL" },
    { id: "r8", sources: ["Branch", "Third Party"], loanTypes: ["Auto"], clauses: [c("vehicle_condition", "=", "New")], productCode: "AL-NEW" },
    { id: "r9", sources: ["Branch"], loanTypes: ["Auto"], clauses: [c("vehicle_condition", "=", "Used"), c("tenor", "<=", "48")], productCode: "AL-USED" },
    { id: "r10", sources: ["Third Party"], loanTypes: ["Auto"], clauses: [], productCode: "AL-USED" },
    {
      id: "r11",
      sources: ["Third Party"],
      loanTypes: ["Mortgage"],
      clauses: [c("customer_type", "=", "Existing customer"), c("loan_amount", "<=", "1500000")],
      productCode: "HL-TOP",
    },
    { id: "r12", sources: [...SOURCES], loanTypes: ["Mortgage"], clauses: [], productCode: "HL-PUR" },
    { id: "r13", sources: ["Mobile Banking", "Online Portal"], loanTypes: ["Education"], clauses: [], productCode: "EDU-01" },
  ],
};

type RowKind = "all" | "conditional" | "direct";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

// Modal inputs one step smaller than the theme default, to keep the form compact.
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

const JOINER_COLOR: Record<Joiner, string> = { AND: "var(--mantine-color-brand-7)", OR: "var(--mantine-color-orange-8)" };

const SOURCE_ICON: Record<string, Icon> = {
  Branch: IconBuildingBank,
  "Mobile Banking": IconDeviceMobile,
  "Online Portal": IconWorldWww,
  USSD: IconHash,
  "Third Party": IconAffiliate,
};

// Each loan type keeps one colour everywhere, so a column of loan types can be scanned at a glance.
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

// One-line summary of a multi-value cell: "Branch +2", or "All sources" when everything is picked.
function PickerSummary({ kind, values }: { kind: PickerKind; values: string[] }) {
  const { options, allLabel } = PICKER[kind];
  const ordered = options.filter((o) => values.includes(o));
  const more =
    ordered.length > 1 && ordered.length < options.length ? (
      <Tooltip label={ordered.join(", ")} withinPortal openDelay={200}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            lineHeight: "18px",
            padding: "0 6px",
            borderRadius: 999,
            flexShrink: 0,
            color: "var(--mantine-color-slate-6)",
            background: "var(--mantine-color-white)",
            border: "1px solid var(--mantine-color-slate-2)",
          }}
        >
          +{ordered.length - 1}
        </span>
      </Tooltip>
    ) : null;

  if (ordered.length === options.length) {
    return (
      <Group gap={6} wrap="nowrap">
        <Box
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--mantine-color-brand-0)",
            color: "var(--mantine-color-brand-6)",
            flexShrink: 0,
          }}
        >
          <IconStack2 size={12} />
        </Box>
        <Text fz={11.5} fw={600} c="brand.8">
          {allLabel}
        </Text>
      </Group>
    );
  }

  if (kind === "loanType") {
    const tone = LOAN_TONE[ordered[0]] ?? "slate";
    return (
      <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: "20px",
            padding: "0 8px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            color: `var(--mantine-color-${tone}-8)`,
            background: `var(--mantine-color-${tone}-0)`,
          }}
        >
          <OptionMark kind="loanType" value={ordered[0]} />
          {ordered[0]}
        </span>
        {more}
      </Group>
    );
  }

  return (
    <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
      <OptionMark kind="source" value={ordered[0]} />
      <Text fz={11.5} fw={600} c="slate.8" truncate>
        {ordered[0]}
      </Text>
      {more}
    </Group>
  );
}

// Same checkbox look as the shared FilterMultiSelect, so every multi-select on the page reads the same.
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

// Click-to-edit multi-select for a table cell. It reads as plain text until hovered, and its clicks
// never reach the row, which opens the full rule on click.
function InlinePicker({ kind, value, onChange }: { kind: PickerKind; value: string[]; onChange: (value: string[]) => void }) {
  const { options, label } = PICKER[kind];
  const all = value.length === options.length;
  const toggle = (item: string) => onChange(options.filter((o) => (o === item ? !value.includes(o) : value.includes(o))));

  return (
    <Box onClick={(e) => e.stopPropagation()} style={{ minWidth: 0, flex: 1 }}>
      <Popover position="bottom-start" width={236} shadow="md" radius="md" withinPortal>
        <Popover.Target>
          <UnstyledButton className="pa-cell" aria-label={`Edit ${label.toLowerCase()}`}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              {value.length === 0 ? (
                <Text fz={11.5} fw={600} c="danger.6">
                  Choose {label.toLowerCase()}
                </Text>
              ) : (
                <PickerSummary kind={kind} values={value} />
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

// Click-to-edit product for a table cell: code and name, grouped by loan type when the rule has several.
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

function ConditionSummary({ clauses }: { clauses: Clause[] }) {
  if (clauses.length === 0) {
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
      {clauses.map((cl, i) => (
        <Fragment key={cl.id}>
          {i > 0 && (
            <Text span fz={11.5} fw={700} c={cl.joiner === "AND" ? "brand.7" : "orange.8"}>
              {` ${cl.joiner.toLowerCase()} `}
            </Text>
          )}
          {clauseText(cl)}
        </Fragment>
      ))}
    </Text>
  );
}

function ConditionEditor({ clauses, onChange }: { clauses: Clause[]; onChange: (clauses: Clause[]) => void }) {
  const set = (id: string, patch: Partial<Clause>) => onChange(clauses.map((cl) => (cl.id === id ? { ...cl, ...patch } : cl)));

  if (clauses.length === 0) {
    return (
      <Text fz={12} c="slate.5" py={6}>
        None — every matching application gets the product directly.
      </Text>
    );
  }

  return (
    <Stack gap={6}>
      {orBlocks(clauses).map((block, bi) => (
        <Fragment key={block[0].id}>
          {block.map((clause, ci) => {
            const variable = variableByName(clause.variable);
            const first = bi === 0 && ci === 0;
            const joiner = ci === 0 ? "OR" : "AND";
            return (
              <Group key={clause.id} gap={6} wrap="nowrap">
                <Box w={34} style={{ flexShrink: 0, textAlign: "center" }}>
                  {first ? (
                    <Text fz={11} fw={800} c="slate.4">
                      IF
                    </Text>
                  ) : (
                    <Tooltip label={`Switch to ${joiner === "AND" ? "OR" : "AND"}`} openDelay={400}>
                      <UnstyledButton
                        onClick={() => set(clause.id, { joiner: joiner === "AND" ? "OR" : "AND" })}
                        aria-label={`${joiner}, click to switch`}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: JOINER_COLOR[joiner],
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: joiner === "AND" ? "var(--mantine-color-brand-0)" : "var(--mantine-color-orange-0)",
                        }}
                      >
                        {joiner}
                      </UnstyledButton>
                    </Tooltip>
                  )}
                </Box>
                <Select
                  aria-label="Variable"
                  placeholder="Variable"
                  data={VARIABLES.map((v) => ({ value: v.name, label: v.label }))}
                  value={clause.variable || null}
                  onChange={(v) => {
                    if (!v) return;
                    const allowed = operatorsFor(variableByName(v)).some((o) => o.value === clause.operator);
                    set(clause.id, { variable: v, operator: allowed ? clause.operator : "=", value: "" });
                  }}
                  allowDeselect={false}
                  searchable
                  styles={FIELD}
                  style={{ flex: "1 1 180px", minWidth: 0 }}
                />
                <Select
                  aria-label="Operator"
                  data={operatorsFor(variable)}
                  value={clause.operator}
                  onChange={(v) => v && set(clause.id, { operator: v as Operator })}
                  allowDeselect={false}
                  styles={{ input: { ...FIELD.input, fontWeight: 600, color: "var(--mantine-color-brand-7)" } }}
                  style={{ width: 136, flexShrink: 0 }}
                />
                {variable?.options ? (
                  <Select
                    aria-label="Value"
                    placeholder="Value"
                    data={variable.options}
                    value={clause.value || null}
                    onChange={(v) => set(clause.id, { value: v ?? "" })}
                    allowDeselect={false}
                    styles={FIELD}
                    style={{ flex: "1 1 150px", minWidth: 0 }}
                  />
                ) : (
                  <NumberInput
                    aria-label="Value"
                    placeholder="Value"
                    value={clause.value}
                    onChange={(v) => set(clause.id, { value: String(v) })}
                    hideControls
                    thousandSeparator=","
                    disabled={!variable}
                    styles={FIELD}
                    style={{ flex: "1 1 150px", minWidth: 0 }}
                  />
                )}
                <ActionIcon variant="subtle" color="slate" radius="xl" onClick={() => onChange(clauses.filter((cl) => cl.id !== clause.id))} aria-label="Remove">
                  <IconX size={15} />
                </ActionIcon>
              </Group>
            );
          })}
        </Fragment>
      ))}
    </Stack>
  );
}

// One line of the rule form: a fixed label column on the left, the field on the right.
function FormRow({ label, children, align = "center" }: { label: string; children: ReactNode; align?: "center" | "flex-start" }) {
  return (
    <Group gap="md" wrap="nowrap" align={align}>
      <Text fz={11.5} fw={600} c="slate.6" w={76} style={{ flexShrink: 0, paddingTop: align === "flex-start" ? 7 : 0 }}>
        {label}
      </Text>
      <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Group>
  );
}

function ChipPicker({ kind, value, onChange }: { kind: PickerKind; value: string[]; onChange: (value: string[]) => void }) {
  const { options, label: plural } = PICKER[kind];
  const all = value.length === options.length;
  return (
    <Group gap={6} wrap="nowrap">
      <Chip.Group multiple value={value} onChange={(v) => onChange(options.filter((o) => v.includes(o)))}>
        <Group gap={5}>
          {options.map((o) => (
            <Chip key={o} value={o} size="xs" variant="light" color={kind === "loanType" ? LOAN_TONE[o] : "brand"} radius="xl" aria-label={`${plural}: ${o}`}>
              <Group gap={6} wrap="nowrap">
                {kind === "source" ? (() => {
                  const SourceIcon = SOURCE_ICON[o] ?? IconBuildingBank;
                  return <SourceIcon size={12} stroke={1.8} />;
                })() : <OptionMark kind="loanType" value={o} />}
                {o}
              </Group>
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      <UnstyledButton onClick={() => onChange(all ? [] : [...options])} style={{ fontSize: 11, fontWeight: 600, color: "var(--mantine-color-brand-6)", marginLeft: 2 }}>
        {all ? "Clear" : "All"}
      </UnstyledButton>
    </Group>
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
  // The rule open in the modal; written to the list only on save.
  const [editing, setEditing] = useState<{ mode: "add" | "edit"; row: AssignmentRow; attempted: boolean } | null>(null);
  // Drag starts from the grip only, so clicking a row still opens it.
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
          (kind === "all" || (kind === "direct") === (r.clauses.length === 0))
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
  const errorCount = rows.filter((r) => rowError(r)).length;

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  // Products belong to a loan type, so a product whose loan type is removed is cleared.
  const fitsProduct = (loanTypes: string[], code: string) => (productsFor(loanTypes).some((p) => p.code === code) ? code : "");
  const changeRowLoanTypes = (row: AssignmentRow, loanTypes: string[]) => updateRow(row.id, { loanTypes, productCode: fitsProduct(loanTypes, row.productCode) });

  const openAdd = () =>
    setEditing({
      mode: "add",
      attempted: false,
      row: { id: uid(), sources: [...sourceFilter], loanTypes: [...loanTypeFilter], clauses: [], productCode: "" },
    });

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

  // Dropping on a row takes its place: rows moving down land after it, rows moving up land before it.
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

  return (
    <Stack gap="md" p="lg">
      <style>{`
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other?.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-row .pa-grip { opacity: 0.3; transition: opacity 120ms ease; }
        .lms-row:hover .pa-grip { opacity: 0.9; }
        .pa-cell { display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0; height: 30px; padding: 0 6px; border-radius: 8px; transition: background-color 120ms ease, box-shadow 120ms ease; }
        .pa-cell .pa-chev { flex-shrink: 0; opacity: 0; color: var(--mantine-color-slate-5); transition: opacity 120ms ease; }
        .pa-cell:hover, .pa-cell[aria-expanded="true"] { background: var(--mantine-color-white); box-shadow: 0 0 0 1px var(--mantine-color-slate-2); }
        .pa-cell:hover .pa-chev, .pa-cell[aria-expanded="true"] .pa-chev { opacity: 1; }
        .pa-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px; border-radius: 8px; transition: background-color 100ms ease; }
        .pa-option:hover { background: var(--mantine-color-slate-0); }
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
          <Button size="sm" radius="xl" variant="default" leftSection={<IconPlus size={14} />} onClick={openAdd}>
            Add rule
          </Button>
          {dirty && (
            <Button size="sm" radius="xl" variant="default" onClick={() => setDraft(saved)}>
              Discard
            </Button>
          )}
          <Tooltip label={`Fix ${errorCount} ${errorCount === 1 ? "rule" : "rules"} first`} disabled={errorCount === 0} withinPortal>
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
          <Group gap="sm" ml="auto" wrap="nowrap">
            <Group gap={6} wrap="nowrap">
              <Text fz={12} c="slate.6">
                Assign
              </Text>
              <Select
                size="sm"
                radius="xl"
                w={150}
                aria-label="When several rules match"
                data={MATCH_MODES}
                value={draft.matchMode}
                onChange={(v) => v && setDraft((d) => ({ ...d, matchMode: v as MatchMode }))}
                allowDeselect={false}
                rightSection={chevronDown}
                comboboxProps={{ withinPortal: true }}
                styles={{ input: { fontSize: 12.5, height: 34, minHeight: 34 } }}
              />
            </Group>
            <Group gap={6} wrap="nowrap">
              <Text fz={12} c="slate.6">
                If nothing matches
              </Text>
              <Select
                size="sm"
                radius="xl"
                w={140}
                aria-label="If nothing matches"
                data={FALLBACKS}
                value={draft.fallback}
                onChange={(v) => v && setDraft((d) => ({ ...d, fallback: v as Fallback }))}
                allowDeselect={false}
                rightSection={chevronDown}
                comboboxProps={{ withinPortal: true }}
                styles={{ input: { fontSize: 12.5, height: 34, minHeight: 34 } }}
              />
            </Group>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Table.ScrollContainer minWidth={980}>
          <Table w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 5px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 228 }} />
              <col style={{ width: 150 }} />
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
                  const stripe = error ? "danger" : shadow ? "orange" : row.clauses.length === 0 ? "success" : "brand";
                  const isDropTarget = dragOver === row.id && dragging !== null && dragging !== row.id;
                  const cell = {
                    padding: "7px 10px",
                    border: "none",
                    boxShadow: isDropTarget ? "inset 0 2px 0 var(--mantine-color-brand-5), var(--mantine-shadow-xs)" : "var(--mantine-shadow-xs)",
                    verticalAlign: "middle" as const,
                  };
                  const open = () => setEditing({ mode: "edit", row, attempted: false });
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
                        <Tooltip label={conditionText(row.clauses)} disabled={row.clauses.length === 0} multiline w={380} openDelay={250} position="top-start" withinPortal>
                          <Box>
                            <ConditionSummary clauses={row.clauses} />
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
        size={740}
        padding={0}
        centered
        styles={{
          content: { display: "flex", flexDirection: "column", overflow: "hidden" },
          header: { display: "none" },
          body: { padding: 0, display: "flex", flexDirection: "column" },
        }}
      >
        {editing && (
          <>
            <Group justify="space-between" align="center" px="lg" py={10} bg="brand.6">
              <Group gap={10} wrap="nowrap">
                <ThemeIcon radius="md" size={26} variant="white" color="brand">
                  <IconRoute size={14} />
                </ThemeIcon>
                <Text fz={14} fw={700} c="white">
                  {editing.mode === "add" ? "Add rule" : "Edit rule"}
                </Text>
              </Group>
              <ActionIcon variant="subtle" color="white" radius="xl" size="sm" onClick={() => setEditing(null)} aria-label="Close">
                <IconX size={15} color="white" />
              </ActionIcon>
            </Group>

            <Stack gap={14} px="lg" py="md">
              <FormRow label="Source">
                <ChipPicker kind="source" value={editing.row.sources} onChange={(sources) => editRow({ sources })} />
              </FormRow>
              <FormRow label="Loan type">
                <ChipPicker kind="loanType" value={editing.row.loanTypes} onChange={changeLoanTypes} />
              </FormRow>
              <FormRow label="Condition" align="flex-start">
                <Stack gap={6}>
                  <ConditionEditor clauses={editing.row.clauses} onChange={(clauses) => editRow({ clauses })} />
                  <Group gap={4} ml={editing.row.clauses.length ? 34 : 0}>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="brand"
                      leftSection={<IconPlus size={12} />}
                      onClick={() => editRow({ clauses: [...editing.row.clauses, newClause("AND")] })}
                    >
                      {editing.row.clauses.length === 0 ? "Add condition" : "AND"}
                    </Button>
                    {editing.row.clauses.length > 0 && (
                      <>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="orange"
                          leftSection={<IconPlus size={12} />}
                          onClick={() => editRow({ clauses: [...editing.row.clauses, newClause("OR")] })}
                        >
                          OR
                        </Button>
                        <Button size="compact-xs" variant="subtle" color="slate" onClick={() => editRow({ clauses: [] })} ml="auto">
                          Remove condition
                        </Button>
                      </>
                    )}
                  </Group>
                </Stack>
              </FormRow>
              <FormRow label="Product">
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
                  leftSectionWidth={modalProduct ? 70 : undefined}
                  leftSectionPointerEvents="none"
                  renderOption={({ option }) => (
                    <Group gap={8} wrap="nowrap">
                      <Text fz={10} fw={700} c="brand.8" w={56} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                        {option.value}
                      </Text>
                      <Text fz={12.5}>{option.label}</Text>
                    </Group>
                  )}
                  styles={{ input: { ...FIELD.input, paddingLeft: modalProduct ? 72 : 10, fontWeight: 600 } }}
                  w={320}
                />
              </FormRow>
            </Stack>

            <ModalFooter
              variant="theme"
              onClose={() => setEditing(null)}
              submitLabel={editing.mode === "add" ? "Add rule" : "Save rule"}
              errorMessage={editing.attempted && editingError ? editingError : undefined}
              onSubmit={saveRule}
            />
          </>
        )}
      </Modal>
    </Stack>
  );
}

export default LoanProductAssignment;
