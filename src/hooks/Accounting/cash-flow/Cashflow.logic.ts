import { useCallback, useEffect, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import {
  type CFData,
  type CFFilters,
  type CFFilterMode,
  type CFPeriodicity,
  type CFNode,
  fetchCashFlow,
} from '../../../api/Accounting/Cashflow.api';
import { getCompanyCurrentFiscalYear } from '../../../api/utils/frappeUtilsApi';

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

const buildExpandedToDepth = (nodes: CFNode[], depth: number, path = ''): Record<string, boolean> => {
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

export function useCashFlow() {
  const [filters, setFilters] = useState<CFFilters>({
    mode: 'Fiscal Year',
    periodicity: 'Monthly',
    fromFiscalYear: FALLBACK_FY,
    toFiscalYear: FALLBACK_FY,
    fromDate: currentMonthStart(),
    toDate: currentMonthEnd(),
  });
  const [fyResolved, setFyResolved] = useState(false);

  const [data, setData] = useState<CFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<ExpandedState>({});
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

  const setMode = (mode: CFFilterMode) => {
    setFilters((f) => ({
      ...f,
      mode,
      ...(mode === 'Date Range' ? { fromDate: currentMonthStart(), toDate: currentMonthEnd() } : {}),
    }));
  };

  const setPeriodicity = (periodicity: CFPeriodicity) => setFilters((f) => ({ ...f, periodicity }));

  const setFiscalYear = (v: string) => setFilters((f) => ({ ...f, fromFiscalYear: v, toFiscalYear: v }));

  const setFromDate = (v: string) => setFilters((f) => ({ ...f, fromDate: v }));
  const setToDate = (v: string) => setFilters((f) => ({ ...f, toDate: v }));

  const fetchCF = useCallback(async (f: CFFilters) => {
    setLoading(true);
    setError(null);
    try {
      if (f.mode === 'Date Range' && (!f.fromDate || !f.toDate)) {
        setError('Please select a valid date range.');
        return;
      }
      const resp = await fetchCashFlow(f);
      setData(resp);
      setExpanded(buildExpandedToDepth(resp.tree, 2));
      setAllExpanded(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Cash Flow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for the real fiscal year before firing the first Fiscal-Year-mode request.
    if (filters.mode === 'Fiscal Year' && !fyResolved) return;
    if (filters.mode === 'Date Range' && (!filters.fromDate || !filters.toDate)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.fromFiscalYear || !filters.toFiscalYear)) return;

    const timer = setTimeout(() => fetchCF(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fyResolved, fetchCF]);

  const handleRefresh = useCallback(() => fetchCF(filters), [fetchCF, filters]);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
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

    expanded,
    setExpanded,
    allExpanded,
    handleToggleExpand,
  };
}