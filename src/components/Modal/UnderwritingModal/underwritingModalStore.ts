import { IconScale } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { UnderwritingModal } from './UnderwritingModal';
import type { LoanApplicationValues } from '../LoanApplication/LoanApplicationModal';

export interface UnderwritingModalParams {
  applicationValues?: LoanApplicationValues;
}

interface UnderwritingModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
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
      applicationValues: params.applicationValues,
    }),
  },
);