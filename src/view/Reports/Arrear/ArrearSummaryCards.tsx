import { Group, Paper, Text, Loader } from "@mantine/core";
import { IconUsers, IconReceipt2, IconCalendarCheck, IconAlertTriangle, IconFileOff, IconArrowUp } from "@tabler/icons-react";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

export function ArrearSummaryCards({ summary, loadingDashboard, renderCurrency }: any) {
  const CARDS = [
    { label: "Total Accounts", value: summary?.total_accounts || "0", note: "Active accounts", icon: IconUsers, color: "indigoAlt" },
    { label: "Total Overdue", value: renderCurrency(summary?.total_overdue), note: `${summary?.overdue_pct || 0}% of portfolio`, noteColor: cv("red", 6), noteIcon: IconArrowUp, icon: IconReceipt2, color: "danger" },
    { label: "Current", value: renderCurrency(summary?.current_amount), note: `${summary?.current_pct || 0}% of portfolio`, noteColor: cv("green", 6), icon: IconCalendarCheck, color: "brand" },
    { label: "Overdue", value: renderCurrency(summary?.overdue_amount), note: `${summary?.overdue_pct || 0}% of portfolio`, noteColor: cv("gold", 6), icon: IconAlertTriangle, color: "gold" },
    { label: "Written Off", value: renderCurrency(summary?.written_off_amount), note: `${summary?.written_off_pct || 0}% of portfolio`, noteColor: cv("accent", 6), icon: IconFileOff, color: "accent" },
  ];

  return (
    <Group gap="sm" wrap="nowrap" className="overflow-x-auto relative min-h-[90px]">
      {loadingDashboard && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}
      {CARDS.map((card) => {
        const Icon = card.icon;
        const NoteIcon = card.noteIcon as any;
        return (
          <Paper key={card.label} withBorder radius="lg" p="sm" className="flex-1 min-w-[190px] border-slate-200">
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
      })}
    </Group>
  );
}