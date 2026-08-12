import { Text, Table, Paper, Loader } from "@mantine/core";
import { IconCalendarStats } from "@tabler/icons-react";

interface FetchedScheduleRow {
  no: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
}

interface RepaymentScheduleTabProps {
  repaymentSchedule?: FetchedScheduleRow[];
  isFetchingSchedule?: boolean;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={7} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <IconCalendarStats size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
          <Text size="xs" c="slate.4">
            {children}
          </Text>
        </div>
      </Table.Td>
    </Table.Tr>
  );
}

export function RepaymentScheduleTab({
  repaymentSchedule = [],
  isFetchingSchedule,
}: RepaymentScheduleTabProps) {
  const useFetched = repaymentSchedule.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <Paper withBorder radius="lg" shadow="xs" style={{ overflow: "hidden" }}>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Installment Number</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Beginning Bal.</Table.Th>
                <Table.Th>Principal</Table.Th>
                <Table.Th>Interest</Table.Th>
                <Table.Th>EMI</Table.Th>
                <Table.Th>Ending Bal.</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isFetchingSchedule ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader size="xs" color="brand" />
                      <Text size="xs" c="slate.4">
                        Loading schedule...
                      </Text>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : useFetched ? (
                repaymentSchedule.map((row) => (
                  <Table.Tr key={row.no}>
                    <Table.Td>{row.no}</Table.Td>
                    <Table.Td>{row.payment_date}</Table.Td>
                    <Table.Td ff="monospace">
                      {(row.balance_loan_amount + row.principal_amount).toFixed(2)}
                    </Table.Td>
                    <Table.Td ff="monospace">{row.principal_amount.toFixed(2)}</Table.Td>
                    <Table.Td ff="monospace">{row.interest_amount.toFixed(2)}</Table.Td>
                    <Table.Td ff="monospace">{row.total_payment.toFixed(2)}</Table.Td>
                    <Table.Td ff="monospace">{row.balance_loan_amount.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <EmptyState>No schedule available for this loan yet.</EmptyState>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        </div>
      </Paper>
    </div>
  );
}