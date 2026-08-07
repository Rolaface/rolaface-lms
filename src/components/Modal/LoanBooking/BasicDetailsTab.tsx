import {
  Text,
  TextInput,
  NumberInput,
  Select,
  SegmentedControl,
  Input,
  Checkbox,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconChevronDown,
  IconHash,
  IconUser,
  IconUsers,
  IconCalendar,
  IconCurrency,
  IconCalendarStats,
  IconRefresh,
  IconCash,
  IconClock,
  IconFileText,
  IconIdBadge2,
  IconPageBreak,
} from "@tabler/icons-react";

import { FieldIcon } from "./FieldIcon";
import { CURRENCIES, FREQUENCIES, MORATORIUM_TYPES, labelClass } from "./Constants";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomers } from "../../../api/customerApi";
import { useMemo } from "react";
import { getAllLoanProducts } from "../../../api/productApi";

const chevronDown = <IconChevronDown size={14} className="text-slate-500" />;

interface BasicDetailsTabProps {
  form: UseFormReturnType<any>;
  maturityDate: string;
  loanAcNumber: string;
}

export function BasicDetailsTab({
  form,
  maturityDate,
  loanAcNumber,
}: BasicDetailsTabProps) {
  // const moratoriumEnabled =
  //   !!form.values.moratoriumType && form.values.moratoriumType !== "None";
  const moratoriumEnabled = !!form.values.moratoriumType;

    const { data: customerResponse, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getAllCustomers,
  });

  // Map data for the dropdown (showing "CUST-001 - Ayush" so they can search by either)
  const customerOptions = useMemo(() => {
    const customers = customerResponse?.data || [];
    return customers.map((c: any) => ({
      value: c.value,
      label: `${c.value} - ${c.label}`, 
    }));
  }, [customerResponse]);

  // Find the label (Customer Name) matching the selected value (Customer Number)
  const selectedCustomerName = useMemo(() => {
    const customers = customerResponse?.data || [];
    const found = customers.find((c: any) => c.value === form.values.customerNumber);
    return found ? found.label : "";
  }, [customerResponse, form.values.customerNumber]);
  
