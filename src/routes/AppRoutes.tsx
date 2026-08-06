import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "../layout/AppLayout";

import { Dashboard } from "../view/Dashboard";
import { Customer } from "../view/Customer/CustomerCreate";
import { Account } from "../view/LoanAccount/Account";
// import { Loan } from '../view/Loan/Loan';
import { LendingSetup } from "../view/Setup/LendingSetup";
// import { Operations } from '../view/Operations/Operation';

// TODO: create these view components (placeholders shown for now)
import { CollateralType } from "../view/Collateral/CollateralType/CollateralType";
import { Collateral } from "../view/Collateral/Collateral";
// import { LoanApplication } from '../view/Origination/LoanApplication';
import { LoanStatement } from "../view/Reports/LoanStatement";
import { ArrearReports } from '../view/Reports/ArrearReports';

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
import { IconHierarchy2, IconReceipt2, IconFileText } from "@tabler/icons-react";
import { RouteTabs, type RouteTabItem } from "../components/ui/RouteTabs";
// import Login from "../view/pages/Login";//yeh mat hantna for me its imp
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

// const loginRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/login",                    //yeh bhi
//   component: Login,
// });

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer",
  component: Customer,
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

/* ---------- Lending Setup (layout + children) ---------- */
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

/* ---------- Origination (layout + children) ---------- */
const originationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/origination",
  component: Outlet,
});
// const originationApplicationRoute = createRoute({
//   getParentRoute: () => originationRoute,
//   path: '/application',
//   component: LoanApplication,
// });

/* ---------- Lending Operations (layout + children) ---------- */
const operationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operations",
  component: Outlet, // or Outlet if Operations is meant to be a shell
});
const operationsBookingRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/booking",
  component: LoanAccount,
});
const operationsDisbursementRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/disbursement",
  component: LoanDisbursement,
});
const operationsRepaymentRoute = createRoute({
  getParentRoute: () => operationsRoute,
  path: "/repayment",
  component: LoanRepayment,
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
const GL_TABS: RouteTabItem[] = [
  { path: "/accounting/general-ledger/chart-of-accounts", label: "Chart Of Accounts", icon: IconHierarchy2 },
  { path: "/accounting/general-ledger/journal-entry", label: "Journal Entry", icon: IconReceipt2 },
  { path: "/accounting/general-ledger/report", label: "General Ledger Report", icon: IconFileText },
];

function GeneralLedgerTabs() {
  return <RouteTabs tabs={GL_TABS} />;
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
  component: GeneralLedger,
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
  path: '/arrears',
  component: ArrearReports,
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
  // originationRoute.addChildren([originationApplicationRoute]),
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
  
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}