import API from "../../config/api";
import apiClient from "../../config/axios";
import { type CreateEligibilityRulePayload, type GetEligibilityRuleByIdResponse } from "../../types/OriginationSetup/createRuleForm";

export async function createEligibilityRule(payload: CreateEligibilityRulePayload) {
  const { data } = await apiClient.post(
    API.createEligibilityRule.createEligibilityRule,
    payload,
  );
  return data;
}

export async function getEligibilityRuleById(id: string) {
  const { data } = await apiClient.get<GetEligibilityRuleByIdResponse>(
    API.createEligibilityRule.getEligibilityRuleById,
    { params: { id } },
  );
  return data;
}

export async function getEligibilityRules(){
    const {data} = await apiClient.get(API.createEligibilityRule.getEligibilityRule);
    return data;
}

export async function updateEligibilityRule(id: string, payload: Partial<CreateEligibilityRulePayload>) {
  const { data } = await apiClient.put<CreateEligibilityRulePayload>(
    API.createEligibilityRule.updateEligibilityRule,
    payload,
    { params: { id } },
  );
  return data;
}

export async function deleteEligibilityRule(id: string) {
  const { data } = await apiClient.delete(
    API.createEligibilityRule.deleteEligibilityRule,
    { params: { id } },
  );
  return data;
}