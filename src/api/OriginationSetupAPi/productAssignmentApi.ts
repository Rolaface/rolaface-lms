import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { CreateProductAssignmentPayload, CreateProductAssignmentResponse, GetProductAssignmentsParams } from "../../types/OriginationSetup/productAssignemntForm";
 

export async function createProductAssignments(payload: CreateProductAssignmentPayload) {
  const { data } = await apiClient.post<CreateProductAssignmentResponse>(API.productAssignmentSetup.createProductAssignment, payload);
  return data;
}

export async function getAllProductAssignments(params?: GetProductAssignmentsParams) {
  const { data } = await apiClient.get(API.productAssignmentSetup.getProductAssignment, { params });
  return data;
}

export async function getProductionAssignmentById(id: string){
  const {data} = await apiClient.get(API.productAssignmentSetup.getProductAssignmentById, {params:{id}});
  return data;
}

export async function deleteProductAssignments(id: string){
  const {data} = await apiClient.delete(API.productAssignmentSetup.deleteProductAssignment, {params: {id}});
  return data;
}

export async function updateProductAssignments({id, payload,}: {
  id: string;
  payload: Partial<CreateProductAssignmentPayload>;
}) {
  const { data } = await apiClient.put(
    API.productAssignmentSetup.updateProductAssignment,
    payload,
    {
      params: { id },
    }
  );

  return data;
}