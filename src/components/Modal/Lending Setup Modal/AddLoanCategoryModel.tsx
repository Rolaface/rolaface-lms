import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Modal,
  ActionIcon,
  ThemeIcon,
  Group,
  TextInput,
} from "@mantine/core";
import { IconX, IconCategory, IconCheck } from "@tabler/icons-react";
import { ModalFooter } from "../../shared/ModalFooter";
import { showApiError, showSuccess } from "../../../utils/alert";

export interface LoanCategoryFormData {
  code: string;
  name: string;
}

interface AddLoanCategoryModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (data: LoanCategoryFormData) => void | Promise<void>;
  loading?: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
}

const initialState: LoanCategoryFormData = { code: "", name: "" };

export function AddLoanCategoryModal({
  opened,
  onClose,
  onSave,
  loading = false,
}: AddLoanCategoryModalProps) {
  const [form, setForm] = useState<LoanCategoryFormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (opened) {
      setForm(initialState);
      setErrors({});
      setErrorMessage(undefined);
    }
  }, [opened]);

  const handleChange = (field: keyof LoanCategoryFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.code.trim()) newErrors.code = "Loan Category Code is required.";
    if (!form.name.trim()) newErrors.name = "Loan Category Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setForm(initialState);
    setErrors({});
    setErrorMessage(undefined);
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(undefined);
    if (!validate()) return;

    try {
      await onSave({ code: form.code.trim(), name: form.name.trim() });
      showSuccess("Loan category created successfully.");
      handleClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to save the loan category. Please try again.";
      setErrorMessage(msg);
      showApiError(msg);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={600}
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: "flex", flexDirection: "column" },
      }}
    >
      <Box bg="white">
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: "1px solid var(--mantine-color-brand-7)" }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconCategory size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Add Loan Category
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Create a new loan category for your organization
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={handleClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {/* Body */}
        <Box px="xl" py="lg" bg="slate.0">
          <Group grow align="flex-start" gap="md">
            <TextInput
              label="Loan Category Code"
              withAsterisk
              radius="md"
              placeholder="e.g. HOME"
              value={form.code}
              onChange={(e) => handleChange("code", e.currentTarget.value.toUpperCase())}
              error={errors.code}
              styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
              data-autofocus
            />
            <TextInput
              label="Loan Category Name"
              withAsterisk
              radius="md"
              placeholder="Enter category name"
              value={form.name}
              onChange={(e) => handleChange("name", e.currentTarget.value)}
              error={errors.name}
              styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
            />
          </Group>
        </Box>

        {/* Footer */}
        <ModalFooter
          variant="theme"
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel="Save"
          submitLoading={loading}
          errorMessage={errorMessage}
        />
      </Box>
    </Modal>
  );
}

export default AddLoanCategoryModal;