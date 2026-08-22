import apiClient from "../../config/axios";
import { API } from "../../config/api";
import  type {  UpdateLoanWriteOffPayload,
    DeleteLoanWriteOffResponse,
    GetWriteOffAccountsResponse,UpdateLoanWriteOffStatusResponse,GetLoanAccountsResponse,CreateLoanWriteOffPayload, CreateLoanWriteOffResponse ,GetLoanWriteOffsResponse, GetLoanWriteOffByIdResponse} from "../../types/loanWriteOff";

export async function getWriteOffAccounts(params: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  const { data } = await apiClient.get<GetWriteOffAccountsResponse>(
    API.loanWriteoff.getWriteOffAccounts,
    { params }
  );
  return data;
}
export async function getLoanAccounts(params: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  const { data } = await apiClient.get<GetLoanAccountsResponse>(
    API.loanWriteoff.getLoanAccounts,
    { params }
  );
  return data;
}

export async function createLoanWriteOff(payload: CreateLoanWriteOffPayload) {
  const { data } = await apiClient.post<CreateLoanWriteOffResponse>(
    API.loanWriteoff.createWriteoff,
    payload
  );
  return data;
}
export async function getLoanWriteOffs(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string[];
}) {
  const cleanParams: Record<string, any> = { ...params };
  if (params.status && params.status.length > 0) {
    cleanParams.status = JSON.stringify(params.status);
  } else {
    delete cleanParams.status;
  }

  const { data } = await apiClient.get<GetLoanWriteOffsResponse>(
    API.loanWriteoff.getAll,
    { params: cleanParams }
  );
  return data;
}
export async function getLoanWriteOffById(id: string) {
  const { data } = await apiClient.get<GetLoanWriteOffByIdResponse>(
    API.loanWriteoff.getWriteOffById,
    { params: { id } } 
  );
  return data.message.data; 
}
export async function updateLoanWriteOff(payload: UpdateLoanWriteOffPayload) {
  const { name, ...body } = payload;
  const { data } = await apiClient.put<CreateLoanWriteOffResponse>(
    API.loanWriteoff.updateWriteoff,
    body,
    { params:  { id: name }  }
  );
  return data;
}
export async function deleteLoanWriteOff(id: string) {
  const { data } = await apiClient.delete<DeleteLoanWriteOffResponse>(
    API.loanWriteoff.deleteWriteoff,
    { params: { id } }
  );
  return data;
}

export async function updateLoanWriteOffStatus(id: string, action: string) {
  // Traceback proves the backend endpoint expects a PUT request (is_valid_http_method).
  // We send the arguments at the top level of the JSON body.
  const { data } = await apiClient.put<UpdateLoanWriteOffStatusResponse>(
    API.loanWriteoff.updateStatus,
    { id, loan_write_off: id, action }
  );
  return data;
}