import { Button, ScrollArea, Text, useMantineTheme } from "@mantine/core";
import { IconReportMoney, IconCreditCard } from "@tabler/icons-react";
import type { LoanAccount, LoanDuesSummary } from "../../../types/loanRepayment";
import { formatCurrency } from "../../../utils/Loanrepaymentutils";

interface DuesSummaryPanelProps {
  selectedLoan: LoanAccount | null;
  dues: LoanDuesSummary | undefined;
  isDuesLoading: boolean;
  onOpenPaymentEffect: () => void;
}

export function DuesSummaryPanel({ selectedLoan, dues, isDuesLoading, onOpenPaymentEffect }: DuesSummaryPanelProps) {
  const theme = useMantineTheme();

  return (
    <div className="w-[300px] p-5 shrink-0 flex flex-col" style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
        <IconReportMoney size={15} style={{ color: "var(--mantine-color-brand-6)" }} />
        <Text size="sm" fw={700} c="slate.8">
          Dues Summary
        </Text>
      </div>

      {selectedLoan ? (
        <ScrollArea className="flex-1" scrollbarSize={6} type="hover">
          <div className="flex flex-col gap-3">
            <div
              className="rounded-md p-2.5"
              style={{
                background: theme.other.surfaceMutedTranslucent,
                border: "1px solid var(--mantine-color-slate-1)",
              }}
            >
              <Text size="xs" c="dimmed">
                EMI Date
              </Text>
              <Text size="sm" fw={600} c="slate.8">
                {isDuesLoading ? "Loading..." : dues?.due_date || "—"}
              </Text>
            </div>

            <div
              className="rounded-md p-3 flex flex-col gap-1.5"
              style={{
                background: theme.other.surfaceMutedTranslucent,
                border: "1px solid var(--mantine-color-slate-1)",
              }}
            >
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Principal Due
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  {formatCurrency(dues?.payable_principal_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Interest Due
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  {formatCurrency(dues?.interest_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Penalty
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  {formatCurrency(dues?.penalty_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Fees/Charges
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  {formatCurrency(dues?.total_charges_payable ?? 0)}
                </Text>
              </div>
              <div style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }} className="my-1" />
              <div className="flex justify-between items-center">
                <Text size="sm" fw={700} c="slate.8">
                  Total Amount Due
                </Text>
                <Text size="sm" fw={700} ff="monospace" c="slate.8">
                  {formatCurrency(dues?.payable_amount ?? 0)}
                </Text>
              </div>
            </div>

            <Button
              size="sm"
              variant="light"
              color="brand"
              fullWidth
              leftSection={<IconCreditCard size={14} />}
              onClick={onOpenPaymentEffect}
            >
              Payment Effect
            </Button>
          </div>
        </ScrollArea>
      ) : (
        <Text size="xs" c="dimmed" className="py-8 text-center">
          Select a loan account on the left to view dues.
        </Text>
      )}
    </div>
  );
}