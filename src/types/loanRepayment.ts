// Shared types used across the LoanRepayment component split.
// Extracted from the original LoanRepaymentModal.tsx without any logic changes.

export interface LoanAccount {
  id: string;
  type: string;
  balance: number;
  emiDate: string;
  principalDue: number;
  interestDue: number;
  penalty: number;
  lateFees: number;
  remainingInstallments: number;
}

export interface Borrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanAccount[];
}

export interface LoanRepaymentFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  natureOfPayment: "PAY_DUES" | "PARTIAL" | "FULL_SETTLEMENT";
  amountToPay: number | "";
  paymentMode: string | null;
  referenceNumber: string;
  referenceDate: string;
  accountNumber: string;
  remark: string;
}

// The actual shape returned by useForm()'s initialValues in LoanRepaymentModal.tsx.
export type LoanRepaymentFormValues = Omit<LoanRepaymentFormData, "loanAc" | "customerName" | "loanType">;

// Shape of `duesResponse?.message` returned by getLoanDues.
// Kept optional/loose on purpose since the fields come from the API layer
// (api/loanRepaymentApi.ts) which this refactor does not touch.
export interface LoanDuesSummary {
  due_date?: string;
  payable_principal_amount?: number;
  interest_amount?: number;
  penalty_amount?: number;
  total_charges_payable?: number;
  payable_amount?: number;
}

export interface PaymentEffectResult {
  totalOutstandingBefore: number;
  totalOutstandingAfter: number;
  principalOutstandingBefore: number;
  principalOutstandingAfter: number;
  arrearsBefore: number;
  arrearsAfter: number;
  remainingInstallmentsBefore: number;
  remainingInstallmentsAfter: number;
  interestPayableBefore: number;
  interestPayableAfter: number;
}