import { Grid, Select, Switch, TextInput, Text, Group, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";

import type {
  JournalEntryErrors,
  JournalEntryFormValues,
} from "../../../../types/Accounting/Journalentry.types";

interface JournalEntryBasicInfoProps {
  form: JournalEntryFormValues;
  errors: JournalEntryErrors;
  isReadOnly: boolean;
  onFieldChange: (
    field: keyof JournalEntryFormValues,
    value: JournalEntryFormValues[keyof JournalEntryFormValues],
  ) => void;
}

const voucherTypes = [
  { value: "Journal Entry", label: "Journal Entry" },
  { value: "Bank Entry", label: "Bank Entry" },
];

export default function JournalEntryBasicInfo({
  form,
  errors,
  isReadOnly,
  onFieldChange,
}: JournalEntryBasicInfoProps) {
  const isBankEntry = form.voucher_type === "Bank Entry";

  return (
    <Grid gap="md" align="end">
      <Grid.Col span={{ base: 12, md: 1.5 }}>
        <DateInput
          label="Posting Date"
          value={form.postingDate ? new Date(form.postingDate) : null}
          onChange={(value) => onFieldChange("postingDate", value ?? "")}
          error={errors.postingDate}
          disabled={isReadOnly}
          valueFormat="MM/DD/YYYY"
          popoverProps={{ withinPortal: true, position: "bottom-start" }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          label="Voucher Type"
          data={voucherTypes}
          value={form.voucher_type}
          allowDeselect={false}
          onChange={(value) =>
            onFieldChange(
              "voucher_type",
              (value ?? "Journal Entry") as JournalEntryFormValues["voucher_type"],
            )
          }
          error={errors.voucher_type}
          disabled={isReadOnly}
        />
      </Grid.Col>

      {isBankEntry && (
        <>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="Reference Number"
              value={form.cheque_no}
              onChange={(e) => onFieldChange("cheque_no", e.currentTarget.value)}
              error={errors.cheque_no}
              disabled={isReadOnly}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 1.5 }}>
            <DateInput
              label="Reference Date"
              value={form.cheque_date ? new Date(form.cheque_date) : null}
              onChange={(value) => onFieldChange("cheque_date", value ?? "")}
              disabled={isReadOnly}
              valueFormat="MM/DD/YYYY"
              popoverProps={{ withinPortal: true, position: "bottom-start" }}
            />
          </Grid.Col>
        </>
      )}

      <Grid.Col span={{ base: 12, md: 5 }}>
        <TextInput
          label="Remarks"
          placeholder="General entry remarks..."
          value={form.remarks}
          onChange={(e) => onFieldChange("remarks", e.currentTarget.value)}
          error={errors.remarks}
          disabled={isReadOnly}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 2 }}>
        <Box>
          <Text fz="xs" fw={600} c="slate.6" mb={4}>
            Opening Entry
          </Text>
          <Group gap="xs" align="center" style={{ height: 34 }}>
            <Switch
              checked={form.isOpening}
              onChange={(e) => onFieldChange("isOpening", e.currentTarget.checked)}
              disabled={isReadOnly}
              color="brand"
            />
            <Text fz="xs" c="slate.6">
              {form.isOpening ? "Yes" : "No"}
            </Text>
          </Group>
        </Box>
      </Grid.Col>
    </Grid>
  );
}