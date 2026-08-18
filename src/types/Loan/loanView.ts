export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LoanDemand {
  type: string;
  raised: number;
  paid: number;
  outstanding: number;
  waived: number;
}

export interface LoanOverview {
  name: string;
  loan_product: string;
  status: string;
  classification_code: string;
  loan_amount: number;
  disbursed_amount: number;
  total_principal_paid: number;
  monthly_repayment_amount: number;
  days_past_due: number;
  rate_of_interest: number;
  penalty_charges_rate: number;
  repayment_periods: number;
  repayment_frequency: string;
  owner: string;
  outstanding_principal: number;
  maturity_date: string | null;
  total_installments_raised: number;
  remaining_tenure: number;
  demands: LoanDemand[];
  total_outstanding: number;
}

export interface TimelineStatusRow {
  idx: number;
  payment_date: string;
  total_payment: number;
  ui_status: "Paid" | "Partially Paid" | "Overdue" | "Upcoming";
}

export interface ScheduleVersion {
  id: string;
  active_from: string;
  active_till: string;
  creation: string;
  status: string;
  valid_from: string;
  valid_till: string;
  is_active: boolean;
}

export interface DetailedScheduleRow {
  idx: number;
  payment_date: string;
  number_of_days: number;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
  charges: number;
  demand_generated: number;
  ui_status?: string;
}

export interface InstallmentDetail {
  idx: number;
  payment_date: string;
  principal: number;
  interest: number;
  total_payment: number;
  balance_loan_amount: number;
  charges: number;
  ui_status: string;
  penalty: number;
}

export interface RepaymentHistoryRow {
  name: string;
  posting_date: string;
  mode_of_payment: string;
  amount_paid: number;
  principal_amount_paid: number;
  total_interest_paid: number;
  total_penalty_paid: number;
  total_charges_paid: number;
  pending_principal_amount: number;
}

export interface DisbursementRow {
  name: string;
  loan_product: string;
  disbursement_date: string;
  disbursement_account: string;
  sanctioned_loan_amount: number;
  disbursed_amount: number;
  disbursed_till_now: number;
  status: string;
  tranche_number: number;
  reference_number: string;
  monthly_repayment_amount: number;
  mode_of_payment: string;
}

export interface AccountingLedgerRow {
  posting_date: string;
  voucher_type: string;
  description: string;
  debit: number;
  credit: number;
  account: string;
}

export interface ActivityAuditRow {
  id: string;
  type: "note" | "email" | "call" | "msg" | "system";
  timestamp: string;
  actor: string;
  title: string;
  subtitle: string;
}

export interface LoanDocumentRow {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  creation: string;
  is_private: boolean;
}

export interface CollateralItem {
  loan_security: string;
  loan_security_name: string;
  loan_security_type: string;
  qty: number;
  loan_security_price: number;
  haircut_percent: number;
  haircut_amount: number;
  post_haircut_amount: number;
  amount: number;
}

export interface CollateralViewRow {
  name: string;
  status: string;
  applicant_type: string;
  applicant: string;
  total_security_value: number;
  maximum_loan_value: number;
  reference_no: string;
  description: string;
  items: CollateralItem[];
}