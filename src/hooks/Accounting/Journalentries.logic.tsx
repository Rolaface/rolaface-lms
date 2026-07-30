

import { useCallback, useEffect, useMemo, useState } from 'react';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import {
  type JournalEntry,
  fetchJournalEntries,
  submitJournalEntry,
  cancelJournalEntry,
  deleteJournalEntry,
} from '../../api/Accounting/Journalentries.api';

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orderBy, setOrderBy] = useState('creation desc');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const loadEntries = useCallback(() => {
    setLoading(true);
    fetchJournalEntries()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesSearch =
        !q || e.name.toLowerCase().includes(q) || (e.user_remark || '').toLowerCase().includes(q);
      const matchesFrom = !fromDate || e.posting_date >= fromDate;
      const matchesTo = !toDate || e.posting_date <= toDate;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [entries, search, fromDate, toDate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleFromDateChange = useCallback((value: string) => {
    setFromDate(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleToDateChange = useCallback((value: string) => {
    setToDate(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSubmit = useCallback((name: string) => {
    submitJournalEntry(name).then(() => {
      setEntries((prev) => prev.map((e) => (e.name === name ? { ...e, docstatus: 1 } : e)));
    });
  }, []);

  const handleCancel = useCallback((name: string) => {
    modals.openConfirmModal({
      title: 'Cancel Entry',
      children: <Text size="sm">Are you sure you want to cancel entry "{name}"?</Text>,
      labels: { confirm: 'Yes, Cancel', cancel: 'No, Keep' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await cancelJournalEntry(name);
        setEntries((prev) => prev.map((e) => (e.name === name ? { ...e, docstatus: 2 } : e)));
      },
    });
  }, []);

  const handleDelete = useCallback((name: string) => {
    modals.openConfirmModal({
      title: 'Delete Entry',
      children: <Text size="sm">Are you sure you want to delete entry "{name}"?</Text>,
      labels: { confirm: 'Yes, Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteJournalEntry(name);
        setEntries((prev) => prev.filter((e) => e.name !== name));
      },
    });
  }, []);

  return {
    loading,
    handleRefresh: loadEntries,

    // filters
    search,
    setSearch: handleSearchChange,
    fromDate,
    setFromDate: handleFromDateChange,
    toDate,
    setToDate: handleToDateChange,
    orderBy,
    setOrderBy,

    // table data + pagination
    filteredData,
    pagination,
    setPagination,

    // row actions
    handleSubmit,
    handleCancel,
    handleDelete,
  };
}