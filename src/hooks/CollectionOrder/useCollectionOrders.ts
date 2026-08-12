import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { deleteCollectionOrder, getAllCollectionOrders } from '../../api/collectionOrderApi';
import type { CollectionOrderListItem, CollectionOrderSort, PaginationMeta } from '../../types/collectionOrder';
import { notifySuccess, notifyError } from '../../utils/notify';
import { parseFrappeError } from '../../utils/parseFrappeError';

const DEFAULT_SORT: CollectionOrderSort = { field: 'creation', direction: 'desc' };
const DEFAULT_PAGE_SIZE = 10;

export function useCollectionOrders() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<CollectionOrderSort>(DEFAULT_SORT);

  const [rows, setRows] = useState<CollectionOrderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const orderBy = useMemo(() => `${sort.field} ${sort.direction}`, [sort]);

  // Reset to page 1 whenever the search term actually changes (post-debounce)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    const fetchRows = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllCollectionOrders({
          search: debouncedSearch || undefined,
          page,
          page_size: pageSize,
          order_by: orderBy,
        });
        if (cancelled) return;
        setRows(Object.values(res.data.collection_orders ?? {}));
        setPagination(res.data.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(parseFrappeError(err));
        setRows([]);
        setPagination(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRows();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, pageSize, orderBy, refreshIndex]);

  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  const toggleSort = useCallback((field: CollectionOrderSort['field']) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      return DEFAULT_SORT;
    });
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setSort(DEFAULT_SORT);
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  }, []);

  const removeCollectionOrder = useCallback(
    async (name: string) => {
      setDeletingName(name);
      try {
        await deleteCollectionOrder(name);
        notifySuccess('Collection sequence deleted successfully.');
        refetch();
        return true;
      } catch (err) {
        notifyError(err, 'Unable to delete sequence');
        return false;
      } finally {
        setDeletingName(null);
      }
    },
    [refetch]
  );

  return {
    rows,
    pagination,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    toggleSort,
    resetFilters,
    refetch,
    removeCollectionOrder,
    deletingName,
  };
}