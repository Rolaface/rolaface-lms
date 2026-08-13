import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Box,
  Paper,
  Table,
  TextInput,
  Checkbox,
  Button,
  Group,
  Text,
  ActionIcon,
  Loader,
  Stack,useMantineTheme
} from "@mantine/core";
import {
  IconRefresh,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconBook,
  IconAlertCircle,
} from "@tabler/icons-react";

import {
  type TBAccount,
  type TBFilters,
  nf,
} from "../../api/Accounting/Trialbalance.api";
import { useTrialBalance } from "../../hooks/Accounting/Trialbalance.logic";
import { DateInput } from "@mantine/dates";
import { useCurrencyReady } from "../../store/currencyStore";

/* ───────────────── Filter bar ───────────────── */

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fz="10px" fw={700} tt="uppercase" c="slate.4" style={{ letterSpacing: "0.08em" }}>
      {children}
    </Text>
  );
}

function FilterBar({
  
  filters,
  setFilters,
  onRefresh,
  loading,
}: {
  filters: TBFilters;
  setFilters: React.Dispatch<React.SetStateAction<TBFilters>>;
  onRefresh: () => void;
  loading: boolean;
}) {
    const theme = useMantineTheme();
  return (
    <Paper withBorder radius="md" p="xs" shadow="sm">
      <Group gap="sm" wrap="wrap" align="flex-end">
        <Group gap={4} wrap="nowrap">
          <FilterLabel>From</FilterLabel>
          <DateInput
            size="xs"
            placeholder="From Date"
            value={filters.from_date}
            onChange={(value) =>
              setFilters((f) => ({
                ...f,
                from_date: value || "",
              }))
            }
           valueFormat="DD-MMM-YYYY"   
            w={150}
            clearable
          />
        </Group>

        <Group gap={4} wrap="nowrap">
          <FilterLabel>To</FilterLabel>
          <DateInput
            size="xs"
            placeholder="To Date"
            value={filters.to_date}
            onChange={(value) =>
              setFilters((f) => ({
                ...f,
                to_date: value || "",
              }))
            }
           valueFormat="DD-MMM-YYYY"   
            w={150}
            clearable
          />
        </Group>

        <Group gap={4} wrap="nowrap">
          <FilterLabel>FY</FilterLabel>
          <TextInput size="xs" placeholder="2026-2027" value={filters.fiscal_year} disabled w={110} />
        </Group>

        <Box w={1} h={24} style={{ background: "var(--mantine-color-slate-2)", alignSelf: "stretch" }} />

        <Checkbox
          size="xs"
          label="Zero Values"
          checked={filters.show_zero_values}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              show_zero_values: e.target?.checked ?? !f.show_zero_values,
            }))
          }
        />
        <Checkbox
          size="xs"
          label="Period Closing"
          checked={filters.with_period_closing_entry}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              with_period_closing_entry: e.target?.checked ?? !f.with_period_closing_entry,
            }))
          }
        />
        <Checkbox
          size="xs"
          label="Closing Entries"
          checked={filters.show_closing_entries}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              show_closing_entries: e.target?.checked ?? !f.show_closing_entries,
            }))
          }
        />

        <Button
              size="xs"
              radius="xl"
              color="brand"
              leftSection={
                <IconRefresh
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
              }
              onClick={onRefresh}
              style={{
                background: theme.other?.brandGradient,
                boxShadow: theme.other?.brandGlowShadowSm,
              }}
            >
              Refresh
            </Button>
      </Group>
    </Paper>
  );
}

/* ───────────────── Columns ───────────────── */

