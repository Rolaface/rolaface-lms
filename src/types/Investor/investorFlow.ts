/** Options of the "Repayment Frequency" field of the Custom Investor Flow doctype. */
export const REPAYMENT_FREQUENCIES = [
  "Monthly",
  "Weekly",
  "Bi-Weekly",
  "Quarterly",
  "Yearly",
] as const;

export type RepaymentFrequency = (typeof REPAYMENT_FREQUENCIES)[number];

/** Options of the "Status" field of the Custom Investor Flow doctype. */
export type InvestorFlowStatus = "Draft" | "Approved" | "Received" | "Cancelled";

/** Options of the "Contract Status" field of the Custom Investor Flow doctype. */
export type InvestorFlowContractStatus = "Pending" | "Sent" | "Paid";

/** Options of the "Mode of Payment" field of the Custom Investor Flow doctype. */
export const INVESTOR_FLOW_PAYMENT_MODES = [
  "Wire Transfer",
  "Cheque",
  "Cash",
  "Bank Draft",
] as const;

export type InvestorFlowPaymentMode = (typeof INVESTOR_FLOW_PAYMENT_MODES)[number];

/** `action` query param of update_investor_flow_status. */
export type InvestorFlowStatusAction = "approved" | "received" | "cancelled";

/** Terms used by get_schedules (and part of create / update). */
export interface InvestorFlowTerms {
  investment_amount: number;
  repayment_frequency: RepaymentFrequency;
  maturity_date: string; // YYYY-MM-DD
  interest_rate: number;
  first_repayment_date: string; // YYYY-MM-DD
  penalty_rate?: number;
}

export interface InvestorFlowPayload extends InvestorFlowTerms {
  investor: string; // Customer ID
  investment_product: string; // Custom Investment Product ID
}

/** A row of get_investor_flow. */
export interface InvestorFlowListItem {
  name: string;
  /** Customer name. */
  investor: string;
  /** Customer ID. */
  investor_id: string;
  investment_product: string;
  investment_amount: number;
  repayment_frequency: RepaymentFrequency;
  maturity_date: string;
  interest_rate: number;
  first_repayment_date: string;
  penalty_rate: number | null;
  status: InvestorFlowStatus;
  contract_status: InvestorFlowContractStatus;
}

/** Body of receive_payment. */
export interface InvestorFlowPaymentPayload {
  payment_date: string; // YYYY-MM-DD
  ref_no: string;
  payment_mode: InvestorFlowPaymentMode;
  amount_paid: number;
  paid_from: string; // Bank Account ID of the investor
  paid_to: string; // Account ID
}

/** Payment saved on the Investor Flow (with the GL accounts used in the Journal Entry). */
export interface InvestorFlowPayment extends InvestorFlowPaymentPayload {
  paid_gl: string; // Company Account of the Paid From Bank Account
  to_gl: string; // GL Account (same as paid_to)
}

/** A row of get_investor_bank_accounts (Bank Account with Party = the investor). */
export interface InvestorBankAccount {
  name: string;
  account_name: string;
  bank: string;
  bank_account_no: string | null;
  iban: string | null;
  branch_code: string | null;
  is_default: 0 | 1;
  /** GL Account. */
  account: string | null;
  account_currency: string | null;
}

/** get_investor_flow_by_id data ("investor" is the Customer ID here). */
export interface InvestorFlowRecord
  extends Omit<InvestorFlowListItem, "investor_id">,
    Partial<Record<keyof InvestorFlowPayment, string | number | null>> {
  mail_sent: string | null;
  subject: string | null;
  creation: string;
  modified: string;
}

/** Body of save_contract (after the contract was emailed). */
export interface InvestorFlowSaveContractPayload {
  to: string;
  subject: string;
  /** File ID of the uploaded contract PDF. */
  file_id: string;
}

export interface InvestorFlowSaveContractResult {
  id: string;
  contract_status: InvestorFlowContractStatus;
  mail_sent: string;
  subject: string;
  file_id: string;
  file_url: string;
}

export interface InvestorFlowReceivePaymentResult extends InvestorFlowPayment {
  id: string;
  status: InvestorFlowStatus;
  contract_status: InvestorFlowContractStatus;
  journal_entry: string;
}

export interface InvestorFlowListParams {
  search?: string;
  investment_product?: string[];
  status?: string[];
  page?: number;
  page_size?: number;
}

export interface InvestorFlowListResponse {
  status_code: number;
  status: string;
  message: string;
  data: InvestorFlowListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/** Body of the endpoints that answer with send_response (Frappe wraps it in `message`). */
export interface InvestorFlowEnvelope<T> {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: T;
  };
}

export interface InvestorFlowStatusResult {
  id: string;
  previous_status: InvestorFlowStatus;
  status: InvestorFlowStatus;
}

export interface InvestorFlowScheduleRow {
  installment_no: number;
  date: string;
  principal: number;
  interest: number;
  total: number;
}

export interface InvestorFlowSchedule {
  investment_amount: number;
  interest_rate: number;
  penalty_rate: number;
  repayment_frequency: RepaymentFrequency;
  first_repayment_date: string;
  maturity_date: string;
  total_months: number;
  total_interest: number;
  per_payment: number;
  count: number;
  schedule: InvestorFlowScheduleRow[];
}

/* --------------------------- Earning & Settlement --------------------------- */

/** Earning & Settlement detail fields of the Custom Investor Flow doctype. */
export interface InvestorEarningDetails {
  amount_invested: number;
  frequency: RepaymentFrequency | null;
  mat_date: string | null; // YYYY-MM-DD
  rate_of_interest: number;
  first_repay_date: string | null; // YYYY-MM-DD
  rate_of_penalty: number | null;
}

/** A row of the "schedule" table (Custom Investor Earning Schedule). */
export interface InvestorEarningScheduleRow {
  name: string;
  idx: number;
  payment_date: string; // YYYY-MM-DD
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  total_payment: number;
}

/** get_investor_earning_by_id data. */
export interface InvestorEarning extends InvestorEarningDetails {
  id: string;
  status: InvestorFlowStatus;
  investor_id: string;
  /** Customer name. */
  investor: string;
  investment_product: string;
  investment_product_name: string;
  payment_date: string | null;
  schedule: InvestorEarningScheduleRow[];
}

/** Body of update_investor_earning: details and existing rows (by name) only. */
export interface InvestorEarningUpdatePayload extends Partial<InvestorEarningDetails> {
  schedule: Omit<InvestorEarningScheduleRow, "idx">[];
}

/** A row of get_investor_earnings. */
export interface InvestorEarningListItem {
  name: string;
  /** Customer name. */
  investor: string;
  investor_id: string;
  investment_product: string;
  investment_product_name: string;
  amount_invested: number;
  rate_of_interest: number;
  frequency: RepaymentFrequency | null;
  first_repay_date: string | null;
  mat_date: string | null;
  payment_date: string | null;
  status: InvestorFlowStatus;
}

export interface InvestorEarningListParams {
  search?: string;
  investment_product?: string[];
  page?: number;
  page_size?: number;
}

export type InvestorEarningListResponse = Omit<InvestorFlowListResponse, "data"> & {
  data: InvestorEarningListItem[];
};
