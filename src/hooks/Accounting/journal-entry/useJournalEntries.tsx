import { useCallback, useEffect, useState } from 'react';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import {
  type JournalEntry,
  fetchJournalEntries,
  submitJournalEntry,
  cancelJournalEntry,
  deleteJournalEntry,
} from '../../../api/Accounting/Journalentries.api';
import { showApiError, showSuccess } from '../../../utils/alert';
import { parseFrappeError } from '../../../utils/Accounitng/Journal-Entry/Journalentry.utils';

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearchState] = useState('');
  const [fromDate, setFromDateState] = useState('');
  const [toDate, setToDateState] = useState('');
  const [orderBy, setOrderByState] = useState('creation desc');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const loadEntries = useCallback(() => {
    setLoading(true);
    fetchJournalEntries({
      search,
      fromDate,
      toDate,
      orderBy,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    })
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
      })
      .catch((err: any) => {
        showApiError(parseFrappeError(err) || 'Failed to load journal entries.');
      })
      .finally(() => setLoading(false));
  }, [search, fromDate, toDate, orderBy, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setFromDate = useCallback((value: string) => {
    setFromDateState(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setToDate = useCallback((value: string) => {
    setToDateState(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setOrderBy = useCallback((value: string) => {
    setOrderByState(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSubmit = useCallback(
    (name: string) => {
      submitJournalEntry(name)
        .then(() => {
          showSuccess(`Entry ${name} has been submitted successfully.`);
          loadEntries();
        })
        .catch((err: any) => showApiError(parseFrappeError(err) || 'Failed to submit entry.'));
    },
    [loadEntries]
  );

  const handleCancel = useCallback(
    (name: string) => {
      modals.openConfirmModal({
        title: 'Cancel Entry',
        children: <Text size="sm">Are you sure you want to cancel entry "{name}"?</Text>,
        labels: { confirm: 'Yes, Cancel', cancel: 'No, Keep' },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            await cancelJournalEntry(name);
            showSuccess(`Entry ${name} has been cancelled successfully.`);
            loadEntries();
          } catch (err: any) {
            showApiError(parseFrappeError(err) || 'Failed to cancel entry.');
          }
        },
      });
    },
    [loadEntries]
  );

  const handleDelete = useCallback(
    (name: string) => {
      modals.openConfirmModal({
        title: 'Delete Entry',
        children: <Text size="sm">Are you sure you want to delete entry "{name}"?</Text>,
        labels: { confirm: 'Yes, Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            await deleteJournalEntry(name);
            showSuccess(`Entry ${name} has been successfully deleted.`);
            loadEntries();
          } catch (err: any) {
            showApiError(parseFrappeError(err) || 'Failed to delete entry.');
          }
        },
      });
    },
    [loadEntries]
  );

  return {
    loading,
    handleRefresh: loadEntries,

    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    orderBy,
    setOrderBy,

    filteredData: entries,
    total,
    pagination,
    setPagination,

    handleSubmit,
    handleCancel,
    handleDelete,
  };
}