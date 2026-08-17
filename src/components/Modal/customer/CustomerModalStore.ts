import { IconUser } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal'; 
import { CustomerModal } from './CustomerModal';

export interface CustomerModalParams {
  isViewMode?: boolean;
}

interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isViewMode?: boolean;
}

function getTitle(params: CustomerModalParams) {
  return params.isViewMode ? 'View Customer' : 'Create Customer';
}

export const customerModal = createModal<CustomerModalParams, CustomerModalProps>(
  'customer-form',
  CustomerModal,
  {
    icon: IconUser,
    getTitle,
    buildProps: (params) => ({
      isViewMode: params.isViewMode,
    }),
  },
);