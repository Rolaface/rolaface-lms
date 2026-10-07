import { useState, type ReactNode } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowRight, IconCash, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getInvestorBankAccounts,
  receiveInvestorFlowPayment,
} from "../../../api/Investor/investorFlowApi";
import { fetchLedgerAccountOptions } from "../../../api/utils/frappeUtilsApi";
import {
  INVESTOR_FLOW_PAYMENT_MODES,
  type InvestorFlowPaymentMode,
  type InvestorFlowReceivePaymentResult,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import { inr, stateCustomer, toIso, type ModalState } from "./InvestorModalShared";

interface ReceivePaymentModalProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Flow ID. */
  investorFlowId: string;
  state: ModalState;
  onReceived: (result: InvestorFlowReceivePaymentResult) => void;
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

/** Read-only input with the same look as the modal fields. */
export function LockedInput({
  label,
  value,
  mt,
}: {
  label: string;
  value: string;
  mt?: string;
}) {
  return (
    <TextInput label={label} size="sm" radius="md" mt={mt} disabled styles={FIELD_STYLES} value={value} />
  );
}

/** Two panels, "Paid From" → "Paid To", used by Receive Payment and the saved payment details. */
export function PaidFromToPanel({ from, to }: { from: ReactNode; to: ReactNode }) {
  return (
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
        <Box p="md">{from}</Box>
        <Box p="md" style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}>
          {to}
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
  );
}

export function ReceivePaymentModal({
  opened,
  onClose,
  investorFlowId,
  state,
  onReceived,
}: ReceivePaymentModalProps) {
  const theme = useMantineTheme();
  const customer = stateCustomer(state);

  const [paymentDate, setPaymentDate] = useState(toIso(new Date()));
  const [paymentMode, setPaymentMode] = useState<InvestorFlowPaymentMode | null>(null);
  const [refNo, setRefNo] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(state.amount);
  const [paidTo, setPaidTo] = useState<string | null>(null);

  /* Paid To: ledger accounts (frappeUtilsAPI.getaccounts) */
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["ledgerAccountOptions"],
    queryFn: fetchLedgerAccountOptions,
    enabled: opened,
  });
  const paidToAccount = accounts.find((a) => a.name === paidTo) ?? null;

  /* Paid From: the investor's Bank Accounts (Party = the customer) */
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useQuery({
    queryKey: ["investorBankAccounts", state.customerId],
    queryFn: () => getInvestorBankAccounts(state.customerId as string),
    enabled: opened && !!state.customerId,
  });
  const [paidFromChoice, setPaidFromChoice] = useState<string | null>(null);
  // The investor's default bank account until the user picks one.
  const paidFromAccount =
    bankAccounts.find((b) => b.name === paidFromChoice) ??
    (paidFromChoice === null ? bankAccounts.find((b) => b.is_default) : undefined) ??
    null;
  const paidFrom = paidFromAccount?.name ?? "";
  /** Bank Account's Company Account: credited in the Journal Entry. */
  /** Credited in the Journal Entry: the Bank Account's Company Account. */
  const creditAccount = paidFromAccount?.account ?? "";

  const paymentMutation = useMutation({
    mutationFn: receiveInvestorFlowPayment,
    onSuccess: onReceived,
    onError: (error: any) =>
      openCommonModal({
        heading: "Payment Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });
  const submitting = paymentMutation.isPending;

  const canSubmit =
    !!paymentDate &&
    !!paymentMode &&
    refNo.trim().length > 0 &&
    Number.isInteger(amountPaid) &&
    amountPaid > 0 &&
    !!paidTo &&
    !!paidFrom &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit || !paymentMode || !paidTo) return;
    paymentMutation.mutate({
      id: investorFlowId,
      payload: {
        payment_date: paymentDate,
        ref_no: refNo.trim(),
        payment_mode: paymentMode,
        amount_paid: amountPaid,
        paid_from: paidFrom,
        paid_to: paidTo,
      },
    });
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
            Records the investor's funds as a Journal Entry in accounting.
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
            <LockedField label="Investment amount" value={inr(state.amount)} />
          </Box>
        </Paper>

        {/* User inputs */}
        <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextInput
            type="date"
            label="Payment date"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.currentTarget.value)}
          />
          <Select
            label="Mode of payment"
            placeholder="Select"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            data={[...INVESTOR_FLOW_PAYMENT_MODES]}
            value={paymentMode}
            onChange={(v) => setPaymentMode(v as InvestorFlowPaymentMode | null)}
          />
          <TextInput
            label="Reference no."
            placeholder="Enter reference"
            size="sm"
            radius="md"
            required
            styles={FIELD_STYLES}
            value={refNo}
            onChange={(e) => setRefNo(e.currentTarget.value)}
          />
          <NumberInput
            label="Amount paid"
            size="sm"
            radius="md"
            required
            min={1}
            allowDecimal={false}
            thousandSeparator=","
            styles={FIELD_STYLES}
            value={amountPaid}
            onChange={(v) => setAmountPaid(Number(v) || 0)}
          />
        </Box>

        {/* Paid From / Paid To */}
        <PaidFromToPanel
          from={
            <>
              <Select
                label="Bank Account"
                placeholder="Select"
                size="sm"
                radius="md"
                required
                searchable
                styles={FIELD_STYLES}
                data={bankAccounts.map((b) => ({ value: b.name, label: b.name }))}
                value={paidFrom || null}
                onChange={(v) => setPaidFromChoice(v ?? "")}
                rightSection={bankAccountsLoading ? <Loader size={14} /> : undefined}
                nothingFoundMessage="No bank account found"
                error={
                  !bankAccountsLoading && bankAccounts.length === 0
                    ? "This investor has no bank account."
                    : undefined
                }
              />
              <LockedInput
                label="Account (GL)"
                value={creditAccount}
                mt="md"
              />
              {paidFromAccount?.account_currency && (
                <Text fz="xs" c="slate.5" mt={6}>
                  Currency: {paidFromAccount.account_currency}
                </Text>
              )}
            </>
          }
          to={
            <>
              <Select
                label="Account"
                placeholder="Type to search…"
                size="sm"
                radius="md"
                required
                searchable
                styles={FIELD_STYLES}
                data={accounts.map((a) => ({ value: a.name, label: a.name }))}
                value={paidTo}
                onChange={setPaidTo}
                rightSection={accountsLoading ? <Loader size={14} /> : undefined}
                nothingFoundMessage={accountsLoading ? "Loading…" : "No account found"}
              />
              <LockedInput label="Account (GL)" value={paidTo ?? ""} mt="md" />
              {paidToAccount?.account_currency && (
                <Text fz="xs" c="slate.5" mt={6}>
                  Currency: {paidToAccount.account_currency}
                </Text>
              )}
            </>
          }
        />

        {paidTo && creditAccount && amountPaid > 0 && (
          <Text fz="xs" c="slate.5" mt="sm">
            Accounting entry: debit{" "}
            <Text span fw={700} c="slate.8">
              {paidTo}
            </Text>
            , credit{" "}
            <Text span fw={700} c="slate.8">
              {creditAccount}
            </Text>{" "}
            for {inr(amountPaid)}.
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