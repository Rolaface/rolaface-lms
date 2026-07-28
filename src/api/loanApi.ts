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