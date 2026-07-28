import { Text, Table } from "@mantine/core";
import type {AmortizationRow}  from "../../../utils/loanCalculations";

interface RepaymentScheduleTabProps {
  amortization: AmortizationRow[];
} 

export function RepaymentScheduleTab({ amortization }: RepaymentScheduleTabProps) {
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
              {amortization.length === 0 ? (
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
      {amortization.length > 0 && (
        <Text size="xs" c="dimmed">
          Schedule regenerates automatically once Basic Details are complete.
        </Text>
      )}
    </div>
  );
}