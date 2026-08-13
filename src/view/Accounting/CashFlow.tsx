import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
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
} from '@mantine/core';
import {
  IconRefresh,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconLayoutList,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconArrowsLeftRight,
} from '@tabler/icons-react';
import { DateInput } from "@mantine/dates";

import { type CFNode, type CFSummaryItem, isNetRow } from '../../api/Accounting/Cashflow.api';
import { useCashFlow } from '../../hooks/Accounting/cash-flow/Cashflow.logic';
import { formatAmount } from '../../store/currencyStore';

/* ───────────────── Summary color / icon (label-based, theme tokens) ───────────────── */

function summaryColor(item: CFSummaryItem): string {
  const label = item.label?.toLowerCase() ?? '';
  const value = item.value ?? 0;

  if (label.includes('operating')) return 'info.6';
  if (label.includes('investing')) return 'indigoAlt.6';
  if (label.includes('financing')) return 'accent.6';
  if (label.includes('net')) return value >= 0 ? 'success.6' : 'danger.5';

  return value >= 0 ? 'success.6' : 'danger.5';
}

function SummaryIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes('operating')) return <IconWallet size={12} color="var(--mantine-color-info-6)" />;
  if (l.includes('investing')) return <IconTrendingUp size={12} color="var(--mantine-color-indigoAlt-6)" />;
  if (l.includes('financing')) return <IconArrowsLeftRight size={12} color="var(--mantine-color-accent-6)" />;
  return <IconTrendingDown size={12} color="var(--mantine-color-success-6)" />;
}

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  summary,
  loading,
  baseCurrency,
}: {
  summary: CFSummaryItem[];
  loading: boolean;
  baseCurrency: string;
}) {
  const items = loading || summary.length === 0 ? Array.from({ length: 4 }) : summary;

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      {items.map((item: any, i) => (
        <Paper key={item?.label ?? i} withBorder radius="md" p="sm">
          <Group gap={6} mb={4} wrap="nowrap">
            {item && <SummaryIcon label={item.label} />}
            <Text fz="10px" fw={700} tt="uppercase" c="slate.4" style={{ letterSpacing: '0.08em' }} truncate>
              {item?.label ?? '—'}
            </Text>
          </Group>
          {loading || !item ? (
            <Box h={16} w={96} style={{ background: 'var(--mantine-color-slate-1)', borderRadius: 4 }} className="animate-pulse" />
          ) : (
            <Text fz="sm" fw={700} c={summaryColor(item)} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatAmount(item.currency ?? baseCurrency, item.value, { withSymbol: true })}
            </Text>
          )}
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/* ───────────────── Filter bar ───────────────── */

function FilterBar({ cf }: { cf: ReturnType<typeof useCashFlow> }) {
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
  } = cf;

  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap="sm" wrap="wrap" align="flex-end">
        <Select
          size="xs"
          label="Mode"
          data={['Fiscal Year', 'Date Range']}
          value={filters.mode}
          onChange={(v) => setMode((v ?? 'Fiscal Year') as any)}
          w={144}
        />

        <Select
          size="xs"
          label="Period"
          data={['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']}
          value={filters.periodicity}
          onChange={(v) => setPeriodicity((v ?? 'Monthly') as any)}
          w={128}
        />

        {filters.mode === 'Fiscal Year' ? (
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
            leftSection={allExpanded ? <IconChevronRight size={13} /> : <IconLayoutList size={13} />}
            onClick={handleToggleExpand}
          >
            {allExpanded ? 'Collapse' : 'Expand All'}
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconRefresh size={13} className={loading ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}

/* ───────────────── Page ───────────────── */

export function CashFlow() {
  const cf = useCashFlow();
  const { data, loading, error, baseCurrency } = cf;

  const columns = useMemo<ColumnDef<CFNode>[]>(() => {
    if (!data?.columns) return [];

    return data.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<CFNode> => {
        if (col.fieldname === 'section') {
          return {
            id: 'section',
            header: col.label,
            size: col.width ?? 260,
            cell: ({ row }) => {
              const node = row.original;
              const isNet = isNetRow(node.section, node.parent_section);
              const canExpand = row.getCanExpand();

              return (
                <Group gap={6} wrap="nowrap" style={{ paddingLeft: row.depth * 18 }}>
                  {canExpand ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={row.getToggleExpandedHandler()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                        color: 'var(--mantine-color-slate-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <IconChevronRight
                        size={13}
                        style={{
                          transition: 'transform 150ms ease',
                          transform: row.getIsExpanded() ? 'rotate(90deg)' : 'none',
                        }}
                      />
                      {row.getIsExpanded() ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
                    </Box>
                  ) : (
                    <IconFileText size={13} color="var(--mantine-color-slate-3)" style={{ flexShrink: 0 }} />
                  )}
                  <Text
                    fz="xs"
                    fw={isNet ? 700 : node.children.length ? 600 : 400}
                    c={isNet ? 'brand.6' : node.children.length ? 'slate.8' : 'slate.6'}
                    truncate
                  >
                    {node.section}
                  </Text>
                </Group>
              );
            },
          };
        }

        return {
          id: col.fieldname,
          header: col.label,
          size: col.fieldname === 'total' ? 130 : 110,
          meta: { align: 'right' },
          cell: ({ row }) => {
            const val = row.original.periods?.[col.fieldname] ?? 0;
            const color = val > 0 ? 'success.6' : val < 0 ? 'danger.5' : 'slate.6';
            return (
              <Text fz="xs" c={color} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(row.original.currency ?? baseCurrency, val, { withSymbol: true })}
              </Text>
            );
          },
        };
      });
  }, [data, baseCurrency]);

  const table = useReactTable({
    data: data?.tree ?? [],
    columns,
    state: { expanded: cf.expanded },
    onExpandedChange: (updater) => {
      cf.setExpanded(updater);
    },
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (error && !data) {
    return (
      <Stack align="center" py={80} gap="sm">
        <IconAlertCircle size={26} color="var(--mantine-color-danger-5)" />
        <Text fz="sm" c="danger.6">
          {error}
        </Text>
        <Button size="xs" color="brand" leftSection={<IconRefresh size={14} />} onClick={cf.handleRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="lg">
      <KpiStrip summary={data?.summary ?? []} loading={loading && !data} baseCurrency={baseCurrency} />

      <FilterBar cf={cf} />

      <Paper withBorder radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
        <Box style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520, position: 'relative' }}>
          <Table
            stickyHeader
            horizontalSpacing="sm"
            verticalSpacing={6}
            style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
          >
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as { align?: string } | undefined)?.align === 'right'
                        ? 'right'
                        : 'left';
                    return (
                      <Table.Th key={header.id} style={{ width: header.getSize(), textAlign: align, whiteSpace: 'nowrap' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {loading && !data ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} h={200}>
                    <Group justify="center">
                      <Loader size="sm" color="indigoAlt.4" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} py={40} ta="center">
                    <Text fz="xs" c="slate.4">
                      No cash flow data found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const net = isNetRow(row.original.section, row.original.parent_section);
                  return (
                    <Table.Tr
                      key={row.id}
                      style={net ? { background: 'var(--mantine-color-slate-0)', borderTop: '2px solid var(--mantine-color-slate-2)' } : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          (cell.column.columnDef.meta as { align?: string } | undefined)?.align === 'right'
                            ? 'right'
                            : 'left';
                        return (
                          <Table.Td key={cell.id} style={{ textAlign: align, whiteSpace: 'nowrap' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}