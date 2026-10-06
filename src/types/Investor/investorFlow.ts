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
  investor: string;
  investment_product: string;
  investment_amount: number;
  repayment_frequency: RepaymentFrequency;
  maturity_date: string;
  interest_rate: number;
  first_repayment_date: string;
  penalty_rate: number | null;
  status: InvestorFlowStatus;
}

/** get_investor_flow_by_id data. */
export interface InvestorFlowRecord extends InvestorFlowListItem {
  creation: string;
  modified: string;
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
