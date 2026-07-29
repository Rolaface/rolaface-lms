import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  CreateFeeAndChargePayload,
  CreateFeeAndChargeResponse,
  GetFeeAndChargesResponse,
} from "../types/loanCharges.ts";

export async function createFeeAndCharge(payload: CreateFeeAndChargePayload) {
  const { data } = await apiClient.post<CreateFeeAndChargeResponse>(
    API.loanCharges.createCharges,
    payload,
  );
  return data;
}


export async function getFeeAndCharges(params: {
 page?: number;
 page_size?: number;
 search?: string;
}) {
 const { data } = await apiClient.get<GetFeeAndChargesResponse>(API.loanCharges.getAll, {
   params,
 });
   return data;
 }