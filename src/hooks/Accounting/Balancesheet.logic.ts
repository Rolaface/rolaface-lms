import { useCallback, useEffect, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import {
  type BSData,
  type BSFilters,
  type BSFilterMode,
  type BSPeriodicity,
  type BSNode,
  fetchBalanceSheet,
} from '../../api/Accounting/Balancesheet.api';
import { getCompanyCurrentFiscalYear } from '../../api/utils/frappeUtilsApi';

const currentMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const currentMonthEnd = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

// Local fallback only — overwritten as soon as the real fiscal year loads below.
const FALLBACK_FY = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const buildExpandedToDepth = (nodes: BSNode[], depth: number, path = ''): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
};

export function useBalanceSheet() {
  const [filters, setFilters] = useState<BSFilters>({
    mode: 'Fiscal Year',
    periodicity: 'Monthly',
    fromFiscalYear: FALLBACK_FY,
    toFiscalYear: FALLBACK_FY,
    fromDate: currentMonthStart(),
    toDate: currentMonthEnd(),
  });
  const [fyResolved, setFyResolved] = useState(false);

  const [data, setData] = useState<BSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedAssets, setExpandedAssets] = useState<ExpandedState>({});
  const [expandedLiabilities, setExpandedLiabilities] = useState<ExpandedState>({});
  const [expandedEquity, setExpandedEquity] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Resolve the company's real current Fiscal Year once, then patch filters.
  useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({ ...f, fromFiscalYear: fy, toFiscalYear: fy }));
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

  const setMode = (mode: BSFilterMode) => {
    setFilters((f) => ({
      ...f,
      mode,
      ...(mode === 'Date Range' ? { fromDate: currentMonthStart(), toDate: currentMonthEnd() } : {}),
    }));
  };

  const setPeriodicity = (periodicity: BSPeriodicity) => setFilters((f) => ({ ...f, periodicity }));

  // Single fiscal year field — sets both fromFiscalYear and toFiscalYear together,
  // since the UI now shows one "Fiscal Year" input instead of a From/To pair.
  const setFiscalYear = (v: string) => setFilters((f) => ({ ...f, fromFiscalYear: v, toFiscalYear: v }));

  const setFromDate = (v: string) => setFilters((f) => ({ ...f, fromDate: v }));
  const setToDate = (v: string) => setFilters((f) => ({ ...f, toDate: v }));

  const fetchBS = useCallback(async (f: BSFilters) => {
    setLoading(true);
    setError(null);
    try {
      if (f.mode === 'Date Range' && (!f.fromDate || !f.toDate)) {
        setError('Please select a valid date range.');
        return;
      }
      const resp = await fetchBalanceSheet(f);
      setData(resp);
      setExpandedAssets(buildExpandedToDepth(resp.assets, 2));
      setExpandedLiabilities(buildExpandedToDepth(resp.liabilities, 2));
      setExpandedEquity(buildExpandedToDepth(resp.equity, 2));
      setAllExpanded(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Balance Sheet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for the real fiscal year before firing the first Fiscal-Year-mode request.
    if (filters.mode === 'Fiscal Year' && !fyResolved) return;
    if (filters.mode === 'Date Range' && (!filters.fromDate || !filters.toDate)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.fromFiscalYear || !filters.toFiscalYear)) return;

    const timer = setTimeout(() => fetchBS(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fyResolved, fetchBS]);

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
    setFiscalYear,
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