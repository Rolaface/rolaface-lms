import { Group, Paper, TextInput, Select, Text, Switch, Tooltip } from "@mantine/core";
import { IconFilter, IconChevronDown, IconSearch, IconInfoCircle } from "@tabler/icons-react";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

const inputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input: "min-h-[32px] h-[32px] text-[12px] border-slate-200 rounded-lg focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

const dateInputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input:
    "min-h-[32px] h-[32px] text-[12px] border-slate-200 rounded-lg pr-2 " +
    "focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] " +
    "[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer " +
    "[&::-webkit-calendar-picker-indicator]:ml-1",
};

export function ArrearFilters({ filters, lookups, actions }: any) {
  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col gap-3">
      <Group gap={6}>
        <IconFilter size={14} style={{ color: cv("brand", 6) }} />
        <Text size="12.5px" fw={700} style={{ color: cv("brand", 6) }}>FILTERS</Text>
      </Group>

      <div className="grid grid-cols-5 gap-6">
        <TextInput 
          label="As On Date" withAsterisk type="date" 
          value={filters.asOnDate} onChange={(e) => filters.setAsOnDate(e.currentTarget.value)}
          classNames={dateInputClassNames} 
        />
        <Select 
          label="Branch" placeholder="Select branch" data={["Delhi", "Mumbai", "Bangalore", "Pune"]} clearable
          value={filters.branch} onChange={(val) => filters.setBranch(val || "")}
          classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} 
        />
        <Select 
          label="Loan Product" placeholder="Select product" data={lookups.loanProducts} clearable
          value={filters.loanProduct} onChange={(val) => filters.setLoanProduct(val || "")}
          classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} 
        />
        <Select 
          label="Customer" placeholder="Select Customer" data={lookups.customers} searchable clearable
          value={filters.customer} onChange={(val) => filters.setCustomer(val || "")}
          classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} 
        />
        <Select 
          label="Loan Account" placeholder="Select account" data={lookups.loans} searchable clearable
          value={filters.loanAccount} onChange={(val) => filters.setLoanAccount(val || "")}
          classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} 
        />
      </div>

      <Group justify="space-between" align="flex-end">
        <Group gap={28} align="flex-end">
          <Select 
            label="Arrear Bucket" data={["All Buckets", ...lookups.loanClassification]}
            value={filters.arrearBucket} onChange={(val) => filters.setArrearBucket(val || "All Buckets")}
            classNames={inputClassNames} className="w-[180px]" rightSection={<IconChevronDown size={13} className="text-slate-400" />} 
          />
          <div>
            <Text className="text-[12px] font-semibold text-slate-700 mb-1">Days Past Due</Text>
            <Group gap={6} align="center">
              <TextInput placeholder="From (DPD)" type="number" value={filters.dpdFrom} onChange={(e) => filters.setDpdFrom(e.currentTarget.value)} classNames={inputClassNames} className="w-[150px]" />
              <Text size="12px" c="dimmed" className="pb-[7px]">-</Text>
              <TextInput placeholder="To (DPD)" type="number" value={filters.dpdTo} onChange={(e) => filters.setDpdTo(e.currentTarget.value)} classNames={inputClassNames} className="w-[150px]" />
            </Group>
          </div>
        </Group>

        <Group gap={16} align="center">
          <Group gap={6}>
            <Text size="13px" fw={500} className="text-slate-600">Include Written Off</Text>
            <Tooltip label="Also include loan accounts that have been written off" withArrow>
              <IconInfoCircle size={13} className="text-slate-300" />
            </Tooltip>
            <Switch checked={filters.includeWrittenOff} onChange={(e) => filters.setIncludeWrittenOff(e.currentTarget.checked)} color="brand" />
          </Group>
          <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }} className="cursor-pointer hover:underline" onClick={actions.clearFilters}>
            Clear Filters
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}