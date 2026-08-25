import { Paper, Group, Text, Button, Loader } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { theme } from "./LoanStatementSummaryCards";

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

export function LoanStatementCharts({ dashboardData, loadingDashboard, renderCurrency }: any) {
  const balanceTrend = dashboardData?.balance_trend || [];
  const cashFlow = dashboardData?.cash_flow?.map((c: any) => ({
    month: c.month,
    Disbursal: c.disbursal,
    Repayment: c.repayment,
    "Charges/Interest": c.charges,
  })) || [];

  const currentPct = dashboardData?.aging_summary?.find((a: any) => a.label === "Current")?.percentage || 0;
  const agingPie = [
    { name: "Current", value: currentPct, color: theme.brand[6] },
    { name: "Rest", value: 100 - currentPct || 0.0001, color: "#E5E7EB" },
  ];
  
  const agingColors = [theme.brand[6], theme.gold[6], theme.danger[6], theme.indigoAlt[6], theme.brand[8]];

  return (
    <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-3 relative">
      {loadingDashboard && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}

      {/* Balance Trend Area Chart */}
      <ChartCard title="Balance Trend" right={<Button variant="default" size="xs" radius="md" rightSection={<IconChevronDown size={12} />}>Monthly</Button>}>
        <div className="h-[165px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.indigoAlt[6]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={theme.indigoAlt[6]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
              <RTooltip formatter={(v: number) => renderCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="balance" stroke={theme.indigoAlt[6]} strokeWidth={2} fill="url(#bal)" dot={{ r: 3, fill: theme.indigoAlt[6] }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Cash Flow Bar Chart */}
      <ChartCard title="Cash Flow">
        <div className="h-[165px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={36} />
              <RTooltip formatter={(v: number) => renderCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="Disbursal" fill={theme.indigoAlt[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="Repayment" fill={theme.brand[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="Charges/Interest" fill={theme.gold[6]} radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Snapshot List */}
      <ChartCard title="Loan Snapshot">
        <div className="flex flex-col gap-1.5 overflow-y-auto h-full pr-1">
          {[
            ["Currency", dashboardData?.snapshot?.currency || "-"],
            ["Loan Account", dashboardData?.snapshot?.loan_account || "-"],
            ["Loan Product", dashboardData?.snapshot?.loan_product || "-"],
            ["Loan Amount", renderCurrency(dashboardData?.snapshot?.loan_amount)],
            ["Disbursed Amount", renderCurrency(dashboardData?.snapshot?.disbursed_amount)],
            ["ROI (%)", `${dashboardData?.snapshot?.roi || 0}%`],
            ["Maturity Date", dashboardData?.snapshot?.maturity_date || "-"],
            ["EMI Amount", renderCurrency(dashboardData?.snapshot?.emi_amount)],
            ["EMI Start Date", dashboardData?.snapshot?.emi_start_date || "-"],
            ["Next Due Date", dashboardData?.snapshot?.next_due_date || "-"],
            ["EMIs Paid / Total", dashboardData?.snapshot?.emis_paid || "-"],
          ].map(([k, v], idx) => (
            <Group key={idx} justify="space-between">
              <Text size="12.5px" c="dimmed">{k}</Text>
              <Text size="12.5px" fw={700} className="text-slate-800">{String(v)}</Text>
            </Group>
          ))}
        </div>
      </ChartCard>

      {/* Aging Summary Pie */}
      <ChartCard title="Aging Summary (DPD)">
        <div className="flex flex-col items-center">
          <div className="relative w-[92px] h-[92px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={agingPie} dataKey="value" innerRadius={30} outerRadius={42} startAngle={90} endAngle={450} stroke="none">
                  {agingPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Text size="11px" fw={700} className="text-slate-700">Current</Text>
              <Text size="10px" c="dimmed">{currentPct}%</Text>
            </div>
          </div>
          <div className="w-full flex flex-col gap-1.5 mt-3">
            {dashboardData?.aging_summary?.map((a: any, i: number) => (
              <Group key={a.label} justify="space-between">
                <Group gap={6}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agingColors[i % agingColors.length] }} />
                  <Text size="11px" c="dimmed">{a.label}</Text>
                </Group>
                <Text size="11px" fw={500} className="text-slate-700">
                  {a.percentage}% ({renderCurrency(a.amount)})
                </Text>
              </Group>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  );
}