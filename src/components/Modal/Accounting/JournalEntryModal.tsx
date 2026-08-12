import { useMantineTheme, Box, Text, Button, Modal, Group, ThemeIcon, Badge, ScrollArea, Divider, Paper } from "@mantine/core";
import { IconX, IconFileText, IconCheck, IconInfoCircle } from "@tabler/icons-react";

import JournalEntryBasicInfo from "./JournalEntryBasicInfo";
import JournalEntryLinesTable from "./JournalEntryLinesTable";
import { useJournalEntryForm } from "../../../hooks/Accounting/journal-entry/useJournalEntryForm";
import { ModalFooter } from "../../shared/ModalFooter";

import type { JournalEntryModalProps as BaseModalProps } from "../../../types/Accounting/Journalentry.types";
import { formatAmount } from "../../../store/currencyStore";

interface JournalEntryModalProps extends BaseModalProps {
  baseCurrency: string;
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "brand";
}) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text fz="xs" c={accent ? `${accent}.6` : "slate.5"} fw={accent ? 600 : 400}>
        {label}
      </Text>
      <Text fz="xs" fw={700} c="slate.8" style={{ whiteSpace: "nowrap" }}>
        {value}
      </Text>
    </Group>
  );
}

export default function JournalEntryModal({
  opened,
  onClose,
  onSuccess,
  entryId,
  isReadOnly = false,
  baseCurrency,
}: JournalEntryModalProps) {
  const theme = useMantineTheme();

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
        size={1300}

      withCloseButton={false}
      padding={0}
      radius="lg"
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
        },
      }}
    >
      <Box className="flex flex-col flex-1 min-h-0">
        
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: "var(--mantine-color-white)",
              }}
            >
              <IconFileText size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {entryId
                  ? isReadOnly
                    ? "View Journal Entry"
                    : "Update Journal Entry"
                  : "New Journal Entry"}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                {entryId ? `Entry ${entryId}` : "Create a new manual journal entry"}
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
            {isReadOnly && (
              <Badge variant="light" color="gray" radius="sm" size="sm">
                View Only
              </Badge>
            )}
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleModalClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

    
        <Box
          component="fieldset"
          disabled={isReadOnly}
          bg="white"
          className="flex-1 flex flex-col lg:flex-row overflow-y-auto border-0 p-0 m-0 min-w-0 min-h-0"
        >
          <ScrollArea type="auto" scrollbarSize={8} style={{ flex: 1, minHeight: 0 }} bg="slate.0">
            <Box p="lg">
              <Paper
                radius="md"
                p="md"
                mb="md"
                withBorder
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  background: "var(--mantine-color-white)",
                }}
              >
                <JournalEntryBasicInfo
                  form={form}
                  errors={errors}
                  isReadOnly={isReadOnly}
                  onFieldChange={handleFieldChange}
                />
              </Paper>

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
            </Box>
          </ScrollArea>

          {/* Right sidebar: entry summary — unchanged from previous version */}
          <Box
            style={{
              width: 240,
              minWidth: 240,
              flexShrink: 0,
              borderLeft: "1px solid var(--mantine-color-slate-2)",
              overflowY: "auto",
            }}
            bg="slate.0"
            p="md"
          >
            <Group gap={6} mb="sm">
              <Box
                w={6}
                h={6}
                style={{ borderRadius: "50%", background: "var(--mantine-color-brand-5)" }}
              />
              <Text fz="10px" fw={700} tt="uppercase" c="brand.6" style={{ letterSpacing: 0.5 }}>
                Entry Summary
              </Text>
            </Group>

            <Paper
              radius="md"
              p="sm"
              withBorder
              style={{ borderColor: "var(--mantine-color-slate-2)", background: "var(--mantine-color-white)" }}
            >
              <Box mb="xs">
                <SummaryRow label="Voucher Type" value={form.voucher_type} />
              </Box>
              <Box mb="xs">
                <SummaryRow
                  label="Posting Date"
                  value={
                    form.postingDate
                      ? new Date(form.postingDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
              </Box>
              <Box mb="sm">
                <SummaryRow label="Opening Entry" value={form.isOpening ? "Yes" : "No"} />
              </Box>

              <Divider color="slate.1" mb="sm" />

              <Box mb="xs">
                <SummaryRow label="Total Line Entries" value={entries.length} accent="brand" />
              </Box>
              <Box mb="xs">
                <SummaryRow
                  label="Debit"
                  value={formatAmount(baseCurrency, totals.debit, { withSymbol: true })}
                />
              </Box>
              <Box mb="sm">
                <SummaryRow
                  label="Credit"
                  value={formatAmount(baseCurrency, totals.credit, { withSymbol: true })}
                />
              </Box>

              <Divider color="slate.1" mb="sm" />

              <Group justify="space-between" wrap="nowrap">
                <Text fz="xs" fw={600} c="slate.6">
                  Status
                </Text>
                <Group gap={4} wrap="nowrap">
                  <ThemeIcon size={16} radius="xl" variant="light" color={balanced ? "success" : "danger"}>
                    {balanced ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text fz="xs" fw={700} c={balanced ? "success.7" : "danger.7"}>
                    {balanced ? "Balanced" : "Unbalanced"}
                  </Text>
                </Group>
              </Group>
            </Paper>

            {!isReadOnly && !entryId && (
              <Paper
                radius="md"
                p="sm"
                mt="md"
                style={{ background: "var(--mantine-color-brand-0)", border: "1px solid var(--mantine-color-brand-1)" }}
              >
                <Group gap={6} mb={4} wrap="nowrap">
                  <IconInfoCircle size={12} color="var(--mantine-color-brand-5)" />
                  <Text fz="xs" fw={700} c="brand.6">
                    Draft Status
                  </Text>
                </Group>
                <Text fz="xs" c="brand.6" style={{ lineHeight: 1.4 }}>
                  This entry will be saved as a draft and won't affect the ledger until submitted.
                </Text>
              </Paper>
            )}
          </Box>
        </Box>

     
        <Box style={{ flexShrink: 0 }}>
          <ModalFooter
            variant="theme"
            isViewMode={isReadOnly}
            onClose={handleModalClose}
          
            onSubmit={!isReadOnly ? handleSubmit : undefined}
            submitLabel={entryId ? "Update Entry" : "Save Entry"}
            submitLoading={loading}
          />
        </Box>
      </Box>
    </Modal>
  );
}