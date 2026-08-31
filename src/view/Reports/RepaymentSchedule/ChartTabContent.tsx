import { Box, Text, Group, Button, SegmentedControl } from "@mantine/core";
import { IconChartBar, IconTable, IconInfoCircle } from "@tabler/icons-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { LoanScheduleInfo } from "../../../types/Report/repaymentSchedule";


const formatAmount = (currency: string, val: number, _opts?: any) =>
  `${currency} ${val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface ChartTabContentProps {
  info: LoanScheduleInfo | null;
  chartData: { installment: number; Principal: number; Interest: number; Charges: number }[];
  chartViewType: "chart" | "table";
  setChartViewType: (v: "chart" | "table") => void;
}

export function ChartTabContent({ info, chartData, chartViewType, setChartViewType }: ChartTabContentProps) {
  if (!info) return null;

  const { summary } = info;
  const currency = info.currency;
  const totalPayable = summary.total_payable || 1;

  const pctPrincipal = ((summary.total_principal / totalPayable) * 100).toFixed(1);
  const pctInterest = ((summary.total_interest / totalPayable) * 100).toFixed(1);
  const pctCharges = (((summary.total_charges + summary.total_penalty) / totalPayable) * 100).toFixed(1);

  const summaryCards = [
    { label: "Total Principal", value: summary.total_principal, pct: pctPrincipal, color: "#4C6EF5", bgColor: "var(--mantine-color-indigo-0)" },
    { label: "Total Interest", value: summary.total_interest, pct: pctInterest, color: "#40C057", bgColor: "var(--mantine-color-green-0)" },
    { label: "Total Charges", value: summary.total_charges + summary.total_penalty, pct: pctCharges, color: "#FD7E14", bgColor: "var(--mantine-color-orange-0)" },
    { label: "Total Payment", value: summary.total_payable, pct: "100.0", color: "#7048E8", bgColor: "var(--mantine-color-violet-0)" },
  ];

  const compositionItems = [
    { label: "Principal", value: summary.total_principal, pct: pctPrincipal, color: "#4C6EF5" },
    { label: "Interest", value: summary.total_interest, pct: pctInterest, color: "#40C057" },
    { label: "Charges", value: summary.total_charges + summary.total_penalty, pct: pctCharges, color: "#FD7E14" },
  ];

  return (
    <div className="flex flex-col gap-2">
      

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <Box
            key={card.label}
            className="rounded-lg p-2"
            style={{ border: "1px solid var(--mantine-color-slate-1)", background: card.bgColor }}
          >
            <Group gap={4} mb={0}>
              <Box style={{ width: 24, height: 24, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconChartBar size={12} color={card.color} />
              </Box>
              <Text size="xs" c="slate.6" fw={500}>{card.label}</Text>
            </Group>
            <Text size="sm" fw={700} c="slate.9" ff="monospace" lh={1.2} mt={2}>
              {formatAmount(currency, card.value, { withSymbol: true })}
            </Text>
            <Text size="10px" c="slate.5">{card.pct}% of total payment</Text>
            <Box mt={2} style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)" }}>
              <Box style={{ height: 4, borderRadius: 2, background: card.color, width: `${card.pct}%`, maxWidth: "100%" }} />
            </Box>
          </Box>
        ))}
      </div>

      {/* Chart + Composition */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: Stacked Bar Chart */}
        <Box className="col-span-2 rounded-lg p-4" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={700} c="slate.8">Repayment Overview (EMI Composition)</Text>
            <Button size="xs" variant="default" radius="md">Monthly</Button>
          </Group>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-slate-1)" />
              <XAxis dataKey="installment" tick={{ fontSize: 11, fill: "var(--mantine-color-slate-5)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--mantine-color-slate-5)" }}
                tickFormatter={(v) => `${currency} ${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: number, name: string) => [formatAmount(currency, v, { withSymbol: true }), name]}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--mantine-color-slate-2)" }}
              />
              <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Principal" stackId="a" fill="#4C6EF5" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Interest" stackId="a" fill="#40C057" />
              <Bar dataKey="Charges" stackId="a" fill="#FD7E14" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <Box mt="md" p="sm" className="rounded-md flex items-start gap-2" style={{ background: "var(--mantine-color-blue-0)" }}>
            <IconInfoCircle size={16} color="var(--mantine-color-blue-6)" style={{ flexShrink: 0, marginTop: 2 }} />
            <Text size="xs" c="slate.6">
              In the initial installments, a larger portion of your EMI goes towards interest.
              Over time, more of your EMI is applied to principal.
            </Text>
          </Box>
        </Box>

        {/* Right: Payment Composition */}
        <Box className="rounded-lg p-4 flex flex-col" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
          <Text size="sm" fw={700} c="slate.8" mb="md">Payment Composition</Text>

          {/* Horizontal stacked bar */}
          <Box style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex" }} mb="lg">
            {compositionItems.map((item) => (
              <Box
                key={item.label}
                style={{ height: "100%", width: `${item.pct}%`, background: item.color, minWidth: item.pct === "0.0" ? 0 : 4 }}
              />
            ))}
          </Box>

          {/* Breakdown list */}
          <div className="space-y-3 flex-1">
            {compositionItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <Group gap={8}>
                  <Box style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <Text size="sm" c="slate.7">{item.label}</Text>
                </Group>
                <Group gap={12}>
                  <Text size="sm" fw={600} c="slate.8" ff="monospace">
                    {formatAmount(currency, item.value, { withSymbol: true })}
                  </Text>
                  <Text size="sm" c="slate.5" fw={500}>{item.pct}%</Text>
                </Group>
              </div>
            ))}
          </div>

          {/* Total Payment */}
          <Box
            mt="md"
            p="sm"
            className="rounded-md flex justify-between items-center"
            style={{ background: "var(--mantine-color-brand-0)", border: "1px solid var(--mantine-color-brand-1)" }}
          >
            <Text size="sm" fw={600} c="slate.8">Total Payment</Text>
            <Text size="md" fw={700} c="brand.7" ff="monospace">
              {formatAmount(currency, summary.total_payable, { withSymbol: true })}
            </Text>
          </Box>

          {/* Note */}
          <Box mt="md" p="sm" className="rounded-md" style={{ background: "var(--mantine-color-slate-0)" }}>
            <Group gap={6} mb={4}>
              <IconInfoCircle size={14} color="var(--mantine-color-blue-6)" />
              <Text size="xs" fw={600} c="slate.7">Note</Text>
            </Group>
            <Text size="xs" c="slate.5" lh={1.5}>
              This schedule is based on {info.interest_method?.toLowerCase() || "reducing balance"} method.
              Interest rate: {info.rate_of_interest}% p.a. | EMI frequency: {info.frequency}
            </Text>
          </Box>
        </Box>
      </div>
    </div>
  );
}
