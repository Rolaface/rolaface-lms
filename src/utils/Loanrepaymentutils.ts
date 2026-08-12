import { IconCircleCheck, IconClipboardText, IconCoins } from "@tabler/icons-react";
import type { LoanAccount, LoanRepaymentFormValues, PaymentEffectResult } from "../types/loanRepayment";


export const PAYMENT_MODES = ["Bank Draft", "Cash", "Cheque", "Credit Card", "Wire Transfer"];


const NATURE_VALUES = ["PAY_DUES", "PARTIAL", "FULL_SETTLEMENT"] as const;
type NatureOfPayment = (typeof NATURE_VALUES)[number];

export function fromRepaymentType(
  repaymentType: string | null | undefined
): NatureOfPayment | undefined {
  return NATURE_VALUES.find((n) => toRepaymentType(n) === repaymentType);
}

export function toRepaymentType(nature: LoanRepaymentFormValues["natureOfPayment"]) {
  if (nature === "FULL_SETTLEMENT") return "Full Settlement";
  if (nature === "PARTIAL") return "Pre Payment"; 
  return "Normal Repayment";
}

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