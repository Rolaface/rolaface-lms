import { IconCircleCheck, IconClipboardText, IconCoins } from "@tabler/icons-react";
import type { LoanAccount, LoanRepaymentFormValues, PaymentEffectResult } from "./loanRepaymentTypes";

// NOTE: business logic below is copied verbatim from the original
// LoanRepaymentModal.tsx. Nothing here changes payload shape, API calls,
// or calculation behaviour — only the file location changed.

export const PAYMENT_MODES = ["Bank Draft", "Cash", "Cheque", "Credit Card", "Wire Transfer"];

export function toRepaymentType(nature: LoanRepaymentFormValues["natureOfPayment"]) {
  return nature === "FULL_SETTLEMENT" ? "Full Settlement" : "Normal Repayment";
}

// Nature-of-payment options, each mapped to a semantic theme color key
// (success / warning / brand) and a sensible icon instead of ad-hoc styling.
// Adding/reordering options here is the only thing needed to change the
// segmented control — styling always resolves through the Mantine theme.
export const PAYMENT_NATURE_OPTIONS = [
  { label: "Pay Dues", value: "PAY_DUES", color: "success", icon: IconClipboardText },
  { label: "Pay Any", value: "PARTIAL", color: "warning", icon: IconCoins },
  { label: "Pay Full", value: "FULL_SETTLEMENT", color: "brand", icon: IconCircleCheck },
] as const;

export function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function computePaymentEffect(
  loan: LoanAccount,
  amount: number,
  nature: LoanRepaymentFormValues["natureOfPayment"]
): PaymentEffectResult {
  const amt = Math.max(0, amount || 0);

  const totalOutstandingBefore = loan.balance + loan.interestDue + loan.penalty + loan.lateFees;
  const arrearsBefore = loan.principalDue + loan.interestDue + loan.penalty + loan.lateFees;
  const principalOutstandingBefore = loan.balance;
  const interestPayableBefore = loan.interestDue;

  let remaining = amt;
  const penaltyPaid = Math.min(remaining, loan.penalty);
  remaining -= penaltyPaid;
  const feesPaid = Math.min(remaining, loan.lateFees);
  remaining -= feesPaid;
  const interestPaid = Math.min(remaining, loan.interestDue);
  remaining -= interestPaid;
  const principalPaid = Math.min(remaining, loan.balance);
  remaining -= principalPaid;

  const totalOutstandingAfter = Math.max(totalOutstandingBefore - amt, 0);
  const principalOutstandingAfter = Math.max(principalOutstandingBefore - principalPaid, 0);
  const arrearsAfter = Math.max(arrearsBefore - amt, 0);
  const interestPayableAfter = Math.max(interestPayableBefore - interestPaid, 0);

  const emiCleared =
    nature === "FULL_SETTLEMENT" || amt >= loan.principalDue + loan.interestDue + loan.penalty + loan.lateFees;
  const remainingInstallmentsBefore = loan.remainingInstallments;
  const remainingInstallmentsAfter =
    nature === "FULL_SETTLEMENT"
      ? 0
      : emiCleared
      ? Math.max(loan.remainingInstallments - 1, 0)
      : loan.remainingInstallments;

  return {
    totalOutstandingBefore,
    totalOutstandingAfter,
    principalOutstandingBefore,
    principalOutstandingAfter,
    arrearsBefore,
    arrearsAfter,
    remainingInstallmentsBefore,
    remainingInstallmentsAfter,
    interestPayableBefore,
    interestPayableAfter,
  };
}