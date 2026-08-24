import { useCallback } from "react";
import { Paper, Tabs, Text, Button, Menu } from "@mantine/core";
import {
  IconActivity,
  IconBell,
  IconCalculator,
  IconCalendarStats,
  IconCash,
  IconChevronDown,
  IconClockHour4,
  IconFileText,
  IconHistory,
  IconLayoutDashboard,
  IconPercentage,
  IconRefreshDot,
  IconShieldCheck,
  IconWallet,
} from "@tabler/icons-react";
import { useLoanView } from "../../../hooks/Loan/useLoanView";
import { useCompanyStore } from "../../../store/companyStore";
import { formatAmount } from "../../../store/currencyStore";
import { OverviewField, StatusPill, TenureBar, themeTokens, serif } from "./SharedUI";
import { LoanDetailSkeleton } from "./LoanDetailSkeleton";
import {
  RiskSnapshotPanel,
  DocumentStatusPanel,
  QuickLogPanel,
} from "./RightRailPanels";

// Tabs
import { OverviewTab } from "./Tabs/OverviewTab";
import { DisbursementTab } from "./Tabs/DisbursementTab";
import { ScheduleTab } from "./Tabs/ScheduleTab";
import { HistoryTab } from "./Tabs/HistoryTab";
import { AccountingTab } from "./Tabs/AccountingTab";
import { CollateralTab } from "./Tabs/CollateralTab";
import { DocumentsTab } from "./Tabs/DocumentsTab";
import { ActivityTab } from "./Tabs/ActivityTab";

