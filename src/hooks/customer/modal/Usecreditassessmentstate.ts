import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCreditAssessmentState
 * ------------------------------------------------------------------
 * Owns all state for the Credit Assessment card, including consent.
 * Consent is captured HERE (on the card itself) rather than on the
 * KYC step, because in this app's actual step order Financial &
 * Lending (index 3) comes BEFORE KYC (index 4) — gating on a
 * not-yet-visited step would make the check permanently unrunnable
 * on first pass through the wizard.
 *
 * Called once in CustomerModal (same pattern as useKycState,
 * useFinancialBorrowerState, etc.) so state survives step navigation.
 *
 * Auto-fetch policy — the important part:
 *   - `loadCachedResult()` runs once on mount. Read-only — pulls
 *     whatever result already exists for this customer, never calls
 *     the bureau.
 *   - `runCheck()` / `refreshCheck()` are the ONLY paths that hit the
 *     bureau, both gated on explicit click + consent, and guarded
 *     against duplicate/concurrent calls (bureau pulls are typically
 *     billed per pull in production).
 * ------------------------------------------------------------------
 */

export const CREDIT_CHECK_TTL_DAYS = 30;
const TTL_MS = CREDIT_CHECK_TTL_DAYS * 24 * 60 * 60 * 1000;

export type CreditCheckStatus =
  | "idle"
  | "loading"
  | "assessed"
  | "failed"
  | "no_record";

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

interface UseCreditAssessmentStateArgs {
  customerId: string | null;
}

export function useCreditAssessmentState({
  customerId,
}: UseCreditAssessmentStateArgs) {
  const [status, setStatus] = useState<CreditCheckStatus>("idle");
  const [result, setResult] = useState<CreditAssessmentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(
    null,
  );

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    (async () => {
      const cached = await fetchCachedCreditAssessment(customerId);
      if (cancelled) return;
      if (cached) {
        setResult(cached);
        setStatus("assessed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const isExpired =
    status === "assessed" && result
      ? Date.now() - new Date(result.fetchedAt).getTime() > TTL_MS
      : false;

  const handleSetConsentGiven = useCallback((v: boolean) => {
    setConsentGiven(v);
    setConsentTimestamp(v ? new Date().toISOString() : null);
  }, []);

  const runBureauCall = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!consentGiven) return;
    if (!customerId) return;

    inFlightRef.current = true;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await callBureauCreditCheck(customerId);

      if (response.outcome === "no_record") {
        setStatus("no_record");
        setResult(null);
      } else if (response.outcome === "success") {
        setResult(response.result);
        setStatus("assessed");
      } else {
        setStatus("failed");
        setErrorMessage(response.message);
      }
    } catch (err) {
      setStatus("failed");
      setErrorMessage("Bureau request failed. Please try again.");
    } finally {
      inFlightRef.current = false;
    }
  }, [consentGiven, customerId]);

  const runCheck = runBureauCall;
  const refreshCheck = runBureauCall;

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
    setConsentGiven(false);
    setConsentTimestamp(null);
  }, []);

  return {
    status,
    result,
    errorMessage,
    isExpired,
    consentGiven,
    consentTimestamp,
    setConsentGiven: handleSetConsentGiven,
    runCheck,
    refreshCheck,
    reset,
  };
}

/* ------------------------------------------------------------------
 * API layer (dummy). Replace bodies with real calls, keep signatures.
 * ---------------------------------------------------------------- */

async function fetchCachedCreditAssessment(
  customerId: string,
): Promise<CreditAssessmentResult | null> {
  // Real version: GET /api/customers/:id/credit-assessment
  // Own-DB read only — never a bureau call.
  void customerId;
  return null;
}

type BureauCallResponse =
  | { outcome: "success"; result: CreditAssessmentResult }
  | { outcome: "no_record" }
  | { outcome: "error"; message: string };

async function callBureauCreditCheck(
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