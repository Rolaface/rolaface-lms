import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SimpleGrid, TextInput, Select, NumberInput, Checkbox, Stack, Group, Text, Box } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconChevronDown,
  IconUserSearch,
  IconMail,
  IconPhone,
  IconUser,
  IconBuildingBank,
  IconCalendar,
  IconTargetArrow,
  IconStack2,
  IconCash,
  IconRepeat,
  IconCalendarStats,
  IconCoin,
} from "@tabler/icons-react";

import { FieldLabel, PlainCard, SectionHeader } from "../../shared/customer/Shared";
import { readOnlyClassNames } from "../../constants/customer/constants";
import { getAllCustomers } from "../../../api/customerApi";
import { getAllLoanProducts } from "../../../api/productApi";
import type { LoanApplicationFormValues } from "./LoanApplicationModal";
import { getAllCountries } from "../../../api/loanApplicationApi";

const COUNTRY_CODES = [
  { value: "+91", label: "🇮🇳 +91" },
  { value: "+1", label: "🇺🇸 +1" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+971", label: "🇦🇪 +971" },
  { value: "+61", label: "🇦🇺 +61" },
];

interface BasicDetailsProps {
  form: UseFormReturnType<LoanApplicationFormValues>;
}

const chevron = <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />;
const FIELD_MAW = 220;

// TODO: replace with your real picklist values from the backend doctype.
// const APPLICANT_TYPES = ["Customer", "Employee", "Member"];
const REPAYMENT_METHODS = [
  { value: "Repay Over Number of Periods", label: "Repay Over Number of Periods" },
  { value: "Repay Fixed Amount per Period", label: "Repay Fixed Amount per Period" },
];

export function BasicDetails({ form }: BasicDetailsProps) {

  const { data: productResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: getAllLoanProducts,
  });

  const productOptions = useMemo(() => {
    const products = productResponse?.data || [];
    return products.map((p: any) => ({ value: p.name, label: p.product_name || p.name }));
  }, [productResponse]);

  const { data: countryResponse, isLoading: isCountriesLoading } = useQuery({
  queryKey: ["countries"],
  queryFn: getAllCountries,
});

const countryOptions = useMemo(() => {
  const countries = countryResponse?.message?.data || [];
  return countries.map((c: any) => ({ value: c.value, label: c.label }));
}, [countryResponse]);

  const isPeriodBased = form.values.repayment_method === "Repay Over Number of Periods";

  return (
    <Stack gap="xs">
      <PlainCard>
        {/* <SectionHeader icon={IconMail} title="Primary Applicant Contact Info" badge="REQUIRED" /> */}
        <SimpleGrid cols={4} spacing="md" verticalSpacing="sm">
             <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="First name" />}
            placeholder="e.g. Ayush"
            withAsterisk
            {...form.getInputProps("applicant_name")}
          />
          <TextInput
            maw={FIELD_MAW}
            radius="md"
            type="email"
            label={<FieldLabel text="Applicant email address" />}
            placeholder="name@example.com"
            withAsterisk
            leftSection={<IconMail size={14} />}
            {...form.getInputProps("applicant_email_address")}
          />
          {/* <TextInput
            maw={FIELD_MAW}
            radius="md"
            type="tel"
            label={<FieldLabel text="Applicant phone number" />}
            placeholder="+91 98765 43210"
            withAsterisk
            leftSection={<IconPhone size={14} />}
            {...form.getInputProps("applicant_phone_number")}
          /> */}
         <Stack gap={4} maw={FIELD_MAW}>
  <FieldLabel text="Applicant phone number" />
  <Group gap={0} wrap="nowrap" style={{ border: "1px solid var(--mantine-color-slate-3)", borderRadius: 8, overflow: "hidden" }}>
    <Select
      w={75}
      radius={0}
      variant="unstyled"
      pl={6}
      data={COUNTRY_CODES}
      renderOption={({ option }) => (
        <Group gap={4} wrap="nowrap">
          <Text size="md">{option.label.split(" ")[0]}</Text>
          <Text size="sm">{option.label.split(" ")[1]}</Text>
        </Group>
      )}
      styles={{
        input: { border: "none", paddingRight: 4 },
      }}
      {...form.getInputProps("phone_country_code")}
    />
    {/* <Box w={1} h={24} bg="var(--mantine-color-slate-3)" /> */}
    <Box w={1} h="100%" bg="var(--mantine-color-slate-3)" />
    <TextInput
      style={{ flex: 1 }}
      radius={0}
      pl={2}
      variant="unstyled"
      type="tel"
      placeholder="98765 43210"
      {...form.getInputProps("applicant_phone_number")}
    />
  </Group>
</Stack>
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            type="date"
            label={<FieldLabel text="Application date" />}
            withAsterisk
            leftSection={<IconCalendar size={14} />}
            {...form.getInputProps("posting_date")}
          />
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Address Line 1" tag="Optional" />}
            placeholder="e.g. Lane NO"
            {...form.getInputProps("address_line_1")}
          />
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Address Line 2" tag="Optional" />}
            placeholder="e.g. Street No"
            {...form.getInputProps("address_line_2")}
          />
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="City" tag="Optional" />}
            placeholder="e.g. PUNE"
            {...form.getInputProps("city")}
          />
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="State" tag="Optional" />}
            placeholder="e.g. ASSAM"
            {...form.getInputProps("state")}
          />
           <Select
  maw={FIELD_MAW}
  radius="md"
  searchable
  clearable
  rightSection={chevron}
  label={<FieldLabel text="Country" tag="Optional" />}
  placeholder={isCountriesLoading ? "Loading..." : "Search country..."}
  data={countryOptions}
  disabled={isCountriesLoading}
  {...form.getInputProps("country")}
