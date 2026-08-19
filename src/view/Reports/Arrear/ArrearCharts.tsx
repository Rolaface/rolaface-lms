import { Paper, Group, Text, Loader, Button } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

function ChartCard({ title, right, children }: any) {
  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col relative overflow-hidden">
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={700} className="text-slate-800">{title}</Text>
        {right}
      </Group>
      {children}
    </Paper>
  );
}

export function ArrearCharts({ summary, charts, loadingDashboard, renderCurrency }: any) {
  const pieColors = [cv("brand", 6), cv("gold", 6), cv("accent", 6), cv("indigoAlt", 6), cv("danger", 6)];
  
  const AGING = (charts?.aging_distribution || []).map((item: any, idx: number) => ({
    label: item.label,
    amt: renderCurrency(item.amount),
    pct: `${item.pct}%`,
    value: item.amount,
    color: pieColors[idx % pieColors.length]
  }));

  return (
    <div className="grid grid-cols-[1fr_1.3fr_1.1fr] gap-3 relative">
      {loadingDashboard && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}
      
      <ChartCard title="Arrear Aging Distribution">
        <div className="flex flex-col items-center">
          <div className="relative w-[150px] h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={AGING} dataKey="value" nameKey="label" innerRadius={48} outerRadius={70} startAngle={90} endAngle={450} stroke="none" paddingAngle={2}>
                  {AGING.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RTooltip formatter={(v: number) => renderCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Text size="13px" fw={800} className="text-slate-900">
                {summary?.total_overdue ? renderCurrency(summary.total_overdue).split('.')[0] : "0"}
              </Text>
              <Text size="10px" c="dimmed">Total Overdue</Text>
            </div>
          </div>
          <div className="w-full flex flex-col gap-1.5 mt-3">
            {AGING.map((a: any) => (
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

      <ChartCard title="Overdue Trend" right={<Button variant="default" size="xs" radius="md" rightSection={<IconChevronDown size={12} />}>Monthly</Button>}>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts?.overdue_trend || []} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="overdue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cv("brand", 6)} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={cv("brand", 6)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={50} />
              <RTooltip formatter={(v: number) => renderCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="amount" stroke={cv("brand", 6)} strokeWidth={2} fill="url(#overdue)" dot={{ r: 3, fill: cv("brand", 6) }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Overdue by Loan Product">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.overdue_by_product || []} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 20 }}>
              <CartesianGrid horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={90} />
              <RTooltip formatter={(v: number) => renderCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="amount" fill={cv("brand", 5)} radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}