import { Box, Text, ActionIcon, Modal, Button, Group } from "@mantine/core";
import {
  IconX,
  IconFileText,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

import JournalEntryBasicInfo from "./JournalEntryBasicInfo";
import JournalEntryLinesTable from "./JournalEntryLinesTable";
import { useJournalEntryForm } from "../../../hooks/Accounting/journal-entry/useJournalEntryForm";

import type { JournalEntryModalProps as BaseModalProps } from "../../../types/Accounting/Journalentry.types";

interface JournalEntryModalProps extends BaseModalProps {
  baseCurrency: string;
}

export default function JournalEntryModal({
  opened,
  onClose,
  onSuccess,
  entryId,
  isReadOnly = false,
  baseCurrency,
}: JournalEntryModalProps) {
  const {
    form,
    entries,
    errors,
    rowErrors,
    totals,
    loading,
    accountOptions,
    partyTypeOptions,
    customerOptions,
    supplierOptions,
    handleFieldChange,
    handleRowChange,
    handleAddRow,
    handleRemoveRow,
    handleSubmit,
    reset,
  } = useJournalEntryForm({
    opened,
    entryId,
    baseCurrency,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const headerTitle = isReadOnly
    ? `View Entry: ${entryId}`
    : entryId
      ? `Edit Entry: ${entryId}`
      : "New Journal Entry";

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const difference = Math.abs(totals.debit - totals.credit);
  const balanced = difference < 0.01;

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="1300px"
      withCloseButton={false}
      padding={0}
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      styles={{
        content: {
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box
        className="flex flex-col h-full bg-white"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box className="flex justify-between items-center px-6 py-4 shrink-0 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
              <IconFileText size={17} className="text-white" />
            </div>
            <div>
              <Text size="lg" fw={700} className="text-slate-800 leading-tight">
                {headerTitle}
              </Text>
              <Text size="xs" className="text-slate-500">
                {isReadOnly
                  ? "Viewing journal entry details"
                  : entryId
                    ? "Update existing manual journal entry"
                    : "Create a new manual journal entry record"}
              </Text>
            </div>
          </div>
          <ActionIcon
            type="button"
            variant="subtle"
            color="gray"
            radius="md"
            size="lg"
            onClick={handleModalClose}
            aria-label="Close"
          >
            <IconX size={20} />
          </ActionIcon>
        </Box>

        {/* Body: main + right sidebar (totals only) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-h-0 min-w-0">
            <fieldset
              disabled={isReadOnly}
              className="border-0 p-0 m-0 space-y-6 min-w-0"
            >
              <JournalEntryBasicInfo
                form={form}
                errors={errors}
                isReadOnly={isReadOnly}
                onFieldChange={handleFieldChange}
              />

              <JournalEntryLinesTable
                rows={entries}
                accountOptions={accountOptions}
                partyTypeOptions={partyTypeOptions}
                customerOptions={customerOptions}
                supplierOptions={supplierOptions}
                isReadOnly={isReadOnly}
                rowErrors={rowErrors}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                onRowChange={handleRowChange}
              />
            </fieldset>
          </main>

          {/* Right sidebar: entry summary */}
          <aside className="w-full max-w-[220px] min-w-[220px] shrink-0 border-l border-gray-100 bg-gray-50 p-5 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  className="text-indigo-600 tracking-wider"
                >
                  Entry Summary
                </Text>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">Voucher Type</span>
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                    {form.voucher_type}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">Posting Date</span>
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                    {form.postingDate
                      ? new Date(form.postingDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">Opening Entry</span>
                  <span className="text-xs font-bold text-gray-900">
                    {form.isOpening ? "Yes" : "No"}
                  </span>
                </div>

                <div className="border-t border-gray-100" />

                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-indigo-600 font-medium">
                    Total Line Entries
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {entries.length}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">Debit</span>
                  <span
                    className="text-xs font-bold text-gray-900"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {totals.debit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">Credit</span>
                  <span
                    className="text-xs font-bold text-gray-900"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {totals.credit.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Status</span>
                  <span
                    className={`flex items-center gap-1 text-xs font-bold ${
                      balanced ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {balanced ? (
                      <IconCheck size={12} stroke={3} />
                    ) : (
                      <IconX size={12} stroke={3} />
                    )}
                    {balanced ? "Balanced" : "Unbalanced"}
                  </span>
                </div>
              </div>
            </div>

            {!isReadOnly && !entryId && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <IconInfoCircle size={12} className="text-indigo-500 shrink-0" />
                  <Text size="xs" fw={700} className="text-indigo-600">
                    Draft Status
                  </Text>
                </div>
                <Text size="xs" className="text-indigo-500 leading-snug">
                  This entry will be saved as a draft and won't affect the
                  ledger until submitted.
                </Text>
              </div>
            )}
          </aside>
        </div>

        {/* Footer: actions */}
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex justify-end items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
          <Group gap="xs">
            <Button
              type="button"
              size="sm"
              variant="default"
              radius="md"
              onClick={handleModalClose}
              className="font-semibold px-5 border-slate-200"
            >
              {isReadOnly ? "Close" : "Cancel"}
            </Button>

            {!isReadOnly && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  radius="md"
                  onClick={reset}
                  className="font-semibold px-5 border-slate-200"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  radius="md"
                  color="indigo"
                  loading={loading}
                  leftSection={<IconCheck size={16} />}
                  onClick={handleSubmit}
                  className="font-semibold px-6"
                >
                  {entryId ? "Update Entry" : "Save Entry"}
                </Button>
              </>
            )}
          </Group>
        </div>
      </Box>
    </Modal>
  );
}