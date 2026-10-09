import { useMemo, useCallback, useState } from "react";
import LosDashboard from "./Origination/LosDashboard";
import {
  Box,
  Paper,
  Text,
  Title,
  Group,
  Button,
  ActionIcon,
  Table,
  Badge,
  Tooltip,
  Loader,
  Pagination,
  RingProgress,
  Progress,
  SimpleGrid,
  Modal,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconFileText,
  IconUsers,
  IconCashBanknote,
  IconApps,
  IconCalendar,
  IconRefresh,
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconTrophy,
  IconTrendingUp,
  IconClock,
  IconAlertTriangle,
  IconUsersGroup,
  IconChevronRight,
  IconInbox,
} from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { useLoanDashboard } from "../hooks/Dashboard/useLoanDashboard";
import { formatAmount, usePrefetchCurrencies } from "../store/currencyStore";
import { useCompanyStore } from "../store/companyStore";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

const GROSS_NPA_TREND = [
  { m: 1, v: 3.1 }, { m: 2, v: 3.3 }, { m: 3, v: 3.0 }, { m: 4, v: 3.4 },
  { m: 5, v: 3.2 }, { m: 6, v: 3.5 }, { m: 7, v: 3.42 },
];
const NET_NPA_TREND = [
  { m: 1, v: 1.6 }, { m: 2, v: 1.9 }, { m: 3, v: 1.7 }, { m: 4, v: 2.0 },
  { m: 5, v: 1.75 }, { m: 6, v: 1.95 }, { m: 7, v: 1.82 },
];

const PRIORITY_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  High: { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
  Medium: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  Low: { bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC" },
};

const formatDateValue = (val: any) => {
  if (!val) return "";
  if (typeof val === "string") return val.split("T")[0];
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function MetricCard({
  title,
  value,
  secondaryValue,
  loading,
}: {
  title: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Paper p="md" radius="md" shadow="sm" withBorder className="relative overflow-hidden bg-white">
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
          <Loader size="sm" color="brand" />
        </div>
      )}
      <Text size="xs" fw={700} c="slate.5" mb={4} tt="uppercase">
        {title}
      </Text>
      <Group align="flex-end" gap="xs">
        <Text size="xl" fw={800} c="slate.8">
          {value}
        </Text>
        {secondaryValue && (
          <Text size="sm" fw={700} c="dimmed" mb={4}>
            {secondaryValue}
          </Text>
        )}
      </Group>
    </Paper>
  );
}

function PanelCard({
  title,
  info,
  loading,
  rightSection,
  children,
}: {
  title: string;
  info?: boolean;
  loading?: boolean;
  rightSection?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      className="bg-white border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] relative overflow-hidden flex flex-col h-full"
    >
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="brand" />
        </div>
      )}
      <div className="flex justify-between items-center mb-2.5">
        <Group gap={6}>
          <Text size="13.5px" fw={700} className="text-slate-800 tracking-tight">
            {title}
          </Text>
          {info && (
            <Tooltip label={`${title} details`} withArrow position="top">
              <IconInfoCircle size={14} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
            </Tooltip>
          )}
        </Group>
        {rightSection}
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </Paper>
  );
}

const getRiskGradeColors = (code: string) => {
  const c = code.toUpperCase();
  if (c.includes("PASS") || c.includes("STANDARD")) return { bg: "#F0FDF4", color: "#15803D", badge: "green" };
  if (c.includes("SPECIAL") || c.includes("WATCH")) return { bg: "#FFFBEB", color: "#B45309", badge: "gold" };
  if (c.includes("SUBSTANDARD")) return { bg: "#FFF7ED", color: "#C2410C", badge: "orange" };
  if (c.includes("DOUBT") || c.includes("LOSS")) return { bg: "#FEF2F2", color: "#B91C1C", badge: "danger" };
  return { bg: "#F8FAFC", color: "#475569", badge: "slate" };
};

