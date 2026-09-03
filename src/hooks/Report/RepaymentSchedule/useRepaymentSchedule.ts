import { useState, useMemo } from "react";
import type {
  LoanScheduleInfo,
  RepaymentScheduleRow,
} from "../../../types/Report/repaymentSchedule";

// ── Hardcoded demo data ──────────────────────────────────────
const DEMO_ROWS: RepaymentScheduleRow[] = Array.from({ length: 60 }, (_, i) => {
  const idx = i + 1;
  const step = (idx - 1) * (11000 / 59);
  const principalBase = 6000 + step;
  const interestBase = 14000 - step;
  const charges = 1800;
  const penalty = [2, 4, 7].includes(idx) ? (idx === 2 ? 200 : idx === 4 ? 150 : 300) : 0;
  const total = principalBase + interestBase + penalty + charges;
  const balance = Math.max(1000000 - (6000 * idx + (idx * (idx - 1) / 2) * (11000 / 59)), 0);
  const month = ((i % 12));
  const year = 2024 + Math.floor(i / 12);
  const dateStr = `${year}-${String(month + 6 > 12 ? month + 6 - 12 : month + 6).padStart(2, "0")}-01`;
  const status = idx <= 6 ? "Paid" : idx === 7 ? "Pending" : "Upcoming";
  return {
    idx,
    payment_date: dateStr,
    emi_amount: principalBase + interestBase,
    principal_amount: principalBase,
    interest_amount: interestBase,
    penalty_amount: penalty,
    charges: charges,
    total_payment: total,
    balance_loan_amount: balance,
    ui_status: status as any,
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
  currency: "ZMW",
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
  const [pageSize] = useState(8);
  const [selectedLoan, setSelectedLoan] = useState<string | null>("LN-2024-000123");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>("Rohit Sharma");
  const [fromDate, setFromDate] = useState<Date | string | null>(new Date(2024, 4, 1));
  const [toDate, setToDate] = useState<Date | string | null>(new Date(2029, 3, 30));
  const [loanSearch, setLoanSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const filters = {
    selectedLoan,
    selectedCustomer,
    fromDate,
    toDate,
    loanSearch,
    customerSearch,
    setSelectedLoan,
    setSelectedCustomer,
    setFromDate,
    setToDate,
    setLoanSearch,
    setCustomerSearch,
    dates: { fromDate, toDate }
  };

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

  return { filters, scheduleInfo, paginatedRows, chartData, activeTab, setActiveTab, chartViewType, setChartViewType, page, setPage, pageSize, totalPages, loading: false, error: null, lookups: { loanOptions: [{ value: "LN-2024-000123", label: "LN-2024-000123" }], customerOptions: [{ value: "Rohit Sharma", label: "Rohit Sharma" }] } };
}