function useColumns(baseCurrency: string): ColumnDef<TBAccount>[] {
  return useMemo<ColumnDef<TBAccount>[]>(
    () => [
      {
        id: "account_name",
        header: "Account",
        size: 260,
        cell: ({ row }) => {
          const node = row.original;
          const canExpand = row.getCanExpand();
          return (
            <Group gap={6} wrap="nowrap" style={{ paddingLeft: row.depth * 18 }}>
              {canExpand ? (
                <ActionIcon size="xs" variant="subtle" color="slate" onClick={row.getToggleExpandedHandler()}>
                  <IconChevronRight
                    size={12}
                    style={{
                      transition: "transform 150ms ease",
                      transform: row.getIsExpanded() ? "rotate(90deg)" : "none",
                    }}
                  />
                  {row.getIsExpanded() ? <IconFolderOpen size={13} /> : <IconFolder size={13} />}
                </ActionIcon>
              ) : (
                <Box w={23} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconBook size={12} color="var(--mantine-color-slate-4)" style={{ opacity: 0.6 }} />
                </Box>
              )}
              <Text fz="xs" fw={row.depth === 0 ? 600 : 400} c="slate.8" truncate>
                {node.account_name}
              </Text>
            </Group>
          );
        },
      },
      {
        id: "opening_debit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Opening Debit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" c="slate.7" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.opening_debit)}
          </Text>
        ),
      },
      {
        id: "opening_credit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Opening Credit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" c="slate.7" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.opening_credit)}
          </Text>
        ),
      },
      {
        id: "debit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Debit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" fw={500} c="info.6" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.debit)}
          </Text>
        ),
      },
      {
        id: "credit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Credit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" fw={500} c="accent.6" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.credit)}
          </Text>
        ),
      },
      {
        id: "closing_debit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Closing Debit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" fw={700} c="slate.9" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.closing_debit)}
          </Text>
        ),
      },
      {
        id: "closing_credit",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Closing Credit
          </Text>
        ),
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" ta="right" fw={700} c="slate.9" style={{ fontFamily: "var(--mantine-font-family-monospace)", fontVariantNumeric: "tabular-nums" }}>
            {nf(baseCurrency, row.original.closing_credit)}
          </Text>
        ),
      },
    ],
    [baseCurrency],
  );
}

/* ───────────────── Page ───────────────── */

export function TrialBalance() {
  
  useCurrencyReady();
  const { data, loading, error, handleRefresh, filters, setFilters, tableData, expanded, setExpanded, baseCurrency } =
    useTrialBalance();

  const columns = useColumns(baseCurrency);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (error && !data) {
    return (
      <Stack align="center" py={80} gap="sm">
        <IconAlertCircle size={26} color="var(--mantine-color-danger-5)" />
        <Text fz="sm" c="danger.6">
          {error}
        </Text>
        <Button size="xs" leftSection={<IconRefresh size={13} />} onClick={handleRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md" p="lg">
      <FilterBar filters={filters} setFilters={setFilters} onRefresh={handleRefresh} loading={loading} />

      <Paper withBorder radius="md" shadow="sm" style={{ overflow: "hidden" }}>
        <Box style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520, position: "relative" }}>
          <Table stickyHeader horizontalSpacing="sm" verticalSpacing={6} style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as { align?: string } | undefined)?.align === "right"
                        ? "right"
                        : "left";
                    return (
                      <Table.Th key={header.id} style={{ width: header.getSize(), textAlign: align, whiteSpace: "nowrap" }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} h={240}>
                    <Group justify="center">
                      <Loader size="sm" color="indigoAlt.4" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} py={64} ta="center">
                    <Text fz="xs" c="slate.4">
                      No trial balance data.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id} style={{ whiteSpace: "nowrap" }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>

            {!loading && rows.length > 0 && data && (
              <Table.Tfoot style={{ position: "sticky", bottom: 0, background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr style={{ borderTop: "2px solid var(--mantine-color-slate-3)" }}>
                  <Table.Td>
                    <Text fz="xs" fw={700} c="indigoAlt.6">
                      TOTAL
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="slate.8" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.opening_debit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="slate.8" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.opening_credit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="info.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.debit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="accent.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.credit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="slate.9" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.closing_debit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fz="xs" fw={700} c="slate.9" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                      {nf(baseCurrency, data.totals.closing_credit)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            )}
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}