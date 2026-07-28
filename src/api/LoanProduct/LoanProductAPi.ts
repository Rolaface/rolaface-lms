import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
export const LoanProductAPI = API.loanProduct;

export interface LoanProductRaw {
  name: string;
  product_code: string;
  product_name: string;
  loan_category: string;
  rate_of_interest: number;
  maximum_loan_amount: number;
  disabled: 0 | 1;
  company: string;
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

export async function getLoanProducts(): Promise<LoanProductApiResponse> {
  const resp: AxiosResponse<LoanProductApiResponse> = await api.get(
    LoanProductAPI.get
  );
  return resp.data;
}