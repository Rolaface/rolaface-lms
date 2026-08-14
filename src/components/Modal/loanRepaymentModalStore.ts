import { IconCash } from '@tabler/icons-react';
import { createModal } from '../../store/modal store/createModal';
import { LoanRepaymentModal } from './LoanRepaymentModal';

export interface LoanRepaymentModalParams {
  editId?: string | null;
  isView?: boolean;
}

interface LoanRepaymentModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: LoanRepaymentModalParams) {
  if (params.isView) return 'View Loan Repayment';
  if (params.editId) return 'Update Loan Repayment';
  return 'Loan Repayment';
}

export const loanRepaymentModal = createModal<LoanRepaymentModalParams, LoanRepaymentModalProps>(
  'loan-repayment-form',
  LoanRepaymentModal,
  {
    icon: IconCash,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId,
      isView: params.isView,
    }),
  },
);