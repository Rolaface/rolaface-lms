import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Grid,
  Modal,
  NumberInput,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { IconFileText, IconX } from "@tabler/icons-react";

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
    <Modal opened={opened} onClose={onClose} size="lg" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col">
        <Box color="brand" className=" px-5 py-3 flex justify-between items-center rounded-t-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1 rounded-md shrink-0">
              <IconFileText size={22} className="text-white" />
            </div>
            <Text size="md" fw={600} className="leading-tight truncate">
              {title}
            </Text>
          </div>
          <Button variant="subtle" onClick={onClose} className="text-white hover:bg-white/10 px-2" size="xs">
            <IconX size={18} />
          </Button>
        </Box>

        {/* Body */}
        <fieldset disabled={isView} className="border-0 p-0 m-0">
          <Box className="flex flex-col gap-5 px-6 py-6">
            {/* Classification Identity */}
            <Box className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" className="tracking-wide">
                Classification Identity
              </Text>

              <Grid gutter="md">
                <Grid.Col span={3}>
                  <NumberInput
                    label="Level"
                    placeholder="1"
                    withAsterisk={!isView}
                    value={formData.level === "" ? "" : Number(formData.level)}
                    onChange={(v) => updateField("level", v === "" ? "" : String(v))}
                    size="sm"
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
                  />
                </Grid.Col>
              </Grid>
            </Box>

            {/* Delinquency Configuration */}
            <Box className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" className="tracking-wide">
                Delinquency Configuration
              </Text>

              <Grid gutter="md">
                <Grid.Col span={4}>
                  <NumberInput
                    label="From DPD"
                    placeholder="91"
                    withAsterisk={!isView}
                    value={formData.min_dpd_range === "" ? "" : Number(formData.min_dpd_range)}
                    onChange={(v) => updateField("min_dpd_range", v === "" ? "" : String(v))}
                    size="sm"
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
                  />
                </Grid.Col>
              </Grid>

              <Switch
                label="Written off"
                checked={formData.is_written_off}
                onChange={(e) => updateField("is_written_off", e.currentTarget.checked)}
                color="indigoAlt"
              />
            </Box>

            {formError && !isView && (
              <Text size="xs" c="red" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-medium">
                {formError}
              </Text>
            )}
          </Box>
        </fieldset>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 p-3 px-5 flex justify-end items-center gap-3 shrink-0 rounded-b-md">
          <Button
            size="sm"
            variant="default"
            onClick={onClose}
            disabled={isSaving}
            className="font-semibold px-5 text-slate-700 border-slate-200"
          >
            {isView ? "Close" : "Cancel"}
          </Button>

          {!isView && (
            <Button
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold px-6"
            >
              Save Classification
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
}