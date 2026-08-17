import { IconBriefcase } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { LoanProductModal } from './LoanProductModal';

export interface LoanProductModalParams {
  loanProductId?: string | null;
  isViewMode?: boolean;
  onSaved?: () => void;
}

interface LoanProductModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSaved?: () => void;
  loanProductId?: string | null;
  isViewMode?: boolean;
}

function getTitle(params: LoanProductModalParams) {
  if (params.isViewMode) return 'View Loan Product';
  if (params.loanProductId) return 'Update Loan Product';
  return 'Create Loan Product';
}

export const loanProductModal = createModal<LoanProductModalParams, LoanProductModalProps>(
  'loan-product',
  LoanProductModal,
  {
    icon: IconBriefcase,
    getTitle,
    buildProps: (params) => ({
      onSaved: params.onSaved,
      loanProductId: params.loanProductId,
      isViewMode: params.isViewMode,
    }),
  },
);