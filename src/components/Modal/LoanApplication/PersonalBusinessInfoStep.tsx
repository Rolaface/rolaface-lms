import { SimpleGrid, TextInput, Select } from "@mantine/core";
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
const BUSINESS_TYPES = ["Sole Proprietorship", "Partnership", "Private Limited Company", "Public Limited Company", "Limited Liability Company", "Cooperative", "Other",
];

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

export function PersonalBusinessInfoStep({ form, loanType }: StepProps) {
  if (loanType === "Personal") {
    return (
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
        <TextInput
          radius="md"
          label={<Label text="First name" required />}
          {...form.getInputProps("firstName")}
        />
        <TextInput
          radius="md"
          label={<Label text="Middle name" optional />}
          {...form.getInputProps("middleName")}
        />
        <TextInput
          radius="md"
          label={<Label text="Surname" required />}
          {...form.getInputProps("surname")}
        />

        {/* <TextInput radius="md" type="tel" label={<Label text="Phone" required />} {...form.getInputProps("phone")} /> */}
        <TextInput
  radius="md"
  type="tel"
  label={<Label text="Phone" required />}
  value={form.values.phone}
  onChange={(e) => form.setFieldValue("phone", e.currentTarget.value.replace(/\D/g, ""))}
  error={form.errors.phone}
/>
        <TextInput radius="md" type="email" label={<Label text="Email" required />} {...form.getInputProps("email")} />
        <TextInput radius="md" label={<Label text="NRC" required />} {...form.getInputProps("nrc")} />

        <Select
          radius="md"
          label={<Label text="Gender" required />}
          placeholder="Select"
          data={GENDERS}
          {...form.getInputProps("gender")}
        />
        <Select
          radius="md"
          label={<Label text="Marital status" required />}
          placeholder="Select"
          data={MARITAL_STATUSES}
          {...form.getInputProps("maritalStatus")}
        />
       <DateInput
  radius="md"
  label={<Label text="Birth date" required />}
  valueFormat="DD-MMM-YYYY"
  placeholder="DD-MMM-YYYY"
  value={form.values.birthDate ? new Date(form.values.birthDate) : null}
  onChange={(date) =>
    form.setFieldValue(
      "birthDate",
      date ? new Date(date).toISOString().slice(0, 10) : ""
    )
  }
  error={form.errors.birthDate}
/>
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
      <TextInput
        radius="md"
        label={<Label text="Company name" required />}
        {...form.getInputProps("companyName")}
      />
      <Select
        radius="md"
        label={<Label text="Type of business" required />}
        placeholder="Select"
        data={BUSINESS_TYPES}
        {...form.getInputProps("typeOfBusiness")}
      />
    <DateInput
  radius="md"
  label={<Label text="Established date" required />}
  valueFormat="DD-MMM-YYYY"
  placeholder="DD-MMM-YYYY"
  value={form.values.establishedDate ? new Date(form.values.establishedDate) : null}
  onChange={(date) =>
    form.setFieldValue(
      "establishedDate",
      date ? new Date(date).toISOString().slice(0, 10) : ""
    )
  }
  error={form.errors.establishedDate}
/>

      <TextInput
        radius="md"
        label={<Label text="Nature of business" required />}
        {...form.getInputProps("natureOfBusiness")}
      />
      <TextInput
        radius="md"
        label={<Label text="Registered office" required />}
        {...form.getInputProps("registeredOffice")}
      />
      <TextInput
        radius="md"
        label={<Label text="Collateral pledged" required />}
        {...form.getInputProps("collateralPledged")}
      />

      <TextInput
        radius="md"
        label={<Label text="Purpose of loan" required />}
        className="sm:col-span-2"
        {...form.getInputProps("purposeOfLoan")}
      />
    </SimpleGrid>
  );
}