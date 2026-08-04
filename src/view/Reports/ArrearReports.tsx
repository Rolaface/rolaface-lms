import { useState } from "react";
import { Box, Button, TextInput, Select, Group, Paper, Table, Badge, ActionIcon, Text, Pagination, Title, Switch, Tooltip } from "@mantine/core";
import {
  IconFilter, IconFileSpreadsheet, IconFileAlert, IconSearch, IconInfoCircle,
  IconUsers, IconReceipt2, IconCalendarCheck, IconAlertTriangle, IconFileOff, IconEye,
  IconChevronDown, IconChevronRight, IconArrowUp, IconSelector, IconTrendingUp,
  IconTargetArrow, IconChartPie,
} from "@tabler/icons-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

// Shared classNames for regular (non-date) inputs / selects
const inputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input: "min-h-[32px] h-[32px] text-[12px] border-slate-200 rounded-lg focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

const dateInputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input:
    "min-h-[32px] h-[32px] text-[12px] border-slate-200 rounded-lg pr-2 " +
    "focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] " +
    "[&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer " +
    "[&::-webkit-calendar-picker-indicator]:ml-1",
};

const SUMMARY_CARDS = [
  { label: "Total Accounts", value: "1,248", note: "5.2% vs last month", noteColor: cv("green", 6), noteIcon: IconArrowUp, icon: IconUsers, color: "indigoAlt" },
  { label: "Total Overdue (₹)", value: "₹2,11,30,000", note: "8.7% vs last month", noteColor: cv("red", 6), noteIcon: IconArrowUp, icon: IconReceipt2, color: "danger" },
  { label: "Current (₹)", value: "₹1,25,00,000", note: "59.18% of total", noteColor: cv("green", 6), icon: IconCalendarCheck, color: "brand" },
  { label: "Overdue (₹)", value: "₹86,30,000", note: "40.82% of total", noteColor: cv("gold", 6), icon: IconAlertTriangle, color: "gold" },
  { label: "Written Off (₹)", value: "₹12,50,000", note: "5.92% of total", noteColor: cv("accent", 6), icon: IconFileOff, color: "accent" },
];

const AGING = [
  { label: "1 - 30 Days", amt: "₹18,40,000", pct: "21.33%", value: 1840000, color: cv("brand", 6) },
  { label: "31 - 60 Days", amt: "₹22,10,000", pct: "25.60%", value: 2210000, color: cv("gold", 6) },
  { label: "61 - 90 Days", amt: "₹19,30,000", pct: "22.35%", value: 1930000, color: cv("accent", 6) },
  { label: "91 - 180 Days", amt: "₹16,80,000", pct: "19.47%", value: 1680000, color: cv("indigoAlt", 6) },
  { label: "> 180 Days", amt: "₹9,70,000", pct: "11.25%", value: 970000, color: cv("danger", 6) },
];

const OVERDUE_TREND = [
  { month: "Feb '26", amount: 16200000 },
  { month: "Mar '26", amount: 17500000 },
  { month: "Apr '26", amount: 18800000 },
  { month: "May '26", amount: 19600000 },
  { month: "Jun '26", amount: 20500000 },
  { month: "Jul '26", amount: 21200000 },
  { month: "Aug '26", amount: 21100000 },
];

const OVERDUE_BY_PRODUCT = [
  { product: "Personal Loan", amount: 3840000 },
  { product: "Business Loan", amount: 2260000 },
  { product: "Home Loan", amount: 1480000 },
  { product: "Vehicle Loan", amount: 690000 },
  { product: "Others", amount: 360000 },
];

