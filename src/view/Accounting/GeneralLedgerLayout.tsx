import { useMemo } from "react";
import { IconHierarchy2, IconReceipt2, IconFileText } from "@tabler/icons-react";
import { RouteTabs, type RouteTabItem } from "../../components/ui/RouteTabs";
import { usePermission } from "../../hooks/Usepermission"; 
import type { PermissionAction } from "../../store/Permissionstore"; 
import type { LmsModule } from "../../types/User/userRole"; 

type GLTabConfig = RouteTabItem & {
  moduleChecks: Array<{ module: LmsModule; action: PermissionAction }>;
};

const GL_TABS: GLTabConfig[] = [
  {
    path: "/accounting/general-ledger/chart-of-accounts",
    label: "Chart Of Accounts",
    icon: IconHierarchy2,
    moduleChecks: [{ module: "Account", action: "read" }],
  },
  {
    path: "/accounting/general-ledger/journal-entry",
    label: "Journal Entry",
    icon: IconReceipt2,
    moduleChecks: [{ module: "Journal Entry", action: "read" }],
  },
  {
    path: "/accounting/general-ledger/report",
    label: "General Ledger Report",
    icon: IconFileText,
    moduleChecks: [{ module: "Account", action: "report" }],
  },
];

export function GeneralLedgerTabs() {
  const { can } = usePermission();

  const visibleTabs = useMemo(
    () =>
      GL_TABS.filter((tab) =>
        tab.moduleChecks.some(({ module, action }) => can(module, action))
      ),
    [can]
  );

  return <RouteTabs tabs={visibleTabs} />;
}