import { Box, Button, Group, Tabs, Text, Title, SegmentedControl } from "@mantine/core";
import { IconDownload, IconPrinter, IconCalendarDue } from "@tabler/icons-react";
import { useRepaymentSchedule } from "../../../hooks/Report/RepaymentSchedule/useRepaymentSchedule";
import { LoanSummaryCards } from "./LoanSummaryCards";
import { ScheduleTabContent } from "./ScheduleTabContent";
import { ChartTabContent } from "./ChartTabContent";
import { RepaymentScheduleFilters } from "./RepaymentScheduleFilters";

export function RepaymentSchedule() {
  const {
    filters,
    scheduleInfo,
    paginatedRows,
    chartData,
    lookups,
    loading,
    error,
    activeTab,
    setActiveTab,
    chartViewType,
    setChartViewType,
    page,
    setPage,
    totalPages,
    pageSize,
  } = useRepaymentSchedule();

  const fmt = (iso: any) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">
              Repayment Schedule
            </Title>
            <Group gap={6} mt={4}>
              <Text size="12.5px" c="dimmed">Home</Text>
              <Text size="12.5px" c="dimmed">/</Text>
              <Text size="12.5px" c="dimmed">Lending Reports</Text>
              <Text size="12.5px" c="dimmed">/</Text>
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

        <RepaymentScheduleFilters filters={filters} lookups={lookups} />
        <LoanSummaryCards info={scheduleInfo} />

        <Tabs value={activeTab} onChange={(v) => setActiveTab(v || "schedule")}>
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
              <Group gap={6} style={{ border: "1px solid var(--mantine-color-slate-2)", padding: "4px 10px", borderRadius: "4px", background: "white" }}>
                <IconCalendarDue size={14} color="var(--mantine-color-slate-5)" />
                <Text size="xs" c="slate.6" fw={500}>
                  {filters.fromDate ? fmt(filters.fromDate) : ""}
                  {" - "}
                  {filters.toDate ? fmt(filters.toDate) : ""}
                </Text>
              </Group>
            </Group>
          </Box>

          <Box mt={4} className="flex-1 flex items-stretch w-full">
            <Tabs.Panel value="schedule" className="w-full">
              <div className="h-full w-full flex items-stretch">
              <ScheduleTabContent
                info={scheduleInfo}
                paginatedRows={paginatedRows}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                pageSize={pageSize}
                fromDate={filters.fromDate}
                toDate={filters.toDate}
              />
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="chart" className="w-full">
              <div className="h-full w-full flex items-stretch">
              <ChartTabContent
                info={scheduleInfo}
                chartData={chartData}
                chartViewType={chartViewType}
                setChartViewType={setChartViewType}
              />
              </div>
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Box>
    </Box>
  );
}
