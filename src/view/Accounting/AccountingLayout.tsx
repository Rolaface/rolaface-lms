import { RouteTabs, type RouteTabItem } from "../../components/ui/RouteTabs";
import {
  IconBookmarks,
  IconCreditCardRefund,
  IconCreditCardPay,
  IconReportAnalytics,
  IconChartLine,
  IconScale,
} from "@tabler/icons-react";

const ACCOUNTING_TABS: RouteTabItem[] = [
  { path: "/accounting/general-ledger", label: "General Ledger", icon: IconBookmarks, matchPrefix: true },
  { path: "/accounting/Receivable", label: "Receivable", icon: IconCreditCardRefund },
  { path: "/accounting/Payable", label: "Payable", icon: IconCreditCardPay },
  { path: "/accounting/trial-balance", label: "Trial Balance", icon: IconReportAnalytics },
  { path: "/accounting/profit-loss", label: "Profit & Loss", icon: IconChartLine },
  { path: "/accounting/balance-sheet", label: "Balance Sheet", icon: IconScale },
];

export function AccountingLayout() {
  return <RouteTabs tabs={ACCOUNTING_TABS} />;
}