const splitCurrency = (val: string) => {
  if (!val) return val;
  const parts = val.split(" ");
  if (parts.length > 1) {
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[10px] text-slate-400 font-medium">{parts[0]}</span>
        <span className="font-semibold text-slate-700">{parts.slice(1).join(" ")}</span>
      </div>
    );
  }
  return val;
};

export function Dashboard() {
  const entryMode = (typeof window !== "undefined" && localStorage.getItem("lms_entry_mode")) === "los" ? "los" : "lending";

  if (entryMode === "los") {
    return <LosDashboard />;
  }

  const { data, status, actions, filters, pagination } = useLoanDashboard();
  const [riskModalOpen, setRiskModalOpen] = useState(false);

  const currencyCode = useCompanyStore((state) => state.baseCurrency) || "ZMW";
  usePrefetchCurrencies({ currencyCode }, (d) => [d.currencyCode]);

  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return `${currencyCode} 0.00`;
      const num = Number(val);
      if (isNaN(num)) return `${currencyCode} 0.00`;
      return formatAmount(currencyCode, num, { withSymbol: true });
    },
    [currencyCode]
  );

  const renderSmartCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return `${currencyCode} 0`;
      const num = Number(val);
      if (isNaN(num)) return `${currencyCode} 0`;

      if (num >= 1_000_000) {
        return `${formatAmount(currencyCode, num / 1_000_000, { withSymbol: true })}M`;
      }
      return formatAmount(currencyCode, num, { withSymbol: true });
    },
    [currencyCode]
  );

  const STATS = useMemo(
    () => [
      {
        title: "Total Loans",
        value: (data.summary?.total_loans || 0).toLocaleString(),
      },
      {
        title: "Active Customers",
        value: (data.summary?.active_customers || 0).toLocaleString(),
      },
      {
        title: "Total Disbursed",
        value: renderSmartCurrency(data.summary?.total_disbursed || 0),
      },
      {
        title: "Pending Applications",
        value: (data.summary?.pending_applications || 0).toLocaleString(),
      },
    ],
    [data.summary, renderSmartCurrency]
  );

  const eff = data.charts?.collection_efficiency;
  const npa = data.charts?.npa;
  const classifications = data.charts?.portfolio_classification?.classifications || [];
  const totalPortfolio = data.charts?.portfolio_classification?.total_portfolio || 0;
  const TREND = data.charts?.disbursement_vs_collection_trend || [];

  const ins = data.insights;
  const QUICK_INSIGHTS = [
    { icon: IconTrophy, color: "brand", label: "Top Loan Product", value: ins?.top_loan_product?.loan_product || "-", note: `${ins?.top_loan_product?.pct_of_total || 0}% of total disbursed` },
    { icon: IconTrendingUp, color: "green", label: "Highest Disbursement", value: renderSmartCurrency(ins?.highest_disbursement?.amount || 0), note: `in ${ins?.highest_disbursement?.month_label || "-"}` },
    { icon: IconClock, color: "gold", label: "Avg. Approval Time", value: ins?.avg_approval_time || "-", note: "Standard benchmark" },
    { icon: IconAlertTriangle, color: "accent", label: "Overdue Loans", value: renderSmartCurrency(ins?.overdue_loans?.amount || 0), note: `${ins?.overdue_loans?.pct_of_total || 0}% of total portfolio` },
    { icon: IconUsersGroup, color: "indigoAlt", label: "Active Agents", value: ins?.active_agents || "-", note: "Active this cycle" },
  ];

  return (
    <Box className="bg-[#F8FAFC] text-slate-800 min-h-full">
      <Box component="main" className="p-4 md:p-6 flex flex-col gap-4 max-w-[1600px] mx-auto">
        {/* Top Header */}
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div>
            <Title order={3} className="text-slate-900 font-extrabold tracking-tight">
              Dashboard
            </Title>
            <Text size="13px" c="dimmed" mt={1}>
              Welcome back to LMS. Here is your operational overview.
            </Text>
          </div>
          <Group gap={8} align="center">
            <DatePickerInput
              type="range"
              placeholder="Select date range"
              size="sm"
              w={260}
              value={[
                filters.fromDate ? new Date(filters.fromDate) : null,
                filters.toDate ? new Date(filters.toDate) : null,
              ]}
              onChange={(val: any) => {
                if (Array.isArray(val)) {
                  filters.setFromDate(formatDateValue(val[0]));
                  filters.setToDate(formatDateValue(val[1]));
                }
              }}
              valueFormat="DD-MMM-YYYY"
              leftSection={<IconCalendar size={16} className="text-slate-500" />}
              clearable
            />

            <Tooltip label="Refresh Dashboard" withArrow>
              <ActionIcon
                variant="default"
                size={40}
                radius="md"
                onClick={actions.refetch}
                className="bg-white border-slate-200 shadow-xs hover:bg-slate-50"
              >
                <IconRefresh size={18} className="text-slate-600" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {STATS.map((s) => (
            <MetricCard
              key={s.title}
              title={s.title}
              value={s.value}
              loading={status.loadingSummary}
            />
          ))}
        </SimpleGrid>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_1.25fr_2.1fr_1.4fr] gap-3.5 items-stretch">
          {/* Card 1: Collection Efficiency Rate */}
          <PanelCard title="Collection Efficiency" info loading={status.loadingCharts}>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col items-center justify-center py-0.5">
                <RingProgress
                  size={102}
                  thickness={9}
                  roundCaps
                  sections={[{ value: Math.min(100, eff?.rate_pct || 0), color: "brand.6" }]}
                  label={
                    <div className="text-center">
                      <Text fw={800} size="sm" className="text-slate-900 leading-tight">
                        {(eff?.rate_pct || 0).toFixed(2)}%
                      </Text>
                      <Text size="8.5px" c="dimmed" fw={600} tt="uppercase" mt={0.5}>
                        Efficiency
                      </Text>
                    </div>
                  }
                />
              </div>

              <div className="w-full flex flex-col gap-1.5 pt-1.5 border-t border-slate-100 mt-auto">
                <div className="bg-emerald-50/70 rounded-lg px-2.5 py-1 border border-emerald-100/80 flex justify-between items-center">
                  <Text size="10.5px" fw={600} c="green.8">
                    Collected
                  </Text>
                  <Text size="11px" fw={700} className="text-emerald-950 font-mono whitespace-nowrap">
                    {renderSmartCurrency(eff?.collected || 0)}
                  </Text>
                </div>

                <div className="bg-slate-50 rounded-lg px-2.5 py-1 border border-slate-200/70 flex justify-between items-center">
                  <Text size="10.5px" fw={600} c="dimmed">
                    Demand
                  </Text>
                  <Text size="11px" fw={700} className="text-slate-800 font-mono whitespace-nowrap">
                    {renderSmartCurrency(eff?.demand || 0)}
                  </Text>
                </div>

                <div className="bg-amber-50/60 rounded-lg px-2.5 py-1 border border-amber-100/70 flex justify-between items-center">
                  <Text size="10.5px" fw={600} c="gold.8">
                    Outstanding
                  </Text>
                  <Text size="11px" fw={700} className="text-amber-900 font-mono whitespace-nowrap">
                    {renderSmartCurrency(eff?.outstanding || 0)}
                  </Text>
                </div>
              </div>
            </div>
          </PanelCard>

          {/* Card 2: NPA (Non-Performing Assets) */}
          <PanelCard title="Non-Performing Assets" info loading={status.loadingCharts}>
            <div className="flex-1 flex flex-col justify-between gap-2.5">
              {/* Gross NPA Box */}
              <div className="flex-1 bg-rose-50/50 rounded-xl px-2.5 py-2 border border-rose-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <Text size="10.5px" fw={700} c="danger.8" tt="uppercase" className="tracking-wider">
                      Gross NPA
                    </Text>
                    <span className="text-[11px] font-bold font-mono text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded leading-none whitespace-nowrap">
                      {renderSmartCurrency(npa?.gross_npa_amount || 0)}
                    </span>
                  </div>
                  <Text fw={800} size="sm" className="text-slate-900 leading-tight mt-0.5">
                    {(npa?.gross_npa_pct || 0).toFixed(2)}%
                  </Text>
                </div>
                <div className="w-full h-7 mt-0.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={GROSS_NPA_TREND}>
                      <defs>
                        <linearGradient id="grossNpaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={cv("danger", 5)} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={cv("danger", 5)} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={cv("danger", 6)} strokeWidth={2} fill="url(#grossNpaGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net NPA Box */}
              <div className="flex-1 bg-amber-50/50 rounded-xl px-2.5 py-2 border border-amber-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <Text size="10.5px" fw={700} c="gold.8" tt="uppercase" className="tracking-wider">
                      Net NPA
                    </Text>
                    <span className="text-[11px] font-bold font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded leading-none whitespace-nowrap">
                      {renderSmartCurrency(npa?.net_npa_amount || 0)}
                    </span>
                  </div>
                  <Text fw={800} size="sm" className="text-slate-900 leading-tight mt-0.5">
                    {(npa?.net_npa_pct || 0).toFixed(2)}%
                  </Text>
                </div>
                <div className="w-full h-7 mt-0.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={NET_NPA_TREND}>
                      <defs>
                        <linearGradient id="netNpaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={cv("gold", 5)} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={cv("gold", 5)} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={cv("gold", 6)} strokeWidth={2} fill="url(#netNpaGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </PanelCard>

          {/* Card 3: Disbursement vs Collection Trend Chart */}
          <PanelCard
            title="Disbursement vs Collection Trend"
            loading={status.loadingCharts}
            rightSection={
              <div className="flex items-center gap-2">
                <Badge size="xs" variant="dot" color="brand" radius="sm">
                  Disbursement
                </Badge>
                <Badge size="xs" variant="dot" color="green" radius="sm">
                  Collection
                </Badge>
              </div>
            }
          >
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cv("brand", 6)} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={cv("brand", 6)} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cv("green", 6)} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={cv("green", 6)} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10.5, fill: "#64748B", fontWeight: 500 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                    dy={3}
                  />
                  <YAxis
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const num = Number(payload.value);
                      let text = `${currencyCode} 0`;
                      if (num > 0) {
                        const m = Math.round(num / 1_000_000);
                        text = `${currencyCode} ${m.toLocaleString()}M`;
                      }
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={3}
                          textAnchor="end"
                          fontSize={10}
                          fill="#64748B"
                          fontWeight={500}
                        >
                          {text}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={86}
                  />
                  <RTooltip
                    formatter={(v: number, name: string) => [
                      renderSmartCurrency(v),
                      name === "disbursement" ? "Disbursement" : "Collection",
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="disbursement"
                    stroke={cv("brand", 6)}
                    strokeWidth={2.2}
                    fill="url(#disbGrad)"
                    dot={{ r: 2.5, fill: cv("brand", 6) }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="collection"
                    stroke={cv("green", 6)}
                    strokeWidth={2.2}
                    fill="url(#collGrad)"
                    dot={{ r: 2.5, fill: cv("green", 6) }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>

          {/* Card 4: Risk Grade Matrix */}
          <PanelCard
            title="Risk Grade Matrix"
            loading={status.loadingCharts}
            rightSection={
              <Text
                size="xs"
                c="brand.6"
                fw={600}
                className="cursor-pointer hover:underline"
                onClick={() => setRiskModalOpen(true)}
              >
                View Details &rarr;
              </Text>
            }
          >
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-1.5">
                {classifications.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    No classification data available.
                  </Text>
                ) : (
                  <>
                    {classifications.slice(0, 3).map((r) => {
                      const { bg, color } = getRiskGradeColors(r.code);
                      return (
                        <div
                          key={r.code}
                          className="rounded-lg px-2.5 py-1.5 transition-all border border-transparent hover:border-slate-200"
                          style={{ backgroundColor: bg }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="min-w-0 pr-2">
                              <Text size="11px" fw={700} style={{ color }} className="truncate">
                                {r.label}
                              </Text>
                              <Text size="9.5px" c="dimmed">
                                Prov: {renderSmartCurrency(r.provision_amount)}
                              </Text>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <Text size="11.5px" fw={800} className="text-slate-800 font-mono">
                                {renderSmartCurrency(r.amount)}
                              </Text>
                              <Text size="9.5px" fw={600} style={{ color }}>
                                {r.pct}%
                              </Text>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Total Portfolio Footer */}
              <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center">
                <Text size="10.5px" fw={700} c="dimmed" tt="uppercase">
                  Total Portfolio
                </Text>
                <Text size="12px" fw={800} className="text-slate-900 font-mono">
                  {renderSmartCurrency(totalPortfolio)}
                </Text>
              </div>
            </div>
          </PanelCard>
        </div>

        <div className="grid grid-cols-2 gap-3.5 items-start">
          <Paper withBorder radius="lg" className="border-slate-200 flex flex-col relative min-h-[300px]">
            {status.loadingPending && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader size="sm" color="blue" />
              </div>
            )}
            <Group p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Pending Approvals List</Title>
            </Group>
            <div className="overflow-x-auto flex-1">
              <Table verticalSpacing="xs" horizontalSpacing="sm" className="text-[11px]">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Application ID</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Customer Name</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Loan Product</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Amount</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Current Stage</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Pending Since</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.pendingApprovals?.map((r) => (
                    <Table.Tr key={r.application_id}>
                      <Table.Td fw={600} className="text-slate-700 text-[10px]">{r.application_id}</Table.Td>
                      <Table.Td className="text-slate-700">{r.customer_name}</Table.Td>
                      <Table.Td className="text-slate-500">{r.loan_product}</Table.Td>
                      <Table.Td className="text-slate-600">{splitCurrency(renderCurrency(r.amount))}</Table.Td>
                      <Table.Td className="text-slate-600">{r.current_stage}</Table.Td>
                      <Table.Td>
                        <Badge radius="sm" size="sm" variant="light" color={r.pending_since.includes("Day") ? "gold" : "gray"}>
                          {r.pending_since}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <Group justify="space-between" p="sm" className="border-t border-slate-50 mt-auto">
              <Group gap={4} className="cursor-pointer">
                <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Applications</Text>
                <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
              </Group>
              {pagination.pendingPagination && pagination.pendingPagination.total_pages > 1 && (
                <Pagination
                  value={pagination.pendingPage}
                  onChange={pagination.setPendingPage}
                  total={pagination.pendingPagination.total_pages}
                  size="sm"
                  color="brand"
                  radius="md"
                />
              )}
            </Group>
          </Paper>

          <Paper withBorder radius="lg" className="border-slate-200 flex flex-col relative min-h-[300px]">
            {status.loadingOverdue && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader size="sm" color="blue" />
              </div>
            )}
            <Group p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Overdue Collections Task List</Title>
            </Group>
            <div className="overflow-x-auto flex-1">
              <Table verticalSpacing="xs" horizontalSpacing="sm" className="text-[11px]">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Loan Account</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Customer Name</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Days Past Due</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Amount Overdue</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Next Action</Text></Table.Th>
                    <Table.Th><Text size="10px" fw={600} c="dimmed" tt="uppercase">Priority</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.overdueTasks?.map((r) => {
                    const b = PRIORITY_BADGE[r.priority] || PRIORITY_BADGE.Low;
                    return (
                      <Table.Tr key={r.loan_account}>
                        <Table.Td fw={600} className="text-slate-700 text-[10px]">{r.loan_account}</Table.Td>
                        <Table.Td className="text-slate-700">{r.customer_name}</Table.Td>
                        <Table.Td className="text-slate-600">{r.days_past_due}</Table.Td>
                        <Table.Td className="text-slate-600">{splitCurrency(renderCurrency(r.amount_overdue))}</Table.Td>
                        <Table.Td className="text-slate-600">{r.next_action}</Table.Td>
                        <Table.Td>
                          <Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color }}>{r.priority}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
            <Group justify="space-between" p="sm" className="border-t border-slate-50 mt-auto">
              <Group gap={4} className="cursor-pointer">
                <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Tasks</Text>
                <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
              </Group>
              {pagination.overduePagination && pagination.overduePagination.total_pages > 1 && (
                <Pagination
                  value={pagination.overduePage}
                  onChange={pagination.setOverduePage}
                  total={pagination.overduePagination.total_pages}
                  size="sm"
                  color="brand"
                  radius="md"
                />
              )}
            </Group>
          </Paper>
        </div>

        {/* Quick Insights (Bottom Bar) */}
        <Paper withBorder radius="lg" p="md" className="bg-white border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] relative overflow-hidden">
          {status.loadingInsights && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader size="sm" color="brand" />
            </div>
          )}
          <Title order={5} className="text-slate-900 font-bold text-[14px] mb-3">
            Quick Insights
          </Title>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {QUICK_INSIGHTS.map((q, i) => {
              const Icon = q.icon;
              return (
                <div
                  key={q.label}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-slate-50/80 ${
                    i > 0 ? "lg:border-l lg:border-slate-100 lg:pl-4" : ""
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${cv(q.color, 5)} 12%, #FFFFFF)`,
                      color: cv(q.color, 6),
                      border: `1px solid color-mix(in srgb, ${cv(q.color, 5)} 20%, transparent)`,
                    }}
                  >
                    <Icon size={19} stroke={2} />
                  </div>
                  <div className="min-w-0">
                    <Text size="11px" fw={600} c="dimmed" className="truncate">
                      {q.label}
                    </Text>
                    <Text fw={800} className="text-[14px] text-slate-900 leading-tight truncate">
                      {q.value}
                    </Text>
                    <Text size="10.5px" c="dimmed" className="truncate mt-0.5">
                      {q.note}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>
        </Paper>

        {/* Lightweight Modal for Risk Grade Matrix Details */}
        <Modal
          opened={riskModalOpen}
          onClose={() => setRiskModalOpen(false)}
          title={
            <Group gap={8}>
              <Title order={5} className="text-slate-900 font-bold">
                Risk Grade Matrix Classifications
              </Title>
              <Badge size="sm" variant="light" color="brand">
                {classifications.length} Categories
              </Badge>
            </Group>
          }
          size="lg"
          radius="md"
          centered
        >
          <div className="overflow-x-auto">
            <Table verticalSpacing="xs" horizontalSpacing="sm" className="text-[12px]">
              <Table.Thead>
                <Table.Tr className="bg-slate-50/70">
                  <Table.Th><Text size="11px" fw={700} c="dimmed" tt="uppercase">Classification</Text></Table.Th>
                  <Table.Th><Text size="11px" fw={700} c="dimmed" tt="uppercase">Provision</Text></Table.Th>
                  <Table.Th className="text-right"><Text size="11px" fw={700} c="dimmed" tt="uppercase">Amount</Text></Table.Th>
                  <Table.Th className="text-right"><Text size="11px" fw={700} c="dimmed" tt="uppercase">% Share</Text></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {classifications.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center py-6 text-slate-400">
                      No classification data available.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  classifications.map((r) => {
                    const { color, badge } = getRiskGradeColors(r.code);
                    return (
                      <Table.Tr key={r.code} className="hover:bg-slate-50/60 transition-colors">
                        <Table.Td>
                          <Group gap={6}>
                            <Badge size="xs" variant="dot" color={badge} radius="sm" />
                            <Text size="12px" fw={700} className="text-slate-800">
                              {r.label}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="11.5px" c="dimmed" fw={500}>
                            {renderCurrency(r.provision_amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Text size="12px" fw={700} className="text-slate-900 font-mono">
                            {renderCurrency(r.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Text size="11.5px" fw={700} style={{ color }}>
                            {r.pct}%
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/70 p-3 rounded-lg">
            <Text size="12px" fw={700} c="dimmed" tt="uppercase">
              Total Portfolio
            </Text>
            <Text size="15px" fw={800} className="text-slate-900 font-mono">
              {renderCurrency(totalPortfolio)}
            </Text>
          </div>
        </Modal>
      </Box>
    </Box>
  );
}

export default Dashboard;