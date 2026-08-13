import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  Box,
  Paper,
  Table,
  Select,
  TextInput,
  Button,
  Loader,
  Text,
  Group,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import {
  IconRefresh,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconLayoutList,
  IconAlertCircle,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";

import {
  type BSData,
  type BSNode,
  type BSSummaryItem,
} from "../../api/Accounting/Balancesheet.api";
import { useBalanceSheet } from "../../hooks/Accounting/Balancesheet.logic";

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  summary,
  loading,
  displayAmount,
}: {
  summary: BSSummaryItem[];
  loading: boolean;
  displayAmount: (currency: string | undefined, amount: number) => string;
}) {
  const colorFor = (item: BSSummaryItem) => {
    if (item.indicator === "green") return "success.6";
    if (item.indicator === "red") return "danger.5";
    return "slate.8";
  };

  const items =
    loading || summary.length === 0 ? Array.from({ length: 4 }) : summary;

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      {items.map((item: any, i) => (
        <Paper key={item?.label ?? i} withBorder radius="md" p="sm">
          <Text
            fz="10px"
            fw={700}
            tt="uppercase"
            c="slate.4"
            style={{ letterSpacing: "0.08em" }}
            mb={4}
            truncate
          >
            {item?.label ?? "—"}
          </Text>
          {loading || !item ? (
            <Box
              h={16}
              w={96}
              style={{
                background: "var(--mantine-color-slate-1)",
                borderRadius: 4,
              }}
              className="animate-pulse"
            />
          ) : (
            <Text
              fz="sm"
              fw={700}
              c={colorFor(item)}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {displayAmount(item.currency, item.value)}
            </Text>
          )}
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/* ───────────────── Filter bar ───────────────── */

function FilterBar({ bs }: { bs: ReturnType<typeof useBalanceSheet> }) {
  const {
    filters,
    setMode,
    setPeriodicity,
    setFiscalYear,
    setFromDate,
    setToDate,
    handleRefresh,
    loading,
    allExpanded,
    handleToggleExpand,
  } = bs;

  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap="sm" wrap="wrap" align="flex-end">
        <Select
          size="xs"
          label="Mode"
          data={["Fiscal Year", "Date Range"]}
          value={filters.mode}
          onChange={(v) => setMode((v ?? "Fiscal Year") as any)}
          w={144}
        />

        <Select
          size="xs"
          label="Period"
          data={["Monthly", "Quarterly", "Half-Yearly", "Yearly"]}
          value={filters.periodicity}
          onChange={(v) => setPeriodicity((v ?? "Monthly") as any)}
          w={128}
        />

        {filters.mode === "Fiscal Year" ? (
          <TextInput
            size="xs"
            label="Fiscal Year"
            value={filters.fromFiscalYear}
            onChange={(e) => setFiscalYear(e.currentTarget.value)}
            placeholder="2026-2027"
            w={112}
          />
        ) : (
          <>
            <DateInput
              size="xs"
              radius="xl"
              label="From"
              placeholder="From Date"
              value={filters.fromDate}
              onChange={(value) => setFromDate(value || "")}
              valueFormat="DD/MM/YYYY"
              w={150}
              clearable
            />
            <DateInput
              size="xs"
              radius="xl"
              label="To"
              placeholder="To Date"
              value={filters.toDate}
              onChange={(value) => setToDate(value || "")}
              valueFormat="DD/MM/YYYY"
              w={150}
              clearable
            />
          </>
        )}

        <Group gap="xs" ml="auto">
          <Button
            size="xs"
            variant="default"
            leftSection={
              allExpanded ? (
                <IconChevronRight size={13} />
              ) : (
                <IconLayoutList size={13} />
              )
            }
            onClick={handleToggleExpand}
          >
            {allExpanded ? "Collapse" : "Expand All"}
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={
              <IconRefresh
                size={13}
                className={loading ? "animate-spin" : ""}
              />
            }
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}

/* ───────────────── Section header ───────────────── */

function SectionHeader({
  label,
  accentColor,
}: {
  label: string;
  accentColor: string;
}) {
  return (
    <Group gap={8} px={4}>
      <Box
        w={4}
        h={16}
        style={{
          borderRadius: 999,
          background: `var(--mantine-color-${accentColor})`,
          flexShrink: 0,
        }}
      />
      <Text
        fz="xs"
        fw={700}
        tt="uppercase"
        c="slate.8"
        style={{ letterSpacing: "0.08em" }}
      >
        {label}
      </Text>
    </Group>
  );
}

/* ───────────────── Reusable tree table ───────────────── */

function BSTreeTable({
  data,
  columns,
  expanded,
  onExpandedChange,
  loading,
  emptyMessage,
}: {
  data: BSNode[];
  columns: ColumnDef<BSNode>[];
  expanded: ExpandedState;
  onExpandedChange: (updater: any) => void;
  loading: boolean;
  emptyMessage: string;
}) {
  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Paper withBorder radius="md" shadow="sm" style={{ overflow: "hidden" }}>
      <Box
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: 420,
          position: "relative",
        }}
      >
        <Table
          stickyHeader
          horizontalSpacing="sm"
          verticalSpacing={6}
          style={{
            tableLayout: "fixed",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((hg) => (
              <Table.Tr key={hg.id}>
                {hg.headers.map((header) => {
                  const align =
                    (
                      header.column.columnDef.meta as
                        { align?: string } | undefined
                    )?.align === "right"
                      ? "right"
                      : "left";
                  return (
                    <Table.Th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        textAlign: align,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} h={160}>
                  <Group justify="center">
                    <Loader size="sm" color="indigoAlt.4" />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} py={40} ta="center">
                  <Text fz="xs" c="slate.4">
                    {emptyMessage}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (
                        cell.column.columnDef.meta as
                          { align?: string } | undefined
                      )?.align === "right"
                        ? "right"
                        : "left";
                    return (
                      <Table.Td
                        key={cell.id}
                        style={{ textAlign: align, whiteSpace: "nowrap" }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
}

/* ───────────────── Page ───────────────── */

export function BalanceSheet() {
  const bs = useBalanceSheet();
  const { data, loading, error, displayAmount } = bs;

  const columns = useMemo<ColumnDef<BSNode>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col): ColumnDef<BSNode> => {
      if (col.fieldname === "account") {
        return {
          id: "account_name",
          header: col.label,
          size: col.width ?? 260,
          cell: ({ row }) => {
            const node = row.original;
            const canExpand = row.getCanExpand();
            return (
              <Group
                gap={6}
                wrap="nowrap"
                style={{ paddingLeft: row.depth * 18 }}
              >
                {canExpand ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                      color: "var(--mantine-color-slate-4)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <IconChevronRight
                      size={13}
                      style={{
                        transition: "transform 150ms ease",
                        transform: row.getIsExpanded()
                          ? "rotate(90deg)"
                          : "none",
                      }}
                    />
                    {row.getIsExpanded() ? (
                      <IconFolderOpen size={14} />
                    ) : (
                      <IconFolder size={14} />
                    )}
                  </Box>
                ) : (
                  <IconFileText
                    size={13}
                    color="var(--mantine-color-slate-3)"
                    style={{ flexShrink: 0 }}
                  />
                )}
                <Text
                  fz="xs"
                  fw={node.is_group ? 700 : 400}
                  c={node.is_group ? "slate.9" : "slate.7"}
                  truncate
                >
                  {node.account_name}
                </Text>
              </Group>
            );
          },
        };
      }
      return {
        id: col.fieldname,
        header: col.label,
        size: col.width ?? 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text
            fz="xs"
            fw={row.original.is_group ? 700 : 400}
            c={row.original.is_group ? "slate.9" : "slate.7"}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {displayAmount(
              row.original.currency,
              row.original.periods?.[col.fieldname] ?? 0,
            )}
          </Text>
        ),
      };
    });
  }, [data, displayAmount]);

  if (error && !data) {
    return (
      <Stack align="center" py={80} gap="sm">
        <IconAlertCircle size={26} color="var(--mantine-color-danger-5)" />
        <Text fz="sm" c="danger.6">
          {error}
        </Text>
        <Button
          size="xs"
          color="brand"
          leftSection={<IconRefresh size={14} />}
          onClick={bs.handleRefresh}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="lg">
      <KpiStrip
        summary={data?.summary ?? []}
        loading={loading && !data}
        displayAmount={displayAmount}
      />

      <FilterBar bs={bs} />

      <Stack gap={8}>
        <SectionHeader
          label="Application of Funds (Assets)"
          accentColor="info-6"
        />
        <BSTreeTable
          data={data?.assets ?? []}
          columns={columns}
          expanded={bs.expandedAssets as ExpandedState}
          onExpandedChange={(updater) => {
            bs.setExpandedAssets(updater);
          }}
          loading={loading && !data}
          emptyMessage="No asset accounts found."
        />
      </Stack>

      <Stack gap={8}>
        <SectionHeader
          label="Source of Funds (Liabilities)"
          accentColor="danger-5"
        />
        <BSTreeTable
          data={data?.liabilities ?? []}
          columns={columns}
          expanded={bs.expandedLiabilities as ExpandedState}
          onExpandedChange={(updater) => {
            bs.setExpandedLiabilities(updater);
          }}
          loading={loading && !data}
          emptyMessage="No liability accounts found."
        />
      </Stack>

      <Stack gap={8}>
        <SectionHeader label="Equity" accentColor="indigoAlt-5" />
        <BSTreeTable
          data={data?.equity ?? []}
          columns={columns}
          expanded={bs.expandedEquity as ExpandedState}
          onExpandedChange={(updater) => {
            bs.setExpandedEquity(updater);
          }}
          loading={loading && !data}
          emptyMessage="No equity accounts found."
        />
      </Stack>
    </Stack>
  );
}
