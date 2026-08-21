import { useState, useCallback, useEffect } from "react";
import type { CreateUserFormData } from "../../types/User/createUser";
import { EMPTY_CREATE_USER_FORM } from "../../types/User/createUser";
import { getUserRoles } from "../../api/User/roleApi";
import { getLanguages } from "../../api/User/userApi";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";

type FormErrors = Partial<Record<keyof CreateUserFormData, string>>;

function validateForm(form: CreateUserFormData): FormErrors {
  const errors: FormErrors = {};
  // required-field checks removed per earlier request; format check stays
  // only if the person actually typed something in Email
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
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
    } catch (error) {
      openCommonModal({
        heading: "Error",
        body: parseFrappeError(error),
        color: "danger",
        buttons: [{ label: "OK" }],
      });
      return [];
    }
  }, []);

  const fetchRoles = useCallback(async (search: string): Promise<SelectOption[]> => {
    try {
      const res = await getUserRoles(search || undefined, 1, 30);
      if (res.status !== "success") return [];
      return res.data.map((r) => ({ value: r.Id, label: r.roleName }));
    } catch (error) {
      openCommonModal({
        heading: "Error",
        body: parseFrappeError(error),
        color: "danger",
        buttons: [{ label: "OK" }],
      });
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
      openCommonModal({
        heading: "Error",
        body: parseFrappeError(error),
        color: "danger",
        buttons: [{ label: "OK" }],
      });
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