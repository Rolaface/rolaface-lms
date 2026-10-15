import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  Box,
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconChartBar,
  IconChevronDown,
  IconCoins,
  IconFileSpreadsheet,
  IconHourglass,
  IconPercentage,
  IconSearch,
  IconWallet,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import { getInvestorReport } from "../../../api/Investor/investorFlowApi";
import { getEveryInvestmentProduct } from "../../../api/Investor/productApi";
import type {
  InvestorReportParams,
  InvestorReportRow,
} from "../../../types/Investor/investorFlow";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";
import { InvestorDateInput } from "../../../components/Modal/Investor/InvestorDateInput";
import { StatusBadge } from "../InvestorView/ui";
import { ReportInsights } from "./ReportInsights";

const STATUS_OPTIONS = [
  "Draft",
  "Approved",
  "Paid",
  "Matured",
  "Cancelled",
].map((v) => ({ value: v, label: v }));

const TH = {
  fontSize: "var(--mantine-font-size-xs)",
  fontWeight: 700,
  color: "var(--mantine-color-slate-5)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  whiteSpace: "nowrap" as const,
};

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0;

/** A summary card: label, value, a hint line and an optional progress bar. */
function SummaryCard({
  icon,
  color,
  label,
  value,
  hint,
  progress,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  hint: string;
  progress?: number;
}) {
  return (
    <Paper
      radius="lg"
      p="md"
      style={{
        background: "var(--mantine-color-white)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text
            fz={11}
            fw={600}
            c="slate.5"
            tt="uppercase"
            style={{ letterSpacing: 0.4 }}
          >
            {label}
          </Text>
          <Text fz="lg" fw={800} c="slate.9" truncate>
            {value}
          </Text>
          <Text fz={11} c="slate.5" truncate>
            {hint}
          </Text>
          {progress !== undefined && (
            <Progress
              value={progress}
              size={4}
              radius="xl"
              color={color}
              mt={6}
            />
          )}
        </Box>
      </Group>
    </Paper>
  );
}

export function InvestorReports() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const money = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });

  /* Filters */
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebouncedValue(searchInput, 350);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [product, setProduct] = useState<string | null>(null);
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: InvestorReportParams = {
    search: search.trim() || undefined,
    status: statusFilter,
    product,
    start_from: startFrom || undefined,
    start_to: startTo || undefined,
  };

  const { data, isFetching, error } = useQuery({
    queryKey: ["investorReport", filters, page, pageSize],
    queryFn: () => getInvestorReport({ ...filters, page, page_size: pageSize }),
    placeholderData: (previous) => previous,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["investmentProducts", "all"],
    queryFn: getEveryInvestmentProduct,
  });

  const rows = data?.rows ?? [];
  const totals = data?.totals;
  const totalRows = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);
  const resetPage = () => setPage(1);

  /* Export: every row matching the filters, with a totals row */
  const exportMutation = useMutation({
    mutationFn: () => getInvestorReport({ ...filters, page: 1, page_size: 0 }),
    onSuccess: (report) => {
      // The table's columns and values, as shown on screen.
      const sheet: Record<string, string>[] = report.rows.map((r) => ({
        "Name / Invst ID": `${r.investor} / ${r.investment_id}`,
        Investment: money(r.investment_amount),
        "Start Date": r.start_date
          ? formatInvestorDate(r.start_date)
          : "Not funded",
        "End Date": r.end_date ? formatInvestorDate(r.end_date) : "-",
        "Fund Recv": money(r.fund_received),
        "Prin Paid": money(r.principal_paid),
        Interest: money(r.total_interest),
        "Int Paid": money(r.interest_paid),
        Penalty: money(r.total_penalty),
        "Penal Paid": money(r.penalty_paid),
        "Paid out": money(r.amount_paid),
        Status: `${r.emis_paid}/${r.emis_total} Payouts · ${r.status}`,
      }));
      const t = report.totals;
      sheet.push({
        "Name / Invst ID": `Total (${t.investments} investments)`,
        Investment: money(t.investment_amount),
        "Start Date": "",
        "End Date": "",
        "Fund Recv": money(t.fund_received),
        "Prin Paid": money(t.principal_paid),
        Interest: money(t.total_interest),
        "Int Paid": money(t.interest_paid),
        Penalty: money(t.total_penalty),
        "Penal Paid": money(t.penalty_paid),
        "Paid out": money(t.amount_paid),
        Status: "",
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(sheet),
        "Investor Report",
      );
      saveAs(
        new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Investor_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    },
    onError: (e) =>
      openCommonModal({
        heading: "Export Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(e),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  const openInvestment = (r: InvestorReportRow) => {
    // Investor 360 with this investment open.
    const params = new URLSearchParams({
      investor: r.investor_id,
      investment: r.investment_id,
    });
    navigate({ href: `/investor/investments?${params.toString()}` });
  };

  const amountCell = (value: number, strong = false) => (
    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
      <Text fz="xs" fw={strong ? 700 : 500} c={value ? "slate.8" : "slate.4"}>
        {money(value)}
      </Text>
    </Table.Td>
  );

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconChartBar
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Investor Reports
            </Title>
            <Text fz="sm" c="slate.5">
              What each investment owes and what has been paid out to investors
            </Text>
          </Stack>
        </Group>
        <Button
          radius="xl"
          color="brand"
          leftSection={<IconFileSpreadsheet size={16} />}
          style={{ background: theme.other.brandGradient }}
          loading={exportMutation.isPending}
          disabled={totalRows === 0}
          onClick={() => exportMutation.mutate()}
        >
          Export Report (Excel)
        </Button>
      </Group>

      {/* Summary of every filtered investment */}
      {totals && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 6 }} spacing="md">
          <SummaryCard
            icon={<IconWallet size={18} />}
            color="brand"
            label="Invested"
            value={money(totals.investment_amount)}
            hint={`${totals.investments} investment(s) · ${totals.investors} investor(s)`}
          />
          <SummaryCard
            icon={<IconArrowBackUp size={18} />}
            color="success"
            label="Paid out"
            value={money(totals.amount_paid)}
            hint={`${pct(totals.amount_paid, totals.total_due).toFixed(1)}% of ${money(totals.total_due)} due`}
            progress={pct(totals.amount_paid, totals.total_due)}
          />
          <SummaryCard
            icon={<IconHourglass size={18} />}
            color="danger"
            label="Outstanding"
            value={money(totals.outstanding)}
            hint="Still to be paid out to investors"
          />
          <SummaryCard
            icon={<IconCoins size={18} />}
            color="info"
            label="Principal obligation"
            value={money(totals.total_principal)}
            hint={`${money(totals.principal_paid)} paid`}
            progress={pct(totals.principal_paid, totals.total_principal)}
          />
          <SummaryCard
            icon={<IconPercentage size={18} />}
            color="grape"
            label="Interest obligation"
            value={money(totals.total_interest)}
            hint={`${money(totals.interest_paid)} paid`}
            progress={pct(totals.interest_paid, totals.total_interest)}
          />
          <SummaryCard
            icon={<IconAlertTriangle size={18} />}
            color="warning"
            label="Penalty obligation"
            value={money(totals.total_penalty)}
            hint={`${money(totals.penalty_paid)} paid`}
            progress={pct(totals.penalty_paid, totals.total_penalty)}
          />
        </SimpleGrid>
      )}

      {/* Insights over the filtered investments */}
      {data && (
        <ReportInsights
          insights={data.insights}
          totals={data.totals}
          money={money}
        />
      )}

      {/* Filters */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs" wrap="wrap" align="center">
          <TextInput
            size="sm"
            radius="xl"
            placeholder="Investment ID / investor name, mobile, ID or email"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.currentTarget.value);
              resetPage();
            }}
          />
          <FilterMultiSelect
            placeholder="All except Cancelled"
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              resetPage();
            }}
            width={190}
          />
          <Select
            size="sm"
            radius="xl"
            w={180}
            clearable
            searchable
            placeholder="All Products"
            data={products.map((p) => ({
              value: p.name,
              label: p.product_name || p.name,
            }))}
            value={product}
            onChange={(v) => {
              setProduct(v);
              resetPage();
            }}
          />
          <InvestorDateInput
            size="sm"
            radius="xl"
            w={160}
            placeholder="From Date"
            clearable
            value={startFrom}
            onChange={(v) => {
              setStartFrom(v);
              resetPage();
            }}
          />
          <InvestorDateInput
            size="sm"
            radius="xl"
            w={160}
            placeholder="To Date"
            clearable
            value={startTo}
            onChange={(v) => {
              setStartTo(v);
              resetPage();
            }}
          />
          <Button
            size="sm"
            radius="xl"
            variant="default"
            onClick={() => {
              setSearchInput("");
              setStatusFilter([]);
              setProduct(null);
              setStartFrom("");
              setStartTo("");
              resetPage();
            }}
          >
            Reset
          </Button>
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        radius="lg"
        p="sm"
        style={{
          background: "var(--mantine-color-white)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {error ? (
          <Text fz="sm" c="red" ta="center" py="xl">
            {parseFrappeError(error)}
          </Text>
        ) : !data ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
            <Table.ScrollContainer minWidth={1300}>
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                highlightOnHover
                style={{ opacity: isFetching ? 0.6 : 1 }}
              >
                <Table.Thead
                  style={{ background: "var(--mantine-color-slate-0)" }}
                >
                  <Table.Tr>
                    <Table.Th style={TH}>Name / Invst ID</Table.Th>
                    <Table.Th style={TH} ta="right">
                      Investment
                    </Table.Th>
                    <Table.Th style={TH}>Start Date</Table.Th>
                    <Table.Th style={TH}>End Date</Table.Th>
                    <Table.Th style={TH} ta="right">
                      Fund Recv
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Prin Paid
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Interest
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Int Paid
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Penalty
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Penal Paid
                    </Table.Th>
                    <Table.Th style={TH} ta="right">
                      Paid out
                    </Table.Th>
                    <Table.Th style={TH}>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((r) => (
                    <Table.Tr
                      key={r.investment_id}
                      style={{ cursor: "pointer" }}
                      onClick={() => openInvestment(r)}
                    >
                      {/* Investor name, with the investment ID under it */}
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        <Text fz="xs" fw={700} c="slate.8">
                          {r.investor}
                        </Text>
                        <Text fz={11} fw={600} c="brand.7">
                          {r.investment_id}
                        </Text>
                      </Table.Td>
                      {amountCell(r.investment_amount, true)}
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        <Text fz="xs" c={r.start_date ? "slate.7" : "slate.4"}>
                          {r.start_date
                            ? formatInvestorDate(r.start_date)
                            : "Not funded"}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        <Text fz="xs" c="slate.7">
                          {r.end_date ? formatInvestorDate(r.end_date) : "-"}
                        </Text>
                      </Table.Td>
                      {amountCell(r.fund_received)}
                      {amountCell(r.principal_paid)}
                      {amountCell(r.total_interest)}
                      {amountCell(r.interest_paid)}
                      {amountCell(r.total_penalty)}
                      {amountCell(r.penalty_paid)}
                      {amountCell(r.amount_paid, true)}
                      {/* EMIs paid / total, with the status under it */}
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        <Tooltip
                          withArrow
                          label={`${money(r.amount_paid)} paid out of ${money(r.total_due)} · Outstanding ${money(r.outstanding)}`}
                        >
                          <Stack gap={4} align="flex-start">
                            <Text fz="xs" fw={700} c="slate.8">
                              {r.emis_paid}/{r.emis_total} Payouts
                            </Text>
                            <StatusBadge status={r.status} size="xs" />
                          </Stack>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {rows.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={12}>
                        <Text fz="sm" c="slate.5" ta="center" py="lg">
                          No investments match these filters.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                {totals && rows.length > 0 && (
                  <Table.Tfoot
                    style={{ background: "var(--mantine-color-slate-0)" }}
                  >
                    <Table.Tr>
                      <Table.Td>
                        <Text fz="xs" fw={800} c="slate.8">
                          Total ({totals.investments} investments)
                        </Text>
                      </Table.Td>
                      {amountCell(totals.investment_amount, true)}
                      <Table.Td colSpan={2} />
                      {amountCell(totals.fund_received, true)}
                      {amountCell(totals.principal_paid, true)}
                      {amountCell(totals.total_interest, true)}
                      {amountCell(totals.interest_paid, true)}
                      {amountCell(totals.total_penalty, true)}
                      {amountCell(totals.penalty_paid, true)}
                      {amountCell(totals.amount_paid, true)}
                      <Table.Td />
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </Table.ScrollContainer>

            {/* Pagination */}
            <Group justify="space-between" px="sm" pt="xs">
              <Group
                gap="sm"
                c="slate.6"
                style={{ fontSize: "var(--mantine-font-size-xs)" }}
              >
                <span>
                  {totalRows === 0
                    ? "Showing 0 of 0"
                    : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
                </span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={["10", "20", "50"]}
                    value={String(pageSize)}
                    onChange={(v) => {
                      setPageSize(Number(v) || 10);
                      resetPage();
                    }}
                    rightSection={
                      <IconChevronDown size={14} style={{ opacity: 0.6 }} />
                    }
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                color="brand"
                size="xs"
                radius="xl"
                disabled={totalRows === 0}
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
