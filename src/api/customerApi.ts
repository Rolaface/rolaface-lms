import apiClient from "../config/axios";
import { API } from "../config/api";

export async function getAllCustomers() {
  const { data } = await apiClient.get(API.customer.getAllCustomers);
  return data;
  
}