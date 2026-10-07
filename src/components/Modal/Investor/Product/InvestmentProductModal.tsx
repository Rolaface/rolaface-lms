import { useEffect } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  ThemeIcon,
  Group,
  Fieldset,
  SimpleGrid,
  Button,
  useMantineTheme,
} from "@mantine/core";
import {
  IconPackage,
  IconX,
  IconPercentage,
  IconChevronDown,
  IconMinus,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import type { CreateInvestmentProductPayload } from "../../../../types/Investor/investmentProductForm";
import {
  createInvestmentProduct,
  updateInvestmentProduct,
  getInvestmentProductById,
} from "../../../../api/Investor/productApi";
import { ModalFooter } from "../../../shared/ModalFooter";
import { openCommonModal } from "../../AlertModal";
import { parseFrappeError } from "../../../../utils/parseFrappeError";

export interface InvestmentProductModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  isView?: boolean;
}

/** Same options as the "Payout Frequency" field of the Custom Investment Product doctype. */
export const PAYOUT_FREQUENCIES = ["Monthly", "Weekly", "Bi-Weekly", "Quarterly", "Yearly"];

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

// Same field look for every input: bold label, white input, slate border.
const FIELD_STYLES = {
  label: {
    fontWeight: 700,
    fontSize: "var(--mantine-font-size-sm)",
    color: "var(--mantine-color-slate-7)",
    marginBottom: 6,
  },
  input: {
    background: "var(--mantine-color-white)",
    border: "1px solid var(--mantine-color-slate-2)",
  },
};

export function InvestmentProductModal({
  opened,
  onClose,
  onMinimize,
  editId,
  isView,
}: InvestmentProductModalProps) {
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      name: "",
      rate: "" as number | "",
      tenure: "" as number | "",
      frequency: "Monthly",
      minAmount: "" as number | "",
      disabled: false,
    },
    validate: {
      name: (v) => (!v.trim() ? "Enter the product name." : null),
      rate: (v) =>
        !(Number(v) > 0) || Number(v) > 100 ? "Enter a valid interest rate." : null,
      tenure: (v) =>
        !(Number(v) > 0) || !Number.isInteger(Number(v))
          ? "Enter the tenure in whole months."
          : null,
      frequency: (v) => (!v ? "Select the payout frequency." : null),
      minAmount: (v) => (!(Number(v) > 0) ? "Enter a valid minimum investment." : null),
    },
  });

  const queryClient = useQueryClient();

  const { data: editDetailsResponse, isLoading: isEditLoading, refetch } = useQuery({
    queryKey: ["investmentProduct", editId],
    queryFn: () => getInvestmentProductById(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (editId && editDetailsResponse) {
      const item =
        editDetailsResponse.data || editDetailsResponse.message?.data || editDetailsResponse;

      // tenure / interest_rate / minimum_investment are stored as text in Frappe.
      const toNumber = (value: unknown): number | "" =>
        value === null || value === undefined || value === "" || Number.isNaN(Number(value))
          ? ""
          : Number(value);

      form.setValues({
        name: item.product_name || "",
        rate: toNumber(item.interest_rate),
        tenure: toNumber(item.tenure),
        frequency: item.payout_frequency || "Monthly",
        minAmount: toNumber(item.minimum_investment),
        disabled: item.disabled === 1,
      });
    } else if (!editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editDetailsResponse]);

  // ---------- ALERT HELPERS (same pattern as CollateralModal) ----------
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
    mutationFn: createInvestmentProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      showSuccess("Investment Product Created", "Investment product created successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateInvestmentProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      queryClient.invalidateQueries({ queryKey: ["investmentProduct", editId] });
      showSuccess("Investment Product Updated", "Investment product updated successfully.");
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Update Failed", error),
  });

  useEffect(() => {
    if (editId && opened) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, opened]);

  const handleReset = () => {
    form.reset();
  };

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

    const payload: CreateInvestmentProductPayload = {
      product_name: form.values.name.trim(),
      tenure: String(form.values.tenure),
      minimum_investment: String(form.values.minAmount),
      interest_rate: String(form.values.rate),
      payout_frequency: form.values.frequency,
      disabled: form.values.disabled ? 1 : 0,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isEditLoading;

  const headerTitle = editId
    ? isView
      ? "View Investment Product"
      : "Edit Investment Product"
    : "New Investment Product";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={640}
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
        {/* Header — same banner as CollateralModal */}
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: "var(--mantine-color-white)",
              }}
            >
              <IconPackage size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {headerTitle}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Define the rate, tenure and payout.
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
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
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        {/* Body */}
        <Box px="xl" py="lg" bg="slate.0" style={{ flex: 1 }}>
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="lg">
              <TextInput
                label="Product name"
                placeholder="e.g. Steady Income NCD"
                withAsterisk
                size="sm"
                radius="md"
                styles={FIELD_STYLES}
                style={{ gridColumn: "1 / -1" }}
                {...form.getInputProps("name")}
              />

              <NumberInput
                label="Interest rate (% p.a.)"
                placeholder="0.00"
                withAsterisk
                size="sm"
                radius="md"
                hideControls
                min={0}
                styles={FIELD_STYLES}
                rightSection={<IconPercentage size={14} color="var(--mantine-color-slate-4)" />}
                {...form.getInputProps("rate")}
              />

              <NumberInput
                label="Tenure (months)"
                placeholder="0"
                withAsterisk
                size="sm"
                radius="md"
                hideControls
                min={0}
                allowDecimal={false}
                styles={FIELD_STYLES}
                rightSectionWidth={40}
                rightSection={
                  <Text fz="xs" c="slate.4">
                    mo
                  </Text>
                }
                {...form.getInputProps("tenure")}
              />

              <Select
                label="Payout frequency"
                withAsterisk
                size="sm"
                radius="md"
                allowDeselect={false}
                styles={FIELD_STYLES}
                data={PAYOUT_FREQUENCIES}
                rightSection={chevronDown}
                {...form.getInputProps("frequency")}
              />

              <NumberInput
                label="Minimum investment (₹)"
                placeholder="0"
                withAsterisk
                size="sm"
                radius="md"
                hideControls
                min={0}
                thousandSeparator=","
                styles={FIELD_STYLES}
                {...form.getInputProps("minAmount")}
              />
            </SimpleGrid>
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