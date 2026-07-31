import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { LoanRepaymentPayload, LoanRepaymentResponse, LoanRepaymentAccountSearchResponse, LoanDuesPayload, LoanDuesResponse} from "../types/loanRepaymentForm";


export async function createLoanRepayment(payload: LoanRepaymentPayload) {
  const { data } = await apiClient.post<LoanRepaymentResponse>(API.loanRepayment.createLoanRepay, payload);
  return data;
}

export async function getLoanRepaymentAccount(searchTerm: string) {
  const { data } = await apiClient.get<LoanRepaymentAccountSearchResponse>(
    API.loanRepayment.getLoanReapyAcc,
    { params: { search_term: searchTerm } }
  );
  return data;
}

export async function getLoanDues(payload: LoanDuesPayload) {
  const { data } = await apiClient.post<LoanDuesResponse>(
    API.loanRepayment.getLoanDues,
    payload
  );
  return data;
}