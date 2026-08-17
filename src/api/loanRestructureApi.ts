import type { AxiosResponse } from "axios";
import apiClient from "../config/axios";
import API from "../config/api";


interface FrappeEnvelope<T> {
  status_code: number;
  status: string;
  message: string;
  data: T;
}

function unwrap<T>(envelope: FrappeEnvelope<T> | undefined, fallbackMsg: string): T {
  if (!envelope) throw new Error(fallbackMsg);
  if (envelope.status === "error" || envelope.status_code >= 400) {
    throw new Error(envelope.message || fallbackMsg);
  }
  return envelope.data;
}


export const RESTRUCTURE_STATUSES = ["Initiated", "Approved", "Draft", "Cancelled"] as const;
export type LoanRestructureStatus = (typeof RESTRUCTURE_STATUSES)[number];

export interface LoanRestructureCharge {
  name?: string;
  doctype: "Loan Restructure Charges";
  charge: string;
  is_post_restructure_charge: 0 | 1;
  restructure_charge_amount: number;
  charges_overdue?: number;
  balance_charges?: number;
  capitalize_amount?: number;
  charges_waiver_amount?: number;
  treatment_of_other_charges?: string;
}


export interface LoanRestructurePayload {
  applicant_type: string;
  applicant: string;
  restructure_type: "Normal Restructure";
  loan: string;
  restructure_date: string; 
  reason_for_restructure: string;
  new_rate_of_interest?: number;
  new_repayment_period_in_months?: number;
  loan_restructure_charges: LoanRestructureCharge[];
}

export interface LoanRestructureUpdatePayload extends LoanRestructurePayload {
  name: string;
}

export interface LoanRestructureRecord {
  name: string;
  applicant_type: string;
  applicant: string;
  restructure_type: string;
  loan: string;
  restructure_date: string;
  reason_for_restructure: string | null;
  new_repayment_period_in_months?: number;
  new_rate_of_interest?: number;
  loan_restructure_charges: LoanRestructureCharge[];
  old_rate_of_interest?: number;
  old_loan_amount?: number;
  old_tenure?: number;
  status?: string;
  new_maturity_date?: string;
  old_maturity_date?: string;
}

export interface LoanRestructureListItem {
  name: string;
  restructure_type: string;
  reason_for_restructure: string | null;
  restructure_date: string;
  status: string;
}

export interface LoanRestructurePagination {
  page: string;
  page_size: string;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GetAllParams {
  page?: number;
  page_size?: number;
  order_by?: string;
  search?: string;
  status?: LoanRestructureStatus | "all";
}

export interface LoanRepaymentAccount {
  against_loan: string;
  applicant: string;
  applicant_type: string;
  applicant_name: string | null;
  emi: number;
  phone_number: string;
  loan_product?: string;
  maturity_date?: string;
  repayment_frequency?: "Monthly" | "Daily" | "Weekly" | "Bi-Weekly" | "Quarterly" | "One Time" | string;
  rate_of_interest?: number;
  penalty_rate?: number;
  principal_outstanding?: number;
  npa_status?: string;
  dpd?: number;
}

export async function createLoanRestructure(payload: LoanRestructurePayload): Promise<void> {
  const resp: AxiosResponse<{ message: FrappeEnvelope<null> }> = await apiClient.post(
    API.loanRestructure.create,
    payload
  );
  unwrap(resp.data?.message, "Failed to create restructure request.");
}

export async function updateLoanRestructure(payload: LoanRestructureUpdatePayload): Promise<void> {
  const resp: AxiosResponse<{ message: FrappeEnvelope<null> }> = await apiClient.put(
    API.loanRestructure.update,
    payload
  );
  unwrap(resp.data?.message, "Failed to update restructure request.");
}

export async function deleteLoanRestructure(name: string): Promise<void> {
  const resp: AxiosResponse<{ message: FrappeEnvelope<null> }> = await apiClient.delete(
    API.loanRestructure.delete,
    { params: { name } }
  );
  unwrap(resp.data?.message, "Failed to delete restructure request.");
}

export async function getLoanRestructure(name: string): Promise<LoanRestructureRecord> {
  const resp: AxiosResponse<{ message: FrappeEnvelope<LoanRestructureRecord> }> = await apiClient.get(
    API.loanRestructure.getById,
    { params: { name } }
  );
  return unwrap(resp.data?.message, "Failed to fetch restructure request.");
}

export async function getAllLoanRestructures(
  params: GetAllParams
): Promise<{ restructures: LoanRestructureListItem[]; pagination: LoanRestructurePagination }> {
  const resp: AxiosResponse<{
    message: FrappeEnvelope<{
      restructures: LoanRestructureListItem[];
      pagination: LoanRestructurePagination;
    }>;
  }> = await apiClient.get(API.loanRestructure.getAll, {
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      order_by: params.order_by ?? "creation desc",
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    },
  });
  return unwrap(resp.data?.message, "Failed to fetch restructure requests.");
}

