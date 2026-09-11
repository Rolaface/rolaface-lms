import apiClient from "../config/axios";
import { API } from "../config/api";
import type { WorkflowActionsResponse } from "../types/workflow";

/**
 * Fetches the current workflow state and allowed transition actions for a
 * specific document. Use this in detail views where you need a fresh read.
 * The list view gets allowed_workflow_actions for free from get_custom_loan_applications.
 */
export async function getWorkflowActions(
  doctype: string,
  docname: string
): Promise<WorkflowActionsResponse> {
  const { data } = await apiClient.get(API.workflow.getActions, {
    params: { doctype, docname },
  });
  // Frappe wraps in { message: { data: ... } }
  return data?.message?.data ?? { current_state: null, allowed_actions: [] };
}

export interface ApplyWorkflowPayload {
  doctype?: string;
  docname: string;
  action: string;
  comment?: string;
  assign_to_user?: string;
}

/**
 * Applies a workflow transition. The backend validates the action against the
 * site's active workflow table — invalid transitions are rejected at source.
 */
export async function applyWorkflowAction(payload: ApplyWorkflowPayload) {
  const { data } = await apiClient.post(API.workflow.applyAction, {
    doctype: "Custom Loan Application",
    ...payload,
  });
  return data;
}

export async function getWorkflow(doctype: string) {
  const { data } = await apiClient.get(API.workflow.getWorkflow, { params: { doctype } });
  return data?.message?.data ?? { workflow_name: "", states: [], transitions: [], is_active: 0 };
}

export async function getWorkflowStates() {
  const { data } = await apiClient.get(API.workflow.getStates, {
    params: { fields: '["name"]', limit_page_length: 0 }
  });
  return data?.data?.map((d: any) => d.name) || [];
}

export async function getWorkflowActionMasters() {
  const { data } = await apiClient.get(API.workflow.getActionMasters, {
    params: { fields: '["name"]', limit_page_length: 0 }
  });
  return data?.data?.map((d: any) => d.name) || [];
}

export async function getRoles() {
  const { data } = await apiClient.get(API.RoleManagement.getUserRoles, {
    params: { page_size: 1000 }
  });
  return data?.data?.map((r: any) => r.Id) || ["All", "System Manager"];
}

export interface SaveWorkflowPayload {
  doctype: string;
  workflow_name: string;
  states: { state: string; doc_status: string; allow_edit: string; message?: string }[];
  transitions: { from_state: string; action: string; to_state: string; allowed: string }[];
  is_active?: number;
}

export async function saveWorkflow(payload: SaveWorkflowPayload) {
  const { data } = await apiClient.post(API.workflow.saveWorkflow, payload);
  return data;
}
