import { useEffect, useMemo } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  ThemeIcon,
  Group,
  Fieldset,
  Divider,
  Grid,
  ActionIcon,
} from "@mantine/core";
import {
  IconShieldLock,
  IconX,
  IconPercentage,
  IconChevronDown,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import type { CreateCollateralPayload } from "../../types/collateralForm";
import {
  createCollateral,
  updateCollateral,
  getCollateralById,
} from "../../api/collateralApi";
import { getAllCollateralTypes } from "../../api/collateralTypeApi";
import { ModalFooter } from "../shared/ModalFooter";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";



interface CollateralModalProps {
  opened: boolean;
  onClose: () => void;
  editId?: string | null;
  isView?: boolean;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

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

  const createMutation = useMutation({
    mutationFn: createCollateral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaterals"] });
      showSuccess("Collateral Created", "Collateral created successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateCollateral,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaterals"] });
      queryClient.invalidateQueries({ queryKey: ["collateral", editId] });
      showSuccess("Collateral Updated", "Collateral updated successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Update Failed", error),
  });

  useEffect(() => {
    if (opened && editId) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId]);

  const handleReset = () => {
    form.reset();
  };

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
    const list =
      collateralTypesResponse?.data || collateralTypesResponse?.message?.data || collateralTypesResponse || [];
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => item.loan_security_type);
  }, [collateralTypesResponse]);

  const headerTitle = editId ? (isView ? "View Collateral" : "Edit Collateral") : "New Collateral";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={720}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
        },
      }}
    >
      <Box style={{ display: "flex", flexDirection: "column" }} bg="white">
        {/* Header — same gradient banner treatment as the Customer wizard modal,
            driven by theme.other tokens instead of hard-coded hex values. */}
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconShieldLock size={16} />
            </ThemeIcon>
            <Box>
              <Text
                size="md"
                fw={700}
                c="white"
                style={{ color: "var(--mantine-color-white)", letterSpacing: "-0.01em" }}
              >
                {headerTitle}
              </Text>
              <Text size="xs" fw={500} c="brand.1" style={{ color: "var(--mantine-color-brand-1)" }}>
                Valuation, haircut & LTV details
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
        <Box px="xl" py="lg" bg="slate.0" style={{ flex: 1 }}>
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <Grid gutter="lg">
              {/* Code, Type, Name now share a single row (span 4 each) */}
              <Grid.Col span={4}>
                <TextInput
                  size="sm"
                  radius="md"
                  label="Collateral Code"
                  placeholder="Enter code"
                  withAsterisk
                  {...form.getInputProps("code")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  size="sm"
                  radius="md"
                  label="Collateral Type"
                  placeholder={isTypesLoading ? "Loading..." : "Select type"}
                  withAsterisk
                  data={collateralTypeOptions}
                  disabled={isTypesLoading}
                  searchable
                  rightSection={chevronDown}
                  {...form.getInputProps("type")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  size="sm"
                  radius="md"
                  label="Collateral Name"
                  placeholder="Enter full name"
                  withAsterisk
                  {...form.getInputProps("name")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  size="sm"
                  radius="md"
                  withAsterisk
                  label="Original Collateral Value"
                  placeholder="0.00"
                  thousandSeparator=","
                  hideControls
                  {...form.getInputProps("originalValue")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  size="sm"
                  radius="md"
                  withAsterisk
                  label="Loan To Value Ratio"
                  placeholder="0.00"
                  hideControls
                  rightSection={<IconPercentage size={13} color="var(--mantine-color-slate-4)" />}
                  {...form.getInputProps("ltv")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  size="sm"
                  radius="md"
                  label="Haircut %"
                  placeholder="0.000"
                  decimalScale={3}
                  fixedDecimalScale
                  hideControls
                  rightSection={<IconPercentage size={13} color="var(--mantine-color-slate-4)" />}
                  {...form.getInputProps("haircut")}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Divider color="slate.2" my={4} />
                <Checkbox
                  size="sm"
                  radius="sm"
                  color="brand"
                  label="Disabled"
                  mt="sm"
                  {...form.getInputProps("disabled", { type: "checkbox" })}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>
        </Box>
        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel={editId ? "Update" : "Save "}
          submitLoading={isPending}
          submitDisabled={isPending}
        />
      </Box>
    </Modal>
  );
}