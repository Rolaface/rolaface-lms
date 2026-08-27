import apiClient from "../../config/axios";
// TODO: import { API } from "../../config/api" once creditAssessment endpoints exist there

const api = apiClient;
void api; // TODO: remove once real calls replace the dummy bodies below

export interface CreditFlag {
  label: string;
  value: string;
}

export interface BureauFacility {
  institution: string;
  facilityType: string;
  outstandingAmount: number;
  monthlyPayment: number;
  accountStatus: string;
}

export interface CreditAssessmentResult {
  score: number;
  bureau: string;
  fetchedAt: string; // ISO timestamp
  referenceId: string;
  flags: CreditFlag[];
  riskBand: string;
  activeAccounts: number;
  delinquentAccounts: number;
  totalOutstanding: number;
  monthlyObligations: number;
  recentEnquiries: number;
  existingFacilities: BureauFacility[];
}

export type BureauCallResponse =
  | { outcome: "success"; result: CreditAssessmentResult }
  | { outcome: "no_record" }
  | { outcome: "error"; message: string };

export const BUREAU_PROVIDERS = ["TransUnion Zambia", "Metropol", "CRB Africa"];

/* ───────────────── Moved from Usecreditassessmentstate.ts — same signatures/bodies ─────────────────
   TODO: backend not ready. Replace bodies, keep signatures — the state
   hook imports these, so it doesn't need to change when real calls land. */

export async function fetchCachedCreditAssessment(
  customerId: string,
): Promise<CreditAssessmentResult | null> {
  // Real version: GET /api/customers/:id/credit-assessment (own-DB read, never hits bureau)
  void customerId;
  return null;
}

export async function callBureauCreditCheck(
  customerId: string,
  provider: string = "TransUnion Zambia",
): Promise<BureauCallResponse> {
  // Real version: POST /api/customers/:id/credit-assessment/run { provider }
  await new Promise((res) => setTimeout(res, 1200));
  return {
    outcome: "success",
    result: {
      score: 451,
      bureau: provider,
      fetchedAt: new Date().toISOString(),
      referenceId: `TU-${customerId}-${Date.now()}`,
      flags: [
        { label: "Active Facilities", value: "2" },
        { label: "Defaults", value: "0" },
        { label: "Delinquencies", value: "1 flagged" },
        { label: "Recent Inquiries", value: "3 (90d)" },
      ],
      riskBand: "Medium",
      activeAccounts: 2,
      delinquentAccounts: 1,
      totalOutstanding: 18500,
      monthlyObligations: 1200,
      recentEnquiries: 3,
      existingFacilities: [
        {
          institution: "Zanaco",
          facilityType: "Personal Loan",
          outstandingAmount: 12500,
          monthlyPayment: 850,
          accountStatus: "Active",
        },
        {
          institution: "Absa",
          facilityType: "Credit Card",
          outstandingAmount: 6000,
          monthlyPayment: 350,
          accountStatus: "Active",
        },
      ],
    },
  };
}