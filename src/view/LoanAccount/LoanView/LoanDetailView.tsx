import { useCallback } from 'react';
import { Paper, Tabs, Text, Button, Skeleton } from '@mantine/core';
import { IconBell, IconRefreshDot } from '@tabler/icons-react';
import { useLoanView } from '../../../hooks/Loan/useLoanView';
import { useCompanyStore } from '../../../store/companyStore';
import { formatAmount } from '../../../store/currencyStore';
import { OverviewField, StatusPill, TenureBar, brand, serif } from './SharedUI';
import { RiskSnapshotPanel, DocumentStatusPanel, QuickLogPanel } from './RightRailPanels';

// Tabs
import { OverviewTab } from './Tabs/OverviewTab';
import { DisbursementTab } from './Tabs/DisbursementTab';
import { ScheduleTab } from './Tabs/ScheduleTab';
import { HistoryTab } from './Tabs/HistoryTab';
import { AccountingTab } from './Tabs/AccountingTab';
import { CollateralTab } from './Tabs/CollateralTab';
import { DocumentsTab } from './Tabs/DocumentsTab';
import { ActivityTab } from './Tabs/ActivityTab';

export function LoanDetailView({ loanId, borrower }: { loanId: string; borrower: any }) {
  const { data, status, activeTab, setActiveTab, pagination, actions } = useLoanView(loanId);
  console.log("🚀 ~ LoanDetailView ~ data:", data)
  const { overview } = data;
  
  const currencyCode = useCompanyStore((state) => state.baseCurrency);
  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "$0";
      return formatAmount(currencyCode, val, { withSymbol: true });
    },
    [currencyCode]
  );

  const rightRail =
    activeTab === 'documents' ? (
      <DocumentStatusPanel checklist={{ complete: data.documents.length, total: data.documents.length + (data.documents.length === 0 ? 1 : 0), missingLabel: data.documents.length === 0 ? "Initial Docs" : null }} />
    ) : activeTab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel borrower={borrower} />
    );

  if (status.overview && !overview) {
    return <Skeleton height={400} radius="lg" />;
  }

  if (!overview) return <Text>Loan not found.</Text>;

  const loanStatusTone = overview.status === 'Active' ? 'active' : overview.status === 'Closed' ? 'neutral' : 'warn';
  const borderLeftColor = overview.status === 'Active' ? brand.teal : overview.status === 'Closed' ? brand.slate : brand.rose;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        
        {/* Header strip */}
        <Paper
          radius="lg"
          p="md"
          className="border-l-4 relative"
          style={{
            borderLeftColor,
            borderTop: '1px solid #ECE8DD',
            borderRight: '1px solid #ECE8DD',
            borderBottom: '1px solid #ECE8DD',
            boxShadow: '0 6px 20px rgba(36,31,61,0.08)',
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                {overview.classification_code || 'ASSET FINANCE'} · LOAN {overview.name}
              </Text>
              <Text fz="xl" fw={700} c="gray.9" style={serif}>
                {overview.loan_product}
              </Text>
              <Text fz="xs" c="dimmed" className="mt-1">
                Officer: <span className="font-semibold text-gray-700">{overview.owner}</span>
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={overview.status} tone={loanStatusTone} />
              <Button size="xs" radius="md" styles={{ root: { backgroundColor: brand.primary } }}>
                Record payment
              </Button>
              <Button size="xs" radius="md" variant="light" styles={{ root: { backgroundColor: brand.goldSoft, color: '#8A5A0F' } }} leftSection={<IconBell size={13} />}>
                Send reminder
              </Button>
              <Button size="xs" radius="md" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} leftSection={<IconRefreshDot size={13} />}>
                Restructure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-gray-100">
            <OverviewField label="TOTAL OUTSTANDING" value={renderCurrency(overview.total_outstanding)} />
            <OverviewField label="MONTHLY REPAYMENT" value={renderCurrency(overview.monthly_repayment_amount)} />
            <OverviewField label="DAYS PAST DUE" value={overview.days_past_due} />
            <OverviewField label="INTEREST RATE" value={`${overview.rate_of_interest}%`} />
            <OverviewField label="MATURITY DATE" value={overview.maturity_date || '—'} />
          </div>

          <TenureBar elapsed={overview.total_installments_raised} total={overview.repayment_periods} />
        </Paper>

        <Tabs
          value={activeTab}
          onChange={(v) => v && setActiveTab(v)}
          variant="pills"
          radius="xl"
          styles={{
            tab: {
              color: "#6B7280",
              background: "transparent",
              border: "none",
              "&[data-active]": { background: "#E5E7EB !important", color: "#111827 !important", fontWeight: 700 },
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
            <OverviewTab data={data} renderCurrency={renderCurrency} actions={actions} />
          </Tabs.Panel>
          <Tabs.Panel value="disbursement">
            <DisbursementTab data={data.disbursements} meta={pagination.disbursementMeta} page={pagination.disbursementPage} setPage={pagination.setDisbursementPage} onPaginate={actions.fetchDisbursements} renderCurrency={renderCurrency} />
          </Tabs.Panel>
          <Tabs.Panel value="schedule">
            <ScheduleTab data={data} renderCurrency={renderCurrency} actions={actions} />
          </Tabs.Panel>
          <Tabs.Panel value="history">
            <HistoryTab data={data.history} meta={pagination.historyMeta} page={pagination.historyPage} setPage={pagination.setHistoryPage} onPaginate={actions.fetchHistory} renderCurrency={renderCurrency} />
          </Tabs.Panel>
          <Tabs.Panel value="accounting">
            <AccountingTab data={data.accounting} meta={pagination.accountingMeta} page={pagination.accountingPage} setPage={pagination.setAccountingPage} onPaginate={actions.fetchAccounting} renderCurrency={renderCurrency} />
          </Tabs.Panel>
          <Tabs.Panel value="collateral">
            <CollateralTab data={data.collateral} meta={pagination.collateralMeta} page={pagination.collateralPage} setPage={pagination.setCollateralPage} onPaginate={actions.fetchCollateral} renderCurrency={renderCurrency} />
          </Tabs.Panel>
          <Tabs.Panel value="documents">
            <DocumentsTab data={data.documents} meta={pagination.documentMeta} page={pagination.documentPage} setPage={pagination.setDocumentPage} onPaginate={actions.fetchDocuments} />
          </Tabs.Panel>
          <Tabs.Panel value="activity">
            <ActivityTab data={data.activity} meta={pagination.activityMeta} page={pagination.activityPage} setPage={pagination.setActivityPage} onPaginate={actions.fetchActivity} renderCurrency={renderCurrency} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}