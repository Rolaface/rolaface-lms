import { Fragment, useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconBuildingBank,
  IconAffiliate,
  IconChevronDown,
  IconDeviceMobile,
  IconPlus,
  IconShieldCog,
  IconTrash,
  IconHash,
  IconWorldWww,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import { showSuccess } from "../../../utils/alert";
import {
  FALLBACKS,
  LOAN_TYPES,
  MATCH_MODES,
  SOURCES,
  VARIABLES,
  clauseText,
  conditionText,
  groupKey,
  newClause,
  operatorsFor,
  orBlocks,
  productByCode,
  productsFor,
  rowError,
  sortRows,
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
    { id: "r1", source: "Branch", loanType: "Personal", clauses: [c("customer_type", "=", "Staff")], productCode: "PL-STF" },
    { id: "r2", source: "Branch", loanType: "Personal", clauses: [c("employment_type", "=", "Salaried"), c("net_monthly_income", ">=", "15000")], productCode: "PL-SAL" },
    { id: "r3", source: "Branch", loanType: "Personal", clauses: [c("employment_type", "=", "Self-employed"), c("employment_type", "=", "Business owner", "OR")], productCode: "PL-SE" },
    { id: "r4", source: "Mobile Banking", loanType: "Personal", clauses: [c("employment_type", "=", "Salaried"), c("credit_score", ">=", "700")], productCode: "PL-SAL" },
    { id: "r5", source: "Branch", loanType: "Business", clauses: [c("years_in_business", ">=", "2"), c("loan_amount", "<=", "5000000")], productCode: "SME-WC" },
    { id: "r6", source: "Branch", loanType: "Business", clauses: [c("years_in_business", ">=", "3"), c("loan_amount", ">", "5000000")], productCode: "SME-TL" },
    { id: "r7", source: "Third Party", loanType: "Auto", clauses: [c("vehicle_condition", "=", "New")], productCode: "AL-NEW" },
    { id: "r8", source: "Third Party", loanType: "Auto", clauses: [], productCode: "AL-USED" },
    { id: "r9", source: "Online Portal", loanType: "Education", clauses: [], productCode: "EDU-01" },
    { id: "r10", source: "Mobile Banking", loanType: "Personal", clauses: [c("employment_type", "=", "Self-employed"), c("credit_score", ">=", "650")], productCode: "PL-SE" },
    { id: "r11", source: "USSD", loanType: "Personal", clauses: [c("employment_type", "=", "Salaried"), c("net_monthly_income", ">=", "20000")], productCode: "PL-SAL" },
    { id: "r12", source: "Branch", loanType: "Auto", clauses: [c("vehicle_condition", "=", "New")], productCode: "AL-NEW" },
    { id: "r13", source: "Branch", loanType: "Auto", clauses: [c("vehicle_condition", "=", "Used"), c("tenor", "<=", "48")], productCode: "AL-USED" },
    { id: "r14", source: "Third Party", loanType: "Mortgage", clauses: [c("customer_type", "=", "Existing customer"), c("loan_amount", "<=", "1500000")], productCode: "HL-TOP" },
    { id: "r15", source: "Third Party", loanType: "Mortgage", clauses: [], productCode: "HL-PUR" },
    { id: "r16", source: "Third Party", loanType: "Business", clauses: [c("years_in_business", ">=", "1"), c("loan_amount", "<=", "1000000")], productCode: "SME-WC" },
  ],
};

const SOURCE_ICON: Record<string, Icon> = {
  Branch: IconBuildingBank,
  "Mobile Banking": IconDeviceMobile,
  "Online Portal": IconWorldWww,
  USSD: IconHash,
  "Third Party": IconAffiliate,
};

type RowKind = "all" | "conditional" | "direct";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

// Row cells stay editable but read as plain text until clicked.
const CELL_INPUT = { input: { height: 30, minHeight: 30, fontSize: 12.5, paddingLeft: 6, border: "none", background: "transparent" } };

const CLAUSE_INPUT = { input: { height: 28, minHeight: 28, fontSize: 13, paddingLeft: 8, borderRadius: 6 } };

const headStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "var(--mantine-color-slate-5)",
  whiteSpace: "nowrap" as const,
  padding: "0 12px 4px",
  border: "none",
};

const JOINER_COLOR: Record<Joiner, string> = { AND: "var(--mantine-color-brand-7)", OR: "var(--mantine-color-orange-8)" };

// Selects inside the popover keep their dropdown in place, otherwise picking an option counts as an outside click.
const INLINE_DROPDOWN = { withinPortal: false };

function ConditionEditor({ clauses, onChange }: { clauses: Clause[]; onChange: (clauses: Clause[]) => void }) {
  const set = (id: string, patch: Partial<Clause>) => onChange(clauses.map((cl) => (cl.id === id ? { ...cl, ...patch } : cl)));

  if (clauses.length === 0) {
    return (
      <Text fz={12.5} c="slate.6">
        No condition. Every application for this source and loan type gets this product.
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
                <Box w={36} style={{ flexShrink: 0, textAlign: "center" }}>
                  {first ? (
                    <Text fz={11} fw={800} c="slate.4">
                      IF
                    </Text>
                  ) : (
                    <Tooltip label={`Switch to ${joiner === "AND" ? "OR" : "AND"}`} openDelay={400}>
                      <UnstyledButton
                        onClick={() => set(clause.id, { joiner: joiner === "AND" ? "OR" : "AND" })}
                        aria-label={`${joiner}, click to switch`}
                        style={{ fontSize: 11, fontWeight: 800, color: JOINER_COLOR[joiner], padding: "2px 6px", borderRadius: 4 }}
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
                  comboboxProps={INLINE_DROPDOWN}
                  styles={CLAUSE_INPUT}
                  style={{ flex: "1 1 170px", minWidth: 0 }}
                />
                <Select
                  aria-label="Operator"
                  data={operatorsFor(variable)}
                  value={clause.operator}
                  onChange={(v) => v && set(clause.id, { operator: v as Operator })}
                  allowDeselect={false}
                  comboboxProps={INLINE_DROPDOWN}
                  styles={{ input: { ...CLAUSE_INPUT.input, fontWeight: 600, color: "var(--mantine-color-brand-7)" } }}
                  style={{ width: 150, flexShrink: 0 }}
                />
                {variable?.options ? (
                  <Select
                    aria-label="Value"
                    placeholder="Value"
                    data={variable.options}
                    value={clause.value || null}
                    onChange={(v) => set(clause.id, { value: v ?? "" })}
                    allowDeselect={false}
                    comboboxProps={INLINE_DROPDOWN}
                    styles={CLAUSE_INPUT}
                    style={{ flex: "1 1 140px", minWidth: 0 }}
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
                    styles={CLAUSE_INPUT}
                    style={{ flex: "1 1 140px", minWidth: 0 }}
                  />
                )}
                <ActionIcon variant="subtle" color="slate" size="sm" onClick={() => onChange(clauses.filter((cl) => cl.id !== clause.id))} aria-label="Remove">
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            );
          })}
        </Fragment>
      ))}
    </Stack>
  );
}

function ConditionSummary({ clauses }: { clauses: Clause[] }) {
  if (clauses.length === 0) {
    return (
      <Group gap={8} wrap="nowrap">
        <Text fz={11} fw={700} c="success.8" px={8} py={1} style={{ background: "var(--mantine-color-success-0)", borderRadius: 4, flexShrink: 0 }}>
          ALWAYS
        </Text>
        <Text fz={12.5} c="slate.5" truncate>
          No condition — direct mapping
        </Text>
      </Group>
    );
  }
  return (
    <Text fz={12.5} c="slate.8" lh={1.45} lineClamp={2}>
      {clauses.map((cl, i) => (
        <Fragment key={cl.id}>
          {i > 0 && (
            <Text span fz={12.5} fw={700} c={cl.joiner === "AND" ? "brand.7" : "orange.8"}>
              {` ${cl.joiner.toLowerCase()} `}
            </Text>
          )}
          {clauseText(cl)}
        </Fragment>
      ))}
    </Text>
  );
}

