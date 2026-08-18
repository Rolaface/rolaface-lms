import { Paper, Text } from "@mantine/core";
import type { ReactNode } from "react";
import {
  IconArrowRight,
  IconInfoCircle,
  IconLayoutGrid,
  IconBuildingBank,
  IconWallet,
  IconLock,
  IconPercentage,
  IconAlertTriangle,
  IconShieldCheck,
  IconSettings,
  IconCalendar,
  IconHourglass,
  IconUser,
  IconCut,
  IconCalendarStats,
  IconBox,
  IconFileText,
  IconCalculator,
  IconActivity,
} from "@tabler/icons-react";
import { CurrencySymbol } from "../../../../components/shared/CurrencyIcon";
import { StatusPill, themeTokens, serif } from "../SharedUI";
import { LoanInstallmentOverview } from "../LoanInstallmentOverview";
import { HistoryTab } from "./HistoryTab";
import { AccountingTab } from "./AccountingTab";
import { DisbursementTab } from "./DisbursementTab";
import { CollateralTab } from "./CollateralTab";
import { DocumentsTab } from "./DocumentsTab";
const PREVIEW_LIMIT = 5;

/** Pulls the outstanding amount for a given demand type, defaulting to 0 when absent. */
type Demand = {
  type?: string;
  outstanding?: number;
};

function getDemandAmount(demands: Demand[] | undefined, type: string) {
  return demands?.find((d) => d.type === type)?.outstanding ?? 0;
}
/* ============================================================================
   SMALL BUILDING BLOCKS
============================================================================ */

