import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type GLFilters,
  type GLResponse,
  fetchGeneralLedger,
  formatAmount,
} from "../../api/Accounting/Generalledger.api";
import { getCompanyCurrentFiscalYear } from '../../api/utils/frappeUtilsApi';

import { usePrefetchCurrencies } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import {
  type AccountOption,
  fetchLedgerAccountOptions,
} from "../../api/utils/frappeUtilsApi";

const today = () => new Date().toISOString().split("T")[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const PAGE_SIZE = 15;

export function useGeneralLedger(initialAccount: string = "") {
  const companyBaseCurrency = useCompanyStore((s) => s.baseCurrency);

  const [account, setAccount] = useState(initialAccount);
  const [voucherNo, setVoucherNo] = useState("");
  const [fromDate, setFromDate] = useState(startOfYear());
  const [toDate, setToDate] = useState(today());

  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  useEffect(() => {
    fetchLedgerAccountOptions()
      .then(setAccountOptions)
      .catch(() => setAccountOptions([]));
  }, []);

  const [appliedFilters, setAppliedFilters] = useState<GLFilters>({
    account: initialAccount,
    voucherNo: "",
    fromDate: startOfYear(),
    toDate: today(),
  });

  const [glData, setGlData] = useState<GLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [fiscalYearLoaded, setFiscalYearLoaded] = useState(false);
  const fetchGL = useCallback(async (filters: GLFilters, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchGeneralLedger(filters, pg, PAGE_SIZE);
      setGlData(resp);
    } catch {
      setError("Failed to fetch GL data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
 useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFromDate(fy.start_date);
        setToDate(fy.end_date);
        setAppliedFilters((prev) => ({
          ...prev,
          fromDate: fy.start_date,
          toDate: fy.end_date,
        }));
      })
      .catch(() => {

      })
      .finally(() => {
        if (!cancelled) setFiscalYearLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!fiscalYearLoaded) return;
    fetchGL(appliedFilters, 1);
 
  }, [fiscalYearLoaded]);

  useEffect(() => {
    if (initialAccount && initialAccount !== appliedFilters.account) {
      const f: GLFilters = {
        account: initialAccount,
        voucherNo: "",
        fromDate: startOfYear(),
        toDate: today(),
      };
      setAccount(initialAccount);
      setVoucherNo("");
      setFromDate(f.fromDate);
      setToDate(f.toDate);
      setAppliedFilters(f);
      setPage(1);
      fetchGL(f, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAccount]);

// NEW
  const handleApply = useCallback(() => {
    const resolvedFromDate = fromDate.trim() ? fromDate : appliedFilters.fromDate;
    const resolvedToDate = toDate.trim() ? toDate : appliedFilters.toDate;
    //default to laoded dates
    if (!fromDate.trim()) setFromDate(resolvedFromDate);
    if (!toDate.trim()) setToDate(resolvedToDate);

    const f: GLFilters = {
      account,
      voucherNo,
      fromDate: resolvedFromDate,
      toDate: resolvedToDate,
    };
    setAppliedFilters(f);
    setPage(1);
    fetchGL(f, 1);
  }, [account, voucherNo, fromDate, toDate, appliedFilters, fetchGL]);

  const handlePageChange = useCallback(
    (pg: number) => {
      setPage(pg);
      fetchGL(appliedFilters, pg);
    },
    [appliedFilters, fetchGL],
  );

  usePrefetchCurrencies(glData, (d) => [
    d.presentation_currency,
    d.account_currency,
  ]);

  const displayAmount = useMemo(() => {
    const currency =
      glData?.presentation_currency ||
      glData?.account_currency ||
      companyBaseCurrency;
    return (amount: number) => formatAmount(currency, amount);
  }, [
    glData?.presentation_currency,
    glData?.account_currency,
    companyBaseCurrency,
  ]);

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
    accountOptions,

    glData,
    loading,
    error,
    page,
    handlePageChange,
    pageSize: PAGE_SIZE,

    displayAmount,
  };
}
