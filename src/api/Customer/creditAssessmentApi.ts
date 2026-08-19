import apiClient from "../../config/axios";
// TODO: import { API } from "../../config/api" once creditAssessment endpoints exist there

const api = apiClient;
void api; // TODO: remove once real calls replace the dummy bodies below

export interface CreditFlag {
  label: string;
  value: string;
}

export interface CreditAssessmentResult {
  score: number;
  bureau: string;
  fetchedAt: string; // ISO timestamp
  referenceId: string;
  flags: CreditFlag[];
}

export type BureauCallResponse =
  | { outcome: "success"; result: CreditAssessmentResult }
  | { outcome: "no_record" }
  | { outcome: "error"; message: string };

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
): Promise<BureauCallResponse> {
  // Real version: POST /api/customers/:id/credit-assessment/run
  await new Promise((res) => setTimeout(res, 1200));
  return {
    outcome: "success",
    result: {
      score: 451,
      bureau: "TransUnion Zambia",
      fetchedAt: new Date().toISOString(),
      referenceId: `TU-${customerId}-${Date.now()}`,
      flags: [
        { label: "Active Facilities", value: "2" },
        { label: "Defaults", value: "0" },
        { label: "Delinquencies", value: "1 flagged" },
        { label: "Recent Inquiries", value: "3 (90d)" },
      ],
    },
  };
}