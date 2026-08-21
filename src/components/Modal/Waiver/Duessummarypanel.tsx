import { Button, Text, useMantineTheme } from "@mantine/core";
import { IconCreditCard } from "@tabler/icons-react";
import type { LoanWaiverLoanAccount } from "../../../types/loanwaiver";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

interface DuesSummaryPanelProps {
  selectedLoan: LoanWaiverLoanAccount | null;
  dues: any;
  isDuesLoading: boolean;
  onOpenPaymentEffect: () => void;
}
const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function DuesSummaryPanel({ selectedLoan, dues, isDuesLoading, onOpenPaymentEffect }: DuesSummaryPanelProps) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  return (
    <div
      className="w-[300px] p-5 shrink-0 overflow-y-auto shadow-[var(--mantine-shadow-lg)]"
      style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
        <Text size="sm" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
          Dues Summary
        </Text>
      </div>

      {selectedLoan ? (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-md p-2.5"
            style={{ background: "var(--mantine-color-slate-1)", border: "1px solid var(--mantine-color-slate-2)" }}
          >
            <Text size="xs" c="dimmed">
              EMI Date
            </Text>
            <Text size="sm" fw={600} c="slate.8">
              {isDuesLoading ? "Loading..." : fmtDate(dues?.due_date)}
            </Text>
          </div>

          <div
            className="rounded-md p-3 flex flex-col gap-2"
            style={{ background: "var(--mantine-color-slate-1)", border: "1px solid var(--mantine-color-slate-2)" }}
          >
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Principal Due
              </Text>
              <Text size="xs" c="slate.6" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatAmount(companyCurrency, dues?.payable_principal_amount ?? 0, { withSymbol: true })}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Interest Due
              </Text>
              <Text size="xs" c="slate.6" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatAmount(companyCurrency, dues?.interest_amount ?? 0, { withSymbol: true })}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Penalty
              </Text>
              <Text size="xs" c="slate.6" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatAmount(companyCurrency, dues?.penalty_amount ?? 0, { withSymbol: true })}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Fees/Charges
              </Text>
              <Text size="xs" c="slate.6" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatAmount(companyCurrency, dues?.total_charges_payable ?? 0, { withSymbol: true })}
              </Text>
            </div>
            <div className="flex justify-between items-center pt-1">
              <Text size="sm" fw={700} c="slate.8">
                Total Amount Due
              </Text>
              <Text size="sm" fw={700} c="slate.8" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatAmount(companyCurrency, dues?.payable_amount ?? 0, { withSymbol: true })}
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
      ) : (
        <Text size="xs" c="dimmed" className="py-8 text-center">
          Select a loan account on the left to view dues.
        </Text>
      )}
    </div>
  );
}