/*
 * Investor 360 (master view): everything about one investor in one place.
 *
 * Layout mirrors the Customer 360 view: a sidebar on the left, the selected panel on the right.
 *   InvestorSidebar        identity + Overview / Statement / Profile + investments (contracts) list
 *   OverviewPanel          totals across all investments
 *   InvestmentDetailPanel  one contract: terms, funds paid, repayments, money trail
 *   StatementPanel         money in / money back by date, PDF download
 *   ProfilePanel           customer record and bank accounts
 *   JournalEntryDrawer     accounting drill-down, opened from any panel
 */
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Group, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  getInvestorNotifications,
  getInvestorPortfolio,
} from "../../../api/Investor/investorFlowApi";
import { themeTokens } from "../../LoanAccount/LoanView/SharedUI";
import { InvestorSidebar } from "./InvestorSidebar";
import { OverviewPanel } from "./OverviewPanel";
import {
  InvestmentDetailPanel,
  type InvestmentDetailTab,
} from "./InvestmentDetailPanel";
import { StatementPanel } from "./StatementPanel";
import { ProfilePanel } from "./ProfilePanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { JournalEntryDrawer } from "./JournalEntryDrawer";
import { ErrorBlock, LoadingBlock } from "./ui";
import { type InvestorViewSelection } from "./format";

interface Props {
  /** Customer ID of the investor. */
  investorId: string;
  /** Investment to open first; the Overview opens when not given. */
  initialInvestment?: string | null;
  /** Tab of that investment to open first. */
  initialTab?: InvestmentDetailTab;
  /** Journal Entry whose accounting drawer is open at the start. */
  initialJournalEntry?: string | null;
  onBack: () => void;
}

const TITLES: Record<InvestorViewSelection["type"], string> = {
  overview: "Overview",
  investment: "Investment",
  statement: "Statement",
  profile: "Profile",
  notifications: "Notifications",
};

export function InvestorView({
  investorId,
  initialInvestment,
  initialTab,
  initialJournalEntry = null,
  onBack,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<InvestorViewSelection>(
    initialInvestment
      ? { type: "investment", id: initialInvestment }
      : { type: "overview" },
  );
  const [journalEntry, setJournalEntry] = useState<string | null>(
    initialJournalEntry,
  );

  // Emails sent to the investor (contracts, fund receipts, payment statements).
  const notificationsQuery = useQuery({
    queryKey: ["investorNotifications", investorId],
    queryFn: () => getInvestorNotifications(investorId),
    retry: false,
  });
  const {
    data: portfolio,
    isError,
    error,
  } = useQuery({
    queryKey: ["investorPortfolio", investorId],
    queryFn: () => getInvestorPortfolio(investorId),
    retry: false,
  });

  // Only a failed request shows the error; anything else without data is still loading.
  if (!isError && !portfolio) return <LoadingBlock />;
  if (isError || !portfolio) {
    return (
      <Box p="lg">
        <Button
          variant="subtle"
          color="slate"
          leftSection={<IconArrowLeft size={14} />}
          onClick={onBack}
          mb="md"
        >
          Back
        </Button>
        <ErrorBlock
          error={error}
          fallback="The investor could not be loaded."
        />
      </Box>
    );
  }

  let panel: ReactNode;
  switch (selected.type) {
    case "overview":
      panel = (
        <OverviewPanel
          portfolio={portfolio}
          onOpenInvestment={(id) => setSelected({ type: "investment", id })}
        />
      );
      break;
    case "investment":
      panel = (
        <InvestmentDetailPanel
          key={selected.id}
          investmentId={selected.id}
          investorName={portfolio.investor.name}
          onOpenEntry={setJournalEntry}
          // The opening tab applies to the investment the view was opened on.
          initialTab={
            selected.id === initialInvestment ? initialTab : undefined
          }
        />
      );
      break;
    case "statement":
      panel = (
        <StatementPanel portfolio={portfolio} onOpenEntry={setJournalEntry} />
      );
      break;
    case "profile":
      panel = <ProfilePanel investorId={investorId} />;
      break;
    case "notifications":
      panel = (
        <NotificationsPanel notifications={notificationsQuery.data ?? []} />
      );
      break;
  }

  return (
    <div className="flex h-full min-h-screen">
      <InvestorSidebar
        portfolio={portfolio}
        notificationCount={notificationsQuery.data?.length ?? 0}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
        selected={selected}
        onSelect={setSelected}
      />

      <div
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ backgroundColor: themeTokens.surface }}
      >
        <div className="p-4 flex flex-col gap-3">
          <Group gap={6}>
            <Text fz="xs" c="slate.5">
              {portfolio.investor.name}
            </Text>
            <Text fz="xs" c="slate.4">
              /
            </Text>
            <Text fz="xs" fw={700} c="slate.8">
              {TITLES[selected.type]}
              {selected.type === "investment" ? ` ${selected.id}` : ""}
            </Text>
          </Group>
          {panel}
        </div>
      </div>

      <JournalEntryDrawer
        journalEntry={journalEntry}
        onClose={() => setJournalEntry(null)}
      />
    </div>
  );
}
