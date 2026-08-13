import { useEffect } from "react";
import {
  Box,
  Text,
  TextInput,
  NumberInput,
  Checkbox,
  Group,
  Fieldset,
} from "@mantine/core";
import { IconShieldCheck, IconPercentage } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCollateralTypePayload } from "../../types/collateralTypeForm";
import {
  createCollateralType,
  updateCollateralType,
  getCollateralTypeById,
} from "../../api/collateralTypeApi";
import { useForm } from "@mantine/form";
import { ModalFooter } from "../shared/ModalFooter";
import { MinimizableModal } from "../shared/MinimizableModal";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { useModalStore } from "../../store/ModalStore";

interface CollateralTypeModalProps {
  modalId: string;
  opened: boolean;
  onClose: () => void;
  editId?: string | null;
  isView?: boolean;
}

export function CollateralTypeModal({ modalId, opened, onClose, editId, isView }: CollateralTypeModalProps) {
  const form = useForm({
    initialValues: {
      type: "",
      haircut: 0,
      ltv: "" as number | "",
      disabled: false,
    },
    validate: {
      type: (v) => (!v ? "Collateral Type is required" : null),
      ltv: (v) => (!v ? "Loan To Value Ratio is required" : null),
    },
  });

  const queryClient = useQueryClient();

  const { data: editDetailsResponse, isLoading: isEditLoading, refetch } = useQuery({
    queryKey: ["collateralType", editId],
    queryFn: () => getCollateralTypeById(editId as string),
    enabled: opened && !!editId,
  });

  const handleReset = () => {
    form.reset();
  };

  useEffect(() => {
    if (opened && editId && editDetailsResponse) {
      const item = editDetailsResponse.data || editDetailsResponse.message?.data || editDetailsResponse;

      form.setValues({
        type: item.loan_security_type || "",
        haircut: item.haircut ?? 0,
        ltv: item.loan_to_value_ratio ?? "",
        disabled: item.disabled === 1,
      });
    } else if (opened && !editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

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

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const notifyContextSuccess = () => {
    useModalStore.getState().getModalContext(modalId)?.onSuccess?.();
  };

  const createMutation = useMutation({
    mutationFn: createCollateralType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collateralTypes"] });
      notifyContextSuccess();
      showSuccess("Collateral Type Created", "Collateral type created successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateCollateralType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collateralTypes"] });
      queryClient.invalidateQueries({ queryKey: ["collateralType", editId] });
      notifyContextSuccess();
      showSuccess("Collateral Type Updated", "Collateral type updated successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Update Failed", error),
  });

  useEffect(() => {
    if (opened && editId) {
      refetch();
    }
  }, [opened, editId]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    const payload: CreateCollateralTypePayload = {
      loan_security_type: form.values.type,
      haircut: form.values.haircut,
      loan_to_value_ratio: Number(form.values.ltv) || 0,
      disabled: form.values.disabled ? 1 : 0,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isEditLoading;

  const headerTitle = editId ? (isView ? "View Collateral Type" : "Edit Collateral Type") : "New Collateral Type";

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={opened}
      onClose={handleClose}
      title={headerTitle}
      subtitle="Define collateral category parameters and limits"
      icon={IconShieldCheck}
      maxWidth="lg"
      height="420px"
      footer={
        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel={editId ? "Update" : "Save "}
          submitLoading={isPending}
          submitDisabled={isPending}
        />
      }
    >
      <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
        <Group align="flex-end" gap="md" grow wrap="wrap">
          <TextInput
            size="sm"
            radius="md"
            label="Collateral Type"
            placeholder="e.g. Real Estate"
            withAsterisk
            styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)', marginBottom: 4 } }}
            {...form.getInputProps("type")}
          />

          <NumberInput
            size="sm"
            radius="md"
            label="Haircut %"
            placeholder="0.000"
            decimalScale={3}
            fixedDecimalScale
            hideControls
            rightSection={<IconPercentage size={13} color="var(--mantine-color-slate-4)" />}
            styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)', marginBottom: 4 } }}
            {...form.getInputProps("haircut")}
          />

          <NumberInput
            size="sm"
            radius="md"
            label="Loan To Value Ratio"
            placeholder="0.00"
            withAsterisk
            hideControls
            rightSection={<IconPercentage size={13} color="var(--mantine-color-slate-4)" />}
            styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)', marginBottom: 4 } }}
            {...form.getInputProps("ltv")}
          />
        </Group>

        <Checkbox
          mt="lg"
          size="sm"
          label="Disabled"
          color="brand"
          styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)' } }}
          {...form.getInputProps("disabled", { type: "checkbox" })}
        />
      </Fieldset>
    </MinimizableModal>
  );
}