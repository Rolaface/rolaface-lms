import { SimpleGrid, TextInput, Select, NumberInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";
import { DateInput } from "@mantine/dates";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
];
const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited Company",
  "Public Limited Company",
  "Limited Liability Company",
  "Cooperative",
  "Other",
];

const LABEL_STYLES = {
  label: { minHeight: 40, display: "flex", alignItems: "flex-end" },
} as const;

function Label({
  text,
  required,
  optional,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && (
        <span className="text-slate-400 font-normal ml-1">(Optional)</span>
      )}
    </span>
  );
}

export function PersonalBusinessInfoStep({ form, loanType }: StepProps) {
  if (loanType === "Personal") {
    return (
      <SimpleGrid
        cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
        spacing="lg"
        verticalSpacing="md"
      >
        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="First name" required />}
          placeholder="e.g. John"
          {...form.getInputProps("firstName")}
        />
        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="Middle name" optional />}
          placeholder="e.g. K."
          {...form.getInputProps("middleName")}
        />
        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="Surname" required />}
          placeholder="e.g. Doe"
          {...form.getInputProps("surname")}
        />
        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="NRC" required />}
          placeholder="e.g. 123456/78/1"
          {...form.getInputProps("nrc")}
        />

        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          type="tel"
          label={<Label text="Phone" required />}
          placeholder="e.g. 0971234567"
          value={form.values.phone}
          onChange={(e) =>
            form.setFieldValue(
              "phone",
              e.currentTarget.value.replace(/\D/g, ""),
            )
          }
          error={form.errors.phone}
        />
        <TextInput
          radius="md"
          styles={LABEL_STYLES}
          type="email"
          label={<Label text="Email" required />}
          placeholder="e.g. john.doe@example.com"
          className="lg:col-span-2"
          value={form.values.email}
          onChange={(e) => {
            form.setFieldValue("email", e.currentTarget.value);
            form.validateField("email");
          }}
          error={form.errors.email}
        />

        <Select
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="Gender" required />}
          placeholder="Select"
          data={GENDERS}
          {...form.getInputProps("gender")}
        />
        <Select
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="Marital status" required />}
          placeholder="Select"
          data={MARITAL_STATUSES}
          {...form.getInputProps("maritalStatus")}
        />
        <DateInput
          radius="md"
          styles={LABEL_STYLES}
          label={<Label text="Birth date" required />}
          valueFormat="DD-MMM-YYYY"
          placeholder="DD-MMM-YYYY"
          value={form.values.birthDate ? new Date(form.values.birthDate) : null}
          onChange={(date) =>
            form.setFieldValue(
              "birthDate",
              date ? new Date(date).toISOString().slice(0, 10) : "",
            )
          }
          error={form.errors.birthDate}
        />
      </SimpleGrid>
    );
  }

  return (
  <SimpleGrid
  cols={{ base: 1, xs: 2, lg: 4 }}
  spacing="lg"
  verticalSpacing="md"
>
  <TextInput
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Company name" required />}
    placeholder="e.g. ABC Enterprises Ltd"
    {...form.getInputProps("companyName")}
  />

  <Select
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Type of business" required />}
    placeholder="Select"
    data={BUSINESS_TYPES}
    {...form.getInputProps("typeOfBusiness")}
  />

  <DateInput
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Established date" required />}
    valueFormat="DD-MMM-YYYY"
    placeholder="DD-MMM-YYYY"
    value={
      form.values.establishedDate
        ? new Date(form.values.establishedDate)
        : null
    }
    onChange={(date) =>
      form.setFieldValue(
        "establishedDate",
        date ? new Date(date).toISOString().slice(0, 10) : "",
      )
    }
    error={form.errors.establishedDate}
  />

  <TextInput
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Nature of business" required />}
    placeholder="e.g. Retail trading"
    {...form.getInputProps("natureOfBusiness")}
  />

  <TextInput
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Registered office" required />}
    placeholder="e.g. Plot 12, Cairo Road, Lusaka"
    className="lg:col-span-2"
    {...form.getInputProps("registeredOffice")}
  />

  <NumberInput
    min={0}
    allowNegative={false}
    hideControls
    thousandSeparator=","
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Collateral pledged" required />}
    placeholder="e.g. 50,000"
    {...form.getInputProps("collateralPledged")}
  />

  <TextInput
    radius="md"
    styles={LABEL_STYLES}
    label={<Label text="Purpose of loan" required />}
    placeholder="e.g. Purchase of stock"
    {...form.getInputProps("purposeOfLoan")}
  />
</SimpleGrid>
  );
}
