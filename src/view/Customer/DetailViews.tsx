import { useMemo, useState } from 'react';
import { Badge, Button, Paper, Table, Tabs, Text } from '@mantine/core';
import { IconBell, IconRefreshDot, IconWallet } from '@tabler/icons-react';
import type { AccountDetailData, BorrowerProfile, LoanSummary } from '../../types/customerview';
import { brand, formatK, getLoanDetail, scheduleStatusColor, serif } from './mockdata';
import {
  AccountingTable,
  ActivityFeed,
  CollateralSection,
  DocumentCard,
  DocumentStatusPanel,
  OverviewField,
  QuickLogPanel,
  RepaymentHistoryTable,
  RepaymentSchedule,
  RiskSnapshotPanel,
  SectionHeading,
  StatusPill,
  TenureBar,
} from './sharedui';

/* ============================================================================
   LOAN DETAIL (tabs: Overview, Disbursement, Schedule, History, Accounting,
   Documents, Activity)
============================================================================ */

export function LoanDetailView({ loan, borrower }: { loan: LoanSummary; borrower: BorrowerProfile }) {
  const detail = useMemo(() => getLoanDetail(loan), [loan]);
  const [tab, setTab] = useState('overview');

  const rightRail =
    tab === 'documents' ? (
      <DocumentStatusPanel checklist={detail.documentChecklist} />
    ) : tab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel borrower={borrower} />
    );

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {/* Header strip */}
        <Paper
          radius="lg"
          p="md"
          className="border-l-4"
          style={{
            borderLeftColor: loan.status === 'Active' ? brand.teal : loan.status === 'Closed' ? brand.slate : brand.rose,
            border: '1px solid #ECE8DD',
            borderLeftWidth: 4,
            boxShadow: '0 6px 20px rgba(36,31,61,0.08)',
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                ASSET FINANCE · LOAN {detail.loanNumber}
              </Text>
              <Text fz="xl" fw={700} c="gray.9" style={serif}>
                {detail.product === 'SME Working Capital' ? 'Equipment Asset Loan' : detail.product}
              </Text>
              <Text fz="xs" c="dimmed" className="mt-1">
                Purpose: <span className="font-semibold text-gray-700">{detail.purpose}</span>
                {'   '}Officer: <span className="font-semibold text-gray-700">{detail.officer}</span>
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill
                label={detail.loanStatusLabel}
                tone={loan.status === 'Active' ? 'active' : loan.status === 'Closed' ? 'neutral' : 'warn'}
              />
              <Button size="xs" radius="md" styles={{ root: { backgroundColor: brand.primary } }}>
                Record payment
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.goldSoft, color: '#8A5A0F' } }}
                leftSection={<IconBell size={13} />}
              >
                Send reminder
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
                leftSection={<IconRefreshDot size={13} />}
              >
                Restructure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-gray-100">
            <OverviewField label="TOTAL OUTSTANDING" value={formatK(detail.totalOutstanding)} />
            <OverviewField label="NEXT INSTALLMENT" value={detail.nextInstallment ? formatK(detail.nextInstallment) : '—'} />
            <OverviewField label="DAYS PAST DUE" value={detail.dpd} />
            <OverviewField label="INTEREST RATE" value={detail.interestRate} />
            <OverviewField label="MATURITY DATE" value={detail.maturityDate} />
          </div>

          <TenureBar elapsed={detail.elapsedMonths} total={detail.tenureMonths} />
        </Paper>
        <Tabs
          value={tab}
          onChange={(v) => v && setTab(v)}
          variant="pills"
          radius="xl"
          styles={{
            tab: {
              color: "#6B7280",
              background: "transparent",
              border: "none",

              "&[data-active]": {
                background: "#E5E7EB !important",
                color: "#111827 !important",
                fontWeight: 700,
              },
            },
          }}
        >
          <Tabs.List className="mb-5 flex-wrap gap-1 pb-3 border-b border-gray-200">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="disbursement">Disbursement</Tabs.Tab>
            <Tabs.Tab value="schedule">Schedule</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>

            <Tabs.Tab value="accounting">Accounting</Tabs.Tab>
            <Tabs.Tab value="collateral">Collateral</Tabs.Tab>
            <Tabs.Tab value="documents">Documents</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <div className="flex flex-col gap-5">
              <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                  <Text fz="lg" fw={600} c="gray.9" style={serif}>
                    Loan overview
                  </Text>
                  <Text fz="xs" c="dimmed">
                    Core terms &amp; current standing
                  </Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                  <OverviewField label="LOAN NUMBER" value={detail.loanNumber} />
                  <OverviewField label="PRODUCT" value={detail.product} />
                  <OverviewField label="LOAN STATUS" value={detail.loanStatusLabel} />
                  <OverviewField label="ORIGINAL AMOUNT" value={formatK(detail.originalAmount)} />
                  <OverviewField label="DISBURSED AMOUNT" value={formatK(detail.disbursedAmount)} />
                  <OverviewField label="OUTSTANDING PRINCIPAL" value={formatK(detail.principalOutstanding)} />
                  <OverviewField label="OUTSTANDING INTEREST" value={formatK(detail.interestOutstanding)} />
                  <OverviewField label="OUTSTANDING PENALTY" value={formatK(detail.penaltyOutstanding)} />
                  <OverviewField label="REPAYMENT FREQUENCY" value={detail.repaymentFrequency} />
                  <OverviewField label="LOAN TENURE" value={`${detail.tenureMonths} months`} />
                  <OverviewField label="REMAINING TENURE" value={`${detail.remainingTenure} months`} />
                  <OverviewField label="LOAN OFFICER" value={detail.officer} />
                </div>
              </Paper>

              <SectionHeading
                title="Repayment schedule"
                aside="Tap any installment for the full breakdown"
              />

              <RepaymentSchedule schedule={detail.schedule} />

              <SectionHeading
                title="Repayment history"
                aside={`${detail.history.length} most recent transactions`}
              />

              <RepaymentHistoryTable
                history={detail.history}
              />
              <SectionHeading
                title="Accounting"
                aside="Journal entries posted against this loan"
              />

              <AccountingTable
                accounting={detail.accounting}
              />

              <SectionHeading
                title="Collateral"
                aside={`${detail.collateral.length} assets securing this loan`}
              />

              <CollateralSection collateral={detail.collateral} />

              <SectionHeading
                title="Documents"
                aside={`${detail.documents.length} files on record`}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {detail.documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>

              <SectionHeading
                title="Activity & audit"
                aside="Every touchpoint on this loan, in order"
              />

              <ActivityFeed activity={detail.activity} />

              <div>
                <SectionHeading title="Disbursement" aside={`${detail.tranches.length} tranches released`} />
                <div className="flex flex-col gap-2.5">
                  {detail.tranches.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border-l-[3px] border px-3 py-2.5" style={{ borderColor: '#EDEAE0', borderLeftColor: brand.teal, backgroundColor: '#fff' }}>
                      <Text fz="xs" c="gray.9">
                        <span className="font-semibold">{t.label}</span> · {formatK(t.amount)}
                        <span className="text-gray-400">
                          {' '}
                          — {t.date} · {t.method} · {t.account} · Ref: {t.ref} · Approved by {t.approvedBy}
                        </span>
                      </Text>
                      <Badge size="sm" variant="light" color="teal">
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="disbursement">
            <Paper radius="lg" className="p-4" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex flex-col gap-2.5">
                {detail.tranches.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border-l-[3px] border px-3 py-2.5" style={{ borderColor: '#EDEAE0', borderLeftColor: brand.teal, backgroundColor: '#fff' }}>
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {t.label} · {formatK(t.amount)}
                      </Text>
                      <Text fz={11} c="dimmed">
                        {t.date} · {t.method} · {t.account} · Ref: {t.ref} · Approved by {t.approvedBy}
                      </Text>
                    </div>
                    <Badge size="sm" variant="light" color="teal">
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="schedule">
            <Paper radius="lg" className="p-4" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor['Paid on time'] }} />
                  Paid on time
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor['Paid late'] }} />
                  Paid late
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor.Overdue }} />
                  Overdue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-gray-300" style={{ background: scheduleStatusColor.Upcoming }} />
                  Upcoming
                </span>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Due date</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.schedule.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.no}</Table.Td>
                      <Table.Td>{s.dueDate}</Table.Td>
                      <Table.Td className="font-mono">{formatK(s.amount)}</Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={
                            s.status === 'Paid on time' ? 'teal' : s.status === 'Paid late' ? 'orange' : s.status === 'Overdue' ? 'red' : 'gray'
                          }
                        >
                          {s.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Repayment history
                </Text>
                <Text fz="xs" c="dimmed">
                  {detail.history.length} most recent transactions
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs" className="min-w-full">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Receipt</Table.Th>
                    <Table.Th>Payment date</Table.Th>
                    <Table.Th>Method</Table.Th>
                    <Table.Th>Collector</Table.Th>
                    <Table.Th>Principal</Table.Th>
                    <Table.Th>Interest</Table.Th>
                    <Table.Th>Penalty</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.history.map((r) => (
                    <Table.Tr key={r.receipt}>
                      <Table.Td className="font-mono" style={{ color: brand.sky }}>{r.receipt}</Table.Td>
                      <Table.Td>{r.date}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="gray">
                          {r.method}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{r.collector}</Table.Td>
                      <Table.Td className="font-mono">{r.principal.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.interest.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.penalty.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono font-semibold">{r.total.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.balance.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="accounting">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <IconWallet size={15} className="text-gray-500" />
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Ledger entries
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Debit</Table.Th>
                    <Table.Th>Credit</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.accounting.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{row.date}</Table.Td>
                      <Table.Td>{row.description}</Table.Td>
                      <Table.Td className="font-mono">{row.debit ? formatK(row.debit) : '—'}</Table.Td>
                      <Table.Td className="font-mono">{row.credit ? formatK(row.credit) : '—'}</Table.Td>
                      <Table.Td className="font-mono">{formatK(row.balance)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="collateral">
            <SectionHeading
              title="Collateral"
              aside={`${detail.collateral.length} assets securing this loan`}
            />

            <CollateralSection collateral={detail.collateral} />
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            <SectionHeading title="Documents" aside={`${detail.documents.length} files on record`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {detail.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <SectionHeading title="Activity & audit" aside="Every touchpoint on this loan, in order" />
            <ActivityFeed activity={detail.activity} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}

/* ============================================================================
   ACCOUNT DETAIL (savings / investment / fixed deposit — tabs: Overview,
   History, Documents, Activity)
============================================================================ */

export function AccountDetailView({
  title,
  detail,
  borrower,
}: {
  title: string;
  detail: AccountDetailData;
  borrower: BorrowerProfile;
}) {
  const [tab, setTab] = useState('overview');

  const rightRail =
    tab === 'documents' ? (
      <DocumentStatusPanel checklist={detail.documentChecklist} />
    ) : tab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel borrower={borrower} />
    );

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <Paper
          radius="lg"
          p="md"
          className="border-l-4"
          style={{
            borderLeftColor: detail.statusLabel === 'Active' ? brand.teal : brand.slate,
            border: '1px solid #ECE8DD',
            borderLeftWidth: 4,
            boxShadow: '0 6px 20px rgba(36,31,61,0.08)',
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                EVERYDAY BANKING · ACCOUNT {detail.accountNumber}
              </Text>
              <Text fz="xl" fw={700} c="gray.9" style={serif}>
                {title}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={detail.statusLabel} tone={detail.statusLabel === 'Active' ? 'active' : 'neutral'} />
              <Button size="xs" radius="md" styles={{ root: { backgroundColor: brand.primary } }}>
                Record payment
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.goldSoft, color: '#8A5A0F' } }}
                leftSection={<IconBell size={13} />}
              >
                Send reminder
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
                leftSection={<IconRefreshDot size={13} />}
              >
                Restructure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-3 border-b border-gray-100">
            <OverviewField label="CURRENT BALANCE" value={formatK(detail.currentBalance, 2)} />
            {detail.avgMonthlyInflow !== undefined && <OverviewField label="AVG. MONTHLY INFLOW" value={formatK(detail.avgMonthlyInflow)} />}
            {detail.interestEarnedYtd !== undefined && <OverviewField label="INTEREST EARNED YTD" value={formatK(detail.interestEarnedYtd)} />}
            <OverviewField label="INTEREST RATE" value={detail.interestRate} />
            <OverviewField label={detail.maturityDate ? 'MATURITY DATE' : 'OPENED'} value={detail.maturityDate ?? detail.openedDate} />
          </div>

          {detail.tenureMonths !== undefined && (
            <TenureBar elapsed={detail.elapsedMonths ?? 0} total={detail.tenureMonths} />
          )}
        </Paper>

        <Tabs value={tab} onChange={(v) => v && setTab(v)} variant="pills" color="ink" radius="xl">
          <Tabs.List className="mb-5 flex-wrap gap-1 pb-3 border-b border-gray-200">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
            <Tabs.Tab value="documents">Documents</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Account overview
                </Text>
                <Text fz="xs" c="dimmed">
                  Core terms &amp; current standing
                </Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                <OverviewField label="ACCOUNT NUMBER" value={detail.accountNumber} />
                <OverviewField label="PRODUCT" value={detail.product} />
                <OverviewField label="STATUS" value={detail.statusLabel} />
                <OverviewField label="OPENED" value={detail.openedDate} />
                {detail.maturityDate && <OverviewField label="MATURITY DATE" value={detail.maturityDate} />}
                {detail.tenureMonths !== undefined && (
                  <OverviewField label="TENURE" value={`${detail.elapsedMonths ?? 0} / ${detail.tenureMonths} months`} />
                )}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Transaction history
                </Text>
                <Text fz="xs" c="dimmed">
                  {detail.history.length} most recent transactions
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Receipt</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Method</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.history.map((r) => (
                    <Table.Tr key={r.receipt}>
                      <Table.Td className="font-mono" style={{ color: brand.sky }}>{r.receipt}</Table.Td>
                      <Table.Td>{r.date}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="gray">
                          {r.method}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="font-mono">{formatK(r.total)}</Table.Td>
                      <Table.Td className="font-mono">{formatK(r.balance, 2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            <SectionHeading title="Documents" aside={`${detail.documents.length} files on record`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {detail.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <SectionHeading title="Activity & audit" aside="Every touchpoint on this account, in order" />
            <ActivityFeed activity={detail.activity} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}