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

export function useLoanDashboard() {
  const { start, end } = getStartOfYearAndToday();
  const [fromDate, setFromDate] = useState(start);
  const [toDate, setToDate] = useState(end);
  const [company, setCompany] = useState<string>(""); 

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [insights, setInsights] = useState<QuickInsights | null>(null);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalRow[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTaskRow[]>([]);

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
        console.log("🚀 ~ useLoanDashboard ~ getDashboardSummary payload:", payload)
        if (payload.status_code === 200) setSummary(payload.data);
      })
      .catch((err) => notifyError(parseFrappeError(err), "Failed to load summary"))
      .finally(() => setLoadingSummary(false));

    setLoadingCharts(true);
    getDashboardCharts(params)
      .then((res) => {
        const payload = res.message || res;
        console.log("🚀 ~ useLoanDashboard ~ getDashboardCharts payload:", payload)
        if (payload.status_code === 200) setCharts(payload.data);
      })
      .catch((err) => notifyError(parseFrappeError(err), "Failed to load charts"))
      .finally(() => setLoadingCharts(false));

    setLoadingInsights(true);
    getQuickInsights(params)
      .then((res) => {
        const payload = res.message || res;
        console.log("🚀 ~ useLoanDashboard ~ getQuickInsights payload:", payload)
        if (payload.status_code === 200) setInsights(payload.data);
      })
      .catch((err) => notifyError(parseFrappeError(err), "Failed to load insights"))
      .finally(() => setLoadingInsights(false));

    setLoadingPending(true);
    getPendingApprovals({ ...params, page: 1, page_size: 5 })
      .then((res) => {
        const payload = res;
        if (payload.status_code === 200) setPendingApprovals(payload.data);
      })
      .catch((err) => notifyError(parseFrappeError(err), "Failed to load pending approvals"))
      .finally(() => setLoadingPending(false));

    setLoadingOverdue(true);
    getOverdueTasks({ ...params, page: 1, page_size: 5 })
      .then((res) => {
        const payload = res;
        if (payload.status_code === 200) setOverdueTasks(payload.data);
      })
      .catch((err) => notifyError(parseFrappeError(err), "Failed to load overdue tasks"))
      .finally(() => setLoadingOverdue(false));
  }, [fromDate, toDate, company]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    filters: { fromDate, setFromDate, toDate, setToDate, company, setCompany },
    data: { summary, charts, insights, pendingApprovals, overdueTasks },
    status: {
      loading: loadingSummary || loadingCharts || loadingInsights || loadingPending || loadingOverdue,
      loadingSummary,
      loadingCharts,
      loadingInsights,
      loadingPending,
      loadingOverdue,
    },
    actions: { refetch: fetchDashboardData },
  };
}