export function LoanProductAssignment() {
  const theme = useMantineTheme();
  const [saved, setSaved] = useState<Config>(SEED);
  const [draft, setDraft] = useState<Config>(SEED);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [loanTypeFilter, setLoanTypeFilter] = useState<string | null>(null);
  const [kind, setKind] = useState<RowKind>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [editing, setEditing] = useState<string | null>(null);

  const { rows } = draft;
  const sorted = useMemo(() => sortRows(rows), [rows]);
  const matchesFilters = (r: AssignmentRow) =>
    (!sourceFilter || r.source === sourceFilter) &&
    (!loanTypeFilter || r.loanType === loanTypeFilter) &&
    (kind === "all" || (kind === "direct") === (r.clauses.length === 0));
  const visible = sorted.filter(matchesFilters);
  const group = (row: AssignmentRow) => sorted.filter((r) => groupKey(r) === groupKey(row));

  const totalRows = visible.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize));
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const { pageSize } = pagination;
  const pageRows = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const errorCount = rows.filter((r) => rowError(r)).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // With "first match only", a row with no condition catches everything, so rows below it never run.
  const shadowedBy = (row: AssignmentRow): number | null => {
    if (draft.matchMode !== "first") return null;
    const rowsInGroup = group(row);
    const catchAll = rowsInGroup.findIndex((r) => r.clauses.length === 0);
    return catchAll >= 0 && rowsInGroup.indexOf(row) > catchAll ? catchAll + 1 : null;
  };

  const update = (id: string, patch: Partial<AssignmentRow>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const changeLoanType = (row: AssignmentRow, loanType: string) =>
    update(row.id, { loanType, productCode: productsFor(loanType).some((p) => p.code === row.productCode) ? row.productCode : "" });

  const move = (row: AssignmentRow, delta: -1 | 1) => {
    const rowsInGroup = group(row);
    const target = rowsInGroup[rowsInGroup.indexOf(row) + delta];
    if (!target) return;
    setDraft((d) => {
      const next = [...d.rows];
      const a = next.indexOf(row);
      const b = next.indexOf(target);
      [next[a], next[b]] = [next[b], next[a]];
      return { ...d, rows: next };
    });
  };

  // New rows start as a direct mapping; jump to the page that shows it.
  const addRow = () => {
    const row: AssignmentRow = { id: uid(), source: sourceFilter ?? SOURCES[0], loanType: loanTypeFilter ?? LOAN_TYPES[0], clauses: [], productCode: "" };
    const next = [...rows, row];
    const index = sortRows(next)
      .filter((r) => (!sourceFilter || r.source === sourceFilter) && (!loanTypeFilter || r.loanType === loanTypeFilter))
      .indexOf(row);
    setDraft((d) => ({ ...d, rows: next }));
    setKind("all");
    setPagination((p) => ({ ...p, pageIndex: Math.floor(index / p.pageSize) }));
  };

  const save = () => {
    setSaved(draft);
    showSuccess(`${rows.length} ${rows.length === 1 ? "row" : "rows"} in effect for new applications.`, "Product code rules saved");
  };

  return (
    <Stack gap="md" p="lg">
      <style>{`
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other?.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
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
              Map each source and loan type to a product code. Add a condition only when the product depends on the applicant.
            </Text>
          </Stack>
        </Group>
        <Group gap={8}>
          <Button size="sm" radius="xl" variant="default" leftSection={<IconPlus size={14} />} onClick={addRow}>
            Add row
          </Button>
          {dirty && (
            <Button size="sm" radius="xl" variant="default" onClick={() => setDraft(saved)}>
              Discard
            </Button>
          )}
          <Tooltip label={`Fix ${errorCount} ${errorCount === 1 ? "row" : "rows"} first`} disabled={errorCount === 0} withinPortal>
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
          <Select
            size="sm"
            radius="xl"
            w={166}
            placeholder="All sources"
            data={SOURCES}
            value={sourceFilter}
            onChange={(v) => {
              setSourceFilter(v);
              resetPage();
            }}
            clearable
            rightSection={sourceFilter ? undefined : chevronDown}
            comboboxProps={{ withinPortal: true }}
          />
          <Select
            size="sm"
            radius="xl"
            w={166}
            placeholder="All loan types"
            data={LOAN_TYPES}
            value={loanTypeFilter}
            onChange={(v) => {
              setLoanTypeFilter(v);
              resetPage();
            }}
            clearable
            rightSection={loanTypeFilter ? undefined : chevronDown}
            comboboxProps={{ withinPortal: true }}
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
                aria-label="When several rows match"
                data={MATCH_MODES}
                value={draft.matchMode}
                onChange={(v) => v && setDraft((d) => ({ ...d, matchMode: v as MatchMode }))}
                allowDeselect={false}
                rightSection={chevronDown}
                comboboxProps={{ withinPortal: true }}
                styles={{ input: { fontSize: 12.5 } }}
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
                styles={{ input: { fontSize: 12.5 } }}
              />
            </Group>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Table.ScrollContainer minWidth={1000}>
          <Table w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 6px", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 188 }} />
              <col style={{ width: 132 }} />
              <col />
              <col style={{ width: 290 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <Table.Thead>
              <Table.Tr>
                {["Source", "Loan type", "Condition", "Product code", ""].map((h, i) => (
                  <Table.Th key={h || i} style={headStyle}>
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
                        No rows match your filters.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                pageRows.map((row) => {
                  const rowsInGroup = group(row);
                  const no = rowsInGroup.indexOf(row) + 1;
                  const error = rowError(row);
                  const shadow = shadowedBy(row);
                  const note = error
                    ? { text: error, color: "danger.7" }
                    : shadow
                      ? { text: "Never used: a row above has no condition and catches every application first.", color: "orange.8" }
                      : null;
                  const stripe = error ? "danger" : shadow ? "orange" : row.clauses.length === 0 ? "success" : "brand";
                  const SourceIcon = SOURCE_ICON[row.source] ?? IconBuildingBank;
                  const product = productByCode(row.productCode);
                  const cell = { padding: "6px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", verticalAlign: "middle" as const };
                  return (
                    <Table.Tr key={row.id} className="lms-row" style={{ opacity: shadow ? 0.7 : 1 }}>
                      <Table.Td style={{ ...cell, borderLeft: `3px solid var(--mantine-color-${stripe}-4)` }}>
                        <Group gap={6} wrap="nowrap">
                          <Box
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "var(--mantine-radius-md)",
                              background: "var(--mantine-color-brand-0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <SourceIcon size={15} color="var(--mantine-color-brand-6)" />
                          </Box>
                          <Select
                            aria-label={`Source, row ${no}`}
                            data={SOURCES}
                            value={row.source}
                            onChange={(v) => v && update(row.id, { source: v })}
                            allowDeselect={false}
                            comboboxProps={{ withinPortal: true }}
                            styles={{ input: { ...CELL_INPUT.input, fontWeight: 700, color: "var(--mantine-color-slate-8)" } }}
                            style={{ flex: 1, minWidth: 0 }}
                          />
                        </Group>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Select
                          aria-label={`Loan type, row ${no}`}
                          data={LOAN_TYPES}
                          value={row.loanType}
                          onChange={(v) => v && changeLoanType(row, v)}
                          allowDeselect={false}
                          comboboxProps={{ withinPortal: true }}
                          styles={{
                            input: {
                              height: 26,
                              minHeight: 26,
                              fontSize: 12,
                              fontWeight: 600,
                              paddingLeft: 10,
                              border: "none",
                              borderRadius: "var(--mantine-radius-sm)",
                              color: "var(--mantine-color-brand-8)",
                              background: "var(--mantine-color-brand-0)",
                            },
                          }}
                          w={112}
                        />
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Popover opened={editing === row.id} onChange={(open) => !open && setEditing(null)} position="bottom-start" width={660} shadow="md" radius="md" withinPortal>
                          <Popover.Target>
                            <UnstyledButton
                              onClick={() => setEditing(editing === row.id ? null : row.id)}
                              aria-label={`Edit condition, row ${no}`}
                              title={conditionText(row.clauses) || undefined}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "5px 8px",
                                borderRadius: "var(--mantine-radius-sm)",
                                background: editing === row.id ? "var(--mantine-color-brand-0)" : undefined,
                                boxShadow: editing === row.id ? "inset 0 0 0 1px var(--mantine-color-brand-4)" : undefined,
                              }}
                            >
                              <ConditionSummary clauses={row.clauses} />
                              {note && (
                                <Text fz={10.5} c={note.color} mt={2} truncate>
                                  {note.text}
                                </Text>
                              )}
                            </UnstyledButton>
                          </Popover.Target>
                          <Popover.Dropdown p="sm">
                            <Stack gap="sm">
                              <Text fz={11} fw={700} c="slate.5" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Condition · {row.source} · {row.loanType}
                              </Text>
                              <ConditionEditor clauses={row.clauses} onChange={(clauses) => update(row.id, { clauses })} />
                              <Group justify="space-between">
                                <Group gap={4}>
                                  <Button size="compact-xs" variant="subtle" color="brand" onClick={() => update(row.id, { clauses: [...row.clauses, newClause("AND")] })}>
                                    {row.clauses.length === 0 ? "+ Add condition" : "+ AND"}
                                  </Button>
                                  {row.clauses.length > 0 && (
                                    <Button size="compact-xs" variant="subtle" color="orange" onClick={() => update(row.id, { clauses: [...row.clauses, newClause("OR")] })}>
                                      + OR
                                    </Button>
                                  )}
                                </Group>
                                <Group gap={6}>
                                  {row.clauses.length > 0 && (
                                    <Button size="compact-xs" variant="subtle" color="slate" onClick={() => update(row.id, { clauses: [] })}>
                                      Clear (always)
                                    </Button>
                                  )}
                                  <Button size="compact-xs" onClick={() => setEditing(null)}>
                                    Done
                                  </Button>
                                </Group>
                              </Group>
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Select
                          aria-label={`Product code, row ${no}`}
                          placeholder="Select product"
                          data={productsFor(row.loanType).map((p) => ({ value: p.code, label: p.name }))}
                          value={row.productCode || null}
                          onChange={(v) => update(row.id, { productCode: v ?? "" })}
                          allowDeselect={false}
                          comboboxProps={{ withinPortal: true }}
                          leftSection={
                            product ? (
                              <Text
                                fz={10.5}
                                fw={700}
                                c="brand.8"
                                px={6}
                                py={2}
                                style={{ background: "var(--mantine-color-brand-0)", borderRadius: "var(--mantine-radius-sm)", fontFamily: "var(--mantine-font-family-monospace)" }}
                              >
                                {product.code}
                              </Text>
                            ) : null
                          }
                          leftSectionWidth={product ? 62 : undefined}
                          leftSectionPointerEvents="none"
                          renderOption={({ option }) => (
                            <Group gap={8} wrap="nowrap">
                              <Text fz={10.5} fw={700} c="brand.8" w={58} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                                {option.value}
                              </Text>
                              <Text fz={12.5}>{option.label}</Text>
                            </Group>
                          )}
                          styles={{ input: { ...CELL_INPUT.input, paddingLeft: product ? 64 : 6, fontWeight: 600, color: "var(--mantine-color-slate-8)" } }}
                        />
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Group gap={2} justify="flex-end" wrap="nowrap">
                          <ActionIcon variant="subtle" color="slate" size="md" radius="xl" disabled={no === 1} onClick={() => move(row, -1)} aria-label={`Move row ${no} up`}>
                            <IconArrowUp size={15} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="slate" size="md" radius="xl" disabled={no === rowsInGroup.length} onClick={() => move(row, 1)} aria-label={`Move row ${no} down`}>
                            <IconArrowDown size={15} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="danger"
                            size="md"
                            radius="xl"
                            onClick={() => setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== row.id) }))}
                            aria-label={`Delete row ${no}`}
                          >
                            <IconTrash size={15} />
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
    </Stack>
  );
}

export default LoanProductAssignment;
