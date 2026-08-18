import { useCallback } from "react";
import { Box, Button, Group, Title, Alert, Text } from "@mantine/core";
import { IconFileSpreadsheet, IconFileAlert, IconAlertCircle } from "@tabler/icons-react";
import { useLoanArrear } from "../../../hooks/Report/Arrear/useLoanArrear"; 

import { formatAmount, usePrefetchCurrencies } from "../../../store/currencyStore"; 

import { ArrearFilters } from "./ArrearFilters";
import { ArrearSummaryCards } from "./ArrearSummaryCards";
import { ArrearCharts } from "./ArrearCharts";
import { ArrearTable } from "./ArrearTable";
import { ArrearInsights } from "./ArrearInsights";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

export function ArrearReports() {
  const {
    filters, lookups, paginationState, actions,
    data: { summary, charts, insights, topAccounts, paginationMeta },
    status: { loadingDashboard, loadingTable, error, exporting },
  } = useLoanArrear();

  const currencyCode = (summary as any)?.currency || "INR";
  
  usePrefetchCurrencies(summary, (s: any) => [s?.currency || "INR"]);

  const renderCurrency = useCallback((val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === "") return "-";
    return formatAmount(currencyCode, Number(val), { withSymbol: true });
  }, [currencyCode]);

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full relative">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        
        {/* Page Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">Arrear Reports</Title>
            <Group gap={6} mt={4}>
              <Text size="12.5px" c="dimmed">Home</Text><Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed">Lending Reports</Text><Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed" fw={500}>Arrear Reports</Text>
            </Group>
          </div>
          <Group gap={10}>
            <Button 
              variant="default" size="sm" radius="md" loading={exporting} onClick={actions.handleExport}
              leftSection={<IconFileSpreadsheet size={15} style={{ color: cv("brand", 6) }} />}
            >
              Export Excel
            </Button>
            <Button size="sm" radius="md" color="brand" leftSection={<IconFileAlert size={15} />}>
              Generate Report
            </Button>
          </Group>
        </Group>

        {/* Global Filters */}
        <ArrearFilters filters={filters} lookups={lookups} actions={actions} />

        {error && (
          <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        {/* Top Summaries */}
        <ArrearSummaryCards summary={summary} loadingDashboard={loadingDashboard} renderCurrency={renderCurrency} />

        {/* Charts Row */}
        <ArrearCharts summary={summary} charts={charts} loadingDashboard={loadingDashboard} renderCurrency={renderCurrency} />

        {/* Data Table & Insights */}
        <div className="grid grid-cols-[2.2fr_1fr] gap-3 items-start relative">
          <ArrearTable 
            topAccounts={topAccounts} 
            paginationState={paginationState} 
            paginationMeta={paginationMeta} 
            loadingTable={loadingTable} 
            renderCurrency={renderCurrency} 
          />
          <ArrearInsights 
            insights={insights} 
            loadingDashboard={loadingDashboard} 
            renderCurrency={renderCurrency} 
          />
        </div>

      </Box>
    </Box>
  );
}

export default ArrearReports;