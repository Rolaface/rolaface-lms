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
  const { data } = await apiClient.post(API.loanRepayment.updateStatus, { id, action });
  return data;
}

export interface GetAllLoanRepaymentParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string[];
  loan_product?: string[];
  repayment_type?: string[];
}

export async function getAllLoanRepayment(params: GetAllLoanRepaymentParams = {}) {
  const { data } = await apiClient.get(API.loanRepayment.getAllLoanRepay, {
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status.length > 0 ? { status: JSON.stringify(params.status) } : {}),
      ...(params.loan_product && params.loan_product.length > 0 ? { loan_product: JSON.stringify(params.loan_product) } : {}),
      ...(params.repayment_type && params.repayment_type.length > 0 ? { repayment_type: JSON.stringify(params.repayment_type) } : {}),
    },
  });
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