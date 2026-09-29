import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateLoanTypePayload, CreateLoantypeResponse } from "../../types/OriginationSetup/loanTypeForm";


export async function createLoan(payload: CreateLoanTypePayload) {
  const { data } = await apiClient.post<CreateLoantypeResponse>(API.loanTypeSetup.createLoanType, payload);
  return data;
}

export async function getAllLoanTypes(){
  const {data} = await apiClient.get(API.loanTypeSetup.getLoanType);
  return data;
}