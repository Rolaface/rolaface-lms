import apiClient from "../config/axios";
import { API } from "../config/api";
import type { CreateLoanProductPayload } from "./LoanProduct/LoanProductAPi";
import type { CreateLoanProductResponse } from "../types/loanProductForm";

export interface OffsetOrderComponent {
  idx: number;
  demand_type: string;
  [key: string]: any;
}

export interface GetLoanProductsParams {
  search?: string;
}

export async function getAllLoanProducts(params: GetLoanProductsParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;

  const { data } = await apiClient.get(API.loanProduct.getAllLoanProducts, {
    params: queryParams,
  });
  return data;
}

export async function createLoanProduct(payload: CreateLoanProductPayload) {
  const { data } = await apiClient.post<CreateLoanProductResponse>(API.loanProduct.create, payload);
  return data;
}

export async function updateLoanProduct({id, payload,}: {
  id: string;
  payload: Partial<CreateLoanProductPayload>;
}) {
  const { data } = await apiClient.put(
    API.loanProduct.update,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export async function getLoanDeamndOffsetorder() {
  const { data } = await apiClient.get(API.search.getLoanDemandOffsetOrders);
  return data;
  
} 

export async function deleteLoanProduct(id: string) {
  const { data } = await apiClient.delete(API.loanProduct.delete, { params: { id } });  
  return data;
}
export async function enableLoanProduct(id: string) {
   const { data } = await apiClient.put(API.loanProduct.enable, {}, { params: { id } });  
  return data;
}

export async function disableLoanProduct(id: string) {
  const { data } = await apiClient.put(API.loanProduct.disable, {}, { params: { id } });  
  return data;
}
export async function getAllItems() {
  const { data } = await apiClient.get(API.search.getItems);
  return data;
  
}

export async function getAllLoanCategory() {
  const { data } = await apiClient.get(API.search.getLoanCategory);
  return data;
  
}

export async function getAllIncomeAccounts(searchTerm?: string) {
  const { data } = await apiClient.get(API.search.getAccounts, {
    params: {
      root_type: "Income",
      is_group: 0,
      txt: searchTerm
    }
  });
  return data;
}

export async function getAllIPAccounts(searchTerm?: string) {
  const { data } = await apiClient.get(API.search.getAccounts, {
    params: {
      is_group: 0,
      txt: searchTerm
    }
  });
  return data;
}
// In productApi.ts
export async function getAllPrincipalAccounts(searchTerm?: string) {
    const filters = [
        ["root_type", "in", ["Asset", "Liability"]],
        ["is_group", "=", 0]
    ];

    const { data } = await apiClient.get(API.search.getAccounts, {
        params: {
            filters: JSON.stringify(filters),
            txt: searchTerm // <-- Pass the search term to Frappe
        }
    });
    return data;
}


export async function getLoanProductById(id: string) {
  const { data } = await apiClient.get(API.loanProduct.getById, { params: { id } });  
  return data;
}



 export async function getLoanDemandOffsetOrderDetail(name: string) {
  const { data } = await apiClient.get(
    `${API.search.getLoanDemandOffsetOrderDetail}/${encodeURIComponent(name)}`
  );
  return data;
}