import { Paper, Group, Title, Loader, Alert, Table, Text, Badge, ActionIcon, Tooltip, Pagination, Select } from "@mantine/core";
import { IconAlertCircle, IconSelector, IconEye, IconChevronDown } from "@tabler/icons-react";

const cv = (name: string, shade: number) => `var(--mantine-color-${name}-${shade})`;

const BUCKET_BADGE: Record<string, { bg: string; color: string }> = {
  "1 - 30 Days": { bg: cv("brand", 0), color: cv("brand", 7) },
  "31 - 60 Days": { bg: cv("gold", 0), color: cv("gold", 7) },
  "61 - 90 Days": { bg: cv("accent", 0), color: cv("accent", 7) },
  "91 - 180 Days": { bg: cv("indigoAlt", 0), color: cv("indigoAlt", 7) },
  "> 180 Days": { bg: cv("danger", 0), color: cv("danger", 7) },
  "Current": { bg: cv("gray", 1), color: cv("gray", 7) },
};

export function ArrearTable({ topAccounts, paginationState, paginationMeta, loadingTable, renderCurrency }: any) {
  return (
    <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden relative">
      {loadingTable && (
        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
          <Loader size="md" color="blue" />
        </div>
      )}

      <Group p="sm" className="border-b border-slate-100">
        <Title order={5} className="text-slate-900">Top Overdue Accounts</Title>
      </Group>
      
      <div className="overflow-x-auto min-h-[250px]">
        {!Array.isArray(topAccounts) || topAccounts.length === 0 ? (
          <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />} m="md">
            No overdue accounts match the selected criteria.
          </Alert>
        ) : (
          <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
            <Table.Thead>
              <Table.Tr className="text-slate-400">
                <Table.Th><Text size="12px" fw={600} c="dimmed">Loan Account</Text></Table.Th>
                <Table.Th><Text size="12px" fw={600} c="dimmed">Customer Name</Text></Table.Th>
                <Table.Th><Text size="12px" fw={600} c="dimmed">Branch</Text></Table.Th>
                <Table.Th><Group gap={4}><Text size="12px" fw={600} c="dimmed">Days Past Due</Text><IconSelector size={13} className="text-slate-300" /></Group></Table.Th>
                <Table.Th><Text size="12px" fw={600} c="dimmed">Arrear Bucket</Text></Table.Th>
                <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Overdue Amount</Text></Table.Th>
                <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Overdue EMI</Text></Table.Th>
                <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Total Overdue</Text></Table.Th>
                <Table.Th ta="right"><Text size="12px" fw={600} c="dimmed">Action</Text></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topAccounts.map((r: any) => {
                const b = BUCKET_BADGE[r.arrear_bucket] || { bg: cv("gray", 1), color: cv("gray", 7) };
                return (
                  <Table.Tr key={r.loan_account}>
                    <Table.Td fw={600} className="text-slate-700">{r.loan_account}</Table.Td>
                    <Table.Td className="text-slate-700">{r.customer_name}</Table.Td>
                    <Table.Td className="text-slate-500">{r.branch}</Table.Td>
                    <Table.Td className="text-slate-600">{r.days_past_due}</Table.Td>
                    <Table.Td><Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color, textTransform: "none" }}>{r.arrear_bucket}</Badge></Table.Td>
                    <Table.Td ta="right" className="text-slate-600">{renderCurrency(r.overdue_amount)}</Table.Td>
                    <Table.Td ta="right" className="text-slate-600">{renderCurrency(r.overdue_emi)}</Table.Td>
                    <Table.Td ta="right" fw={700} className="text-slate-800">{renderCurrency(r.total_outstanding)}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end">
                        <Tooltip label="View"><ActionIcon variant="subtle" color="gray" size="sm"><IconEye size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </div>
      
      <Group justify="space-between" p="sm" className="border-t border-slate-100">
        <Text size="12px" c="dimmed">
          Showing {paginationMeta?.total === 0 ? 0 : (paginationState.page - 1) * paginationState.pageSize + 1} to {Math.min(paginationMeta?.total || 0, paginationState.page * paginationState.pageSize)} of {paginationMeta?.total || 0} entries
        </Text>
        <Group gap={12}>
          <Pagination 
            total={paginationMeta?.total_pages || 1} 
            value={paginationState.page} 
            onChange={paginationState.setPage} 
            color="brand" size="sm" radius="md" disabled={loadingTable}
          />
          <Select 
            data={[{ value: "5", label: "5 / page" }, { value: "10", label: "10 / page" }, { value: "25", label: "25 / page" }]} 
            value={String(paginationState.pageSize)} 
            onChange={(v) => {
              if (v) {
                paginationState.setPageSize(Number(v));
                paginationState.setPage(1);
              }
            }}
            classNames={{ input: "h-8 text-[12px] w-28 rounded-lg border-slate-200" }} 
            rightSection={<IconChevronDown size={12} className="text-slate-400" />} 
            disabled={loadingTable}
          />
        </Group>
      </Group>
    </Paper>
  );
}