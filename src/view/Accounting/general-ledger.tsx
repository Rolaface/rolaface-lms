/* ───────────────────────────────────────────────────────────
   GeneralLedger — UI layer
   Matches the reference layout: filter bar (Back + Account +
   From/To + Apply) → Opening/Period/Closing KPI strip → table.
   No state or business logic here — all wired to useGeneralLedger().
   ─────────────────────────────────────────────────────────── */

import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Loader } from '@mantine/core';
import {
  IconRefresh,
  IconBook,
  IconTrendingUp,
  IconTrendingDown,
  IconScale,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

import { type LedgerRow, type Summary } from '../../api/Accounting/Generalledger.api';
import { useGeneralLedger } from '../../hooks/Accounting/Generalledger.logic';

export interface GeneralLedgerProps {
  account?: string;
  onBack?: () => void;
}

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  summary, displayAmount,
}: {
  summary: Summary;
  displayAmount: (amount: number) => string;
}) {
  const sections = [
    {
      icon: <IconScale size={13} className="text-blue-400" />,
      label: 'Opening',
      items: [
        { label: 'Debit', value: summary.opening.debit, color: 'text-blue-500' },
        { label: 'Credit', value: summary.opening.credit, color: 'text-amber-500' },
        { label: 'Balance', value: summary.opening.balance, color: summary.opening.balance >= 0 ? 'text-emerald-600' : 'text-red-500', bold: true },
      ],
    },
    {
      icon: <IconTrendingUp size={13} className="text-emerald-400" />,
      label: 'Period',
      items: [
        { label: 'Debit', value: summary.total.debit, color: 'text-blue-500' },
        { label: 'Credit', value: summary.total.credit, color: 'text-amber-500' },
        { label: 'Balance', value: summary.total.balance, color: summary.total.balance >= 0 ? 'text-emerald-600' : 'text-red-500', bold: true },
      ],
    },
    {
      icon: <IconTrendingDown size={13} className="text-amber-400" />,
      label: 'Closing',
      items: [
        { label: 'Debit', value: summary.closing.debit, color: 'text-blue-500' },
        { label: 'Credit', value: summary.closing.credit, color: 'text-amber-500' },
        { label: 'Balance', value: summary.closing.balance, color: summary.closing.balance >= 0 ? 'text-emerald-600' : 'text-red-500', bold: true },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {sections.map((sec) => (
        <div key={sec.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            {sec.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {sec.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 divide-x divide-gray-100">
            {sec.items.map((kpi) => (
              <div key={kpi.label} className="flex flex-col gap-0.5 px-2 first:pl-0 last:pr-0">
                <span className="text-[11px] text-gray-500">{kpi.label}</span>
                <span className={`text-[13px] tabular-nums ${kpi.color} ${kpi.bold ? 'font-bold' : 'font-semibold'}`}>
                  {displayAmount(kpi.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────── Filter bar ───────────────── */

function FilterBar({
  account, setAccount, fromDate, setFromDate, toDate, setToDate,
  onApply, onBack, showBack, loading,
}: {
  account: string;
  setAccount: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onApply: () => void;
  onBack: () => void;
  showBack: boolean;
  loading: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
            <IconBook size={10} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">
            General Ledger
          </span>
        </div>
        {showBack && (
          <button
            onClick={onBack}
            className="h-8 flex items-center gap-1 text-sm px-3 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap"
          >
            <IconChevronLeft size={14} /> Back
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account</label>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="e.g. Debtors INR"
            className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        <button
          onClick={onApply}
          disabled={loading || !account.trim()}
          className="h-9 flex items-center gap-1.5 px-4 bg-[#1E3A8A] text-white text-sm font-semibold
                     rounded-md hover:bg-[#1E3A8A]/90 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? <IconRefresh size={14} className="animate-spin" /> : <IconBook size={14} />}
          Apply
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Page ───────────────── */

export function GeneralLedger({ account: accountProp, onBack }: GeneralLedgerProps) {
  const navigate = useNavigate();

  const {
    account, setAccount,
    fromDate, setFromDate,
    toDate, setToDate,
    handleApply,
    glData, loading, error,
    page, handlePageChange, pageSize,
    displayAmount,
  } = useGeneralLedger(accountProp);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate({ to: '..' });
  };

  const columns = useMemo<ColumnDef<LedgerRow>[]>(() => {
    if (!glData?.columns) return [];
    return glData.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<LedgerRow> => {
        const isAmount = ['debit', 'credit', 'balance'].includes(col.fieldname);
        return {
          id: col.fieldname,
          accessorKey: col.fieldname,
          header: col.label,
          size: col.width ?? (isAmount ? 130 : 160),
          meta: { align: isAmount ? 'right' : 'left' },
          cell: ({ row, getValue }) => {
            const val = getValue();
            const isSummary = row.original.is_summary_row;

            if (isAmount) {
              const n = Number(val ?? 0);
              if (n === 0) return <span className="text-xs text-gray-300">—</span>;
              const color =
                col.fieldname === 'balance'
                  ? n >= 0 ? 'text-emerald-600' : 'text-red-500'
                  : col.fieldname === 'debit' ? 'text-blue-500' : 'text-amber-500';
              return (
                <span className={`text-xs tabular-nums font-mono ${isSummary ? 'font-bold' : 'font-medium'} ${color}`}>
                  {displayAmount(n)}
                </span>
              );
            }
            if (col.fieldname === 'posting_date' && val) {
              return (
                <span className="text-xs text-gray-700 tabular-nums">
                  {new Date(String(val)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              );
            }
            if (col.fieldname === 'voucher_no' && val) return <span className="text-xs font-semibold text-indigo-600">{String(val)}</span>;
            if ((col.fieldname === 'party' || col.fieldname === 'party_name') && val) return <span className="text-xs font-medium text-gray-800">{String(val)}</span>;
            if (col.fieldname === 'account') return <span className={`text-xs text-gray-700 ${isSummary ? 'font-bold text-gray-900' : ''}`}>{String(val)}</span>;
            if (!val && val !== 0) return <span className="text-xs text-gray-300">—</span>;
            return <span className="text-xs text-gray-700">{String(val)}</span>;
          },
        };
      });
  }, [glData?.columns, displayAmount]);

  const table = useReactTable({
    data: glData?.ledger ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: glData?.pagination?.total_pages ?? -1,
  });

  const pagination = glData?.pagination;
  const summary = glData?.summary;
  const leafColumns = table.getAllLeafColumns();

  return (
    <div className="flex flex-col gap-3 p-6">
      <FilterBar
        account={account}
        setAccount={setAccount}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        onApply={handleApply}
        onBack={handleBack}
        showBack={!!accountProp}
        loading={loading}
      />

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {summary && <KpiStrip summary={summary} displayAmount={displayAmount} />}

      {columns.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[480px] relative">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {leafColumns.map((col) => (
                  <col key={col.id} style={{ width: col.getSize() }} />
                ))}
              </colgroup>

              <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const align = (header.column.columnDef.meta as { align?: string } | undefined)?.align === 'right' ? 'text-right' : 'text-left';
                      return (
                        <th
                          key={header.id}
                          className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap bg-gray-50 border-b-2 border-gray-200 ${align}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {loading && !glData?.ledger?.length ? (
                  <tr>
                    <td colSpan={columns.length} style={{ height: `${Math.min(pageSize, 10) * 38}px` }}>
                      <div className="flex justify-center items-center h-full">
                        <Loader size="sm" color="indigo" />
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-14 text-center text-xs text-gray-400">
                      No ledger entries found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isSummary = row.original.is_summary_row;
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors h-[36px] border-b border-gray-100 last:border-0 ${
                          isSummary ? 'bg-gray-50/70' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align = (cell.column.columnDef.meta as { align?: string } | undefined)?.align === 'right' ? 'text-right' : 'text-left';
                          return (
                            <td key={cell.id} className={`px-3 py-1 overflow-hidden text-ellipsis whitespace-nowrap ${align}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {loading && (glData?.ledger?.length ?? 0) > 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader size="sm" color="indigo" />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">
              {pagination && pagination.total_entries > 0 ? (
                <>
                  Showing{' '}
                  <span className="font-semibold text-gray-800">
                    {(pagination.page - 1) * pagination.page_size + 1}–
                    {Math.min(pagination.page * pagination.page_size, pagination.total_entries)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-800">{pagination.total_entries}</span>
                </>
              ) : (
                'No entries'
              )}
            </span>
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.has_prev || loading}
                  className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronLeft size={13} />
                </button>
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      disabled={loading}
                      className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                        p === page
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] font-bold'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.has_next || loading}
                  className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}