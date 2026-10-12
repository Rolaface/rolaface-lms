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
  ThemeIcon,
  Group,
  Fieldset,
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
import { INTEREST_FREQUENCIES } from "../../../../types/Investor/investmentProductForm";
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

/** A bordered box around one group of rows of the form. */
function RowBox({ children }: { children: ReactNode }) {
  return (
    <Box
      p="md"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-white)",
      }}
    >
      {children}
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

        {/* Body: four fields per row */}
        <Box
          px="lg"
          py="md"
          style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        >
          <Fieldset disabled={isView} variant="unstyled" p={0} m={0}>
            <Stack gap="md">
              <RowBox>
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 4 }}
                  spacing="md"
                  verticalSpacing="sm"
                >
                  {/* Product */}
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
                    label="Product code"
                    placeholder="SI-NCD"
                    withAsterisk
                    size="sm"
                    radius="md"
                    styles={FIELD_STYLES}
                    disabled={codeLocked}
                    title={
                      codeLocked
                        ? "Can't be changed once the product is created"
                        : undefined
                    }
                    {...form.getInputProps("code")}
                    onChange={(e) =>
                      form.setFieldValue(
                        "code",
                        e.currentTarget.value.toUpperCase(),
                      )
                    }
                  />
                  <Textarea
                    label="Product description"
                    placeholder="Brief description of this investment product..."
                    withAsterisk
                    size="sm"
                    radius="md"
                    autosize
                    minRows={1}
                    maxRows={4}
                    styles={FIELD_STYLES}
                    style={{ gridColumn: "span 2" }}
                    {...form.getInputProps("description")}
                  />

                  {/* Payout, penalty, status */}
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
                  <NumberInput
                    label="Default penalty"
                    placeholder="Optional rate"
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    styles={FIELD_STYLES}
                    rightSection={<Unit>%</Unit>}
                    {...form.getInputProps("defaultPenalty")}
                  />
                  <Box style={{ alignSelf: "end" }}>
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
                            <Text fz="sm" fw={600} c="slate.7" lh={1.2}>
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
                  </Box>
                  <Box visibleFrom="md" />
                </SimpleGrid>
              </RowBox>
              <RowBox>
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 4 }}
                  spacing="md"
                  verticalSpacing="sm"
                >
                  {/* Interest */}
                  <NumberInput
                    label="Interest Min rate"
                    placeholder="e.g. 10"
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
                    label="Interest Max rate"
                    placeholder="e.g. 18"
                    withAsterisk
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    styles={FIELD_STYLES}
                    rightSection={<Unit>%</Unit>}
                    {...form.getInputProps("maxRate")}
                  />
                  <NumberInput
                    label="Default Interest rate"
                    placeholder="e.g. 15"
                    withAsterisk
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    styles={FIELD_STYLES}
                    rightSection={<Unit>%</Unit>}
                    {...form.getInputProps("defaultRate")}
                  />
                  <Select
                    label="Interest Frequency"
                    size="sm"
                    radius="md"
                    allowDeselect={false}
                    styles={FIELD_STYLES}
                    data={INTEREST_FREQUENCIES}
                    rightSection={chevronDown}
                    {...form.getInputProps("interestFrequency")}
                  />
                </SimpleGrid>
              </RowBox>
              <RowBox>
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 4 }}
                  spacing="md"
                  verticalSpacing="sm"
                >
                  {/* Investment amount */}
                  <NumberInput
                    label={`Min investment (${currencySymbol})`}
                    placeholder="10,000"
                    withAsterisk
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    thousandSeparator=","
                    styles={FIELD_STYLES}
                    {...form.getInputProps("minAmount")}
                  />
                  <NumberInput
                    label={`Max investment (${currencySymbol})`}
                    placeholder="10,00,000"
                    withAsterisk
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    thousandSeparator=","
                    styles={FIELD_STYLES}
                    {...form.getInputProps("maxAmount")}
                  />
                </SimpleGrid>
              </RowBox>
              <RowBox>
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 4 }}
                  spacing="md"
                  verticalSpacing="sm"
                >
                  {/* Tenure */}
                  <NumberInput
                    label="Min tenure"
                    placeholder="3"
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
                    placeholder="36"
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
                  <NumberInput
                    label="Default tenure"
                    placeholder="12"
                    withAsterisk
                    size="sm"
                    radius="md"
                    hideControls
                    min={0}
                    allowDecimal={false}
                    styles={FIELD_STYLES}
                    rightSectionWidth={36}
                    rightSection={<Unit>mo</Unit>}
                    {...form.getInputProps("defaultTenure")}
                  />
                </SimpleGrid>
              </RowBox>
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