export async function searchLoanRepaymentAccounts(
  searchTerm: string
): Promise<LoanRepaymentAccount[]> {
  if (!searchTerm.trim()) return [];
  const resp: AxiosResponse<{ message: FrappeEnvelope<LoanRepaymentAccount[]> }> = await apiClient.get(
    API.loanRestructure.search,
    { params: { search_term: searchTerm } }
  );
  return unwrap(resp.data?.message, "Failed to search loan accounts.") ?? [];
}



export interface LoanChargeLine {
  charge?: string;
  charge_type?: string;
  amount?: number;
  charge_amount?: number;
  restructure_charge_amount?: number;
  [key: string]: unknown;
}

export interface LoanDetailsResponse {
  name: string;
  rate_of_interest: number;
  penalty_charges_rate: number;
  loan_amount?: number;
  status?: string;
  loan_charges: LoanChargeLine[];
  [key: string]: unknown;
}

export async function getLoanDetails(loanName: string): Promise<LoanDetailsResponse> {
  const resp: AxiosResponse<{ message: FrappeEnvelope<LoanDetailsResponse> }> = await apiClient.get(
    API.loanRestructure.loanGetById,
    { params: { id: loanName } }
  );
  return unwrap(resp.data?.message, "Failed to fetch loan details.");
}


export function sumLoanCharges(charges: LoanChargeLine[] | null | undefined): number {
  if (!Array.isArray(charges) || charges.length === 0) return 0;
  return charges.reduce((sum, c) => {
    const value = c.amount ?? c.charge_amount ?? c.restructure_charge_amount ?? 0;
    return sum + (Number(value) || 0);
  }, 0);
}

export interface LoanChargeOption {
  value: string;
  label: string;
  description?: string;
}

export interface LoanChargeOptionsPagination {
  page: number;
  page_size: number;
  items_in_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface GetChargesEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: LoanChargeOption[];
  pagination: LoanChargeOptionsPagination;
}

export interface GetChargesParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export async function getCharges(
  params: GetChargesParams = {}
): Promise<{ data: LoanChargeOption[]; pagination: LoanChargeOptionsPagination }> {
  const resp: AxiosResponse<GetChargesEnvelope> = await apiClient.get(API.loanRestructure.getCharges, {
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 4,
      ...(params.search ? { search: params.search } : {}),
    },
  });

  const body = resp.data;
  if (!body) throw new Error("Failed to fetch charge types.");
  if (body.status === "fail" || body.status === "error" || (body.status_code ?? 200) >= 400) {
    throw new Error(body.message || "Failed to fetch charge types.");
  }
  return { data: body.data ?? [], pagination: body.pagination };
}

export interface BulkUpdateStatusPayload {
  doctype: string;
  action: "submit" | "cancel" | "update";
  docnames: string[];
}

export async function approveLoanRestructure(name: string): Promise<void> {
  const payload: BulkUpdateStatusPayload = {
    doctype: "Loan Restructure",
    action: "submit",
    docnames: [name],
  };
  await apiClient.put(API.loanRestructure.updateStatus, payload);
}