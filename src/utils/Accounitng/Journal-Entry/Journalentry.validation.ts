import type {
  JournalEntryErrors,
  JournalEntryFormValues,
  JournalEntryLine,
  JournalEntryRowErrors,
  JournalEntryTotals,
} from "../../../types/Accounting/Journalentry.types";
import { round2 } from "../../../utils/Accounitng/Journal-Entry/Journalentry.utils";

export interface JournalEntryValidationResult {
  isValid: boolean;
  fieldErrors: JournalEntryErrors;
  rowErrors: JournalEntryRowErrors;

  blockingMessage?: string;
}

export const validateJournalEntry = (
  form: JournalEntryFormValues,
  entries: JournalEntryLine[],
  totals: JournalEntryTotals,
  missingExchanges: string[]
): JournalEntryValidationResult => {
  const fieldErrors: JournalEntryErrors = {};
  const rowErrors: JournalEntryRowErrors = {};

  if (!form.postingDate) fieldErrors.postingDate = "Posting Date is required";

  if (form.voucher_type === "Bank Entry") {
    if (!form.cheque_no.trim()) fieldErrors.cheque_no = "Reference Number is required";
    if (!form.cheque_date.trim()) fieldErrors.cheque_date = "Reference Date is required";
  }


  entries.forEach((entry, index) => {
    const rowErr: { account?: string; amount?: string } = {};

    if (!entry.account.trim()) {
      rowErr.account = "Account is required";
    }

    const amountVal = parseFloat(entry.amount);
    if (!entry.amount || isNaN(amountVal) || amountVal <= 0) {
      rowErr.amount = "Amount is required";
    }

    if (Object.keys(rowErr).length > 0) {
      rowErrors[index] = rowErr;
    }
  });


  const validRowCount = entries.filter((e) => e.account.trim()).length;
  if (validRowCount < 2) {
    entries.forEach((entry, index) => {
      if (!entry.account.trim() && !rowErrors[index]?.account) {
        rowErrors[index] = { ...rowErrors[index], account: "Account is required" };
      }
    });
  }

  const hasFieldOrRowErrors =
    Object.keys(fieldErrors).length > 0 || Object.keys(rowErrors).length > 0;

  if (hasFieldOrRowErrors) {
    return { isValid: false, fieldErrors, rowErrors };
  }

  const diff = round2(Math.abs(totals.debit - totals.credit));
  if (diff > 0.01) {
    return {
      isValid: false,
      fieldErrors,
      rowErrors,
      blockingMessage: `Total Debit (${totals.debit.toFixed(2)}) must equal Total Credit (${totals.credit.toFixed(
        2
      )}). Difference is ${diff.toFixed(2)}`,
    };
  }

  if (missingExchanges.length > 0) {
    return {
      isValid: false,
      fieldErrors,
      rowErrors,
      blockingMessage: `Cannot proceed. No currency exchange rate could be resolved for: ${missingExchanges.join(", ")}`,
    };
  }

  return { isValid: true, fieldErrors, rowErrors };
};