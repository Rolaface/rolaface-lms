import { useMemo, useCallback, useState } from "react";
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
  Popover,
  TextInput,
} from "@mantine/core";
import {
  IconFileText,
  IconUsers,
  IconCashBanknote,
  IconApps,
  IconCalendar,
  IconChevronDown,
  IconRefresh,
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconTrophy,
  IconTrendingUp,
  IconClock,
  IconAlertTriangle,
  IconUsersGroup,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
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

const PRIORITY_BADGE: Record<string, { bg: string; color: string }> = {
  High: { bg: cv("danger", 0), color: cv("danger", 7) },
  Medium: { bg: cv("gold", 0), color: cv("gold", 7) },
  Low: { bg: cv("green", 0), color: cv("green", 7) },
};

function formatDateToDDMMMYYYY(dateString: string) {
  if (!dateString) return "";
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day}-${months[month]}-${year}`;
}

function StatCard({ stat, loading }: { stat: any; loading: boolean }) {
  const Icon = stat.icon;
  const DeltaIcon = stat.up ? IconArrowUp : IconArrowDown;
  const deltaColor = stat.up ? cv("green", 6) : cv("danger", 6);
  return (
    <Paper withBorder radius="lg" p="md" className="border-slate-200 flex-1 relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
          <Loader size="sm" color="blue" />
        </div>
      )}
      <Group gap={14} wrap="nowrap" align="flex-start">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: cv(stat.color, 0), color: cv(stat.color, 6) }}
        >
          <Icon size={20} />
        </div>
        <div>
          <Text size="10.5px" fw={700} c="dimmed" className="uppercase tracking-wider">
            {stat.title}
          </Text>
          <Text fw={800} className="text-[22px] text-slate-900 leading-tight mt-0.5 whitespace-nowrap">
            {stat.value}
          </Text>
          <Group gap={4} mt={2}>
            <DeltaIcon size={12} style={{ color: deltaColor }} />
            <Text size="12px" fw={700} style={{ color: deltaColor }}>
              {stat.delta}
            </Text>
            <Text size="12px" c="dimmed">vs last month</Text>
          </Group>
        </div>
      </Group>
    </Paper>
  );
}

function PanelCard({ title, info, loading, children }: { title: string; info?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col relative overflow-hidden h-full">
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}
      <Group gap={6} mb={10}>
        <Text size="13px" fw={700} className="text-slate-800">{title}</Text>
        {info && (
          <Tooltip label={`${title} details`} withArrow>
            <IconInfoCircle size={13} className="text-slate-300" />
          </Tooltip>
        )}
      </Group>
      {children}
    </Paper>
  );
}

function CircularProgress({ percent, size = 148, strokeWidth = 8 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={cv("brand", 0)} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={cv("brand", 6)} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Text fw={800} className="text-[24px] text-slate-900">{percent}%</Text>
      </div>
    </div>
  );
}

function NpaBlock({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: { m: number; v: number }[] }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full h-9">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="v" stroke={cv("danger", 5)} strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Text size="11.5px" c="dimmed" fw={500} mt={6}>{label}</Text>
      <Text fw={800} className="text-[19px] text-slate-900 leading-tight">{value}</Text>
      <Group gap={3} justify="center" mt={1}>
        <IconArrowUp size={11} style={{ color: cv("danger", 6) }} />
        <Text size="11px" fw={600} style={{ color: cv("danger", 6) }}>{delta}</Text>
        <Text size="11px" c="dimmed">vs last month</Text>
      </Group>
    </div>
  );
}

const getRiskGradeColors = (code: string) => {
  const c = code.toUpperCase();
  if (c.includes("PASS")) return { bg: cv("green", 0), color: cv("green", 7) };
  if (c.includes("SPECIAL")) return { bg: cv("gold", 0), color: cv("gold", 7) };
  if (c.includes("SUBSTANDARD") || c.includes("LOSS")) return { bg: cv("danger", 0), color: cv("danger", 7) };
  if (c.includes("DOUBT")) return { bg: cv("orange", 0), color: cv("orange", 7) }; 
  return { bg: cv("gray", 1), color: cv("gray", 7) }; 
};

export function Dashboard() {
  const { data, status, actions, filters } = useLoanDashboard();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const currencyCode = useCompanyStore((state) => state.baseCurrency);
  usePrefetchCurrencies({ currencyCode }, (d) => [d.currencyCode]);

  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "$0";
      return formatAmount(currencyCode, val, { withSymbol: true });
    },
    [currencyCode]
  );

  const renderCompactCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "$0";
      const num = Number(val);
      if (isNaN(num)) return "$0";
      
      if (num >= 1000000) return `${formatAmount(currencyCode, num / 1000000, { withSymbol: true })}M`;
      if (num >= 1000) return `${formatAmount(currencyCode, num / 1000, { withSymbol: true })}K`;
      return formatAmount(currencyCode, num, { withSymbol: true });
    },
    [currencyCode]
  );

  const renderFullWithCompact = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "$0";
      const num = Number(val);
      if (isNaN(num)) return "$0";

      const full = formatAmount(currencyCode, num, { withSymbol: true });
      
      if (num >= 1000000) {
        const compact = `${formatAmount(currencyCode, num / 1000000, { withSymbol: true })}M`;
        return `${full} (${compact})`;
      }
      if (num >= 1000) {
        const compact = `${formatAmount(currencyCode, num / 1000, { withSymbol: true })}K`;
        return `${full} (${compact})`;
      }
      return full;
    },
    [currencyCode]
  );

  const STATS = useMemo(() => [
    { title: "TOTAL LOANS", value: data.summary?.total_loans || 0, delta: "5.2%", up: true, icon: IconFileText, color: "brand" },
    { title: "ACTIVE CUSTOMERS", value: data.summary?.active_customers || 0, delta: "3.1%", up: true, icon: IconUsers, color: "green" },
    { title: "TOTAL DISBURSED", value: renderFullWithCompact(data.summary?.total_disbursed || 0), delta: "8.7%", up: true, icon: IconCashBanknote, color: "indigoAlt" },
    { title: "PENDING APPLICATIONS", value: data.summary?.pending_applications || 0, delta: "12.5%", up: false, icon: IconApps, color: "gold" },
  ], [data.summary, renderFullWithCompact]);

  const eff = data.charts?.collection_efficiency;
  const npa = data.charts?.npa;
  
  const classifications = data.charts?.portfolio_classification?.classifications || [];
  const totalPortfolio = data.charts?.portfolio_classification?.total_portfolio || 0;
  const TREND = data.charts?.disbursement_vs_collection_trend || [];

  const ins = data.insights;
  const QUICK_INSIGHTS = [
    { icon: IconTrophy, color: "brand", label: "Top Loan Product", value: ins?.top_loan_product?.loan_product || "-", note: `${ins?.top_loan_product?.pct_of_total || 0}% of total disbursed` },
    { icon: IconTrendingUp, color: "green", label: "Highest Disbursement", value: renderFullWithCompact(ins?.highest_disbursement?.amount || 0), note: `in ${ins?.highest_disbursement?.month_label || "-"}` },
    { icon: IconClock, color: "gold", label: "Avg. Approval Time", value: ins?.avg_approval_time || "2.4 Days", note: "↓ 10% vs last month" },
    { icon: IconAlertTriangle, color: "accent", label: "Overdue Loans", value: renderFullWithCompact(ins?.overdue_loans?.amount || 0), note: `${ins?.overdue_loans?.pct_of_total || 0}% of total portfolio` },
    { icon: IconUsersGroup, color: "indigoAlt", label: "Active Agents", value: ins?.active_agents || "12", note: "↑ 2 vs last month" },
  ];

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5 max-w-[1600px] mx-auto">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">Dashboard</Title>
            <Text size="13px" c="dimmed" mt={2}>Welcome back to LMS. Here is your overview.</Text>
          </div>
          <Group gap={10}>
            <Popover opened={datePopoverOpen} onChange={setDatePopoverOpen} width={340} position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <Button 
                  variant="default" 
                  size="md" 
                  radius="md"
                  h={42}
                  onClick={() => setDatePopoverOpen((o) => !o)}
                  leftSection={<IconCalendar size={18} className="text-slate-500" />} 
                  rightSection={<IconChevronDown size={16} className="text-slate-500" />}
                  styles={{
                    root: { paddingLeft: 16, paddingRight: 16 },
                    label: { fontSize: 15, fontWeight: 700, color: '#1e293b' }
                  }}
                >
                  {formatDateToDDMMMYYYY(filters.fromDate)} - {formatDateToDDMMMYYYY(filters.toDate)}
                </Button>
              </Popover.Target>
              <Popover.Dropdown p="md">
                <Group grow mb="md" align="flex-start">
                  <TextInput 
                    label="From Date" 
                    type="date" 
                    size="md"
                    value={filters.fromDate} 
                    onChange={(e) => filters.setFromDate(e.currentTarget.value)} 
                    styles={{ label: { fontSize: 13, marginBottom: 6, fontWeight: 600, color: '#475569' } }}
                  />
                  <TextInput 
                    label="To Date" 
                    type="date"
                    size="md"
                    value={filters.toDate} 
                    onChange={(e) => filters.setToDate(e.currentTarget.value)} 
                    styles={{ label: { fontSize: 13, marginBottom: 6, fontWeight: 600, color: '#475569' } }}
                  />
                </Group>
                <Button fullWidth size="md" radius="md" color="brand" onClick={() => {
                  setDatePopoverOpen(false);
                  actions.refetch();
                }}>
                  Apply Filters
                </Button>
              </Popover.Dropdown>
            </Popover>
            
            <ActionIcon variant="default" size={42} radius="md" onClick={actions.refetch}>
              <IconRefresh size={20} className="text-slate-500" />
            </ActionIcon>
          </Group>
        </Group>

        <div className="grid grid-cols-4 gap-3.5">
          {STATS.map((s) => <StatCard key={s.title} stat={s} loading={status.loadingSummary} />)}
        </div>

        <div className="grid grid-cols-[1fr_1fr_2.2fr_1.5fr] gap-3.5 items-stretch">
          
          <PanelCard title="Collection Efficiency Rate (%)" info loading={status.loadingCharts}>
            <div className="flex flex-col items-center pt-1">
              <CircularProgress percent={eff?.rate_pct || 0} />
              <Text size="12px" c="dimmed" mt={8}>Collected</Text>
              <Text fw={700} size="12.5px" className="text-slate-700">
                {renderCompactCurrency(eff?.collected || 0)} / {renderCompactCurrency(eff?.demand || 0)}
              </Text>
              <Badge mt={8} radius="sm" variant="light" color="green" size="sm" className="!normal-case">
                <Group gap={4}>
                  <IconArrowUp size={11} />
                  <span>6.2% vs last month</span>
                </Group>
              </Badge>
            </div>
          </PanelCard>

          <PanelCard title="Non-Performing Assets (NPA)" loading={status.loadingCharts}>
            <div className="flex flex-col gap-5 pt-6">
              <NpaBlock label="Gross NPA" value={`${npa?.gross_npa_pct || 0}%`} delta="0.35%" trend={GROSS_NPA_TREND} />
              <NpaBlock label="Net NPA" value={`${npa?.net_npa_pct || 0}%`} delta="0.18%" trend={NET_NPA_TREND} />
            </div>
          </PanelCard>

          <PanelCard title="Disbursement vs Collection Trend" loading={status.loadingCharts}>
            <Group gap={14} mb={4}>
              <Group gap={5}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cv("brand", 6) }} /><Text size="11px" c="dimmed">Disbursement</Text></Group>
              <Group gap={5}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cv("green", 6) }} /><Text size="11px" c="dimmed">Collection</Text></Group>
            </Group>
            <div className="h-[248px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v) => renderCompactCurrency(v)} 
                    tick={{ fontSize: 10, fill: "#94A3B8" }} 
                    axisLine={false} tickLine={false} width={44} 
                  />
                  <RTooltip formatter={(v: number) => renderCompactCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="disbursement" stroke={cv("brand", 6)} strokeWidth={1.5} dot={{ r: 2.5, fill: cv("brand", 6) }} />
                  <Line type="monotone" dataKey="collection" stroke={cv("green", 6)} strokeWidth={1.5} dot={{ r: 2.5, fill: cv("green", 6) }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>

          <PanelCard title="Risk Grade Matrix" loading={status.loadingCharts}>
            <div className="flex flex-col gap-2 h-full">
              {classifications.map((r) => {
                const { bg, color } = getRiskGradeColors(r.code);
                
                return (
                  <Group key={r.code} justify="space-between" p="xs" className="rounded-md" style={{ backgroundColor: bg }}>
                    <div>
                      <Text size="11.5px" fw={700} style={{ color }}>{r.label}</Text>
                      <Text size="10.5px" c="dimmed" mt={2} fw={500}>
                        Provision: {renderCurrency(r.provision_amount)}
                      </Text>
                    </div>
                    <div className="flex flex-col items-end">
                      <Text size="12px" fw={700} className="text-slate-800">
                        {renderFullWithCompact(r.amount)}
                      </Text>
                      <Text size="10.5px" c="dimmed">{r.pct}%</Text>
                    </div>
                  </Group>
                );
              })}
              
              <div className="mt-auto">
                <Group justify="space-between" pt={12} className="border-t border-slate-100">
                  <Text size="11.5px" c="dimmed">Total Portfolio</Text>
                  <Text size="13px" fw={800} className="text-slate-900">{renderFullWithCompact(totalPortfolio)}</Text>
                </Group>
              </div>
            </div>
          </PanelCard>
        </div>

        <div className="grid grid-cols-2 gap-3.5 items-start">
          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden relative min-h-[250px]">
            {status.loadingPending && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader size="sm" color="blue" />
              </div>
            )}
            <Group p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Pending Approvals List</Title>
            </Group>
            <div className="overflow-x-auto">
              <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Application ID</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Customer Name</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Loan Product</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Amount</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Current Stage</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Pending Since</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.pendingApprovals.map((r) => (
                    <Table.Tr key={r.application_id}>
                      <Table.Td fw={600} className="text-slate-700">{r.application_id}</Table.Td>
                      <Table.Td className="text-slate-700">{r.customer_name}</Table.Td>
                      <Table.Td className="text-slate-500">{r.loan_product}</Table.Td>
                      <Table.Td className="text-slate-600">{renderCurrency(r.amount)}</Table.Td>
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
            <Group p="sm" gap={4} className="cursor-pointer border-t border-slate-50">
              <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Applications</Text>
              <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
            </Group>
          </Paper>

          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden relative min-h-[250px]">
            {status.loadingOverdue && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader size="sm" color="blue" />
              </div>
            )}
            <Group p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Overdue Collections Task List</Title>
            </Group>
            <div className="overflow-x-auto">
              <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Loan Account</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Customer Name</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Days Past Due</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Amount Overdue</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Next Action</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Priority</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.overdueTasks.map((r) => {
                    const b = PRIORITY_BADGE[r.priority] || PRIORITY_BADGE.Low;
                    return (
                      <Table.Tr key={r.loan_account}>
                        <Table.Td fw={600} className="text-slate-700">{r.loan_account}</Table.Td>
                        <Table.Td className="text-slate-700">{r.customer_name}</Table.Td>
                        <Table.Td className="text-slate-600">{r.days_past_due}</Table.Td>
                        <Table.Td className="text-slate-600">{renderCurrency(r.amount_overdue)}</Table.Td>
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
            <Group p="sm" gap={4} className="cursor-pointer border-t border-slate-50">
              <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Tasks</Text>
              <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
            </Group>
          </Paper>
        </div>

        <Paper withBorder radius="lg" p="sm" className="border-slate-200 relative overflow-hidden">
          {status.loadingInsights && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader size="sm" color="blue" />
            </div>
          )}
          <Title order={5} className="text-slate-900 mb-3">Quick Insights</Title>
          <div className="grid grid-cols-5 gap-3">
            {QUICK_INSIGHTS.map((q, i) => {
              const Icon = q.icon;
              return (
                <Group key={q.label} gap={12} wrap="nowrap" className={i > 0 ? "pl-3 border-l border-slate-100" : ""}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cv(q.color, 0), color: cv(q.color, 6) }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <Text size="11.5px" c="dimmed">{q.label}</Text>
                    <Text fw={800} className="text-[15px] text-slate-900 leading-tight">{q.value}</Text>
                    <Text size="10.5px" c="dimmed">{q.note}</Text>
                  </div>
                </Group>
              );
            })}
          </div>
        </Paper>
      </Box>
    </Box>
  );
}

export default Dashboard;