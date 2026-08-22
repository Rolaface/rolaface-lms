import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  CreateFeeAndChargePayload,
  CreateFeeAndChargeResponse,
  FeeAndChargeItem,
} from "../types/loanCharges.ts";

export async function createFeeAndCharge(payload: CreateFeeAndChargePayload) {
  const { data } = await apiClient.post<CreateFeeAndChargeResponse>(
    API.loanCharges.createCharges,
    payload,
  );
  return data;
}

export interface GetFeeAndChargesParams {
  page?: number;
  page_size?: number;
  search?: string;
  disabled?: 0 | 1;
}
export interface GetFeeAndChargesResponse {
  data: FeeAndChargeItem[];
  pagination?: {
    total: number;
    total_pages: number;
  };
}

export async function getFeeAndCharges(params?: GetFeeAndChargesParams) {
  const { data } = await apiClient.get<GetFeeAndChargesResponse>(API.loanCharges.getAll, {
    params,
  });
  return data;
}

export async function updateFeeAndCharge(payload: CreateFeeAndChargePayload & { id: string }) {
  const { id, ...body } = payload;
  const { data } = await apiClient.put<CreateFeeAndChargeResponse>(
    API.loanCharges.updateCharge,
    body,
    { params: { id } },
  );
  return data;
}

export async function deleteFeeAndCharge(id: string) {
  const { data } = await apiClient.delete<CreateFeeAndChargeResponse>(API.loanCharges.deleteCharge, {
     params: { id },
  });
  return data;
}
export async function getFeeAndChargeById(id: string) {
  const { data } = await apiClient.get<{ data: FeeAndChargeItem }>(API.loanCharges.getById, {
    params: { id },
  });
  return data;
}