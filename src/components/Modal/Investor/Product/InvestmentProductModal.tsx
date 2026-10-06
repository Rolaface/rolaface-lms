import { useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconPackage, IconPercentage, IconX } from "@tabler/icons-react";
import {
  FREQUENCY_MONTHS,
  type Frequency,
  type ProductOption,
} from "../InvestorModalShared";

interface InvestmentProductModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (product: ProductOption) => void;
}

interface FormState {
  name: string;
  rate: string;
  tenure: string;
  frequency: Frequency;
  minAmount: string;
}

type FormErrors = Partial<Record<"name" | "rate" | "tenure" | "minAmount", string>>;

const EMPTY_FORM: FormState = {
  name: "",
  rate: "",
  tenure: "",
  frequency: "Monthly",
  minAmount: "",
};

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
  onSave,
}: InvestmentProductModalProps) {
  const theme = useMantineTheme();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key !== "frequency") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Enter the product name.";
    if (!(Number(form.rate) > 0)) e.rate = "Enter a valid interest rate.";
    if (!(Number(form.tenure) > 0) || !Number.isInteger(Number(form.tenure)))
      e.tenure = "Enter the tenure in whole months.";
    if (!(Number(form.minAmount) > 0))
      e.minAmount = "Enter a valid minimum investment.";
    return e;
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onSave({
      name: form.name.trim(),
      rate: Number(form.rate),
      tenureMonths: Number(form.tenure),
      frequency: form.frequency,
      minAmount: Number(form.minAmount),
    });
    handleClear();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={640}
      centered
      radius="lg"
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      styles={{ content: { overflow: "hidden" }, body: { padding: 0 } }}
    >
      <style>{`
        .ip-modal-body input[type=number] { -moz-appearance: textfield; }
        .ip-modal-body input[type=number]::-webkit-outer-spin-button,
        .ip-modal-body input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* Header */}
      <Group
        gap="sm"
        wrap="nowrap"
        px="xl"
        py="md"
        style={{ background: theme.other.brandGradient }}
      >
        <Box
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "var(--mantine-radius-md)",
            background: "var(--mantine-color-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconPackage size={18} color="var(--mantine-color-brand-6)" />
        </Box>
        <Box>
          <Text fw={700} fz="md" c="white" lh={1.3}>
            Create investment product
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            Define the rate, tenure and payout.
          </Text>
        </Box>
        <ActionIcon
          variant="subtle"
          color="white"
          ml="auto"
          aria-label="Close"
          onClick={onClose}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      {/* Body */}
      <Box
        className="ip-modal-body"
        px="xl"
        py="xl"
        style={{ background: "var(--mantine-color-slate-0)" }}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="lg">
          <TextInput
            label="Product name"
            placeholder="e.g. Steady Income NCD"
            withAsterisk
            size="sm"
            radius="md"
            styles={FIELD_STYLES}
            style={{ gridColumn: "1 / -1" }}
            value={form.name}
            error={errors.name}
            onChange={(e) => setField("name", e.currentTarget.value)}
          />

          <TextInput
            type="number"
            label="Interest rate (% p.a.)"
            placeholder="0.00"
            withAsterisk
            size="sm"
            radius="md"
            step={0.25}
            styles={FIELD_STYLES}
            rightSection={
              <IconPercentage size={14} color="var(--mantine-color-slate-4)" />
            }
            value={form.rate}
            error={errors.rate}
            onChange={(e) => setField("rate", e.currentTarget.value)}
          />

          <TextInput
            type="number"
            label="Tenure (months)"
            placeholder="0"
            withAsterisk
            size="sm"
            radius="md"
            step={1}
            styles={FIELD_STYLES}
            rightSectionWidth={40}
            rightSection={
              <Text fz="xs" c="slate.4">
                mo
              </Text>
            }
            value={form.tenure}
            error={errors.tenure}
            onChange={(e) => setField("tenure", e.currentTarget.value)}
          />

          <Select
            label="Payout frequency"
            size="sm"
            radius="md"
            allowDeselect={false}
            styles={FIELD_STYLES}
            data={Object.keys(FREQUENCY_MONTHS)}
            value={form.frequency}
            onChange={(v) => v && setField("frequency", v as Frequency)}
          />

          <TextInput
            type="number"
            label="Minimum investment (₹)"
            placeholder="0"
            withAsterisk
            size="sm"
            radius="md"
            step={10000}
            styles={FIELD_STYLES}
            value={form.minAmount}
            error={errors.minAmount}
            onChange={(e) => setField("minAmount", e.currentTarget.value)}
          />
        </SimpleGrid>
      </Box>

      {/* Footer */}
      <Group
        justify="space-between"
        px="xl"
        py="md"
        style={{
          background: "var(--mantine-color-slate-0)",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs">
          <Button variant="subtle" color="slate" radius="md" onClick={onClose}>
            Cancel
          </Button>
        </Group>
        <Button
          radius="md"
          color="brand"
          px="xl"
          style={{
            background: theme.other.brandGradient,
            boxShadow: theme.other.brandGlowShadowSm,
          }}
          onClick={handleSave}
        >
          Save product
        </Button>
      </Group>
    </Modal>
  );
}