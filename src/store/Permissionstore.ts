import { create } from "zustand";
import type { PermissionEntry, LmsModule } from "../types/User/userRole";

export type PermissionAction = keyof Omit<PermissionEntry, "module">;

const PERMISSION_ACTIONS: PermissionAction[] = [
  "read", "write", "create", "delete", "import",
  "export", "report", "submit", "cancel", "email",
];

type NormalizedPermission = Record<PermissionAction, boolean>;

interface PermissionState {
  permissions: Map<LmsModule, NormalizedPermission>;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;

  setPermissions: (raw: PermissionEntry[]) => void;
  setAdmin: (isAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPermissions: () => void;

  can: (module: LmsModule, action: PermissionAction) => boolean;
  canAccessModule: (module: LmsModule) => boolean;
  canAccessAnyOf: (modules: LmsModule[]) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: new Map(),
  isLoading: true,
  isAdmin: false,
  error: null,

  setPermissions: (raw) => {
    const map = new Map<LmsModule, NormalizedPermission>();
    for (const entry of raw) {
      const normalized = {} as NormalizedPermission;
      PERMISSION_ACTIONS.forEach((action) => {
        normalized[action] = entry[action] === 1;
      });
      map.set(entry.module, normalized);
    }
    set({ permissions: map, isLoading: false, error: null });
  },

  setAdmin: (isAdmin) => set({ isAdmin }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  clearPermissions: () =>
    set({ permissions: new Map(), isLoading: false, isAdmin: false, error: null }),

  can: (module, action) => {
    if (get().isAdmin) return true;
    const perm = get().permissions.get(module);
    if (!perm) return false;
    return perm[action] === true;
  },

  canAccessModule: (module) => {
    if (get().isAdmin) return true;
    return get().can(module, "read");
  },

  canAccessAnyOf: (modules) => {
    if (get().isAdmin) return true;
    if (modules.length === 0) return true;
    return modules.some((mod) => get().can(mod, "read"));
  },
}));