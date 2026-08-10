import {
  Box,
  Text,
  ActionIcon,
  Modal,
  Button,
  Group,
  ThemeIcon,
  ScrollArea,
  Fieldset,
  Divider,
  Paper,
  useMantineTheme,
} from "@mantine/core";
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
import { formatAmount } from "../../../store/currencyStore";

interface JournalEntryModalProps extends BaseModalProps {
  baseCurrency: string;
}

function SummaryRow({
  label,
  value,
  strong = false,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  accent?: "brand";
}) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text
        fz="xs"
        c={accent ? `${accent}.6` : "slate.5"}
        fw={accent ? 600 : 400}
      >
        {label}
      </Text>
      <Text
        fz="xs"
        fw={strong ? 700 : 700}
        c="slate.8"
        style={{ whiteSpace: "nowrap" }}
      >
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

  const headerTitle = isReadOnly
    ? `View Entry: ${entryId}`
    : entryId
      ? `Edit Entry: ${entryId}`
      : "New Journal Entry";

  const headerSubtitle = isReadOnly
    ? "Viewing journal entry details"
    : entryId
      ? "Update existing manual journal entry"
      : "Create a new manual journal entry record";

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
      size={1180}
      padding={0}
      lockScroll
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
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
        bg="white"
      >
        {/* Header — brand fill, matches CustomerModal */}
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconFileText size={16} />
            </ThemeIcon>
            <Box>
              <Text
                size="md"
                fw={700}
                c="white"
                style={{ letterSpacing: "-0.01em" }}
              >
                {headerTitle}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {headerSubtitle}
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={handleModalClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {/* Body: main + right sidebar */}
        <Box
          style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}
        >
          {/* Main scrollable content */}
          <ScrollArea
            type="auto"
            scrollbarSize={8}
            style={{ flex: 1, minHeight: 0 }}
            bg="slate.0"
          >
            <Box p="lg">
              <Fieldset disabled={isReadOnly} variant="unstyled" p={0} m={0}>
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
              </Fieldset>
            </Box>
          </ScrollArea>

          {/* Right sidebar: entry summary */}
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
                style={{
                  borderRadius: "50%",
                  background: "var(--mantine-color-brand-5)",
                }}
              />
              <Text
                fz="10px"
                fw={700}
                tt="uppercase"
                c="brand.6"
                style={{ letterSpacing: 0.5 }}
              >
                Entry Summary
              </Text>
            </Group>

            <Paper
              radius="md"
              p="sm"
              withBorder
              style={{
                borderColor: "var(--mantine-color-slate-2)",
                background: "var(--mantine-color-white)",
              }}
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
                <SummaryRow
                  label="Opening Entry"
                  value={form.isOpening ? "Yes" : "No"}
                />
              </Box>

              <Divider color="slate.1" mb="sm" />

              <Box mb="xs">
                <SummaryRow
                  label="Total Line Entries"
                  value={entries.length}
                  accent="brand"
                />
              </Box>
              <Box mb="xs">
                <SummaryRow
                  label="Debit"
                  value={formatAmount(baseCurrency, totals.debit, {
                    withSymbol: true,
                  })}
                />
              </Box>
              <Box mb="sm">
                <SummaryRow
                  label="Credit"
                  value={formatAmount(baseCurrency, totals.credit, {
                    withSymbol: true,
                  })}
                />
              </Box>

              <Divider color="slate.1" mb="sm" />

              <Group justify="space-between" wrap="nowrap">
                <Text fz="xs" fw={600} c="slate.6">
                  Status
                </Text>
                <Group gap={4} wrap="nowrap">
                  <ThemeIcon
                    size={16}
                    radius="xl"
                    variant="light"
                    color={balanced ? "success" : "danger"}
                  >
                    {balanced ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text
                    fz="xs"
                    fw={700}
                    c={balanced ? "success.7" : "danger.7"}
                  >
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
                style={{
                  background: "var(--mantine-color-brand-0)",
                  border: "1px solid var(--mantine-color-brand-1)",
                }}
              >
                <Group gap={6} mb={4} wrap="nowrap">
                  <IconInfoCircle
                    size={12}
                    color="var(--mantine-color-brand-5)"
                  />
                  <Text fz="xs" fw={700} c="brand.6">
                    Draft Status
                  </Text>
                </Group>
                <Text fz="xs" c="brand.6" style={{ lineHeight: 1.4 }}>
                  This entry will be saved as a draft and won't affect the
                  ledger until submitted.
                </Text>
              </Paper>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Group
          justify="flex-end"
          px="xl"
          py="md"
          style={{
            borderTop: "1px solid var(--mantine-color-slate-2)",
            flexShrink: 0,
          }}
        >
          <Button
            variant="subtle"
            color="slate"
            radius="md"
            onClick={handleModalClose}
          >
            {isReadOnly ? "Close" : "Cancel"}
          </Button>

          {!isReadOnly && (
            <>
              <Button
                variant="subtle"
                color="danger"
                radius="md"
                onClick={reset}
              >
                Reset
              </Button>
              <Button
                radius="md"
                color="brand"
                loading={loading}
                leftSection={<IconCheck size={14} />}
                onClick={handleSubmit}
                style={{
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }}
              >
                {entryId ? "Update Entry" : "Save Entry"}
              </Button>
            </>
          )}
        </Group>
      </Box>
    </Modal>
  );
}
