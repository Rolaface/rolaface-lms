import { Box, Paper, Text, Title, Group, Button, ActionIcon, Table, Badge, Tooltip } from "@mantine/core";
import {
  IconFileText, IconUsers, IconCashBanknote, IconApps, IconCalendar, IconChevronDown,
  IconRefresh, IconInfoCircle, IconArrowUp, IconArrowDown, IconTrophy, IconTrendingUp,
  IconClock, IconAlertTriangle, IconUsersGroup, IconChevronRight,
} from "@tabler/icons-react";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

/* ----------------------------- data ----------------------------- */

const STATS = [
  { title: "TOTAL LOANS", value: "1,204", delta: "5.2%", up: true, icon: IconFileText, color: "brand" },
  { title: "ACTIVE CUSTOMERS", value: "842", delta: "3.1%", up: true, icon: IconUsers, color: "green" },
  { title: "TOTAL DISBURSED", value: "$4.2M", delta: "8.7%", up: true, icon: IconCashBanknote, color: "indigoAlt" },
  { title: "PENDING APPLICATIONS", value: "38", delta: "12.5%", up: false, icon: IconApps, color: "gold" },
];

const GROSS_NPA_TREND = [
  { m: 1, v: 3.1 }, { m: 2, v: 3.3 }, { m: 3, v: 3.0 }, { m: 4, v: 3.4 },
  { m: 5, v: 3.2 }, { m: 6, v: 3.5 }, { m: 7, v: 3.42 },
];
const NET_NPA_TREND = [
  { m: 1, v: 1.6 }, { m: 2, v: 1.9 }, { m: 3, v: 1.7 }, { m: 4, v: 2.0 },
  { m: 5, v: 1.75 }, { m: 6, v: 1.95 }, { m: 7, v: 1.82 },
];

const PAR_BUCKETS = [
  { label: "30 Days", amt: "$0.48M", pct: "38.4%", value: 0.48, color: cv("green", 6) },
  { label: "60 Days", amt: "$0.38M", pct: "30.4%", value: 0.38, color: cv("gold", 6) },
  { label: "90+ Days", amt: "$0.39M", pct: "31.2%", value: 0.39, color: cv("danger", 6) },
];
const PAR_TOTAL = "$1.25M";

const TREND = [
  { month: "Feb '26", disbursement: 2.0, collection: 1.0 },
  { month: "Mar '26", disbursement: 2.6, collection: 1.5 },
  { month: "Apr '26", disbursement: 3.5, collection: 1.9 },
  { month: "May '26", disbursement: 2.9, collection: 1.6 },
  { month: "Jun '26", disbursement: 3.6, collection: 2.2 },
  { month: "Jul '26", disbursement: 3.4, collection: 2.5 },
  { month: "Aug '26", disbursement: 4.2, collection: 2.9 },
];

const RISK_GRADES = [
  { label: "High Risk", amt: "$0.68M", pct: "17.0%", bg: cv("danger", 0), color: cv("danger", 7) },
  { label: "Medium Risk", amt: "$1.62M", pct: "40.5%", bg: cv("gold", 0), color: cv("gold", 7) },
  { label: "Low Risk", amt: "$1.70M", pct: "42.5%", bg: cv("green", 0), color: cv("green", 7) },
];

type Approval = { id: string; customer: string; product: string; amount: string; stage: string; since: string; sinceColor: string };
const PENDING_APPROVALS: Approval[] = [
  { id: "LNAPP-0012", customer: "Rahul Sharma", product: "Personal Loan", amount: "$25,000", stage: "Credit Review", since: "2 Days", sinceColor: "gold" },
  { id: "LNAPP-0017", customer: "Priya Singh", product: "Business Loan", amount: "$50,000", stage: "Manager Approval", since: "3 Days", sinceColor: "gold" },
  { id: "LNAPP-0021", customer: "Amit Kumar", product: "Home Loan", amount: "$75,000", stage: "Legal Verification", since: "5 Days", sinceColor: "gold" },
  { id: "LNAPP-0024", customer: "Neha Verma", product: "Vehicle Loan", amount: "$20,000", stage: "Credit Review", since: "1 Day", sinceColor: "green" },
  { id: "LNAPP-0027", customer: "Vikram Joshi", product: "Personal Loan", amount: "$15,000", stage: "Manager Approval", since: "4 Days", sinceColor: "gold" },
];

type OverdueTask = { account: string; customer: string; dpd: number; amount: string; next: string; priority: "High" | "Medium" };
const OVERDUE_TASKS: OverdueTask[] = [
  { account: "LN-000456", customer: "Rahul Sharma", dpd: 45, amount: "$5,200", next: "Agent Follow-up", priority: "High" },
  { account: "LN-000789", customer: "Priya Singh", dpd: 75, amount: "$8,750", next: "Legal Notice", priority: "High" },
  { account: "LN-001234", customer: "Amit Kumar", dpd: 120, amount: "$12,300", next: "Legal Notice", priority: "High" },
  { account: "LN-001567", customer: "Neha Verma", dpd: 30, amount: "$2,400", next: "Agent Follow-up", priority: "Medium" },
  { account: "LN-001890", customer: "Vikram Joshi", dpd: 60, amount: "$4,100", next: "Agent Follow-up", priority: "Medium" },
];

