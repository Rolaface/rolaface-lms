import { useEffect, useState } from "react";
import { Paper, Group, Text, Loader } from "@mantine/core";
import { OverviewField, themeTokens } from "./SharedUI";

const scheduleStatusColor: Record<string, string> = {
  "Paid": "var(--mantine-color-success-6)",
  "Partially Paid": "var(--mantine-color-warning-6)",
  "Overdue": "var(--mantine-color-danger-6)",
  "Upcoming": "var(--mantine-color-slate-1)",
};

export function LoanInstallmentOverview({ data, renderCurrency, actions }: any) {
  const { timeline, activeInstallment } = data;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (timeline.length > 0 && selectedIdx === null) {
      setSelectedIdx(timeline[0].idx);
      actions.fetchInstallment(timeline[0].idx);
    }
  }, [timeline, selectedIdx, actions]);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    actions.fetchInstallment(idx);
  };

  return (
 <Paper radius="lg" p="md" withBorder shadow="xs">
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        <Group gap={18}>
          {Object.entries(scheduleStatusColor).map(([label, color]) => (
            <Group gap={6} key={label}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <Text fz="xs">{label}</Text>
            </Group>
          ))}
        </Group>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {timeline.map((item: any) => {
          const isSelected = item.idx === selectedIdx;
          return (
            <button
              key={item.idx}
              onClick={() => handleSelect(item.idx)}
              style={{
                width: 40, height: 56, borderRadius: 8,
                background: item.ui_status === "Upcoming" ? "var(--mantine-color-slate-1)" : scheduleStatusColor[item.ui_status] || themeTokens.slate,
                border: isSelected ? `2px solid ${themeTokens.ink}` : item.ui_status === "Upcoming" ? "1px solid var(--mantine-color-slate-2)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: item.ui_status === "Upcoming" ? "var(--mantine-color-slate-4)" : "var(--mantine-color-white)",
                fontWeight: 700, fontSize: 13, padding: 0, cursor: "pointer", transition: "transform 0.1s ease",
              }}
            >
              {item.idx}
            </button>
          );
        })}
      </div>

      {activeInstallment ? (
        <div className="rounded-xl p-4" style={{ backgroundColor: themeTokens.surface, border: "1px solid var(--mantine-color-slate-2)" }}>
          <Text fz="sm" fw={700} c="slate.9" className="mb-3">
            Installment {activeInstallment.idx} · due {activeInstallment.payment_date}
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <OverviewField label="PRINCIPAL" value={renderCurrency(activeInstallment.principal)} />
            <OverviewField label="INTEREST" value={renderCurrency(activeInstallment.interest)} />
            <OverviewField label="PENALTY" value={renderCurrency(activeInstallment.penalty)} />
            <OverviewField label="TOTAL DUE" value={renderCurrency(activeInstallment.total_payment)} />
            <OverviewField label="STATUS" value={activeInstallment.ui_status} />
          </div>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center"><Loader size="sm" color="slate" /></div>
      )}
    </Paper>
  );
}