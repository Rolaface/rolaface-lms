import { useState, useCallback, useEffect } from "react";
import type { CreateUserFormData } from "../../types/User/createUser";
import { EMPTY_CREATE_USER_FORM } from "../../types/User/createUser";
import { getUserRoles } from "../../api/User/roleApi";
import { getLanguages } from "../../api/User/userApi";

// Same note as useUserRole.ts — swap for your notifications helper if
// utils/alert doesn't exist in LMS.
import { showApiError } from "../../utils/alert";

type FormErrors = Partial<Record<keyof CreateUserFormData, string>>;

function validateForm(form: CreateUserFormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!form.username.trim()) errors.username = "Username is required";
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  return errors;
}

export interface SelectOption {
  label: string;
  value: string;
}

interface UseCreateUserOptions {
  onSubmit: (data: CreateUserFormData) => Promise<void> | void;
  initialData?: CreateUserFormData | null;
}

export function useCreateUser({ onSubmit, initialData }: UseCreateUserOptions) {
  const [form, setForm] = useState<CreateUserFormData>(() =>
    initialData ? { ...EMPTY_CREATE_USER_FORM, ...initialData } : { ...EMPTY_CREATE_USER_FORM }
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleLabels, setSelectedRoleLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({ ...EMPTY_CREATE_USER_FORM, ...initialData });
      setErrors({});
      setSelectedRoleLabels({});
    }
  }, [initialData]);

  const handleFieldChange = useCallback(
    <K extends keyof CreateUserFormData>(field: K, value: CreateUserFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [errors]
  );

  const fetchLanguages = useCallback(async (search: string): Promise<SelectOption[]> => {
    try {
      const result = await getLanguages(search);
      return result.map((l) => ({ value: l.value, label: l.label }));
    } catch {
      return [];
    }
  }, []);

  const fetchRoles = useCallback(async (search: string): Promise<SelectOption[]> => {
    try {
      const res = await getUserRoles(search || undefined, 1, 30);
      if (res.status !== "success") return [];
      return res.data.map((r) => ({ value: r.Id, label: r.roleName }));
    } catch {
      return [];
    }
  }, []);

  const addRole = useCallback((roleId: string, roleLabel: string) => {
    if (!roleId) return;
    setForm((prev) => {
      if (prev.roleIds.includes(roleId)) return prev;
      return { ...prev, roleIds: [...prev.roleIds, roleId] };
    });
    setSelectedRoleLabels((prev) => ({ ...prev, [roleId]: roleLabel }));
  }, []);

  const removeRole = useCallback((roleId: string) => {
    setForm((prev) => ({ ...prev, roleIds: prev.roleIds.filter((id) => id !== roleId) }));
    setSelectedRoleLabels((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit]);

  const handleReset = useCallback(() => {
    setForm(initialData ? { ...EMPTY_CREATE_USER_FORM, ...initialData } : { ...EMPTY_CREATE_USER_FORM });
    setErrors({});
    setSelectedRoleLabels({});
  }, [initialData]);

  return {
    form,
    errors,
    isSubmitting,
    selectedRoleLabels,
    fetchLanguages,
    fetchRoles,
    handleFieldChange,
    addRole,
    removeRole,
    handleSubmit,
    handleReset,
  };
}