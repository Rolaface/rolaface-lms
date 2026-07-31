import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { Loader } from "@mantine/core";
import {
  IconRefresh,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconLayoutList,
  IconAlertCircle,
} from "@tabler/icons-react";

import {
  type BSData,
  type BSNode,
  type BSSummaryItem,
  formatAmount,
} from "../../api/Accounting/Balancesheet.api";
import { useBalanceSheet } from "../../hooks/Accounting/Balancesheet.logic";

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  summary,
  loading,
}: {
  summary: BSSummaryItem[];
  loading: boolean;
}) {
  const colorFor = (item: BSSummaryItem) => {
    if (item.indicator === "green") return "text-emerald-600";
    if (item.indicator === "red") return "text-red-500";
    return "text-gray-800";
  };

  const items =
    loading || summary.length === 0 ? Array.from({ length: 4 }) : summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item: any, i) => (
        <div
          key={item?.label ?? i}
          className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-1.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">
            {item?.label ?? "—"}
          </span>
          {loading || !item ? (
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          ) : (
            <span
              className={`text-sm font-bold tabular-nums ${colorFor(item)}`}
            >
              {formatAmount(item.currency ?? "INR", item.value)}
            </span>
          )}
        </div>
      ))}
    </div>
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

  const selectClass =
    "h-8 px-2 text-xs border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
  const inputClass =
    "h-8 px-2 text-xs border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
  const btnClass =
    "h-8 px-3 flex items-center gap-1.5 text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-indigo-300 rounded-md transition-colors whitespace-nowrap";

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Mode
        </label>
        <select
          className={selectClass}
          value={filters.mode}
          onChange={(e) => setMode(e.target.value as any)}
        >
          <option value="Fiscal Year">Fiscal Year</option>
          <option value="Date Range">Date Range</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Period
        </label>
        <select
          className={selectClass}
          value={filters.periodicity}
          onChange={(e) => setPeriodicity(e.target.value as any)}
        >
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Half-Yearly">Half-Yearly</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>

      {filters.mode === "Fiscal Year" ? (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Fiscal Year
          </label>
          <input
            type="text"
            className={`${inputClass} w-28`}
            value={filters.fromFiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            placeholder="2026-2027"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              From
            </label>
            <input
              type="date"
              className={`${inputClass} w-[150px]`}
              value={filters.fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              To
            </label>
            <input
              type="date"
              className={`${inputClass} w-[150px]`}
              value={filters.toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <button onClick={handleToggleExpand} className={btnClass}>
          {allExpanded ? (
            <IconChevronRight size={13} />
          ) : (
            <IconLayoutList size={13} />
          )}
          {allExpanded ? "Collapse" : "Expand All"}
        </button>
        <button onClick={handleRefresh} className={btnClass}>
          <IconRefresh size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Section header ───────────────── */

function SectionHeader({
  label,
  accentClass,
}: {
  label: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`w-1 h-4 rounded-full inline-block ${accentClass}`} />
      <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">
        {label}
      </span>
    </div>
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

  const leafColumns = table.getAllLeafColumns();

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[420px] relative">
        <table
          className="border-collapse"
          style={{
            tableLayout: "fixed",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <colgroup>
            {leafColumns.map((col) => (
              <col key={col.id} style={{ width: col.getSize() }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const align =
                    (
                      header.column.columnDef.meta as
                        { align?: string } | undefined
                    )?.align === "right"
                      ? "text-right"
                      : "text-left";
                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap bg-gray-50 border-b-2 border-gray-200 ${align}`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ height: "160px" }}>
                  <div className="flex justify-center items-center h-full">
                    <Loader size="sm" color="indigo" />
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-xs text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/50 transition-colors h-[34px] border-b border-gray-100 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (
                        cell.column.columnDef.meta as
                          { align?: string } | undefined
                      )?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-1 whitespace-nowrap ${align}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────── Page ───────────────── */

export function BalanceSheet() {
  const bs = useBalanceSheet();
  const { data, loading, error } = bs;

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
              <div
                className="flex items-center gap-1.5"
                style={{ paddingLeft: `${row.depth * 18}px` }}
              >
                {canExpand ? (
                  <button
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    className="shrink-0 text-gray-400 hover:text-gray-700 flex items-center gap-1"
                  >
                    <IconChevronRight
                      size={13}
                      className={`transition-transform duration-150 ${row.getIsExpanded() ? "rotate-90" : ""}`}
                    />
                    {row.getIsExpanded() ? (
                      <IconFolderOpen size={14} />
                    ) : (
                      <IconFolder size={14} />
                    )}
                  </button>
                ) : (
                  <IconFileText size={13} className="text-gray-300 shrink-0" />
                )}
                <span
                  className={`text-xs truncate ${node.is_group ? "font-bold text-gray-900" : "text-gray-700"}`}
                >
                  {node.account_name}
                </span>
              </div>
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
          <span
            className={`text-xs tabular-nums ${row.original.is_group ? "font-bold text-gray-900" : "text-gray-700"}`}
          >
            {formatAmount(
              row.original.currency ?? "INR",
              row.original.periods?.[col.fieldname] ?? 0,
            )}
          </span>
        ),
      };
    });
  }, [data]);

  if (error && !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <IconAlertCircle size={26} className="text-red-500" />
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={bs.handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-md hover:bg-[#1E3A8A]/90"
        >
          <IconRefresh size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-6">
      <KpiStrip summary={data?.summary ?? []} loading={loading && !data} />

      <FilterBar bs={bs} />

      <div className="flex flex-col gap-2">
        <SectionHeader
          label="Application of Funds (Assets)"
          accentClass="bg-blue-600"
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
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader
          label="Source of Funds (Liabilities)"
          accentClass="bg-red-500"
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
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader label="Equity" accentClass="bg-violet-500" />
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
      </div>
    </div>
  );
}