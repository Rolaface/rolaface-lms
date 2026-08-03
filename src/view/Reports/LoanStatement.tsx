import { useState } from "react";
import {
  Box, Button, TextInput, Select, Group, Paper, Table, Badge,
  ActionIcon, Text, Pagination, Tooltip, Title, Loader, Alert,
} from "@mantine/core";
import {
  IconEye, IconPlus, IconChevronUp, IconChevronDown,
  IconSelector, IconSearch, IconAlertCircle, IconFileText, IconReceipt2, IconCalendar,
  IconFilter, IconDownload, IconWallet, IconArrowUp,
  IconArrowDown, IconFileSpreadsheet, IconClipboardList
} from "@tabler/icons-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ---------------------------------------------------------------------
   Palette — matches Sidebar.tsx's blue identity (#1E40AF / #3B82F6)
   instead of inventing custom Mantine color names that may not exist
   in this project's mantine.theme.ts.
--------------------------------------------------------------------- */
const theme = {
  brand: { 0: "#EFF6FF", 1: "#DBEAFE", 5: "#3B82F6", 6: "#1E40AF", 7: "#1E3A8A" },
  accent: { 0: "#DCFCE7", 1: "#BBF7D0", 5: "#22C55E", 6: "#16A34A" },
  gold: { 0: "#FEF3C7", 1: "#FDE68A", 5: "#F59E0B", 6: "#D97706" },
  danger: { 0: "#FEE2E2", 1: "#FECACA", 5: "#EF4444", 6: "#DC2626" },
  indigoAlt: { 0: "#F3E8FF", 1: "#E9D5FF", 5: "#8B5CF6", 6: "#7C3AED" },
};

const SUMMARY_CARDS = [
  { label: "Opening Balance", value: "₹1,25,000.00", note: "As on 01/04/2026", icon: IconWallet, color: "indigoAlt" },
  { label: "Total Disbursed", value: "₹1,80,000.00", note: "In selected period", icon: IconArrowDown, color: "accent" },
  { label: "Total Repayments", value: "₹75,000.00", note: "In selected period", icon: IconArrowUp, color: "brand" },
  { label: "Total Charges", value: "₹5,300.00", note: "In selected period", icon: IconReceipt2, color: "gold" },
  { label: "Closing Balance", value: "₹2,11,300.00", note: "As on 01/08/2026", icon: IconWallet, color: "brand", highlight: true },
];

const BALANCE_TREND = [
  { month: "Apr '26", balance: 125000 },
  { month: "", balance: 305000 },
  { month: "May '26", balance: 282000 },
  { month: "Jun '26", balance: 257000 },
  { month: "Jul '26", balance: 232000 },
  { month: "", balance: 209300 },
  { month: "Aug '26", balance: 211300 },
];

const CASH_FLOW = [
  { month: "Apr '26", Disbursal: 180000, Repayment: 0, "Charges/Interest": 2000 },
  { month: "May '26", Disbursal: 0, Repayment: 25000, "Charges/Interest": 0 },
  { month: "Jun '26", Disbursal: 0, Repayment: 25000, "Charges/Interest": 0 },
  { month: "Jul '26", Disbursal: 0, Repayment: 25000, "Charges/Interest": 2300 },
  { month: "Aug '26", Disbursal: 0, Repayment: 25000, "Charges/Interest": 1000 },
];

const LOAN_SNAPSHOT = [
  ["Currency", "INR - Indian Rupee"],
  ["Loan Account", "LN-000456"],
  ["Loan Product", "Personal Loan"],
  ["Loan Amount", "₹5,00,000.00"],
  ["Disbursed Amount", "₹1,80,000.00"],
  ["ROI (%)", "10.00%"],
  ["EMI Amount", "₹25,000.00"],
  ["EMI Start Date", "01/05/2026"],
  ["Next Due Date", "01/09/2026"],
  ["EMIs Paid / Total", "3 / 12"],
];

const AGING = [
  { label: "0 - 30 DPD", pct: "100%", amt: "₹2,11,300", color: theme.brand[6] },
  { label: "31 - 60 DPD", pct: "0%", amt: "₹0", color: theme.gold[6] },
  { label: "61 - 90 DPD", pct: "0%", amt: "₹0", color: theme.danger[6] },
  { label: "> 90 DPD", pct: "0%", amt: "₹0", color: theme.indigoAlt[6] },
];
const AGING_PIE = [
  { name: "0-30", value: 100, color: theme.brand[6] },
  { name: "rest", value: 0.0001, color: "#E5E7EB" },
];

