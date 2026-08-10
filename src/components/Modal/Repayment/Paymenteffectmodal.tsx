import { Box, Button, Modal, Table, Text, useMantineTheme } from "@mantine/core";
import { IconArrowsExchange, IconX } from "@tabler/icons-react";
import type { LoanAccount, PaymentEffectResult } from "../../../types/loanRepayment";
import { formatCurrency } from "../../../utils/Loanrepaymentutils";

interface PaymentEffectModalProps {
  opened: boolean;
  onClose: () => void;
  selectedLoan: LoanAccount | null;
  amountToPay: number | "";
  paymentEffect: PaymentEffectResult | null;
}

export function PaymentEffectModal({ opened, onClose, selectedLoan, amountToPay, paymentEffect }: PaymentEffectModalProps) {
  const theme = useMantineTheme();

  const rows: Array<{ label: string; before: number | string; after: number | string; isCount?: boolean }> = paymentEffect
    ? [
        { label: "Total Outstanding", before: paymentEffect.totalOutstandingBefore, after: paymentEffect.totalOutstandingAfter },
        {
          label: "Principal Outstanding",
          before: paymentEffect.principalOutstandingBefore,
          after: paymentEffect.principalOutstandingAfter,
        },
        { label: "Arrears", before: paymentEffect.arrearsBefore, after: paymentEffect.arrearsAfter },
        {
          label: "Remaining Installments",
          before: paymentEffect.remainingInstallmentsBefore,
          after: paymentEffect.remainingInstallmentsAfter,
          isCount: true,
        },
        { label: "Interest Payable", before: paymentEffect.interestPayableBefore, after: paymentEffect.interestPayableAfter },
      ]
    : [];

  return (
    <Modal opened={opened} onClose={onClose} size="640px" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ background: theme.other.brandGradient }}
            >
              <IconArrowsExchange size={20} style={{ color: "var(--mantine-color-white)" }} />
            </div>
            <div>
              <Text size="md" fw={700} c="slate.8" className="leading-tight">
                Payment Effect
              </Text>
              <Text size="xs" c="dimmed">
                Projected impact of {amountToPay ? formatCurrency(Number(amountToPay)) : "this payment"} on{" "}
                {selectedLoan?.id ?? "the loan account"}.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="slate" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }} />

        <div className="px-6 py-5">
          {paymentEffect && selectedLoan ? (
            <Table verticalSpacing="sm" horizontalSpacing="md" withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Component</Table.Th>
                  <Table.Th ta="right">Before</Table.Th>
                  <Table.Th ta="right">After</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, index) => (
                  <Table.Tr
                    key={row.label}
                    style={index % 2 === 0 ? { backgroundColor: "var(--mantine-color-slate-0)" } : undefined}
                  >
                    <Table.Td>
                      <Text size="sm" fw={600} c="slate.8">
                        {row.label}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" ff="monospace" c="slate.6">
                        {row.isCount ? row.before : formatCurrency(Number(row.before))}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" fw={600} ff="monospace" c="success.7">
                        {row.isCount ? row.after : formatCurrency(Number(row.after))}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed" className="py-6 text-center">
              Select a loan account to preview payment effect.
            </Text>
          )}

          <Text size="xs" c="dimmed" className="mt-4">
            Payment is applied in order: penalty → fees → interest → principal. This is a projection only and does
            not process the transaction.
          </Text>
        </div>

        <div style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }} />

        <div className="p-4 px-6 flex justify-end">
          <Button size="sm" variant="default" onClick={onClose} className="px-5">
            Close
          </Button>
        </div>
      </Box>
    </Modal>
  );
}