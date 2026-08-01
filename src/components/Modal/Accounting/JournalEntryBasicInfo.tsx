import { Grid, Select, Switch, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";

import type {
  JournalEntryErrors,
  JournalEntryFormValues,
} from "../../../types/Accounting/Journalentry.types";

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

const labelProps = { className: "text-xs font-medium text-gray-700 mb-1.5" };

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
          size="sm"
          radius="md"
          label="Posting Date"
          labelProps={labelProps}
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
          size="sm"
          radius="md"
          label="Voucher Type"
          labelProps={labelProps}
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
              size="sm"
              radius="md"
              label="Reference Number"
              labelProps={labelProps}
              value={form.cheque_no}
              onChange={(e) => onFieldChange("cheque_no", e.currentTarget.value)}
              error={errors.cheque_no}
              disabled={isReadOnly}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 1.5 }}>
            <DateInput
              size="sm"
              radius="md"
              label="Reference Date"
              labelProps={labelProps}
              value={form.cheque_date ? new Date(form.cheque_date) : null}
              onChange={(value) => onFieldChange("cheque_date", value ?? "")}
              disabled={isReadOnly}
              valueFormat="MM/DD/YYYY"
              popoverProps={{ withinPortal: true, position: "bottom-start" }}
            />
          </Grid.Col>
        </>
      )}

      <Grid.Col span={{ base: 12, md: 5}}>
        <TextInput
          size="sm"
          radius="md"
          label="Remarks"
          labelProps={labelProps}
          placeholder="General entry remarks..."
          value={form.remarks}
          onChange={(e) => onFieldChange("remarks", e.currentTarget.value)}
          error={errors.remarks}
          disabled={isReadOnly}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 2 }}>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-gray-700 block">Opening Entry</span>
          <div className="flex items-center h-9 gap-2">
            <Switch
              checked={form.isOpening}
              onChange={(e) => onFieldChange("isOpening", e.currentTarget.checked)}
              disabled={isReadOnly}
              color="indigo"
            />
            <span className="text-xs text-gray-600">
              {form.isOpening ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </Grid.Col>
    </Grid>
  );
}