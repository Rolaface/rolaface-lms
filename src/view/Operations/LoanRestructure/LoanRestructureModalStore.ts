import { IconRestore } from "@tabler/icons-react";
import { LoanRestructureModal } from "../../../components/Modal/LoanRestructure/LoanRestructureModal";
import { createModal } from "../../../store/modal store/createModal";

export interface LoanRestructureModalParams {
  editName?: string | null;
  viewName?: string | null;
}

function getTitle(params: LoanRestructureModalParams) {
  if (params.viewName) return "View Loan Restructure";
  if (params.editName) return "Edit Loan Restructure";
  return "Loan Restructure";
}

export const loanRestructureModal = createModal(
  "loan-restructure",
  LoanRestructureModal,
  {
    icon: IconRestore,
    getTitle,
    buildProps: (params) => ({
      editName: params.editName ?? null,
      viewName: params.viewName ?? null,
      onSaved: () => loanRestructureModal.close(),
    }),
  },
);