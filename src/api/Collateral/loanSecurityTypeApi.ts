import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateLoanSecurityTypePayload, CreateLoanSecurityTypeResponse } from "../../types/loanSecurityType";

export async function createLoanSecurityType(payload: CreateLoanSecurityTypePayload) {
  const { data } = await apiClient.post<CreateLoanSecurityTypeResponse>(API.loanSecurityType.create, payload);
  return data;
}

export async function getAllLoanSecurityTypes(params?: Record<string, any>) {
  // Accepts optional params for page, page_size, sort_by, etc.
  const { data } = await apiClient.get(API.loanSecurityType.getAll, { params });
  return data;
}

export async function getLoanSecurityTypeById(id: string) {
  const { data } = await apiClient.get(API.loanSecurityType.getById, { params: { id } });  
  return data;
}

export async function deleteLoanSecurityType(id: string) {
  const { data } = await apiClient.delete(API.loanSecurityType.delete, { params: { id } });  
  return data;
}

export async function updateLoanSecurityType({
  id, 
  payload,
}: {
  id: string;
  payload: Partial<CreateLoanSecurityTypePayload>;
}) {
  const { data } = await apiClient.put(
    API.loanSecurityType.update,
    payload,
    {
      params: { id },
    }
  );
  return data;
}

export async function enableLoanSecurityType(id: string) {
  const { data } = await apiClient.put(API.loanSecurityType.enable, {}, { params: { id } });
  return data;
}

export async function disableLoanSecurityType(id: string) {
  const { data } = await apiClient.put(API.loanSecurityType.disable, {}, { params: { id } });
  return data;
}