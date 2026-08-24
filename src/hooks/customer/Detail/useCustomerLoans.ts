import { useQuery } from "@tanstack/react-query";
import { getLoanList } from "../../../api/lookup api/lookUpApi";

export interface LoanRaw {
  name: string;
  applicant: string;
  applicant_name: string | null;
  loan_product: string;
  loan_amount: number;
  total_payment: number;
  total_interest_payable: number;
  total_principal_paid: number;
  total_amount_paid: number;
  pending_principal_amount: number;
}

interface GetLoansEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: LoanRaw[];
  pagination: {
    page: number;
    page_size: number;
    items_in_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export function useCustomerLoans(applicant: string | null) {
  return useQuery({
    queryKey: ["customerLoans", applicant],
    queryFn: async () => {
      const response = (await getLoanList({
        applicant: JSON.stringify([applicant]),
      })) as GetLoansEnvelope;
      return response.data;
    },
    enabled: !!applicant,
    staleTime: 60_000,
  });
}