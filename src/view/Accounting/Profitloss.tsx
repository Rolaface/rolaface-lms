import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
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
} from '@tabler/icons-react';

import { type PLNode } from '../../api/Accounting/Profitloss.api';
import { useProfitLoss } from '../../hooks/Accounting/Useprofitloss';

/* ───────────────── Helpers ───────────────── */

const buildExpandedToDepth = (nodes: PLNode[], depth: number, path = ''): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
};

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  data,
  loading,
  displayAmount,
}: {
  data: ReturnType<typeof useProfitLoss>['data'];
  loading: boolean;
  displayAmount: (n: number) => string;
}) {
  const items = data?.summary ?? [];

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
      {(loading || !data ? Array.from({ length: 3 }) : items).map((item: any, i) => (
        <Paper key={item?.label ?? i} withBorder radius="md" p="sm">
          <Text fz="10px" fw={700} tt="uppercase" c="slate.4" style={{ letterSpacing: '0.08em' }} mb={4}>
            {item?.label ?? '—'}
          </Text>
          {loading || !data ? (
            <Box h={16} w={96} style={{ background: 'var(--mantine-color-slate-1)', borderRadius: 4 }} className="animate-pulse" />
          ) : (
            <Text
              fz="sm"
              fw={800}
              c={item.indicator === 'green' ? 'success.6' : 'danger.5'}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayAmount(item.value)}
            </Text>
          )}
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/* ───────────────── Filter bar ───────────────── */

function FilterBar({
  filters, setFilters, onRefresh, loading, allExpanded, onToggleExpand,
}: {
  filters: ReturnType<typeof useProfitLoss>['filters'];
  setFilters: ReturnType<typeof useProfitLoss>['setFilters'];
  onRefresh: () => void;
  loading: boolean;
  allExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Paper withBorder radius="md" p="xs" shadow="sm">
      <Group gap="sm" wrap="wrap" align="flex-end">
        <Select
          size="xs"
          label="Mode"
          data={['Fiscal Year', 'Date Range']}
          value={filters.mode}
          onChange={(v) => {
            const mode = (v || 'Fiscal Year') as typeof filters.mode;
            setFilters((f) => ({ ...f, mode }));
          }}
          w={144}
        />

        <Select
          size="xs"
          label="Period"
          data={['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']}
          value={filters.periodicity}
          onChange={(v) => setFilters((f) => ({ ...f, periodicity: (v || 'Monthly') as typeof filters.periodicity }))}
          w={128}
        />

        {filters.mode === 'Fiscal Year' ? (
          <TextInput
            size="xs"
            label="Fiscal Year"
            type="text"
            value={filters.from_fiscal_year}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                from_fiscal_year: e.currentTarget.value,
                to_fiscal_year: e.currentTarget.value,
              }))
            }
            placeholder="2026-2027"
            w={112}
          />
        ) : (
          <>
            <TextInput
              size="xs"
              label="From"
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters((f) => ({ ...f, from_date: e.currentTarget.value }))}
              w={150}
            />
            <TextInput
              size="xs"
              label="To"
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters((f) => ({ ...f, to_date: e.currentTarget.value }))}
              w={150}
            />
          </>
        )}

        <Box w={1} h={24} style={{ background: 'var(--mantine-color-slate-2)', alignSelf: 'stretch' }} />

        <Button
          size="xs"
          variant="default"
          ml="auto"
          leftSection={allExpanded ? <IconChevronRight size={13} /> : <IconLayoutList size={13} />}
          onClick={onToggleExpand}
        >
          {allExpanded ? 'Collapse' : 'Expand All'}
        </Button>
        <Button
          size="xs"
          variant="default"
          leftSection={<IconRefresh size={13} className={loading ? 'animate-spin' : ''} />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Group>
    </Paper>
  );
}

/* ───────────────── Page ───────────────── */

export function ProfitLoss() {
  const { filters, setFilters, data, tableData, isLoading, error, displayAmount, handleRefresh } = useProfitLoss();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    if (!data) return;
    setExpanded(buildExpandedToDepth(tableData, 2));
    setAllExpanded(false);
  }, [data, tableData]);

  const handleToggleExpand = () => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  };

  const columns = useMemo<ColumnDef<PLNode>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col): ColumnDef<PLNode> => {
      if (col.fieldname === 'account') {
        return {
          id: 'account_name',
          header: col.label,
          size: 240,
          cell: ({ row }) => {
            const node = row.original;
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
                      size={12}
                      style={{
                        transition: 'transform 150ms ease',
                        transform: row.getIsExpanded() ? 'rotate(90deg)' : 'none',
                      }}
                    />
                    {row.getIsExpanded() ? <IconFolderOpen size={13} /> : <IconFolder size={13} />}
                  </Box>
                ) : (
                  <IconFileText size={12} color="var(--mantine-color-slate-4)" style={{ opacity: 0.6, flexShrink: 0 }} />
                )}
                <Text fz="xs" fw={node.is_group ? 600 : 400} c="slate.8" truncate>
                  {node.account_name}
                </Text>
              </Group>
            );
          },
        };
      }
      const isTotal = col.fieldname === 'total';
      return {
        id: col.fieldname,
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">{col.label}</Text>,
        size: isTotal ? 130 : 110,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={isTotal ? 600 : 400}
            c={isTotal ? 'slate.9' : 'slate.7'}
            style={{ fontFamily: 'var(--mantine-font-family-monospace)', fontVariantNumeric: 'tabular-nums' }}
          >
            {isTotal ? displayAmount(row.original.total) : displayAmount(row.original.periods?.[col.fieldname] ?? 0)}
          </Text>
        ),
      };
    });
  }, [data, displayAmount]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      setAllExpanded(false);
    },
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (error && !data) {
    return (
      <Stack align="center" py={80} gap="sm">
        <IconAlertCircle size={26} color="var(--mantine-color-danger-5)" />
        <Text fz="sm" c="danger.6">{error}</Text>
        <Button size="xs" leftSection={<IconRefresh size={13} />} onClick={handleRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="lg">
      <KpiStrip data={data} loading={isLoading && !data} displayAmount={displayAmount} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={handleRefresh}
        loading={isLoading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
      />

      <Paper withBorder radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
        <Box style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520, position: 'relative' }}>
          <Table stickyHeader horizontalSpacing="sm" verticalSpacing={6} style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
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
              {isLoading && !data ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} h={260}>
                    <Group justify="center">
                      <Loader size="sm" color="indigoAlt.4" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} py={64} ta="center">
                    <Text fz="xs" c="slate.4">
                      No Profit &amp; Loss data.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id} style={{ whiteSpace: 'nowrap' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          {isLoading && data && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                background: 'color-mix(in srgb, var(--mantine-color-white) 60%, transparent)',
                backdropFilter: 'blur(1px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <Loader size="sm" color="indigoAlt.4" />
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}