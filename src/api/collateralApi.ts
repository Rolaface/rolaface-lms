import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateCollateralPayload, CreateCollateralResponse } from "../types/collateralForm";

export interface GetCollateralsParams {
  search?: string;
  // Multiple values allowed — "0" = active, "1" = disabled.
  disabled?: string[];
  loan_security_type?: string[];
  page?: number;
  page_size?: number;
}

export async function getAllCollaterals(params?: GetCollateralsParams) {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.disabled && params.disabled.length > 0) {
    cleanParams.disabled = JSON.stringify(params.disabled.map(Number));
  }
  if (params?.loan_security_type && params.loan_security_type.length > 0) {
    cleanParams.loan_security_type = JSON.stringify(params.loan_security_type);
  }
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;

  const { data } = await apiClient.get(API.collateral.getCollateral, {
    params: cleanParams,
  });
  return data;
}

export async function createCollateral(payload: CreateCollateralPayload) {
  const { data } = await apiClient.post<CreateCollateralResponse>(API.collateral.createCollateral, payload);
  return data;
}

export async function updateCollateral({ id, payload }: {
  id: string;
  payload: Partial<CreateCollateralPayload>;
}) {
  const { data } = await apiClient.put(
    API.collateral.updateCollateral,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export async function getCollateralById(id: string) {
  const { data } = await apiClient.get(API.collateral.getCollateralById, { params: { id } });
  return data;
}

export async function deleteCollateral(id: string) {
  const { data } = await apiClient.delete(API.collateral.deleteCollateral, { params: { id } });
  return data;
}

export async function enableCollateral(id: string) {
  const { data } = await apiClient.put(API.collateral.enableCollateral, {}, { params: { id } });
  return data;
}

export async function disableCollateral(id: string) {
  const { data } = await apiClient.put(API.collateral.disableCollateral, {}, { params: { id } });
  return data;
}