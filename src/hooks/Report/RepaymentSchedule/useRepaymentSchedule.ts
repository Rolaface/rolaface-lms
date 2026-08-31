import { useState, useMemo } from "react";
import type {
  LoanScheduleInfo,
  RepaymentScheduleRow,
} from "../../../types/Report/repaymentSchedule";

// ── Hardcoded demo data ──────────────────────────────────────
const DEMO_ROWS: RepaymentScheduleRow[] = Array.from({ length: 60 }, (_, i) => {
  const idx = i + 1;
  const principalBase = 15000 + idx * 20;
  const interestBase = 6200 - idx * 25;
  const penalty = [2, 4, 7].includes(idx) ? (idx === 2 ? 200 : idx === 4 ? 150 : 300) : 0;
  const charges = 133;
  const total = principalBase + Math.max(interestBase, 0) + penalty + charges;
  const balance = Math.max(1000000 - principalBase * idx, 0);
  const month = ((i % 12)) ;
  const year = 2024 + Math.floor(i / 12);
  const dateStr = `${year}-${String(month + 6 > 12 ? month + 6 - 12 : month + 6).padStart(2, "0")}-01`;
  const status = idx <= 6 ? "Paid" : idx === 7 ? "Pending" : "Upcoming";
  return {
    idx,
    payment_date: dateStr,
    emi_amount: 21247,
    principal_amount: principalBase,
    interest_amount: Math.max(interestBase, 0),
    penalty_amount: penalty,
    charges,
    total_payment: total,
    balance_loan_amount: balance,
    ui_status: status,
  };
});

const DEMO_INFO: LoanScheduleInfo = {
  loan_account: "LN-2024-000123",
  customer_name: "Rohit Sharma",
  loan_amount: 1000000,
  loan_tenure: 60,
  loan_start_date: "2024-05-01",
  maturity_date: "2029-04-30",
  emi_amount: 21247,
  interest_rate: 9.5,
  penalty_rate: 2.0,
  currency: "₹",
  disbursement_date: "2024-05-01",
  frequency: "Monthly",
  interest_method: "Reducing Balance",
  day_count_basis: "Actual/365",
  rate_of_interest: 9.5,
  interest_rate_history: [
    { effective_from: "2024-05-01", rate: 9.50 },
    { effective_from: "2026-01-01", rate: 10.00 },
  ],
  penalty_rate_history: [
    { effective_from: "2024-05-01", rate: 2.00 },
    { effective_from: "2026-01-01", rate: 2.50 },
  ],
  repayment_schedule: DEMO_ROWS,
  summary: {
    total_installments: 60,
    paid_installments: 6,
    pending_installments: 1,
    upcoming_installments: 53,
    total_principal: 1000000,
    total_interest: 274820,
    total_penalty: 12820,
    total_charges: 7980,
    total_payable: 1282800,
  },
};

// ── Hook ─────────────────────────────────────────────────────
export function useRepaymentSchedule() {
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [chartViewType, setChartViewType] = useState<"chart" | "table">("chart");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [fromDate] = useState("2024-05-01");
  const [toDate] = useState("2029-04-30");

  const scheduleInfo = DEMO_INFO;

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return scheduleInfo.repayment_schedule.slice(start, start + pageSize);
  }, [page, pageSize]);

  const totalPages = Math.ceil(scheduleInfo.repayment_schedule.length / pageSize);

  const chartData = useMemo(() => {
    return scheduleInfo.repayment_schedule.map((row) => ({
      installment: row.idx,
      Principal: row.principal_amount,
      Interest: row.interest_amount,
      Charges: row.charges,
    }));
  }, []);

  return {
    tabs: { activeTab, setActiveTab, chartViewType, setChartViewType },
    data: { scheduleInfo, paginatedRows, chartData },
    pagination: { page, setPage, pageSize, totalPages },
    dates: { fromDate, toDate },
  };
}
