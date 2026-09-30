import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateLoanTypePayload, CreateLoantypeResponse } from "../../types/OriginationSetup/loanTypeForm";


export async function createLoanTypes(payload: CreateLoanTypePayload) {
  const { data } = await apiClient.post<CreateLoantypeResponse>(API.loanTypeSetup.createLoanType, payload);
  return data;
}

export async function getAllLoanTypes(){
  const {data} = await apiClient.get(API.loanTypeSetup.getLoanType);
  return data;
}

export async function deleteLoanType(id: string){
  const {data} = await apiClient.delete(API.loanTypeSetup.deleteLoanType,{params:{id}});
  return data;
}

export async function disableLoanType(id: string){
  const {data} = await apiClient.patch(API.loanTypeSetup.disableLoantType,{params: {id}});
  return data;
}

export async function enableLoanType(id: string){
  const {data} = await apiClient.patch(API.loanTypeSetup.enableLoantType,{params: {id}});
  return data;
}