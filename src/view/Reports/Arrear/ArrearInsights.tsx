import { Paper, Title, Loader, Group, Text } from "@mantine/core";
import { IconAlertTriangle, IconTrendingUp, IconTargetArrow, IconChartPie, IconChevronRight } from "@tabler/icons-react";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

export function ArrearInsights({ insights, loadingDashboard, renderCurrency }: any) {
  const KEY_INSIGHTS = [
    { title: "Highest Overdue Bucket", note: insights?.highest_overdue_bucket?.label ? `${insights.highest_overdue_bucket.label} (${renderCurrency(insights.highest_overdue_bucket.amount)})` : "-", icon: IconAlertTriangle, color: "danger" },
    { title: "Increase in Overdue", note: insights?.increase_in_overdue?.pct ? `↑ ${insights.increase_in_overdue.pct}% vs last month` : "N/A", icon: IconTrendingUp, color: "gold" },
    { title: "Overdue Concentration", note: insights?.overdue_concentration ? `${insights.overdue_concentration.accounts} accounts make up ${insights.overdue_concentration.pct}% of total overdue` : "-", icon: IconTargetArrow, color: "brand" },
    { title: "Written Off Percentage", note: insights?.written_off_percentage?.pct ? `${insights.written_off_percentage.pct}% of total portfolio` : "-", icon: IconChartPie, color: "accent" },
  ];

  return (
    <Paper withBorder radius="lg" p="sm" className="border-slate-200 flex flex-col gap-2 relative">
      {loadingDashboard && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}
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
  );
}