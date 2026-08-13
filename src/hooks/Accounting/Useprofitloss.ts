import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PLData,
  type ProfitLossFilters,
  fetchProfitAndLoss,
} from '../../api/Accounting/Profitloss.api';
import { getCompanyCurrentFiscalYear } from '../../api/utils/frappeUtilsApi';
import { useCompanyStore } from '../../store/companyStore';
import {
  formatAmount as storeFormatAmount,
  ensureCurrencies,
  useCurrencyReady,
} from '../../store/currencyStore';

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};


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
    const [lastAppliedFilters, setLastAppliedFilters] = useState<ProfitLossFilters | null>(null);


  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Currency store ──────────────────────────────────────────
  // P&L totals aren't per-row currency like Payables — the whole report
  // is in the reporting company's base currency. Subscribe to the store
  // so amounts re-render once the real symbol/number-format load, and
  // prefetch that currency as soon as we know it.
  useCurrencyReady();
  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  useEffect(() => {
    if (baseCurrency) ensureCurrencies([baseCurrency]);
  }, [baseCurrency]);

  useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({
          ...f,
          from_fiscal_year: fy.fiscal_year,
          to_fiscal_year: fy.fiscal_year,
        }));
      })
      .catch(() => {

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
      setLastAppliedFilters(currentFilters);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Profit & Loss.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {

    if (filters.mode === 'Fiscal Year' && !fyResolved) return;

  
    let resolved = filters;
    if (lastAppliedFilters) {
      const needsFallback =
        (filters.mode === 'Date Range' && (!filters.from_date || !filters.to_date)) ||
        (filters.mode === 'Fiscal Year' && (!filters.from_fiscal_year || !filters.to_fiscal_year));

      if (needsFallback) {
        resolved = {
          ...filters,
          from_date: filters.from_date || lastAppliedFilters.from_date,
          to_date: filters.to_date || lastAppliedFilters.to_date,
          from_fiscal_year: filters.from_fiscal_year || lastAppliedFilters.from_fiscal_year,
          to_fiscal_year: filters.to_fiscal_year || lastAppliedFilters.to_fiscal_year,
        };
    
        setFilters(resolved);
     
      }
    }

    if (filters.mode === 'Date Range' && (!filters.from_date || !filters.to_date)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.from_fiscal_year || !filters.to_fiscal_year)) return;

    const timer = setTimeout(() => fetchData(resolved), 300);
    return () => clearTimeout(timer);
  }, [filters, fyResolved, lastAppliedFilters, fetchData]);

  const tableData = useMemo(() => {
    if (!data) return [];
    return [...data.income, ...data.expense];
  }, [data]);

  // Preserves the old "—" placeholder for zero/empty cells; everything
  // else now goes through the real dynamic currency store instead of a
  // hardcoded INR/₹ default.
  const displayAmount = useCallback(
    (amount: number) => {
      if (!amount) return '—';
      return storeFormatAmount(baseCurrency, amount, { withSymbol: true });
    },
    [baseCurrency],
  );

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