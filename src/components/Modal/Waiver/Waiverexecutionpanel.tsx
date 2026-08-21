import { Badge, NumberInput, Table, Text, TextInput, useMantineTheme } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChecklist,
  IconMessage,
  IconPercentage,
  IconNotes,
} from "@tabler/icons-react";
import type { LoanWaiverBorrower, LoanWaiverLoanAccount } from "../../../types/loanwaiver";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

interface WaiverExecutionPanelProps {
  selectedLoan: LoanWaiverLoanAccount | null;
  selectedBorrower: LoanWaiverBorrower | null;
  isView?: boolean;
  editId?: string | null;
  editRecordType: string | null;
  valueDate: string;
  onValueDateChange: (value: string) => void;
  dues: any;
  isDuesLoading: boolean;
  waivedInterest: number | "";
  waivedPenalty: number | "";
  waivedFee: number | "";
  onWaivedInterestChange: (value: number | "") => void;
  onWaivedPenaltyChange: (value: number | "") => void;
  onWaivedFeeChange: (value: number | "") => void;
  remark: string;
  onRemarkChange: (value: string) => void;
}

export function WaiverExecutionPanel({
  selectedLoan,
  selectedBorrower,
  isView,
  editId,
  editRecordType,
  valueDate,
  onValueDateChange,
  dues,
  isDuesLoading,
  waivedInterest,
  waivedPenalty,
  waivedFee,
  onWaivedInterestChange,
  onWaivedPenaltyChange,
  onWaivedFeeChange,
  remark,
  onRemarkChange,
}: WaiverExecutionPanelProps) {
  const theme = useMantineTheme();
    const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  return (
    <div className="relative flex-1 overflow-y-auto p-6">
      <div
        className={`flex h-full flex-col rounded-lg p-4 transition-all duration-300 ${!selectedLoan ? "pointer-events-none select-none opacity-50 blur-[2px]" : ""
          }`}
        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <IconChecklist size={16} style={{ color: "var(--mantine-color-brand-6)" }} />
          <Text size="sm" fw={700} c="slate.8" className="flex items-center gap-2">
            Executing Waiver for
            <Badge color="brand" variant="light" radius="sm" size="md">
              {selectedLoan?.id ?? "—"}
            </Badge>
            <Text component="span" c="slate.4">
              /
            </Text>
            <Badge color="accent" variant="light" radius="sm" size="md">
              {selectedBorrower?.name ?? "—"}
            </Badge>
          </Text>
        </div>

        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          <TextInput
            size="sm"
            withAsterisk
            type="date"
            label="Value Date"
            disabled={isView}
            value={valueDate}
            onChange={(e) => onValueDateChange(e.currentTarget.value)}
            leftSection={<IconCalendarDue size={14} style={{ color: "var(--mantine-color-success-6)" }} />}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <Text size="sm" fw={600} c="slate.8">
              Waiver Breakdown
            </Text>
          </div>

          <Table
            withTableBorder
            withColumnBorders
            highlightOnHover
            verticalSpacing="sm"
            styles={{
              table: {
                width: "100%",
                tableLayout: "fixed",
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: "30%" }}>Component</Table.Th>
                <Table.Th style={{ width: "30%", textAlign: "right" }}>Arrears</Table.Th>
                <Table.Th style={{ width: "40%", textAlign: "right" }}>Waived Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <IconPercentage size={14} style={{ color: "var(--mantine-color-brand-6)" }} />
                    <Text size="sm" c="slate.7">
                      Interest
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
  {isDuesLoading ? "..." : formatAmount(companyCurrency, dues?.interest_amount ?? 0, { withSymbol: true })}
</Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    hideControls
                    placeholder="0.00"
                    thousandSeparator=","
                    decimalScale={2}
                    min={0}
                    max={dues?.interest_amount}
                    disabled={isView || (editId ? editRecordType !== "Interest Waiver" : false)}
                    value={waivedInterest}
                    onChange={(v) => onWaivedInterestChange(v as number | "")}
                  />
                </Table.Td>
              </Table.Tr>
              <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle size={14} style={{ color: "var(--mantine-color-warning-6)" }} />
                    <Text size="sm" c="slate.7">
                      Penalty
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                 <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
  {isDuesLoading ? "..." : formatAmount(companyCurrency, dues?.penalty_amount ?? 0, { withSymbol: true })}
</Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    hideControls
                    placeholder="0.00"
                    thousandSeparator=","
                    decimalScale={2}
                    min={0}
                    max={dues?.penalty_amount}
                    disabled={isView || (editId ? editRecordType !== "Penalty Waiver" : false)}
                    value={waivedPenalty}
                    onChange={(v) => onWaivedPenaltyChange(v as number | "")}
                  />
                </Table.Td>
              </Table.Tr>
              <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <IconNotes size={14} style={{ color: "var(--mantine-color-accent-6)" }} />
                    <Text size="sm" c="slate.7">
                      Charge / Fee
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
  {isDuesLoading ? "..." : formatAmount(companyCurrency, dues?.total_charges_payable ?? 0, { withSymbol: true })}
</Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    hideControls
                    placeholder="0.00"
                    thousandSeparator=","
                    decimalScale={2}
                    min={0}
                    max={dues?.total_charges_payable}
                    disabled={isView || (editId ? editRecordType !== "Charges Waiver" : false)}
                    value={waivedFee}
                    onChange={(v) => onWaivedFeeChange(v as number | "")}
                  />
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>

        <TextInput
          size="sm"
          label="Remark"
          placeholder="Add a note about this waiver (optional)"
          disabled={isView}
          value={remark}
          onChange={(e) => onRemarkChange(e.currentTarget.value)}
          leftSection={<IconMessage size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
          className="mt-4"
        />
      </div>

      {!selectedLoan && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[3px]"
          style={{ background: "color-mix(in srgb, var(--mantine-color-white) 55%, transparent)" }}
        >
          <div
            className="w-[440px] rounded-2xl"
            style={{
              border: "1px solid var(--mantine-color-brand-1)",
              background: "var(--mantine-color-white)",
              boxShadow: "var(--mantine-shadow-xl)",
            }}
          >
            <div className="flex justify-center pt-8">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: theme.other.softBrandGradient,
                  boxShadow: "0 0 0 1px var(--mantine-color-brand-2)",
                }}
              >
                <IconChecklist size={30} style={{ color: "var(--mantine-color-brand-7)" }} />
              </div>
            </div>

            <div className="px-8 py-6 text-center">
              <Text size="xl" fw={700} c="slate.8">
                No Loan Account Selected
              </Text>

              <Text size="sm" c="dimmed" className="mt-3 leading-6">
                To proceed with a waiver transaction, first search for a borrower and select one of their
                active loan accounts from the panel on the left.
              </Text>

              <div
                className="mt-6 rounded-lg px-4 py-3"
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  background: "var(--mantine-color-slate-0)",
                }}
              >
                <Text size="xs" fw={600} c="brand.6" className="uppercase tracking-wide">
                  Next Step
                </Text>
                <Text size="sm" c="slate.6" className="mt-1">
                  Select a borrower → Choose a loan account → Process waiver
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}