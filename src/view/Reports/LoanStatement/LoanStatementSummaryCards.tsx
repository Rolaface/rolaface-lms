import { Paper, Group, Text, Loader } from "@mantine/core";
import { IconWallet, IconArrowDown, IconArrowUp, IconReceipt2 } from "@tabler/icons-react";

export const theme = {
  brand: { 0: "#EFF6FF", 1: "#DBEAFE", 5: "#3B82F6", 6: "#1E40AF", 7: "#1E3A8A", 8: "#1e40af" },
  accent: { 0: "#DCFCE7", 1: "#BBF7D0", 5: "#22C55E", 6: "#16A34A" },
  gold: { 0: "#FEF3C7", 1: "#FDE68A", 5: "#F59E0B", 6: "#D97706" },
  danger: { 0: "#FEE2E2", 1: "#FECACA", 5: "#EF4444", 6: "#DC2626" },
  indigoAlt: { 0: "#F3E8FF", 1: "#E9D5FF", 5: "#8B5CF6", 6: "#7C3AED" },
};

function SummaryCard({ card }: { card: any }) {
  const Icon = card.icon;
  const c = theme[card.color as keyof typeof theme] || theme.brand;
  return (
    <Paper withBorder radius="lg" p="sm" className="flex-1 min-w-[190px] border-slate-200">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="xs" fw={600} c={card.highlight ? theme.brand[6] : "dimmed"}>
          {card.label}
        </Text>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: c[0], color: (c as any)[6] }}
        >
          <Icon size={16} />
        </div>
      </Group>
      <Text fw={800} className="text-[17px] text-slate-900 mt-1.5">
        {card.value}
      </Text>
    </Paper>
  );
}

export function LoanStatementSummaryCards({ dashboardData, loadingDashboard, renderCurrency }: any) {
  const CARDS = [
    { label: "Opening Balance", value: renderCurrency(dashboardData?.summary?.opening_balance), icon: IconWallet, color: "indigoAlt" },
    { label: "Total Disbursed", value: renderCurrency(dashboardData?.summary?.total_disbursed), icon: IconArrowDown, color: "accent" },
    { label: "Total Repayments", value: renderCurrency(dashboardData?.summary?.total_repayments), icon: IconArrowUp, color: "brand" },
    { label: "Total Charges", value: renderCurrency(dashboardData?.summary?.total_charges), icon: IconReceipt2, color: "gold" },
    { label: "Closing Balance", value: renderCurrency(dashboardData?.summary?.closing_balance), icon: IconWallet, color: "brand", highlight: true },
  ];

  return (
    <Group gap="sm" wrap="nowrap" className="overflow-x-auto relative min-h-[90px]">
      {loadingDashboard && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Loader size="sm" color="blue" />
        </div>
      )}
      {CARDS.map((c) => (
        <SummaryCard key={c.label} card={c} />
      ))}
    </Group>
  );
}