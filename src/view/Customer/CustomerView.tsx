import { useMemo, useState } from 'react';
import { Text } from '@mantine/core';
import type { BorrowerProfile, SelectedItem } from '../../types/customerview';

// Assuming you are keeping mock data for savings/investments/FDs for now
import { getFixedDepositDetail, getInvestmentDetail, getSavingsDetail } from './mockdata';

// Import your existing Sidebar and SearchBar
import { BorrowerSidebar, GlobalSearchBar } from './Sharedui'; 
import { AccountDetailView } from './DetailViews';

// Import the brand colors from your new SharedUI file
import { themeTokens } from "../LoanAccount/LoanView/SharedUI";

// Import your newly integrated API-driven Loan Detail View
import { LoanDetailView } from '../LoanAccount/LoanView/LoanDetailView';
import { CustomerProfileView } from './Veiw-tabs/CustomerProfileView';

/* ============================================================================
   MAIN EXPORT — Borrower360
============================================================================ */

export function Borrower360({
  borrower,
  onBack,
  initialSelected,
  hideProfile = false,
}: {
  borrower: BorrowerProfile;
  onBack: () => void;
  /**
   * Lets a caller deep-link straight into a tab instead of always landing on
   * "profile" — e.g. Loan Booking's View action opens this loan directly:
   *   <Borrower360 borrower={b} onBack={...} initialSelected={{ type: 'loan', id: realLoanId }} />
   */
  initialSelected?: SelectedItem;
  /**
   * When true, hides the "Profile" nav item from the sidebar entirely.
   * Used by Loan Booking's View flow, which has no customer-profile
   * context and should only show Loans/Investments/Savings/FDs.
   */
  hideProfile?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Default to the first loan if it exists
  const [selected, setSelected] = useState<SelectedItem>(initialSelected ?? { type: 'profile' });
  const activeContent = useMemo(() => {
    if (!selected) return null;
    if (selected.type === 'profile') {
      return {
        node: <CustomerProfileView borrower={borrower} />,
        label: 'Customer Profile',
      };
    }

    // 1. REAL API-INTEGRATED LOAN VIEW
    if (selected.type === 'loan') {
      // Try to enrich the label from the mock loans list, but don't require
      // a match — the id here is often a real API loan id (e.g. coming from
      // Loan Booking's "View" action) that won't exist in the mock array.
      // LoanDetailView only needs the id itself; it fetches everything else.
      const loan = borrower.loans.find((l) => l.id === selected.id);

      return {
        // Notice we only pass the loanId now; the component fetches its own data
        node: <LoanDetailView loanId={selected.id} borrower={borrower} />,
        label: loan ? `${loan.loanNumber} — ${loan.product}` : selected.id,
      };
    }

    // 2. MOCK VIEWS (Investments, Savings, Fixed Deposits)
    if (selected.type === 'investment') {
      const inv = borrower.investments.find((i) => i.id === selected.id);
      if (!inv) return null;
      return {
        node: <AccountDetailView title={inv.product} detail={getInvestmentDetail(inv)} borrower={borrower} />,
        label: `${inv.refNumber} — ${inv.product}`,
      };
    }

    if (selected.type === 'savings') {
      const sav = borrower.savings.find((s) => s.id === selected.id);
      if (!sav) return null;
      return {
        node: <AccountDetailView title="Flexi Save Account" detail={getSavingsDetail(sav)} borrower={borrower} />,
        label: `${sav.accountNumber} — Savings account`,
      };
    }

    if (selected.type === 'fixedDeposit') {
      const fd = borrower.fixedDeposits.find((f) => f.id === selected.id);
      if (!fd) return null;
      return {
        node: <AccountDetailView title="Fixed Deposit" detail={getFixedDepositDetail(fd)} borrower={borrower} />,
        label: `${fd.refNumber} — Fixed deposit`,
      };
    }

    return null;
  }, [selected, borrower]);

  return (
    <div className="flex h-full min-h-screen">
      <BorrowerSidebar
        borrower={borrower}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
        selected={selected}
        onSelect={setSelected}
        hideProfile={hideProfile}
      />

      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: themeTokens.surface }}>
        <div className="p-3">
          {activeContent ? (
            <div className="flex flex-col gap-3">
              {activeContent.node}
            </div>
          ) : (
            <Text c="dimmed" fz="sm">
              Select a loan, investment, or account from the panel to view details.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}