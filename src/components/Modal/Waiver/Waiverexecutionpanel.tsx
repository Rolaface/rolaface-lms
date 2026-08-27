import { Box, Badge, NumberInput, Table, Text, TextInput, useMantineTheme, Textarea } from "@mantine/core";
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
  comment: string;
  onCommentChange: (value: string) => void;
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
  comment,
  onCommentChange,
}: WaiverExecutionPanelProps) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  return (
    <div className="relative flex-1 min-w-0 min-h-0 overflow-y-auto p-3">
      <div
  className={`flex h-full flex-col rounded-lg p-3 transition-all duration-300 ${!selectedLoan ? "pointer-events-none select-none opacity-50 blur-[2px]" : ""
    }`}
>
        <div className="flex items-center gap-2 mb-3">
          <IconChecklist size={16} style={{ color: "var(--mantine-color-brand-6)" }} />
          <Text size="sm" fw={700} c="slate.8" className="flex items-center gap-2">
            Executing Waiver for
            <Badge color="slate" variant="light" radius="sm" size="md" ff="monospace">
              {selectedLoan?.id ?? "—"}
            </Badge>
            <Text component="span" c="slate.3" size="sm">
              /
            </Text>
            <Badge color="brand" variant="filled" radius="sm" size="md" className="truncate max-w-[180px]">
              {selectedBorrower?.name ?? "—"}
            </Badge>
          </Text>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
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

        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <Text size="sm" fw={600} c="slate.8">
              Waiver Breakdown
            </Text>
          </div>



          <Box style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
           <Table
  verticalSpacing="md"
  horizontalSpacing="md"
  withRowBorders={true}
  styles={{
    table: {
      borderCollapse: "collapse",
      margin: 0,
    },
  }}
>
              <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase" w="30%">Component</Table.Th>
                  <Table.Th c="slate.5" fz="xs" fw={600} tt="uppercase" w="28%" ta="right">Arrears</Table.Th>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase" w="40%" ta="right">Waived Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  { label: "Interest", dot: "var(--mantine-color-indigo-5)", arrears: dues?.interest_amount ?? 0, value: waivedInterest, onChange: onWaivedInterestChange, max: dues?.interest_amount, type: "Interest Waiver" },
                  { label: "Penalty", dot: "var(--mantine-color-orange-5)", arrears: dues?.penalty_amount ?? 0, value: waivedPenalty, onChange: onWaivedPenaltyChange, max: dues?.penalty_amount, type: "Penalty Waiver" },
                  { label: "Charge / Fee", dot: "var(--mantine-color-teal-5)", arrears: dues?.total_charges_payable ?? 0, value: waivedFee, onChange: onWaivedFeeChange, max: dues?.total_charges_payable, type: "Charges Waiver" },
                ].map((row) => (
                  <Table.Tr key={row.label} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
                    <Table.Td>
                      <Text size="sm" fw={700} c="slate.8">
                        {row.label}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {isDuesLoading ? "…" : formatAmount(companyCurrency, row.arrears, { withSymbol: true })}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <NumberInput
                        hideControls
                        placeholder="0.00"
                        thousandSeparator=","
                        decimalScale={2}
                        min={0}
                        radius="md"
                        max={row.max}
                        disabled={isView || (editId ? editRecordType !== row.type : false)}
                        value={row.value}
                        onChange={(v) => row.onChange(v as number | "")}
                        rightSection={<Text size="xs" fw={600} c="slate.4">{companyCurrency}</Text>}
                        rightSectionWidth={48}
                        styles={{
  root: { maxWidth: "160px", marginLeft: "auto" },
  input: {
    textAlign: "right",
    paddingRight: 40,
    fontWeight: 600,
    backgroundColor: "var(--mantine-color-slate-0)",
    borderColor: "var(--mantine-color-slate-2)",
  },
}}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </div>

        <div className="mt-4 w-2/3">

          <Textarea size="sm" label="Comment"
            placeholder="Add a comment or description..."
            disabled={isView}
            value={comment}
            onChange={(e) => onCommentChange(e.currentTarget.value)}
            minRows={2}
            maxRows={4}
            autosize
            variant={isView ? 'filled' : 'default'}
            leftSection={<IconMessage size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
            leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '10px' } }}
          />
        </div>
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
                className="mt-4 rounded-lg px-4 py-3"
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










