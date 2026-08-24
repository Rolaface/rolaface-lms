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
import { IconX, IconCategory ,IconMinus} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ModalFooter } from "../../shared/ModalFooter";
import { openCommonModal } from "../AlertModal";
import {
  createLoanCategory,
  updateLoanCategory,
} from "../../../api/loanCategoryApi";
import { parseFrappeError } from "../../../utils/parseFrappeError";

export interface LoanCategoryFormData {
  code: string;
  name: string;
}

interface AddLoanCategoryModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  initialData?: LoanCategoryFormData | null;
  isView?: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
}

const initialState: LoanCategoryFormData = { code: "", name: "" };

export function AddLoanCategoryModal({
  opened,
  onClose,
  onMinimize,
  editId,
  initialData,
  isView = false,
}: AddLoanCategoryModalProps) {
  const [form, setForm] = useState<LoanCategoryFormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editId && initialData) {
      setForm(initialData);
    } else if (!editId) {
      setForm(initialState);
    }
    setErrors({});
  }, [editId, initialData]);

  const handleModalClose = () => {
    setForm(initialState);
    setErrors({});
    onClose();
  };

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
    onClose();
  };
 const handleMinimize = () => {
    onMinimize?.();
  };
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const createMutation = useMutation({
    mutationFn: createLoanCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanCategories"] });
      showSuccess("Category Created", "Loan category created successfully.");
      handleClose();
    },
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateLoanCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanCategories"] });
      showSuccess("Category Updated", "Loan category updated successfully.");
      handleClose();
    },
    onError: (error: any) => showError("Update Failed", error),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (isView) return; // safety guard — never call API in view mode
    if (!validate()) return;

    if (editId) {
      updateMutation.mutate({
        name: editId,
        loan_category_name: form.name.trim(),
      });
    } else {
      createMutation.mutate({
        loan_category_code: form.code.trim(),
        loan_category_name: form.name.trim(),
      });
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
                {isView ? "View Loan Category" : editId ? "Edit Loan Category" : "New Loan Category"}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {isView
                  ? "Loan category details"
                  : editId
                  ? "Update the loan category name"
                  : "Create a new loan category for your organization"}
              </Text>
            </Box>
          </Group>
                <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleMinimize}
              aria-label="Minimize"
            >
              <IconMinus size={16} color="white" />
            </ActionIcon>
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
        </Group>

        {/* Body */}
        <Box px="xl" py="lg" bg="slate.0">
          <Group align="flex-start" gap="md" wrap="nowrap">
            <TextInput
              label="Category Code"
              withAsterisk
              radius="md"
              placeholder="e.g. HOME"
              value={form.code}
              disabled={!!editId || isView}
              onChange={(e) => handleChange("code", e.currentTarget.value.toUpperCase())}
              error={errors.code}
              styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
              data-autofocus
              style={{ flex: 1 }}
            />
            <TextInput
              label="Category Name"
              withAsterisk
              radius="md"
              placeholder="Enter category name"
              value={form.name}
              disabled={isView}
              onChange={(e) => handleChange("name", e.currentTarget.value)}
              error={errors.name}
              styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
              style={{ flex: 2 }}
            />
          </Group>
        </Box>

        {/* Footer */}
        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel={editId ? "Update" : "Save"}
          submitLoading={isPending}
        />
      </Box>
    </Modal>
  );
}

export default AddLoanCategoryModal;
