import { IconBuildingBank } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { EnrichmentModal } from './EnrichmentModal';
import type { LoanApplicationValues } from '../LoanApplication/LoanApplicationModal';

export interface EnrichmentModalParams {
  applicationValues?: LoanApplicationValues;
}

interface EnrichmentModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
}
function getTitle() {
  return 'Loan Enrichment';
}

export const enrichmentModal = createModal<EnrichmentModalParams, EnrichmentModalProps>(
  'enrichment-modal',
  EnrichmentModal,
  {
    icon: IconBuildingBank,
    getTitle,
    buildProps: (params) => ({
      applicationValues: params.applicationValues,
    }),
  },
);