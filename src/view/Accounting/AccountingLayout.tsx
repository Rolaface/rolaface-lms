import { RouteTabs, type RouteTabItem } from "../../components/ui/RouteTabs";
import {
  IconBookmarks,
  IconCreditCardRefund,
  IconCreditCardPay,
  IconReportAnalytics,
  IconChartLine,
  IconScale,
  IconArrowsExchange,
} from "@tabler/icons-react";

const ACCOUNTING_TABS: RouteTabItem[] = [
  { path: "/accounting/general-ledger", label: "General Ledger", icon: IconBookmarks, matchPrefix: true },
   { path: "/accounting/trial-balance", label: "Trial Balance", icon: IconReportAnalytics, matchPrefix: true },
  { path: "/accounting/receivable", label: "Receivable", icon: IconCreditCardRefund, matchPrefix: true },
  { path: "/accounting/payable", label: "Payable", icon: IconCreditCardPay, matchPrefix: true },
  { path: "/accounting/profit-loss", label: "Profit & Loss", icon: IconChartLine, matchPrefix: true },
  { path: "/accounting/balance-sheet", label: "Balance Sheet", icon: IconScale, matchPrefix: true },
  { path: "/accounting/cash-flow", label: "Cash Flow", icon: IconArrowsExchange, matchPrefix: true },
];

export function AccountingLayout() {
  return <RouteTabs tabs={ACCOUNTING_TABS} />;
}