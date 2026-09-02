import { Box, Table, Text, Badge, Pagination, Group } from "@mantine/core";
import { IconFilter, IconCalendarDue, IconPercentage, IconAlertTriangle, IconCalendarEvent, IconInfoCircle } from "@tabler/icons-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { LoanScheduleInfo, RepaymentScheduleRow } from "../../../types/Report/repaymentSchedule";

interface ScheduleTabContentProps {
  info: LoanScheduleInfo | null;
  paginatedRows: RepaymentScheduleRow[];
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  pageSize: number;
  fromDate: Date | string | null;
  toDate: Date | string | null;
}

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—";

const formatAmount = (currency: string, val: number, opts?: { withSymbol?: boolean }) => {
  const num = val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return opts?.withSymbol ? `${currency} ${num}` : num;
};

const STATUS_COLORS: Record<string, string> = {
  Paid: "teal",
  Pending: "yellow",
  Upcoming: "blue",
  Overdue: "red",
  "Partially Paid": "orange",
};

const PIE_COLORS = ["#4C6EF5", "#40C057", "#FA5252", "#FD7E14"];

export function ScheduleTabContent({
  info,
  paginatedRows,
  page,
  setPage,
  totalPages,
  pageSize,
}: ScheduleTabContentProps) {
  if (!info) return null;

  const { summary, interest_rate_history, penalty_rate_history } = info;
  const currency = info.currency;

  const pieData = [
    { name: "Principal", value: summary.total_principal, pct: summary.total_payable ? ((summary.total_principal / summary.total_payable) * 100).toFixed(1) : "0" },
    { name: "Interest", value: summary.total_interest, pct: summary.total_payable ? ((summary.total_interest / summary.total_payable) * 100).toFixed(1) : "0" },
    { name: "Penalty", value: summary.total_penalty, pct: summary.total_payable ? ((summary.total_penalty / summary.total_payable) * 100).toFixed(1) : "0" },
    { name: "Charges", value: summary.total_charges, pct: summary.total_payable ? ((summary.total_charges / summary.total_payable) * 100).toFixed(1) : "0" },
  ];

  return (
    <div className="flex items-stretch gap-3 w-full h-full">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        
        {/* Rate History Row */}
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Interest Rate History */}
          <Box className="rounded-lg p-3" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
            <Group gap={8} mb="sm">
              <Box style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--mantine-color-green-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconPercentage size={16} color="var(--mantine-color-green-6)" />
              </Box>
              <Text size="sm" fw={700} c="slate.8">Interest Rate History</Text>
            </Group>
            <Table verticalSpacing="xs" horizontalSpacing="sm" withRowBorders={false}>
              <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr>
                  <Table.Th c="slate.5" fz="11px" tt="uppercase">Effective From</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" tt="uppercase">Interest Rate (% p.a.)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {interest_rate_history.map((entry, i) => (
                  <Table.Tr
                    key={i}
                    style={i === interest_rate_history.length - 1 ? { background: "var(--mantine-color-green-0)" } : undefined}
                  >
                    <Table.Td style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7">{fmtDate(entry.effective_from)}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" fw={600} c="slate.8">{entry.rate.toFixed(2)}%</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {interest_rate_history.length > 0 && (
              <Text size="xs" c="dimmed" mt="xs">
                <IconCalendarDue size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Latest rate is effective from {fmtDate(interest_rate_history[interest_rate_history.length - 1].effective_from)}
              </Text>
            )}
          </Box>

          {/* Penalty Rate History */}
          <Box className="rounded-lg p-3" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
            <Group gap={8} mb="sm">
              <Box style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--mantine-color-red-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
              </Box>
              <Text size="sm" fw={700} c="slate.8">Penalty Rate History</Text>
            </Group>
            <Table verticalSpacing="xs" horizontalSpacing="sm" withRowBorders={false}>
              <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr>
                  <Table.Th c="slate.5" fz="11px" tt="uppercase">Effective From</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" tt="uppercase">Penalty Rate (% p.a.)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {penalty_rate_history.map((entry, i) => (
                  <Table.Tr
                    key={i}
                    style={i === penalty_rate_history.length - 1 ? { background: "var(--mantine-color-red-1)" } : undefined}
                  >
                    <Table.Td style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7">{fmtDate(entry.effective_from)}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" fw={600} c="slate.8">{entry.rate.toFixed(2)}%</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {penalty_rate_history.length > 0 && (
              <Text size="xs" c="dimmed" mt="xs">
                <IconCalendarDue size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Latest penalty rate is effective from {fmtDate(penalty_rate_history[penalty_rate_history.length - 1].effective_from)}
              </Text>
            )}
          </Box>
        </div>

        {/* Installment Table */}
        <Box className="rounded-lg flex-1 flex flex-col overflow-hidden" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
          <div className="overflow-x-auto flex-1">
            <Table verticalSpacing="sm" horizontalSpacing="sm" highlightOnHover>
              <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr>
                  <Table.Th c="slate.5" fz="11px" style={{ whiteSpace: "nowrap" }}>#</Table.Th>
                  <Table.Th c="slate.5" fz="11px" style={{ whiteSpace: "nowrap" }}>Due Date</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>EMI Amount</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Principal</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Interest</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Penalty</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Charges</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Total Payment</Table.Th>
                  <Table.Th c="slate.5" fz="11px" ta="right" style={{ whiteSpace: "nowrap" }}>Outstanding Balance</Table.Th>
                  <Table.Th c="slate.5" fz="11px" style={{ whiteSpace: "nowrap" }}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedRows.map((row) => (
                  <Table.Tr key={row.idx}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.5" ff="monospace">{row.idx}</Text></Table.Td>
                    <Table.Td style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7">{fmtDate(row.payment_date)}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7" ff="monospace">{formatAmount(currency, row.emi_amount, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7" ff="monospace">{formatAmount(currency, row.principal_amount, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7" ff="monospace">{formatAmount(currency, row.interest_amount, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
                        <Text size="12px" c={row.penalty_amount > 0 ? "red.6" : "slate.7"} fw={row.penalty_amount > 0 ? 600 : 400} ff="monospace">
                        {formatAmount(currency, row.penalty_amount, { withSymbol: true })}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.7" ff="monospace">{formatAmount(currency, row.charges, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" fw={600} c="slate.8" ff="monospace">{formatAmount(currency, row.total_payment, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}><Text size="12px" c="slate.6" ff="monospace">{formatAmount(currency, row.balance_loan_amount, { withSymbol: true })}</Text></Table.Td>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      <Badge size="xs" variant="light" color={STATUS_COLORS[row.ui_status] || "gray"}>
                        {row.ui_status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {paginatedRows.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={10} className="text-center py-6">
                        <Text size="12px" c="dimmed">No installments found.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Pagination */}
          <Group justify="space-between" p="md" style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
            <Text size="xs" c="slate.5">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, info.repayment_schedule.length)} of {info.repayment_schedule.length} installments
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        </Box>
      </div>

      {/* Right Column: Schedule Summary */}
      <Box className="w-[260px] shrink-0 rounded-lg p-3" style={{ border: "1px solid var(--mantine-color-slate-2)", background: "white" }}>
        <Group gap={8} mb="sm">
          <Box style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--mantine-color-violet-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCalendarEvent size={16} color="var(--mantine-color-violet-6)" />
          </Box>
          <Text size="sm" fw={700} c="slate.8">Schedule Summary</Text>
        </Group>

        <div className="space-y-2 mb-4 mt-4">
          {[
            ["Total Installments", summary.total_installments],
            ["Paid Installments", summary.paid_installments],
            ["Pending Installments", summary.pending_installments],
            ["Upcoming Installments", summary.upcoming_installments],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between">
              <Text size="sm" c="slate.6">{label}</Text>
              <Text size="sm" fw={600} c="slate.8">{val}</Text>
            </div>
          ))}
        </div>

        <Text size="sm" fw={700} c="slate.8" mb={3} mt="md">Amount Summary</Text>
        <div className="space-y-2 mb-3">
          {[
            ["Total Principal", summary.total_principal],
            ["Total Interest", summary.total_interest],
            ["Total Penalty", summary.total_penalty],
            ["Total Charges", summary.total_charges],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between">
              <Text size="sm" c="slate.6">{label}</Text>
              <Text size="sm" fw={600} c="slate.8" ff="monospace">{formatAmount(currency, val as number, { withSymbol: true })}</Text>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-3 pb-3 my-2" style={{ borderTop: "1px solid var(--mantine-color-slate-2)", borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
          <Text size="sm" fw={700} c="violet.7">Total Payable</Text>
          <Text size="sm" fw={700} c="violet.7" ff="monospace">{formatAmount(currency, summary.total_payable, { withSymbol: true })}</Text>
        </div>

        {/* Pie Chart */}
        <Text size="sm" fw={600} c="slate.7" mt="md" mb={4}>Breakup <Text span size="xs" fw={400} c="slate.5">(% of Total Payable)</Text></Text>
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatAmount(currency, v, { withSymbol: true })} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <Group gap={6}>
                  <Box style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                  <Text size="xs" c="slate.6">{d.name}</Text>
                </Group>
                <Text size="xs" fw={600} c="slate.8">{d.pct}%</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <Box mt="xl">
          <Group gap={6} mb={4}>
            <IconInfoCircle size={14} color="var(--mantine-color-violet-6)" />
            <Text size="sm" fw={600} c="violet.7">Note</Text>
          </Group>
          <Text size="xs" c="slate.5" lh={1.6}>
            This schedule is based on {info.interest_method?.toLowerCase() || "reducing balance"} method.<br />
            Interest rate: {info.rate_of_interest}% p.a. | EMI frequency: {info.frequency}
          </Text>
        </Box>
      </Box>
    </div>
  );
}
