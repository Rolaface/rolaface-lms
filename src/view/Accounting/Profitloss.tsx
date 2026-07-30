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
  Paper,
  Select,
  TextInput,
  Button,
  Loader,
  Text,
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {(loading || !data ? Array.from({ length: 3 }) : items).map((item: any, i) => (
        <Paper key={item?.label ?? i} withBorder radius="md" className="px-4 py-3 flex flex-col gap-1.5 border-gray-200">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {item?.label ?? '—'}
          </span>
          {loading || !data ? (
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <span
              className={`text-sm font-extrabold tabular-nums ${
                item.indicator === 'green' ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {displayAmount(item.value)}
            </span>
          )}
        </Paper>
      ))}
    </div>
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
    <Paper withBorder radius="md" p="xs" className="shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          size="xs"
          label="Mode"
          data={['Fiscal Year', 'Date Range']}
          value={filters.mode}
          onChange={(v) => {
            const mode = (v || 'Fiscal Year') as typeof filters.mode;
            setFilters((f) => ({ ...f, mode }));
          }}
          className="w-36"
        />

        <Select
          size="xs"
          label="Period"
          data={['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']}
          value={filters.periodicity}
          onChange={(v) => setFilters((f) => ({ ...f, periodicity: (v || 'Monthly') as typeof filters.periodicity }))}
          className="w-32"
        />

        {filters.mode === 'Fiscal Year' ? (
          <>
            <TextInput
              size="xs"
              label="From FY"
              type="number"
              value={filters.from_fiscal_year}
              onChange={(e) => setFilters((f) => ({ ...f, from_fiscal_year: Number(e.currentTarget.value) }))}
              className="w-24"
            />
            <TextInput
              size="xs"
              label="To FY"
              type="number"
              value={filters.to_fiscal_year}
              onChange={(e) => setFilters((f) => ({ ...f, to_fiscal_year: Number(e.currentTarget.value) }))}
              className="w-24"
            />
          </>
        ) : (
          <>
            <TextInput
              size="xs"
              label="From"
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters((f) => ({ ...f, from_date: e.currentTarget.value }))}
              className="w-[150px]"
            />
            <TextInput
              size="xs"
              label="To"
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters((f) => ({ ...f, to_date: e.currentTarget.value }))}
              className="w-[150px]"
            />
          </>
        )}

        <Group_ />

        <Button
          size="xs"
          variant="default"
          className="ml-auto"
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
      </div>
    </Paper>
  );
}

// spacer to keep flex-wrap gaps consistent without importing Group just for this
function Group_() {
  return <div className="w-px self-stretch bg-gray-200" />;
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
              <div className="flex items-center gap-1.5" style={{ paddingLeft: row.depth * 18 }}>
                {canExpand ? (
                  <button
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    className="shrink-0 text-gray-400 hover:text-gray-700 flex items-center gap-1"
                  >
                    <IconChevronRight
                      size={12}
                      className={`transition-transform duration-150 ${row.getIsExpanded() ? 'rotate-90' : ''}`}
                    />
                    {row.getIsExpanded() ? <IconFolderOpen size={13} /> : <IconFolder size={13} />}
                  </button>
                ) : (
                  <IconFileText size={12} className="text-gray-400 opacity-60 shrink-0" />
                )}
                <Text fz="xs" fw={node.is_group ? 600 : 400} c="gray.8" truncate>
                  {node.account_name}
                </Text>
              </div>
            );
          },
        };
      }
      const isTotal = col.fieldname === 'total';
      return {
        id: col.fieldname,
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">{col.label}</Text>,
        size: isTotal ? 130 : 110,
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={isTotal ? 600 : 400}
            c={isTotal ? 'gray.9' : 'gray.7'}
            className="font-mono tabular-nums"
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
      <div className="flex flex-col items-center py-20 gap-3">
        <IconAlertCircle size={26} className="text-red-500" />
        <Text fz="sm" c="red">{error}</Text>
        <Button size="xs" leftSection={<IconRefresh size={13} />} onClick={handleRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-6">
      <Text fz="xl" fw={700} c="gray.9">Profit &amp; Loss</Text>

      <KpiStrip data={data} loading={isLoading && !data} displayAmount={displayAmount} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={handleRefresh}
        loading={isLoading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
      />

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px] relative">
          <table className="border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <colgroup>
              {table.getAllLeafColumns().map((col) => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2 text-[11px] font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-b border-gray-200">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading && !data ? (
                <tr>
                  <td colSpan={columns.length} style={{ height: 260 }}>
                    <div className="flex justify-center items-center h-full">
                      <Loader size="sm" color="indigoAlt.4" />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-xs text-gray-400">
                    No Profit &amp; Loss data.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors h-[34px] border-b border-gray-100 last:border-0">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-1 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {isLoading && data && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader size="sm" color="indigoAlt.4" />
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}