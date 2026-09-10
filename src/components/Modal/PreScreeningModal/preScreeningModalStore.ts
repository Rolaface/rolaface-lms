import { IconGauge } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { PreScreeningModal } from './PreScreeningModal';
import type { LoanApplicationValues } from '../LoanApplication/LoanApplicationModal';

export interface PreScreeningModalParams {
  applicationValues?: LoanApplicationValues;
}

interface PreScreeningModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
}

function getTitle() {
  return 'Prescreening';
}

export const preScreeningModal = createModal<PreScreeningModalParams, PreScreeningModalProps>(
  'prescreening-modal',
  PreScreeningModal,
  {
    icon: IconGauge,
    getTitle,
    buildProps: (params) => ({
      applicationValues: params.applicationValues,
    }),
  },
);