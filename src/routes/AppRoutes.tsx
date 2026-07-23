import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '../layout/AppLayout';

// View Imports
import { Dashboard } from '../view/Dashboard';
// import { Accounting } from '../view/Accounting';
import { Application } from '../view/Application/Application';
// import { Customer } from '../view/Customer';
import { Loan } from '../view/Loan/Loan';
// import { Setting } from '../view/Setting';

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// const accountingRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '/accounting',
//   component: Accounting,
// });

const applicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/application',
  component: Application,
});

// const customerRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '/customer',
//   component: Customer,
// });

const loanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loan',
  component: Loan,
});

// const settingRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '/setting',
//   component: Setting,
// });

const routeTree = rootRoute.addChildren([
  indexRoute,
//   accountingRoute,
  applicationRoute,
//   customerRoute,
  loanRoute,
//   settingRoute,
]);

export const router = createRouter({ routeTree });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}