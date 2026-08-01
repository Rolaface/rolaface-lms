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

export async function getLoanRepaymentById(id: string) {
  const { data } = await apiClient.get(API.loanRepayment.getLoanRepayById, { params: { id } });  
  return data;
}

export async function deleteLoanRepayment(id: string) {
  const { data } = await apiClient.delete(API.loanRepayment.deleteLoanRepay, { params: { id } });  
  return data;
}

export async function changeLoanRepaymentStatus(id: string, action: string) {
  const { data } = await apiClient.put(API.loanRepayment.updateStatus, {}, { params: { id, action } });
  return data;
}

export async function getAllLoanRepayment() {
  const { data } = await apiClient.get(API.loanRepayment.getAllLoanRepay);
  return data;
  
}

// export async function updateLoanRepayment({id, payload,}: {
//   id: string;
//   payload: Partial<LoanRepaymentPayload>;
// }) {
//   const { data } = await apiClient.put(
//     API.loanRepayment.updateLoanRepay,
//     payload,
//     {
//       params: { id },
//     }
//   );

//   return data;
// }
export async function updateLoanRepayment({ id, payload }: { id: string; payload: Partial<LoanRepaymentPayload> }) {
  const { data } = await apiClient.put(API.loanRepayment.updateLoanRepay, { ...payload, id });
  return data;
}