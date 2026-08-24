import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  getLoanOverview,
  getRepaymentScheduleTimeline,
  getInstallmentDetail,
  getRepaymentHistory,
  getLoanAccountingLedger,
  getCollateralView,
  getLoanDocuments,
  getLoanActivityAudit,
  getDisbursementHistory,
  getRepaymentSchedule
} from "../../api/Loan/loanViewApi";
import type {
  LoanOverview,
  TimelineStatusRow,
  InstallmentDetail,
  RepaymentHistoryRow,
  AccountingLedgerRow,
  CollateralViewRow,
  LoanDocumentRow,
  ActivityAuditRow,
  DisbursementRow,
  PaginationMeta,
} from "../../types/Loan/loanView";

export function useLoanView(loanId: string) {
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [overview, setOverview] = useState<LoanOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineStatusRow[]>([]);
  const [activeInstallment, setActiveInstallment] = useState<InstallmentDetail | null>(null);
  const [schedule, setSchedule] = useState<any | null>(null);

  const [history, setHistory] = useState<RepaymentHistoryRow[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRow[]>([]);
  const [accounting, setAccounting] = useState<AccountingLedgerRow[]>([]);
  const [collateral, setCollateral] = useState<CollateralViewRow[]>([]);
  const [documents, setDocuments] = useState<LoanDocumentRow[]>([]);
  const [activity, setActivity] = useState<ActivityAuditRow[]>([]);

  // Pagination States
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState<PaginationMeta | null>(null);

  const [disbursementPage, setDisbursementPage] = useState(1);
  const [disbursementMeta, setDisbursementMeta] = useState<PaginationMeta | null>(null);

  const [accountingPage, setAccountingPage] = useState(1);
  const [accountingMeta, setAccountingMeta] = useState<PaginationMeta | null>(null);

  const [collateralPage, setCollateralPage] = useState(1);
  const [collateralMeta, setCollateralMeta] = useState<PaginationMeta | null>(null);

  const [documentPage, setDocumentPage] = useState(1);
  const [documentMeta, setDocumentMeta] = useState<PaginationMeta | null>(null);

  const [activityPage, setActivityPage] = useState(1);
  const [activityMeta, setActivityMeta] = useState<PaginationMeta | null>(null);

  // Loading States
  const [loading, setLoading] = useState({
    overview: true,
    timeline: false,
    installment: false,
    history: false,
    disbursements: false,
    accounting: false,
    collateral: false,
    documents: false,
    activity: false,
    schedule: false,
  });

  // Fetchers
  const fetchOverview = useCallback(async () => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, overview: true }));
    try {
      const data = await getLoanOverview({ id: loanId });
      console.log("🚀 ~ useLoanView ~ getLoanOverview:", data)
      setOverview(data.data);
    } catch (error) {
      console.error("Failed to fetch overview", error);
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }));
    }
  }, [loanId]);

  const fetchTimeline = useCallback(async () => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, timeline: true }));
    try {
      const res = await getRepaymentScheduleTimeline({ id: loanId });
      console.log("🚀 ~ useLoanView ~ getRepaymentScheduleTimeline:", res)
      setTimeline(res.data?.timeline || []);
    } catch (error) {
      console.error("Failed to fetch timeline", error);
    } finally {
      setLoading((prev) => ({ ...prev, timeline: false }));
    }
  }, [loanId]);

  const fetchInstallment = useCallback(async (idx: number) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, installment: true }));
    try {
      const res = await getInstallmentDetail({ id: loanId, idx });
      console.log("🚀 ~ useLoanView ~ getInstallmentDetail:", res)
      setActiveInstallment(res.data);
    } catch (error) {
      console.error("Failed to fetch installment", error);
    } finally {
      setLoading((prev) => ({ ...prev, installment: false }));
    }
  }, [loanId]);

  const fetchSchedule = useCallback(async () => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, schedule: true }));
    try {
      const res = await getRepaymentSchedule({ id: loanId });
      setSchedule(res.data);
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoading((prev) => ({ ...prev, schedule: false }));
    }
  }, [loanId]);

  const fetchHistory = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const res = await getRepaymentHistory({ id: loanId, page, page_size: 15 });
      console.log("🚀 ~ useLoanView ~ getRepaymentHistory:", res)
      setHistory(res.data.data);
      setHistoryMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  }, [loanId]);

  const fetchDisbursements = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, disbursements: true }));
    try {
      const res = await getDisbursementHistory({ id: loanId, page, page_size: 15 });
      console.log("🚀 ~ useLoanView ~ getDisbursementHistory:", res)
      setDisbursements(res.data.data);
      setDisbursementMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch disbursements", error);
    } finally {
      setLoading((prev) => ({ ...prev, disbursements: false }));
    }
  }, [loanId]);

  const fetchAccounting = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, accounting: true }));
    try {
      const res = await getLoanAccountingLedger({ id: loanId, page, page_size: 15 });
      console.log("🚀 ~ useLoanView ~ getLoanAccountingLedger:", res)
      setAccounting(res.data.data);
      setAccountingMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch accounting", error);
    } finally {
      setLoading((prev) => ({ ...prev, accounting: false }));
    }
  }, [loanId]);

  const fetchCollateral = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, collateral: true }));
    try {
      const res = await getCollateralView({ id: loanId, page, page_size: 15 });
      console.log("🚀 ~ useLoanView ~ getCollateralView:", res)
      setCollateral(res.data.data);
      setCollateralMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch collateral", error);
    } finally {
      setLoading((prev) => ({ ...prev, collateral: false }));
    }
  }, [loanId]);

  const fetchDocuments = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, documents: true }));
    try {
      const res = await getLoanDocuments({ id: loanId, page, page_size: 15 });
      console.log("🚀 ~ useLoanView ~ getLoanDocuments:", res)
      setDocuments(res.data.data);
      setDocumentMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading((prev) => ({ ...prev, documents: false }));
    }
  }, [loanId]);

  const fetchActivity = useCallback(async (page = 1) => {
    if (!loanId) return;
    setLoading((prev) => ({ ...prev, activity: true }));
    try {
      const res = await getLoanActivityAudit({ id: loanId, page, page_size: 20 });
      console.log("🚀 ~ useLoanView ~ getLoanActivityAudit:", res)
      setActivity(res.data.data);
      setActivityMeta(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch activity", error);
    } finally {
      setLoading((prev) => ({ ...prev, activity: false }));
    }
  }, [loanId]);

  // Reset all tab data & pagination whenever the selected loan changes.
  // Without this, switching loans only updates `overview` (which fetches
  // unconditionally), while every other tab keeps showing the previously
  // selected loan's data because their lazy-load guards (`xxx.length === 0`)
  // stay false — the stale arrays are still populated.
  //
  // IMPORTANT: this is a useLayoutEffect, not useEffect. useEffect runs
  // AFTER the browser paints, which means React would paint one frame with
  // the new loanId but the OLD loan's overview/tab data still in state —
  // a visible flash of stale data before the reset kicks in. useLayoutEffect
  // runs synchronously right after render but BEFORE paint, so the state is
  // already cleared (and the skeleton/loading UI shows) in the very first
  // frame rendered for the new loan.
  useLayoutEffect(() => {
    setActiveTab("overview");

    setOverview(null);
    setTimeline([]);
    setActiveInstallment(null);
    setSchedule(null);
    setHistory([]);
    setDisbursements([]);
    setAccounting([]);
    setCollateral([]);
    setDocuments([]);
    setActivity([]);

    setHistoryPage(1);
    setHistoryMeta(null);
    setDisbursementPage(1);
    setDisbursementMeta(null);
    setAccountingPage(1);
    setAccountingMeta(null);
    setCollateralPage(1);
    setCollateralMeta(null);
    setDocumentPage(1);
    setDocumentMeta(null);
    setActivityPage(1);
    setActivityMeta(null);

    // Also mark overview as loading right away, in the same synchronous
    // pass, so the Skeleton in LoanDetailView shows immediately instead of
    // a stale "false" loading flag causing a "Loan not found" flash.
    setLoading((prev) => ({ ...prev, overview: true }));
  }, [loanId]);

  // Initial Load (Overview)
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Lazy load tabs based on active view
  useEffect(() => {
    if (!loanId) return;
    if (activeTab === "overview") {
      if (timeline.length === 0) fetchTimeline();
      if (history.length === 0) fetchHistory();
      if (disbursements.length === 0) fetchDisbursements();
      if (accounting.length === 0) fetchAccounting();
      if (collateral.length === 0) fetchCollateral();
      if (documents.length === 0) fetchDocuments();
      if (activity.length === 0) fetchActivity();
    }
    // if (activeTab === "schedule" && timeline.length === 0) fetchTimeline();
    if (activeTab === "schedule" && !schedule) fetchSchedule();
    if (activeTab === "history" && history.length === 0) fetchHistory();
    if (activeTab === "disbursement" && disbursements.length === 0) fetchDisbursements();
    if (activeTab === "accounting" && accounting.length === 0) fetchAccounting();
    if (activeTab === "collateral" && collateral.length === 0) fetchCollateral();
    if (activeTab === "documents" && documents.length === 0) fetchDocuments();
    if (activeTab === "activity" && activity.length === 0) fetchActivity();
  }, [
    activeTab, loanId, timeline.length, history.length, disbursements.length,
    accounting.length, collateral.length, documents.length, activity.length,
    schedule,
    fetchTimeline, fetchHistory, fetchDisbursements, fetchAccounting,
    fetchCollateral, fetchDocuments, fetchActivity
  ]);

  return {
    data: {
      overview,
      timeline,
      activeInstallment,
      schedule,
      history,
      disbursements,
      accounting,
      collateral,
      documents,
      activity,
    },
    pagination: {
      historyPage, setHistoryPage, historyMeta,
      disbursementPage, setDisbursementPage, disbursementMeta,
      accountingPage, setAccountingPage, accountingMeta,
      collateralPage, setCollateralPage, collateralMeta,
      documentPage, setDocumentPage, documentMeta,
      activityPage, setActivityPage, activityMeta,
    },
    status: loading,
    activeTab,
    setActiveTab,
    actions: {
      fetchTimeline,
      fetchInstallment,
      fetchSchedule,
      fetchHistory,
      fetchDisbursements,
      fetchAccounting,
      fetchCollateral,
      fetchDocuments,
      fetchActivity,
    }
  };
}