import { useMemo, useCallback } from "react";
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Loader,
  Alert,
} from "@mantine/core";
import {
  IconEye,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconAlertCircle,
  IconFileText,
  IconReceipt2,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconWallet,
  IconArrowUp,
  IconArrowDown,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useLoanStatement } from "../../hooks/Report/LoanStatement/useLoanStatement";
import type { StatementRow, StatementSort } from "../../types/Report/loanStatement";
import { formatAmount, usePrefetchCurrencies } from "../../store/currencyStore";

const theme = {
  brand: {
    0: "#EFF6FF",
    1: "#DBEAFE",
    5: "#3B82F6",
    6: "#1E40AF",
    7: "#1E3A8A",
  },
  accent: { 0: "#DCFCE7", 1: "#BBF7D0", 5: "#22C55E", 6: "#16A34A" },
  gold: { 0: "#FEF3C7", 1: "#FDE68A", 5: "#F59E0B", 6: "#D97706" },
  danger: { 0: "#FEE2E2", 1: "#FECACA", 5: "#EF4444", 6: "#DC2626" },
  indigoAlt: { 0: "#F3E8FF", 1: "#E9D5FF", 5: "#8B5CF6", 6: "#7C3AED" },
};

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  "Opening Balance": { bg: "#F1F5F9", color: "#64748B" },
  Disbursal: { bg: theme.indigoAlt[0], color: theme.indigoAlt[6] },
  Charge: { bg: theme.gold[0], color: theme.gold[6] },
  Repayment: { bg: theme.brand[0], color: theme.brand[6] },
  Interest: { bg: theme.accent[0], color: theme.accent[6] },
};

const inputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input:
    "min-h-[28px] h-[28px] text-[11.5px] px-2 border-slate-200 rounded-lg focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

function SortIcon({ active, direction }: { active: boolean; direction: StatementSort["direction"] }) {
  if (!active) return <IconSelector size={13} className="text-slate-300" />;
  return direction === "asc" ? (
    <IconChevronUp size={13} className="text-slate-500" />
  ) : (
    <IconChevronDown size={13} className="text-slate-500" />
  );
}

function SummaryCard({ card }: { card: any }) {
  const Icon = card.icon;
  const c = theme[card.color as keyof typeof theme] || theme.brand;
  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      className="flex-1 min-w-[190px] border-slate-200"
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} c={card.highlight ? theme.brand[6] : "dimmed"}>
          {card.label}
        </Text>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: c[0], color: (c as any)[6] }}
        >
          <Icon size={16} />
        </div>
      </Group>
      <Text fw={800} className="text-[17px] text-slate-900 mt-1.5">
        {card.value}
      </Text>
      <Text size="10.5px" c="dimmed" mt={1}>
        {card.note}
      </Text>
    </Paper>
  );
}

function ChartCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      className="border-slate-200 flex flex-col"
    >
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={700} className="text-slate-800">
          {title}
        </Text>
        {right}
      </Group>
      {children}
    </Paper>
  );
}

const columnHelper = createColumnHelper<StatementRow>();

