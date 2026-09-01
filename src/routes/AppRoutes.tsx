import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "../layout/AppLayout";
import { PermissionGuard } from "../view/Permissionguard";

import { Dashboard } from "../view/Dashboard";
import { Customer } from "../view/Customer/Customer";
import { Account } from "../view/LoanAccount/Account";
import { EmailTemplate } from "../view/Template/EmailTemplate";
import { UserManagement } from "../view/User/UserManagement";
import { RoleManagement } from "../view/User/RoleManagement";

import { CollateralType } from "../view/Collateral/CollateralType/CollateralType";
import { Collateral } from "../view/Collateral/Collateral";
import { LoanApplication } from "../view/Origination/LoanApplication";
import { LoanStatement } from "../view/Reports/LoanStatement/LoanStatement";
import { ArrearReports } from "../view/Reports/Arrear/ArrearReports";

import { LoanAccount } from "../view/LoanAccount/LoanAccount";
import { LoanDisbursement } from "../view/Operations/LoanDisbursement/LoanDisbursement";
import { LoanRepayment } from "../view/Operations/LoanRepayment/LoanRepayment";
import { LoanPrepayment } from "../view/Operations/LoanPrepayment/LoanPrepayment";
import { LoanWaiver } from "../view/Operations/LoanWaiver/LoanWaiver";
import { LoanCapitalization } from "../view/Operations/LoanCapitalization/LoanCapitalization";
// import { FullSettlement } from '../view/Operations/FullSettlement';
import { LoanRestructure } from "../view/Operations/LoanRestructure/LoanRestructure";
import { LoanWriteOff } from "../view/Operations/LoanWriteOff/LoanWriteOff";
import { LoanTransfer } from "../view/Operations/LoanTransfer/LoanTransfer";

import { LoanCategory } from "../view/Loan/LoanCategory/LoanCategory";
import { LoanClassification } from "../view/Setup/LoanClassification/LoanClassification";
import { LoanProvision } from "../view/Setup/LoanProvision/LoanProvision";
import { LoanCollectionSequenceOrder } from "../view/Setup/LoanCollectionSequence/LoanCollectionSequenceOrder";
import { FeeAndCharges } from "../view/Setup/FeeAndCharges/FeeAndCharges";
import { LoanProduct } from "../view/Loan/Product/LoanProduct";
import { LoanClassificationRanges } from "../view/Setup/LoanClassificationRanges/LoanClassificationRanges";

//accounting
import { ChartOfAccounts } from "../view/Accounting/chartofaccounting";
import { GeneralLedger } from "../view/Accounting/general-ledger";
import { JournalEntries } from "../view/Accounting/journal-entry";
import { TrialBalance } from "../view/Accounting/trial-balance";
import { Receivable } from "../view/Accounting/Receivable ";
import { Payable } from "../view/Accounting/Payable";
import { ProfitLoss } from "../view/Accounting/Profitloss";
import { BalanceSheet } from "../view/Accounting/balancesheet";
import { CashFlow } from "../view/Accounting/CashFlow";
import { AccountingLayout } from "../view/Accounting/AccountingLayout";
import {
  IconHierarchy2,
  IconReceipt2,
  IconFileText,
} from "@tabler/icons-react";
import { RouteTabs, type RouteTabItem } from "../components/ui/RouteTabs";
import SchedulerPage from "../view/Schedular";
import { LendingConfiguration } from "../view/lending Configuration/LendingConfiguration";
import { useMemo } from "react";
import { usePermission } from "../hooks/Usepermission";
import type { PermissionAction } from "../store/Permissionstore";
import type { LmsModule } from "../types/User/userRole";

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer",
  component: () => (
    <PermissionGuard modules={["Customer"]}>
      <Customer />
    </PermissionGuard>
  ),
});

const loanAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/loanAccount",
  component: Account,
});

// const loanRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '/loan',
//   component: Loan,
// });

/* ---------- Collateral (layout + children) ---------- */
const collateralRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/collateral",
  component: Outlet, // just renders matched child
});
const collateralTypeRoute = createRoute({
  getParentRoute: () => collateralRoute,
  path: "/type",
  component: CollateralType,
});
const collateralListRoute = createRoute({
  getParentRoute: () => collateralRoute,
  path: "/list",
  component: Collateral,
});

/* ---------- Lending Setup (layout + children) — ungated ---------- */
const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: Outlet, // or Outlet if LendingSetup is meant to be a shell
});
const setupCategoryRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/category",
  component: LoanCategory,
});
const setupClassificationRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/classification",
  component: LoanClassification,
});
const setupClassificationRangeRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/classificationRange",
  component: LoanClassificationRanges,
});
const setupProvisioningRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/provisioning",
  component: LoanProvision,
});
const setupCollectionRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/collection",
  component: LoanCollectionSequenceOrder,
});
const setupFeesRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/fees",
  component: FeeAndCharges,
});
const setupProductRoute = createRoute({
  getParentRoute: () => setupRoute,
  path: "/product",
  component: LoanProduct,
});

/* ---------- Origination (layout + children) — ungated ---------- */
const originationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/origination",
  component: Outlet,
});
const originationLoanApplicationRoute = createRoute({
  getParentRoute: () => originationRoute,
  path: "/loanApplication",
  component: LoanApplication,
});
// const originationApplicationRoute = createRoute({
//   getParentRoute: () => originationRoute,
//   path: '/application',
//   component: LoanApplication,
// });

const operationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operations",
  component: Outlet, // or Outlet if Operations is meant to be a shell
});
const operationsBookingRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/booking",
  component: () => (
    <PermissionGuard modules={["Loan"]}>
      <LoanAccount />
    </PermissionGuard>
  ),
});
const operationsDisbursementRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/disbursement",
  component: () => (
    <PermissionGuard modules={["Loan Disbursement"]}>
      <LoanDisbursement />
    </PermissionGuard>
  ),
});
const operationsRepaymentRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/repayment",
  component: () => (
    <PermissionGuard modules={["Loan Repayment"]}>
      <LoanRepayment />
    </PermissionGuard>
  ),
});
const operationsPrepaymentRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/prepayment",
  component: LoanPrepayment,
});
const operationsWaiverRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/waiver",
  component: LoanWaiver,
});
const operationsCapitalizationRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/capitalization",
  component: LoanCapitalization,
});
// const operationsSettlementRoute = createRoute({
//   getParentRoute: () => operationsRoute,
//   path: '/settlement',
//   component: FullSettlement,
// });
const operationsRestructureRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/restructure",
  component: LoanRestructure,
});
const operationsWriteoffRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/writeoff",
  component: LoanWriteOff,
});
const operationsTransferRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/transfer",
  component: LoanTransfer,
});

/* ---------- Lending Reports (layout + children) ---------- */
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Outlet,
});

/* ---------- Accounting (layout + children) ---------- */
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

function GeneralLedgerTabs() {
   const { can } = usePermission();
 const visibleTabs = useMemo(    () =>
      GL_TABS.filter((tab) =>
        tab.moduleChecks.some(({ module, action }) => can(module, action))
      ),
    [can]
  );
  return <RouteTabs tabs={visibleTabs} />;
 }

function GeneralLedgerReportRoute() {
  const { account } = generalLedgerRoute.useSearch();
  return <GeneralLedger account={account} />;
}

const accountingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounting",
  component: AccountingLayout,
});

const accountingIndexRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/accounting/general-ledger/chart-of-accounts" });
  },
});
const generalLedgerGroupRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/general-ledger",
  component: GeneralLedgerTabs,
});
const generalLedgerIndexRoute = createRoute({
  getParentRoute: () => generalLedgerGroupRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/accounting/general-ledger/chart-of-accounts" });
  },
});
const chartOfAccountsRoute = createRoute({
  getParentRoute: () => generalLedgerGroupRoute,
  path: "/chart-of-accounts",
  component: ChartOfAccounts,
});

const journaEntryroutes = createRoute({
  getParentRoute: () => generalLedgerGroupRoute,
  path: "/journal-entry",
  component: JournalEntries,
});

const generalLedgerRoute = createRoute({
  getParentRoute: () => generalLedgerGroupRoute,
  path: "/report",
  validateSearch: (search: Record<string, unknown>): { account?: string } => ({
    account: typeof search.account === "string" ? search.account : undefined,
  }),
  component: GeneralLedgerReportRoute,
});
const trialBalanceRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/trial-balance",
  component: TrialBalance,
});
const receivableRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/receivable",
  component: Receivable,
});
const payableeRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/payable",
  component: Payable,
});
const profitandlossRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/profit-loss",
  component: ProfitLoss,
});
const balancesheetRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/balance-sheet",
  component: BalanceSheet,
});
const cashflowRoute = createRoute({
  getParentRoute: () => accountingRoute,
  path: "/cash-flow",
  component: CashFlow,
});
const reportsStatementRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: "/statement",
  component: LoanStatement,
});
const reportsArrearsRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: "/arrears",
  component: ArrearReports,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Outlet,
});
const lendingConfigurationRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/lending-configuration",
  component: LendingConfiguration,
});
const userRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/user",
  component: Outlet,
});
const emailTemplateRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/emailTemplate",
  component: EmailTemplate,
});
const schedulerRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/scheduler",
  component: SchedulerPage,
});
const userManagementRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "/management",
  component: UserManagement,
});
const userRolesRoute = createRoute({
  getParentRoute: () => userRoute,
  path: "/roles",
  component: RoleManagement,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loanAccountRoute,
  customerRoute,
  // loanRoute,
  collateralRoute.addChildren([collateralTypeRoute, collateralListRoute]),
  setupRoute.addChildren([
    setupCategoryRoute,
    setupClassificationRoute,
    setupProvisioningRoute,
    setupClassificationRangeRoute,
    setupCollectionRoute,
    setupFeesRoute,
    setupProductRoute,
  ]),
  originationRoute.addChildren([originationLoanApplicationRoute]),
  operationsRoute.addChildren([
    operationsBookingRoute,
    operationsDisbursementRoute,
    operationsRepaymentRoute,
    operationsPrepaymentRoute,
    operationsWaiverRoute,
    operationsCapitalizationRoute,
    // operationsSettlementRoute,
    operationsRestructureRoute,
    operationsWriteoffRoute,
    operationsTransferRoute,
  ]),
  accountingRoute.addChildren([
    accountingIndexRoute,
    generalLedgerGroupRoute.addChildren([
      generalLedgerIndexRoute,
      chartOfAccountsRoute,
      journaEntryroutes,
      generalLedgerRoute,
    ]),
    trialBalanceRoute,
    receivableRoute,
    payableeRoute,
    profitandlossRoute,
    balancesheetRoute,
    cashflowRoute,
  ]),

  reportsRoute.addChildren([reportsStatementRoute, reportsArrearsRoute]),
  settingsRoute.addChildren([
    lendingConfigurationRoute,

    emailTemplateRoute,
    schedulerRoute,
    userRoute.addChildren([userManagementRoute, userRolesRoute]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
