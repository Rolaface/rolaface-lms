import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PayableFilters,
  type PayableResponse,
  type PayableStatus,
  type PayableVoucherType,
  fetchPayables,
  formatAmount,
} from '../../api/Accounting/Payable.api';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const PAGE_SIZE = 20;

export function usePayable() {
  // ── Filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PayableStatus | 'all'>('all');
  const [postingDate, setPostingDate] = useState(getTodayDate());
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<PayableVoucherType | ''>('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedPayableAccount, setSelectedPayableAccount] = useState('');

  // ── Data state ────────────────────────────────────────────
  const [data, setData] = useState<PayableResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination ────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── View modal ────────────────────────────────────────────
  const [viewRowId, setViewRowId] = useState<string | null>(null);

  const buildFilters = useCallback(
    (): PayableFilters => ({
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

  const fetchData = useCallback(async (pg: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetchPayables(buildFilters(), pg, PAGE_SIZE);
      setData(resp);
    } catch {
      setError('Failed to fetch payables.');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildFilters]);

  // Reset to page 1 whenever a filter changes, then fetch
  useEffect(() => {
    setPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    filterStatus,
    postingDate,
    selectedGroupBy,
    selectedCostCenter,
    selectedSuppliers,
    selectedPayableAccount,
    selectedVoucherType,
  ]);

  const handlePageChange = useCallback(
    (pg: number) => {
      setPage(pg);
      fetchData(pg);
    },
    [fetchData],
  );

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

  // Dummy-data export: builds the sheet from whatever the current filters
  // return, at full page size — swap for a real "export all" API call later.
  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const resp = await fetchPayables(buildFilters(), 1, 999999);
      return resp.rows;
    } finally {
      setIsExporting(false);
    }
  }, [buildFilters]);

  const displayAmount = useMemo(() => (currency: string | undefined, amount: number) => formatAmount(currency, amount), []);

  const viewRow = useMemo(() => data?.rows.find((r) => r.id === viewRowId) ?? null, [data?.rows, viewRowId]);

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
    isExporting,
    error,
    page,
    pageSize: PAGE_SIZE,
    handlePageChange,
    handleExportExcel,
    displayAmount,

    // view modal
    viewRowId,
    setViewRowId,
    viewRow,
  };
}