export function LoanDetailView({
  loanId,
  borrower,
}: {
  loanId: string;
  borrower: any;
}) {
  const { data, status, activeTab, setActiveTab, pagination, actions } =
    useLoanView(loanId);
  console.log("🚀 ~ LoanDetailView ~ data:", data);
  const { overview } = data;

  const currencyCode = useCompanyStore((state) => state.baseCurrency);
  const renderCurrency = useCallback(
    (val: number | string | undefined | null) => {
      if (val === undefined || val === null || val === "") return "$0";
      return formatAmount(currencyCode, val, { withSymbol: true });
    },
    [currencyCode],
  );

  const rightRail =
    activeTab === "documents" ? (
      <DocumentStatusPanel
        checklist={{
          complete: data.documents.length,
          total: data.documents.length + (data.documents.length === 0 ? 1 : 0),
          missingLabel: data.documents.length === 0 ? "Initial Docs" : null,
        }}
      />
    ) : activeTab === "activity" ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel
        borrower={borrower}
        activity={data.activity}
        onViewAllActivity={() => setActiveTab("activity")}
      />
    );

  // Modern, layout-matching loading state instead of a single generic block.
  if (status.overview && !overview) {
    return <LoanDetailSkeleton />;
  }

  if (!overview) return <Text>Loan not found.</Text>;

  const loanStatusTone =
    overview.status === "Active"
      ? "active"
      : overview.status === "Closed"
        ? "neutral"
        : "warn";
  const borderLeftColor =
    overview.status === "Active"
      ? themeTokens.success
      : overview.status === "Closed"
        ? themeTokens.slate
        : themeTokens.danger;

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
            borderTop: "1px solid var(--mantine-color-slate-2)",
            borderRight: "1px solid var(--mantine-color-slate-2)",
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "var(--mantine-shadow-md)",
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz="xl" fw={800} c="slate.9" style={serif}>
                {overview.name}
              </Text>
              <Text fz="xs" c="dimmed" className="mt-0.5">
                {overview.loan_product} · {overview.name}
              </Text>
              <Text fz="xs" c="dimmed" className="mt-1">
                Officer:{" "}
                <span className="font-semibold text-[var(--mantine-color-slate-7)]">
                  {overview.owner}
                </span>
              </Text>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill label={overview.status} tone={loanStatusTone} />
              <Button
                size="xs"
                radius="md"
                styles={{ root: { backgroundColor: themeTokens.primary } }}
              >
                Record payment
              </Button>
              <Menu
                shadow="md"
                radius="md"
                width={180}
                position="bottom-end"
                withinPortal
              >
                <Menu.Target>
                  <Button
                    size="xs"
                    radius="md"
                    variant="default"
                    rightSection={<IconChevronDown size={13} />}
                  >
                    More
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconBell size={14} />}>
                    Send reminder
                  </Menu.Item>
                  <Menu.Item leftSection={<IconRefreshDot size={14} />}>
                    Restructure
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-[var(--mantine-color-slate-1)]">
            <OverviewField
              icon={<IconWallet size={13} />}
              label="TOTAL OUTSTANDING"
              value={renderCurrency(overview.total_outstanding)}
            />
            <OverviewField
              icon={<IconCash size={13} />}
              label="MONTHLY REPAYMENT"
              value={renderCurrency(overview.monthly_repayment_amount)}
            />
            <OverviewField
              icon={<IconClockHour4 size={13} />}
              label="DAYS PAST DUE"
              value={overview.days_past_due}
            />
            <OverviewField
              icon={<IconPercentage size={13} />}
              label="INTEREST RATE"
              value={`${overview.rate_of_interest}%`}
            />
            <OverviewField
              icon={<IconCalendarStats size={13} />}
              label="MATURITY DATE"
              value={overview.maturity_date || "—"}
            />
          </div>

          <TenureBar
            elapsed={overview.total_installments_raised}
            total={overview.repayment_periods}
          />
        </Paper>

        <Tabs
          value={activeTab}
          onChange={(v) => v && setActiveTab(v)}
          variant="default"
          styles={{
            tab: {
              fontWeight: 600,
              fontSize: 13,
              color: "var(--mantine-color-slate-5)",
              "&[data-active]": {
                color: themeTokens.primary,
                borderColor: themeTokens.primary,
              },
            },
          }}
        >
          <Tabs.List className="mb-5 flex-wrap gap-1 border-b border-[var(--mantine-color-slate-2)]">
            <Tabs.Tab
              value="overview"
              leftSection={<IconLayoutDashboard size={14} />}
            >
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="disbursement" leftSection={<IconCash size={14} />}>
              Disbursement
            </Tabs.Tab>
            <Tabs.Tab
              value="schedule"
              leftSection={<IconCalendarStats size={14} />}
            >
              Schedule
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
              History
            </Tabs.Tab>
            <Tabs.Tab
              value="accounting"
              leftSection={<IconCalculator size={14} />}
            >
              Accounting
            </Tabs.Tab>
            <Tabs.Tab
              value="collateral"
              leftSection={<IconShieldCheck size={14} />}
            >
              Collateral
            </Tabs.Tab>
            <Tabs.Tab
              value="documents"
              leftSection={<IconFileText size={14} />}
            >
              Documents
            </Tabs.Tab>
            <Tabs.Tab value="activity" leftSection={<IconActivity size={14} />}>
              Activity
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <OverviewTab
              data={data}
              renderCurrency={renderCurrency}
              actions={actions}
              onNavigateTab={setActiveTab}
            />
          </Tabs.Panel>
          <Tabs.Panel value="disbursement">
            <DisbursementTab
              data={data.disbursements}
              meta={pagination.disbursementMeta}
              page={pagination.disbursementPage}
              setPage={pagination.setDisbursementPage}
              onPaginate={actions.fetchDisbursements}
              renderCurrency={renderCurrency}
            />
          </Tabs.Panel>
          <Tabs.Panel value="schedule">
            <ScheduleTab
              data={data}
              renderCurrency={renderCurrency}
              actions={actions}
            />
          </Tabs.Panel>
          <Tabs.Panel value="history">
            <HistoryTab
              data={data.history}
              meta={pagination.historyMeta}
              page={pagination.historyPage}
              setPage={pagination.setHistoryPage}
              onPaginate={actions.fetchHistory}
              renderCurrency={renderCurrency}
            />
          </Tabs.Panel>
          <Tabs.Panel value="accounting">
            <AccountingTab
              data={data.accounting}
              meta={pagination.accountingMeta}
              page={pagination.accountingPage}
              setPage={pagination.setAccountingPage}
              onPaginate={actions.fetchAccounting}
              renderCurrency={renderCurrency}
            />
          </Tabs.Panel>
          <Tabs.Panel value="collateral">
            <CollateralTab
              data={data.collateral}
              meta={pagination.collateralMeta}
              page={pagination.collateralPage}
              setPage={pagination.setCollateralPage}
              onPaginate={actions.fetchCollateral}
              renderCurrency={renderCurrency}
            />
          </Tabs.Panel>
          <Tabs.Panel value="documents">
            <DocumentsTab
              data={data.documents}
              meta={pagination.documentMeta}
              page={pagination.documentPage}
              setPage={pagination.setDocumentPage}
              onPaginate={actions.fetchDocuments}
            />
          </Tabs.Panel>
          <Tabs.Panel value="activity">
            <ActivityTab
              data={data.activity}
              meta={pagination.activityMeta}
              page={pagination.activityPage}
              setPage={pagination.setActivityPage}
              onPaginate={actions.fetchActivity}
              renderCurrency={renderCurrency}
            />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}