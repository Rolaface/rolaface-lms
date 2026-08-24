import { IconUserPlus } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { CreateUserModal } from './Createusermodal';
import type { CreateUserFormData } from '../../../types/User/createUser';

export interface UserModalParams {
  editId?: string | null;
  isView?: boolean;
  initialData?: CreateUserFormData | null;
}

interface UserModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  editId?: string | null;
  isView?: boolean;
  initialData?: CreateUserFormData | null;
}

function getTitle(params: UserModalParams) {
  if (params.isView) return 'View User';
  if (params.editId) return 'Edit User';
  return 'Add User';
}

export const userModal = createModal<UserModalParams, UserModalProps>(
  'user-form',
  CreateUserModal,
  {
    icon: IconUserPlus,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId,
      isView: params.isView,
      initialData: params.initialData,
    }),
  },
);