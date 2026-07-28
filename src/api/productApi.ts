import apiClient from "../config/axios";
import { API } from "../config/api";

export async function getAllLoanProducts() {
  const { data } = await apiClient.get(API.loanProduct.getAllLoanProducts);
  return data;
  
}