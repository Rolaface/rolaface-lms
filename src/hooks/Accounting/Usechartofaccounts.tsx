

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import {
  type COAAccount,
  BASE_CURRENCY,
  fetchChartOfAccounts,
  deleteAccount,
} from '../../api/Accounting/Chartofaccounts.api';

/* ───────────────── Tree helpers ───────────────── */

function matchNode(node: COAAccount, term: string) {
  const t = term.toLowerCase();
  return (
    node.account_name.toLowerCase().includes(t) ||
    (node.account_type || '').toLowerCase().includes(t) ||
    node.root_type.toLowerCase().includes(t)
  );
}

function filterTree(nodes: COAAccount[], term: string): COAAccount[] {
  if (!term.trim()) return nodes;
  const walk = (list: COAAccount[]): COAAccount[] =>
    list.reduce<COAAccount[]>((acc, node) => {
      const children = node.children?.length ? walk(node.children) : [];
      if (matchNode(node, term) || children.length) acc.push({ ...node, children });
      return acc;
    }, []);
  return walk(nodes);
}

function stripZero(nodes: COAAccount[]): COAAccount[] {
  const walk = (list: COAAccount[]): COAAccount[] =>
    list.reduce<COAAccount[]>((acc, node) => {
      const children = node.children?.length ? walk(node.children) : [];
      const keep = node.is_group ? children.length > 0 : node.balance_in_account_currency !== 0;
      if (keep) acc.push({ ...node, children });
      return acc;
    }, []);
  return walk(nodes);
}

function buildExpandedToDepth(nodes: COAAccount[], depth: number, path = ''): Record<string, boolean> {
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

function buildExpandedForSearch(nodes: COAAccount[], path = ''): Record<string, boolean> {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedForSearch(node.children, id));
    }
  });
  return state;
}

/* ───────────────── Hook ───────────────── */

export function useChartOfAccounts() {
  const [accounts, setAccounts] = useState<COAAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideZero, setHideZero] = useState(false);
  const [viewAccount, setViewAccount] = useState<COAAccount | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    fetchChartOfAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  const handleExpandedChange = useCallback(
    (updater: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      setExpanded(updater);
      setAllExpanded(false);
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    loadAccounts();
  }, [loadAccounts]);

  const tableData: COAAccount[] = useMemo(() => {
    let data = filterTree(accounts, searchTerm);
    if (hideZero) data = stripZero(data);
    return data;
  }, [accounts, searchTerm, hideZero]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (searchTerm.trim()) {
      setExpanded(buildExpandedForSearch(tableData));
      return;
    }
    if (isFirstLoad.current && tableData.length) {
      setExpanded(buildExpandedToDepth(tableData, 0));
      isFirstLoad.current = false;
    }
  }, [searchTerm, tableData]);

  const handleExport = useCallback(async () => {
    const XLSX = await import('xlsx');
    const rows: Record<string, string | number>[] = [];

    const flatten = (list: COAAccount[], depth = 0) => {
      list.forEach((acc) => {
        const indent = '    '.repeat(depth);
        const prefix = acc.is_group ? (depth === 0 ? '▶ ' : '▸ ') : '• ';
        rows.push({
          'Account Name': indent + prefix + acc.account_name,
          'Account Type': acc.account_type || '—',
          'Root Type': acc.root_type,
          Category: acc.is_group ? '── GROUP ──' : 'Account',
          Currency: acc.account_currency,
          'Balance (Account CCY)': acc.is_group ? '—' : acc.balance_in_account_currency,
          [`Balance (${BASE_CURRENCY})`]: acc.is_group ? '—' : acc.balance,
        });
        if (acc.children?.length) flatten(acc.children, depth + 1);
      });
    };
    flatten(tableData);

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 50 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chart of Accounts');
    XLSX.writeFile(wb, 'chart_of_accounts.xlsx');
  }, [tableData]);

  const handleDelete = useCallback((row: COAAccount) => {
    modals.openConfirmModal({
      title: 'Delete Account',
      children: (
        <Text size="sm">
          Are you sure you want to delete account "{row.account_name}"?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteAccount(row.name);
        const removeNode = (list: COAAccount[]): COAAccount[] =>
          list
            .filter((n) => n.name !== row.name)
            .map((n) => ({ ...n, children: n.children ? removeNode(n.children) : n.children }));
        setAccounts((prev) => removeNode(prev));
      },
    });
  }, []);

  return {
    // filter bar state
    searchTerm,
    setSearchTerm,
    hideZero,
    setHideZero,
    loading,
    allExpanded,
    handleToggleExpand,
    handleRefresh,
    handleExport,

    // table state
    tableData,
    expanded,
    handleExpandedChange,

    // row actions / modal
    viewAccount,
    setViewAccount,
    handleDelete,
  };
}