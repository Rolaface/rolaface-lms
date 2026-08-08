import { SimpleGrid, TextInput, Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"];
const BUSINESS_TYPES = ["Sole Proprietorship", "Partnership", "Limited Company", "Cooperative"];

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

        <TextInput radius="md" type="tel" label={<Label text="Phone" required />} {...form.getInputProps("phone")} />
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
        <TextInput
          radius="md"
          type="date"
          label={<Label text="Birth date" required />}
          {...form.getInputProps("birthDate")}
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
      <TextInput
        radius="md"
        type="date"
        label={<Label text="Established date" required />}
        {...form.getInputProps("establishedDate")}
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