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
  | "Cancelled"
  | "Paid"
  // Earlier statuses still used by the Earnings / Maturity screens (reworked later).
  | "Received"
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
export interface InvestorFlowRecord extends Omit<InvestorFlowListItem, "investor_id"> {
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
  /** Schedule version this row belongs to (1, 2, …). */
  version: number;
}

/** An earlier version of the repayment schedule (before an edit). */
export interface InvestorScheduleVersion {
  version: number;
  rows: InvestorEarningScheduleRow[];
}

/** get_investor_earning_by_id data. */
export interface InvestorEarning extends InvestorEarningDetails {
  id: string;
  status: InvestorFlowStatus;
  fund_status: InvestorFundStatus;
  investor_id: string;
  /** Customer name. */
  investor: string;
  investment_product: string;
  investment_product_name: string;
  payment_date: string | null;
  receive_entry: string | null;
  /** Pending / Paid / Renewed / Expired (Expired: the schedule can only be viewed; rows can still be paid). */
  payment_status: PaymentStatus | null;
  renewal_status: RenewalStatus | null;
  /** Version of the current schedule (the highest one). */
  schedule_version: number;
  /** The current schedule (rows of the highest version). */
  schedule: InvestorEarningScheduleRow[];
  /** Earlier versions, newest first. */
  schedule_history: InvestorScheduleVersion[];
}

