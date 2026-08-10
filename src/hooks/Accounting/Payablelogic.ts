import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  type PayableFilters,
  type PayableStatus,
  type PayableVoucherType,
  type SelectOption,
  fetchPayables,
  fetchSupplierOptions,
  fetchCostCenterOptions,
  fetchPayableAccountOptions,
} from '../../api/Accounting/Payable.api';
import { showApiError } from '../../utils/alert';
import { useCompanyStore } from '../../store/companyStore';
import {
  formatAmount as storeFormatAmount,
  ensureCurrencies,
  useCurrencyReady,
} from '../../store/currencyStore';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const PAGE_SIZE = 20;

/* ───────────────── Query key builder ───────────────── */

export const payableKeys = {
  all: ['payables'] as const,
  list: (filters: PayableFilters, page: number, pageSize: number) =>
    [...payableKeys.all, 'list', filters, page, pageSize] as const,
};

export function usePayable() {
  // ── Filter state (UI-only, unchanged) ──────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PayableStatus | 'all'>('all');
  const [postingDate, setPostingDate] = useState(getTodayDate());
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<PayableVoucherType | ''>('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedPayableAccount, setSelectedPayableAccount] = useState('');

  // ── Pagination ──────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── View modal ────────────────────────────────────────────
  const [viewRowId, setViewRowId] = useState<string | null>(null);

  // ── Export (one-off fetch, not cached — no useQuery needed) ──
  const [isExporting, setIsExporting] = useState(false);

  // ── Currency store ──────────────────────────────────────────
  // Subscribes this hook (and any component consuming it) to the
  // currency cache so amounts re-render once real symbols/number
  // formats arrive, instead of staying stuck on defaults.
  useCurrencyReady();
  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  const filters: PayableFilters = useMemo(
    () => ({
      search: searchTerm,
      status: filterStatus,
      postingDate,
      voucherType: selectedVoucherType,
      costCenter: selectedCostCenter,
      payableAccount: selectedPayableAccount,
      suppliers: selectedSuppliers,
      groupBy: selectedGroupBy,
    }),
    [
      searchTerm,
      filterStatus,
      postingDate,
      selectedVoucherType,
      selectedCostCenter,
      selectedPayableAccount,
      selectedSuppliers,
      selectedGroupBy,
    ],
  );

  /* ── Main list query — refetches whenever filters or page change ── */
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: payableKeys.list(filters, page, PAGE_SIZE),
    queryFn: () => fetchPayables(filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData, // avoids UI flash/empty state during pagination & filter changes
    staleTime: 30_000,
  });

  /* ── Dropdown master data — fetched once, cached 5 min ── */
  const { data: supplierOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['payable-suppliers'],
    queryFn: fetchSupplierOptions,
    staleTime: 5 * 60_000,
  });

  const { data: costCenterOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['payable-cost-centers'],
    queryFn: fetchCostCenterOptions,
    staleTime: 5 * 60_000,
  });

  const { data: payableAccountOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['payable-accounts'],
    queryFn: fetchPayableAccountOptions,
    staleTime: 5 * 60_000,
  });

  // Reset to page 1 whenever filters change (but not when page itself changes)
  const filtersKey = JSON.stringify(filters);
  const prevFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      setPage(1);
    }
  }, [filtersKey]);

  // Surface fetch errors via the alert system (side-effect, not render logic)
  useEffect(() => {
    if (isError) showApiError('Failed to fetch payables.');
  }, [isError]);

  // Make sure the currency store actually has every currency we're about
  // to display — the company's base currency (used for KPI totals, which
  // aren't tied to a single row) plus every distinct row.currency on the
  // current page. ensureCurrencies() no-ops for codes already cached.
  useEffect(() => {
    const codes = new Set<string>();
    if (baseCurrency) codes.add(baseCurrency);
    (data?.rows ?? []).forEach((r) => {
      if (r.currency) codes.add(r.currency);
    });
    if (codes.size > 0) ensureCurrencies([...codes]);
  }, [data, baseCurrency]);

  const handlePageChange = useCallback((pg: number) => {
    setPage(pg);
  }, []);

  const hasActiveFilters =
    selectedSuppliers.length > 0 ||
    selectedCostCenter !== '' ||
    selectedPayableAccount !== '' ||
    selectedVoucherType !== '' ||
    selectedGroupBy.length > 0 ||
    filterStatus !== 'all' ||
    searchTerm !== '' ||
    postingDate !== getTodayDate();

  const clearAll = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setSelectedVoucherType('');
    setSelectedGroupBy([]);
    setSelectedSuppliers([]);
    setSelectedCostCenter('');
    setSelectedPayableAccount('');
    setPostingDate(getTodayDate());
  }, []);

  /* ── Export: deliberately bypasses the query cache — it's a one-off
     "give me everything, right now" fetch, not something we want cached
     or re-triggered by cache invalidation. ── */
  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const resp = await fetchPayables(filters, 1, 999999);
      return resp.rows;
    } catch {
      showApiError('Failed to export payables.');
      return [];
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  // Row-level amounts pass their own currency (r.currency). KPI amounts
  // don't carry a currency (they're aggregates), so when no currency is
  // given we fall back to the company's base currency instead of a
  // hardcoded default.
  const displayAmount = useCallback(
    (currency: string | undefined, amount: number) =>
      storeFormatAmount(currency ?? baseCurrency, amount, { withSymbol: true }),
    [baseCurrency],
  );

  const viewRow = useMemo(
    () => data?.rows.find((r) => r.id === viewRowId) ?? null,
    [data?.rows, viewRowId],
  );

  return {
    // filters
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    postingDate,
    setPostingDate,
    selectedGroupBy,
    setSelectedGroupBy,
    selectedVoucherType,
    setSelectedVoucherType,
    selectedCostCenter,
    setSelectedCostCenter,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedPayableAccount,
    setSelectedPayableAccount,
    hasActiveFilters,
    clearAll,

    // data
    kpis: data?.kpis ?? null,
    rows: data?.rows ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    fetching: isFetching,
    isExporting,
    error: isError ? 'Failed to fetch payables.' : null, 
    page,
    pageSize: PAGE_SIZE,
    handlePageChange,
    handleExportExcel,
    displayAmount,

    // dropdown options
    supplierOptions,
    costCenterOptions,
    payableAccountOptions,

    // view modal
    viewRowId,
    setViewRowId,
    viewRow,
  };
}