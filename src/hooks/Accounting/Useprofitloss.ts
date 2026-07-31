import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PLData,
  type ProfitLossFilters,
  fetchProfitAndLoss,
  formatAmount,
} from '../../api/Accounting/Profitloss.api';
import { getCompanyCurrentFiscalYear } from '../../api/utils/frappeUtilsApi';

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

// Local fallback only — overwritten as soon as the real fiscal year loads below.
// Real FY records are ranges like "2026-2027", not plain years.
const FALLBACK_FY = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

export function useProfitLoss() {
  const [filters, setFilters] = useState<ProfitLossFilters>({
    mode: 'Fiscal Year',
    periodicity: 'Monthly',
    from_fiscal_year: FALLBACK_FY,
    to_fiscal_year: FALLBACK_FY,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });
  const [fyResolved, setFyResolved] = useState(false);

  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the company's real current Fiscal Year once, then patch filters.
  useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({ ...f, from_fiscal_year: fy, to_fiscal_year: fy }));
      })
      .catch(() => {
        // fall back silently to the local guess if this lookup fails
      })
      .finally(() => {
        if (!cancelled) setFyResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Profit & Loss.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for the real fiscal year before firing the first Fiscal-Year-mode request,
    // so we don't waste a request on the local guess and hit the backend "mandatory" error.
    if (filters.mode === 'Fiscal Year' && !fyResolved) return;
    if (filters.mode === 'Date Range' && (!filters.from_date || !filters.to_date)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.from_fiscal_year || !filters.to_fiscal_year)) return;

    const timer = setTimeout(() => fetchData(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fyResolved, fetchData]);

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