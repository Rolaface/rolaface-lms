import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Loader,
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
  IconAdjustmentsHorizontal,
  IconCheck,
  IconChevronDown,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconShieldCog,
  IconTrash,
  IconUserSearch,
} from "@tabler/icons-react";

import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import { showSuccess } from "../../../utils/alert";
 import { createProductAssignments, getAllProductAssignments, deleteProductAssignments } from "../../../api/OriginationSetupAPi/productAssignmentApi";
  import { getAllLoanTypes } from "../../../api/OriginationSetupAPi/loanSetupApi";
import type { CreateProductAssignmentPayload, CreateProductAssignmentResponse } from "../../../types/OriginationSetup/productAssignemntForm";
import {
  FALLBACKS,
  LOAN_TYPES,
  MATCH_MODES,
  SOURCES,
  conditionText,
  hasCondition,
  isShadowed,
  newGroup,
  productByCode,
  productsFor,
  rowError,
  uid,
  type AssignmentRow,
  type ConditionGroup,
  type Fallback,
  type Joiner,
  type MatchMode,
  type Operator,
} from "./shared";
import {
  ConditionText,
  FIELD,
  InlinePicker,
  LOAN_TONE,
  LoanProductAssignmentModal,
  OptionMark,
  codeBadge,
  type EditingState,
  type PickerOption,
} from "../../../components/Modal/OriginationSetup/LoanProductAssignmentModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";

interface ApiCondition {
  join: "AND" | "OR";
  groups: {
    id: string | null;
    name: string;
    join: "AND" | "OR";
    clauses: { id: string | null; variable: string; operator: string; value: string | number }[];
  }[];
}

interface ApiRule {
  name: string;
  rule_name: string | null;
  priority: number;
  product: string;
  sources: string[];
  loan_types: string[];
  condition: ApiCondition | null;
  is_active: number;
  product_name: string;
  source_names: string[];
  loan_type_names: string[];
  has_condition: number;
}

interface GetProductAssignmentsResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      settings: {
        several_match: string;
        no_match: string;
        default_product: unknown;
        default_product_list: unknown[];
      };
      rules: ApiRule[];
      warnings: unknown[];
      total_rules: number;
      version: string;
    };
  };
}

type PayloadClause = NonNullable<CreateProductAssignmentPayload["condition"]>["groups"][number]["clauses"][number];

const toRow = (r: Pick<ApiRule, "name" | "sources" | "loan_types" | "condition" | "product">): AssignmentRow => ({
  id: r.name,
  sources: r.sources,
  loanTypes: r.loan_types,
  join: r.condition?.join ?? "AND",
  groups: (r.condition?.groups ?? []).map(
    (gr): ConditionGroup => ({
      id: gr.id ?? uid(),
      name: gr.name ?? "",
      join: gr.join as Joiner,
      clauses: gr.clauses.map((cl) => ({
        id: cl.id ?? uid(),
        variable: cl.variable,
        operator: cl.operator as Operator,
        value: String(cl.value),
      })),
    })
  ),
  productCode: r.product,
});

const toPayload = (row: AssignmentRow): CreateProductAssignmentPayload => ({
  sources: row.sources,
  loan_types: row.loanTypes,
  product: row.productCode,
  condition: hasCondition(row)
    ? {
        join: row.join,
        groups: row.groups
          .filter((gr) => gr.clauses.length > 0)
          .map((gr) => ({
            id: gr.id,
            name: gr.name,
            join: gr.join,
            clauses: gr.clauses.map((cl) => ({
              id: cl.id,
              variable: cl.variable,
              operator: cl.operator as PayloadClause["operator"],
              value: cl.value,
            })),
          })),
      }
    : null,
});

interface Config {
  rows: AssignmentRow[];
  matchMode: MatchMode;
  fallback: Fallback;
  defaultByLoanType: Record<string, string>;
}

const EMPTY: Config = { rows: [], matchMode: "first", fallback: "default", defaultByLoanType: {} };

type RowKind = "all" | "conditional" | "direct";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

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