const PRIORITY_BADGE: Record<string, { bg: string; color: string }> = {
  High: { bg: cv("danger", 0), color: cv("danger", 7) },
  Medium: { bg: cv("gold", 0), color: cv("gold", 7) },
};

const QUICK_INSIGHTS = [
  { icon: IconTrophy, color: "brand", label: "Top Loan Product", value: "Personal Loan", note: "42.6% of total disbursed" },
  { icon: IconTrendingUp, color: "green", label: "Highest Disbursement", value: "$1.8M", note: "in Aug 2026" },
  { icon: IconClock, color: "gold", label: "Avg. Approval Time", value: "2.4 Days", note: "↓ 10% vs last month" },
  { icon: IconAlertTriangle, color: "accent", label: "Overdue Loans", value: "$1.25M", note: "29.8% of total portfolio" },
  { icon: IconUsersGroup, color: "indigoAlt", label: "Active Agents", value: "12", note: "↑ 2 vs last month" },
];

/* --------------------------- helpers ----------------------------- */

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  const Icon = stat.icon;
  const DeltaIcon = stat.up ? IconArrowUp : IconArrowDown;
  const deltaColor = stat.up ? cv("green", 6) : cv("danger", 6);
  return (
    <Paper withBorder radius="lg" p="md" className="border-slate-200 flex-1">
      <Group gap={14} wrap="nowrap" align="flex-start">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cv(stat.color, 0), color: cv(stat.color, 6) }}>
          <Icon size={20} />
        </div>
        <div>
          <Text size="10.5px" fw={700} c="dimmed" className="uppercase tracking-wider">{stat.title}</Text>
          <Text fw={800} className="text-[26px] text-slate-900 leading-tight mt-0.5">{stat.value}</Text>
          <Group gap={4} mt={2}>
            <DeltaIcon size={12} style={{ color: deltaColor }} />
            <Text size="12px" fw={700} style={{ color: deltaColor }}>{stat.delta}</Text>
            <Text size="12px" c="dimmed">vs last month</Text>
          </Group>
        </div>
      </Group>
    </Paper>
  );
}

