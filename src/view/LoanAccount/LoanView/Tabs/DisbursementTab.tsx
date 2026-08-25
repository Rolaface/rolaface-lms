import { Paper, Table, Text, Badge, Pagination, Group } from "@mantine/core";
import { themeTokens, serif } from "../SharedUI";

export function DisbursementTab({ data, meta, page, setPage, onPaginate, renderCurrency }: any) {
  return (
    <Paper
      radius="lg"
      className="overflow-hidden flex flex-col"
      style={{
        border: '1px solid var(--mantine-color-slate-2)',
        boxShadow: 'var(--mantine-shadow-sm)',
        minWidth: 0,   // <-- critical: stops this from refusing to shrink inside its parent flex/grid
        width: '100%',
      }}
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
        <Text fz="lg" fw={600} c="slate.9" style={serif}>Disbursements</Text>
      </div>

      <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Table
          verticalSpacing="sm"
          horizontalSpacing="sm"
          highlightOnHover
          style={{ tableLayout: 'fixed', width: '100%' }}
        >
          <Table.Thead>
            <Table.Tr>
              {[
                ['REFERENCE', '14%', 'left'],
                ['DATE', '10%', 'left'],
                ['METHOD', '10%', 'left'],
                ['ACCOUNT', '20%', 'left'],
                ['SANCTIONED', '18%', 'right'],
                ['DISBURSED', '18%', 'right'],
                ['STATUS', '10%', 'left'],
              ].map(([label, w, align]) => (
                <Table.Th
                  key={label as string}
                  ta={align as any}
                  style={{
                    width: w as string,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((t: any) => (
              <Table.Tr key={t.name}>
                <Table.Td style={{ color: themeTokens.info, wordBreak: 'break-word' }}>
                  <Text fz="sm" c={themeTokens.info} style={{ wordBreak: 'break-word' }}>
                    {t.name}
                  </Text>
                  {t.reference_number && (
                    <Text fz={10} c="dimmed" style={{ wordBreak: 'break-word' }}>
                      {t.reference_number}
                    </Text>
                  )}
                </Table.Td>

                <Table.Td>
                  <Text fz="sm">{t.disbursement_date}</Text>
                </Table.Td>

                <Table.Td>
                  {t.mode_of_payment ? (
                    <Badge size="xs" variant="light" color="slate">
                      {t.mode_of_payment}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </Table.Td>

                <Table.Td>
                  <Text fz="sm" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                    {t.disbursement_account || t.bank_account || '—'}
                  </Text>
                </Table.Td>

                <Table.Td ta="right">
                  <Text fz="xs" c="slate.6" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {renderCurrency(t.sanctioned_loan_amount)}
                  </Text>
                </Table.Td>

                <Table.Td ta="right">
                  <Text fz="xs" fw={600} c="slate.8" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {renderCurrency(t.disbursed_amount)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Badge size="xs" variant="light" color={t.status === "Disbursed" ? "teal" : "orange"}>
                     {t.status === "Submitted" ? "Approved" : t.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-4 text-xs text-[var(--mantine-color-slate-5)]">
                  No disbursements found.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end" p="sm" className="border-t border-[var(--mantine-color-slate-1)]">
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