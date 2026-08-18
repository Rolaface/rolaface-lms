import { Paper, Table, Text, Group, Pagination } from "@mantine/core";
import { IconWallet } from "@tabler/icons-react";
import { serif } from "../SharedUI";

export function AccountingTab({ data, meta, page, setPage, onPaginate, renderCurrency }: any) {
  return (
    <div className="flex flex-col gap-4">
      <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}>
        <div className="px-4 py-3 border-b border-[var(--mantine-color-slate-1)] flex items-center gap-2">
          <IconWallet size={15} className="text-[var(--mantine-color-slate-5)]" />
          <Text fz="lg" fw={600} c="slate.9" style={serif}>Ledger entries</Text>
        </div>
        <div className="overflow-x-auto">
          <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Debit</Table.Th>
                <Table.Th>Credit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row: any, i: number) => (
                <Table.Tr key={`${row.description}-${i}`}>
                  <Table.Td>{row.posting_date}</Table.Td>
                  <Table.Td>
                    <Text fz="sm" fw={500}>{row.description}</Text>
                    <Text fz="xs" c="dimmed">{row.voucher_type}</Text>
                  </Table.Td>
                  <Table.Td>{row.account}</Table.Td>
                  <Table.Td className="font-mono">{row.debit > 0 ? renderCurrency(row.debit) : '—'}</Table.Td>
                  <Table.Td className="font-mono">{row.credit > 0 ? renderCurrency(row.credit) : '—'}</Table.Td>
                </Table.Tr>
              ))}
              {data.length === 0 && <Table.Tr><Table.Td colSpan={5} className="text-center py-4 text-[var(--mantine-color-slate-5)] text-xs">No accounting entries found.</Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end">
          <Pagination value={page} onChange={(v) => { setPage(v); onPaginate(v); }} total={meta.total_pages} size="sm" color="brand" radius="md" />
        </Group>
      )}
    </div>
  );
}