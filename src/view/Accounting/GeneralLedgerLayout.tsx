// ─────────────────────────────────────────────────────────────
// General Ledger — 3 inner tabs (Chart Of Accounts, Journal Entry, Report)
// ─────────────────────────────────────────────────────────────

import { IconHierarchy2, IconReceipt2, IconFileText } from "@tabler/icons-react";
import { RouteTabs, type RouteTabItem } from "../../components/ui/RouteTabs";

const GL_TABS: RouteTabItem[] = [
  {
    path: "/accounting/general-ledger/chart-of-accounts",
    label: "Chart Of Accounts",
    icon: IconHierarchy2,
  },
  {
    path: "/accounting/general-ledger/journal-entry",
    label: "Journal Entry",
    icon: IconReceipt2,
  },
  {
    path: "/accounting/general-ledger/report",
    label: "General Ledger Report",
    icon: IconFileText,
  },
];

function GeneralLedgerTabs() {
  return <RouteTabs tabs={GL_TABS} />;
}