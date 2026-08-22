import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
export const LoanProductAPI = API.loanProduct;


export type ChargeBasedOn = "Percentage" | "Fixed Amount";

export interface LoanChargePayload {
  charge_type: string;
  charge_based_on: ChargeBasedOn;
  percentage?: number;
  amount?: number;

  income_account?: string;
  receivable_account?: string;
  waiver_account?: string;
  write_off_account?: string;
  suspense_account?: string;
}

export interface LoanProductAccounts {
  loan_account?: string;
  disbursement_account?: string;
  payment_account?: string;
  subsidy_adjustment_account?: string;
  security_deposit_account?: string;
  suspense_collection_account?: string;
  customer_refund_account?: string;
}

export interface LoanProductInterestAccounts {
  income_account?: string;
  receivable_account?: string;
  accrued_account?: string;
  suspense_income_account?: string;
  waiver_account?: string;
  broken_period_interest_recovery_account?: string;
}

export interface LoanProductPenaltyAccounts {
  same_as_regular_interest_accounts?: 0 | 1;
  income_account?: string;
  receivable_account?: string;
  accrued_account?: string;
  suspense_account?: string;
  waiver_account?: string;
}

export interface LoanProductWriteOffAccounts {
  write_off_account?: string;
  write_off_recovery_account?: string;
}

export interface LoanProductRaw {
  name: string;
  product_code: string;
  product_name: string;
  loan_category: string;
  company?: string;

  repayment_schedule_type?: string;
  repayment_date_on?: string;
  cyclic_day_of_the_month?: number;

  maximum_loan_amount: number;
  days_past_due_threshold_for_npa?: number;

  is_term_loan?: 0 | 1;
  validate_normal_repayment?: 0 | 1;
  no_interest_till_month_end?: 0 | 1;

  min_days_bw_disbursement_first_repayment?: number;

  rate_of_interest: number;
  interest_frequency?: string;

  penalty_interest_rate?: number;
  penalty_frequency?: string;
  grace_period_in_days?: number;

  bpi_recovery_method?: string;
  bpi_treatment?: string;

  collection_offset_sequence_for_standard_asset?: string;
  collection_offset_sequence_for_sub_standard_asset?: string;
  collection_offset_sequence_for_written_off_asset?: string;
  collection_offset_sequence_for_settlement_collection?: string;

  excess_amount_acceptance_limit?: number;
  sanctioned_amount_tolerance_percentage?: number;
  write_off_amount?: number;

  disabled: 0 | 1;

  accounts?: LoanProductAccounts;
  interest_accounts?: LoanProductInterestAccounts;
  penalty_accounts?: LoanProductPenaltyAccounts;
  write_off_accounts?: LoanProductWriteOffAccounts;

  loan_charges?: LoanChargePayload[];
  loan_partners?: any[];
}

export interface LoanProductPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LoanProductApiResponse {
  status_code: number;
  status: string;
  message: string;
  data: LoanProductRaw[];
  pagination: LoanProductPagination;
}

export interface LoanProductByIdResponse {
  status_code: number;
  status: string;
  message: string;
  data: LoanProductRaw;
}

export interface CommonApiResponse {
  status_code: number;
  status: string;
  message: string;
}

export interface GetLoanProductsParams {
  search?: string;
  // 0 = active, 1 = disabled. Omit karo to fetch all.
  disabled?: 0 | 1;
  loan_category?: string[];
  page?: number;
  page_size?: number;
}

export const getLoanProducts = async (
  params?: GetLoanProductsParams
): Promise<LoanProductApiResponse> => {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.disabled === 0 || params?.disabled === 1) cleanParams.disabled = params.disabled;
  if (params?.loan_category && params.loan_category.length > 0) {
    cleanParams.loan_category = JSON.stringify(params.loan_category);
  }
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;

  const response: AxiosResponse<LoanProductApiResponse> = await api.get(
    LoanProductAPI.get,
    { params: cleanParams }
  );
  return response.data;
};
/* ===========================================================
   ACCOUNT / LOOKUP TYPES
   For the dropdowns in the Accounting & Collection Sequence
   steps (accounts, loan demand offset orders).
   NOTE: these `utils.search.*` endpoints weren't confirmed
   against a live response, so this assumes the same
   { status_code, status, message, data } envelope your other
   endpoints use. If the backend instead returns Frappe's
   default `{ message: [...] }` shape for these specific
   whitelisted methods, tweak `unwrapList()` below — nothing
   else needs to change.
=========================================================== */

export interface AccountOption {
  name: string; // e.g. "100000001 - DSBR_ACC_RFPL - R" — used directly as the stored value
  account_name?: string;
  root_type?: string;
  is_group?: 0 | 1;
  [key: string]: any;
}

export interface OffsetOrderOption {
  name: string;
  [key: string]: any;
}

interface LookupListResponse<T> {
  status_code?: number;
  status?: string;
  message?: string | T[];
  data?: T[];
}

