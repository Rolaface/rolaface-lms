import { TextInput, Select, Loader } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconChevronDown, IconPercentage, IconRefresh, IconCalendar } from "@tabler/icons-react";

import { PlainCard } from "./PlainCard";
import { SectionCard } from "./SectionCard";
import { SubHeading } from "./SubHeading";
import { IconChip } from "./IconChips";
import { theme, labelProps, labelPropsPlain, frequencyOptions } from "./Constants";
import { getAllLoanCategory } from "../../../api/productApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface ProductDetailsTabProps {
  form: UseFormReturnType<any>;
}

export function ProductDetailsTab({ form }: ProductDetailsTabProps) {
  // Fetch and format loan categories
  const { data: categoryResponse, isFetching: isFetchingCategory } = useQuery({
    queryKey: ["loanCategories"],
    queryFn: getAllLoanCategory,
  });

  const categoryOptions = useMemo(() => {
    const categories = categoryResponse?.data;
    if (!Array.isArray(categories)) return [];
    return categories
      .map((c: any) => (typeof c === "string" ? c : c?.name ?? c?.value))
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }, [categoryResponse]);

  return (
    <div className="flex flex-col gap-4">
      <PlainCard>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <TextInput size="xs" label="Product Code" placeholder="Enter product code" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("productCode")} />
          <TextInput size="xs" label="Product Name" placeholder="Enter product name" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("productName")} />
          <Select 
  size="xs" 
  searchable 
  rightSection={isFetchingCategory ? <Loader size={13} className="text-slate-400" /> : <IconChevronDown size={13} className="text-slate-400" />} 
  label="Loan Category" 
  placeholder="Select category" 
  data={categoryOptions} 
  withAsterisk 
  classNames={labelPropsPlain} 
  {...form.getInputProps("loanCategory")} 
/>
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Repayment Schedule Type" placeholder="Select schedule type" data={["Monthly as per repayment start date",
"Pro-rated calendar months","Monthly as per cycle date","Line of Credit","Flat Interest Rate"]} withAsterisk classNames={labelPropsPlain} {...form.getInputProps("repaymentScheduleType")} />
          <TextInput size="xs" label="Maximum Loan Amount" placeholder="Enter amount" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("maxLoanAmount")} />
          <TextInput size="xs" label="Days Past Due Threshold for NPA" placeholder="Enter days" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("npaThreshold")} />
        </div>
      </PlainCard>

      <SectionCard title="Interest & Penalty">
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-2 rounded-xl border p-4" style={{ backgroundColor: theme.indigoAlt[0], borderColor: theme.indigoAlt[1] }}>
            <div className="mb-3"><SubHeading color="brand">Interest</SubHeading></div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              <TextInput size="xs" label="Interest Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("interestRate")} />
              <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Interest Frequency" placeholder="Select frequency" data={frequencyOptions} withAsterisk leftSection={<IconChip icon={IconRefresh} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("interestFrequency")} />
            </div>
          </div>

          <div className="col-span-3 rounded-xl border p-4" style={{ backgroundColor: theme.danger[0], borderColor: theme.danger[1] }}>
            <div className="mb-3"><SubHeading color="danger">Penalty</SubHeading></div>
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              <TextInput size="xs" label="Penalty Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("penaltyRate")} />
              <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Penalty Frequency" placeholder="Select frequency" data={frequencyOptions} withAsterisk leftSection={<IconChip icon={IconRefresh} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("penaltyFrequency")} />
              <TextInput size="xs" label="Grace Period (Days)" placeholder="Enter days" leftSection={<IconChip icon={IconCalendar} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("gracePeriodDays")} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}