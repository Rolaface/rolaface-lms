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
}) {
  const { data } = await apiClient.get<GetLoanWriteOffsResponse>(
    API.loanWriteoff.getAll,
    { params }
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

export async function updateLoanWriteOffStatus(id: string, action: 'approved' | 'submitted') {
  const { data } = await apiClient.put<UpdateLoanWriteOffStatusResponse>(
    API.loanWriteoff.updateStatus,
    {},
    { params: { id, action } }
  );
  return data;
}