type ArrearRow = { loanAccount: string; customer: string; branch: string; dpd: number; bucket: string; overdueAmt: string; overdueEmi: string; totalOverdue: string };
const TOP_OVERDUE: ArrearRow[] = [
  { loanAccount: "LN-000456", customer: "Rahul Sharma", branch: "Delhi", dpd: 45, bucket: "31 - 60 Days", overdueAmt: "20,000.00", overdueEmi: "25,000.00", totalOverdue: "45,000.00" },
  { loanAccount: "LN-000789", customer: "Priya Singh", branch: "Mumbai", dpd: 75, bucket: "61 - 90 Days", overdueAmt: "36,000.00", overdueEmi: "32,000.00", totalOverdue: "68,000.00" },
  { loanAccount: "LN-001234", customer: "Amit Kumar", branch: "Bangalore", dpd: 120, bucket: "91 - 180 Days", overdueAmt: "52,000.00", overdueEmi: "38,000.00", totalOverdue: "90,000.00" },
  { loanAccount: "LN-001567", customer: "Neha Verma", branch: "Delhi", dpd: 200, bucket: "> 180 Days", overdueAmt: "85,000.00", overdueEmi: "45,000.00", totalOverdue: "1,30,000.00" },
  { loanAccount: "LN-001890", customer: "Vikram Joshi", branch: "Pune", dpd: 28, bucket: "1 - 30 Days", overdueAmt: "8,000.00", overdueEmi: "22,000.00", totalOverdue: "30,000.00" },
];

const BUCKET_BADGE: Record<string, { bg: string; color: string }> = {
  "1 - 30 Days": { bg: cv("brand", 0), color: cv("brand", 7) },
  "31 - 60 Days": { bg: cv("gold", 0), color: cv("gold", 7) },
  "61 - 90 Days": { bg: cv("accent", 0), color: cv("accent", 7) },
  "91 - 180 Days": { bg: cv("indigoAlt", 0), color: cv("indigoAlt", 7) },
  "> 180 Days": { bg: cv("danger", 0), color: cv("danger", 7) },
};

const KEY_INSIGHTS = [
  { title: "Highest Overdue Bucket", note: "> 180 Days (₹9,70,000)", icon: IconAlertTriangle, color: "danger" },
  { title: "Increase in Overdue", note: "↑ 8.7% vs last month", icon: IconTrendingUp, color: "gold" },
  { title: "Overdue Concentration", note: "5 accounts make up 32.6% of total overdue", icon: IconTargetArrow, color: "brand" },
  { title: "Written Off Percentage", note: "5.92% of total portfolio", icon: IconChartPie, color: "accent" },
];

function SummaryCard({ card }: { card: (typeof SUMMARY_CARDS)[number] }) {
  const Icon = card.icon;
  const NoteIcon = card.noteIcon;
  return (
    <Paper withBorder radius="lg" p="sm" className="flex-1 min-w-[190px] border-slate-200">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} c="dimmed">{card.label}</Text>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cv(card.color, 0), color: cv(card.color, 6) }}>
          <Icon size={16} />
        </div>
      </Group>
      <Text fw={800} className="text-[17px] text-slate-900 mt-1.5">{card.value}</Text>
      <Group gap={4} mt={1}>
        {NoteIcon && <NoteIcon size={11} style={{ color: card.noteColor }} />}
        <Text size="10.5px" fw={600} style={{ color: card.noteColor }}>{card.note}</Text>
      </Group>
    </Paper>
  );
}

function ChartCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col">
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={700} className="text-slate-800">{title}</Text>
        {right}
      </Group>
      {children}
    </Paper>
  );
}

