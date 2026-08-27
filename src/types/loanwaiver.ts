export interface LoanWaiverLoanAccount {
  id: string;
  type: string;
}

export interface LoanWaiverBorrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanWaiverLoanAccount[];
}

export interface LoanWaiverFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  amountToPay: number | "";
  paymentMode: string | null;
  referenceNumber: string;
  referenceDate: string;
  accountNumber: string;
  remark: string;
  waivedInterest: number | "";
  waivedPenalty: number | "";
  waivedFee: number | "";
  _comments?: string;
}

export interface LoanWaiverEffect {
  interestOutstandingBefore: number;
  interestOutstandingAfter: number;
  penaltyOutstandingBefore: number;
  penaltyOutstandingAfter: number;
  chargesOutstandingBefore: number;
  chargesOutstandingAfter: number;
  totalOutstandingBefore: number;
  totalOutstandingAfter: number;
  arrearsBefore: number;
  arrearsAfter: number;
  remainingInstallmentsBefore: number;
  remainingInstallmentsAfter: number;
}