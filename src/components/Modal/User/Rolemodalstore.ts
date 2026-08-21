import { create } from "zustand";
import type { UserRoleFormData } from "../../../types/User/userRole";

interface RoleModalOpenOptions {
  editId?: string | null;
  isView?: boolean;
  initialData?: UserRoleFormData | null;
}

interface RoleModalStoreState extends RoleModalOpenOptions {
  opened: boolean;
}

const useRoleModalStore = create<RoleModalStoreState>(() => ({
  opened: false,
  editId: null,
  isView: false,
  initialData: null,
}));


export const roleModal = {
  open: (opts: RoleModalOpenOptions = {}) =>
    useRoleModalStore.setState({
      opened: true,
      editId: opts.editId ?? null,
      isView: opts.isView ?? false,
      initialData: opts.initialData ?? null,
    }),
  close: () =>
    useRoleModalStore.setState({
      opened: false,
      editId: null,
      isView: false,
      initialData: null,
    }),
};


export const useRoleModal = () => useRoleModalStore();