export function ArrearReports() {
  const [includeWrittenOff, setIncludeWrittenOff] = useState(false);
  const totalOverdue = AGING.reduce((s, a) => s + a.value, 0);

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        {/* Page header */}
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
            <Button variant="default" size="sm" radius="md" leftSection={<IconFileSpreadsheet size={15} style={{ color: cv("brand", 6) }} />}>Export Excel</Button>
            <Button size="sm" radius="md" color="brand" leftSection={<IconFileAlert size={15} />}>Generate Report</Button>
          </Group>
        </Group>

        {/* Filters */}
        <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col gap-3">
          <Group gap={6}>
            <IconFilter size={14} style={{ color: cv("brand", 6) }} />
            <Text size="12.5px" fw={700} style={{ color: cv("brand", 6) }}>FILTERS</Text>
          </Group>

          <div className="grid grid-cols-5 gap-6">
            {/* FIX: removed duplicate rightSection IconCalendar — native date icon was overlapping this one */}
            <TextInput label="As On Date" withAsterisk type="date" defaultValue="2026-08-01" classNames={dateInputClassNames} />
            <Select label="Loan Account" placeholder="Select loan account" data={["LN-000456", "LN-000789"]} classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
            <Select label="Branch" placeholder="Select branch" data={["Delhi", "Mumbai", "Bangalore", "Pune"]} classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
            <Select label="Loan Product" placeholder="Select product" data={["Personal Loan", "Business Loan", "Home Loan", "Vehicle Loan"]} classNames={inputClassNames} rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
            <TextInput label="Customer" placeholder="Search customer..." classNames={inputClassNames} rightSection={<IconSearch size={13} className="text-slate-400" />} />
          </div>

          <Group justify="space-between" align="flex-end">
            <Group gap={28} align="flex-end">
              <Select label="Arrear Bucket" data={["All Buckets", "1 - 30 Days", "31 - 60 Days", "61 - 90 Days", "91 - 180 Days", "> 180 Days"]} defaultValue="All Buckets" classNames={inputClassNames} className="w-[180px]" rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
              <div>
                <Text className="text-[12px] font-semibold text-slate-700 mb-1">Days Past Due</Text>
                <Group gap={6} align="center">
                 
                  <TextInput placeholder="From" type="date" classNames={dateInputClassNames} className="w-[150px]" />
                  <Text size="12px" c="dimmed" className="pb-[7px]">-</Text>
                  <TextInput placeholder="To" type="date" classNames={dateInputClassNames} className="w-[150px]" />
                </Group>
              </div>
            </Group>

            <Group gap={16} align="center">
              <Group gap={6}>
                <Text size="13px" fw={500} className="text-slate-600">Include Written Off Accounts</Text>
                <Tooltip label="Also include loan accounts that have been written off" withArrow>
                  <IconInfoCircle size={13} className="text-slate-300" />
                </Tooltip>
                <Switch checked={includeWrittenOff} onChange={(e) => setIncludeWrittenOff(e.currentTarget.checked)} color="brand" />
              </Group>
              <Text size="12.5px" fw={600} style={{ color: cv("brand", 6) }} className="cursor-pointer">Clear Filters</Text>
            </Group>
          </Group>
        </Paper>

        {/* Summary */}
        <Group gap="sm" wrap="nowrap" className="overflow-x-auto">
          {SUMMARY_CARDS.map((c) => <SummaryCard key={c.label} card={c} />)}
        </Group>

        {/* Charts row */}
        <div className="grid grid-cols-[1fr_1.3fr_1.1fr] gap-3">
          <ChartCard title="Arrear Aging Distribution">
            <div className="flex flex-col items-center">
              <div className="relative w-[150px] h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={AGING} dataKey="value" nameKey="label" innerRadius={48} outerRadius={70} startAngle={90} endAngle={450} stroke="none" paddingAngle={2}>
                      {AGING.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Text size="13px" fw={800} className="text-slate-900">₹{(totalOverdue / 100000).toFixed(0)}L</Text>
                  <Text size="10px" c="dimmed">Total Overdue</Text>
                </div>
              </div>
              <div className="w-full flex flex-col gap-1.5 mt-3">
                {AGING.map((a) => (
                  <Group key={a.label} justify="space-between">
                    <Group gap={6}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                      <Text size="11.5px" c="dimmed">{a.label}</Text>
                    </Group>
                    <Group gap={8}>
                      <Text size="11.5px" fw={600} className="text-slate-700">{a.amt}</Text>
                      <Text size="11.5px" c="dimmed" className="w-[46px] text-right">{a.pct}</Text>
                    </Group>
                  </Group>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="Overdue Trend"
            right={<Button variant="default" size="xs" radius="md" rightSection={<IconChevronDown size={12} />}>Monthly</Button>}
          >
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={OVERDUE_TREND} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cv("brand", 6)} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={cv("brand", 6)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 10000000).toFixed(2)}Cr`}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    label={{ value: "Amount (₹)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94A3B8" }}
                  />
                  <RTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="amount" stroke={cv("brand", 6)} strokeWidth={2} fill="url(#overdue)" dot={{ r: 3, fill: cv("brand", 6) }} label={{ position: "top", fontSize: 10, fill: "#475569", formatter: (v: number) => `${(v / 10000000).toFixed(2)} Cr` }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Overdue by Loan Product">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={OVERDUE_BY_PRODUCT} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 20 }}>
                  <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v / 100000}L`}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Amount (₹)", position: "insideBottom", offset: -12, fontSize: 10, fill: "#94A3B8" }}
                  />
                  <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={90} />
                  <RTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="amount" fill={cv("brand", 5)} radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Table + Key Insights */}
        <div className="grid grid-cols-[2.2fr_1fr] gap-3 items-start">
          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden">
            <Group p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Top Overdue Accounts</Title>
            </Group>
            <div className="overflow-x-auto">
              <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
                <Table.Thead>
                  <Table.Tr className="text-slate-400">
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Loan Account</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Customer Name</Text></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Branch</Text></Table.Th>
                    <Table.Th><Group gap={4}><Text size="12px" fw={600} c="dimmed">Days Past Due</Text><IconSelector size={13} className="text-slate-300" /></Group></Table.Th>
                    <Table.Th><Text size="12px" fw={600} c="dimmed">Arrear Bucket</Text></Table.Th>
                    <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Overdue Amount (₹)</Text></Table.Th>
                    <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Overdue EMI (₹)</Text></Table.Th>
                    <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Total Overdue (₹)</Text></Table.Th>
                    <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Action</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {TOP_OVERDUE.map((r) => {
                    const b = BUCKET_BADGE[r.bucket];
                    return (
                      <Table.Tr key={r.loanAccount}>
                        <Table.Td fw={600} className="text-slate-700">{r.loanAccount}</Table.Td>
                        <Table.Td className="text-slate-700">{r.customer}</Table.Td>
                        <Table.Td className="text-slate-500">{r.branch}</Table.Td>
                        <Table.Td className="text-slate-600">{r.dpd}</Table.Td>
                        <Table.Td><Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color }}>{r.bucket}</Badge></Table.Td>
                        <Table.Td ta="right" className="text-slate-600">{r.overdueAmt}</Table.Td>
                        <Table.Td ta="right" className="text-slate-600">{r.overdueEmi}</Table.Td>
                        <Table.Td ta="right" fw={700} className="text-slate-800">{r.totalOverdue}</Table.Td>
                        <Table.Td>
                          <Group justify="flex-end">
                            <Tooltip label="View"><ActionIcon variant="subtle" color="gray" size="sm"><IconEye size={14} /></ActionIcon></Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
            <Group justify="space-between" p="sm" className="border-t border-slate-100">
              <Text size="12px" c="dimmed">Showing 1 to 5 of 1,248 entries</Text>
              <Group gap={12}>
                <Pagination total={250} value={1} color="brand" size="sm" radius="md" />
                <Select data={["5 / page", "10 / page", "25 / page"]} defaultValue="5 / page" classNames={{ input: "h-8 text-[12px] w-28 rounded-lg border-slate-200" }} rightSection={<IconChevronDown size={12} className="text-slate-400" />} />
              </Group>
            </Group>
          </Paper>

          <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col gap-2">
            <Title order={5} className="text-slate-900 mb-1">Key Insights</Title>
            {KEY_INSIGHTS.map((k) => {
              const Icon = k.icon;
              return (
                <Paper key={k.title} radius="md" p="sm" className="border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <Group gap={10} wrap="nowrap">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cv(k.color, 0), color: cv(k.color, 6) }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <Text size="12.5px" fw={700} className="text-slate-800">{k.title}</Text>
                      <Text size="11px" c="dimmed">{k.note}</Text>
                    </div>
                  </Group>
                  <IconChevronRight size={15} className="text-slate-300 shrink-0" />
                </Paper>
              );
            })}
          </Paper>
        </div>
      </Box>
    </Box>
  );
}

export default ArrearReports;