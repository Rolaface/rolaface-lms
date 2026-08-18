import { IconFileText } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal'; 
import { LoanApplicationModal } from './LoanApplicationModal';

export interface LoanApplicationModalParams {
  loanApplicationId?: string | null;
  onSaved?: () => void;
}

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSaved?: () => void;
  loanApplicationId?: string | null;
}

function getTitle(params: LoanApplicationModalParams) {
  return params.loanApplicationId ? 'Update Loan Application' : 'New Loan Application';
}

export const loanApplicationModal = createModal<LoanApplicationModalParams, LoanApplicationModalProps>(
  'loan-application-form',
  LoanApplicationModal,
  {
    icon: IconFileText,
    getTitle,
   buildProps: (params) => ({
  loanApplicationId: params.loanApplicationId ?? null,
  onSaved: params.onSaved,
}),
  },
);