function unwrapList<T>(payload: LookupListResponse<T>): T[] {
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.message)) return payload.message as T[];
  return [];
}

export interface CreateLoanProductPayload {
  product_code: string;
  product_name: string;
  loan_category?: string;
  company?: string;

  repayment_schedule_type?: string;
  repayment_date_on?: string;
  cyclic_day_of_the_month?: number;

  maximum_loan_amount?: number;
  days_past_due_threshold_for_npa?: number;

  is_term_loan?: 0 | 1;
  validate_normal_repayment?: 0 | 1;
  no_interest_till_month_end?: 0 | 1;
  disabled?: 0 | 1;

  min_days_bw_disbursement_first_repayment?: number;

  rate_of_interest?: number;
  interest_frequency?: string;

  penalty_interest_rate?: number;
  penalty_frequency?: string;
  grace_period_in_days?: number;

  bpi_recovery_method?: string;
  bpi_treatment?: string;

  collection_offset_sequence_for_standard_asset?: string;
  collection_offset_sequence_for_sub_standard_asset?: string;
  collection_offset_sequence_for_written_off_asset?: string;
  collection_offset_sequence_for_settlement_collection?: string;

  excess_amount_acceptance_limit?: number;
  sanctioned_amount_tolerance_percentage?: number;
  write_off_amount?: number;

  accounts?: LoanProductAccounts;
  interest_accounts?: LoanProductInterestAccounts;
  penalty_accounts?: LoanProductPenaltyAccounts;
  write_off_accounts?: LoanProductWriteOffAccounts;

  loan_charges?: LoanChargePayload[];
}

/* ===========================================================
   GET ALL
=========================================================== */

/* ===========================================================
   GET BY ID
=========================================================== */



/* ===========================================================
   CREATE
=========================================================== */

export const createLoanProduct = async (
  payload: CreateLoanProductPayload
): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.post(
    LoanProductAPI.create,
    payload
  );
  return response.data;
};

/* ===========================================================
   UPDATE
=========================================================== */

export const updateLoanProduct = async (
  id: string,
  payload: Partial<CreateLoanProductPayload>
): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.post(
    `${LoanProductAPI.update}?id=${id}`,
    payload
  );
  return response.data;
};

/* ===========================================================
   DELETE
=========================================================== */

export const deleteLoanProduct = async (
  id: string
): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.post(
    `${LoanProductAPI.delete}?id=${id}`
  );
  return response.data;
};

/* ===========================================================
   ENABLE
=========================================================== */

export const enableLoanProduct = async (
  id: string
): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.post(
    `${LoanProductAPI.enable}?id=${id}`
  );
  return response.data;
};

/* ===========================================================
   DISABLE
=========================================================== */

export const disableLoanProduct = async (
  id: string
): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.post(
    `${LoanProductAPI.disable}?id=${id}`
  );
  return response.data;
};

/* ===========================================================
   GET ACCOUNTS
   root_type examples used across this modal:
     - Income accounts:            root_type=Income
     - Principal / balance accts:  root_type=Asset,Liability
     - Write-off / unrestricted:   (no root_type filter)
   is_group is always 0 (leaf accounts only).
=========================================================== */

export const getAccounts = async (params?: {
  root_type?: string; // e.g. "Income" or "Asset,Liability"
  is_group?: 0 | 1;
}): Promise<AccountOption[]> => {
  const response: AxiosResponse<LookupListResponse<AccountOption>> = await api.get(
    API.search.getAccounts,
    { params: { is_group: 0, ...params } }
  );
  return unwrapList(response.data);
};

/* ===========================================================
   GET LOAN DEMAND OFFSET ORDERS
   Used to populate the Collection Sequence selects
   (Standard / Sub Standard / Written Off / Settlement).
=========================================================== */

export const getLoanDemandOffsetOrders = async (): Promise<OffsetOrderOption[]> => {
  const response: AxiosResponse<LookupListResponse<OffsetOrderOption>> = await api.get(
    API.search.getLoanDemandOffsetOrders
  );
  return unwrapList(response.data);
};

/* ===========================================================
   GET ITEMS (same utils.search module — not currently wired
   into the Loan Product modal, add a call site if/when needed)
=========================================================== */

export const getItems = async (): Promise<any[]> => {
  const response: AxiosResponse<LookupListResponse<any>> = await api.get(API.search.getItems);
  return unwrapList(response.data);
};



export const LoanCategoryAPI = API.loanCategory;

export interface LoanCategoryRaw {
  name: string;
  loan_category?: string;
  [key: string]: any;
}

export interface LoanCategoryApiResponse {
  status_code?: number;
  status?: string;
  message?: string | LoanCategoryRaw[] | { data?: LoanCategoryRaw[] };
  data?: LoanCategoryRaw[];
}

export const getAllLoanCategories = async (): Promise<LoanCategoryApiResponse> => {
  const response: AxiosResponse<LoanCategoryApiResponse> = await api.get(LoanCategoryAPI.getAll);
  return response.data;
};