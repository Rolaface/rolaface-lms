/**
 * Represents a single allowed workflow transition returned by the backend.
 * Produced by workflow.api.get_allowed_workflow_actions and embedded in every
 * list row by get_custom_loan_applications (O(1) hash-map, no N+1).
 */
export interface WorkflowAction {
  action: string;
  next_state: string;
  allowed_role: string;
}

export interface WorkflowActionsResponse {
  current_state: string | null;
  allowed_actions: WorkflowAction[];
}
