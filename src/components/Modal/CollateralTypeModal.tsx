import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconCategory, IconX, IconPercentage } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCollateralTypePayload } from "../../types/collateralTypeForm";
import {
  createCollateralType,
  updateCollateralType,
  getCollateralTypeById,
} from "../../api/collateralTypeApi";
import { useForm } from "@mantine/form";

interface CollateralTypeModalProps {
  opened: boolean;
  onClose: () => void;
  editId?: string | null;
  isView?: boolean;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralTypeModal({ opened, onClose, editId, isView }: CollateralTypeModalProps) {
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

  // const { data: editDetailsResponse, isLoading: isEditLoading } = useQuery({
  //   queryKey: ["collateralType", editId],
  //   queryFn: () => getCollateralTypeById(editId as string),
  //   enabled: opened && !!editId,
  // });
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

  const createMutation = useMutation({
    mutationFn: createCollateralType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collateralTypes"] });
      handleReset();
      onClose();
    },
  });

 const updateMutation = useMutation({
  mutationFn: updateCollateralType,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["collateralTypes"] });
    queryClient.invalidateQueries({ queryKey: ["collateralType", editId] });
    handleReset();
    onClose();
  },
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

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="850px"
      withCloseButton={false}
      padding={0}
      radius="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconCategory size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                {editId ? (isView ? "View Collateral Type" : "Edit Collateral Type") : "New Collateral Type"}
              </Text>
              <Text size="xs" c="dimmed">
                Define collateral category parameters and limits.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={handleClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body */}
        <div className="flex-1 p-6">
          <fieldset disabled={isView} className="border-0 p-0 m-0">
            <div className="flex flex-wrap sm:flex-nowrap items-end gap-5">
             <TextInput
  size="xs"
  label="Collateral Type"
  placeholder="e.g. Real Estate"
  withAsterisk
  classNames={labelClass}
  className="flex-1"
  {...form.getInputProps("type")}
/>

<NumberInput
  size="xs"
  label="Haircut %"
  placeholder="0.000"
  decimalScale={3}
  fixedDecimalScale
  hideControls
  rightSection={<IconPercentage size={13} className="text-gray-400" />}
  classNames={labelClass}
  className="flex-1"
  {...form.getInputProps("haircut")}
/>

<NumberInput
  size="xs"
  label="Loan To Value Ratio"
  placeholder="0.00"
  hideControls
  rightSection={<IconPercentage size={13} className="text-gray-400" />}
  classNames={labelClass}
  className="flex-1"
  {...form.getInputProps("ltv")}
/>

<div className="pb-[6px]">
  <Checkbox
    size="xs"
    label="Disabled"
    color="indigo"
    styles={{ label: { color: '#374151', fontWeight: 500 } }}
    {...form.getInputProps("disabled", { type: "checkbox" })}
  />
</div>
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
          <Button size="xs" variant="default" onClick={handleClose} className="font-semibold px-5">
            {isView ? "Close" : "Cancel"}
          </Button>

          {!isView && (
            <Button
              size="xs"
              disabled={isPending}
              loading={isPending}
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              {editId ? "Update Type" : "Save Type"}
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
}