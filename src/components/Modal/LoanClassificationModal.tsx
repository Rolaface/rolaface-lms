import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActionIcon,
  Box,
  Fieldset,
  Grid,
  Group,
  Modal,
  NumberInput,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconLayersLinked, IconX, IconMinus } from "@tabler/icons-react";

import type { LoanClassificationData } from "../../types/loanClassification";
import {
  createLoanClassification,
  updateLoanClassification,
} from "../../api/LoanClassificationApi";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { openCommonModal } from "./AlertModal";
import { ModalFooter } from "../shared/ModalFooter";

export type { LoanClassificationData } from "../../types/loanClassification";

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  mode?: "add" | "edit" | "view";
  data?: LoanClassificationData | null;
}

interface LoanClassificationFormState {
  level: string;
  code: string;
  name: string;
  min_dpd_range: string;
  max_dpd_range: string;
  provision_rate: string;
  is_written_off: boolean;
}

const EMPTY_FORM_STATE: LoanClassificationFormState = {
  level: "",
  code: "",
  name: "",
  min_dpd_range: "",
  max_dpd_range: "",
  provision_rate: "",
  is_written_off: false,
};

export function LoanClassificationModal({
  opened,
  onClose,
  onMinimize,
  mode = "add",
  data = null,
}: LoanClassificationModalProps) {
  const isView = mode === "view";
  const queryClient = useQueryClient();

  const title =
    mode === "add"
      ? "New Loan Classification"
      : mode === "edit"
        ? "Edit Loan Classification"
        : "View Loan Classification";

  const [formData, setFormData] = useState<LoanClassificationFormState>(EMPTY_FORM_STATE);

  useEffect(() => {
    if (data) {
      setFormData({
        level: data.level !== undefined && data.level !== null ? String(data.level) : "",
        code: data.code || "",
        name: data.name || "",
        min_dpd_range: data.min_dpd_range !== null ? String(data.min_dpd_range) : "",
        max_dpd_range: data.max_dpd_range !== null ? String(data.max_dpd_range) : "",
        provision_rate: data.provision_rate !== null ? String(data.provision_rate) : "",
        is_written_off: data.is_written_off || false,
      });
    } else if (mode === "add") {
      setFormData(EMPTY_FORM_STATE);
    }
  }, [data, mode]);

  const updateField = <K extends keyof LoanClassificationFormState>(
    field: K,
    value: LoanClassificationFormState[K]
  ) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  // ---------- ALERT HELPERS (same pattern as AddLoanCategoryModal) ----------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showErrorMessage = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body,
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

  const handleModalClose = () => {
    setFormData(EMPTY_FORM_STATE);
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (payload: LoanClassificationData) => createLoanClassification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
      showSuccess("Classification Created", "Loan classification created successfully.");
      handleModalClose();
    },
    onError: (err) => showError("Create Failed", err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LoanClassificationData }) =>
      updateLoanClassification(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
      showSuccess("Classification Updated", "Loan classification updated successfully.");
      handleModalClose();
    },
    onError: (err) => showError("Update Failed", err),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleMinimize = () => {
    onMinimize?.();
  };

  const handleSave = () => {
    if (formData.level === "") {
      showErrorMessage("Validation Error", "Level is required.");
      return;
    }
    if (!formData.code.trim() || !formData.name.trim()) {
      showErrorMessage("Validation Error", "Code and Name are required.");
      return;
    }
    if (formData.min_dpd_range === "" || formData.max_dpd_range === "") {
      showErrorMessage("Validation Error", "Min and Max DPD are required.");
      return;
    }
    if (Number(formData.max_dpd_range) < Number(formData.min_dpd_range)) {
      showErrorMessage("Validation Error", "Max DPD must be greater than or equal to Min DPD.");
      return;
    }
    if (formData.provision_rate === "") {
      showErrorMessage("Validation Error", "Provision rate is required.");
      return;
    }

    const payload: LoanClassificationData = {
      level: Number(formData.level),
      code: formData.code.trim(),
      name: formData.name.trim(),
      min_dpd_range: Number(formData.min_dpd_range),
      max_dpd_range: Number(formData.max_dpd_range),
      provision_rate: Number(formData.provision_rate),
      is_written_off: formData.is_written_off,
    };

    if (mode === "edit" && data?.code) {
      updateMutation.mutate({ id: data.code, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size={640}
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: "flex", flexDirection: "column" },
      }}
    >
      <Box bg="white">
        {/* Header */}
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
              <IconLayersLinked size={20} stroke={1.8} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                {title}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Manage levels and provisioning
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
              onClick={handleModalClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        {/* Body — flat, no card wrappers */}
        <Box px="xl" py="lg" bg="slate.0">
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <Box style={{ display: "flex", flexDirection: "column", gap: "var(--mantine-spacing-md)" }}>
              <Grid gutter="md">
                <Grid.Col span={4}>
                  <NumberInput
                    label="Level"
                    placeholder="1"
                    withAsterisk={!isView}
                    value={formData.level === "" ? "" : Number(formData.level)}
                    onChange={(v) => updateField("level", v === "" ? "" : String(v))}
                    size="sm"
                    radius="md"
                    hideControls
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Classification Code"
                    placeholder="e.g. SUB"
                    withAsterisk={!isView}
                    disabled={isView || mode === "edit"}
                    value={formData.code}
                    onChange={(e) => updateField("code", e.currentTarget.value)}
                    size="sm"
                    radius="md"
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Classification Name"
                    placeholder="e.g. Substandard"
                    withAsterisk={!isView}
                    value={formData.name}
                    onChange={(e) => updateField("name", e.currentTarget.value)}
                    size="sm"
                    radius="md"
                  />
                </Grid.Col>
              </Grid>
              <Grid gutter="md">
                <Grid.Col span={4}>
                  <NumberInput
                    label="From DPD"
                    placeholder="91"
                    withAsterisk={!isView}
                    value={formData.min_dpd_range === "" ? "" : Number(formData.min_dpd_range)}
                    onChange={(v) => updateField("min_dpd_range", v === "" ? "" : String(v))}
                    size="sm"
                    radius="md"
                    hideControls
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="To DPD"
                    placeholder="180"
                    withAsterisk={!isView}
                    value={formData.max_dpd_range === "" ? "" : Number(formData.max_dpd_range)}
                    onChange={(v) => updateField("max_dpd_range", v === "" ? "" : String(v))}
                    size="sm"
                    radius="md"
                    hideControls
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Provision Rate"
                    placeholder="20.00"
                    withAsterisk={!isView}
                    rightSection={<Text size="xs" c="dimmed">%</Text>}
                    value={formData.provision_rate === "" ? "" : Number(formData.provision_rate)}
                    onChange={(v) => updateField("provision_rate", v === "" ? "" : String(v))}
                    size="sm"
                    radius="md"
                    hideControls
                  />
                </Grid.Col>
              </Grid>

              {/* <Switch
                label="Written off"
                checked={formData.is_written_off}
                onChange={(e) => updateField("is_written_off", e.currentTarget.checked)}
                color="brand"
              /> */}
            </Box>
          </Fieldset>
        </Box>

        {/* Footer */}
        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleModalClose}
          onSubmit={handleSave}
          submitLabel="Save"
          submitLoading={isSaving}
        />
      </Box>
    </Modal>
  );
}
