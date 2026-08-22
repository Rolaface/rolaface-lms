import { usePermissionStore } from "../store/Permissionstore";

export function usePermission() {
  const can             = usePermissionStore((s) => s.can);
  const canAccessModule = usePermissionStore((s) => s.canAccessModule);
  const canAccessAnyOf  = usePermissionStore((s) => s.canAccessAnyOf);
  const permissions     = usePermissionStore((s) => s.permissions);
  const isLoading       = usePermissionStore((s) => s.isLoading);
  const isAdmin         = usePermissionStore((s) => s.isAdmin);

  return {
    can,
    canAccessModule,
    canAccessAnyOf,
    permissions,
    isLoading,
    isAdmin,
  };
}