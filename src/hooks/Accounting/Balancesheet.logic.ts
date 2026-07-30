import { useCallback, useEffect, useState } from 'react';
import {
  type BSData,
  type BSFilters,
  type BSFilterMode,
  type BSPeriodicity,
  fetchBalanceSheet,
} from '../../api/Accounting/Balancesheet.api';

const currentFiscalYear = () => new Date().getFullYear();

const currentMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const currentMonthEnd = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

export function useBalanceSheet() {
  const [filters, setFilters] = useState<BSFilters>({
    mode: 'Fiscal Year',
    periodicity: 'Monthly',
    fromFiscalYear: currentFiscalYear(),
    toFiscalYear: currentFiscalYear(),
    fromDate: currentMonthStart(),
    toDate: currentMonthEnd(),
  });

  const [data, setData] = useState<BSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean> | boolean>({});
  const [expandedLiabilities, setExpandedLiabilities] = useState<Record<string, boolean> | boolean>({});
  const [expandedEquity, setExpandedEquity] = useState<Record<string, boolean> | boolean>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const setMode = (mode: BSFilterMode) => {
    setFilters((f) => ({
      ...f,
      mode,
      ...(mode === 'Date Range'
        ? { fromDate: currentMonthStart(), toDate: currentMonthEnd() }
        : { fromFiscalYear: currentFiscalYear(), toFiscalYear: currentFiscalYear() }),
    }));
  };

  const setPeriodicity = (periodicity: BSPeriodicity) => setFilters((f) => ({ ...f, periodicity }));
  const setFromFiscalYear = (v: number) => setFilters((f) => ({ ...f, fromFiscalYear: v }));
  const setToFiscalYear = (v: number) => setFilters((f) => ({ ...f, toFiscalYear: v }));
  const setFromDate = (v: string) => setFilters((f) => ({ ...f, fromDate: v }));
  const setToDate = (v: string) => setFilters((f) => ({ ...f, toDate: v }));

  const fetchBS = useCallback(async (f: BSFilters) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchBalanceSheet(f);
      setData(resp);
      // Default: expand the top-level groups so the tree isn't fully collapsed on load
      setExpandedAssets({ '0': true });
      setExpandedLiabilities({ '0': true });
      setExpandedEquity({ '0': true });
      setAllExpanded(false);
    } catch {
      setError('Failed to load Balance Sheet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBS(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => fetchBS(filters), [fetchBS, filters]);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpandedAssets({});
      setExpandedLiabilities({});
      setExpandedEquity({});
      setAllExpanded(false);
    } else {
      setExpandedAssets(true);
      setExpandedLiabilities(true);
      setExpandedEquity(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  return {
    filters,
    setMode,
    setPeriodicity,
    setFromFiscalYear,
    setToFiscalYear,
    setFromDate,
    setToDate,

    data,
    loading,
    error,
    handleRefresh,

    expandedAssets,
    setExpandedAssets,
    expandedLiabilities,
    setExpandedLiabilities,
    expandedEquity,
    setExpandedEquity,
    allExpanded,
    handleToggleExpand,
  };
}