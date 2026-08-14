import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { showApiError, showSuccess } from "../../../utils/alert";
import {
  useAccountOptions,
  usePartyTypeOptions,
  useCustomerOptions,
  useSupplierOptions,
  lookupKeys,
} from "./Usejournalentrylookups";
import {
  useJournalEntryDetail,
  useCreateJournalEntry,
  useUpdateJournalEntry,
} from "./Usejournalentryqueries";
import { syncExchangeRates } from "./Useexchangeratesync";
import { validateJournalEntry } from "../../../utils/Accounitng/Journal-Entry/Journalentry.validation";
import {
  emptyJournalEntryForm,
  defaultJournalEntryLines,
  mapDocToFormState,
  buildJournalEntryPayload,
  parseFrappeError,
} from "../../../utils/Accounitng/Journal-Entry/Journalentry.utils";
import type {
  JournalEntryFormValues,
  JournalEntryLine,
  JournalEntryErrors,
  JournalEntryRowErrors,
} from "../../../types/Accounting/Journalentry.types";

interface UseJournalEntryFormArgs {
  entryId?: string | null;
  baseCurrency: string;
  onSuccess?: () => void;
}

export function useJournalEntryForm({
  entryId,
  baseCurrency,
  onSuccess,
}: UseJournalEntryFormArgs) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<JournalEntryFormValues>(emptyJournalEntryForm());
  const [entries, setEntries] = useState<JournalEntryLine[]>(defaultJournalEntryLines());
  const [errors, setErrors] = useState<JournalEntryErrors>({});
  const [rowErrors, setRowErrors] = useState<JournalEntryRowErrors>({});
  const [missingExchanges, setMissingExchanges] = useState<string[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);

  const { data: accountOptions = [] } = useAccountOptions();
  const { data: partyTypeOptions = [] } = usePartyTypeOptions();

  const hasCustomerRow = entries.some((e) => e.partyType === "Customer");
  const hasSupplierRow = entries.some((e) => e.partyType === "Supplier");
  const { data: customerOptions = [] } = useCustomerOptions(hasCustomerRow);
  const { data: supplierOptions = [] } = useSupplierOptions(hasSupplierRow);

  const { data: entryDoc } = useJournalEntryDetail(entryId);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const loading = createMutation.isPending || updateMutation.isPending;

  const reset = useCallback(() => {
    setForm(emptyJournalEntryForm());
    setEntries(defaultJournalEntryLines());
    setErrors({});
    setRowErrors({});
    setMissingExchanges([]);
  }, []);

useEffect(() => {
  queryClient.invalidateQueries({ queryKey: lookupKeys.accounts });
  queryClient.invalidateQueries({ queryKey: lookupKeys.partyTypes });
  queryClient.invalidateQueries({ queryKey: lookupKeys.customers });
  queryClient.invalidateQueries({ queryKey: lookupKeys.suppliers });

  if (entryId && entryDoc) {
    const { form: loadedForm, entries: loadedEntries } = mapDocToFormState(entryDoc);
    setForm(loadedForm);
    setEntries(loadedEntries);
  } else if (!entryId) {
    reset();
  }
}, [entryId, entryDoc, reset, queryClient]);

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    entries.forEach((entry) => {
      const val = Math.abs(parseFloat(entry.amount)) || 0;
      const rate = parseFloat(entry.exchange_rate) || 1;
      const baseValue = Math.round(val * rate * 100) / 100;
      if (entry.entryType === "Dr") debit += baseValue;
      else if (entry.entryType === "Cr") credit += baseValue;
    });
    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
    };
  }, [entries]);

  const runExchangeSync = useCallback(
    async (currentEntries: JournalEntryLine[], date: string, triggerIndex?: number) => {
      if (!baseCurrency || !date) return;
      setRatesLoading(true);
      try {
        const result = await syncExchangeRates(currentEntries, date, baseCurrency, triggerIndex);
        setEntries((latest) =>
          latest.map((row, i) =>
            triggerIndex === undefined || i === triggerIndex ? result.entries[i] : row
          )
        );
        setMissingExchanges(result.missingExchanges);
      } finally {
        setRatesLoading(false);
      }
    },
    [baseCurrency]
  );

  const handleFieldChange = useCallback(
    (field: keyof JournalEntryFormValues, value: JournalEntryFormValues[keyof JournalEntryFormValues]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof JournalEntryErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (field === "postingDate") {
        runExchangeSync(entries, value as string);
      }
    },
    [entries, errors, runExchangeSync]
  );

  const handleRowChange = useCallback(
    (
      index: number,
      field: keyof JournalEntryLine,
      value: string,
      extraUpdates?: Partial<JournalEntryLine>
    ) => {
      const updatedEntries = [...entries];
      let updatedRow = { ...updatedEntries[index], [field]: value };
      if (extraUpdates) updatedRow = { ...updatedRow, ...extraUpdates };
      if (field === "partyType") updatedRow.party = "";
      updatedEntries[index] = updatedRow;

      setEntries(updatedEntries);

      // Clear this row's error for the field just edited, so the red
      // outline/message disappears the moment the user fixes it — instead
      // of staying until the next full submit attempt.
      if (
        (field === "account" && value.trim()) ||
        (field === "amount" && value && parseFloat(value) > 0)
      ) {
        setRowErrors((prev) => {
          if (!prev[index]) return prev;
          const next = { ...prev[index] };
          delete next[field as "account" | "amount"];
          const updated = { ...prev };
          if (Object.keys(next).length === 0) {
            delete updated[index];
          } else {
            updated[index] = next;
          }
          return updated;
        });
      }

      if (field === "account") {
        runExchangeSync(updatedEntries, form.postingDate, index);
      }
    },
    [entries, form.postingDate, runExchangeSync]
  );

  const handleAddRow = useCallback(() => {
    setEntries((prev) => [...prev, defaultJournalEntryLines()[0]]);
  }, []);

  const handleRemoveRow = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setRowErrors((prev) => {
      const updated: JournalEntryRowErrors = {};
      Object.entries(prev).forEach(([key, val]) => {
        const i = Number(key);
        if (i < index) updated[i] = val;
        else if (i > index) updated[i - 1] = val;
        // i === index is dropped along with the removed row
      });
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const result = validateJournalEntry(form, entries, totals, missingExchanges);
    setErrors(result.fieldErrors);
    setRowErrors(result.rowErrors);
    if (!result.isValid) {
      if (result.blockingMessage) showApiError(result.blockingMessage);
      return;
    }

    const payload = buildJournalEntryPayload(form, entries);
    try {
      if (entryId) {
        await updateMutation.mutateAsync({ id: entryId, payload });
        showSuccess("Journal Entry updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Journal Entry created successfully");
      }
      reset();
      onSuccess?.();
    } catch (err) {
      showApiError(parseFrappeError(err) || "Failed to save journal entry.");
    }
  }, [form, entries, totals, missingExchanges, entryId, updateMutation, createMutation, reset, onSuccess]);

  return {
    form, entries, errors, rowErrors, totals, loading, ratesLoading,
    accountOptions, partyTypeOptions, customerOptions, supplierOptions,
    handleFieldChange, handleRowChange, handleAddRow, handleRemoveRow,
    handleSubmit, reset,
  };
}