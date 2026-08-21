import apiClient from "../config/axios";
import { API } from "../config/api";

export interface LoanCategoryPayload {
  loan_category_code: string;
  loan_category_name: string;
}

export interface LoanCategoryUpdatePayload {
  name: string;
  loan_category_name: string;
}

export interface EnableDisableLoanCategoryPayload {
  name: string;
  disabled: 0 | 1;
}

export async function getAllLoanCategories(params?: {
  disabled?: string[];
  search?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
}) {
  const cleanParams: Record<string, string | number> = {};

  if (params?.search) cleanParams.search = params.search;

  if (params?.disabled && params.disabled.length === 1) {
    cleanParams.disabled = Number(params.disabled[0]);
  }

  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;
  if (params?.order_by) cleanParams.order_by = params.order_by;

  const { data } = await apiClient.get(API.loanCategory.getAll, {
    params: cleanParams,
  });
  return data;
}
export async function createLoanCategory(payload: LoanCategoryPayload) {
  const { data } = await apiClient.post(API.loanCategory.create, payload);
  return data;
}

export async function updateLoanCategory(payload: LoanCategoryUpdatePayload) {
  const { data } = await apiClient.put(API.loanCategory.update, payload);
  return data;
}

export async function enableDisableLoanCategory(
  payload: EnableDisableLoanCategoryPayload
) {
  const { data } = await apiClient.patch(API.loanCategory.enableDisable, payload);
  return data;
}

export async function deleteLoanCategory(name: string) {
  const { data } = await apiClient.post(API.loanCategory.delete, {
    doctype: "Loan Category",
    name,
  });
  return data;
}