import { useCallback, useEffect, useMemo, useState } from 'react';
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
const DEFAULT_PAGE_SIZE = 20;

export function useLoanStatement() {
  // Filters
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-08-01');
  const [viewType, setViewType] = useState<'summary' | 'detailed'>('summary');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);

  // Lookups State
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [loans, setLoans] = useState<{ value: string; label: string }[]>([]);

  // Table State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<StatementSort>(DEFAULT_SORT);

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  
  // Loading & Action States
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<'pdf' | 'excel' | null>(null);

  const orderBy = useMemo(() => `${sort.field} ${sort.direction}`, [sort]);

  // Fetch Customers on Mount
useEffect(() => {
    getCustomerList({ page_size: 100 })
      .then((res) => {
        const data = res.message?.data || res.data || [];
        console.log("🚀 ~ useLoanStatement ~ data:", data);
        
        setCustomers(
          data.map((c: any) => ({
            value: c.value,
            // If the label is different from the value (ID), format as "ID - Name", otherwise just use the value
            label: c.label && c.label !== c.value ? `${c.value} - ${c.label}` : c.value,
          }))
        );
      })
      .catch((err) => console.error('Failed to fetch customers', err));
  }, []);

  // Fetch Loans when Customer changes
useEffect(() => {
    if (!customerId) {
      setLoans([]);
      return;
    }
    
    getLoanList({ page_size: 100 })
      .then((res) => {
        // 1. Extract data
        const allLoans = res.message?.data || res.data || [];
        
        // 2. Filter loans by the selected customerId
        const customerLoans = allLoans.filter((l: any) => l.applicant === customerId);
        
        // 3. Map to select options
        setLoans(
          customerLoans.map((l: any) => ({ 
            value: l.name, 
            label: l.loan_product ? `${l.name} - ${l.loan_product}` : l.name 
          }))
        );
      })
      .catch((err) => console.error('Failed to fetch loans', err));
  }, [customerId]);

  // Reset page when search or core filters change
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
  }, [loanId, fromDate, toDate, viewType, page, pageSize, debouncedSearch]);

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