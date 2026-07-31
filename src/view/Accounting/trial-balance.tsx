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
  TextInput,
  Checkbox,
  Button,
  Group,
  Text,
  ActionIcon,
  Loader,
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

/* ───────────────── Filter bar ───────────────── */

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
  return (
    <Paper withBorder radius="md" p="xs" className="shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <Group gap={4} wrap="nowrap">
          <Text fz="xs" fw={600} c="gray.5" className="uppercase tracking-wide">
            From
          </Text>
          <TextInput
            size="xs"
            type="date"
            value={filters.from_date}
            onChange={(e) =>
              setFilters((f) => ({ ...f, from_date: e.currentTarget.value }))
            }
            className="w-[150px]"
          />
        </Group>

        <Group gap={4} wrap="nowrap">
          <Text fz="xs" fw={600} c="gray.5" className="uppercase tracking-wide">
            To
          </Text>
          <TextInput
            size="xs"
            type="date"
            value={filters.to_date}
            onChange={(e) =>
              setFilters((f) => ({ ...f, to_date: e.currentTarget.value }))
            }
            className="w-[150px]"
          />
        </Group>

        <Group gap={4} wrap="nowrap">
          <Text fz="xs" fw={600} c="gray.5" className="uppercase tracking-wide">
            FY
          </Text>
          <TextInput
            size="xs"
            placeholder="2026-2027"
            value={filters.fiscal_year}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setFilters((f) => ({ ...f, fiscal_year: value }));
            }}
            className="w-28"
          />
        </Group>

        <div className="w-px self-stretch bg-gray-200" />

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
              with_period_closing_entry:
                e.target?.checked ?? !f.with_period_closing_entry,
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
              show_closing_entries:
                e.target?.checked ?? !f.show_closing_entries,
            }))
          }
        />

        <Button
          size="xs"
          variant="default"
          className="ml-auto"
          leftSection={
            <IconRefresh size={13} className={loading ? "animate-spin" : ""} />
          }
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </Paper>
  );
}

/* ───────────────── Columns ───────────────── */

function useColumns(): ColumnDef<TBAccount>[] {
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
            <div
              className="flex items-center gap-1.5"
              style={{ paddingLeft: row.depth * 18 }}
            >
              {canExpand ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={row.getToggleExpandedHandler()}
                >
                  <IconChevronRight
                    size={12}
                    className={`transition-transform duration-150 ${row.getIsExpanded() ? "rotate-90" : ""}`}
                  />
                  {row.getIsExpanded() ? (
                    <IconFolderOpen size={13} />
                  ) : (
                    <IconFolder size={13} />
                  )}
                </ActionIcon>
              ) : (
                <span className="w-[23px] flex items-center justify-center">
                  <IconBook size={12} className="text-gray-400 opacity-60" />
                </span>
              )}
              <Text
                fz="xs"
                fw={row.depth === 0 ? 600 : 400}
                c="gray.8"
                truncate
              >
                {node.account_name}
              </Text>
            </div>
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            c="gray.7"
            className="font-mono tabular-nums"
          >
            {nf(row.original.opening_debit)}
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            c="gray.7"
            className="font-mono tabular-nums"
          >
            {nf(row.original.opening_credit)}
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={500}
            c="blue.6"
            className="font-mono tabular-nums"
          >
            {nf(row.original.debit)}
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={500}
            c="orange.6"
            className="font-mono tabular-nums"
          >
            {nf(row.original.credit)}
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={700}
            c="gray.9"
            className="font-mono tabular-nums"
          >
            {nf(row.original.closing_debit)}
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
        cell: ({ row }) => (
          <Text
            fz="xs"
            ta="right"
            fw={700}
            c="gray.9"
            className="font-mono tabular-nums"
          >
            {nf(row.original.closing_credit)}
          </Text>
        ),
      },
    ],
    [],
  );
}

/* ───────────────── Page ───────────────── */

export function TrialBalance() {
  const {
    data,
    loading,
    error,
    handleRefresh,
    filters,
    setFilters,
    tableData,
    expanded,
    setExpanded,
  } = useTrialBalance();

  const columns = useColumns();

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
      <div className="flex flex-col items-center py-20 gap-3">
        <IconAlertCircle size={26} className="text-red-500" />
        <Text fz="sm" c="red">
          {error}
        </Text>
        <Button
          size="xs"
          leftSection={<IconRefresh size={13} />}
          onClick={handleRefresh}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Box className="flex flex-col gap-4 p-6 ">
      <div className="flex justify-between items-start flex-wrap gap-3"></div>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px] relative">
          <table
            className="border-collapse"
            style={{
              tableLayout: "fixed",
              width: "max-content",
              minWidth: "100%",
            }}
          >
            <colgroup>
              {table.getAllLeafColumns().map((col) => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-[11px] font-semibold text-gray-600 whitespace-nowrap bg-gray-50 border-b border-gray-200"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} style={{ height: 240 }}>
                    <div className="flex justify-center items-center h-full">
                      <Loader size="sm" color="indigoAlt.4" />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-xs text-gray-400"
                  >
                    No trial balance data.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 transition-colors h-[34px] border-b border-gray-100 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-1 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>

            {!loading && rows.length > 0 && data && (
              <tfoot className="sticky bottom-0 z-10">
                <tr className="bg-gray-50 border-t-2 border-gray-300 h-[34px] shadow-[0_-1px_0_0_rgba(0,0,0,0.06)]">
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50">
                    <Text fz="xs" fw={700} c="indigoAlt.6">
                      TOTAL
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="gray.8" className="font-mono">
                      {nf(data.totals.opening_debit)}
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="gray.8" className="font-mono">
                      {nf(data.totals.opening_credit)}
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="blue.6" className="font-mono">
                      {nf(data.totals.debit)}
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="orange.6" className="font-mono">
                      {nf(data.totals.credit)}
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="gray.9" className="font-mono">
                      {nf(data.totals.closing_debit)}
                    </Text>
                  </td>
                  <td className="px-3 py-1 whitespace-nowrap bg-gray-50 text-right">
                    <Text fz="xs" fw={700} c="gray.9" className="font-mono">
                      {nf(data.totals.closing_credit)}
                    </Text>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Paper>
    </Box>
  );
}