function ProductPicker({ loanTypes, value, options, onChange }: { loanTypes: string[]; value: string; options: PickerOption[]; onChange: (code: string) => void }) {
  const [opened, setOpened] = useState(false);
  const product = options.find((o) => o.value === value);
  const disabled = loanTypes.length === 0;

  return (
    <Box onClick={(e) => e.stopPropagation()} style={{ minWidth: 0 }}>
      <Popover opened={opened} onChange={setOpened} position="bottom-start" width={290} shadow="md" radius="md" withinPortal disabled={disabled}>
        <Popover.Target>
          <UnstyledButton className="pa-cell" aria-label="Edit product" onClick={() => setOpened((o) => !o)} aria-expanded={opened} disabled={disabled}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              {product ? (
                <Group gap={8} wrap="nowrap">
                  <span style={codeBadge}>{product.value}</span>
                  <Text fz={11.5} fw={600} c="slate.8" truncate>
                    {product.label}
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
            {options.length === 0 ? (
              <Text fz={12} c="slate.5" px={8} py={6}>
                No products available
              </Text>
            ) : (
              options.map((p) => {
                const on = p.value === value;
                return (
                  <UnstyledButton
                    key={p.value}
                    className="pa-option"
                    aria-pressed={on}
                    onClick={() => {
                      onChange(p.value);
                      setOpened(false);
                    }}
                    style={{ background: on ? "var(--mantine-color-brand-0)" : undefined }}
                  >
                    <span style={{ ...codeBadge, minWidth: 58, textAlign: "center" }}>{p.value}</span>
                    <Text fz={12.5} fw={on ? 600 : 500} c={on ? "slate.8" : "slate.7"} style={{ flex: 1 }}>
                      {p.label}
                    </Text>
                    {on && <IconCheck size={14} color="var(--mantine-color-brand-6)" />}
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

const MANUAL = "manual";

function LoanTypeDefault({ loanType, value, onChange, first }: { loanType: string; value: string; onChange: (code: string) => void; first: boolean }) {
  const product = productByCode(value);
  const tone = LOAN_TONE[loanType] ?? "slate";

  return (
    <Group
      gap={10}
      wrap="nowrap"
      px={10}
      py={6}
      style={{ borderTop: first ? undefined : "1px solid var(--mantine-color-slate-2)", borderLeft: `3px solid var(--mantine-color-${product ? tone : "slate"}-${product ? 4 : 2})` }}
    >
      <Group gap={7} wrap="nowrap" w={92} style={{ flexShrink: 0 }}>
        <OptionMark kind="loanType" value={loanType} />
        <Text fz={12.5} fw={600} c="slate.8" truncate>
          {loanType}
        </Text>
      </Group>
      <Select
        aria-label={`Default product for ${loanType}`}
        data={[{ value: MANUAL, label: "Manual review" }, ...productsFor([loanType]).map((p) => ({ value: p.code, label: p.name }))]}
        value={product ? product.code : MANUAL}
        onChange={(v) => onChange(v && v !== MANUAL ? v : "")}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        leftSection={product ? <span style={codeBadge}>{product.code}</span> : <IconUserSearch size={14} />}
        leftSectionWidth={product ? 70 : 30}
        leftSectionPointerEvents="none"
        renderOption={({ option, checked }) => (
          <Group gap={8} wrap="nowrap" style={{ flex: 1 }}>
            {option.value === MANUAL ? (
              <Box w={56} style={{ display: "flex", color: "var(--mantine-color-slate-5)" }}>
                <IconUserSearch size={14} />
              </Box>
            ) : (
              <Text fz={10} fw={700} c="brand.8" w={56} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                {option.value}
              </Text>
            )}
            <Text fz={12.5} fw={checked ? 600 : 400} c={option.value === MANUAL ? "slate.6" : "slate.8"}>
              {option.label}
            </Text>
          </Group>
        )}
        styles={{
          input: {
            height: 28,
            minHeight: 28,
            fontSize: 12,
            borderRadius: 8,
            paddingLeft: product ? 72 : 30,
            fontWeight: product ? 600 : 400,
            color: product ? "var(--mantine-color-slate-8)" : "var(--mantine-color-slate-5)",
            background: "var(--mantine-color-white)",
          },
          section: { color: "var(--mantine-color-slate-4)" },
        }}
        style={{ flex: 1, minWidth: 0 }}
      />
    </Group>
  );
}

export function LoanProductAssignment() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<Config>(EMPTY);
  const [draft, setDraft] = useState<Config>(EMPTY);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [loanTypeFilter, setLoanTypeFilter] = useState<string[]>([]);
  const [kind, setKind] = useState<RowKind>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dragArmed, setDragArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const {
    data: productAssignmentsRes,
    isLoading: loading,
    error: queryError,
    refetch: loadRules,
  } = useQuery({
    queryKey: ["product-assignments"],
    queryFn: () => getAllProductAssignments() as Promise<GetProductAssignmentsResponse>,
  });

  const loadError = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Could not load product assignment rules."
    : null;

  useEffect(() => {
    if (!productAssignmentsRes) return;
    const rules = [...(productAssignmentsRes.message.data.rules ?? [])].sort((a, b) => a.priority - b.priority);
    setSaved((s) => ({ ...s, rows: rules.map(toRow) }));
    setDraft((d) => ({ ...d, rows: rules.map(toRow) }));
    setProductNames(Object.fromEntries(rules.map((r) => [r.product, r.product_name])));
  }, [productAssignmentsRes]);

  const { data: loanTypesRes } = useQuery({
    queryKey: ["loan-types"],
    queryFn: () =>
      getAllLoanTypes() as Promise<{
        message: { data: { setup: Record<string, { id: string; name: string }[]> } };
      }>,
  });

  const loanTypeOptions = useMemo<PickerOption[]>(
    () =>
      loanTypesRes
        ? Object.values(loanTypesRes.message.data.setup)
            .flat()
            .map((lt) => ({ value: lt.id, label: lt.name }))
        : [],
    [loanTypesRes],
  );

  const createMutation = useMutation({
    mutationFn: createProductAssignments,
    onSuccess: (res: CreateProductAssignmentResponse) => {
      const created = toRow(res.message.data);
      setProductNames((p) => ({ ...p, [res.message.data.product]: res.message.data.product_name }));
      setSaved((s) => ({ ...s, rows: [created, ...s.rows] }));
      setDraft((d) => ({ ...d, rows: [created, ...d.rows] }));
      setKind("all");
      resetPage();
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["product-assignments"] });
      showSuccess("Rule Added", res.message.message);
    },
    onError: (error: any) => {
      setCreateError(error instanceof Error ? error.message : "Could not add the rule.");
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const creating = createMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: deleteProductAssignments,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-assignments"] });
      setSaved((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== variables) }));
      setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== variables) }));
      showSuccess(
        "Rule Deleted",
        `Product Assignment Rule ${variables} deleted successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Product Assignment Rule",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => deleteMutation.mutate(id),
        },
      ],
    });
  };

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
  const productOptions = useMemo<PickerOption[]>(() => Object.entries(productNames).map(([value, label]) => ({ value, label })), [productNames]);
  const totalRows = visible.length;
  const { pageSize } = pagination;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const pageRows = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);
  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const defaultCount = LOAN_TYPES.filter((lt) => productByCode(draft.defaultByLoanType[lt] ?? "")).length;
  const defaultMissing = draft.fallback === "default" && defaultCount === 0;
  const setLoanTypeDefault = (loanType: string, code: string) =>
    setDraft((d) => {
      const next = { ...d.defaultByLoanType };
      if (code) next[loanType] = code;
      else delete next[loanType];
      return { ...d, defaultByLoanType: next };
    });
  const errorCount = rows.filter((r) => rowError(r)).length + (defaultMissing ? 1 : 0);

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  // const fitsProduct = (loanTypes: string[], code: string) => (productsFor(loanTypes).some((p) => p.code === code) ? code : "");
    const fitsProduct = (_loanTypes: string[], code: string) => code;
  const changeRowLoanTypes = (row: AssignmentRow, loanTypes: string[]) => updateRow(row.id, { loanTypes, productCode: fitsProduct(loanTypes, row.productCode) });

  const openAdd = () => {
    const row: AssignmentRow = { id: uid(), sources: [...sourceFilter], loanTypes: [...loanTypeFilter], join: "AND", groups: [], productCode: "" };
    setCreateError(null);
    setEditing({ mode: "add", attempted: false, row, original: JSON.stringify(row) });
  };

  const openEdit = (row: AssignmentRow) => {
    setCreateError(null);
    setEditing({ mode: "edit", row, attempted: false, original: JSON.stringify(row) });
  };

  const closeModal = () => {
    if (creating) return;
    setEditing(null);
    setCreateError(null);
  };

  const editRow = (patch: Partial<AssignmentRow>) => setEditing((e) => e && { ...e, row: { ...e.row, ...patch } });

  const changeLoanTypes = (loanTypes: string[]) =>
    setEditing((e) => e && { ...e, row: { ...e.row, loanTypes, productCode: fitsProduct(loanTypes, e.row.productCode) } });

  const saveRule = () => {
    if (!editing) return;
    if (rowError(editing.row)) {
      setEditing({ ...editing, attempted: true });
      return;
    }
    const { mode, row } = editing;

    if (mode === "add") {
      setCreateError(null);
      createMutation.mutate(toPayload(row));
      return;
    }
    setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.id === row.id ? row : r)) }));
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
          <Popover position="bottom-end" width={400} shadow="md" radius="md" withinPortal>
            <Popover.Target>
              <Button
                size="sm"
                radius="xl"
                variant="default"
                leftSection={<IconAdjustmentsHorizontal size={15} />}
                rightSection={defaultMissing ? <Box style={{ width: 7, height: 7, borderRadius: 999, background: "var(--mantine-color-danger-6)" }} /> : undefined}
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
                <Box>
                  <Text fz={12} fw={500} c="slate.7" mb={4}>
                    If nothing matches
                  </Text>
                  <SegmentedControl
                    fullWidth
                    size="xs"
                    radius="md"
                    color="brand"
                    data={FALLBACKS}
                    value={draft.fallback}
                    onChange={(v) => setDraft((d) => ({ ...d, fallback: v as Fallback }))}
                    styles={{ label: { fontSize: 12, fontWeight: 600 } }}
                  />
                </Box>
                {draft.fallback === "default" ? (
                  <Box>
                    <Group justify="space-between" align="baseline" mb={6}>
                      <Text fz={12} fw={500} c="slate.7">
                        Default product per loan type
                      </Text>
                      <Text fz={11} fw={600} c={defaultMissing ? "danger.6" : "brand.6"}>
                        {defaultCount} of {LOAN_TYPES.length} set
                      </Text>
                    </Group>
                    <Box style={{ borderRadius: 10, border: `1px solid var(--mantine-color-${defaultMissing ? "danger-3" : "slate-2"})`, background: "var(--mantine-color-slate-0)" }}>
                      {LOAN_TYPES.map((lt, i) => (
                        <LoanTypeDefault key={lt} loanType={lt} first={i === 0} value={draft.defaultByLoanType[lt] ?? ""} onChange={(code) => setLoanTypeDefault(lt, code)} />
                      ))}
                    </Box>
                    <Text fz={11} c={defaultMissing ? "danger.6" : "slate.5"} mt={6}>
                      {defaultMissing ? "Choose a default product for at least one loan type." : "Loan types left on manual review go to a reviewer."}
                    </Text>
                  </Box>
                ) : (
                  <Group gap={8} wrap="nowrap" px={10} py={8} style={{ borderRadius: 10, background: "var(--mantine-color-slate-0)" }}>
                    <IconUserSearch size={15} color="var(--mantine-color-slate-5)" style={{ flexShrink: 0 }} />
                    <Text fz={11.5} c="slate.6">
                      Unmatched applications go to a reviewer to pick the product.
                    </Text>
                  </Group>
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
          <Tooltip label={defaultMissing && errorCount === 1 ? "Choose a loan type default first" : `Fix ${errorCount} ${errorCount === 1 ? "issue" : "issues"} first`} disabled={errorCount === 0} withinPortal>
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

      {loadError && (
        <Alert color="danger" radius="md" title="Could not load rules">
          <Group justify="space-between" wrap="nowrap">
            <Text fz="sm">{loadError}</Text>
           <Button size="compact-sm" variant="light" color="danger" onClick={() => loadRules()}>
  Retry
</Button>
          </Group>
        </Alert>
      )}

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
            data={loanTypeOptions}
            value={loanTypeFilter}
            onChange={(v) => {
              setLoanTypeFilter(loanTypeOptions.map((o) => o.value).filter((o) => v.includes(o)));
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
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ border: "none" }}>
                    <Stack align="center" gap="xs" py="xl">
                      <Loader size="sm" color="brand" />
                      <Text ta="center" c="slate.5" fz={11}>
                        Loading rules…
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : pageRows.length === 0 ? (
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
                        {rows.length === 0 ? "No rules yet." : "No rules match your filters."}
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
                  const open = () => openEdit(row);
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
                        {/* <InlinePicker kind="loanType" value={row.loanTypes} onChange={(loanTypes) => changeRowLoanTypes(row, loanTypes)} /> */}
                        <InlinePicker kind="loanType" options={loanTypeOptions} value={row.loanTypes} onChange={(loanTypes) => changeRowLoanTypes(row, loanTypes)} />
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
                        {/* <ProductPicker loanTypes={row.loanTypes} value={row.productCode} onChange={(productCode) => updateRow(row.id, { productCode })} /> */}
                        <ProductPicker loanTypes={row.loanTypes} value={row.productCode} options={productOptions} onChange={(productCode) => updateRow(row.id, { productCode })} />
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
  loading={deleteMutation.isPending && deleteMutation.variables === row.id}
  onClick={() => confirmDelete(row.id)}
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

      <LoanProductAssignmentModal
        editing={editing}
        saving={creating}
        saveError={createError}
        productOptions={productOptions}
        onClose={closeModal}
        onEditRow={editRow}
        onChangeLoanTypes={changeLoanTypes}
        onSave={saveRule}
      />
    </Stack>
  );
}

export default LoanProductAssignment;