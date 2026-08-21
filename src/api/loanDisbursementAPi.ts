import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { LoanDisbursementPayload, LoanDisbursementResponse } from "../types/loanDisbursementForm";

export async function createLoanDisbursement(payload: LoanDisbursementPayload) {
  const { data } = await apiClient.post<LoanDisbursementResponse>(API.loanDisbursement.createLoanDsbr, payload);
  return data;
}

export async function getAllLoansDisbursement(
{
   search,
    applicant_type,
    status,
    page,
    page_size,
  }: {
    search?: string;
    applicant_type?: string | null;
    status?: string[];
    page?: number;
    page_size?: number;
  } = {}
) {
  const params: Record<string, string> = {};
  if (search) params.search = search;
   if (applicant_type) {
   params.applicant_type = applicant_type;
  }
   if (status && status.length > 0) {
    params.status = JSON.stringify(status);
  }
  if (page) params.page = String(page);
  if (page_size) params.page_size = String(page_size);
  const { data } = await apiClient.get(API.loanDisbursement.getLoanDsbr, {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

export async function getAllDsbrAccount(searchTerm?: string) {
  const { data } = await apiClient.get(API.search.getAccounts, {
    params: {
      txt: searchTerm
    }
  });
  return data;
}

export async function updateLoanDisbursement({id, payload,}: {
  id: string;
  payload: Partial<LoanDisbursementPayload>;
}) {
  const { data } = await apiClient.put(
    API.loanDisbursement.updateLoanDsbr,
    payload,
    {
      params: { id },
    }
  );
  return data;
}

export async function getLoanDisbursementById(id: string) {
  const { data } = await apiClient.get(API.loanDisbursement.getLoanDsbrById, { params: { id } });  
  return data;
}

export async function deleteLoanDisbursement(id: string) {
  const { data } = await apiClient.delete(API.loanDisbursement.deleteLoanDsbr, { params: { id } });  
  return data;
}
export async function changeLoanDsbrStatus(id: string, action: string) {
  const { data } = await apiClient.put(API.loanDisbursement.updateDsbrStatus, {}, { params: { id, action } });
  return data;
}

export async function getAllModeOfPayments() {
  const { data } = await apiClient.get(API.loanDisbursement.modeOfPayment, {
    params: {
      fields: JSON.stringify(["name", "accounts.default_account"]),
    },
  });
  return data;
}