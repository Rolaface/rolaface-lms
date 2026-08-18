import { IconFileInvoice } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { LoanAccountModal } from './LoanAccountModal';

export interface LoanAccountModalParams {
  loanId?: string | null;
  isViewMode?: boolean;
}

interface LoanAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanId?: string | null;
  isViewMode?: boolean;
}

function getTitle(params: LoanAccountModalParams) {
  if (params.isViewMode) return 'View Loan Booking';
  if (params.loanId) return 'Update Loan Booking';
  return 'New Loan Booking';
}

export const loanAccountModal = createModal<LoanAccountModalParams, LoanAccountModalProps>(
  'loan-account-form',
  LoanAccountModal,
  {
    icon: IconFileInvoice,
    getTitle,
   buildProps: (params) => ({
  loanId: params.loanId ?? null,
  isViewMode: params.isViewMode ?? false,
}),
  },
);