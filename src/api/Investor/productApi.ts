import API from "../../config/api";
import apiClient from "../../config/axios";
import type { CreateInvestmentProductPayload, CreateInvestmentProductResponse } from "../../types/Investor/investmentProductForm";


export async function createInvestmentProduct(payload: CreateInvestmentProductPayload) {
  const { data } = await apiClient.post<CreateInvestmentProductResponse>(API.investmentProduct.create, payload);
  return data;
}

export async function updateInvestmentProduct({ id, payload }: {
  id: string;
  payload: Partial<CreateInvestmentProductPayload>;
}) {
  const { data } = await apiClient.put(
    API.investmentProduct.update,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export async function getAllInvestmentProduct() {
  const { data } = await apiClient.get(API.investmentProduct.getAll);
  return data;
}

export async function getInvestmentProductById(id: string) {
  const { data } = await apiClient.get(API.investmentProduct.getById, { params: { id } });
  return data;
}

export async function deleteInvestmentProduct(id: string) {
  const { data } = await apiClient.delete(API.investmentProduct.delete, { params: { id } });
  return data;
}

export async function enableInvestmentProduct(id: string) {
  const { data } = await apiClient.put(API.investmentProduct.enable, {}, { params: { id } });
  return data;
}

export async function disableInvestmentProduct(id: string) {
  const { data } = await apiClient.put(API.investmentProduct.disable, {}, { params: { id } });
  return data;
}