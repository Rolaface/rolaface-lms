import { SimpleGrid, TextInput, Select, Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { GENDERS, MARITAL_STATUSES, cleanPhone, type LoanApplicationValues } from "./form";
import { useCountryOptions } from "./lookups";
import { AddressPanels } from "./ResidenceEmploymentStep";

interface ApplicantProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

export function Applicant({ form, readOnly = false }: ApplicantProps) {
  const { options: countryOptions, isLoading: isCountriesLoading } = useCountryOptions();

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="First name" required />}
          placeholder="e.g. John"
          {...form.getInputProps("first_name")}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="Middle name" optional />}
          placeholder="e.g. K."
          {...form.getInputProps("middle_name")}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="Last name" required />}
          placeholder="e.g. Doe"
          {...form.getInputProps("last_name")}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          type="tel"
          label={<Label text="Phone" required />}
          placeholder="e.g. 0971234567"
          value={form.values.phone}
          onChange={(e) => form.setFieldValue("phone", cleanPhone(e.currentTarget.value))}
          error={form.errors.phone}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          type="email"
          label={<Label text="Email" required />}
          placeholder="e.g. john.doe@example.com"
          {...form.getInputProps("email")}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="NRC" required />}
          placeholder="e.g. 123456/78/1"
          {...form.getInputProps("nrc")}
          readOnly={readOnly}
        />
        <Select
          radius="md"
          label={<Label text="Gender" required />}
          placeholder="Select"
          data={GENDERS}
          {...form.getInputProps("gender")}
          disabled={readOnly}
        />
        <Select
          radius="md"
          label={<Label text="Marital status" required />}
          placeholder="Select"
          data={MARITAL_STATUSES}
          {...form.getInputProps("marital_status")}
          disabled={readOnly}
        />
        <DateInput
          radius="md"
          label={<Label text="Birth date" required />}
          valueFormat="DD-MMM-YYYY"
          placeholder="DD-MMM-YYYY"
          maxDate={new Date()}
          value={form.values.date_of_birth || null}
          onChange={(date) =>
            form.setFieldValue("date_of_birth", date ? new Date(date).toISOString().slice(0, 10) : "")
          }
          error={form.errors.date_of_birth}
          readOnly={readOnly}
        />
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="Applicant position" required />}
          placeholder="e.g. Managing Director"
          {...form.getInputProps("position")}
          readOnly={readOnly}
        />
        <Select
          radius="md"
          label={<Label text="Applicant nationality" required />}
          placeholder={isCountriesLoading ? "Loading..." : "Select"}
          searchable
          clearable
          data={countryOptions}
          {...form.getInputProps("nationality")}
          disabled={isCountriesLoading || readOnly}
        />
      </SimpleGrid>

      <AddressPanels form={form} currentRequired={false} readOnly={readOnly} />
    </Stack>
  );
}
