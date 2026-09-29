import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateProductAssignmentPayload, CreateProductAssignmentResponse } from "../../types/OriginationSetup/productAssignemntForm";
 

export async function createProductAssignments(payload: CreateProductAssignmentPayload) {
  const { data } = await apiClient.post<CreateProductAssignmentResponse>(API.productAssignmentSetup.createProductAssignment, payload);
  return data;
}

export async function getAllProductAssignments(){
  const {data} = await apiClient.get(API.productAssignmentSetup.getProductAssignment);
  return data;
}