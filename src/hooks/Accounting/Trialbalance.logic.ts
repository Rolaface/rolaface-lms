/* ───────────────────────────────────────────────────────────
   TrialBalance — Logic layer
   Expand-state helper + the one hook owning all state and data
   loading. The UI file only renders what this hook returns.
   ─────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import {
  type TBAccount,
  type TBFilters,
  type TBResponse,
  DEFAULT_TB_FILTERS,
  fetchTrialBalance,
} from '../../api/Accounting/Trialbalance.api';

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

export function useTrialBalance() {
  const [data, setData] = useState<TBResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [filters, setFilters] = useState<TBFilters>(DEFAULT_TB_FILTERS);

  const loadData = useCallback((f: TBFilters) => {
    setLoading(true);
    setError(null);
    fetchTrialBalance(f)
      .then(setData)
      .catch(() => setError('Failed to load trial balance.'))
      .finally(() => setLoading(false));
  }, []);

  // initial load
  useEffect(() => {
    loadData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(filters);
  }, [loadData, filters]);

  const tableData: TBAccount[] = data?.accounts ?? [];

  // default-expand to depth 0 whenever fresh data arrives
  useEffect(() => {
    if (!tableData.length) return;
    setExpanded(buildExpandedToDepth(tableData, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  return {
    data,
    loading,
    error,
    handleRefresh,

    filters,
    setFilters,

    tableData,
    expanded,
    setExpanded,
  };
}