import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyWorkflowAction } from "../../api/workflowApi";
import { LOAN_APPLICATION_DOCTYPE } from "../../api/LosConfiguration/LoanApplicationApi";
import { WorkflowActionModal } from "../../components/Modal/WorkflowActionModal";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { useUserStore } from "../../store/userStore";
import type { WorkflowAction } from "../../types/workflow";

interface Target {
  id: string;
  applicantName: string | null;
  actions: WorkflowAction[];
  preselectedAction?: string;
}

export function useApplicationWorkflow() {
  const queryClient = useQueryClient();
  const email = useUserStore((s) => s.user?.email);
  const [target, setTarget] = useState<Target | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { docname: string; action: string; comment?: string; assign_to_user?: string }) =>
      applyWorkflowAction({ doctype: LOAN_APPLICATION_DOCTYPE, ...payload }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["los-loan-applications"] });
      queryClient.invalidateQueries({ queryKey: ["los-loan-application", variables.docname] });
      queryClient.invalidateQueries({ queryKey: ["los-workflow-actions", variables.docname] });
      setTarget(null);
      openCommonModal({
        heading: "Action Applied",
        subtitle: "",
        body: `'${variables.action}' applied to ${variables.docname}.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: unknown) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    },
  });

  const modal = (
    <WorkflowActionModal
      opened={!!target}
      applicationId={target?.id ?? null}
      applicantName={target?.applicantName ?? null}
      allowedActions={target?.actions ?? []}
      preselectedAction={target?.preselectedAction}
      currentUserEmail={email}
      onClose={() => setTarget(null)}
      onConfirm={(payload) => target && mutation.mutate({ docname: target.id, ...payload })}
      isSubmitting={mutation.isPending}
    />
  );

  return { modal, openAction: setTarget };
}
