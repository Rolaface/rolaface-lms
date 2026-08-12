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
  disabled?: 0 | 1;
  search?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
}) {
  const { data } = await apiClient.get(API.loanCategory.getAll, { params });
  return data;
}

export async function getLoanCategoryById(name: string) {
  const { data } = await apiClient.get(API.loanCategory.getById, {
    params: { name },
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