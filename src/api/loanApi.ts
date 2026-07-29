import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { CreateLoanPayload, CreateLoanResponse } from "../types/loanForm";

export async function createLoan(payload: CreateLoanPayload) {
  const { data } = await apiClient.post<CreateLoanResponse>(API.loan.create, payload);
  return data;
}

export async function getAllLoans() {
  const { data } = await apiClient.get(API.loan.getLoans);
  return data;
  
}

// api/loanApi.ts
export async function getLoanById(id: string) {
  const { data } = await apiClient.get(API.loan.getLoanById, { params: { id } });  
  return data;
}

export async function deleteLoan(id: string) {
  const { data } = await apiClient.delete(API.loan.deleteLoan, { params: { id } });  
  return data;
}

export async function changeLoanStatus(id: string, action: string) {
  const { data } = await apiClient.put(API.loan.statusLoan, {}, { params: { id, action } });
  return data;
}


export async function updateLoan({id, payload,}: {
  id: string;
  payload: Partial<CreateLoanPayload>;
}) {
  const { data } = await apiClient.put(
    API.loan.updateLoan,
    payload,
    {
      params: { id },
    }
  );

  return data;
}