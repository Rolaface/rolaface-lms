import { Paper, Table, Text, Badge, Pagination, Group } from "@mantine/core";
import { brand, serif } from "../SharedUI";

export function DisbursementTab({ data, meta, page, setPage, onPaginate, renderCurrency }: any) {
  return (
    <Paper radius="lg" className="overflow-hidden flex flex-col" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text fz="lg" fw={600} c="gray.9" style={serif}>Disbursements</Text>
      </div>
      
      <div className="overflow-x-auto">
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>REFERENCE</Table.Th>
              <Table.Th>DATE</Table.Th>
              <Table.Th>METHOD</Table.Th>
              <Table.Th>ACCOUNT</Table.Th>
              <Table.Th>SANCTIONED</Table.Th>
              <Table.Th>DISBURSED</Table.Th>
              <Table.Th>STATUS</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((t: any) => (
              <Table.Tr key={t.name}>
                <Table.Td className="font-mono" style={{ color: brand.sky }}>
                  {t.name}
                  {t.reference_number && (
                    <>
                      <br />
                      <Text fz={10} c="dimmed">{t.reference_number}</Text>
                    </>
                  )}
                </Table.Td>
                <Table.Td>{t.disbursement_date}</Table.Td>
                <Table.Td>
                  {t.mode_of_payment ? (
                    <Badge size="xs" variant="light" color="gray">
                      {t.mode_of_payment}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </Table.Td>
                <Table.Td>
                  {t.disbursement_account || t.bank_account || '—'}
                </Table.Td>
                <Table.Td className="font-mono text-slate-600">
                  {renderCurrency(t.sanctioned_loan_amount)}
                </Table.Td>
                <Table.Td className="font-mono font-semibold text-slate-800">
                  {renderCurrency(t.disbursed_amount)}
                </Table.Td>
                <Table.Td>
                  <Badge size="xs" variant="light" color={t.status === "Disbursed" ? "teal" : "orange"}>
                    {t.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-4 text-xs text-gray-500">
                  No disbursements found.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end" p="sm" className="border-t border-gray-100">
          <Pagination 
            value={page} 
            onChange={(v) => { setPage(v); onPaginate(v); }} 
            total={meta.total_pages} 
            size="sm" 
            color="brand" 
            radius="md" 
          />
        </Group>
      )}
    </Paper>
  );
}