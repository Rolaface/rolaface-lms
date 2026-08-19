import { useCallback } from "react";
import { Box, Button, Group, Title, Text } from "@mantine/core";
import { IconFileText, IconFileSpreadsheet } from "@tabler/icons-react";

import { useLoanStatement } from "../../../hooks/Report/LoanStatement/useLoanStatement";
import { formatAmount, usePrefetchCurrencies } from "../../../store/currencyStore";

import { LoanStatementFilters } from "./LoanStatementFilters";
import { LoanStatementSummaryCards } from "./LoanStatementSummaryCards";
import { LoanStatementCharts } from "./LoanStatementCharts";
import { LoanStatementTable } from "./LoanStatementTable";

export function LoanStatement() {
  const { filters, lookups, searchState, paginationState, sortState, data, status, actions } = useLoanStatement();
  const { dashboardData, rows, pagination } = data;

  const currencyCode = dashboardData?.snapshot?.currency;
  usePrefetchCurrencies(dashboardData, (d) => [d?.snapshot?.currency]);

  // Updated renderCurrency with "M" formatting for millions
  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "-";
      const num = Number(val);
      if (isNaN(num)) return "-";

      if (num >= 1000000) {
        return `${formatAmount(currencyCode, num / 1000000, { withSymbol: true })}M`;
      }
      return formatAmount(currencyCode, num, { withSymbol: true });
    },
    [currencyCode]
  );

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        
        {/* Header Section */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">Loan Statement</Title>
            <Group gap={6} mt={4}>
              <Text size="12.5px" c="dimmed">Home</Text><Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed">Loan</Text><Text size="12.5px" c="dimmed">›</Text>
              <Text size="12.5px" c="dimmed" fw={500}>Loan Statement</Text>
            </Group>
          </div>
          <Group gap={10}>
            <Button
              variant="default" size="sm" radius="md" leftSection={<IconFileText size={15} color="#DC2626" />}
              loading={status.exportingType === "pdf"} onClick={() => actions.handleExport("pdf")}
            >
              Export PDF
            </Button>
            <Button
              variant="default" size="sm" radius="md" leftSection={<IconFileSpreadsheet size={15} color="#1E40AF" />}
              loading={status.exportingType === "excel"} onClick={() => actions.handleExport("excel")}
            >
              Export Excel
            </Button>
          </Group>
        </Group>

        {/* Modular Sections */}
        <LoanStatementFilters filters={filters} lookups={lookups} />
        
        <LoanStatementSummaryCards dashboardData={dashboardData} loadingDashboard={status.loadingDashboard} renderCurrency={renderCurrency} />
        
        <LoanStatementCharts dashboardData={dashboardData} loadingDashboard={status.loadingDashboard} renderCurrency={renderCurrency} />
        
        <LoanStatementTable 
          rows={rows} 
          pagination={pagination}
          paginationState={paginationState}
          sortState={sortState}
          searchState={searchState}
          status={status}
          actions={actions}
          renderCurrency={renderCurrency}
        />
        
      </Box>
    </Box>
  );
}

export default LoanStatement;