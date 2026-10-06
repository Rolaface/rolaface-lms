import { useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowRight, IconCash, IconX } from "@tabler/icons-react";
import { CUSTOMERS, inr, toIso, type ModalState } from "./InvestorModalShared";

export interface ReceivePaymentResult {
  paymentEntry: string;
  referenceNo: string;
}

interface ReceivePaymentModalProps {
  opened: boolean;
  onClose: () => void;
  state: ModalState;
  onReceived: (result: ReceivePaymentResult) => void;
}

export interface AccountOption {
  name: string;
  company: string;
  /** GL account linked to the bank account (shown read-only). */
  account?: string;
  /** Currency of the bank account (shown read-only). */
  currency?: string;
}

// Same field look as the other modals: bold label, white input, slate border.
const FIELD_STYLES = {
  label: {
    fontWeight: 700,
    fontSize: "var(--mantine-font-size-sm)",
    color: "var(--mantine-color-slate-7)",
    marginBottom: 6,
  },
  input: {
    background: "var(--mantine-color-white)",
    border: "1px solid var(--mantine-color-slate-2)",
  },
};

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fz={11} c="slate.5">
        {label}
      </Text>
      <Text fz="sm" fw={700} c="slate.8">
        {value}
      </Text>
    </Box>
  );
}

