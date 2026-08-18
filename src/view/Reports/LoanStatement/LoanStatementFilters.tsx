import { Paper, Select, TextInput } from "@mantine/core";
import { IconChevronDown, IconCalendar } from "@tabler/icons-react";

const inputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input:
    "min-h-[28px] h-[28px] text-[11.5px] px-2 border-slate-200 rounded-lg focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

export function LoanStatementFilters({ filters, lookups }: any) {
  const customerOptions = (lookups?.customers || [])
    .map((c: any) => {
      if (typeof c === "string") return { value: c, label: c };
      return {
        value: String(c?.value ?? c?.name ?? c?.id ?? ""),
        label: String(c?.label ?? c?.customer_name ?? c?.name ?? ""),
      };
    })
    .filter((c: any) => c.value);

  const loanOptions = (lookups?.loans || [])
    .map((l: any) => {
      if (typeof l === "string") return { value: l, label: l };
      return {
        value: String(l?.value ?? l?.name ?? l?.id ?? ""),
        label: String(l?.label ?? l?.loan_product ?? l?.name ?? ""),
      };
    })
    .filter((l: any) => l.value);

  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200">
      <div className="flex flex-wrap gap-12">
        <Select
          label="Customer"
          withAsterisk
          placeholder="Select customer"
          data={customerOptions}
          value={filters.customerId}
          onChange={(val) => {
            filters.setCustomerId(val);
            filters.setLoanId(null);
          }}
          searchable
          clearable
          classNames={inputClassNames}
          className="w-[280px]"
          rightSection={<IconChevronDown size={13} className="text-slate-400" />}
        />
        <Select
          label="Loan Account"
          withAsterisk
          placeholder="Select account"
          data={loanOptions}
          value={filters.loanId}
          onChange={(val) => {
            filters.setLoanId(val);
            if (val && !filters.customerId) {
              const matchedLoan = lookups.loans.find(
                (l: any) => String(l.value) === String(val)
              );
              if (matchedLoan && matchedLoan.applicant) {
                filters.setCustomerId(matchedLoan.applicant);
              }
            }
          }}
          searchable
          classNames={inputClassNames}
          className="w-[230px]"
          rightSection={<IconChevronDown size={13} className="text-slate-400" />}
        />
        <TextInput
          label="From Date"
          withAsterisk
          type="date"
          value={filters.fromDate}
          onChange={(e) => filters.setFromDate(e.currentTarget.value)}
          classNames={inputClassNames}
          className="w-[180px]"
          rightSection={<IconCalendar size={14} className="text-slate-400" />}
        />
        <TextInput
          label="To Date"
          withAsterisk
          type="date"
          value={filters.toDate}
          onChange={(e) => filters.setToDate(e.currentTarget.value)}
          classNames={inputClassNames}
          className="w-[180px]"
          rightSection={<IconCalendar size={14} className="text-slate-400" />}
        />
      </div>
    </Paper>
  );
}