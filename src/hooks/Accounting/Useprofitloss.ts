import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PLData,
  type ProfitLossFilters,
  fetchProfitAndLoss,
  formatAmount,
} from '../../api/Accounting/Profitloss.api';

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

const CURRENT_FY = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

export function useProfitLoss() {
  const [filters, setFilters] = useState<ProfitLossFilters>({
    mode: 'Fiscal Year',
    periodicity: 'Monthly',
    from_fiscal_year: CURRENT_FY,
    to_fiscal_year: CURRENT_FY,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });

  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentFilters: ProfitLossFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentFilters.mode === 'Date Range' && (!currentFilters.from_date || !currentFilters.to_date)) {
        setError('Please select a valid date range.');
        return;
      }
      const res = await fetchProfitAndLoss(currentFilters);
      setData(res);
    } catch {
      setError('Failed to load Profit & Loss.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filters.mode === 'Date Range' && (!filters.from_date || !filters.to_date)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.from_fiscal_year || !filters.to_fiscal_year)) return;

    const timer = setTimeout(() => fetchData(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchData]);

  const tableData = useMemo(() => {
    if (!data) return [];
    return [...data.income, ...data.expense];
  }, [data]);

  const displayAmount = useMemo(() => (amount: number) => formatAmount(undefined, amount), []);

  const handleRefresh = useCallback(() => fetchData(filters), [fetchData, filters]);

  return {
    filters,
    setFilters,
    data,
    tableData,
    isLoading,
    error,
    displayAmount,
    handleRefresh,
  };
}