import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  Modal,
  Box,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Checkbox,
  Badge,
  ThemeIcon,
  Group,
  Fieldset,
  Paper,
  SimpleGrid,
  Stack,
  Button,
  useMantineTheme,
} from "@mantine/core";
import {
  IconX,
  IconChevronDown,
  IconMinus,
  IconCircleDot,
  IconListDetails,
  IconCurrencyRupee,
  IconCurrency,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import {
  EMPTY_FORM,
  formFromRecord,
  payloadFromForm,
  validateProductForm,
  type ProductFormValues,
} from "./investmentProductForm";
import {
  createInvestmentProduct,
  updateInvestmentProduct,
  getInvestmentProductById,
} from "../../../../api/Investor/productApi";
import { ModalFooter } from "../../../shared/ModalFooter";
import { openCommonModal } from "../../AlertModal";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { getSymbol } from "../../../../store/currencyStore";
import { useCompanyStore } from "../../../../store/companyStore";

export interface InvestmentProductModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  isView?: boolean;
}

/** Same options as the "Payout Frequency" field of the Custom Investment Product doctype. */
export const PAYOUT_FREQUENCIES = [
  "Monthly",
  "Weekly",
  "Bi-Weekly",
  "Quarterly",
  "Yearly",
];

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

/** One limit pair (minimum + maximum) in its own bordered box, as in "Product limits". */
function LimitGroup({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: ReactNode;
}) {
  return (
    <Box
      p="sm"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-slate-0)",
      }}
    >
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Text
          fz={11}
          fw={800}
          c="slate.7"
          tt="uppercase"
          style={{ letterSpacing: 0.4 }}
        >
          {title}
        </Text>
        <Badge
          size="xs"
          variant="light"
          color="brand"
          radius="sm"
          style={{ textTransform: "none" }}
        >
          {unit}
        </Badge>
      </Group>
      <SimpleGrid cols={2} spacing="xs">
        {children}
      </SimpleGrid>
    </Box>
  );
}

