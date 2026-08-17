import { useMemo, useState } from 'react';
import { Text } from '@mantine/core';
import type { BorrowerProfile, SelectedItem } from '../../types/customerview';

// Assuming you are keeping mock data for savings/investments/FDs for now
import { getFixedDepositDetail, getInvestmentDetail, getSavingsDetail } from './mockdata';

// Import your existing Sidebar and SearchBar
import { BorrowerSidebar, GlobalSearchBar } from './Sharedui'; 
import { AccountDetailView } from './DetailViews';

// Import the brand colors from your new SharedUI file
import { brand } from '../LoanAccount/LoanView/SharedUI';

// Import your newly integrated API-driven Loan Detail View
import { LoanDetailView } from '../LoanAccount/LoanView/LoanDetailView';

/* ============================================================================
   MAIN EXPORT — Borrower360
============================================================================ */

export function Borrower360({ borrower, onBack }: { borrower: BorrowerProfile; onBack: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  
  // Default to the first loan if it exists
  const [selected, setSelected] = useState<SelectedItem | null>(
    borrower.loans[0] ? { type: 'loan', id: borrower.loans[0].id } : null
  );

  const activeContent = useMemo(() => {
    if (!selected) return null;

    // 1. REAL API-INTEGRATED LOAN VIEW
    if (selected.type === 'loan') {
      const loan = borrower.loans.find((l) => l.id === selected.id);
      if (!loan) return null;
      
      return { 
        // Notice we only pass the loanId now; the component fetches its own data
        node: <LoanDetailView loanId={loan.id} borrower={borrower} />, 
        label: `${loan.loanNumber} — ${loan.product}` 
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
    <div className="flex h-full min-h-[calc(100vh-140px)] -m-8">
      <BorrowerSidebar
        borrower={borrower}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: brand.cream }}>
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <GlobalSearchBar borrower={borrower} onSelect={setSelected} />
        </div>

        <div className="p-6">
          {activeContent ? (
            <div className="flex flex-col gap-3">
              <Text fz="xs" c="dimmed">
                Now viewing: <span className="font-semibold text-gray-700">{activeContent.label}</span>
              </Text>
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