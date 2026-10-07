import { IconGauge } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { PreScreeningModal } from './PreScreeningModal';

export interface PreScreeningModalParams {
  loanApplicationId?: string | null;
  readOnly?: boolean;
}

interface PreScreeningModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanApplicationId?: string | null;
  readOnly?: boolean;
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
      loanApplicationId: params.loanApplicationId,
      readOnly: params.readOnly,
    }),
  },
);