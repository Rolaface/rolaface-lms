import { useMemo, useState, useEffect } from "react";
import { Text, Loader, Center } from "@mantine/core";
import type { BorrowerProfile, SelectedItem, LoanSummary } from "../../types/customerview";

import {
  getFixedDepositDetail,
  getInvestmentDetail,
  getSavingsDetail,
} from "./mockdata";

import { BorrowerSidebar, GlobalSearchBar } from "./Sharedui";
import { AccountDetailView } from "./DetailViews";

import { themeTokens } from "../LoanAccount/LoanView/SharedUI";

import { LoanDetailView } from "../LoanAccount/LoanView/LoanDetailView";
import { CustomerProfileView } from "./Veiw-tabs/CustomerProfileView";
import { getLoanList } from "../../api/lookup api/lookUpApi";
import { mapLoanRawToLoanSummary } from "./mapCustomerDetail";

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
  initialSelected?: SelectedItem;
  hideProfile?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // The single loan currently being viewed (fetched fresh by id — works
  // even for a real API loan id that isn't in `customerLoans` yet, e.g.
  // deep-linked from Loan Booking's "View" action).
  const [selectedLoanData, setSelectedLoanData] = useState<LoanSummary | null>(
    null,
  );
  const [selectedLoanLoading, setSelectedLoanLoading] = useState(false);

  const [selected, setSelected] = useState<SelectedItem>(
    initialSelected ?? { type: "profile" },
  );

  // All loans for this customer — powers the sidebar list.
  const [customerLoans, setCustomerLoans] = useState<LoanSummary[]>([]);

  useEffect(() => {
    if (selected?.type !== "loan") {
      setSelectedLoanData(null);
      return;
    }

    let cancelled = false;
    setSelectedLoanLoading(true);

    getLoanList({
      search: selected.id,
    })
      .then((response: any) => {
        if (cancelled) return;
        const loans = response?.data?.data ?? response?.data ?? [];
        const raw = loans[0] ?? null;
        setSelectedLoanData(raw ? mapLoanRawToLoanSummary(raw) : null);
      })
      .catch(() => {
        if (!cancelled) setSelectedLoanData(null);
      })
      .finally(() => {
        if (!cancelled) setSelectedLoanLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!borrower.customerId) {
      setCustomerLoans([]);
      return;
    }

    let cancelled = false;

    getLoanList({
      applicant: [borrower.customerId],
    })
      .then((response: any) => {
        if (cancelled) return;
        const loans = response?.data?.data ?? response?.data ?? [];
        setCustomerLoans(loans.map(mapLoanRawToLoanSummary));
      })
      .catch(() => {
        if (!cancelled) setCustomerLoans([]);
      });

    return () => {
      cancelled = true;
    };
  }, [borrower.customerId]);

  const activeContent = useMemo(() => {
    if (!selected) return null;

    if (selected.type === "profile") {
      return {
        node: (
          <CustomerProfileView
            borrower={{ ...borrower, loans: customerLoans }}
          />
        ),
        label: "Customer Profile",
      };
    }

    // LOAN — fixed: LoanDetailView takes `loan` (a LoanSummary), not
    // `loanId`. Prefer the dedicated fetch (selectedLoanData); fall back
    // to the sidebar list if that hasn't resolved yet.
    if (selected.type === "loan") {
      const loan =
        selectedLoanData ??
        customerLoans.find((l) => l.id === selected.id) ??
        null;

      if (!loan) {
        return {
          node: selectedLoanLoading ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : (
            <Text c="dimmed" fz="sm">
              Loan not found.
            </Text>
          ),
          label: selected.id,
        };
      }

      return {
        node: <LoanDetailView loan={loan} borrower={borrower} />,
        label: `${loan.loanNumber} — ${loan.product}`,
      };
    }

    if (selected.type === "investment") {
      const inv = borrower.investments?.find((i) => i.id === selected.id);
      if (!inv) return null;
      return {
        node: (
          <AccountDetailView
            title={inv.product}
            detail={getInvestmentDetail(inv)}
            borrower={borrower}
          />
        ),
        label: `${inv.refNumber} — ${inv.product}`,
      };
    }

    if (selected.type === "savings") {
      const sav = borrower.savings?.find((s) => s.id === selected.id);
      if (!sav) return null;
      return {
        node: (
          <AccountDetailView
            title="Flexi Save Account"
            detail={getSavingsDetail(sav)}
            borrower={borrower}
          />
        ),
        label: `${sav.accountNumber} — Savings account`,
      };
    }

    if (selected.type === "fixedDeposit") {
      const fd = borrower.fixedDeposits?.find((f) => f.id === selected.id);
      if (!fd) return null;
      return {
        node: (
          <AccountDetailView
            title="Fixed Deposit"
            detail={getFixedDepositDetail(fd)}
            borrower={borrower}
          />
        ),
        label: `${fd.refNumber} — Fixed deposit`,
      };
    }

    return null;
  }, [selected, borrower, customerLoans, selectedLoanData, selectedLoanLoading]);

  return (
    <div className="flex h-full min-h-screen">
      <BorrowerSidebar
        borrower={{ ...borrower, loans: customerLoans }}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
        selected={selected}
        onSelect={setSelected}
        hideProfile={hideProfile}
      />

      <div
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ backgroundColor: themeTokens.surface }}
      >
        <div className="p-3">
          {activeContent ? (
            <div className="flex flex-col gap-3">{activeContent.node}</div>
          ) : (
            <Text c="dimmed" fz="sm">
              Select a loan, investment, or account from the panel to view
              details.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}