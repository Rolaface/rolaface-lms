import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type GLFilters,
  type GLResponse,
  fetchGeneralLedger,
  formatAmount,
} from '../../api/Accounting/Generalledger.api';

import { usePrefetchCurrencies } from '../../store/currencyStore';
import { useCompanyStore } from '../../store/companyStore';

const today = () => new Date().toISOString().split('T')[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const PAGE_SIZE = 15;

export function useGeneralLedger(initialAccount: string = '') {
  const companyBaseCurrency = useCompanyStore((s) => s.baseCurrency);

  const [account, setAccount] = useState(initialAccount);
  const [voucherNo, setVoucherNo] = useState('');
  const [fromDate, setFromDate] = useState(startOfYear());
  const [toDate, setToDate] = useState(today());

  const [appliedFilters, setAppliedFilters] = useState<GLFilters>({
    account: initialAccount,
    voucherNo: '',
    fromDate: startOfYear(),
    toDate: today(),
  });

  const [glData, setGlData] = useState<GLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchGL = useCallback(async (filters: GLFilters, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchGeneralLedger(filters, pg, PAGE_SIZE);
      setGlData(resp);
    } catch {
      setError('Failed to fetch GL data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    fetchGL(appliedFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-load if the account changes from outside (e.g. navigated here for a different account)
  useEffect(() => {
    if (initialAccount && initialAccount !== appliedFilters.account) {
      const f: GLFilters = { account: initialAccount, voucherNo: '', fromDate: startOfYear(), toDate: today() };
      setAccount(initialAccount);
      setVoucherNo('');
      setFromDate(f.fromDate);
      setToDate(f.toDate);
      setAppliedFilters(f);
      setPage(1);
      fetchGL(f, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAccount]);

  const handleApply = useCallback(() => {
    const f: GLFilters = { account, voucherNo, fromDate, toDate };
    setAppliedFilters(f);
    setPage(1);
    fetchGL(f, 1);
  }, [account, voucherNo, fromDate, toDate, fetchGL]);

  const handlePageChange = useCallback(
    (pg: number) => {
      setPage(pg);
      fetchGL(appliedFilters, pg);
    },
    [appliedFilters, fetchGL],
  );

  usePrefetchCurrencies(glData, (d) => [d.presentation_currency, d.account_currency]);

  const displayAmount = useMemo(() => {
    const currency = glData?.presentation_currency || glData?.account_currency || companyBaseCurrency;
    return (amount: number) => formatAmount(currency, amount);
  }, [glData?.presentation_currency, glData?.account_currency, companyBaseCurrency]);

  return {
    account,
    setAccount,
    voucherNo,
    setVoucherNo,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    handleApply,

    glData,
    loading,
    error,
    page,
    handlePageChange,
    pageSize: PAGE_SIZE,

    displayAmount,
  };
}