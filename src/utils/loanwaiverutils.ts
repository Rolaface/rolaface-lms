import type { LoanWaiverEffect } from "../types/loanwaiver";

export function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function toWaiverType(field: "interest" | "penalty" | "fee") {
  if (field === "interest") return "Interest Waiver";
  if (field === "penalty") return "Penalty Waiver";
  return "Charges Waiver";
}


export function computeWaiverEffect(
  dues: any,
  waivedInterest: number,
  waivedPenalty: number,
  waivedFee: number
): LoanWaiverEffect {
  const interestDue = dues?.interest_amount ?? 0;
  const penaltyDue = dues?.penalty_amount ?? 0;
  const feeDue = dues?.total_charges_payable ?? 0;
  const principalDue = dues?.payable_principal_amount ?? 0;

  const interestWaived = Math.min(Math.max(waivedInterest, 0), interestDue);
  const penaltyWaived = Math.min(Math.max(waivedPenalty, 0), penaltyDue);
  const feeWaived = Math.min(Math.max(waivedFee, 0), feeDue);
  const totalWaived = interestWaived + penaltyWaived + feeWaived;

  const totalOutstandingBefore = principalDue + interestDue + penaltyDue + feeDue;
  const arrearsBefore = totalOutstandingBefore;

  return {
    interestOutstandingBefore: interestDue,
    interestOutstandingAfter: Math.max(interestDue - interestWaived, 0),
    penaltyOutstandingBefore: penaltyDue,
    penaltyOutstandingAfter: Math.max(penaltyDue - penaltyWaived, 0),
    chargesOutstandingBefore: feeDue,
    chargesOutstandingAfter: Math.max(feeDue - feeWaived, 0),
    totalOutstandingBefore,
    totalOutstandingAfter: Math.max(totalOutstandingBefore - totalWaived, 0),
    arrearsBefore,
    arrearsAfter: Math.max(arrearsBefore - totalWaived, 0),
    remainingInstallmentsBefore: 0,
    remainingInstallmentsAfter: 0,
  };
}