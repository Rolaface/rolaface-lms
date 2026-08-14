import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  getLoanStatementDashboard,
  getLoanStatement,
  exportLoanStatementPDF,
  exportLoanStatementExcel,
} from '../../../api/Report/loanStatementApi';
import { getCustomerList, getLoanList } from '../../../api/lookup api/lookUpApi';
import type { DashboardData, StatementRow, StatementSort, PaginationMeta } from '../../../types/Report/loanStatement';
import { notifyError } from '../../../utils/notify';
import { parseFrappeError } from '../../../utils/parseFrappeError';

const DEFAULT_SORT: StatementSort = { field: 'date', direction: 'asc' };
const DEFAULT_PAGE_SIZE = 5;

export function useLoanStatement() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-08-01');
  const [viewType, setViewType] = useState<'summary' | 'detailed'>('summary');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);

  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [loans, setLoans] = useState<{ value: string; label: string }[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<StatementSort>(DEFAULT_SORT);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    getCustomerList({ page_size: 100 })
      .then((res) => {
        const data = res.message?.data || res.data || [];
        setCustomers(
          data.map((c: any) => ({
            value: String(c.value),
            label: c.label && c.label !== c.value ? `${c.value} - ${c.label}` : String(c.value),
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setLoans([]);
      return;
    }

    const allowedStatuses = [
      "Partially Disbursed",
      "Disbursed",
      "Active",
      "Loan Closure Requested",
      "Closed",
      "Written Off",
      "Settled"
    ];

    getLoanList({
      applicant: JSON.stringify([customerId]),
      status: JSON.stringify(allowedStatuses),
      page_size: 100
    })
      .then((res) => {
        const data = res.message?.data || res.data || [];
        setLoans(
          data.map((l: any) => ({
            value: String(l.name),
            label: l.loan_product ? `${l.name} - ${l.loan_product}` : String(l.name)
          }))
        );
      })
      .catch((err) => console.error(err));
  }, [customerId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, loanId, fromDate, toDate, viewType]);

  const fetchDashboard = useCallback(async () => {
    if (!loanId) {
      setDashboardData(null);
      return;
    }
    setLoadingDashboard(true);
    try {
      const res = await getLoanStatementDashboard({
        loan_id: loanId,
        from_date: fromDate,
        to_date: toDate,
        view_type: viewType,
      });
      const payload = res.message || res;
      if (payload.status_code === 200 && payload.data) {
        setDashboardData(payload.data);
      }
    } catch (err) {
      notifyError(parseFrappeError(err), 'Failed to fetch dashboard data');
    } finally {
      setLoadingDashboard(false);
    }
  }, [loanId, fromDate, toDate, viewType]);

  const fetchTable = useCallback(async () => {
    if (!loanId) {
      setRows([]);
      setPagination(null);
      return;
    }
    setLoadingTable(true);
    setError(null);
    try {
      const res = await getLoanStatement({
        loan_id: loanId,
        from_date: fromDate,
        to_date: toDate,
        view_type: viewType,
        page,
        page_size: pageSize,
        search: debouncedSearch,
        sort_by: sort.field,
        sort_order: sort.direction
      });
      const payload = res.message || res;
      if (payload.status_code === 200 && payload.data) {
        setRows(payload.data.data || []);
        setPagination(payload.data.pagination || null);
      }
    } catch (err) {
      setError(parseFrappeError(err));
      setRows([]);
      setPagination(null);
    } finally {
      setLoadingTable(false);
    }
  }, [loanId, fromDate, toDate, viewType, page, pageSize, debouncedSearch, sort]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { fetchTable(); }, [fetchTable]);

  const toggleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      return DEFAULT_SORT;
    });
    setPage(1);
  }, []);

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!loanId) return;
    setExportingType(type);
    try {
      const exportFn = type === 'pdf' ? exportLoanStatementPDF : exportLoanStatementExcel;
      const blob = await exportFn({ loan_id: loanId, from_date: fromDate, to_date: toDate, view_type: viewType });
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Statement_${loanId}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      notifyError(parseFrappeError(err), `Export ${type} failed`);
    } finally {
      setExportingType(null);
    }
  };

  return {
    filters: { customerId, setCustomerId, loanId, setLoanId, fromDate, setFromDate, toDate, setToDate, viewType, setViewType },
    lookups: { customers, loans },
    searchState: { search, setSearch },
    paginationState: { page, setPage, pageSize, setPageSize },
    sortState: { sort, toggleSort },
    data: { dashboardData, rows, pagination },
    status: { loadingDashboard, loadingTable, error, exportingType },
    actions: { refetchTable: fetchTable, handleExport },
  };
}