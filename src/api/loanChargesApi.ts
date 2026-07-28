import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  CreateFeeAndChargePayload,
  CreateFeeAndChargeResponse,
} from "../types/loanCharges.ts";

export async function createFeeAndCharge(payload: CreateFeeAndChargePayload) {
  const { data } = await apiClient.post<CreateFeeAndChargeResponse>(
    API.loanCharges.createCharges,
    payload,
  );
  return data;
}