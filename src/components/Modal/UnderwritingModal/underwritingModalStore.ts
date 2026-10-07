import { IconScale } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { UnderwritingModal } from './UnderwritingModal';

export interface UnderwritingModalParams {
  loanApplicationId?: string | null;
  readOnly?: boolean;
}

interface UnderwritingModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanApplicationId?: string | null;
  readOnly?: boolean;
}

function getTitle() {
  return 'Loan Underwriting';
}

export const underwritingModal = createModal<UnderwritingModalParams, UnderwritingModalProps>(
  'underwriting-modal',
  UnderwritingModal,
  {
    icon: IconScale,
    getTitle,
    buildProps: (params) => ({
      loanApplicationId: params.loanApplicationId,
      readOnly: params.readOnly,
    }),
  },
);