export function ReceivePaymentModal({
  opened,
  onClose,
  state,
  onReceived,
}: ReceivePaymentModalProps) {
  const theme = useMantineTheme();
  const customer = CUSTOMERS[state.customerIndex];
  const today = toIso(new Date());

  const [postingDate, setPostingDate] = useState(today);
  const [modeOfPayment, setModeOfPayment] = useState<string | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [referenceDate, setReferenceDate] = useState(today);
  const [paidTo, setPaidTo] = useState<AccountOption | null>(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [paidFromBank, setPaidFromBank] = useState<string | null>(null);

  // Local state to mock submitting behavior
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------- Mocked Data Variables ---------------------- */
  const modesLoading = false;
  const modes = ["Wire Transfer", "Cheque", "Cash", "Bank Draft"];

  const accountsLoading = false;
  // MOCK values for the GL account and currency; replace with the Frappe data.
  const accounts: AccountOption[] = [
    { name: "HDFC Bank - Current", company: "Default Company", account: "Bank - HDFC", currency: "INR" },
    { name: "ICICI Bank - Escrow", company: "Default Company", account: "Bank - ICICI", currency: "INR" },
  ];

  const paidFromLoading = false;
  const paidFromFailed = false;
  const paidFromCurrency = "INR"; // MOCK, replace with the customer account's currency
  const paidFromBankOptions = customer ? [{ value: customer.bank, label: customer.bank }] : [];
  const paidFrom = customer ? `Debtors - ${customer.name}` : "";
  /* ------------------------------------------------------------------- */

  // Keep the chosen account in the list while the user types a new search.
  const accountOptions = (
    paidTo && !accounts.some((a) => a.name === paidTo.name)
      ? [paidTo, ...accounts]
      : accounts
  ).map((a) => ({ value: a.name, label: a.name }));

  const canSubmit =
    !!customer &&
    !!postingDate &&
    !!modeOfPayment &&
    referenceNo.trim().length > 0 &&
    !!referenceDate &&
    !!paidTo &&
    !!paidFrom &&
    !paidFromLoading &&
    state.amount > 0;

  const handleSubmit = () => {
    if (!canSubmit || !customer || !paidTo || !paidFrom || !modeOfPayment) return;

    setSubmitting(true);

    // Simulate network delay to maintain the UI loading experience
    setTimeout(() => {
      setSubmitting(false);
      onReceived({ paymentEntry: "PAY-MOCK-0001", referenceNo: referenceNo.trim() });
    }, 600);
  };

  return (
    <Modal
      opened={opened}
      onClose={submitting ? () => {} : onClose}
      centered
      radius="lg"
      size={850}
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={!submitting}
      styles={{ content: { overflow: "hidden" }, body: { padding: 0 } }}
    >
      {/* Header */}
      <Group
        gap="sm"
        wrap="nowrap"
        px="xl"
        py="md"
        style={{ background: theme.other.brandGradient }}
      >
        <Box
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "var(--mantine-radius-md)",
            background: "var(--mantine-color-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconCash size={18} color="var(--mantine-color-brand-6)" />
        </Box>
        <Box>
          <Text fw={700} fz="md" c="white" lh={1.3}>
            Receive Payment
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            Records the investor's funds as a Payment Entry in accounting.
          </Text>
        </Box>
        <ActionIcon
          variant="subtle"
          color="white"
          ml="auto"
          aria-label="Close"
          disabled={submitting}
          onClick={onClose}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      {/* Body */}
      <Box
        px="xl"
        py="xl"
        style={{ background: "var(--mantine-color-slate-0)" }}
      >
        {/* Locked details */}
        <Paper
          radius="md"
          p="sm"
          mb="md"
          style={{
            background: "var(--mantine-color-white)",
            border: "1px solid var(--mantine-color-slate-2)",
          }}
        >
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
            }}
          >
            <LockedField label="Payment type" value="Receive" />
            <LockedField label="Party type" value="Customer" />
            <LockedField label="Investor" value={customer ? customer.name : "—"} />
            <LockedField label="Amount" value={inr(state.amount)} />
          </Box>
        </Paper>

        {/* User inputs */}
        <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextInput
            type="date"
            label="Date"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            value={postingDate}
            onChange={(e) => setPostingDate(e.currentTarget.value)}
          />
          <Select
            label="Mode of payment"
            placeholder={modesLoading ? "Loading…" : "Select"}
            size="sm"
            radius="md"
            required
            searchable
            styles={FIELD_STYLES}
            data={modes}
            value={modeOfPayment}
            onChange={setModeOfPayment}
            rightSection={modesLoading ? <Loader size={14} /> : undefined}
            nothingFoundMessage="No mode of payment found"
          />
          <TextInput
            label="Cheque / reference no."
            placeholder="Enter reference"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            label="Cheque / reference date"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.currentTarget.value)}
          />
        </Box>

        {/* Paid From / Paid To */}
        <Paper
          radius="md"
          mt="md"
          pos="relative"
          style={{
            background: "var(--mantine-color-white)",
            border: "1px solid var(--mantine-color-slate-2)",
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "var(--mantine-color-slate-0)",
              borderBottom: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <Text fw={700} fz="sm" c="slate.8" px="md" py="sm">
              Paid From
            </Text>
            <Text
              fw={700}
              fz="sm"
              c="slate.8"
              px="md"
              py="sm"
              style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
            >
              Paid To
            </Text>
          </Box>

          <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* Paid from */}
            <Box p="md">
              <Select
                label="Bank Account"
                placeholder="Type to search…"
                size="sm"
                radius="md"
                searchable
                clearable
                styles={FIELD_STYLES}
                data={paidFromBankOptions}
                value={paidFromBank}
                onChange={setPaidFromBank}
                nothingFoundMessage="No bank account found"
              />
              <Group gap="sm" mt="md" wrap="nowrap" align="flex-start">
                <TextInput
                  label="Account (GL)"
                  size="sm"
                  radius="md"
                  disabled
                  style={{ flex: 1 }}
                  styles={FIELD_STYLES}
                  value={!paidFromLoading ? (paidFrom ?? "") : ""}
                  rightSection={paidFromLoading ? <Loader size={14} /> : undefined}
                  error={
                    paidTo && paidFromFailed
                      ? "Could not find this customer's account in Frappe."
                      : undefined
                  }
                />
                <TextInput
                  label="Currency"
                  size="sm"
                  radius="md"
                  disabled
                  w={90}
                  styles={FIELD_STYLES}
                  value={paidFromCurrency}
                />
              </Group>
            </Box>

            {/* Paid to */}
            <Box p="md" style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}>
              <Select
                label="Bank Account"
                placeholder="Type to search…"
                size="sm"
                radius="md"
                required
                searchable
                styles={FIELD_STYLES}
                data={accountOptions}
                filter={({ options }) => options}
                value={paidTo ? paidTo.name : null}
                onChange={(value) =>
                  setPaidTo(
                    value
                      ? (accounts.find((a) => a.name === value) ??
                        (paidTo && paidTo.name === value ? paidTo : null))
                      : null,
                  )
                }
                searchValue={accountSearch}
                onSearchChange={setAccountSearch}
                rightSection={accountsLoading ? <Loader size={14} /> : undefined}
                nothingFoundMessage={accountsLoading ? "Searching…" : "No account found"}
              />
              <Group gap="sm" mt="md" wrap="nowrap" align="flex-start">
                <TextInput
                  label="Account (GL)"
                  size="sm"
                  radius="md"
                  disabled
                  style={{ flex: 1 }}
                  styles={FIELD_STYLES}
                  value={paidTo?.account ?? ""}
                />
                <TextInput
                  label="Currency"
                  size="sm"
                  radius="md"
                  disabled
                  w={90}
                  styles={FIELD_STYLES}
                  value={paidTo?.currency ?? ""}
                />
              </Group>
            </Box>
          </Box>

          {/* Arrow between the two panels */}
          <Box
            style={{
              position: "absolute",
              top: 76,
              left: "50%",
              transform: "translateX(-50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--mantine-color-white)",
              border: "1px solid var(--mantine-color-slate-2)",
              boxShadow: "var(--mantine-shadow-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconArrowRight size={16} color="var(--mantine-color-brand-6)" />
          </Box>
        </Paper>

        {paidTo && paidFrom && !paidFromLoading && (
          <Text fz="xs" c="slate.5" mt="sm">
            Accounting entry: debit{" "}
            <Text span fw={700} c="slate.8">
              {paidTo.name}
            </Text>
            , credit{" "}
            <Text span fw={700} c="slate.8">
              {paidFrom}
            </Text>{" "}
            for {inr(state.amount)}.
          </Text>
        )}
      </Box>

      {/* Footer */}
      <Group
        justify="space-between"
        px="xl"
        py="md"
        style={{
          background: "var(--mantine-color-slate-0)",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Button
          variant="subtle"
          color="slate"
          radius="md"
          disabled={submitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          radius="md"
          color="brand"
          px="xl"
          disabled={!canSubmit}
          loading={submitting}
          onClick={handleSubmit}
          // The gradient is only applied when enabled, so the disabled look still shows.
          style={
            canSubmit
              ? {
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }
              : undefined
          }
        >
          Submit
        </Button>
      </Group>
    </Modal>
  );
}