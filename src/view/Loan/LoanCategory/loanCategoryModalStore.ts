import { IconCategory } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import AddLoanCategoryModal from "../../../components/Modal/Lending Setup Modal/AddLoanCategoryModel";
import type { LoanCategoryFormData } from "../../../components/Modal/Lending Setup Modal/AddLoanCategoryModel"

export interface LoanCategoryModalParams {
  editId?: string | null;
  initialData?: LoanCategoryFormData | null;
  isView?: boolean;
}

function getTitle(params: LoanCategoryModalParams) {
  if (params.isView) return "View Loan Category";
  if (params.editId) return "Edit Loan Category";
  return "New Loan Category";
}

export const loanCategoryModal = createModal(
  "loan-category",
  AddLoanCategoryModal,
  {
    icon: IconCategory,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      initialData: params.initialData ?? null,
      isView: params.isView ?? false,
    }),
  },
);