/** Body of update_investor_earning: details and existing rows (by name) only. */
export interface InvestorEarningUpdatePayload extends Partial<InvestorEarningDetails> {
  schedule: Omit<
    InvestorEarningScheduleRow,
    "idx" | "status" | "accrual_entry" | "payout_entry" | "version"
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
  payment_status: PaymentStatus | null;
  renewal_status: RenewalStatus | null;
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
  investor_creditor_account: string;
  investor_cash_account: string;
  cheque_account: string;
  bank_draft_account: string;
  wire_transfer_account: string;
  company_bank_account: string;
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
  /** Fields that must be set to save. */
  required: InvestorSettingsField[];
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

/* -------------------------------- Record Fund -------------------------------- */

/** Fund Status of the Custom Investor Flow doctype. */
export type InvestorFundStatus = "Pending" | "Partial" | "Paid";

/** Record Status of a fund record: Draft (no accounting) -> Approved (Journal Entry posted) / Cancelled. */
export type FundRecordStatus = "Draft" | "Approved" | "Cancelled";

/** A row of the Record Fund table (Custom Investor Record Fund). */
export interface InvestorFundRow {
  name: string;
  idx: number;
  investment_id: string;
  record_status: FundRecordStatus;
  /** Journal Entry posted on approval. */
  journal_entry: string | null;
  amount_paid: number;
  mode_of_payment: InvestorFlowPaymentMode;
  reference_number: string | null;
  /** Paid to: the GL the money landed in. */
  debit_gl: string;
  debit_gl_description: string;
  /** Paid from: the Investor Creditor GL (party = the investor). */
  credit_gl: string;
  credit_gl_description: string;
  paid_date: string;
}

interface InvestorFundSummary {
  investment_amount: number;
  /** Approved records. */
  fund_received: number;
  remaining_fund: number;
  /** Draft records (not yet approved). */
  draft_amount: number;
  /** What a new record can still be for (drafts included). */
  available_to_record: number;
  fund_status: InvestorFundStatus;
  last_paid_date: string | null;
  last_mode_of_payment: InvestorFlowPaymentMode | null;
}

/** A row of get_investor_funds. */
export interface InvestorFundListItem extends InvestorFundSummary {
  name: string;
  /** Investor name. */
  investor: string;
  investor_id: string;
  status: InvestorFlowStatus;
}

/** get_investor_fund_by_id / record_fund data. */
export interface InvestorFund extends InvestorFundSummary {
  id: string;
  investor: string;
  investor_id: string;
  status: InvestorFlowStatus;
  funds: InvestorFundRow[];
}

export interface InvestorFundListParams {
  search?: string;
  status?: InvestorFlowStatus[];
  fund_status?: InvestorFundStatus[];
  page?: number;
  page_size?: number;
}

export type InvestorFundListResponse = Omit<InvestorFlowListResponse, "data"> & {
  data: InvestorFundListItem[];
};

/** A row of get_fund_records (one per receipt). */
export interface FundRecordListItem extends InvestorFundRow {
  investor: string;
  investor_id: string;
  investment_amount: number;
  /** Of the investment, after the approved records. */
  remaining_fund: number;
  investment_status: InvestorFlowStatus | null;
  fund_status: InvestorFundStatus;
}

export interface FundRecordListParams {
  search?: string;
  record_status?: FundRecordStatus[];
  page?: number;
  page_size?: number;
}

export type FundRecordListResponse = Omit<InvestorFlowListResponse, "data"> & {
  data: FundRecordListItem[];
};

/** Body of add_fund_record / update_fund_record. */
export interface RecordFundPayload {
  paid_date: string; // YYYY-MM-DD
  mode_of_payment: InvestorFlowPaymentMode;
  reference_number: string;
  amount: number;
}

interface RecordFundAccount {
  account: string;
  description: string;
  currency: string | null;
}

/** get_record_fund_accounts data (from Investor Settings). */
export interface RecordFundAccounts {
  company: string | null;
  /** Paid from: Investor Creditor GL. */
  credit: RecordFundAccount;
  /** Paid to, per Mode of Payment (null when its GL is not set). */
  debit_by_mode: Record<InvestorFlowPaymentMode, RecordFundAccount | null>;
}

/* ---------------------------- Investor 360 view ---------------------------- */

export interface InvestorInfo {
  id: string;
  name: string;
  customer_type: string | null;
  email: string | null;
  mobile: string | null;
  status: "Active" | "Inactive";
}

/** Money figures of one investment (calculated from fund records and the current schedule). */
export interface InvestmentFigures {
  fund_paid_in: number;
  fund_pending_approval: number;
  fund_remaining: number;
  principal_returned: number;
  interest_received: number;
  received_back: number;
  principal_outstanding: number;
  interest_outstanding: number;
  payouts_total: number;
  payouts_done: number;
  next_payout_date: string | null;
  next_payout_amount: number;
}

export interface PortfolioInvestment extends InvestmentFigures {
  name: string;
  investor: string;
  investment_product: string;
  investment_product_name: string;
  status: InvestorFlowStatus;
  fund_status: InvestorFundStatus | null;
  contract_status: InvestorFlowContractStatus | null;
  investment_amount: number;
  interest_rate: number;
  repayment_frequency: RepaymentFrequency;
  first_repayment_date: string;
  maturity_date: string;
  penalty_rate: number | null;
  creation: string;
}

export interface InvestorPortfolio {
  investor: InvestorInfo;
  totals: {
    investments: number;
    active: number;
    contracted: number;
    fund_paid_in: number;
    fund_remaining: number;
    received_back: number;
    principal_returned: number;
    interest_received: number;
    principal_outstanding: number;
    interest_outstanding: number;
    next_payout_date: string | null;
    next_payout_amount: number;
    next_payout_investment: string | null;
  };
  investments: PortfolioInvestment[];
}

export interface InvestmentFundEntry {
  name: string;
  paid_date: string;
  amount: number;
  mode_of_payment: InvestorFlowPaymentMode;
  reference_number: string | null;
  record_status: FundRecordStatus;
  journal_entry: string | null;
  paid_from: string;
  paid_from_description: string;
  paid_to: string;
  paid_to_description: string;
}

export interface InvestmentScheduleEntry {
  name: string;
  number: number;
  payment_date: string;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
  status: InvestorEarningRowStatus;
  /** Day the payout Journal Entry was posted. */
  paid_on: string | null;
  payout_entry: string | null;
  accrual_entry: string | null;
}

export interface InvestmentDetail extends PortfolioInvestment {
  mail_sent: string | null;
  subject: string | null;
  payment_status: PaymentStatus | null;
  /** The latest renewal, shown next to the original terms (null when never renewed). */
  renewal: RenewalFields | null;
  funds: InvestmentFundEntry[];
  schedule: InvestmentScheduleEntry[];
}

export interface InvestorStatementEntry {
  date: string;
  investment: string;
  type: "Fund received" | "Payout";
  description: string;
  paid_in: number;
  principal_returned: number;
  interest_paid: number;
  journal_entry: string | null;
  /** Principal held for the investor after this entry. */
  balance: number;
}

export interface InvestorStatement {
  investor: InvestorInfo;
  investment: string | null;
  entries: InvestorStatementEntry[];
  totals: { paid_in: number; principal_returned: number; interest_paid: number; closing_balance: number };
}

export interface JournalEntryLine {
  account: string;
  account_name: string;
  account_number: string | null;
  root_type: string;
  party: string | null;
  debit: number;
  credit: number;
  /** Plain words: "Money came in", "Amount owed to investor increased", … */
  meaning: string;
}

export interface JournalEntryDetail {
  name: string;
  posting_date: string;
  status: "Draft" | "Submitted" | "Cancelled";
  reference_no: string | null;
  remark: string | null;
  total_debit: number;
  total_credit: number;
  lines: JournalEntryLine[];
}

/* --------------------------------- Renewal --------------------------------- */

/** payment_status of Custom Investor Flow. */
export type PaymentStatus = "Pending" | "Paid" | "Renewed" | "Expired";
/** renewal_status of Custom Investor Flow. */
export type RenewalStatus = "Draft" | "Approved" | "Cancelled";
/** At expiry: after maturity with money due. Mid-contract: while the contract is still running. */
export type RenewalKind = "At expiry" | "Mid-contract";

export const RENEWAL_STRUCTURES = [
  "Capitalization",
  "Principal Rollover",
  "Extended Maturity",
  "Partial Settlement",
] as const;
export type RenewalStructure = (typeof RENEWAL_STRUCTURES)[number];

/** Interest Settlement options (Principal Rollover / Extended Maturity). */
export const INTEREST_SETTLEMENTS = ["Pay on renewal date", "Defer to an agreed future date"] as const;
export type InterestSettlement = (typeof INTEREST_SETTLEMENTS)[number];

/** Fields entered on the Renewal screen (body of save_renewal / preview_renewal_schedule). */
export interface RenewalPayload {
  renewal_structure: RenewalStructure;
  renewal_effective_date: string;
  settlement_amount?: number | null;
  interest_settlement?: InterestSettlement | null;
  interest_settlement_date?: string | null;
  renewal_interest_rate: number;
  payment_frequency: RepaymentFrequency;
  /** Months; the new maturity = effective date + tenure (calculated by the backend). */
  renewal_tenure: number;
  renewal_first_repayment_date: string;
  renewal_penalty_rate?: number | null;
  reason_for_renewal?: string | null;
}

/** All renewal fields of Custom Investor Flow. */
export interface RenewalFields extends RenewalPayload {
  renewed_principal: number;
  new_maturity_date: string;
  renewal_outstanding_principal: number;
  renewal_unpaid_interest: number;
  renewal_journal_entry: string | null;
  renewal_status: RenewalStatus;
  renewal_to: string | null;
  renewal_subject: string | null;
  renewal_message: string | null;
  renewal_contract_status: InvestorFlowContractStatus | null;
}

/** The contract in force (Section 1) and what is still owed on it. */
export interface RenewalContract {
  id: string;
  investor_id: string;
  investor: string;
  investor_email: string | null;
  investment_product: string;
  investment_product_name: string;
  status: InvestorFlowStatus;
  payment_status: PaymentStatus | null;
  /** When it can be renewed: at expiry (Expired) or mid-contract (running); null when it cannot. */
  renewal_kind: RenewalKind | null;
  contract_principal: number;
  contract_maturity: string | null;
  contract_interest_rate: number;
  contract_frequency: RepaymentFrequency;
  contract_penalty_rate: number;
  original_investment_amount: number;
  original_maturity_date: string | null;
  outstanding_principal: number;
  unpaid_interest: number;
  rows_total: number;
  rows_paid: number;
}

export interface RenewalRecord extends RenewalFields {
  id: string;
  contract: RenewalContract;
}

export interface RenewalListItem {
  name: string;
  /** Customer name. */
  investor: string;
  investor_id: string;
  investment_product: string;
  investment_product_name: string;
  renewal_structure: RenewalStructure;
  renewal_effective_date: string;
  renewed_principal: number;
  renewal_interest_rate: number;
  renewal_tenure: number;
  new_maturity_date: string;
  payment_frequency: RepaymentFrequency;
  renewal_status: RenewalStatus;
  renewal_contract_status: InvestorFlowContractStatus | null;
  payment_status: PaymentStatus | null;
  modified: string;
}

export interface RenewalListParams {
  search?: string;
  renewal_status?: RenewalStatus[];
  renewal_structure?: RenewalStructure[];
  page?: number;
  page_size?: number;
}

export interface RenewalListResponse {
  data: RenewalListItem[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}

/** An Expired investment that can get a renewal. */
export interface RenewalCandidate {
  id: string;
  investor_id: string;
  investor: string;
  investment_product_name: string;
  contract_principal: number;
  contract_maturity: string | null;
  outstanding_principal: number;
  unpaid_interest: number;
  payment_status: PaymentStatus | null;
  renewal_kind: RenewalKind;
}

export interface RenewalScheduleRow {
  idx: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  total_payment: number;
  /** Accrued = a deferred interest row (booked before the renewal). */
  status: InvestorEarningRowStatus;
}

export interface RenewalSchedulePreview {
  renewed_principal: number;
  new_maturity_date: string;
  outstanding_principal: number;
  unpaid_interest: number;
  total_interest: number;
  count: number;
  schedule: RenewalScheduleRow[];
}
