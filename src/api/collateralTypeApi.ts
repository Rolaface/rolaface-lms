import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateCollateralTypePayload, CreateCollateralTypeResponse } from "../types/collateralTypeForm";

export interface GetCollateralTypesParams {
  search?: string;
  // 0 = active, 1 = disabled. Omit to fetch all.
  disabled?: 0 | 1;
}

export async function getAllCollateralTypes(params?: GetCollateralTypesParams) {
  // Strip undefined/empty values so we don't send `search=` or `disabled=undefined`
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.disabled === 0 || params?.disabled === 1) cleanParams.disabled = params.disabled;

  const { data } = await apiClient.get(API.collateralType.getCollateralType, {
    params: cleanParams,
  });
  return data;
}

export async function createCollateralType(payload: CreateCollateralTypePayload) {
  const { data } = await apiClient.post<CreateCollateralTypeResponse>(API.collateralType.createCollateralType, payload);
  return data;
}

export async function updateCollateralType({ id, payload }: {
  id: string;
  payload: Partial<CreateCollateralTypePayload>;
}) {
  const { data } = await apiClient.put(
    API.collateralType.updateCollateralType,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export async function getCollateralTypeById(id: string) {
  const { data } = await apiClient.get(API.collateralType.getCollateralTypeById, { params: { id } });
  return data;
}

export async function deleteCollateralType(id: string) {
  const { data } = await apiClient.delete(API.collateralType.deleteCollateralType, { params: { id } });
  return data;
}

export async function enableCollateralType(id: string) {
  const { data } = await apiClient.put(API.collateralType.enableCollateralType, {}, { params: { id } });
  return data;
}

export async function disableCollateralType(id: string) {
  const { data } = await apiClient.put(API.collateralType.disableCollateralType, {}, { params: { id } });
  return data;
}