const { data: productResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: getAllLoanProducts,
  });

  const productOptions = useMemo(() => {
    const products = productResponse?.data || [];
    return products.map((p: any) => ({
      value: p.name, 
      label: p.name, // Update to `${p.name} - ${p.product_name}` if your API has a separate description field
    }));
  }, [productResponse]);

  const selectedProductName = useMemo(() => {
    const products = productResponse?.data || [];
    const found = products.find((p: any) => p.name === form.values.productCode);
    // Assumes 'product_name' might exist, falls back to 'name'
    return found ? (found.product_name || found.name) : "";
  }, [productResponse, form.values.productCode]);

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-slate-200 rounded-md p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3 lg:gap-y-1">
         <Select
            size="sm"
            label="Customer Number"
            placeholder={isCustomersLoading ? "Loading..." : "Search customer number..."}
            data={customerOptions}
            disabled={isCustomersLoading}
            searchable
            clearable
            leftSection={<FieldIcon Icon={IconUser} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
            {...form.getInputProps("customerNumber")}
          />
          <TextInput
            size="sm"
            label="Customer Name"
            leftSection={<FieldIcon Icon={IconUsers} bg="#F3E8FF" color="#4F46E5" />}
            disabled
            placeholder="Auto-filled on selection"
            value={selectedCustomerName} // <-- Automatically gets 'Ayush'
            classNames={labelClass}
          />
         {/* <Select
            size="sm"
            label="Product Code"
            placeholder={isProductsLoading ? "Loading..." : "Search product code..."}
            data={productOptions}
            disabled={isProductsLoading}
            searchable
            clearable
            leftSection={<FieldIcon Icon={IconHash} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
            {...form.getInputProps("productCode")}
          /> */}
          <Select
  size="sm"
  label="Product Code"
  placeholder={isProductsLoading ? "Loading..." : "Search product code..."}
  data={productOptions}
  disabled={isProductsLoading}
  searchable
  clearable
  leftSection={<FieldIcon Icon={IconHash} bg="#EEF2FF" color="#4F46E5" />}
  rightSection={chevronDown}
  classNames={labelClass}
  value={form.values.productCode}
  error={form.errors.productCode}
  onChange={(value) => {
    form.setFieldValue("productCode", value);

    const products = productResponse?.data || [];
    const found = products.find((p: any) => p.name === value);

    form.setFieldValue("rateOfInterest", found?.rate_of_interest ?? 0);
  }}
/>
          <TextInput
            size="sm"
            label="Product Name"
            leftSection={<FieldIcon Icon={IconHash} bg="#F3E8FF" color="#4F46E5" />}
            disabled
            placeholder="Auto-filled on selection"
            value={selectedProductName} // <-- Automatically gets the product name
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Loan A/C Number"
            placeholder="Auto-generated on save"
            value={loanAcNumber}
            disabled
            leftSection={<FieldIcon Icon={IconIdBadge2} bg="#F3E8FF" color="#9333EA" />}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Loan Application Number"
            leftSection={<FieldIcon Icon={IconPageBreak} bg="#F3E8FF" color="#9333EA" />}
            classNames={labelClass}
            {...form.getInputProps("loanAppNumber")}
          />
          <TextInput
            size="sm"
            label="Ref Number"
            leftSection={<FieldIcon Icon={IconFileText} bg="#F3E8FF" color="#9333EA" />}
            classNames={labelClass}
            {...form.getInputProps("refNumber")}
          />
          <div className="flex items-end gap-4">
            <Checkbox
              size="xs"
              label="Is Migrated"
              className="mb-2"
              {...form.getInputProps("isImport", { type: "checkbox" })}
            />
            <TextInput
              size="sm"
              type="date"
              label="Migration Date"
              disabled={!form.values.isImport}
              leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
              classNames={labelClass}
              className="flex-1"
              {...form.getInputProps("migrationDate")}
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-md p-5 flex flex-col gap-6 lg:gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-8 gap-y-3 lg:gap-y-1">
          <TextInput
            size="sm"
            type="date"
            label="Transaction Date"
            disabled
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
            {...form.getInputProps("trnDate")}
          />
          <TextInput
            size="sm"
            type="date"
            label="Value Date"
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
            {...form.getInputProps("valueDate")}
          />
          <Select
            size="sm"
            label="Currency"
            data={CURRENCIES}
            leftSection={<FieldIcon Icon={IconCurrency} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
            {...form.getInputProps("currency")}
          />
          <NumberInput
            size="sm"
            label="Loan Amount"
            hideControls
            min={0}
            placeholder="0"
            leftSection={<FieldIcon Icon={IconCurrency} bg="#FFF7ED" color="#EA580C" />}
            thousandSeparator=","
            classNames={labelClass}
            {...form.getInputProps("loanAmount")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3 lg:gap-y-1">
          <Input.Wrapper label="Fixed Repayments In" classNames={labelClass}>
            <SegmentedControl
              size="sm"
              data={["TENOR", "EMI"]}
              fullWidth
              color="blue"
              value={form.values.fixedRepaymentsIn}
              onChange={(val) => form.setFieldValue("fixedRepaymentsIn", val)}
            />
          </Input.Wrapper>
          <NumberInput
            size="sm"
            label="Tenure (months)"
            placeholder="0"
             hideControls
            min={0}
            disabled={form.values.fixedRepaymentsIn === "EMI"}
            leftSection={<FieldIcon Icon={IconCalendarStats} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
            {...form.getInputProps("tenureValue")}
          />
          <Select
            size="sm"
            label="Frequency"
            data={FREQUENCIES}
            leftSection={<FieldIcon Icon={IconRefresh} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
            {...form.getInputProps("frequency")}
          />
          <NumberInput
            size="sm"
            label="Repayment Amount"
            placeholder="0"
             hideControls
            min={0}
            disabled={form.values.fixedRepaymentsIn === "TENOR"}
            leftSection={<FieldIcon Icon={IconCash} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
            {...form.getInputProps("repaymentAmount")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 lg:gap-y-1 lg:w-1/2 lg:pr-4">
          <TextInput
            size="sm"
            type="date"
            label="Maturity Date"
            placeholder="Auto-calculated"
            value={maturityDate}
            disabled
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            type="date"
            label="Repayment Start Date"
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
            {...form.getInputProps("repaymentStartDate")}
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-md p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-8 gap-y-3 lg:gap-y-1">
          <Input.Wrapper label="Moratorium Type" classNames={labelClass}>
            <SegmentedControl
              size="xs"
              data={[
      { label: "Principal", value: "Principal" },
      { label: "EMI (Principal + Interest)", value: "EMI" }, // <--- Shows long text, saves short text!
    ]}
              fullWidth
              color="blue"
              value={form.values.moratoriumType}
              onChange={(val) => form.setFieldValue("moratoriumType", val)}
            />
          </Input.Wrapper>

          <div>
            <NumberInput
              size="sm"
              label="Moratorium Period"
              placeholder="0"
               hideControls
            min={0}
              disabled={!moratoriumEnabled}
              leftSection={<FieldIcon Icon={IconClock} bg="#FEF2F2" color="#DC2626" />}
              classNames={labelClass}
              {...form.getInputProps("moratoriumPeriod")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}