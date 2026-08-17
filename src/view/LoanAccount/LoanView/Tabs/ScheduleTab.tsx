import { Paper, Table, Text, Badge, Loader } from "@mantine/core";
import { brand, serif } from "../SharedUI";

export function ScheduleTab({ data, renderCurrency }: any) {
  const { schedule } = data;

  if (!schedule) {
    return (
      <Paper radius="lg" p="xl" style={{ border: '1px solid #ECE8DD' }} className="flex justify-center">
        <Loader size="sm" color="gray" />
      </Paper>
    );
  }

  const scheduleRows = schedule.repayment_schedule || [];

  return (
    <div className="flex flex-col gap-4">
      <Paper radius="lg" className="overflow-hidden flex flex-col" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <div>
            <Text fz="lg" fw={600} c="gray.9" style={serif}>Repayment Schedule</Text>
            <Text fz="xs" c="dimmed">Reference: {schedule.name}</Text>
          </div>
          <Badge size="sm" variant="light" color="blue">
            Rate: {schedule.rate_of_interest}%
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>PAYMENT DATE</Table.Th>
                <Table.Th>PRINCIPAL</Table.Th>
                <Table.Th>INTEREST</Table.Th>
                <Table.Th>TOTAL PAYMENT</Table.Th>
                <Table.Th>BALANCE</Table.Th>
                <Table.Th>STATUS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {scheduleRows.map((row: any) => (
                <Table.Tr key={row.idx}>
                  <Table.Td className="font-mono text-slate-500">{row.idx}</Table.Td>
                  <Table.Td>{row.payment_date}</Table.Td>
                  <Table.Td className="font-mono">{renderCurrency(row.principal_amount)}</Table.Td>
                  <Table.Td className="font-mono">{renderCurrency(row.interest_amount)}</Table.Td>
                  <Table.Td className="font-mono font-semibold text-slate-800">
                    {renderCurrency(row.total_payment)}
                  </Table.Td>
                  <Table.Td className="font-mono text-slate-600">
                    {renderCurrency(row.balance_loan_amount)}
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      size="xs" 
                      variant="light" 
                      color={
                        row.ui_status === "Paid" ? "teal" : 
                        row.ui_status === "Partially Paid" ? "yellow" :
                        row.ui_status === "Overdue" ? "red" : "gray"
                      }
                    >
                      {row.ui_status || "Upcoming"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
              {scheduleRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-4 text-xs text-gray-500">
                    No schedule generated.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </div>
  );
}