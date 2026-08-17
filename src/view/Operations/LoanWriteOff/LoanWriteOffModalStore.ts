import { IconFileOff } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanWriteOffModal } from "../../../components/Modal/LoanWriteOffModal";

import type { LoanWriteOffFormData } from "../../../components/Modal/LoanWriteOffModal";
import type { LoanWriteOffDetail } from "../../../types/loanWriteOff"

export interface LoanWriteOffModalParams {
  editData?: LoanWriteOffDetail | null;
  onSubmit?: (data: LoanWriteOffFormData) => void;
}

function getTitle(params: LoanWriteOffModalParams) {
  return params.editData ? "Update Write Off" : "Write Off Loan";
}

export const loanWriteOffModal = createModal(
  "loanWriteOff",
  LoanWriteOffModal,
  {
    icon: IconFileOff,
    getTitle,
    buildProps: (params: LoanWriteOffModalParams) => ({
      editData: params.editData ?? null,
      onSubmit: params.onSubmit,
    }),
  },
);