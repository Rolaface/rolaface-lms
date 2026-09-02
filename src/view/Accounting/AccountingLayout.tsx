import { useMemo } from "react";
import { RouteTabs, type RouteTabItem } from "../../components/ui/RouteTabs";
import { usePermission } from "../../hooks/Usepermission"; 
import type { PermissionAction } from "../../store/Permissionstore";
import type { LmsModule } from "../../types/User/userRole";
import {
  IconBookmarks,
  IconCreditCardRefund,
  IconCreditCardPay,
  IconReportAnalytics,
  IconChartLine,
  IconScale,
  IconArrowsExchange,
} from "@tabler/icons-react";

type AccountingTabConfig = RouteTabItem & {
  moduleChecks: Array<{ module: LmsModule; action: PermissionAction }>;
};

const ACCOUNTING_TABS: AccountingTabConfig[] = [
  {
    path: "/accounting/general-ledger",
    label: "General Ledger",
    icon: IconBookmarks,
    matchPrefix: true,
    moduleChecks: [
      { module: "Account", action: "read" },
      { module: "Journal Entry", action: "read" },
      { module: "Account", action: "report" },
    ],
  },
  {
    path: "/accounting/trial-balance",
    label: "Trial Balance",
    icon: IconReportAnalytics,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
  {
    path: "/accounting/receivable",
    label: "Receivable",
    icon: IconCreditCardRefund,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
  {
    path: "/accounting/payable",
    label: "Payable",
    icon: IconCreditCardPay,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
  {
    path: "/accounting/profit-loss",
    label: "Profit & Loss",
    icon: IconChartLine,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
  {
    path: "/accounting/balance-sheet",
    label: "Balance Sheet",
    icon: IconScale,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
  {
    path: "/accounting/cash-flow",
    label: "Cash Flow",
    icon: IconArrowsExchange,
    matchPrefix: true,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
];

export function AccountingLayout() {
  const { can } = usePermission();

  const visibleTabs = useMemo(
    () =>
      ACCOUNTING_TABS.filter((tab) =>
        tab.moduleChecks.some(({ module, action }) => can(module, action))
      ),
    [can]
  );

  return <RouteTabs tabs={visibleTabs} />;
}