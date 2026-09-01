import { Box, Button, Group, Tabs, Text, Title, SegmentedControl } from "@mantine/core";
import { IconDownload, IconPrinter, IconChartBar, IconTable, IconCalendarDue, IconChevronDown } from "@tabler/icons-react";
import { useRepaymentSchedule } from "../../../hooks/Report/RepaymentSchedule/useRepaymentSchedule";
import { LoanSummaryCards } from "./LoanSummaryCards";
import { ScheduleTabContent } from "./ScheduleTabContent";
import { ChartTabContent } from "./ChartTabContent";
import { RepaymentScheduleFilters } from "./RepaymentScheduleFilters";

export function RepaymentSchedule() {
  const { tabs, data, pagination, dates } = useRepaymentSchedule();

  const dummyFilters = {
    selectedLoan: "LN-2024-000123",
    selectedCustomer: "Rohit Sharma",
    fromDate: "01-05-2024",
    toDate: "30-04-2029",
    loanSearch: "",
    customerSearch: "",
    setSelectedLoan: () => {},
    setSelectedCustomer: () => {},
    setFromDate: () => {},
    setToDate: () => {},
    setLoanSearch: () => {},
    setCustomerSearch: () => {},
  };

  const dummyLookups = {
    loanOptions: [{ value: "LN-2024-000123", label: "LN-2024-000123 - Rohit Sharma" }],
    customerOptions: [{ value: "Rohit Sharma", label: "Rohit Sharma" }],
  };

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">
              Repayment Schedule
            </Title>
            <Group gap={6} mt={4}>
              <Text size="12.5px" c="dimmed">Home</Text>
              <Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed">Lending Reports</Text>
              <Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed" fw={500}>Repayment Schedule</Text>
            </Group>
          </div>
          <Group gap={10}>
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconDownload size={15} color="#1E40AF" />}
            >
              Download Schedule
            </Button>
            <Button
              size="sm"
              radius="md"
              leftSection={<IconPrinter size={15} />}
              style={{ background: "var(--mantine-color-brand-7)", color: "white" }}
            >
              Print Schedule
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        <RepaymentScheduleFilters filters={dummyFilters} lookups={dummyLookups} />

        {/* Loan Summary Cards */}
        <LoanSummaryCards info={data.scheduleInfo} />

        {/* Tabs */}
                <Tabs value={tabs.activeTab} onChange={(v) => tabs.setActiveTab(v || "schedule")}>
          <Box style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Tabs.List style={{ borderBottom: "none" }}>
              <Tabs.Tab value="schedule" fz="sm" fw={600}>
                Repayment Schedule
              </Tabs.Tab>
              <Tabs.Tab value="chart" fz="sm" fw={600}>
                Schedule Chart
              </Tabs.Tab>
            </Tabs.List>

            <Group gap="md" pb={8} pr={4}>
              
              <Group gap={6} style={{ cursor: "pointer", border: "1px solid var(--mantine-color-slate-2)", padding: "4px 10px", borderRadius: "4px", background: "white" }}>
                <IconCalendarDue size={14} color="var(--mantine-color-slate-5)" />
                <Text size="xs" c="slate.6" fw={500}>01 May 2024 - 30 Apr 2029</Text>
                <IconChevronDown size={14} color="var(--mantine-color-slate-5)" />
              </Group>
            </Group>
          </Box>

          <Box mt={4}>
            <Tabs.Panel value="schedule">
              <ScheduleTabContent
                info={data.scheduleInfo}
                paginatedRows={data.paginatedRows}
                page={pagination.page}
                setPage={pagination.setPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                fromDate={dates.fromDate}
                toDate={dates.toDate}
              />
            </Tabs.Panel>

            <Tabs.Panel value="chart">
              <ChartTabContent
                info={data.scheduleInfo}
                chartData={data.chartData}
                chartViewType={tabs.chartViewType}
                setChartViewType={tabs.setChartViewType}
              />
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Box>
    </Box>
  );
}
