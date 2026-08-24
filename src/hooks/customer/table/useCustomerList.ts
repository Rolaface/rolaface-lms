import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../../../api/Customer/customerApi';
import { mapCustomer, type CustomerRow } from '../../../view/Customer/customerColumns';

export function useCustomerList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [type, setType] = useState<string | null>(null);      
  const [country, setCountry] = useState<string | null>(null); 
  const [status, setStatus] = useState<string[]>([]);        

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type]);

  const {
    data: customersResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['customers', debouncedSearch, page, pageSize, type],
    queryFn: () =>
      getCustomers({
        search: debouncedSearch.trim() || undefined,
        page,
        page_size: pageSize,
        customer_type: type ?? undefined, 
      }),
    placeholderData: (prev) => prev,
  });

  const data: CustomerRow[] = useMemo(() => {
    return (customersResponse?.data ?? []).map(mapCustomer);
  }, [customersResponse]);

  const filteredData = useMemo(() => {
    return data.filter((c) => {
      const matchesCountry = !country || c.country === country;
      const matchesStatus = status.length === 0 || status.includes(c.status);
      return matchesCountry && matchesStatus; // type hata diya, backend karega
    });
  }, [data, country, status]);

  const totalRows = customersResponse?.pagination?.total ?? 0;
  const totalPages = customersResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setType(null);
    setCountry(null);
    setStatus([]);
    setPage(1);
  };

  const changePageSize = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  return {
    allRows: data,
    rows: filteredData,
    isLoading,
    isFetching,
    search,
    setSearch,
    type,
    setType,
    country,
    setCountry,
    status,
    setStatus,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalRows,
    totalPages,
    firstRow,
    lastRow,
    countryOptions: [] as string[],
  };
}