export function LoanStatement() {
  const { filters, lookups, searchState, paginationState, sortState, data, status, actions } = useLoanStatement();

  const { dashboardData, rows, pagination } = data;
  const { sort, toggleSort } = sortState;

  const currencyCode = dashboardData?.snapshot?.currency;
  usePrefetchCurrencies(dashboardData, (d) => [d?.snapshot?.currency]);

  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "-";
      return formatAmount(currencyCode, val, { withSymbol: true });
    },
    [currencyCode]
  );

  const customerOptions = (lookups?.customers || [])
    .map((c: any) => {
      if (typeof c === "string") return { value: c, label: c };
      return {
        value: String(c?.value ?? c?.name ?? c?.id ?? ""),
        label: String(c?.label ?? c?.customer_name ?? c?.name ?? ""),
      };
    })
    .filter((c) => c.value);

  const loanOptions = (lookups?.loans || [])
    .map((l: any) => {
      if (typeof l === "string") return { value: l, label: l };
      return {
        value: String(l?.value ?? l?.name ?? l?.id ?? ""),
        label: String(l?.label ?? l?.loan_product ?? l?.name ?? ""),
      };
    })
    .filter((l) => l.value);

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => <div className="text-slate-500">{info.getValue()}</div>,
      }),
      columnHelper.accessor("particulars", {
        header: "Particulars",
        enableSorting: false,
        cell: (info) => <div className="text-slate-700">{info.getValue()}</div>,
      }),
      columnHelper.accessor("reference_no", {
        header: "Reference No.",
        enableSorting: false,
        cell: (info) => (
          <div className="text-slate-400 font-mono text-[11.5px]">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("transaction_type", {
        header: "Transaction Type",
        enableSorting: false,
        cell: (info) => {
          const type = info.getValue();
          const b = TYPE_BADGE[type] || { bg: "#F1F5F9", color: "#64748B" };
          return (
            <Badge
              radius="sm"
              size="sm"
              style={{
                backgroundColor: b.bg,
                color: b.color,
                textTransform: "none",
              }}
            >
              {type}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("debit", {
        header: "Debit",
        enableSorting: false,
        cell: (info) => (
          <div className="text-slate-600 text-right">
            {info.getValue() > 0 ? renderCurrency(info.getValue()) : "-"}
          </div>
        ),
      }),
      columnHelper.accessor("credit", {
        header: "Credit",
        enableSorting: false,
        cell: (info) => (
          <div className="text-slate-600 text-right">
            {info.getValue() > 0 ? renderCurrency(info.getValue()) : "-"}
          </div>
        ),
      }),
      columnHelper.accessor("balance", {
        header: "Balance",
        cell: (info) => (
          <div className="text-slate-800 font-bold text-right">
            {renderCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: () => (
          <Group gap={4} justify="flex-end">
            <Tooltip label="View">
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      }),
    ],
    [renderCurrency]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const totalRows = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 1;
  const firstRow =
    totalRows === 0
      ? 0
      : (paginationState.page - 1) * paginationState.pageSize + 1;
  const lastRow = Math.min(
    totalRows,
    paginationState.page * paginationState.pageSize
  );

  const balanceTrend = dashboardData?.balance_trend || [];
  const cashFlow =
    dashboardData?.cash_flow?.map((c: any) => ({
      month: c.month,
      Disbursal: c.disbursal,
      Repayment: c.repayment,
      "Charges/Interest": c.charges,
    })) || [];

  const currentPct =
    dashboardData?.aging_summary?.find((a) => a.label === "Current")
      ?.percentage || 0;
  const agingPie = [
    { name: "Current", value: currentPct, color: theme.brand[6] },
    { name: "Rest", value: 100 - currentPct || 0.0001, color: "#E5E7EB" },
  ];
  const agingColors = [
    theme.brand[6],
    theme.gold[6],
    theme.danger[6],
    theme.indigoAlt[6],
    theme.brand[8],
  ];

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">
              Loan Statement
            </Title>
            <Group gap={6} mt={4}>
              <Text size="12.5px" c="dimmed">
                Home
              </Text>
              <Text size="12.5px" c="dimmed">
                ›
              </Text>
              <Text size="12.5px" c="dimmed">
                Loan
              </Text>
              <Text size="12.5px" c="dimmed">
                ›
              </Text>
              <Text size="12.5px" c="dimmed" fw={500}>
                Loan Statement
              </Text>
            </Group>
          </div>
          <Group gap={10}>
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconFileText size={15} color="#DC2626" />}
              loading={status.exportingType === "pdf"}
              onClick={() => actions.handleExport("pdf")}
            >
              Export PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconFileSpreadsheet size={15} color="#1E40AF" />}
              loading={status.exportingType === "excel"}
              onClick={() => actions.handleExport("excel")}
            >
              Export Excel
            </Button>
          </Group>
        </Group>

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
              rightSection={
                <IconChevronDown size={13} className="text-slate-400" />
              }
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
                  const matchedLoan = lookups.loans.find((l: any) => String(l.value) === String(val));
                  if (matchedLoan && matchedLoan.applicant) {
                    filters.setCustomerId(matchedLoan.applicant);
                  }
                }
              }}
              searchable
              classNames={inputClassNames}
              className="w-[230px]"
              rightSection={
                <IconChevronDown size={13} className="text-slate-400" />
              }
            />
            <TextInput
              label="From Date"
              withAsterisk
              type="date"
              value={filters.fromDate}
              onChange={(e) => filters.setFromDate(e.currentTarget.value)}
              classNames={inputClassNames}
              className="w-[180px]"
              rightSection={
                <IconCalendar size={14} className="text-slate-400" />
              }
            />
            <TextInput
              label="To Date"
              withAsterisk
              type="date"
              value={filters.toDate}
              onChange={(e) => filters.setToDate(e.currentTarget.value)}
              classNames={inputClassNames}
              className="w-[180px]"
              rightSection={
                <IconCalendar size={14} className="text-slate-400" />
              }
            />
          </div>
        </Paper>

        <div>
          <Group justify="space-between" mb={8}>
            <Title order={5} className="text-slate-900">
              Loan Statement Summary
            </Title>
            <Group
              gap={4}
              className="rounded-lg border border-slate-200 p-1 bg-white"
            >
              {["summary", "detailed"].map((t) => (
                <Button
                  key={t}
                  size="xs"
                  radius="md"
                  variant="subtle"
                  onClick={() => filters.setViewType(t as any)}
                  className="px-3"
                  styles={{
                    root:
                      filters.viewType === t
                        ? {
                            backgroundColor: theme.brand[0],
                            color: theme.brand[6],
                          }
                        : { color: "#94A3B8", backgroundColor: "transparent" },
                  }}
                >
                  <Text
                    size="12.5px"
                    fw={700}
                    inherit
                    style={{ textTransform: "capitalize" }}
                  >
                    {t === "summary" ? "Summary View" : "Detailed"}
                  </Text>
                </Button>
              ))}
            </Group>
          </Group>

          <Group
            gap="sm"
            wrap="nowrap"
            className="overflow-x-auto relative min-h-[90px]"
          >
            {status.loadingDashboard && (
              <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                <Loader size="sm" color="blue" />
              </div>
            )}
            {[
              {
                label: "Opening Balance",
                value: renderCurrency(dashboardData?.summary?.opening_balance),
                icon: IconWallet,
                color: "indigoAlt",
              },
              {
                label: "Total Disbursed",
                value: renderCurrency(dashboardData?.summary?.total_disbursed),
                icon: IconArrowDown,
                color: "accent",
              },
              {
                label: "Total Repayments",
                value: renderCurrency(dashboardData?.summary?.total_repayments),
                icon: IconArrowUp,
                color: "brand",
              },
              {
                label: "Total Charges",
                value: renderCurrency(dashboardData?.summary?.total_charges),
                icon: IconReceipt2,
                color: "gold",
              },
              {
                label: "Closing Balance",
                value: renderCurrency(dashboardData?.summary?.closing_balance),
                icon: IconWallet,
                color: "brand",
                highlight: true,
              },
            ].map((c) => (
              <SummaryCard key={c.label} card={c} />
            ))}
          </Group>
        </div>

        <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-3 relative">
          {status.loadingDashboard && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
              <Loader size="sm" color="blue" />
            </div>
          )}

          <ChartCard
            title="Balance Trend"
            right={
              <Button
                variant="default"
                size="xs"
                radius="md"
                rightSection={<IconChevronDown size={12} />}
              >
                Monthly
              </Button>
            }
          >
            <div className="h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={balanceTrend}
                  margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={theme.indigoAlt[6]}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={theme.indigoAlt[6]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v / 1000}k`}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <RTooltip
                    formatter={(v: number) => renderCurrency(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={theme.indigoAlt[6]}
                    strokeWidth={2}
                    fill="url(#bal)"
                    dot={{ r: 3, fill: theme.indigoAlt[6] }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Group gap={6} mt={4}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.indigoAlt[6] }}
              />
              <Text size="11px" c="dimmed">
                Closing Balance
              </Text>
            </Group>
          </ChartCard>

          <ChartCard title="Cash Flow">
            <div className="h-[165px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cashFlow}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v / 1000}k`}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <RTooltip
                    formatter={(v: number) => renderCurrency(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="Disbursal"
                    fill={theme.indigoAlt[6]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="Repayment"
                    fill={theme.brand[6]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="Charges/Interest"
                    fill={theme.gold[6]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Group gap={12} mt={4}>
              <Group gap={4}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.indigoAlt[6] }}
                />
                <Text size="11px" c="dimmed">
                  Disbursal
                </Text>
              </Group>
              <Group gap={4}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.brand[6] }}
                />
                <Text size="11px" c="dimmed">
                  Repayment
                </Text>
              </Group>
              <Group gap={4}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.gold[6] }}
                />
                <Text size="11px" c="dimmed">
                  Charges/Interest
                </Text>
              </Group>
            </Group>
          </ChartCard>

          <ChartCard title="Loan Snapshot">
            <div className="flex flex-col gap-1.5 overflow-y-auto h-full pr-1">
              {[
                ["Currency", dashboardData?.snapshot?.currency || "-"],
                ["Loan Account", dashboardData?.snapshot?.loan_account || "-"],
                ["Loan Product", dashboardData?.snapshot?.loan_product || "-"],
                [
                  "Loan Amount",
                  renderCurrency(dashboardData?.snapshot?.loan_amount),
                ],
                [
                  "Disbursed Amount",
                  renderCurrency(dashboardData?.snapshot?.disbursed_amount),
                ],
                ["ROI (%)", `${dashboardData?.snapshot?.roi || 0}%`],
                [
                  "EMI Amount",
                  renderCurrency(dashboardData?.snapshot?.emi_amount),
                ],
                [
                  "EMI Start Date",
                  dashboardData?.snapshot?.emi_start_date || "-",
                ],
                [
                  "Next Due Date",
                  dashboardData?.snapshot?.next_due_date || "-",
                ],
                [
                  "EMIs Paid / Total",
                  dashboardData?.snapshot?.emis_paid || "-",
                ],
              ].map(([k, v], idx) => (
                <Group key={idx} justify="space-between">
                  <Text size="12.5px" c="dimmed">
                    {k}
                  </Text>
                  <Text size="12.5px" fw={700} className="text-slate-800">
                    {v}
                  </Text>
                </Group>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Aging Summary (DPD)">
            <div className="flex flex-col items-center">
              <div className="relative w-[92px] h-[92px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agingPie}
                      dataKey="value"
                      innerRadius={30}
                      outerRadius={42}
                      startAngle={90}
                      endAngle={450}
                      stroke="none"
                    >
                      {agingPie.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Text size="11px" fw={700} className="text-slate-700">
                    Current
                  </Text>
                  <Text size="10px" c="dimmed">
                    {currentPct}%
                  </Text>
                </div>
              </div>
              <div className="w-full flex flex-col gap-1.5 mt-3">
                {dashboardData?.aging_summary?.map((a, i) => (
                  <Group key={a.label} justify="space-between">
                    <Group gap={6}>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: agingColors[i % agingColors.length],
                        }}
                      />
                      <Text size="11px" c="dimmed">
                        {a.label}
                      </Text>
                    </Group>
                    <Text size="11px" fw={500} className="text-slate-700">
                      {a.percentage}% ({renderCurrency(a.amount)})
                    </Text>
                  </Group>
                ))}
              </div>
              <Text
                size="10px"
                c="dimmed"
                mt={8}
                className="self-start opacity-70"
              >
                * DPD as on today
              </Text>
            </div>
          </ChartCard>
        </div>

        <Paper
          withBorder
          radius="lg"
          className="border-slate-200 overflow-hidden"
        >
          <Group
            justify="space-between"
            p="sm"
            className="border-b border-slate-100"
          >
            <Title order={5} className="text-slate-900">
              Loan Statement Details
            </Title>
            <Group gap={10}>
              <TextInput
                placeholder="Search transactions..."
                leftSection={
                  <IconSearch size={14} className="text-slate-400" />
                }
                value={searchState.search}
                onChange={(e) => searchState.setSearch(e.currentTarget.value)}
                classNames={{
                  input: "h-9 w-56 rounded-lg border-slate-200 text-[12.5px]",
                }}
              />
              <Button
                variant="default"
                size="sm"
                radius="md"
                leftSection={<IconFilter size={13} />}
              >
                Filter
              </Button>
              <ActionIcon
                variant="default"
                size={36}
                radius="md"
                onClick={() => actions.handleExport("excel")}
                loading={status.exportingType === "excel"}
              >
                <IconDownload size={14} />
              </ActionIcon>
              <ActionIcon variant="filled" color="blue" size={36} radius="md">
                <IconPlus size={16} />
              </ActionIcon>
            </Group>
          </Group>

          <div className="overflow-x-auto min-h-[250px] relative">
            {status.loadingTable ? (
              <Group
                justify="center"
                align="center"
                className="absolute inset-0 z-10 bg-white/70"
              >
                <Loader color="blue" size="md" />
              </Group>
            ) : status.error ? (
              <Alert
                variant="light"
                color="red"
                icon={<IconAlertCircle size={16} />}
                m="md"
              >
                {status.error}
              </Alert>
            ) : rows.length === 0 ? (
              <Alert
                variant="light"
                color="blue"
                icon={<IconAlertCircle size={16} />}
                m="md"
              >
                No transactions match the selected criteria.
              </Alert>
            ) : (
              <Table
                verticalSpacing="xs"
                horizontalSpacing="md"
                className="text-[12.5px]"
              >
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id} className="text-slate-400">
                      {headerGroup.headers.map((header) => {
                        const canSort =
                          header.column.id === "date" ||
                          header.column.id === "balance";
                        const isActive = sort.field === header.column.id;

                        const isRightAligned = [
                          "debit",
                          "credit",
                          "balance",
                          "actions",
                        ].includes(header.column.id);

                        return (
                          <Table.Th
                            key={header.id}
                            onClick={
                              canSort
                                ? () => toggleSort(header.column.id)
                                : undefined
                            }
                            className={canSort ? "cursor-pointer" : ""}
                          >
                            <Group
                              gap={4}
                              justify={
                                isRightAligned ? "flex-end" : "flex-start"
                              }
                              wrap="nowrap"
                            >
                              <Text size="12px" fw={600} c="dimmed">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </Text>
                              {canSort && (
                                <SortIcon
                                  active={isActive}
                                  direction={sort.direction}
                                />
                              )}
                            </Group>
                          </Table.Th>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Thead>
                <Table.Tbody>
                  {table.getRowModel().rows.map((row) => (
                    <Table.Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </div>

          <Group
            justify="space-between"
            p="sm"
            className="border-t border-slate-100"
          >
            <Text size="12px" c="dimmed">
              Showing {totalRows === 0 ? 0 : firstRow} to {lastRow} of{" "}
              {totalRows} entries
            </Text>
            <Group gap={12}>
              <Pagination
                total={totalPages}
                value={paginationState.page}
                onChange={paginationState.setPage}
                color="blue"
                size="sm"
                radius="md"
                disabled={status.loadingTable}
              />
              <Select
                data={[
                  { value: "5 / page", label: "5 / page" },
                  { value: "10 / page", label: "10 / page" },
                  { value: "20 / page", label: "20 / page" },
                  { value: "50 / page", label: "50 / page" },
                ]}
                value={`${paginationState.pageSize} / page`}
                onChange={(v) =>
                  v &&
                  paginationState.setPageSize(parseInt(v.split(" ")[0], 10))
                }
                classNames={{
                  input: "h-8 text-[12px] w-28 rounded-lg border-slate-200",
                }}
                rightSection={
                  <IconChevronDown size={12} className="text-slate-400" />
                }
                disabled={status.loadingTable}
              />
            </Group>
          </Group>
        </Paper>
      </Box>
    </Box>
  );
}

export default LoanStatement;