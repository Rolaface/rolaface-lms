import { Text, Table } from "@mantine/core";
import type { AmortizationRow } from "../../../utils/loanCalculations";

interface FetchedScheduleRow {
  no: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
}

interface RepaymentScheduleTabProps {
  amortization: AmortizationRow[];
  repaymentSchedule?: FetchedScheduleRow[];
  isFetchingSchedule?: boolean;
  isEditMode?: boolean;
}

export function RepaymentScheduleTab({
  amortization,
  repaymentSchedule = [],
  isFetchingSchedule,
  isEditMode,
}: RepaymentScheduleTabProps) {
  const useFetched = repaymentSchedule.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" fz="xs">
            <Table.Thead className="bg-slate-50">
              <Table.Tr>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                  Installment Number
                </Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">Date</Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                  Beginning Bal.
                </Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                  Principal
                </Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                  Interest
                </Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">EMI</Table.Th>
                <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                  Ending Bal.
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isFetchingSchedule ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
                    Loading schedule...
                  </Table.Td>
                </Table.Tr>
              ) : useFetched ? (
                repaymentSchedule.map((row) => (
                  <Table.Tr key={row.no}>
                    <Table.Td>{row.no}</Table.Td>
                    <Table.Td>{row.payment_date}</Table.Td>
                    <Table.Td className="font-mono">
                      {(row.balance_loan_amount + row.principal_amount).toFixed(2)}
                    </Table.Td>
                    <Table.Td className="font-mono">{row.principal_amount.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.interest_amount.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.total_payment.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.balance_loan_amount.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))
            ) : isEditMode ? (
  <Table.Tr>
    <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
      No schedules are being generated for this loan yet.
    </Table.Td>
  </Table.Tr>
) : amortization.length === 0 ? (
  <Table.Tr>
    <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
      Schedule regenerates automatically once Basic Details are complete.
    </Table.Td>
  </Table.Tr>
) : (
                amortization.map((row) => (
                  <Table.Tr key={row.inst}>
                    <Table.Td>{row.inst}</Table.Td>
                    <Table.Td>{row.date}</Table.Td>
                    <Table.Td className="font-mono">{row.beginning.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.principal.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.interest.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.emi.toFixed(2)}</Table.Td>
                    <Table.Td className="font-mono">{row.ending.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
      {!useFetched && amortization.length > 0 && (
        <Text size="xs" c="dimmed">
          Schedule regenerates automatically once Basic Details are complete.
        </Text>
      )}
    </div>
  );
}