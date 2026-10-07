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
export type InvestorFlowStatus =
  | "Draft"
  | "Approved"
  | "Received"
  | "Cancelled"
  | "Matured"
  | "Renewed";

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
export type InvestorFlowStatusAction = "approved" | "cancelled";

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
  /** Set when this investment carries the principal renewed from another one. */
  renewed_from: string | null;
}

/** Body of receive_payment. */
export interface InvestorFlowPaymentPayload {
  payment_date: string; // YYYY-MM-DD
  ref_no: string;
  payment_mode: InvestorFlowPaymentMode;
  amount_paid: number;
  paid_from: string; // Bank Account ID of the investor (reference only)
}

/** Body of receive_payment for a renewed investment: no money arrives, only the start date. */
export interface InvestorFlowRenewalReceivePayload {
  payment_date: string; // YYYY-MM-DD
}

/** Payment saved on the Investor Flow. */
export interface InvestorFlowPayment extends InvestorFlowPaymentPayload {
  paid_to: string; // Company Bank Account (Custom Investor Settings)
  paid_gl: string; // Company Account of the Paid From Bank Account
  to_gl: string; // GL Account (same as paid_to)
}

/** get_investor_accounting_settings data. */
export interface InvestorAccountingSettings {
  company: string;
  company_bank_account: string;
  company_bank_currency: string | null;
  investor_deposit_account: string;
}

/** Status of a schedule row. */
export type InvestorEarningRowStatus = "Pending" | "Accrued" | "Paid";

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
  message: string | null;
  creation: string;
  modified: string;
}

/** Body of save_contract (after the contract was emailed). */
export interface InvestorFlowSaveContractPayload {
  to: string;
  subject: string;
  /** Email body that was sent. */
  message: string;
  /** File ID of the uploaded contract PDF. */
  file_id: string;
}

export interface InvestorFlowSaveContractResult {
  id: string;
  contract_status: InvestorFlowContractStatus;
  mail_sent: string;
  subject: string;
  message: string;
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
  status: InvestorEarningRowStatus | null;
  accrual_entry: string | null;
  payout_entry: string | null;
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
  receive_entry: string | null;
  renewed_to: string | null;
  renewed_from: string | null;
  schedule: InvestorEarningScheduleRow[];
}

/** Body of update_investor_earning: details and existing rows (by name) only. */
export interface InvestorEarningUpdatePayload extends Partial<InvestorEarningDetails> {
  schedule: Omit<
    InvestorEarningScheduleRow,
    "idx" | "status" | "accrual_entry" | "payout_entry"
  >[];
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

/* ------------------------- Custom Investor Settings ------------------------- */

/** The five GL accounts of Custom Investor Settings. */
export interface InvestorSettingsAccounts {
  company_bank_account: string;
  investor_deposit_account: string;
  interest_payable_account: string;
  interest_expense_account: string;
  penalty_expense_account: string;
}

export type InvestorSettingsField = keyof InvestorSettingsAccounts;

/** get_investor_settings / update_investor_settings data. */
export interface InvestorSettings {
  company: string | null;
  accounts: Record<InvestorSettingsField, string | null>;
  labels: Record<InvestorSettingsField, string>;
  /** What kind of account each field accepts. */
  rules: Record<InvestorSettingsField, string>;
  /** Accounts each field accepts, in the user's default company. */
  options: Record<InvestorSettingsField, string[]>;
}

/* --------------------------------- Maturity --------------------------------- */

/** Tabs of the Maturity screen. */
export type InvestorMaturityView = "due" | "upcoming" | "closed";

/** What is still owed on the unpaid schedule rows. */
export interface InvestorMaturityOutstanding {
  rows_total: number;
  rows_paid: number;
  outstanding_principal: number;
  outstanding_interest: number;
}

/** A row of get_investor_maturities. */
export interface InvestorMaturityListItem extends InvestorMaturityOutstanding {
  name: string;
  /** Customer name. */
  investor: string;
  investor_id: string;
  investment_product: string;
  investment_product_name: string;
  amount_invested: number;
  rate_of_interest: number;
  frequency: RepaymentFrequency | null;
  mat_date: string | null;
  status: InvestorFlowStatus;
  is_due: boolean;
  renewed_to: string | null;
  renewed_from: string | null;
}

export interface InvestorMaturityListParams {
  view: InvestorMaturityView;
  search?: string;
  investment_product?: string[];
  page?: number;
  page_size?: number;
}

export type InvestorMaturityListResponse = Omit<InvestorFlowListResponse, "data"> & {
  data: InvestorMaturityListItem[];
};

/** Terms of the new investment created by Renew. */
export interface InvestorRenewalTerms {
  investment_product: string;
  interest_rate: number;
  repayment_frequency: RepaymentFrequency;
  first_repayment_date: string; // YYYY-MM-DD
  maturity_date: string; // YYYY-MM-DD
  penalty_rate: number;
}

/** get_investor_maturity_by_id data. */
export interface InvestorMaturity extends InvestorMaturityOutstanding {
  id: string;
  status: InvestorFlowStatus;
  investor_id: string;
  investor: string;
  investment_product: string;
  investment_product_name: string;
  amount_invested: number;
  rate_of_interest: number;
  frequency: RepaymentFrequency | null;
  payment_date: string | null;
  mat_date: string | null;
  is_due: boolean;
  renewed_to: string | null;
  renewed_from: string | null;
  /** Renew: whole-rupee principal carried into the new investment. */
  renewal_carry_amount: number;
  /** Renew: interest (and the paise of principal) paid out in cash. */
  renewal_cash_payout: number;
  renewal_defaults: InvestorRenewalTerms | null;
}
