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
import { parseFrappeError } from '../../../utils/Accounitng/Journal-Entry/Journalentry.utils';
import { openCommonModal } from '../../../components/Modal/AlertModal';
export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearchState] = useState('');
  const [fromDate, setFromDateState] = useState('');
  const [toDate, setToDateState] = useState('');
  const [orderBy, setOrderByState] = useState('creation desc');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };
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
        showError('Failed to Load Entries', err);
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
          showSuccess('Entry Submitted', `Entry ${name} has been submitted successfully.`);
          loadEntries();
        })
        .catch((err: any) => showError('Submit Failed', err));
    },
    [loadEntries]
  );

const handleCancel = useCallback(
  (name: string) => {
    openCommonModal({
      heading: 'Cancel Entry',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to cancel entry{' '}
          <Text span fw={600}>{name}</Text>?
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'No, Keep', variant: 'default' },
        {
          label: 'Yes, Cancel',
          color: 'red',
          onClick: async () => {
            try {
              await cancelJournalEntry(name);
              showSuccess('Entry Cancelled', `Entry ${name} has been cancelled successfully.`);
              loadEntries();
            } catch (err: any) {
              showError('Cancel Failed', err);
            }
          },
        },
      ],
    });
  },
  [loadEntries]
);

const handleDelete = useCallback(
  (name: string) => {
    openCommonModal({
      heading: 'Delete Entry',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete entry{' '}
          <Text span fw={600}>{name}</Text>?
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Delete',
          color: 'red',
          onClick: async () => {
            try {
              await deleteJournalEntry(name);
              showSuccess('Entry Deleted', `Entry ${name} has been successfully deleted.`);
              loadEntries();
            } catch (err: any) {
              showError('Delete Failed', err);
            }
          },
        },
      ],
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