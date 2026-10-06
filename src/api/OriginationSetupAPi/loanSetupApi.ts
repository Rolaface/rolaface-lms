import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateLoanTypePayload, CreateLoantypeResponse } from "../../types/OriginationSetup/loanTypeForm";


export async function createLoanTypes(payload: CreateLoanTypePayload) {
  const { data } = await apiClient.put<CreateLoantypeResponse>(API.loanTypeSetup.createLoanType, payload);
  return data;
}

export async function getAllLoanTypes(include_inactive?: number) {
  const { data } = await apiClient.get(API.loanTypeSetup.getLoanType, {
    params: include_inactive !== undefined ? { include_inactive } : undefined,
  });
  return data;
}

export async function deleteLoanType(id: string){
  const {data} = await apiClient.delete(API.loanTypeSetup.deleteLoanType,{params:{id}});
  return data;
}

export async function disableLoanType(id: string){
  const {data} = await apiClient.put(API.loanTypeSetup.disableLoantType, {},{params: {id}});
  return data;
}

export async function enableLoanType(id: string){
  const {data} = await apiClient.put(API.loanTypeSetup.enableLoantType, {},{params: {id}});
  return data;
}

export async function updateLoanTypes({ id, name }: { id: string; name: string }) {
  const { data } = await apiClient.put(
    API.loanTypeSetup.updateLoanType,
    { node_name: name },
    { params: { id } }
  );
  return data;
}