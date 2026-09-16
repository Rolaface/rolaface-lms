import { IconSignature } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { OfferModal } from './OfferSigningModal';
import type { LoanApplicationValues } from '../LoanApplication/LoanApplicationModal';

export interface OfferModalParams {
  applicationValues?: LoanApplicationValues;
}

interface OfferModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
  embedded?: boolean;
  readOnly?: boolean;
}

function getTitle() {
  return 'Offer & Signing';
}

export const offerModal = createModal<OfferModalParams, OfferModalProps>(
  'offer-modal',
  OfferModal,
  {
    icon: IconSignature,
    getTitle,
    buildProps: (params) => ({
      applicationValues: params.applicationValues,
    }),
  },
);