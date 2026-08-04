import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateCollateralPayload, CreateCollateralResponse } from "../types/collateralForm";

export async function getAllCollaterals() {
  const { data } = await apiClient.get(API.collateral.getCollateral);
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