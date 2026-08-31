export interface InterestRateHistoryEntry {
  effective_from: string;
  rate: number;
}

export interface PenaltyRateHistoryEntry {
  effective_from: string;
  rate: number;
}

export interface RepaymentScheduleRow {
  idx: number;
  payment_date: string;
  emi_amount: number;
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  charges: number;
  total_payment: number;
  balance_loan_amount: number;
  ui_status: "Paid" | "Pending" | "Upcoming" | "Overdue" | "Partially Paid" | string;
}

export interface RepaymentScheduleSummary {
  total_installments: number;
  paid_installments: number;
  pending_installments: number;
  upcoming_installments: number;
  total_principal: number;
  total_interest: number;
  total_penalty: number;
  total_charges: number;
  total_payable: number;
}

export interface LoanScheduleInfo {
  loan_account: string;
  customer_name: string;
  loan_amount: number;
  loan_tenure: number;
  loan_start_date: string;
  maturity_date: string;
  emi_amount: number;
  interest_rate: number;
  penalty_rate: number;
  currency: string;
  disbursement_date: string;
  frequency: string;
  interest_method: string;
  day_count_basis: string;
  rate_of_interest: number;
  interest_rate_history: InterestRateHistoryEntry[];
  penalty_rate_history: PenaltyRateHistoryEntry[];
  repayment_schedule: RepaymentScheduleRow[];
  summary: RepaymentScheduleSummary;
}
