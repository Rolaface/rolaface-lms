import { useEffect } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Checkbox,
  ActionIcon,
  ThemeIcon,
  Group,
  Fieldset,
  Button,
  useMantineTheme,
} from "@mantine/core";
import { IconX, IconPercentage, IconBox, IconMinus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCollateralTypePayload } from "../../types/collateralTypeForm";
import {
  createCollateralType,
  updateCollateralType,
  getCollateralTypeById,
} from "../../api/collateralTypeApi";
import { useForm } from "@mantine/form";
import { ModalFooter } from "../shared/ModalFooter";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";

export interface CollateralTypeModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  isView?: boolean;
}

export function CollateralTypeModal({
  opened,
  onClose,
  onMinimize,
  editId,
  isView,
}: CollateralTypeModalProps) {
  const theme = useMantineTheme();

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

  const createMutation = useMutation({
    mutationFn: createCollateralType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collateralTypes"] });
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

  const handleMinimize = () => {
    onMinimize?.();
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
    <Modal
      opened={opened}
      onClose={handleClose}
      size={720}
      padding={0}
      radius="lg"
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        body: { padding: 0 },
      }}
    >
      <Box bg="white">
        {/* Header — same solid brand.6 bar as Customer / Loan Product modals */}
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
              <IconBox size={16} />
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
                Define collateral category parameters and limits
              </Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleMinimize}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconMinus size={18} />
            </Button>
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
        <Box p="xl" bg="slate.0">
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

            {/* <Checkbox
              mt="lg"
              size="sm"
              label="Disabled"
              color="brand"
              styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)' } }}
              {...form.getInputProps("disabled", { type: "checkbox" })}
            /> */}
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