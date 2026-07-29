import apiClient from "../config/axios";
import { API } from "../config/api";

export async function getAllLoanProducts() {
  const { data } = await apiClient.get(API.loanProduct.getAllLoanProducts);
  return data;
  
}

export async function getLoanDeamndOffsetorder() {
  const { data } = await apiClient.get(API.search.getLoanDemandOffsetOrders);
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
