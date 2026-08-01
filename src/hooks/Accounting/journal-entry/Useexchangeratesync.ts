import { getExchangeRateFor } from "../../../api/lookup api/Journalentrylookup.api";
import type { JournalEntryLine } from "../../../types/Accounting/Journalentry.types";

export interface ExchangeRateSyncResult {
  entries: JournalEntryLine[];
  missingExchanges: string[];
}

/**
 * Refreshes exchange_rate / isRateMissing on one row (triggerIndex) or all
 * rows (no triggerIndex).
 *
 *  1. Same-currency-as-base rows are always rate = 1, no lookup.
 *  2. Ask erpnext.setup.utils.get_exchange_rate for the rate on the
 *     posting date.
 *  3. If no rate is resolved (0 / null / request fails), the row is
 *     flagged isRateMissing and its currency pair is added to
 *     `missingExchanges` (which blocks submission). There is no
 *     "confirm stale fallback rate" step any more — the endpoint
 *     doesn't tell us what date a fallback rate would be from, so we
 *     can no longer show that prompt honestly.
 */
export const syncExchangeRates = async (
  entries: JournalEntryLine[],
  date: string,
  baseCurrency: string,
  triggerIndex?: number
): Promise<ExchangeRateSyncResult> => {
  const newEntries = [...entries];
  const missingExchanges = new Set<string>();

  const processRow = async (index: number) => {
    const row = newEntries[index];
    const ccy = row.ccy;
    if (!ccy) return;

    if (ccy === baseCurrency) {
      row.exchange_rate = "1";
      row.isRateMissing = false;
      return;
    }

    try {
      const rate = await getExchangeRateFor(ccy, baseCurrency, date, "for_buying");

      if (rate !== null) {
        row.exchange_rate = rate.toString();
        row.isRateMissing = false;
      } else {
        row.exchange_rate = "";
        row.isRateMissing = true;
        missingExchanges.add(`${ccy} to ${baseCurrency}`);
      }
    } catch (error) {
      console.error("Exchange rate fetch failed:", error);
      row.exchange_rate = "";
      row.isRateMissing = true;
      missingExchanges.add(`${ccy} to ${baseCurrency}`);
    }
  };

  if (triggerIndex !== undefined) {
    await processRow(triggerIndex);
  } else {
    for (let i = 0; i < newEntries.length; i++) {
      await processRow(i);
    }
  }

  return { entries: newEntries, missingExchanges: Array.from(missingExchanges) };
};