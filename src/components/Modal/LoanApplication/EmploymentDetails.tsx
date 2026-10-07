import { SimpleGrid, TextInput, Select, NumberInput, Group, Box, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_MAP,
  type FinancialEntry,
  type LoanApplicationValues,
} from "./form";

interface EmploymentDetailsProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

const LABEL_STYLES = {
  label: { display: "flex", alignItems: "center", marginBottom: 4 },
} as const;

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

const formatTotal = (entries: FinancialEntry[]) =>
  entries
    .reduce((acc, entry) => acc + (Number(entry.monthly_amount) || 0), 0)
    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function AmountPanel({
  form,
  field,
  title,
  totalLabel,
  color,
  readOnly,
}: {
  form: UseFormReturnType<LoanApplicationValues>;
  field: "income" | "obligations";
  title: string;
  totalLabel: string;
  color: "green" | "red";
  readOnly: boolean;
}) {
  const entries = form.values[field];
  return (
    <Box
      p="sm"
      h="100%"
      bd="1px solid var(--mantine-color-gray-2)"
      style={{ borderRadius: "var(--mantine-radius-xl)", display: "flex", flexDirection: "column" }}
    >
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Box w={8} h={8} style={{ borderRadius: "50%", backgroundColor: `var(--mantine-color-${color}-5)` }} />
          <Text fw={700} size="xs" c="dark.8" style={{ letterSpacing: "0.5px" }}>
            {title}
          </Text>
        </Group>
        <Box
          px={8}
          py={2}
          bg={`${color}.0`}
          c={`${color}.8`}
          fw={700}
          style={{
            borderRadius: "var(--mantine-radius-sm)",
            border: `1px solid var(--mantine-color-${color}-2)`,
            fontSize: "10px",
          }}
        >
          ZMW
        </Box>
      </Group>

      <SimpleGrid cols={1} spacing="md" mb="xl">
        {entries.map((item, index) => (
          <Group key={item.source} wrap="nowrap" gap="xs">
            <Select
              size="sm"
              radius="md"
              data={[item.source]}
              value={item.source}
              readOnly
              allowDeselect={false}
              style={{ flex: 1.5 }}
              styles={{
                input: {
                  backgroundColor: "var(--mantine-color-gray-0)",
                  color: "var(--mantine-color-dark-4)",
                  pointerEvents: "none",
                },
              }}
            />
            <NumberInput
              size="sm"
              radius="md"
              hideControls
              min={0}
              allowNegative={false}
              placeholder="0.00"
              thousandSeparator=","
              value={item.monthly_amount}
              onChange={(val) =>
                form.setFieldValue(`${field}.${index}.monthly_amount`, typeof val === "number" ? val : "")
              }
              readOnly={readOnly}
              leftSection={
                <Text size="xs" c="dimmed" pl={4}>
                  ZMW
                </Text>
              }
              styles={{ input: { textAlign: "right", fontWeight: 600 } }}
              style={{ flex: 1 }}
            />
          </Group>
        ))}
      </SimpleGrid>

      <Group
        justify="space-between"
        mt="auto"
        pt="sm"
        align="flex-end"
        style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Text size="10px" fw={700} c="dimmed" style={{ letterSpacing: "0.5px" }}>
          {totalLabel}
        </Text>
        <Text size="sm" fw={800} c="dark.9">
          ZMW {formatTotal(entries)}
        </Text>
      </Group>
    </Box>
  );
}

export function EmploymentDetails({ form, readOnly = false }: EmploymentDetailsProps) {
  const status = form.values.employment_status;
  const employmentTypes = status && EMPLOYMENT_TYPE_MAP[status] ? EMPLOYMENT_TYPE_MAP[status] : EMPLOYMENT_TYPES;

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing="sm" verticalSpacing="xs">
      <Select
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Employment Status" required />}
        placeholder="Select status"
        data={EMPLOYMENT_STATUSES}
        {...form.getInputProps("employment_status")}
        onChange={(value) => {
          form.setFieldValue("employment_status", value);
          const allowed = value ? EMPLOYMENT_TYPE_MAP[value] ?? EMPLOYMENT_TYPES : EMPLOYMENT_TYPES;
          if (form.values.employment_type && !allowed.includes(form.values.employment_type)) {
            form.setFieldValue("employment_type", null);
          }
        }}
        disabled={readOnly}
      />
      <Select
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Employment Type" required />}
        placeholder="Select type"
        data={employmentTypes}
        {...form.getInputProps("employment_type")}
        disabled={readOnly}
      />
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Employer Name" required />}
        placeholder="e.g. ABC Enterprises Ltd"
        {...form.getInputProps("employer_name")}
        readOnly={readOnly}
      />
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Designation" required />}
        placeholder="e.g. Software Engineer"
        {...form.getInputProps("designation")}
        readOnly={readOnly}
      />
      <NumberInput
        min={0}
        allowNegative={false}
        radius="md"
        hideControls
        styles={LABEL_STYLES}
        label={<Label text="Experience (in years)" required />}
        placeholder="e.g. 5"
        {...form.getInputProps("experience_years")}
        readOnly={readOnly}
      />
      <NumberInput
        min={300}
        max={850}
        allowNegative={false}
        allowDecimal={false}
        radius="md"
        hideControls
        styles={LABEL_STYLES}
        label={<Label text="Credit Score" required />}
        placeholder="e.g. 720"
        {...form.getInputProps("credit_score")}
        readOnly={readOnly}
      />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
        <AmountPanel
          form={form}
          field="income"
          title="MONTHLY INCOME"
          totalLabel="GROSS MONTHLY INFLOW"
          color="green"
          readOnly={readOnly}
        />
        <AmountPanel
          form={form}
          field="obligations"
          title="MONTHLY OBLIGATION"
          totalLabel="TOTAL MONTHLY OUTFLOW"
          color="red"
          readOnly={readOnly}
        />
      </SimpleGrid>
    </SimpleGrid>
  );
}
