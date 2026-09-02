import { useState, useEffect, useCallback } from "react";
import {
  getDashboardSummary,
  getDashboardCharts,
  getQuickInsights,
  getPendingApprovals,
  getOverdueTasks,
} from "../../api/Dashboard/dashboardApi";
import type {
  DashboardSummary,
  DashboardCharts,
  QuickInsights,
  PendingApprovalRow,
  OverdueTaskRow,
  PaginationMeta,
} from "../../types/Dashboard/loanDashboard";
import { notifyError } from "../../utils/notify";
import { parseFrappeError } from "../../utils/parseFrappeError";

const getStartOfYearAndToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${year}-01-01`,
    end: `${year}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  };
};

let isErrorShowing = false;

const safeNotifyError = (err: any, defaultMessage: string) => {
  if (isErrorShowing) return;
  
  isErrorShowing = true;
  notifyError(parseFrappeError(err), defaultMessage);
  
  setTimeout(() => {
    isErrorShowing = false;
  }, 3000);
};

export function useLoanDashboard() {
  const { start, end } = getStartOfYearAndToday();
  const [fromDate, setFromDate] = useState(start);
  const [toDate, setToDate] = useState(end);
  const [company, setCompany] = useState<string>("");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [insights, setInsights] = useState<QuickInsights | null>(null);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalRow[]>([]);
  const [pendingPagination, setPendingPagination] = useState<PaginationMeta | null>(null);
  const [pendingPage, setPendingPage] = useState(1);

  const [overdueTasks, setOverdueTasks] = useState<OverdueTaskRow[]>([]);
  const [overduePagination, setOverduePagination] = useState<PaginationMeta | null>(null);
  const [overduePage, setOverduePage] = useState(1);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingOverdue, setLoadingOverdue] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const params = { from_date: fromDate, to_date: toDate, company };

    setLoadingSummary(true);
    getDashboardSummary(params)
      .then((res) => {
        const payload = res.message || res;
        if (payload.status_code === 200) setSummary(payload.data);
      })
      .catch((err) => safeNotifyError(err, "Failed to load summary"))
      .finally(() => setLoadingSummary(false));

    setLoadingCharts(true);
    getDashboardCharts(params)
      .then((res) => {
        const payload = res.message || res;
        if (payload.status_code === 200) setCharts(payload.data);
      })
      .catch((err) => safeNotifyError(err, "Failed to load charts"))
      .finally(() => setLoadingCharts(false));

    setLoadingInsights(true);
    getQuickInsights(params)
      .then((res) => {
        const payload = res.message || res;
        if (payload.status_code === 200) setInsights(payload.data);
      })
      .catch((err) => safeNotifyError(err, "Failed to load insights"))
      .finally(() => setLoadingInsights(false));
  }, [fromDate, toDate, company]);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    getPendingApprovals({ from_date: fromDate, to_date: toDate, company, page: pendingPage, page_size: 5 })
      .then((res) => {
        const payload = res;
        if (payload.status_code === 200) {
          setPendingApprovals(payload.data);
          setPendingPagination(payload.pagination);
        }
      })
      .catch((err) => safeNotifyError(err, "Failed to load pending approvals"))
      .finally(() => setLoadingPending(false));
  }, [fromDate, toDate, company, pendingPage]);

  const fetchOverdue = useCallback(async () => {
    setLoadingOverdue(true);
    getOverdueTasks({ from_date: fromDate, to_date: toDate, company, page: overduePage, page_size: 5 })
      .then((res) => {
        const payload = res;
        if (payload.status_code === 200) {
          setOverdueTasks(payload.data);
          setOverduePagination(payload.pagination);
        }
      })
      .catch((err) => safeNotifyError(err, "Failed to load overdue tasks"))
      .finally(() => setLoadingOverdue(false));
  }, [fromDate, toDate, company, overduePage]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    fetchOverdue();
  }, [fetchOverdue]);

  const refetchAll = () => {
    setPendingPage(1);
    setOverduePage(1);
    fetchDashboardData();
    fetchPending();
    fetchOverdue();
  };

  return {
    filters: { fromDate, setFromDate, toDate, setToDate, company, setCompany },
    pagination: { pendingPage, setPendingPage, pendingPagination, overduePage, setOverduePage, overduePagination },
    data: { summary, charts, insights, pendingApprovals, overdueTasks },
    status: {
      loading: loadingSummary || loadingCharts || loadingInsights || loadingPending || loadingOverdue,
      loadingSummary,
      loadingCharts,
      loadingInsights,
      loadingPending,
      loadingOverdue,
    },
    actions: { refetch: refetchAll },
  };
}