function Unit({ children }: { children: ReactNode }) {
  return (
    <Text fz="xs" c="slate.4">
      {children}
    </Text>
  );
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Paper
      radius="lg"
      p="md"
      style={{
        background: "var(--mantine-color-white)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      <Group gap="sm" mb="md" wrap="nowrap">
        <ThemeIcon size={32} radius="md" variant="light" color="brand">
          {icon}
        </ThemeIcon>
        <Box>
          <Text fw={700} fz="sm" c="slate.8">
            {title}
          </Text>
          <Text fz="xs" c="slate.5">
            {subtitle}
          </Text>
        </Box>
      </Group>
      {children}
    </Paper>
  );
}

// Same field look for every input: bold label, white input, slate border.
const FIELD_STYLES = {
  description: {
    fontSize: 11,
    color: "var(--mantine-color-slate-5)",
    marginTop: 4,
  },
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

  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);

  const form = useForm<ProductFormValues>({
    initialValues: EMPTY_FORM,
    validate: validateProductForm,
  });

  const queryClient = useQueryClient();

  const {
    data: editDetailsResponse,
    isLoading: isEditLoading,
    refetch,
  } = useQuery({
    queryKey: ["investmentProduct", editId],
    queryFn: () => getInvestmentProductById(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (editId && editDetailsResponse) {
      const item =
        editDetailsResponse.data ||
        editDetailsResponse.message?.data ||
        editDetailsResponse;

      form.setValues(formFromRecord(item));
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
      showSuccess(
        "Investment Product Created",
        "Investment product created successfully.",
      );
      handleReset();
      onClose();
    },
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateInvestmentProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      queryClient.invalidateQueries({
        queryKey: ["investmentProduct", editId],
      });
      showSuccess(
        "Investment Product Updated",
        "Investment product updated successfully.",
      );
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

    const payload = payloadFromForm(form.values);

    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || isEditLoading;

  const savedItem =
    editId && editDetailsResponse
      ? editDetailsResponse.data ||
        editDetailsResponse.message?.data ||
        editDetailsResponse
      : null;
  const savedCode: string = savedItem?.product_code || "";
  // A saved Product Code can't be changed (products saved before the code existed can still get one).
  const codeLocked = !!editId && !!savedCode;
  // Defaults must sit inside the limits, so they are entered once both limits are set.
  const tenureLimitsSet =
    form.values.minTenure !== "" && form.values.maxTenure !== "";
  const rateLimitsSet =
    form.values.minRate !== "" && form.values.maxRate !== "";

  const headerTitle = editId
    ? isView
      ? "View Investment Product"
      : "Edit Investment Product"
    : "New Investment Product";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="90vw"
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
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
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
        }}
        bg="white"
      >
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
              <IconCircleDot size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text
                size="md"
                fw={700}
                c="white"
                className="leading-tight truncate"
              >
                {headerTitle}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Set the limits investors must stay within, and the values new
                investments start with.
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
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: theme.other.headerButtonHoverBg,
                  },
                },
              }}
            >
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: theme.other.headerButtonHoverBg,
                  },
                },
              }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        {/* Body */}
        <Box
          px="lg"
          py="md"
          bg="slate.0"
          style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        >
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <Stack gap="md">
              <FormSection
                icon={<IconListDetails size={16} />}
                title="Investment product"
                subtitle="Name, code and the values new investments start with."
              >
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {/* Left: name, code, defaults */}
                  <Stack gap="sm">
                    <TextInput
                      label="Product name"
                      placeholder="Steady Income NCD"
                      withAsterisk
                      size="sm"
                      radius="md"
                      styles={FIELD_STYLES}
                      {...form.getInputProps("name")}
                    />
                    <TextInput
                      label={
                        <Group justify="space-between" wrap="nowrap" w="100%">
                          <span>
                            Product code{" "}
                            <Text span c="red">
                              *
                            </Text>
                          </span>
                          <Text span fz={11} fw={400} c="slate.5">
                            {codeLocked
                              ? "Can't be changed once created"
                              : "Stays the same even if name changes"}
                          </Text>
                        </Group>
                      }
                      placeholder="SI-NCD"
                      size="sm"
                      radius="md"
                      styles={{
                        ...FIELD_STYLES,
                        label: {
                          ...FIELD_STYLES.label,
                          display: "block",
                          width: "100%",
                        },
                        input: {
                          ...FIELD_STYLES.input,
                          fontFamily: "var(--mantine-font-family-monospace)",
                          letterSpacing: 1,
                        },
                      }}
                      disabled={codeLocked}
                      {...form.getInputProps("code")}
                      onChange={(e) =>
                        form.setFieldValue(
                          "code",
                          e.currentTarget.value.toUpperCase(),
                        )
                      }
                    />
                    <SimpleGrid cols={3} spacing="xs">
                      <NumberInput
                        label="Default tenure"
                        withAsterisk
                        size="sm"
                        radius="md"
                        hideControls
                        min={0}
                        allowDecimal={false}
                        styles={FIELD_STYLES}
                        disabled={!tenureLimitsSet}
                        rightSectionWidth={36}
                        rightSection={<Unit>mo</Unit>}
                        description={
                          tenureLimitsSet
                            ? `${form.values.minTenure}–${form.values.maxTenure} months`
                            : "Set limits below"
                        }
                        inputWrapperOrder={[
                          "label",
                          "input",
                          "description",
                          "error",
                        ]}
                        {...form.getInputProps("defaultTenure")}
                      />
                      <NumberInput
                        label="Default interest"
                        withAsterisk
                        size="sm"
                        radius="md"
                        hideControls
                        min={0}
                        styles={FIELD_STYLES}
                        disabled={!rateLimitsSet}
                        rightSection={<Unit>%</Unit>}
                        description={
                          rateLimitsSet
                            ? `${form.values.minRate}–${form.values.maxRate}%`
                            : "Set limits below"
                        }
                        inputWrapperOrder={[
                          "label",
                          "input",
                          "description",
                          "error",
                        ]}
                        {...form.getInputProps("defaultRate")}
                      />
                      <NumberInput
                        label="Default penalty"
                        size="sm"
                        radius="md"
                        hideControls
                        min={0}
                        styles={FIELD_STYLES}
                        rightSection={<Unit>%</Unit>}
                        description="Optional rate"
                        inputWrapperOrder={[
                          "label",
                          "input",
                          "description",
                          "error",
                        ]}
                        {...form.getInputProps("defaultPenalty")}
                      />
                    </SimpleGrid>
                  </Stack>

                  {/* Right: description, frequency, disabled */}
                  <Stack gap="sm" justify="space-between">
                    <Textarea
                      label="Product description"
                      placeholder="Brief description of this investment product."
                      withAsterisk
                      size="sm"
                      radius="md"
                      minRows={4}
                      maxRows={6}
                      autosize
                      styles={FIELD_STYLES}
                      {...form.getInputProps("description")}
                    />
                    <SimpleGrid
                      cols={2}
                      spacing="xs"
                      style={{ alignItems: "end" }}
                    >
                      <Select
                        label="Default payout frequency"
                        withAsterisk
                        size="sm"
                        radius="md"
                        allowDeselect={false}
                        styles={FIELD_STYLES}
                        data={PAYOUT_FREQUENCIES}
                        rightSection={chevronDown}
                        {...form.getInputProps("frequency")}
                      />
                      <Box
                        px="sm"
                        py={6}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: "1px solid var(--mantine-color-slate-2)",
                          background: "var(--mantine-color-slate-0)",
                        }}
                      >
                        <Checkbox
                          size="sm"
                          label={
                            <Box>
                              <Text fz="sm" fw={700} c="slate.7" lh={1.2}>
                                Disabled
                              </Text>
                              <Text fz={11} c="slate.5">
                                Disables new investments
                              </Text>
                            </Box>
                          }
                          {...form.getInputProps("disabled", {
                            type: "checkbox",
                          })}
                        />
                      </Box>
                    </SimpleGrid>
                  </Stack>
                </SimpleGrid>
              </FormSection>

              <FormSection
                icon={<IconCurrency size={16} />}
                title="Product limits"
                subtitle="The range every investment under this product must stay within."
              >
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                  <LimitGroup title="Interest rate range" unit="% per annum">
                    <NumberInput
                      label="Min rate"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      styles={FIELD_STYLES}
                      rightSection={<Unit>%</Unit>}
                      {...form.getInputProps("minRate")}
                    />
                    <NumberInput
                      label="Max rate"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      styles={FIELD_STYLES}
                      rightSection={<Unit>%</Unit>}
                      {...form.getInputProps("maxRate")}
                    />
                  </LimitGroup>
                  <LimitGroup title="Investment amount" unit={`${companyCurrency} (${currencySymbol})`}>
                    <NumberInput
                      label="Min investment"
                      placeholder="10,000"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      thousandSeparator=","
                      styles={FIELD_STYLES}
                      leftSection={<Unit>{currencySymbol}</Unit>}
                      {...form.getInputProps("minAmount")}
                    />
                    <NumberInput
                      label="Max investment"
                      placeholder="10,00,000"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      thousandSeparator=","
                      styles={FIELD_STYLES}
                      leftSection={<Unit>{currencySymbol}</Unit>}
                      {...form.getInputProps("maxAmount")}
                    />
                  </LimitGroup>
                  <LimitGroup title="Tenure duration" unit="Months">
                    <NumberInput
                      label="Min tenure"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      allowDecimal={false}
                      styles={FIELD_STYLES}
                      rightSectionWidth={36}
                      rightSection={<Unit>mo</Unit>}
                      {...form.getInputProps("minTenure")}
                    />
                    <NumberInput
                      label="Max tenure"
                      withAsterisk
                      size="sm"
                      radius="md"
                      hideControls
                      min={0}
                      allowDecimal={false}
                      styles={FIELD_STYLES}
                      rightSectionWidth={36}
                      rightSection={<Unit>mo</Unit>}
                      {...form.getInputProps("maxTenure")}
                    />
                  </LimitGroup>
                </SimpleGrid>
              </FormSection>
            </Stack>
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
