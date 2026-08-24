import { IconShieldCheck } from '@tabler/icons-react';
import { createModal } from '../../../store/modal store/createModal';
import { AssignUserRoleModal } from './Assignuserrolemodal';
import type { UserRoleFormData } from '../../../types/User/userRole';

export interface RoleModalParams {
  editId?: string | null;
  isView?: boolean;
  initialData?: UserRoleFormData | null;
}

interface RoleModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  editId?: string | null;
  isView?: boolean;
  initialData?: UserRoleFormData | null;
}

function getTitle(params: RoleModalParams) {
  if (params.isView) return 'View Role';
  if (params.editId) return 'Edit Role';
  return 'Add Role';
}

export const roleModal = createModal<RoleModalParams, RoleModalProps>(
  'role-form',
  AssignUserRoleModal,
  {
    icon: IconShieldCheck,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId,
      isView: params.isView,
      initialData: params.initialData,
    }),
  },
);