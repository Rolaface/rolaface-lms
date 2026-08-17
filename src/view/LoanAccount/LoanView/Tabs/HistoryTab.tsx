import { Paper, Table, Text, Badge, Pagination, Group } from "@mantine/core";
import { brand, serif } from "../SharedUI";

export function HistoryTab({ data, meta, page, setPage, onPaginate, renderCurrency, hidePagination }: any) {
  return (
    <Paper radius="lg" className="overflow-hidden flex flex-col" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text fz="lg" fw={600} c="gray.9" style={serif}>Repayment history</Text>
      </div>
      <div className="overflow-x-auto">
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Receipt</Table.Th>
              <Table.Th>Payment Date</Table.Th>
              <Table.Th>Method</Table.Th>
              <Table.Th>Principal</Table.Th>
              <Table.Th>Interest</Table.Th>
              <Table.Th>Penalty</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Balance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((r: any) => (
              <Table.Tr key={r.name}>
                <Table.Td className="font-mono" style={{ color: brand.sky }}>{r.name}</Table.Td>
                <Table.Td>{r.posting_date}</Table.Td>
                <Table.Td><Badge size="xs" variant="light" color="gray">{r.mode_of_payment}</Badge></Table.Td>
                <Table.Td className="font-mono">{renderCurrency(r.principal_amount_paid)}</Table.Td>
                <Table.Td className="font-mono">{renderCurrency(r.total_interest_paid)}</Table.Td>
                <Table.Td className="font-mono">{renderCurrency(r.total_penalty_paid)}</Table.Td>
                <Table.Td className="font-mono font-semibold">{renderCurrency(r.amount_paid)}</Table.Td>
                <Table.Td className="font-mono">{renderCurrency(r.pending_principal_amount)}</Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && <Table.Tr><Table.Td colSpan={8} className="text-center py-4 text-xs text-gray-500">No repayment history.</Table.Td></Table.Tr>}
          </Table.Tbody>
        </Table>
      </div>
      {!hidePagination && meta && meta.total_pages > 1 && (
        <Group justify="flex-end" p="sm" className="border-t border-gray-100">
          <Pagination value={page} onChange={(v) => { setPage(v); onPaginate(v); }} total={meta.total_pages} size="sm" color="brand" radius="md" />
        </Group>
      )}
    </Paper>
  );
}