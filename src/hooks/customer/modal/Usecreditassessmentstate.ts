import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchCachedCreditAssessment,
  callBureauCreditCheck,
} from "../../../api/Customer/creditAssessmentApi";
export const CREDIT_CHECK_TTL_DAYS = 30;
const TTL_MS = CREDIT_CHECK_TTL_DAYS * 24 * 60 * 60 * 1000;

export type CreditCheckStatus =
  | "idle"
  | "loading"
  | "assessed"
  | "failed"
  | "no_record";

import type {
  CreditFlag,
  CreditAssessmentResult,
} from "../../../api/Customer/creditAssessmentApi";
export type { CreditFlag, CreditAssessmentResult };

interface UseCreditAssessmentStateArgs {
  customerId: string | null;
  bureauProvider?: string;
}
export function useCreditAssessmentState({
  customerId,
  bureauProvider,
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
      const response = await callBureauCreditCheck(customerId, bureauProvider);

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
  }, [consentGiven, customerId, bureauProvider]);

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