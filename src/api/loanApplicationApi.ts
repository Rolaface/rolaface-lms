import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { CreateLoanApplicationPayload, CreateLoanApplicationResponse } from "../types/loanApplicationForm";

export async function createLoanApplication(payload: CreateLoanApplicationPayload) {
  const { data } = await apiClient.post<CreateLoanApplicationResponse>(API.loanApplication.create, payload);
  return data;
}

export async function getAllLoanApplications() {
  const { data } = await apiClient.get(API.loanApplication.getLoanApplication);
  return data;
  
}

export async function getLoanApplicationById(id: string) {
  const { data } = await apiClient.get(API.loanApplication.getLoanApplicationById, { params: { id } });  
  return data;
}

export async function deleteLoanApplication(id: string) {
  const { data } = await apiClient.delete(API.loanApplication.deleteLoanApplication, { params: { id } });  
  return data;
}

export async function changeLoanApplicationStatus(id: string, action: string) {
  const { data } = await apiClient.put(API.loanApplication.statusLoanApplication, {}, { params: { id, action } });
  return data;
}


export async function updateLoanApplication({id, payload,}: {
  id: string;
  payload: Partial<CreateLoanApplicationPayload>;
}) {
  const { data } = await apiClient.put(
    API.loanApplication.updateLoanApplication,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export async function getAllCountries() {
  const { data } = await apiClient.get(API.loanApplication.getCountries);
  return data;
}