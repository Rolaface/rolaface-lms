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
import { useCompanyStore } from '../../../store/companyStore';
import { ensureCurrencies, useCurrencyReady } from '../../../store/currencyStore';

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

// Walk summary rows + the whole tree and collect every distinct currency
// code the response actually uses, so the store can be pre-warmed in one shot.
const collectCurrencyCodes = (data: CFData | null): string[] => {
  if (!data) return [];
  const codes = new Set<string>();
  data.summary.forEach((s) => {
    if (s.currency) codes.add(s.currency);
  });
  const walk = (nodes: CFNode[]) => {
    nodes.forEach((n) => {
      if (n.currency) codes.add(n.currency);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(data.tree);
  return [...codes];
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
  const [lastValidFilters, setLastValidFilters] = useState<CFFilters | null>(null);

  const [data, setData] = useState<CFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);


  useCurrencyReady();
  const baseCurrency = useCompanyStore((state) => state.baseCurrency);


  useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({
          ...f,
          fromFiscalYear: fy.fiscal_year,
          toFiscalYear: fy.fiscal_year,
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
       setLastValidFilters(f);
      setExpanded(buildExpandedToDepth(resp.tree, 2));
      setAllExpanded(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Cash Flow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {

    if (filters.mode === 'Fiscal Year' && !fyResolved) return;


    if (lastValidFilters) {
      const needsFallback =
        (filters.mode === 'Date Range' && (!filters.fromDate || !filters.toDate)) ||
        (filters.mode === 'Fiscal Year' && (!filters.fromFiscalYear || !filters.toFiscalYear));

      if (needsFallback) {
        setFilters((f) => ({
          ...f,
          fromDate: f.fromDate || lastValidFilters.fromDate,
          toDate: f.toDate || lastValidFilters.toDate,
          fromFiscalYear: f.fromFiscalYear || lastValidFilters.fromFiscalYear,
          toFiscalYear: f.toFiscalYear || lastValidFilters.toFiscalYear,
        }));
        return; 
      }
    }

    if (filters.mode === 'Date Range' && (!filters.fromDate || !filters.toDate)) return;
    if (filters.mode === 'Fiscal Year' && (!filters.fromFiscalYear || !filters.toFiscalYear)) return;

    const timer = setTimeout(() => fetchCF(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fyResolved, lastValidFilters, fetchCF]);

  useEffect(() => {
    const codes = new Set<string>(collectCurrencyCodes(data));
    if (baseCurrency) codes.add(baseCurrency);
    if (codes.size > 0) ensureCurrencies([...codes]);
  }, [data, baseCurrency]);

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

    baseCurrency,

    expanded,
    setExpanded,
    allExpanded,
    handleToggleExpand,
  };
}