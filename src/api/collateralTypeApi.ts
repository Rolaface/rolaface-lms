import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateCollateralTypePayload, CreateCollateralTypeResponse } from "../types/collateralTypeForm";

export interface GetCollateralTypesParams {
  search?: string;
  disabled?: string[]; 
  page?: number;
  page_size?: number;
}

export async function getAllCollateralTypes(params?: GetCollateralTypesParams) {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  
  if (params?.disabled && params.disabled.length === 1) {
    cleanParams.disabled = Number(params.disabled[0]);
  }
  
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;

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