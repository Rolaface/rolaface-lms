import { Box, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendarDue, IconSearch } from "@tabler/icons-react";

interface RepaymentScheduleFiltersProps {
  filters: {
    selectedLoan: string | null;
    selectedCustomer: string | null;
    fromDate: Date | null;
    toDate: Date | null;
    loanSearch: string;
    customerSearch: string;
    setSelectedLoan: (v: string | null) => void;
    setSelectedCustomer: (v: string | null) => void;
    setFromDate: (v: Date | null) => void;
    setToDate: (v: Date | null) => void;
    setLoanSearch: (v: string) => void;
    setCustomerSearch: (v: string) => void;
  };
  lookups: {
    loanOptions: { value: string; label: string }[];
    customerOptions: { value: string; label: string }[];
  };
}

export function RepaymentScheduleFilters({ filters, lookups }: RepaymentScheduleFiltersProps) {
  return (
    <Box
      className="flex flex-wrap gap-6 p-4 rounded-lg items-start"
      style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}
    >
      <Select
        className="w-[240px]"
        label="Loan Account"
        placeholder="Search loan account..."
        searchable
        clearable
        data={lookups.loanOptions}
        value={filters.selectedLoan}
        onChange={filters.setSelectedLoan}
        onSearchChange={filters.setLoanSearch}
        leftSection={<IconSearch size={14} />}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
      <Select
        className="w-[240px]"
        label="Customer"
        placeholder="Search customer..."
        searchable
        clearable
        data={lookups.customerOptions}
        value={filters.selectedCustomer}
        onChange={filters.setSelectedCustomer}
        onSearchChange={filters.setCustomerSearch}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
      <DateInput valueFormat="MM/DD/YYYY" popoverProps={{ withinPortal: true, position: "bottom-start" }}
        className="w-[200px]"
        label="From Date"
        value={filters.fromDate}
        onChange={filters.setFromDate}
        leftSection={<IconCalendarDue size={14} color="var(--mantine-color-success-6)" />}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
      <DateInput valueFormat="MM/DD/YYYY" popoverProps={{ withinPortal: true, position: "bottom-start" }}
        className="w-[200px]"
        label="To Date"
        value={filters.toDate}
        onChange={filters.setToDate}
        leftSection={<IconCalendarDue size={14} color="var(--mantine-color-success-6)" />}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
    </Box>
  );
}
