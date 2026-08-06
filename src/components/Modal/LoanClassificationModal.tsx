import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActionIcon,
  Box,
  Button,
  Fieldset,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconFileText, IconX } from "@tabler/icons-react";

import { GradientButton } from "../shared/customer/Shared";
import type { LoanClassificationData } from "../../types/loanClassification";
import {
  createLoanClassification,
  updateLoanClassification,
} from "../../api/LoanClassificationApi";
import { parseFrappeError } from "../../utils/parseFrappeError";

export type { LoanClassificationData } from "../../types/loanClassification";

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper
      radius="md"
      p="md"
      style={{
        background: 'var(--mantine-color-slate-0)',
        border: '1px solid var(--mantine-color-slate-2)',
      }}
    >
      <Text fz="xs" fw={700} c="slate.5" tt="uppercase" style={{ letterSpacing: '0.04em' }} mb="sm">
        {title}
      </Text>
      {children}
    </Paper>
  );
}

export function LoanClassificationModal({
  opened,
  onClose,
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
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && data) {
      setFormData({
        level: data.level !== undefined && data.level !== null ? String(data.level) : "",
        code: data.code || "",
        name: data.name || "",
        min_dpd_range: data.min_dpd_range !== null ? String(data.min_dpd_range) : "",
        max_dpd_range: data.max_dpd_range !== null ? String(data.max_dpd_range) : "",
        provision_rate: data.provision_rate !== null ? String(data.provision_rate) : "",
        is_written_off: data.is_written_off || false,
      });
    } else if (opened && mode === "add") {
      setFormData(EMPTY_FORM_STATE);
    }
    setFormError(null);
  }, [opened, data, mode]);

  const updateField = <K extends keyof LoanClassificationFormState>(
    field: K,
    value: LoanClassificationFormState[K]
  ) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const createMutation = useMutation({
    mutationFn: (payload: LoanClassificationData) => createLoanClassification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
      onClose();
    },
    onError: (err) => {
      console.error("Create loan classification failed:", err);
      setFormError(parseFrappeError(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LoanClassificationData }) =>
      updateLoanClassification(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
      onClose();
    },
    onError: (err) => {
      console.error("Update loan classification failed:", err);
      setFormError(parseFrappeError(err));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    setFormError(null);

    if (formData.level === "") {
      setFormError("Level is required.");
      return;
    }
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Code and Name are required.");
      return;
    }
    if (formData.min_dpd_range === "" || formData.max_dpd_range === "") {
      setFormError("Min and Max DPD are required.");
      return;
    }
    if (Number(formData.max_dpd_range) < Number(formData.min_dpd_range)) {
      setFormError("Max DPD must be greater than or equal to Min DPD.");
      return;
    }
    if (formData.provision_rate === "") {
      setFormError("Provision rate is required.");
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
      onClose={onClose}
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
        {/* Header — same brand.6 bar + ThemeIcon + close pattern as CustomerModal */}
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
              <IconFileText size={16} />
            </ThemeIcon>
            <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
              {title}
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {/* Body */}
        <Box px="xl" py="lg" bg="slate.0">
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <Box style={{ display: "flex", flexDirection: "column", gap: "var(--mantine-spacing-md)" }}>
              <SectionCard title="Classification Identity">
                <Grid gutter="md">
                  <Grid.Col span={3}>
                    <NumberInput
                      label="Level"
                      placeholder="1"
                      withAsterisk={!isView}
                      value={formData.level === "" ? "" : Number(formData.level)}
                      onChange={(v) => updateField("level", v === "" ? "" : String(v))}
                      size="sm"
                      radius="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={4.5}>
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
                  <Grid.Col span={4.5}>
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
              </SectionCard>

              <SectionCard title="Delinquency Configuration">
                <Grid gutter="md" mb="sm">
                  <Grid.Col span={4}>
                    <NumberInput
                      label="From DPD"
                      placeholder="91"
                      withAsterisk={!isView}
                      value={formData.min_dpd_range === "" ? "" : Number(formData.min_dpd_range)}
                      onChange={(v) => updateField("min_dpd_range", v === "" ? "" : String(v))}
                      size="sm"
                      radius="md"
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
                    />
                  </Grid.Col>
                </Grid>

                <Switch
                  label="Written off"
                  checked={formData.is_written_off}
                  onChange={(e) => updateField("is_written_off", e.currentTarget.checked)}
                  color="brand"
                />
              </SectionCard>

              {formError && !isView && (
                <Text
                  size="xs"
                  fw={600}
                  c="danger"
                  style={{
                    border: "1px solid var(--mantine-color-danger-2)",
                    background: "var(--mantine-color-danger-0)",
                    borderRadius: "var(--mantine-radius-md)",
                    padding: "8px 12px",
                  }}
                >
                  {formError}
                </Text>
              )}
            </Box>
          </Fieldset>
        </Box>

        {/* Footer */}
        <Group
          justify="flex-end"
          px="xl"
          py="md"
          gap="sm"
          style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Button variant="subtle" color="slate" onClick={onClose} disabled={isSaving}>
            {isView ? "Close" : "Cancel"}
          </Button>
          {!isView && (
            <GradientButton
              px="xl"
              onClick={handleSave}
              loading={isSaving}
              rightSection={!isSaving ? <IconCheck size={14} /> : undefined}
            >
              Save Classification
            </GradientButton>
          )}
        </Group>
      </Box>
    </Modal>
  );
}