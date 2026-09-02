import { Button, ScrollArea, Text, useMantineTheme } from "@mantine/core";
import { IconReportMoney, IconCreditCard } from "@tabler/icons-react";
import type {
  LoanAccount,
  LoanDuesSummary,
} from "../../../types/loanRepayment";
import { formatCurrency } from "../../../utils/Loanrepaymentutils";
import { CurrencySymbol } from "../../shared/CurrencyIcon";
import { DateInput } from "@mantine/dates";

interface DuesSummaryPanelProps {
  selectedLoan: LoanAccount | null;
  dues: LoanDuesSummary | undefined;
  isDuesLoading: boolean;
  onOpenPaymentEffect: () => void;
}

export function DuesSummaryPanel({
  selectedLoan,
  dues,
  isDuesLoading,
  onOpenPaymentEffect,
}: DuesSummaryPanelProps) {
  const theme = useMantineTheme();

  return (
    <div
      className="w-75 p-5 shrink-0 flex flex-col min-h-0 shadow-(--mantine-shadow-lg)"
      style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-4 rounded"
          style={{ background: theme.other.accentBarGradient }}
        />
        <Text
          size="sm"
          fw={700}
          c="slate.8"
          tt="uppercase"
          style={{ letterSpacing: "0.05em" }}
        >
          Dues Summary
        </Text>
      </div>

      {selectedLoan ? (
        <ScrollArea className="flex-1" scrollbarSize={6} type="hover">
          <div className="flex flex-col gap-3">
            <div className="rounded-md p-2.5">
              <Text size="xs" c="dimmed">
                EMI Date
              </Text>

              <DateInput
                size="sm"
                variant="unstyled"
                valueFormat="DD-MMM-YYYY"
                value={
                  dues?.due_date ? new Date(`${dues.due_date}T00:00:00`) : null
                }
                readOnly
                disabled={isDuesLoading}
                placeholder={isDuesLoading ? "Loading..." : "—"}
              />
            </div>

            <div
              className="rounded-md p-3 flex flex-col gap-2"
              style={{
                background: "var(--mantine-color-slate-1)",
                border: "1px solid var(--mantine-color-slate-2)",
              }}
            >
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Principal Due
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  <CurrencySymbol size="xs" fw={400} />{" "}
                  {formatCurrency(dues?.payable_principal_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Interest Due
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  <CurrencySymbol size="xs" fw={400} />{" "}
                  {formatCurrency(dues?.interest_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Penalty
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  <CurrencySymbol size="xs" fw={400} />{" "}
                  {formatCurrency(dues?.penalty_amount ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" c="dimmed">
                  Fees/Charges
                </Text>
                <Text size="xs" ff="monospace" c="slate.6">
                  <CurrencySymbol size="xs" fw={400} />{" "}
                  {formatCurrency(dues?.total_charges_payable ?? 0)}
                </Text>
              </div>
              <div className="flex justify-between items-center pt-1">
                <Text size="sm" fw={700} c="slate.8">
                  Total Amount Due
                </Text>
                <Text size="sm" fw={700} ff="monospace" c="slate.8">
                  <CurrencySymbol size="sm" fw={700} />{" "}
                  {formatCurrency(dues?.payable_amount ?? 0)}
                </Text>
              </div>
            </div>

            <Button
              size="sm"
              variant="light"
              color="brand"
              fullWidth
              className="mt-4"
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
