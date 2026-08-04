import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateCollateralTypePayload, CreateCollateralTypeResponse } from "../types/collateralTypeForm";

export async function getAllCollateralTypes() {
  const { data } = await apiClient.get(API.collateralType.getCollateralType);
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