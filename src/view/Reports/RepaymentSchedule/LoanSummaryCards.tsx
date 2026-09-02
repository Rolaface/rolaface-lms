import { Box, Text } from "@mantine/core";
import {
  IconBusinessplan,
  IconPercentage,
  IconCalendarEvent,
  IconFlag,
  IconReceipt2,
} from "@tabler/icons-react";
import type { LoanScheduleInfo } from "../../../types/Report/repaymentSchedule";

interface LoanSummaryCardsProps {
  info: LoanScheduleInfo | null;
}

const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : "—";

const fmtCurrency = (currency: string, val: number) =>
  `${currency} ${val.toLocaleString("en-IN")}`;

export function LoanSummaryCards({ info }: LoanSummaryCardsProps) {
  const cards = [
    {
      label: "Loan Amount",
      value: info ? fmtCurrency(info.currency, info.loan_amount) : "—",
      icon: IconBusinessplan,
      color: "var(--mantine-color-violet-6)",
      bg: "var(--mantine-color-violet-0)",
    },
    {
      label: "Loan Tenure",
      value: info ? `${info.loan_tenure} Months` : "—",
      icon: IconPercentage,
      color: "var(--mantine-color-green-6)",
      bg: "var(--mantine-color-green-0)",
    },
    {
      label: "Loan Start Date",
      value: info ? fmtDate(info.loan_start_date) : "—",
      icon: IconCalendarEvent,
      color: "var(--mantine-color-blue-6)",
      bg: "var(--mantine-color-blue-0)",
    },
    {
      label: "Maturity Date",
      value: info ? fmtDate(info.maturity_date) : "—",
      icon: IconFlag,
      color: "var(--mantine-color-orange-6)",
      bg: "var(--mantine-color-orange-0)",
    },
    {
      label: "EMI Amount",
      value: info ? fmtCurrency(info.currency, info.emi_amount) : "—",
      icon: IconReceipt2,
      color: "var(--mantine-color-yellow-7)",
      bg: "var(--mantine-color-yellow-0)",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {cards.map((card) => (
        <Box
          key={card.label}
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{ border: "1px solid var(--mantine-color-slate-1)", background: "white" }}
        >
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--mantine-radius-md)",
              background: card.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <card.icon size={18} color={card.color} stroke={1.5} />
          </Box>
          <div>
            <Text size="11px" c="slate.5" fw={600} mb={0}>
              {card.label}
            </Text>
            <Text size="xs" fw={700} c="slate.9">
              {card.value}
            </Text>
          </div>
        </Box>
      ))}
    </div>
  );
}
