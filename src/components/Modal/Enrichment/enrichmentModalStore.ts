import { IconBuildingBank } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { EnrichmentModal } from './EnrichmentModal';

export interface EnrichmentModalParams {
  loanApplicationId?: string | null;
  readOnly?: boolean;
}

interface EnrichmentModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanApplicationId?: string | null;
  readOnly?: boolean;
}
function getTitle() {
  return 'Loan Appraisal';
}

export const enrichmentModal = createModal<EnrichmentModalParams, EnrichmentModalProps>(
  'enrichment-modal',
  EnrichmentModal,
  {
    icon: IconBuildingBank,
    getTitle,
    buildProps: (params) => ({
      loanApplicationId: params.loanApplicationId,
      readOnly: params.readOnly,
    }),
  },
);