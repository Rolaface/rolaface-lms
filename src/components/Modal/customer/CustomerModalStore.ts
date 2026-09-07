import { IconUser } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal'; 
import { CustomerModal } from './CustomerModal';

export interface CustomerModalParams {
  isViewMode?: boolean;
  customerId?: string;
}

interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isViewMode?: boolean;
  customerId?: string;
}

function getTitle(params: CustomerModalParams) {
  if (params.isViewMode) return 'View Customer';
  return params.customerId ? 'Edit Customer' : 'Create Customer';
}

export const customerModal = createModal<CustomerModalParams, CustomerModalProps>(
  'customer-form',
  CustomerModal,
  {
    icon: IconUser,
    getTitle,
    buildProps: (params) => ({
      isViewMode: params.isViewMode,
      customerId: params.customerId,
    }),
  },
);
