import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateLoanSecurityPayload, CreateLoanSecurityResponse } from "../../types/loanSecurity";

export async function createLoanSecurity(payload: CreateLoanSecurityPayload) {
  const { data } = await apiClient.post<CreateLoanSecurityResponse>(API.loanSecurity.create, payload);
  return data;
}

export async function getAllLoanSecurities(params?: Record<string, any>) {
  // Accepts optional params for page, page_size, sort_by, etc.
  const { data } = await apiClient.get(API.loanSecurity.getAll, { params });
  return data;
}

export async function getLoanSecurityById(id: string) {
  const { data } = await apiClient.get(API.loanSecurity.getById, { params: { id } });  
  return data;
}

export async function deleteLoanSecurity(id: string) {
  const { data } = await apiClient.delete(API.loanSecurity.delete, { params: { id } });  
  return data;
}

export async function updateLoanSecurity({
  id, 
  payload,
}: {
  id: string;
  payload: Partial<CreateLoanSecurityPayload>;
}) {
  const { data } = await apiClient.put(
    API.loanSecurity.update,
    payload,
    {
      params: { id },
    }
  );
  return data;
}

export async function enableLoanSecurity(id: string) {
  const { data } = await apiClient.put(API.loanSecurity.enable, {}, { params: { id } });
  return data;
}

export async function disableLoanSecurity(id: string) {
  const { data } = await apiClient.put(API.loanSecurity.disable, {}, { params: { id } });
  return data;
}