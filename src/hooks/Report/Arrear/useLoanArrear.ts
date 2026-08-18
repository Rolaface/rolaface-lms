import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  getArrearSummary,
  getArrearCharts,
  getArrearInsights,
  getTopOverdueAccounts,
  exportArrearReportExcel,
} from '../../../api/Report/loanArrearApi';
import { getCustomerList, getLoanList, getLoanClassification } from '../../../api/lookup api/lookUpApi';
import type {
  ArrearSummary,
  ArrearCharts,
  ArrearInsights,
  OverdueAccountRow,
  PaginationMeta,
} from '../../../types/Report/loanArrear';
import { notifyError } from '../../../utils/notify';
import { parseFrappeError } from '../../../utils/parseFrappeError';

const DEFAULT_PAGE_SIZE = 5;

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
const currentDay = String(today.getDate()).padStart(2, '0');
const defaultAsOnDate = `${currentYear}-${currentMonth}-${currentDay}`;

export function useLoanArrear() {
  const [asOnDate, setAsOnDate] = useState(defaultAsOnDate);
  const [loanAccount, setLoanAccount] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [loanProduct, setLoanProduct] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [arrearBucket, setArrearBucket] = useState<string>('All Buckets');
  const [dpdFrom, setDpdFrom] = useState<string>('');
  const [dpdTo, setDpdTo] = useState<string>('');
  const [includeWrittenOff, setIncludeWrittenOff] = useState(false);

  const [debouncedCustomer] = useDebouncedValue(customer, 350);
  const [debouncedDpdFrom] = useDebouncedValue(dpdFrom, 350);
  const [debouncedDpdTo] = useDebouncedValue(dpdTo, 350);

  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [classification, setClassification] = useState<{ value: string; label: string }[]>([]);
  const [loans, setLoans] = useState<{ value: string; label: string; applicant?: string }[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [summary, setSummary] = useState<ArrearSummary | null>(null);
  const [charts, setCharts] = useState<ArrearCharts | null>(null);
  const [insights, setInsights] = useState<ArrearInsights | null>(null);
  const [topAccounts, setTopAccounts] = useState<OverdueAccountRow[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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
    getLoanClassification({ page_size: 100 })
      .then((res) => {
        const data = res.message?.data || res.data || [];
        setClassification(
          data.map((c: any) => ({
            value: String(c.value),
            label: c.label && c.label !== c.value ? `${c.value} - ${c.label}` : String(c.value),
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const params: Record<string, any> = { page_size: 100 };
    getLoanList(params)
      .then((res) => {
        const data = res.message?.data || res.data || [];
        setLoans(
          data.map((l: any) => ({
            value: String(l.name),
            label: l.loan_product ? `${l.name} - ${l.loan_product}` : String(l.name),
            applicant: l.applicant,
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    asOnDate,
    loanAccount,
    branch,
    loanProduct,
    debouncedCustomer,
    arrearBucket,
    debouncedDpdFrom,
    debouncedDpdTo,
    includeWrittenOff,
    pageSize,
  ]);

  const apiParams = useMemo(() => ({
    as_on_date: asOnDate,
    loan_account: loanAccount || undefined,
    branch: branch || undefined,
    loan_product: loanProduct || undefined,
    customer: debouncedCustomer || undefined,
    arrear_bucket: arrearBucket !== 'All Buckets' ? arrearBucket : undefined,
    dpd_from: debouncedDpdFrom ? Number(debouncedDpdFrom) : undefined,
    dpd_to: debouncedDpdTo ? Number(debouncedDpdTo) : undefined,
    include_written_off: includeWrittenOff ? 1 : 0,
  }), [
    asOnDate,
    loanAccount,
    branch,
    loanProduct,
    debouncedCustomer,
    arrearBucket,
    debouncedDpdFrom,
    debouncedDpdTo,
    includeWrittenOff,
  ]);

  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const [sumRes, chartRes, insightRes] = await Promise.all([
        getArrearSummary(apiParams),
        getArrearCharts(apiParams),
        getArrearInsights(apiParams),
      ]);

      const extractObj = (r: any) => {
        if (r?.data && typeof r.data === 'object' && !Array.isArray(r.data)) return r.data;
        if (r?.message && typeof r.message === 'object' && !Array.isArray(r.message)) return r.message;
        return r || null;
      };
      console.log("extractObj(sumRes): ", extractObj(sumRes))
      console.log("extractObj(chartRes): ", extractObj(chartRes))
      console.log("extractObj(insightRes): ", extractObj(insightRes))
      setSummary(extractObj(sumRes));
      setCharts(extractObj(chartRes));
      setInsights(extractObj(insightRes));
    } catch (err: any) {
      const errMsg = parseFrappeError(err);
      setError(errMsg);
      notifyError(errMsg, 'Failed to fetch arrear dashboard data');
    } finally {
      setLoadingDashboard(false);
    }
  }, [apiParams]);

  const fetchTable = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await getTopOverdueAccounts({ ...apiParams, page, page_size: pageSize });
      
      let accounts: any[] = [];
      let pagination = null;

      if (res?.data?.data && Array.isArray(res.data.data)) {
        accounts = res.data.data;
        pagination = res.data.pagination;
      } else if (res?.data && Array.isArray(res.data)) {
        accounts = res.data;
        pagination = res.pagination;
      } else if (res?.message?.data && Array.isArray(res.message.data)) {
        accounts = res.message.data;
        pagination = res.message.pagination;
      } else if (Array.isArray(res)) {
        accounts = res;
      }

      setTopAccounts(accounts);
      setPaginationMeta(pagination || null);
    } catch (err: any) {
      console.error(err);
      setTopAccounts([]);
      setPaginationMeta(null);
    } finally {
      setLoadingTable(false);
    }
  }, [apiParams, page, pageSize]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportArrearReportExcel(apiParams);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Arrear_Report_${asOnDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      notifyError(parseFrappeError(err), 'Export Excel failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = useCallback(() => {
    setAsOnDate(defaultAsOnDate);
    setLoanAccount('');
    setBranch('');
    setLoanProduct('');
    setCustomer('');
    setArrearBucket('All Buckets');
    setDpdFrom('');
    setDpdTo('');
    setIncludeWrittenOff(false);
    setPage(1);
  }, []);

  return {
    filters: {
      asOnDate, setAsOnDate,
      loanAccount, setLoanAccount,
      branch, setBranch,
      loanProduct, setLoanProduct,
      customer, setCustomer,
      arrearBucket, setArrearBucket,
      dpdFrom, setDpdFrom,
      dpdTo, setDpdTo,
      includeWrittenOff, setIncludeWrittenOff,
    },
    lookups: { customers, loans },
    paginationState: { page, setPage, pageSize, setPageSize },
    data: { summary, charts, insights, topAccounts, paginationMeta },
    status: { loadingDashboard, loadingTable, error, exporting },
    actions: { handleExport, clearFilters },
  };
}