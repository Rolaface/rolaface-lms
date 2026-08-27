import { Box, Button, Modal, Table, Text, useMantineTheme } from "@mantine/core";
import { IconCreditCard, IconX } from "@tabler/icons-react";
import type { LoanWaiverEffect, LoanWaiverLoanAccount } from "../../../types/loanwaiver";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

interface WaiverEffectModalProps {
  opened: boolean;
  onClose: () => void;
  selectedLoan: LoanWaiverLoanAccount | null;
  waiverEffect: LoanWaiverEffect | null;
}

export function WaiverEffectModal({ opened, onClose, selectedLoan, waiverEffect }: WaiverEffectModalProps) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  return (
    <Modal opened={opened} onClose={onClose} size={800} zIndex={1000} withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl flex items-center justify-center" style={{ background: theme.other.brandGradient }}>
              <IconCreditCard size={20} style={{ color: "var(--mantine-color-white)" }} />
            </div>
            <div>
              <Text size="md" fw={700} c="slate.8" className="leading-tight">
                Waiver Effect
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
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">HEAD</Text>
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">
                      Before
                    </Text>
                  </Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>
                    <Text size="xs" fw={600} c="slate.5" className="uppercase tracking-wide">
                      Waived
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
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Interest Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.interestOutstandingBefore, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.interestOutstandingBefore - waiverEffect.interestOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.interestOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Penalty Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.penaltyOutstandingBefore, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.penaltyOutstandingBefore - waiverEffect.penaltyOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.penaltyOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Charges Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.chargesOutstandingBefore, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.chargesOutstandingBefore - waiverEffect.chargesOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.chargesOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Total Outstanding
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.totalOutstandingBefore, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.totalOutstandingBefore - waiverEffect.totalOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.totalOutstandingAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Arrears
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.arrearsBefore, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.arrearsBefore - waiverEffect.arrearsAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatAmount(companyCurrency, waiverEffect.arrearsAfter, { withSymbol: true })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">
                      Installment Remaining
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" ff="monospace" c="slate.6">
                      {waiverEffect.remainingInstallmentsBefore}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="brand.6">
                      {waiverEffect.remainingInstallmentsBefore - waiverEffect.remainingInstallmentsAfter}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600} ff="monospace" c="slate.6">
                      {waiverEffect.remainingInstallmentsAfter}
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