import { Text, useMantineTheme } from "@mantine/core";
import type { LoanWaiverLoanAccount } from "../../../types/loanwaiver";
import { formatCurrency } from "../../../utils/loanwaiverutils";

interface DuesSummaryPanelProps {
  selectedLoan: LoanWaiverLoanAccount | null;
  dues: any;
  isDuesLoading: boolean;
}

export function DuesSummaryPanel({ selectedLoan, dues, isDuesLoading }: DuesSummaryPanelProps) {
  const theme = useMantineTheme();

  return (
    <div className="w-[300px] p-5 shrink-0 overflow-y-auto" style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}>
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
        <Text size="sm" fw={700} c="slate.8">
          Dues Summary
        </Text>
      </div>

      {selectedLoan ? (
        <div className="flex flex-col gap-3 mt-4">
          <div
            className="rounded-md p-2.5"
            style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-1)" }}
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
            style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-1)" }}
          >
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Principal Due
              </Text>
              <Text size="xs" c="slate.6" ff="monospace">
                {formatCurrency(dues?.payable_principal_amount ?? 0)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Interest Due
              </Text>
              <Text size="xs" c="slate.6" ff="monospace">
                {formatCurrency(dues?.interest_amount ?? 0)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Penalty
              </Text>
              <Text size="xs" c="slate.6" ff="monospace">
                {formatCurrency(dues?.penalty_amount ?? 0)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text size="xs" c="dimmed">
                Fees/Charges
              </Text>
              <Text size="xs" c="slate.6" ff="monospace">
                {formatCurrency(dues?.total_charges_payable ?? 0)}
              </Text>
            </div>
            <div style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }} className="my-1" />
            <div className="flex justify-between items-center">
              <Text size="sm" fw={700} c="slate.8">
                Total Amount Due
              </Text>
              <Text size="sm" fw={700} c="slate.8" ff="monospace">
                {formatCurrency(dues?.payable_amount ?? 0)}
              </Text>
            </div>
          </div>
        </div>
      ) : (
        <Text size="xs" c="dimmed" className="py-8 text-center">
          Select a loan account on the left to view dues.
        </Text>
      )}
    </div>
  );
}