type Txn = { date: string; particulars: string; ref: string; type: string; debit: string; credit: string; balance: string };
const TRANSACTIONS: Txn[] = [
  { date: "01/04/2026", particulars: "Opening Balance", ref: "-", type: "Opening Balance", debit: "-", credit: "-", balance: "1,25,000.00" },
  { date: "05/04/2026", particulars: "Loan Disbursement", ref: "DISB-000123", type: "Disbursal", debit: "1,80,000.00", credit: "-", balance: "3,05,000.00" },
  { date: "10/04/2026", particulars: "Processing Fee", ref: "FEE-000456", type: "Charge", debit: "2,000.00", credit: "-", balance: "3,07,000.00" },
  { date: "01/05/2026", particulars: "EMI Payment", ref: "PAY-000789", type: "Repayment", debit: "-", credit: "25,000.00", balance: "2,82,000.00" },
  { date: "01/06/2026", particulars: "EMI Payment", ref: "PAY-000812", type: "Repayment", debit: "-", credit: "25,000.00", balance: "2,57,000.00" },
  { date: "01/07/2026", particulars: "EMI Payment", ref: "PAY-000845", type: "Repayment", debit: "-", credit: "25,000.00", balance: "2,32,000.00" },
  { date: "15/07/2026", particulars: "Interest Accrued", ref: "INT-000321", type: "Interest", debit: "2,300.00", credit: "-", balance: "2,34,300.00" },
  { date: "01/08/2026", particulars: "EMI Payment", ref: "PAY-000879", type: "Repayment", debit: "-", credit: "25,000.00", balance: "2,09,300.00" },
  { date: "01/08/2026", particulars: "Penalty Charges", ref: "PEN-000111", type: "Charge", debit: "1,000.00", credit: "-", balance: "2,10,300.00" },
  { date: "01/08/2026", particulars: "Interest Accrued", ref: "INT-000344", type: "Interest", debit: "1,000.00", credit: "-", balance: "2,11,300.00" },
];

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  "Opening Balance": { bg: "#F1F5F9", color: "#64748B" },
  Disbursal: { bg: theme.indigoAlt[0], color: theme.indigoAlt[6] },
  Charge: { bg: theme.gold[0], color: theme.gold[6] },
  Repayment: { bg: theme.brand[0], color: theme.brand[6] },
  Interest: { bg: theme.accent[0], color: theme.accent[6] },
};

/* ---------------------------------------------------------------------
   Small building blocks
--------------------------------------------------------------------- */
const inputClassNames = {
  label: "text-[12px] font-semibold text-slate-700 mb-1",
  input: "min-h-[28px] h-[28px] text-[11.5px] px-2 border-slate-200 rounded-lg focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

function SummaryCard({ card }: { card: (typeof SUMMARY_CARDS)[number] }) {
  const Icon = card.icon;
  const c = theme[card.color as keyof typeof theme];
  return (
    <Paper withBorder radius="lg" p="sm" className="flex-1 min-w-[190px] border-slate-200">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} c={card.highlight ? theme.brand[6] : "dimmed"}>{card.label}</Text>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c[0], color: (c as any)[6] }}>
          <Icon size={16} />
        </div>
      </Group>
      <Text fw={800} className="text-[17px] text-slate-900 mt-1.5">{card.value}</Text>
      <Text size="10.5px" c="dimmed" mt={1}>{card.note}</Text>
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

type SortKey = "date" | "balance" | null;

