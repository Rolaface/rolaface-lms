import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ExpandedState } from '@tanstack/react-table';
import {
  type TBAccount,
  type TBFilters,
  DEFAULT_TB_FILTERS,
  fetchTrialBalance,
} from '../../api/Accounting/Trialbalance.api';
import { getCompanyCurrentFiscalYear } from '../../api/utils/frappeUtilsApi';
import { showApiError } from '../../utils/alert';
import { usePrefetchCurrencies } from '../../store/currencyStore';
import { useCompanyStore } from '../../store/companyStore';

function buildExpandedToDepth(nodes: TBAccount[], depth: number, path = ''): Record<string, boolean> {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
}

export const trialBalanceKeys = {
  all: ['trial-balance'] as const,
  filtered: (filters: TBFilters) => [...trialBalanceKeys.all, filters] as const,
};

export function useTrialBalance() {
  const baseCurrency = useCompanyStore((s) => s.baseCurrency);

  const [filters, setFilters] = useState<TBFilters>(DEFAULT_TB_FILTERS);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [fyResolved, setFyResolved] = useState(false);
  const [lastValidFilters, setLastValidFilters] = useState<TBFilters | null>(null);

  useEffect(() => {
    let cancelled = false;
 // NEW
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({
          ...f,
          fiscal_year: fy.fiscal_year,
          from_date: fy.start_date,
          to_date: fy.end_date,
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
// NEW
  const isValidFilters =
    fyResolved && !!filters.fiscal_year && !!filters.from_date && !!filters.to_date;


  useEffect(() => {
    if (isValidFilters) setLastValidFilters(filters);
  }, [isValidFilters, filters]);

  useEffect(() => {
    if (!fyResolved || !lastValidFilters) return;
    const needsFallback = !filters.fiscal_year || !filters.from_date || !filters.to_date;
    if (!needsFallback) return;

    setFilters((f) => ({
      ...f,
      fiscal_year: f.fiscal_year || lastValidFilters.fiscal_year,
      from_date: f.from_date || lastValidFilters.from_date,
      to_date: f.to_date || lastValidFilters.to_date,
    }));
  }, [filters, fyResolved, lastValidFilters]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: trialBalanceKeys.filtered(filters),
    queryFn: () => fetchTrialBalance(filters),
    enabled: isValidFilters,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isError) showApiError('Failed to fetch trial balance.');
  }, [isError]);

  const error = !fyResolved
    ? null
    : !isValidFilters
      ? 'Please select a valid fiscal year and date range.'
      : isError
        ? 'Failed to load trial balance.'
        : null;

  const tableData: TBAccount[] = useMemo(() => data?.accounts ?? [], [data]);

  useEffect(() => {
    if (!tableData.length) return;
    setExpanded(buildExpandedToDepth(tableData, 0));
  }, [tableData]);

  usePrefetchCurrencies(data, () => [baseCurrency]);

  const handleRefresh = () => refetch();

  return {
    data,
    loading: isLoading,
    fetching: isFetching,
    error,
    handleRefresh,

    filters,
    setFilters,

    tableData,
    expanded,
    setExpanded,
    baseCurrency,
  };
}