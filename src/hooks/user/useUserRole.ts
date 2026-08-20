import { useCallback, useState ,useEffect} from "react";
import { LMS_MODULES, EMPTY_FORM } from "../../types/User/userRole";
import type {
  PermissionEntry,
  UserRole,
  UserRoleFormData,
  LmsModule,
} from "../../types/User/userRole";


import { showApiError } from "../../utils/alert";

export type PermissionKey = keyof Omit<PermissionEntry, "module">;

export const PERMISSION_KEYS: PermissionKey[] = [
  "read",
  "write",
  "create",
  "delete",
  "import",
  "export",
  "report",
  "submit",
  "cancel",
  "email",
];

export const getPermissionActions = (
  permissions: PermissionEntry[],
  module: LmsModule
): PermissionEntry | undefined => permissions.find((p) => p.module === module);

export const hasAnyPermission = (
  permissions: PermissionEntry[],
  module: LmsModule
): boolean => {
  const entry = getPermissionActions(permissions, module);
  if (!entry) return false;
  const { module: _module, ...flags } = entry;
  return Object.values(flags).some((v) => v === 1);
};

interface UseUserRoleLogicOptions {
  onSubmit: (data: UserRoleFormData) => Promise<void> | void;
  initialData?: UserRoleFormData | null;
}

export const useUserRoleLogic = ({ onSubmit, initialData }: UseUserRoleLogicOptions) => {
  const [form, setForm] = useState<UserRole>(initialData ?? EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setErrors({});
    }
  }, [initialData]);

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.role.trim()) e.role = "Role name is required";
    if (form.permission.length === 0) e.permission = "At least one permission is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof UserRoleFormData, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
      clearError("submit");
    },
    [clearError]
  );

  const toggleAction = useCallback(
    (module: LmsModule, action: PermissionKey) => {
      setForm((prev) => {
        const existing = prev.permission.find((p) => p.module === module);
        if (existing) {
          return {
            ...prev,
            permission: prev.permission.map((p) =>
              p.module === module ? { ...p, [action]: p[action] === 1 ? 0 : 1 } : p
            ),
          };
        }
        const newEntry: PermissionEntry = {
          module,
          read: 0,
          write: 0,
          create: 0,
          delete: 0,
          import: 0,
          export: 0,
          report: 0,
          submit: 0,
          cancel: 0,
          email: 0,
          [action]: 1,
        };
        return { ...prev, permission: [...prev.permission, newEntry] };
      });
      clearError("permission");
    },
    [clearError]
  );

  const toggleModuleLevel = useCallback(
    (module: LmsModule, on: boolean) => {
      setForm((prev) => {
        const filtered = prev.permission.filter((p) => p.module !== module);
        if (!on) return { ...prev, permission: filtered };
        return {
          ...prev,
          permission: [
            ...filtered,
            {
              module,
              read: 1,
              write: 1,
              create: 1,
              delete: 1,
              import: 1,
              export: 1,
              report: 1,
              submit: 1,
              cancel: 1,
              email: 1,
            },
          ],
        };
      });
      clearError("permission");
    },
    [clearError]
  );

  const clearModulePermissions = useCallback((module: LmsModule) => {
    setForm((prev) => ({
      ...prev,
      permission: prev.permission.filter((p) => p.module !== module),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, validate]);

  const handleReset = useCallback(() => {
    setForm(initialData ?? EMPTY_FORM);
    setErrors({});
  }, [initialData]);

  return {
    form,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    handleReset,
    toggleAction,
    toggleModuleLevel,
    clearModulePermissions,
    getPermissionActions: (module: LmsModule) => getPermissionActions(form.permission, module),
    hasAnyPermission: (module: LmsModule) => hasAnyPermission(form.permission, module),
    modules: LMS_MODULES,
  };
};