/* ---------------------------------------------------------------------
   Page
--------------------------------------------------------------------- */
export function LoanStatement() {
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <IconSelector size={13} className="text-slate-300" />;
    return sortAsc ? <IconChevronUp size={13} className="text-slate-500" /> : <IconChevronDown size={13} className="text-slate-500" />;
  };

  const rows = TRANSACTIONS.filter((t) => t.particulars.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase()));

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 900);
  };

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3.5">
        {/* Page header */}
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
            <Button variant="default" size="sm" radius="md" leftSection={<IconFileText size={15} color="#DC2626" />}>Export PDF</Button>
            <Button variant="default" size="sm" radius="md" leftSection={<IconFileSpreadsheet size={15} color="#1E40AF" />}>Export Excel</Button>
            <Button size="sm" radius="md" color="blue" loading={loading} leftSection={!loading && <IconClipboardList size={15} />} onClick={handleGenerate}>
              Generate Statement
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        <Paper withBorder radius="lg" p="sm" className="border-slate-200">
          <div className="flex flex-wrap gap-12">
            <Select label="Customer" withAsterisk placeholder="Select customer" data={["CUST-000123 - Rahul Sharma"]} defaultValue="CUST-000123 - Rahul Sharma" classNames={inputClassNames} className="w-[280px]" rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
            <Select label="Loan Account" withAsterisk placeholder="Select account" data={["LN-000456 - Personal Loan"]} defaultValue="LN-000456 - Personal Loan" classNames={inputClassNames} className="w-[230px]" rightSection={<IconChevronDown size={13} className="text-slate-400" />} />
            <TextInput label="From Date" withAsterisk type="date" defaultValue="2026-04-01" classNames={inputClassNames} className="w-[180px]" rightSection={<IconCalendar size={14} className="text-slate-400" />} />
            <TextInput label="To Date" withAsterisk type="date" defaultValue="2026-08-01" classNames={inputClassNames} className="w-[180px]" rightSection={<IconCalendar size={14} className="text-slate-400" />} />
          </div>
        </Paper>

          {/* Summary */}
          <div>
            <Group justify="space-between" mb={8}>
              <Title order={5} className="text-slate-900">Loan Statement Summary</Title>
              <Group gap={4} className="rounded-lg border border-slate-200 p-1 bg-white">
                {["Summary View", "Overview", "Detailed"].map((t) => (
                  <Button
                    key={t}
                    size="xs"
                    radius="md"
                    variant="subtle"
                    onClick={() => setTab(t)}
                    className="px-3"
                    styles={{
                      root: tab === t
                        ? { backgroundColor: theme.brand[0], color: theme.brand[6] }
                        : { color: "#94A3B8", backgroundColor: "transparent" },
                    }}
                  >
                    <Text size="12.5px" fw={700} inherit>{t}</Text>
                  </Button>
                ))}
              </Group>
            </Group>
            <Group gap="sm" wrap="nowrap" className="overflow-x-auto">
              {SUMMARY_CARDS.map((c) => <SummaryCard key={c.label} card={c} />)}
            </Group>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-3">
            <ChartCard
              title="Balance Trend"
              right={<Button variant="default" size="xs" radius="md" rightSection={<IconChevronDown size={12} />}>Monthly</Button>}
            >
              <div className="h-[165px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={BALANCE_TREND} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.indigoAlt[6]} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={theme.indigoAlt[6]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${v / 100000}L`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                    <RTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="balance" stroke={theme.indigoAlt[6]} strokeWidth={2} fill="url(#bal)" dot={{ r: 3, fill: theme.indigoAlt[6] }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Group gap={6} mt={4}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.indigoAlt[6] }} />
                <Text size="11px" c="dimmed">Closing Balance</Text>
              </Group>
            </ChartCard>

            <ChartCard title="Cash Flow (₹)">
              <div className="h-[165px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CASH_FLOW} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={36} />
                    <RTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="Disbursal" fill={theme.indigoAlt[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="Repayment" fill={theme.brand[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="Charges/Interest" fill={theme.gold[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Group gap={12} mt={4}>
                <Group gap={4}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.indigoAlt[6] }} /><Text size="11px" c="dimmed">Disbursal</Text></Group>
                <Group gap={4}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.brand[6] }} /><Text size="11px" c="dimmed">Repayment</Text></Group>
                <Group gap={4}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.gold[6] }} /><Text size="11px" c="dimmed">Charges/Interest</Text></Group>
              </Group>
            </ChartCard>

            <ChartCard title="Loan Snapshot">
              <div className="flex flex-col gap-1.5">
                {LOAN_SNAPSHOT.map(([k, v]) => (
                  <Group key={k} justify="space-between">
                    <Text size="12.5px" c="dimmed">{k}</Text>
                    <Text size="12.5px" fw={700} className="text-slate-800">{v}</Text>
                  </Group>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Aging Summary (DPD)">
              <div className="flex flex-col items-center">
                <div className="relative w-[92px] h-[92px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={AGING_PIE} dataKey="value" innerRadius={30} outerRadius={42} startAngle={90} endAngle={450} stroke="none">
                        {AGING_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Text size="11px" fw={700} className="text-slate-700">Current</Text>
                    <Text size="10px" c="dimmed">0 DPD</Text>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1.5 mt-3">
                  {AGING.map((a) => (
                    <Group key={a.label} justify="space-between">
                      <Group gap={6}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                        <Text size="11px" c="dimmed">{a.label}</Text>
                      </Group>
                      <Text size="11px" fw={500} className="text-slate-700">{a.pct} ({a.amt})</Text>
                    </Group>
                  ))}
                </div>
                <Text size="10px" c="dimmed" mt={8} className="self-start opacity-70">* DPD as on 01/08/2026</Text>
              </div>
            </ChartCard>
          </div>

          {/* Table */}
          <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden">
            <Group justify="space-between" p="sm" className="border-b border-slate-100">
              <Title order={5} className="text-slate-900">Loan Statement Details</Title>
              <Group gap={10}>
                <TextInput
                  placeholder="Search transactions..."
                  leftSection={<IconSearch size={14} className="text-slate-400" />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  classNames={{ input: "h-9 w-56 rounded-lg border-slate-200 text-[12.5px]" }}
                />
                <Button variant="default" size="sm" radius="md" leftSection={<IconFilter size={13} />}>Filter</Button>
                <ActionIcon variant="default" size={36} radius="md"><IconDownload size={14} /></ActionIcon>
                <ActionIcon variant="filled" color="blue" size={36} radius="md"><IconPlus size={16} /></ActionIcon>
              </Group>
            </Group>

            <div className="overflow-x-auto">
              {loading ? (
                <Group justify="center" py="xl"><Loader color="blue" size="sm" /></Group>
              ) : rows.length === 0 ? (
                <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />} m="md">
                  No transactions match "{search}".
                </Alert>
              ) : (
                <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
                  <Table.Thead>
                    <Table.Tr className="text-slate-400">
                      <Table.Th onClick={() => toggleSort("date")} className="cursor-pointer">
                        <Group gap={4}><Text size="12px" fw={600} c="dimmed">Date</Text>{sortIcon("date")}</Group>
                      </Table.Th>
                      <Table.Th><Text size="12px" fw={600} c="dimmed">Particulars</Text></Table.Th>
                      <Table.Th><Text size="12px" fw={600} c="dimmed">Reference No.</Text></Table.Th>
                      <Table.Th><Text size="12px" fw={600} c="dimmed">Transaction Type</Text></Table.Th>
                      <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Debit (₹)</Text></Table.Th>
                      <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Credit (₹)</Text></Table.Th>
                      <Table.Th ta="right" onClick={() => toggleSort("balance")} className="cursor-pointer">
                        <Group gap={4} justify="flex-end"><Text size="12px" fw={600} c="dimmed">Balance (₹)</Text>{sortIcon("balance")}</Group>
                      </Table.Th>
                      <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Actions</Text></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rows.map((t, i) => {
                      const b = TYPE_BADGE[t.type];
                      return (
                        <Table.Tr key={i}>
                          <Table.Td className="text-slate-500">{t.date}</Table.Td>
                          <Table.Td className="text-slate-700">{t.particulars}</Table.Td>
                          <Table.Td className="text-slate-400 font-mono text-[11.5px]">{t.ref}</Table.Td>
                          <Table.Td><Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color }}>{t.type}</Badge></Table.Td>
                          <Table.Td ta="right" className="text-slate-600">{t.debit}</Table.Td>
                          <Table.Td ta="right" className="text-slate-600">{t.credit}</Table.Td>
                          <Table.Td ta="right" fw={700} className="text-slate-800">{t.balance}</Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <Tooltip label="View"><ActionIcon variant="subtle" color="gray" size="sm"><IconEye size={14} /></ActionIcon></Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </div>

            <Group justify="space-between" p="sm" className="border-t border-slate-100">
              <Text size="12px" c="dimmed">Showing {rows.length} of {TRANSACTIONS.length} entries</Text>
              <Group gap={12}>
                <Pagination total={1} value={page} onChange={setPage} color="blue" size="sm" radius="md" />
                <Select data={["10 / page", "25 / page", "50 / page"]} defaultValue="10 / page" classNames={{ input: "h-8 text-[12px] w-28 rounded-lg border-slate-200" }} rightSection={<IconChevronDown size={12} className="text-slate-400" />} />
              </Group>
            </Group>
          </Paper>
      </Box>
    </Box>
  );
}

export default LoanStatement;