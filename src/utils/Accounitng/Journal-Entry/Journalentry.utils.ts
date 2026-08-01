import type {
  JournalEntryFormValues,
  JournalEntryLine,
  SelectOption,
} from "../../../types/Accounting/Journalentry.types";
import type {
  JournalEntryPayload,
  JournalEntryAccountPayload,
} from "../../../api/Accounting/Journalentries.api";

/** Default header form values for a brand-new entry */
export const emptyJournalEntryForm = (): JournalEntryFormValues => ({
  postingDate: new Date().toISOString().split("T")[0],
  isOpening: false,
  voucher_type: "Journal Entry",
  cheque_no: "",
  cheque_date: "",
  remarks: "",
});

/**
 * Default shape for a single entry line.
 * exchange_rate starts EMPTY, not "1" — syncExchangeRates is the single
 * source of truth for this field once an account/currency is picked.
 * Hardcoding "1" here made every new row look "resolved" before any
 * currency was even selected, which masked missing-rate rows.
 */
export const emptyJournalEntryLine = (): JournalEntryLine => ({
  account: "",
  ccy: "",
  entryType: "Dr",
  amount: "",
  partyType: "",
  party: "",
  voucher_type: "",
  exchange_rate: "",
  remark: "",
});

/** Two starter rows (one Dr, one Cr) used whenever the form is reset/new */
export const defaultJournalEntryLines = (): JournalEntryLine[] => [
  { ...emptyJournalEntryLine(), entryType: "Dr" },
  { ...emptyJournalEntryLine(), entryType: "Cr" },
];

/**
 * Normalizes the many possible response shapes frappe-style endpoints can
 * return into a flat { label, value, currency } option list. Mirrors the
 * old project's `mapOptions` exactly.
 */
export const mapOptions = (res: any): SelectOption[] => {
  const data =
    res?.data?.message?.data ||
    res?.data?.message ||
    res?.data?.data ||
    res?.message?.data ||
    res?.data ||
    res ||
    [];

  return Array.isArray(data)
    ? data.map((item: any) => {
        const optionValue = item.value || item.name || item.currency_name || "Unknown";
        const optionLabel = item.label || item.name || item.currency_name || optionValue;
        return {
          label: optionLabel,
          value: optionValue,
          currency: item.account_currency || "",
        };
      })
    : [];
};

/** Extracts a readable message from a frappe-style error response */
export const parseFrappeError = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return err?.message || "An unknown error occurred.";

  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages);
      if (messages.length > 0) {
        const msgObj = JSON.parse(messages[0]);
        if (msgObj.message) return msgObj.message;
      }
    } catch (e) {
      console.error("Failed to parse _server_messages", e);
    }
  }

  if (data.exception) {
    const parts = String(data.exception).split(":");
    if (parts.length > 1) return parts.slice(1).join(":").trim();
    return data.exception;
  }

  return data.message || err?.message || "An error occurred.";
};

/** Maps a loaded doc (edit/view) into { form, entries } state */
export const mapDocToFormState = (doc: any) => {
  const form: JournalEntryFormValues = {
    postingDate: doc.postingDate || doc.posting_date,
    isOpening: doc.isOpening || doc.is_opening === "Yes",
    voucher_type: doc.voucher_type || doc.voucherType || "Journal Entry",
    cheque_date: doc.cheque_date || doc.chequeDate || "",
    cheque_no: doc.cheque_no || doc.chequeNo || "",
    remarks: doc.user_remark || "",
  };

  let entries: JournalEntryLine[] = defaultJournalEntryLines();

  if (doc.accounts && Array.isArray(doc.accounts)) {
    const loadedEntries: JournalEntryLine[] = doc.accounts.map((acc: any): JournalEntryLine => {
      const debit = acc.debit_in_account_currency || acc.debit || 0;
      const credit = acc.credit_in_account_currency || acc.credit || 0;
      const isDebit = debit > 0;
      const amountVal = isDebit ? debit : credit;

      return {
        name: acc.name,
        account: acc.account || "",
        ccy: acc.account_currency || acc.currency || "",
        entryType: isDebit ? "Dr" : "Cr",
        amount: amountVal.toString(),
        partyType: acc.party_type || acc.partyType || "",
        voucher_type: acc.voucher_type || acc.voucherType || "",
        party: acc.party || "",
        exchange_rate: (acc.exchange_rate || acc.exchangeRate || 1).toString(),
        remark: acc.user_remark || acc.remark || "",
      };
    });

    entries = loadedEntries.length > 0 ? loadedEntries : defaultJournalEntryLines();
  }

  return { form, entries };
};

/** Rounds to 2 decimal places, guarding against JS float artifacts */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Builds the create/update payload exactly as the old project did */
export const buildJournalEntryPayload = (
  form: JournalEntryFormValues,
  entries: JournalEntryLine[]
): JournalEntryPayload => {
  const validEntries = entries.filter((e) => e.account.trim() !== "");

  const accounts: JournalEntryAccountPayload[] = validEntries.map((entry) => {
    const val = Math.abs(parseFloat(entry.amount)) || 0;
    return {
      ...(entry.name ? { name: entry.name } : {}),
      account: entry.account,
      account_currency: entry.ccy || undefined,
      exchange_rate: parseFloat(entry.exchange_rate) || 1,
      debit_in_account_currency: entry.entryType === "Dr" ? val : 0,
      credit_in_account_currency: entry.entryType === "Cr" ? val : 0,
      party_type: entry.partyType || undefined,
      party: entry.party || undefined,
      user_remark: entry.remark || undefined,
    };
  });

  return {
    posting_date: form.postingDate,
    is_opening: form.isOpening ? "Yes" : "No",
    user_remark: form.remarks.trim(),
    voucher_type: form.voucher_type || undefined,
    cheque_no: form.cheque_no || undefined,
    cheque_date: form.cheque_date || undefined,
    multi_currency: 1,
    accounts,
  } as JournalEntryPayload;
};