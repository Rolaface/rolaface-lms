import { IconSignature } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { OfferModal } from './OfferSigningModal';

export interface OfferModalParams {
  loanApplicationId?: string | null;
  readOnly?: boolean;
}

interface OfferModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  loanApplicationId?: string | null;
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
      loanApplicationId: params.loanApplicationId,
      readOnly: params.readOnly,
    }),
  },
);