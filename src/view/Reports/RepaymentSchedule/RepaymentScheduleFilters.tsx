import { Box, Select, TextInput } from "@mantine/core";
import { IconCalendarDue, IconSearch } from "@tabler/icons-react";

interface RepaymentScheduleFiltersProps {
  filters: {
    selectedLoan: string | null;
    selectedCustomer: string | null;
    fromDate: string;
    toDate: string;
    loanSearch: string;
    customerSearch: string;
    setSelectedLoan: (v: string | null) => void;
    setSelectedCustomer: (v: string | null) => void;
    setFromDate: (v: string) => void;
    setToDate: (v: string) => void;
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
      className="grid grid-cols-4 gap-3 p-3 rounded-lg"
      style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}
    >
      <Select
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
      <TextInput
        label="From Date"
        type="text"
        value={filters.fromDate}
        onChange={(e) => filters.setFromDate(e.currentTarget.value)}
        rightSection={<IconCalendarDue size={14} color="var(--mantine-color-success-6)" />}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
      <TextInput
        label="To Date"
        type="text"
        value={filters.toDate}
        onChange={(e) => filters.setToDate(e.currentTarget.value)}
        rightSection={<IconCalendarDue size={14} color="var(--mantine-color-success-6)" />}
        size="sm"
        withAsterisk
        styles={{ label: { fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 } }}
      />
    </Box>
  );
}
