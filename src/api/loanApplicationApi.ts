import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { LoanApplicationPayload, CreateLoanApplicationResponse } from "../types/loanApplicationForm";

export async function createLoanApplication(payload: LoanApplicationPayload) {
  const { data } = await apiClient.post<CreateLoanApplicationResponse>(API.loanApplication.create, payload);
  return data;
}

export async function getAllLoanApplications() {
  const { data } = await apiClient.get(API.loanApplication.getLoanApplication);
  return data;
}

// export async function convertCustomLoanApplicationToLoan({
//   id,
//   company,
//   loan_product,
// }: {
//   id: string;
//   company: string;
//   loan_product: string;
// }) {
//   const { data } = await apiClient.post(
//     `${API.loanApplication.convertToLoan}?id=${id}`,
//     { company, loan_product }
//   );
//   return data;
// }

export async function convertCustomLoanApplicationToLoan({
  id,
  loan_product,
}: {
  id: string;
  loan_product: string;
}) {
  const { data } = await apiClient.post(
    `${API.loanApplication.convertToLoan}?id=${id}`,
    { loan_product }
  );
  return data;
}

export async function getLoanApplicationById(id: string) {
  const { data } = await apiClient.get(API.loanApplication.getLoanApplicationById, { params: { id } });  
  return data;
}

export async function getAllCountries() {
  const { data } = await apiClient.get(API.loanApplication.getCountries);
  return data;
}

export async function deleteLoanApplication(id: string) {
  const { data } = await apiClient.delete(API.loanApplication.deleteLoanApplication, { params: { id } });  
  return data;
}


export async function updateLoanApplication({id, payload,}: {
  id: string;
  payload: Partial<LoanApplicationPayload>;
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

export async function updateLoanApplicationStatus({
  id,
  status,
  loan_application_status,
}: {
  id: string;
  status: string;
  loan_application_status: string;
}) {
  const { data } = await apiClient.patch(
    API.loanApplication.updateLoanApplication,
    { status, loan_application_status },
    {
      params: { id },
    }
  );

  return data;
}

export async function sendLoanApplicationForReview(payload: {
  application_id: string;
  assign_to_user: string;
  comment: string;
}) {
  const { data } = await apiClient.post(API.loanApplication.sendForReview, payload);
  return data;
}

export async function loanApplicationReviewOutcome(payload: {
  application_id: string;
  action: string;
  assign_to_user: string;
  comment: string;
}) {
  const { data } = await apiClient.post(API.loanApplication.applicationReview, payload);
  return data;
}
