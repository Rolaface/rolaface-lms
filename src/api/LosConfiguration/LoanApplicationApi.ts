import api from "../../config/axios";
import { API } from "../../config/api";
import type { AxiosResponse } from "axios";

export const LoanApplicationEndpoints = API.losLoanApplication;
export const LOAN_APPLICATION_DOCTYPE = "Custom LOS Loan Application";

export type ApplicantType = "Individual" | "Business";

export interface ApplicationAddress {
  name?: string;
  address_type: "Current" | "Permanent" | "Office";
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  pincode?: string | null;
}

export interface FinancialItem {
  source: string;
  monthly_amount: number;
}

export interface ApplicationFinancials {
  income: FinancialItem[];
  obligations: FinancialItem[];
  expenses: FinancialItem[];
}

export interface ApplicationDirector {
  row_id?: string;
  full_name: string;
  nrc: string;
  phone: string;
  email: string;
}

export interface ApplicationCollateral {
  row_id?: string;
  collateral_type: string;
  estimated_value: number;
  ownership_date?: string | null;
  description?: string | null;
  valuation_amount?: number | null;
  forced_sale_value?: number | null;
  valuation_status?: string | null;
  legal_status?: string | null;
  valuation_details?: Record<string, any> | null;
}

export interface StagePayload {
  custom_status?: string | null;
  monthly_income?: number | null;
  monthly_obligations?: number | null;
  eligible_amount?: number | null;
  prescreening_data?: Record<string, any> | null;
  approved_amount?: number | null;
  approved_tenure_months?: number | null;
  approved_frequency?: string | null;
  interest_rate?: number | null;
  appraisal_data?: Record<string, any> | null;
  final_amount?: number | null;
  underwriting_decision?: string | null;
  underwriting_data?: Record<string, any> | null;
  signing_method?: string | null;
  contract_status?: string | null;
  first_payment_date?: string | null;
  offer_data?: Record<string, any> | null;
  collaterals?: ApplicationCollateral[];
}

export interface ApplicationDocument {
  row_id?: string;
  document_name: string;
  file: string;
}

export interface LoanApplicationPayload {
  application_date?: string;
  channel: string;
  customer_type: "New" | "Existing";
  customer?: string | null;
  applicant_type: ApplicantType;
  loan_type: string;
  loan_sub_type: string;
  loan_purpose: string;
  requested_amount: number;
  tenure_months: number;
  repayment_frequency: "Monthly" | "Bi-weekly";
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  nrc: string;
  phone: string;
  email: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  nationality: string;
  credit_score?: number | null;
  position?: string | null;
  company_name?: string | null;
  registration_number?: string | null;
  tpin?: string | null;
  business_type?: string | null;
  established_date?: string | null;
  nature_of_business?: string | null;
  kin_name?: string | null;
  kin_phone?: string | null;
  kin_email?: string | null;
  kin_relationship?: string | null;
  employment_status?: string | null;
  employment_type?: string | null;
  employer_name?: string | null;
  designation?: string | null;
  experience_years?: number | null;
  financials?: ApplicationFinancials | null;
  directors?: ApplicationDirector[];
  collaterals?: ApplicationCollateral[];
  documents?: ApplicationDocument[];
  addresses: ApplicationAddress[];
}

export interface LoanApplication extends LoanApplicationPayload, Omit<StagePayload, "collaterals"> {
  name: string;
  company: string;
  status: string;
  stage: string;
  workflow_state?: string | null;
  loan_product?: string | null;
  product_name?: string | null;
  applicant_name?: string;
  customer_name?: string | null;
  loan_type_name?: string | null;
  loan_sub_type_name?: string | null;
  loan_purpose_name?: string | null;
  owner?: string;
  creation?: string;
  modified?: string;
}

export interface LoanApplicationListRow {
  name: string;
  application_date: string;
  status: string;
  stage: string;
  workflow_state?: string | null;
  custom_status?: string | null;
  applicant_type: ApplicantType;
  applicant_name: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  nrc?: string | null;
  phone?: string | null;
  customer?: string | null;
  customer_name?: string | null;
  channel?: string | null;
  loan_type?: string | null;
  loan_type_name?: string | null;
  loan_product?: string | null;
  product_name?: string | null;
  requested_amount: number;
  tenure_months: number;
  repayment_frequency?: string;
  creation?: string;
  modified?: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface GetLoanApplicationsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  stage?: string;
  workflow_state?: string;
  applicant_type?: ApplicantType;
  channel?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface TreeNode {
  name: string;
  node_name: string;
  applicant_type: ApplicantType;
  is_active?: number;
}

export const create = async (payload: LoanApplicationPayload): Promise<LoanApplication> => {
  const response: AxiosResponse<any> = await api.post(LoanApplicationEndpoints.create, payload);
  return response.data?.message?.data;
};

export const update = async (
  id: string,
  payload: Partial<LoanApplicationPayload> | StagePayload,
): Promise<LoanApplication> => {
  const response: AxiosResponse<any> = await api.put(LoanApplicationEndpoints.update, payload, {
    params: { id },
  });
  return response.data?.message?.data;
};

export const getById = async (id: string): Promise<LoanApplication> => {
  const response: AxiosResponse<any> = await api.get(LoanApplicationEndpoints.getById, { params: { id } });
  return response.data?.message?.data;
};

export const getAll = async (
  params?: GetLoanApplicationsParams,
): Promise<{ data: LoanApplicationListRow[]; pagination: Pagination }> => {
  const response: AxiosResponse<any> = await api.get(LoanApplicationEndpoints.getAll, { params });
  return { data: response.data?.data ?? [], pagination: response.data?.pagination };
};

export const remove = async (id: string): Promise<any> => {
  const response: AxiosResponse<any> = await api.delete(LoanApplicationEndpoints.delete, { params: { id } });
  return response.data;
};

export const getLoanTypes = async (applicant_type: ApplicantType): Promise<TreeNode[]> => {
  const response: AxiosResponse<any> = await api.get(LoanApplicationEndpoints.getLoanTypes, {
    params: { applicant_type },
  });
  return response.data?.data ?? [];
};

export const getSubTypes = async (loan_type: string): Promise<TreeNode[]> => {
  const response: AxiosResponse<any> = await api.get(LoanApplicationEndpoints.getSubTypes, {
    params: { loan_type },
  });
  return response.data?.data ?? [];
};

export const getPurposes = async (sub_type: string): Promise<TreeNode[]> => {
  const response: AxiosResponse<any> = await api.get(LoanApplicationEndpoints.getPurposes, {
    params: { sub_type },
  });
  return response.data?.data ?? [];
};
