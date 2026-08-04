import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Button,
} from "@mantine/core";
import { IconBriefcase, IconX, IconPercentage, IconChevronDown } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCollateralPayload } from "../../types/collateralForm";
import {
  createCollateral,
  updateCollateral,
  getCollateralById,
} from "../../api/collateralApi";
import { useForm } from "@mantine/form";
import { getAllCollateralTypes } from "../../api/collateralTypeApi";

interface CollateralModalProps {
  opened: boolean;
  onClose: () => void;
  editId?: string | null;
  isView?: boolean;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function CollateralModal({ opened, onClose, editId, isView }: CollateralModalProps) {
  const form = useForm({
  initialValues: {
    code: "",
    name: "",
    type: "",
    haircut: 0,
    originalValue: "" as number | "",
    ltv: "" as number | "",
    disabled: false,
  },
  validate: {
    code: (v) => (!v ? "Collateral Code is required" : null),
    name: (v) => (!v ? "Collateral Name is required" : null),
    type: (v) => (!v ? "Collateral Type is required" : null),
    originalValue: (v) => (!v ? "Original Collateral Value is required" : null),
    ltv: (v) => (!v ? "Loan To Value Ratio is required" : null),
  },
});

  const queryClient = useQueryClient();

const { data: editDetailsResponse, isLoading: isEditLoading, refetch } = useQuery({
  queryKey: ["collateral", editId],
  queryFn: () => getCollateralById(editId as string),
  enabled: opened && !!editId,
});

  useEffect(() => {
    if (opened && editId && editDetailsResponse) {
      const item = editDetailsResponse.data || editDetailsResponse.message?.data || editDetailsResponse;

     form.setValues({
  code: item.loan_security_code || "",
  name: item.loan_security_name || "",
  type: item.loan_security_type || "",
  haircut: item.haircut ?? 0,
  originalValue: item.original_security_value ?? "",
  ltv: item.loan_to_value_ratio ?? "",
  disabled: item.disabled === 1,
});
    } else if (opened && !editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

  const createMutation = useMutation({
    mutationFn: createCollateral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaterals"] });
      handleReset();
      onClose();
    },
  });

const updateMutation = useMutation({
  mutationFn: updateCollateral,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["collaterals"] });
    queryClient.invalidateQueries({ queryKey: ["collateral", editId] });
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

  const payload: CreateCollateralPayload = {
    loan_security_code: form.values.code,
    loan_security_type: form.values.type,
    loan_security_name: form.values.name,
    haircut: form.values.haircut,
    loan_to_value_ratio: Number(form.values.ltv) || 0,
    original_security_value: Number(form.values.originalValue) || 0,
    disabled: form.values.disabled ? 1 : 0,
  };

  if (editId) {
    updateMutation.mutate({ id: editId, payload });
  } else {
    createMutation.mutate(payload);
  }
};

  const isPending = createMutation.isPending || updateMutation.isPending || isEditLoading;
  const { data: collateralTypesResponse, isLoading: isTypesLoading } = useQuery({
  queryKey: ["collateralTypes"],
  queryFn: getAllCollateralTypes,
  enabled: opened,
});

const collateralTypeOptions = useMemo(() => {
  const list = collateralTypesResponse?.data || collateralTypesResponse?.message?.data || collateralTypesResponse || [];
  if (!Array.isArray(list)) return [];
  return list.map((item: any) => item.loan_security_type);
}, [collateralTypesResponse]);

const handleReset = () => {
  form.reset();
};

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="750px"
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
              <IconBriefcase size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                {editId ? (isView ? "View Collateral" : "Edit Collateral") : "New Collateral"}
              </Text>
              <Text size="xs" c="dimmed">
                Define collateral details, valuation metrics, and status.
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
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
             <TextInput
  size="xs"
  label="Collateral Code"
  placeholder="Enter code"
  withAsterisk
  classNames={labelClass}
  {...form.getInputProps("code")}
/>

<Select
  size="xs"
  label="Collateral Type"
  placeholder={isTypesLoading ? "Loading..." : "Select type"}
  withAsterisk
  data={collateralTypeOptions}
  disabled={isTypesLoading}
  searchable
  rightSection={<IconChevronDown size={14} className="text-gray-500" />}
  classNames={labelClass}
  {...form.getInputProps("type")}
/>

<div className="col-span-2">
  <TextInput
    size="xs"
    label="Collateral Name"
    placeholder="Enter full name"
    withAsterisk
    classNames={labelClass}
    {...form.getInputProps("name")}
  />
</div>

<NumberInput
  size="xs"
  label="Original Collateral Value"
  placeholder="0.00"
  thousandSeparator=","
  hideControls
  classNames={labelClass}
  {...form.getInputProps("originalValue")}
/>

<NumberInput
  size="xs"
  label="Loan To Value Ratio"
  placeholder="0.00"
  hideControls
  rightSection={<IconPercentage size={13} className="text-gray-400" />}
  classNames={labelClass}
  {...form.getInputProps("ltv")}
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
  {...form.getInputProps("haircut")}
/>

<div className="flex items-center pt-6">
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
              {editId ? "Update Collateral" : "Save Collateral"}
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
}