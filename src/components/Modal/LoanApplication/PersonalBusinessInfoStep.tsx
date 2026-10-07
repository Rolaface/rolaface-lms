import { SimpleGrid, TextInput, NumberInput, Select, Group, Text, Box, Stack } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import {
  BUSINESS_TYPES,
  GENDERS,
  cleanPhone,
  KIN_RELATIONSHIPS,
  MARITAL_STATUSES,
  type ApplicantType,
  type LoanApplicationValues,
} from "./form";
import { AddressFields } from "./AddressFields";
import { useCountryOptions } from "./lookups";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  applicantType: ApplicantType;
  readOnly?: boolean;
}

const LABEL_STYLES = {
  label: { minHeight: 40, display: "flex", alignItems: "flex-end" },
} as const;

const toIsoDate = (date: string | Date | null) => (date ? new Date(date).toISOString().slice(0, 10) : "");

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <Group gap="md" mt={4} mb={0} wrap="nowrap" style={{ gridColumn: "1 / -1" }}>
      <Text fz="sm" fw={700} c="slate.8" style={{ whiteSpace: "nowrap" }}>
        {title}
      </Text>
      <Box style={{ height: 1, flex: 1, backgroundColor: "var(--mantine-color-slate-2)" }} />
    </Group>
  );
}

export function PersonalBusinessInfoStep({ form, applicantType, readOnly = false }: StepProps) {
  const { options: countryOptions, isLoading: isCountriesLoading } = useCountryOptions();
  const today = new Date();

  if (applicantType === "Individual") {
    return (
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }} spacing="lg" verticalSpacing="md">
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="First name" required />}
            placeholder="e.g. John"
            {...form.getInputProps("first_name")}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Middle name" optional />}
            placeholder="e.g. K."
            {...form.getInputProps("middle_name")}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Surname" required />}
            placeholder="e.g. Doe"
            {...form.getInputProps("last_name")}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="NRC" required />}
            placeholder="e.g. 123456/78/1"
            {...form.getInputProps("nrc")}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            type="tel"
            label={<Label text="Phone" required />}
            placeholder="e.g. 0971234567"
            value={form.values.phone}
            onChange={(e) => form.setFieldValue("phone", cleanPhone(e.currentTarget.value))}
            error={form.errors.phone}
            readOnly={readOnly}
          />
          <DateInput
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Birth date" required />}
            valueFormat="DD-MMM-YYYY"
            placeholder="DD-MMM-YYYY"
            maxDate={today}
            value={form.values.date_of_birth || null}
            onChange={(date) => form.setFieldValue("date_of_birth", toIsoDate(date))}
            error={form.errors.date_of_birth}
            readOnly={readOnly}
          />
          <Select
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Gender" required />}
            placeholder="Select"
            data={GENDERS}
            {...form.getInputProps("gender")}
            disabled={readOnly}
          />
          <Select
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Marital status" required />}
            placeholder="Select"
            data={MARITAL_STATUSES}
            {...form.getInputProps("marital_status")}
            disabled={readOnly}
          />
          <Select
            radius="md"
            styles={LABEL_STYLES}
            label={<Label text="Nationality" required />}
            placeholder={isCountriesLoading ? "Loading..." : "Select"}
            searchable
            data={countryOptions}
            {...form.getInputProps("nationality")}
            disabled={isCountriesLoading || readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            styles={LABEL_STYLES}
            type="email"
            label={<Label text="Email" required />}
            placeholder="e.g. john.doe@example.com"
            className="lg:col-span-2"
            {...form.getInputProps("email")}
            readOnly={readOnly}
          />
        </SimpleGrid>

        <SectionDivider title="Next of Kin Details" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
          <TextInput
            maxLength={140}
            radius="md"
            label={<Label text="Next of kin name" required />}
            placeholder="e.g. John Doe"
            {...form.getInputProps("kin_name")}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            type="tel"
            label={<Label text="Next of kin phone" required />}
            placeholder="e.g. 0971234567"
            value={form.values.kin_phone}
            onChange={(e) => form.setFieldValue("kin_phone", cleanPhone(e.currentTarget.value))}
            error={form.errors.kin_phone}
            readOnly={readOnly}
          />
          <TextInput
            maxLength={140}
            radius="md"
            type="email"
            label={<Label text="Next of kin email" required />}
            placeholder="e.g. john.doe@example.com"
            {...form.getInputProps("kin_email")}
            readOnly={readOnly}
          />
          <Select
            radius="md"
            label={<Label text="Relationship" required />}
            placeholder="Select relationship"
            data={KIN_RELATIONSHIPS}
            {...form.getInputProps("kin_relationship")}
            disabled={readOnly}
          />
        </SimpleGrid>
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="lg" verticalSpacing="md">
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Company name" required />}
        placeholder="e.g. ABC Enterprises Ltd"
        {...form.getInputProps("company_name")}
        readOnly={readOnly}
      />
      <Select
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Type of business" required />}
        placeholder="Select"
        data={BUSINESS_TYPES}
        {...form.getInputProps("business_type")}
        disabled={readOnly}
      />
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="PACRA registration number" required />}
        placeholder="e.g. 120150001234"
        {...form.getInputProps("registration_number")}
        readOnly={readOnly}
      />
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="TPIN" required />}
        placeholder="e.g. 1002345678"
        {...form.getInputProps("tpin")}
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
      <DateInput
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Established date" required />}
        valueFormat="DD-MMM-YYYY"
        placeholder="DD-MMM-YYYY"
        maxDate={today}
        value={form.values.established_date || null}
        onChange={(date) => form.setFieldValue("established_date", toIsoDate(date))}
        error={form.errors.established_date}
        readOnly={readOnly}
      />
      <TextInput
        maxLength={140}
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Nature of business" required />}
        placeholder="e.g. Retail trading"
        className="lg:col-span-3"
        {...form.getInputProps("nature_of_business")}
        readOnly={readOnly}
      />

      <SectionDivider title="Registered office address" />

      <Box style={{ gridColumn: "1 / -1" }}>
        <AddressFields form={form} path="office_address" required readOnly={readOnly} />
      </Box>
    </SimpleGrid>
  );
}
