export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface StatementSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface StatementRow {
  date: string;
  particulars: string;
  reference_no: string;
  transaction_type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface DashboardSummary {
  opening_balance: number;
  closing_balance: number;
  total_disbursed: number;
  total_repayments: number;
  total_charges: number;
}

export interface LoanSnapshot {
  currency: string;
  loan_account: string;
  loan_product: string;
  loan_amount: number;
  disbursed_amount: number;
  roi: number;
  emi_amount: number;
  emi_start_date: string;
  next_due_date: string;
  emis_paid: string;
}

export interface BalanceTrend {
  month: string;
  balance: number;
}

export interface CashFlow {
  month: string;
  disbursal: number;
  repayment: number;
  charges: number;
}

export interface AgingSummary {
  label: string;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  snapshot: LoanSnapshot;
  balance_trend: BalanceTrend[];
  cash_flow: CashFlow[];
  aging_summary: AgingSummary[];
}