function PanelCard({ title, info, children }: { title: string; info?: boolean; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col">
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

/* Thin ring — strokeWidth reduced from 13 -> 8 so the circle reads as slim, not chunky */
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

/* NPA block: mini trend chart on top, description centered below it.
   Line strokeWidth thinned 1.5 -> 1 to match the slimmer look everywhere else. */
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

/* ---------------------------- page -------------------------------- */

export function Dashboard() {
  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">Dashboard</Title>
            <Text size="13px" c="dimmed" mt={2}>Welcome back to  LMS. Here is your overview.</Text>
          </div>
          <Group gap={10}>
            <Button variant="default" size="sm" radius="md" leftSection={<IconCalendar size={15} className="text-slate-400" />} rightSection={<IconChevronDown size={13} className="text-slate-400" />}>
              01 Aug 2026 - 31 Aug 2026
            </Button>
            <ActionIcon variant="default" size={36} radius="md">
              <IconRefresh size={16} className="text-slate-500" />
            </ActionIcon>
          </Group>
        </Group>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3.5">
          {STATS.map((s) => <StatCard key={s.title} stat={s} />)}
        </div>

        {/* Panels row — smaller cards on the sides, bigger Disbursement vs Collection Trend in the middle */}
        <div className="grid grid-cols-[0.82fr_0.82fr_0.88fr_1.95fr_0.82fr] gap-3.5 items-stretch">
          {/* Collection Efficiency Rate — ring now thin (strokeWidth 8) */}
          <PanelCard title="Collection Efficiency Rate (%)" info>
            <div className="flex flex-col items-center pt-1">
              <CircularProgress percent={87.6} />
              <Text size="12px" c="dimmed" mt={8}>Collected</Text>
              <Text fw={700} size="12.5px" className="text-slate-700">$3.68M / $4.20M</Text>
              <Badge mt={8} radius="sm" variant="light" color="green" size="sm" className="!normal-case">
                <Group gap={4}>
                  <IconArrowUp size={11} />
                  <span>6.2% vs last month</span>
                </Group>
              </Badge>
            </div>
          </PanelCard>

          {/* NPA — chart on top, description below, thin line strokes */}
          <PanelCard title="Non-Performing Assets (NPA)">
            <div className="flex flex-col gap-5 pt-6">
              <NpaBlock label="Gross NPA" value="3.42%" delta="0.35%" trend={GROSS_NPA_TREND} />
              <NpaBlock label="Net NPA" value="1.82%" delta="0.18%" trend={NET_NPA_TREND} />
            </div>
          </PanelCard>

          {/* PAR buckets — pie ring thinned (inner/outer radius gap reduced), legend stacked below with thin dots */}
          <PanelCard title="PAR (Portfolio at Risk) Buckets">
            <div className="flex flex-col items-center gap-3 pt-8">
              <div className="relative w-[104px] h-[104px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PAR_BUCKETS} dataKey="value" nameKey="label" innerRadius={38} outerRadius={50} startAngle={90} endAngle={450} stroke="none" paddingAngle={2}>
                      {PAR_BUCKETS.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Text size="11.5px" fw={800} className="text-slate-900">{PAR_TOTAL}</Text>
                  <Text size="8px" c="dimmed" ta="center" className="leading-tight">Total<br />at Risk</Text>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full pt-6">
                {PAR_BUCKETS.map((b) => (
                  <Group key={b.label} justify="space-between" wrap="nowrap">
                    <Group gap={5} wrap="nowrap">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <Text size="11px" c="dimmed">{b.label}</Text>
                    </Group>
                    <Text size="11.5px" fw={700} className="text-slate-800 whitespace-nowrap">
                      {b.amt} <span className="text-slate-400 font-medium">({b.pct})</span>
                    </Text>
                  </Group>
                ))}
              </div>
            </div>
          </PanelCard>

          {/* Disbursement vs Collection Trend — bigger card, bigger chart, thinner line strokes/dots */}
          <PanelCard title="Disbursement vs Collection Trend">
            <Group gap={14} mb={4}>
              <Group gap={5}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cv("brand", 6) }} /><Text size="11px" c="dimmed">Disbursement</Text></Group>
              <Group gap={5}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cv("green", 6) }} /><Text size="11px" c="dimmed">Collection</Text></Group>
            </Group>
            <div className="h-[248px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}M`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={44} />
                  <RTooltip formatter={(v: number) => `$${v}M`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="disbursement" stroke={cv("brand", 6)} strokeWidth={1.5} dot={{ r: 2.5, fill: cv("brand", 6) }} />
                  <Line type="monotone" dataKey="collection" stroke={cv("green", 6)} strokeWidth={1.5} dot={{ r: 2.5, fill: cv("green", 6) }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>

          {/* Risk Grade Matrix */}
          <PanelCard title="Risk Grade Matrix">
            <div className="flex flex-col gap-2">
              {RISK_GRADES.map((r) => (
                <Group key={r.label} justify="space-between" p="xs" className="rounded-md" style={{ backgroundColor: r.bg }}>
                  <Text size="11.5px" fw={700} style={{ color: r.color }}>{r.label}</Text>
                  <Group gap={6}>
                    <Text size="12px" fw={700} className="text-slate-800">{r.amt}</Text>
                    <Text size="10.5px" c="dimmed">{r.pct}</Text>
                  </Group>
                </Group>
              ))}
              <Group justify="space-between" mt={4} pt={8} className="border-t border-slate-100">
                <Text size="11.5px" c="dimmed">Total Portfolio</Text>
                <Text size="12.5px" fw={800} className="text-slate-900">$4.00M</Text>
              </Group>
            </div>
          </PanelCard>
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-2 gap-3.5 items-start">
          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden">
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
                  {PENDING_APPROVALS.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td fw={600} className="text-slate-700">{r.id}</Table.Td>
                      <Table.Td className="text-slate-700">{r.customer}</Table.Td>
                      <Table.Td className="text-slate-500">{r.product}</Table.Td>
                      <Table.Td className="text-slate-600">{r.amount}</Table.Td>
                      <Table.Td className="text-slate-600">{r.stage}</Table.Td>
                      <Table.Td>
                        <Badge radius="sm" size="sm" variant="light" color={r.sinceColor}>{r.since}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <Group p="sm" gap={4} className="cursor-pointer">
              <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Applications</Text>
              <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
            </Group>
          </Paper>

          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden">
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
                  {OVERDUE_TASKS.map((r) => {
                    const b = PRIORITY_BADGE[r.priority];
                    return (
                      <Table.Tr key={r.account}>
                        <Table.Td fw={600} className="text-slate-700">{r.account}</Table.Td>
                        <Table.Td className="text-slate-700">{r.customer}</Table.Td>
                        <Table.Td className="text-slate-600">{r.dpd}</Table.Td>
                        <Table.Td className="text-slate-600">{r.amount}</Table.Td>
                        <Table.Td className="text-slate-600">{r.next}</Table.Td>
                        <Table.Td>
                          <Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color }}>{r.priority}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
            <Group p="sm" gap={4} className="cursor-pointer">
              <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }}>View All Tasks</Text>
              <IconChevronRight size={14} style={{ color: cv("brand", 6) }} />
            </Group>
          </Paper>
        </div>

        {/* Quick Insights */}
        <Paper withBorder radius="lg" p="sm" className="border-slate-200">
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