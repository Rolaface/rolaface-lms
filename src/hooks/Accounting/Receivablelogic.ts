import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  type ReceivableFilters,
  type ReceivableStatus,
  type ReceivableVoucherType,
  type SelectOption,
  fetchReceivables,
  fetchCustomerOptions,
  fetchCostCenterOptions,
  fetchReceivableAccountOptions,
  formatAmount,
} from '../../api/Accounting/Receivable.api';
import { showApiError } from '../../utils/alert';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const PAGE_SIZE = 20;

/* ───────────────── Query key builder ───────────────── */

export const receivableKeys = {
  all: ['receivables'] as const,
  list: (filters: ReceivableFilters, page: number, pageSize: number) =>
    [...receivableKeys.all, 'list', filters, page, pageSize] as const,
};

export function useReceivable() {
  // ── Filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReceivableStatus | 'all'>('all');
  const [postingDate, setPostingDate] = useState(getTodayDate());
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<ReceivableVoucherType | ''>('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedReceivableAccount, setSelectedReceivableAccount] = useState('');

  // ── Pagination ──────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── View modal ────────────────────────────────────────────
  const [viewRowId, setViewRowId] = useState<string | null>(null);

  // ── Export (one-off fetch, not cached) ──
  const [isExporting, setIsExporting] = useState(false);

  const filters: ReceivableFilters = useMemo(
    () => ({
      search: searchTerm,
      status: filterStatus,
      postingDate,
      voucherType: selectedVoucherType,
      costCenter: selectedCostCenter,
      receivableAccount: selectedReceivableAccount,
      customers: selectedCustomers,
      groupBy: selectedGroupBy,
    }),
    [
      searchTerm,
      filterStatus,
      postingDate,
      selectedVoucherType,
      selectedCostCenter,
      selectedReceivableAccount,
      selectedCustomers,
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
    queryKey: receivableKeys.list(filters, page, PAGE_SIZE),
    queryFn: () => fetchReceivables(filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  /* ── Dropdown master data — fetched once, cached 5 min ── */
  const { data: customerOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['receivable-customers'],
    queryFn: fetchCustomerOptions,
    staleTime: 5 * 60_000,
  });

  const { data: costCenterOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['receivable-cost-centers'],
    queryFn: fetchCostCenterOptions,
    staleTime: 5 * 60_000,
  });

  const { data: receivableAccountOptions = [] } = useQuery<SelectOption[]>({
    queryKey: ['receivable-accounts'],
    queryFn: fetchReceivableAccountOptions,
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

  // Surface fetch errors via the alert system
  useEffect(() => {
    if (isError) showApiError('Failed to fetch receivables.');
  }, [isError]);

  const handlePageChange = useCallback((pg: number) => {
    setPage(pg);
  }, []);

  const hasActiveFilters =
    selectedCustomers.length > 0 ||
    selectedCostCenter !== '' ||
    selectedReceivableAccount !== '' ||
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
    setSelectedCustomers([]);
    setSelectedCostCenter('');
    setSelectedReceivableAccount('');
    setPostingDate(getTodayDate());
  }, []);

  /* ── Export: deliberately bypasses the query cache — one-off
     "give me everything, right now" fetch. ── */
  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const resp = await fetchReceivables(filters, 1, 999999);
      return resp.rows;
    } catch {
      showApiError('Failed to export receivables.');
      return [];
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  const displayAmount = useMemo(
    () => (currency: string | undefined, amount: number) => formatAmount(currency, amount),
    [],
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
    selectedCustomers,
    setSelectedCustomers,
    selectedReceivableAccount,
    setSelectedReceivableAccount,
    hasActiveFilters,
    clearAll,

    // data
    kpis: data?.kpis ?? null,
    rows: data?.rows ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    fetching: isFetching,
    isExporting,
    error: isError ? 'Failed to fetch receivables.' : null,
    page,
    pageSize: PAGE_SIZE,
    handlePageChange,
    handleExportExcel,
    displayAmount,

    // dropdown options
    customerOptions,
    costCenterOptions,
    receivableAccountOptions,

    // view modal
    viewRowId,
    setViewRowId,
    viewRow,
  };
}