import { create } from "zustand";
import type { CreateUserFormData } from "../../../types/User/createUser";

interface UserModalOpenOptions {
  editId?: string | null;
  initialData?: CreateUserFormData | null;
}

interface UserModalStoreState extends UserModalOpenOptions {
  opened: boolean;
}

const useUserModalStore = create<UserModalStoreState>(() => ({
  opened: false,
  editId: null,
  initialData: null,
}));

export const userModal = {
  open: (opts: UserModalOpenOptions = {}) =>
    useUserModalStore.setState({
      opened: true,
      editId: opts.editId ?? null,
      initialData: opts.initialData ?? null,
    }),
  close: () =>
    useUserModalStore.setState({ opened: false, editId: null, initialData: null }),
};

export const useUserModal = () => useUserModalStore();