function IconStat({
  icon,
  iconBg,
  iconFg,
  label,
  valueNode,
}: {
  icon: ReactNode;
  iconBg: string;
  iconFg: string;
  label: string;
  valueNode: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconFg }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <Text fz="xs" c="dimmed">
          {label}
        </Text>

        {valueNode}
      </div>
    </div>
  );
}
function SubCardHeader({
  icon,
  iconBg,
  iconFg,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconBg: string;
  iconFg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconFg }}
      >
        {icon}
      </div>

      <div>
        <Text fz="sm" fw={700} c="slate.9">
          {title}
        </Text>

        <Text fz={11} c="dimmed">
          {subtitle}
        </Text>
      </div>
    </div>
  );
}
function SectionCardHeader({ icon, iconBg, iconFg, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--mantine-color-slate-1)] flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color: iconFg }}
        >
          {icon}
        </div>
        <div>
          <Text fz="sm" fw={700} c="slate.9">
            {title}
          </Text>
          {subtitle && (
            <Text fz={11} c="dimmed">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function ViewAllLink({ onClick, label = "View all" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold"
      style={{
        color: themeTokens.primary,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      {label} <IconArrowRight size={12} />
    </button>
  );
}

function CountBadge({ children, tone = "teal" }) {
  const tones = {
    teal: { bg: themeTokens.successSoft, fg: "var(--mantine-color-success-7)" },
    sky: { bg: themeTokens.infoSoft, fg: themeTokens.info },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1"
      style={{ backgroundColor: t.bg }}
    >
      <Text fz={11} fw={700} style={{ color: t.fg }}>
        {children}
      </Text>
    </span>
  );
}

function SummaryTile({
  icon,
  iconBg,
  iconFg,
  label,
  count,
  subtitle,
  onViewAll,
}) {
  return (
    <Paper radius="lg" p="md" withBorder shadow="xs">
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color: iconFg }}
        >
          {icon}
        </div>
        {onViewAll && <ViewAllLink onClick={onViewAll} />}
      </div>
      <Text fz="xs" c="dimmed">
        {label}
      </Text>
      <Text fz={22} fw={800} c="slate.9">
        {count}
      </Text>
      <Text fz={11} c="dimmed">
        {subtitle}
      </Text>
    </Paper>
  );
}

/* ============================================================================
   MAIN
============================================================================ */

// TODO: replace `any` with real types once useLoanView's return shape is typed
export function OverviewTab({
  data,
  renderCurrency,
  actions,
  onNavigateTab,
}: any) {
  const { overview } = data;

  const principal = overview.outstanding_principal || 0;
  const interest = getDemandAmount(overview.demands, "Interest");
  const penalty = getDemandAmount(overview.demands, "Penalty");
  const goTo = (tab: string) => onNavigateTab && onNavigateTab(tab);

  return (
    <div className="flex flex-col gap-5">
      {/* Loan overview */}
      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          boxShadow: "var(--mantine-shadow-sm)",
        }}
      >
        <div className="flex justify-between items-center px-4 py-3.5 border-b border-[var(--mantine-color-slate-1)] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: themeTokens.primarySoft,
                color: themeTokens.primary,
              }}
            >
              <IconLayoutGrid size={17} />
            </div>
            <div>
              <Text fz="lg" fw={700} c="slate.9" style={serif}>
                Loan overview
              </Text>
              <Text fz={11} c="dimmed">
                Key details and current financial position of this loan
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: themeTokens.success }}
            />
            <Text fz="xs" fw={600} c="slate.6">
              As of today
            </Text>
            <Text fz="xs" c="dimmed">
              ·
            </Text>
            <Text fz="xs" fw={600} c="slate.6">
              Live data
            </Text>
            <IconInfoCircle size={13} color="var(--mantine-color-slate-4)" />
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100"
          style={{ backgroundColor: "var(--mantine-color-slate-0)" }}
        >
          <div className="p-4">
            <SubCardHeader
              icon={<IconBuildingBank size={16} />}
              iconBg={themeTokens.primarySoft}
              iconFg={themeTokens.primary}
              title="Financial position"
              subtitle="Outstanding balances"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {[
                {
                  icon: <IconWallet size={16} />,
                  iconBg: themeTokens.primarySoft,
                  iconFg: themeTokens.primary,
                  label: "Original amount",
                  value: renderCurrency(overview.loan_amount),
                },
                {
                  icon: <CurrencySymbol size="xs" />,
                  iconBg: themeTokens.successSoft,
                  iconFg: themeTokens.success,
                  label: "Disbursed amount",
                  value: renderCurrency(overview.disbursed_amount),
                },
                {
                  icon: <IconLock size={16} />,
                  iconBg: themeTokens.infoSoft,
                  iconFg: themeTokens.info,
                  label: "Outstanding principal",
                  value: renderCurrency(principal),
                },
                {
                  icon: <IconPercentage size={16} />,
                  iconBg: themeTokens.warningSoft,
                  iconFg: themeTokens.warning,
                  label: "Outstanding interest",
                  value: renderCurrency(interest),
                },
                {
                  icon: <IconAlertTriangle size={16} />,
                  iconBg: themeTokens.dangerSoft,
                  iconFg: themeTokens.danger,
                  label: "Outstanding penalty",
                  value: renderCurrency(penalty),
                },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className={
                    i < arr.length - (arr.length % 2 === 0 ? 2 : 1)
                      ? "border-b border-[var(--mantine-color-slate-1)]"
                      : ""
                  }
                >
                  <IconStat
                    icon={stat.icon}
                    iconBg={stat.iconBg}
                    iconFg={stat.iconFg}
                    label={stat.label}
                    valueNode={
                      <Text fz="sm" fw={700} c="slate.9">
                        {stat.value}
                      </Text>
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <SubCardHeader
              icon={<IconShieldCheck size={16} />}
              iconBg={themeTokens.primarySoft}
              iconFg={themeTokens.primary}
              title="Loan details"
              subtitle="Basic loan information"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {[
                {
                  icon: <IconSettings size={16} />,
                  iconBg: themeTokens.primarySoft,
                  iconFg: themeTokens.primary,
                  label: "Product",
                  valueNode: (
                    <Text fz="sm" fw={700} c="slate.9">
                      {overview.loan_product}
                    </Text>
                  ),
                },
                {
                  icon: <IconCalendar size={16} />,
                  iconBg: themeTokens.primarySoft,
                  iconFg: themeTokens.primary,
                  label: "Repayment frequency",
                  valueNode: (
                    <Text fz="sm" fw={700} c="slate.9">
                      {overview.repayment_frequency}
                    </Text>
                  ),
                },
                {
                  icon: <IconHourglass size={16} />,
                  iconBg: themeTokens.primarySoft,
                  iconFg: themeTokens.primary,
                  label: "Remaining tenure",
                  valueNode: (
                    <Text fz="sm" fw={700} c="slate.9">
                      {overview.remaining_tenure} months
                    </Text>
                  ),
                },
                {
                  icon: <IconShieldCheck size={16} />,
                  iconBg: themeTokens.successSoft,
                  iconFg: themeTokens.success,
                  label: "Loan status",
                  valueNode: (
                    <StatusPill
                      label={overview.status}
                      tone={
                        overview.status === "Active" ||
                        overview.status === "Disbursed"
                          ? "active"
                          : overview.status === "Closed"
                            ? "neutral"
                            : "warn"
                      }
                    />
                  ),
                },
                {
                  icon: <IconUser size={16} />,
                  iconBg: themeTokens.successSoft,
                  iconFg: themeTokens.success,
                  label: "Loan officer",
                  valueNode: (
                    <Text fz="sm" fw={700} c="slate.9">
                      {overview.owner}
                    </Text>
                  ),
                },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className={
                    i < arr.length - (arr.length % 2 === 0 ? 2 : 1)
                      ? "border-b border-[var(--mantine-color-slate-1)]"
                      : ""
                  }
                >
                  <IconStat
                    icon={stat.icon}
                    iconBg={stat.iconBg}
                    iconFg={stat.iconFg}
                    label={stat.label}
                    valueNode={stat.valueNode}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Paper>

      {/* Disbursement */}
      {data.disbursements.length > 0 && (
        <Paper
          radius="lg"
          className="overflow-hidden"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        >
          <SectionCardHeader
            icon={<IconCut size={17} />}
            iconBg={themeTokens.primarySoft}
            iconFg={themeTokens.primary}
            title="Disbursement"
            right={
              <div className="flex items-center gap-3">
                <CountBadge>
                  {data.disbursements.length} tranches released
                </CountBadge>
                <ViewAllLink onClick={() => goTo("disbursement")} />
              </div>
            }
          />
          <div className="p-4 pt-2">
            <DisbursementTab
              data={data.disbursements.slice(0, PREVIEW_LIMIT)}
              hidePagination
              renderCurrency={renderCurrency}
            />
            {data.disbursements.length > PREVIEW_LIMIT && (
              <div className="flex justify-center pt-3">
                <ViewAllLink
                  onClick={() => goTo("disbursement")}
                  label={`View all (${data.disbursements.length})`}
                />
              </div>
            )}
          </div>
        </Paper>
      )}

      {/* Repayment schedule */}
      {data.timeline.length > 0 && (
        <Paper
          radius="lg"
          className="overflow-hidden"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        >
          <SectionCardHeader
            icon={<IconCalendarStats size={17} />}
            iconBg={themeTokens.primarySoft}
            iconFg={themeTokens.primary}
            title="Repayment schedule"
            subtitle="Tap any installment for full breakdown"
            right={<ViewAllLink onClick={() => goTo("schedule")} />}
          />
          <div className="p-4 pt-3">
            <LoanInstallmentOverview
              data={data}
              renderCurrency={renderCurrency}
              actions={actions}
            />
          </div>
        </Paper>
      )}

      {/* Compact summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryTile
          icon={<IconBox size={17} />}
          iconBg={themeTokens.primarySoft}
          iconFg={themeTokens.primary}
          label="Collaterals"
          count={data.collateral.length}
          subtitle="Active collaterals"
          onViewAll={
            data.collateral.length > 0 ? () => goTo("collateral") : undefined
          }
        />
        <SummaryTile
          icon={<IconFileText size={17} />}
          iconBg={themeTokens.infoSoft}
          iconFg={themeTokens.info}
          label="Documents"
          count={data.documents.length}
          subtitle="Uploaded documents"
          onViewAll={
            data.documents.length > 0 ? () => goTo("documents") : undefined
          }
        />
        <SummaryTile
          icon={<IconCalculator size={17} />}
          iconBg={themeTokens.successSoft}
          iconFg={themeTokens.success}
          label="Accounting entries"
          count={data.accounting.length}
          subtitle="Total transactions"
          onViewAll={
            data.accounting.length > 0 ? () => goTo("accounting") : undefined
          }
        />
        <SummaryTile
          icon={<IconActivity size={17} />}
          iconBg={themeTokens.warningSoft}
          iconFg={themeTokens.warning}
          label="Recent activity"
          count={data.activity?.length ?? 0}
          subtitle="Latest updates"
          onViewAll={
            (data.activity?.length ?? 0) > 0
              ? () => goTo("activity")
              : undefined
          }
        />
      </div>
    </div>
  );
}