/>
           <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Zip Code" tag="Optional" />}
            placeholder="e.g. 5243"
            {...form.getInputProps("zip_code")}
          />
        </SimpleGrid>
      </PlainCard>

      {/* Loan Info */}
      <PlainCard>
        <SectionHeader icon={IconCoin} title="Loan Info" badge="REQUIRED" />
        <SimpleGrid cols={4} spacing="md" verticalSpacing="sm">
          <Select
            maw={FIELD_MAW}
            radius="md"
            searchable
            clearable
            rightSection={chevron}
            label={<FieldLabel text="Loan product" />}
            placeholder={isProductsLoading ? "Loading..." : "Search product..."}
            withAsterisk
            data={productOptions}
            disabled={isProductsLoading}
            leftSection={<IconStack2 size={14} />}
            value={form.values.loan_product}
            error={form.errors.loan_product}
            onChange={(value) => {
              form.setFieldValue("loan_product", value || "");
              const products = productResponse?.data || [];
              const found = products.find((p: any) => p.name === value);
              form.setFieldValue("rate_of_interest", found?.rate_of_interest ?? "");
            }}
          />
          <NumberInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Loan amount" />}
            placeholder="0"
            hideControls
            min={0}
            withAsterisk
            thousandSeparator=","
            leftSection={<IconCash size={14} />}
            {...form.getInputProps("loan_amount")}
          />
           <NumberInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Rate of interest" tag="(auto)" />}
            placeholder="0.00"
            hideControls
            disabled
            decimalScale={2}
            rightSection={<Text size="xs" c="dimmed">%</Text>}
            classNames={readOnlyClassNames}
            {...form.getInputProps("rate_of_interest")}
          />
          <TextInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Loan purpose" tag="Optional" />}
            placeholder="e.g. Working capital"
            leftSection={<IconTargetArrow size={14} />}
            {...form.getInputProps("loan_purpose")}
          />
           <Select
            maw={FIELD_MAW}
            radius="md"
            rightSection={chevron}
            label={<FieldLabel text="Repayment method" />}
            withAsterisk
            data={REPAYMENT_METHODS}
            {...form.getInputProps("repayment_method")}
          />
          <NumberInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Repayment period" tag="Months" />}
            placeholder="0"
            hideControls
            min={0}
            disabled={!isPeriodBased}
            withAsterisk={isPeriodBased}
            leftSection={<IconCalendarStats size={14} />}
            {...form.getInputProps("repayment_periods")}
          />
          <NumberInput
            maw={FIELD_MAW}
            radius="md"
            label={<FieldLabel text="Monthly repayment amount" />}
            placeholder="0"
            hideControls
            min={0}
            disabled={isPeriodBased}
            withAsterisk={!isPeriodBased}
            thousandSeparator=","
            leftSection={<IconCash size={14} />}
            {...form.getInputProps("monthly_repayment_amount")}
          />
          <TextInput
            maw={FIELD_MAW}
            radius="md"
            type="date"
            label={<FieldLabel text="Repayment start date" tag="Optional" />}
            leftSection={<IconCalendar size={14} />}
            {...form.getInputProps("repayment_start_date")}
          />
        </SimpleGrid>

        <Group gap="xl" mt="sm">
          <Checkbox
            label="Is term loan"
            {...form.getInputProps("is_term_loan", { type: "checkbox" })}
          />
          <Checkbox
            label="Is secured loan"
            {...form.getInputProps("is_secured_loan", { type: "checkbox" })}
          />
        </Group>
      </PlainCard>

      {/* Repayment Info */}
      {/* <PlainCard>
        <SectionHeader icon={IconRepeat} title="Repayment Info" badge="REQUIRED" />
        <SimpleGrid cols={4} spacing="md" verticalSpacing="sm">
         
        </SimpleGrid>
      </PlainCard> */}
    </Stack>
  );
}