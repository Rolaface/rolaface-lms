import { Box, Button, Modal, Table, Text, useMantineTheme } from "@mantine/core";
import { IconCreditCard, IconX } from "@tabler/icons-react";
import type { LoanWaiverEffect, LoanWaiverLoanAccount } from "../../../types/loanwaiver";
import { formatCurrency } from "../../../utils/loanwaiverutils";

interface WaiverEffectModalProps {
  opened: boolean;
  onClose: () => void;
  selectedLoan: LoanWaiverLoanAccount | null;
  waiverEffect: LoanWaiverEffect | null;
}

export function WaiverEffectModal({ opened, onClose, selectedLoan, waiverEffect }: WaiverEffectModalProps) {
  const theme = useMantineTheme();

  return (
    <Modal opened={opened} onClose={onClose} size="640px" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl flex items-center justify-center" style={{ background: theme.other.brandGradient }}>
              <IconCreditCard size={20} style={{ color: "var(--mantine-color-white)" }} />
            </div>
            <div>
              <Text size="md" fw={700} c="slate.8" className="leading-tight">
                Payment Effect
              </Text>
              <Text size="xs" c="dimmed">
                Projected impact of this waiver on {selectedLoan?.id ?? "the loan account"}.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="slate" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }} />

        <div className="px-6 py-5">
          {waiverEffect && selectedLoan ? (
            <Table verticalSpacing="sm" horizontalSpacing="md" withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">
                      Component
                    </Text>
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">
                      Before
                    </Text>
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">
                      After
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Total Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {formatCurrency(waiverEffect.totalOutstandingBefore)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7">
                      {formatCurrency(waiverEffect.totalOutstandingAfter)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Principal Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {formatCurrency(waiverEffect.principalOutstandingBefore)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="slate.6">
                      {formatCurrency(waiverEffect.principalOutstandingAfter)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Arrears
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {formatCurrency(waiverEffect.arrearsBefore)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7">
                      {formatCurrency(waiverEffect.arrearsAfter)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Remaining Installments
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {waiverEffect.remainingInstallmentsBefore}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="slate.6">
                      {waiverEffect.remainingInstallmentsAfter}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Interest Payable
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {formatCurrency(waiverEffect.interestPayableBefore)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7">
                      {formatCurrency(waiverEffect.interestPayableAfter)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed" className="py-6 text-center">
              Select a loan account to preview waiver effect.
            </Text>
          )}

          <Text size="xs" c="dimmed" className="mt-4">
            A waiver forgives interest, penalty, and fees only — principal and the remaining
            installment count are unaffected. This is a projection only and does not process
            the transaction.
          </Text>
        </div>

        <div className="p-4 px-6 flex justify-end" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
          <Button size="sm" variant="default" onClick={onClose} className="px-5">
            Close
          </Button>
        </div>
      </Box>
    </Modal>
  );
}