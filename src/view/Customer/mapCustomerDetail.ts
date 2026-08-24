import type { BorrowerProfile, LoanSummary } from "../../types/customerview";
import type { CustomerDetailRaw } from "../../api/Customer/customerApi";
import type { LoanRaw } from "../../hooks/customer/Detail/useCustomerLoans";

export function mapCustomerDetailToBorrowerProfile(
  raw: CustomerDetailRaw
): BorrowerProfile {
  return {
    customerId: raw.name,
    name: raw.customer_name,
    custId: raw.name,
    status: raw.status.toLowerCase() === "active" ? "Active" : "Inactive",
    mobile: raw.mobile_no,
  };
}

export function mapLoanRawToLoanSummary(raw: LoanRaw): LoanSummary {
  const repaidPercent =
    raw.loan_amount > 0
      ? Math.round((raw.total_principal_paid / raw.loan_amount) * 100)
      : 0;

  return {
    id: raw.name,
    loanNumber: raw.name,
    product: raw.loan_product,
    outstanding: raw.pending_principal_amount,
    nextInstallment: null,
    repaidPercent,
  };
}