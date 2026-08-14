import { IconBuildingBank } from '@tabler/icons-react';
import { createModal } from '../../../../store/modal store/createModal';
import { AccountFormModal } from './AccountFormModal';
import type { COAAccount } from '../../../../api/Accounting/Chartofaccounts.api';

export interface AccountFormModalParams {
  company: string;
  baseCurrency: string;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
  readOnly?: boolean;
onSuccess: () => void;
}

interface AccountFormModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSuccess: () => void;
  company: string;
  baseCurrency: string;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
  readOnly?: boolean;
}

function getTitle(params: AccountFormModalParams) {
  if (params.readOnly) return 'Account Details';
  if (params.editAccount) return 'Edit Account';
  if (params.parentAccount) return 'New Child Account';
  return 'New Account';
}

export const accountFormModal = createModal<AccountFormModalParams, AccountFormModalProps>(
  'account-form',
  AccountFormModal,
  {
    icon: IconBuildingBank,
    getTitle,
    buildProps: (params) => ({
      onSuccess: params.onSuccess,
      company: params.company,
      baseCurrency: params.baseCurrency,
      parentAccount: params.parentAccount,
      editAccount: params.editAccount,
      readOnly: params.readOnly,
    }),
  },
);