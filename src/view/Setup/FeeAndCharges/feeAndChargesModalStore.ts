import { IconReceipt } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { FeeAndChargesModal } from '../../../components/Modal/FeeAndChargesModal';
import type { FeeAndCharge } from '../../../components/Modal/FeeAndChargesModal';

export interface FeeAndChargesModalParams {
  mode?: 'add' | 'edit' | 'view';
  data?: FeeAndCharge | null;
}

function getTitle(params: FeeAndChargesModalParams) {
  if (params.mode === 'view') return 'View Fee and Charge';
  if (params.mode === 'edit') return 'Edit Fee & Charge';
  return 'New Fee & Charge';
}

export const feeAndChargesModal = createModal(
  'fee-and-charges',
  FeeAndChargesModal,
  {
    icon: IconReceipt,
    getTitle,
    buildProps: (params) => ({
      mode: params.mode ?? 'add',
      data: params.data ?? null,
    }),
  },
);