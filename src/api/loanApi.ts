import apiClient from "../config/axios"; 
import { API } from "../config/api";
import type { CreateLoanPayload, CreateLoanResponse, LoanDocumentPayload } from "../types/loanForm";

export async function createLoan(payload: CreateLoanPayload) {
  const { data } = await apiClient.post<CreateLoanResponse>(API.loan.create, payload);
  return data;
}

export async function uploadFile(file: File, isPrivate: 0 | 1 = 1, customFileName?: string) {
  const formData = new FormData();
  // formData.append("file", file);
  // formData.append("is_private", String(isPrivate));
formData.append("file", file, customFileName || file.name);
  formData.append("is_private", String(isPrivate));

  const { data } = await apiClient.post(API.loan.uploadFile, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    file_name: data.message.file_name as string,
    file_url: data.message.file_url as string,
  };
}

export async function attachLoanDocuments({
  id,
  documents,
}: {
  id: string;
  documents: LoanDocumentPayload[];
}) {
  const { data } = await apiClient.post<CreateLoanResponse>(
    `${API.loan.loanDocument}?id=${id}`,
    { documents }
  );
  return data;
}


export async function getAllApplicationDsbr() {
   const { data } = await apiClient.get(API.loan.getLoans);

   const allowedStatuses = ["Sanctioned", "Active", "Partially Disbursed", "Disbursed"];

   if (data && Array.isArray(data.data)) {
    data.data = data.data.filter((loan: any) =>
      allowedStatuses.includes(loan.status)
    );
    
     if (data.pagination) {
      data.pagination.total = data.data.length;
    }
  }

  return data;
}

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

export async function getReapymentScheduleById(id: string) {
  const { data } = await apiClient.get(API.loan.getLoanScheduleById, { params: { id } });
  return data;
}

export interface GetLoansParams {
  search?: string;
  status?: string[];
  loan_product?: string[];
  page?: number;
  page_size?: number;
}

export async function getAllLoans(params: GetLoansParams = {}) {
  const queryParams: Record<string, string | number> = {};

  if (params.search) queryParams.search = params.search;
  if (params.status && params.status.length > 0) {
    queryParams.status = JSON.stringify(params.status);
  }
  if (params.loan_product && params.loan_product.length > 0) {
    queryParams.loan_product = JSON.stringify(params.loan_product);
  }
  if (params.page) queryParams.page = params.page;
  if (params.page_size) queryParams.page_size = params.page_size;

  const { data } = await apiClient.get(API.loan.getLoans, { params: queryParams });
  return data;
}