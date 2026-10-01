import API from "../../config/api";
import apiClient from "../../config/axios";
import { type CreateEligibilityRulePayload, type GetEligibilityRuleByIdResponse } from "../../types/OriginationSetup/createRuleForm";

export async function createEligibilityRule(payload: CreateEligibilityRulePayload) {
  const { data } = await apiClient.post(
    API.createEligibilityRule.createProductAssignment,
    payload,
  );
  return data;
}

export async function getEligibilityRuleById(id: string) {
  const { data } = await apiClient.get<GetEligibilityRuleByIdResponse>(
    API.createEligibilityRule.getProductAssignmentById,
    { params: { id } },
  );
  return data;
}

export async function getEligibilityRules(){
    const {data} = await apiClient.get(API.createEligibilityRule.getProductAssignment);
    return data;
}