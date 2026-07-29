import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { LoanDisbursementPayload, LoanDisbursementResponse } from "../types/loanDisbursementForm";

export async function createLoanDisbursement(payload: LoanDisbursementPayload) {
  const { data } = await apiClient.post<LoanDisbursementResponse>(API.loanDisbursement.createLoanDsbr, payload);
  return data;
}

export async function getAllLoansDisbursement() {
  const { data } = await apiClient.get(API.loanDisbursement.getLoanDsbr);
  return data;
  
}

export async function getAllLoanApplicationNumber(){
    const filters = [
        ["docstatus", "=", 1],
        ["status", "in", ["Sanctioned", "Active", "Partially Disbursed"]]
    ];

    const { data } = await apiClient.get(API.loanDisbursement.getLoanAppNumber, {
        params: {
            filters: JSON.stringify(filters)
        }
    });
    return data;
}