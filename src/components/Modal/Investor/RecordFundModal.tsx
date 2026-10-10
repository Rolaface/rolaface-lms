import { useState, type ReactNode } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  Table,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useNavigate } from "@tanstack/react-router";
import {
  IconArrowRight,
  IconCash,
  IconMinus,
  IconReceipt2,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFundRecord,
  getInvestorFundById,
  getInvestorFunds,
  getRecordFundAccounts,
  updateFundRecord,
} from "../../../api/Investor/investorFlowApi";
import {
  INVESTOR_FLOW_PAYMENT_MODES,
  type FundRecordStatus,
  type InvestorFlowPaymentMode,
  type InvestorFund,
  type InvestorFundRow,
  type RecordFundAccounts,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import { fmtDate, toIso } from "./InvestorModalShared";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { InvestorDateInput } from "./InvestorDateInput";

export type RecordFundMode = "add" | "edit" | "view";

interface RecordFundModalProps {
  opened: boolean;
  onClose: () => void;
  /** Minimizes the modal to the dock. */
  onMinimize: () => void;
  mode: RecordFundMode;
  /** Investor Flow ID (edit / view); chosen in the modal when adding. */
  investorFlowId?: string | null;
  /** Fund record (row) ID (edit / view). */
  recordName?: string | null;
}

// Same field look as the other modals: bold label, white input, slate border.
const FIELD_STYLES = {
  label: {
    fontWeight: 700,
    fontSize: "var(--mantine-font-size-xs)",
    color: "var(--mantine-color-slate-7)",
    marginBottom: 4,
    display: "block",
    width: "100%",
  },
  input: {
    background: "var(--mantine-color-white)",
    border: "1px solid var(--mantine-color-slate-2)",
  },
};

const PANEL_STYLE = {
  background: "var(--mantine-color-white)",
  border: "1px solid var(--mantine-color-slate-2)",
};

export const RECORD_STATUS_COLOR: Record<FundRecordStatus, string> = {
  Draft: "slate",
  Approved: "success",
  Cancelled: "danger",
};

const TITLES: Record<RecordFundMode, string> = {
  add: "Add Fund",
  edit: "Edit Fund",
  view: "View Fund",
};

/** A field label with a hint on the right of the same line. */
function LabelWithHint({ label, hint }: { label: string; hint: ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" w="100%">
      <span>
        {label}{" "}
        <Text span c="red">
          *
        </Text>
      </span>
      <Text span fz={11} fw={400} c="slate.5" truncate>
        {hint}
      </Text>
    </Group>
  );
}

function LockedField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Text
        fz={10}
        fw={700}
        c="slate.5"
        tt="uppercase"
        style={{ letterSpacing: 0.4 }}
      >
        {label}
      </Text>
      <Text fz="sm" fw={700} c="slate.8">
        {value}
      </Text>
    </Box>
  );
}

/** Read-only figures in one row, separated by thin lines. */
function SummaryStrip({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <Paper radius="md" py="xs" mb="md" style={PANEL_STYLE}>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, i) => (
          <Box
            key={item.label}
            px="sm"
            style={{
              borderLeft: i
                ? "1px solid var(--mantine-color-slate-2)"
                : undefined,
              minWidth: 0,
            }}
          >
            <LockedField label={item.label} value={item.value} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

/** One side of the Paid from → Paid to panel: the GL with its amount, and its description. */
function GlSide({
  title,
  account,
  description,
  amount,
  emptyText,
}: {
  title: string;
  account?: string | null;
  description?: string | null;
  amount: number;
  emptyText: string;
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  return (
    <Paper radius="md" p="sm" style={{ ...PANEL_STYLE, flex: 1, minWidth: 0 }}>
      <Text
        fz={10}
        fw={700}
        c="slate.5"
        tt="uppercase"
        style={{ letterSpacing: 0.4 }}
        mb={2}
      >
        {title}
      </Text>
      {account ? (
        <>
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Text fz="sm" fw={700} c="slate.8" truncate>
              {account}
            </Text>
            <Text fz="sm" fw={800} c="slate.9" style={{ whiteSpace: "nowrap" }}>
              {fmtAmount(amount)}
            </Text>
          </Group>
          <Text fz="xs" c="slate.5" truncate>
            {description}
          </Text>
        </>
      ) : (
        <Text fz="xs" c="red">
          {emptyText}
        </Text>
      )}
    </Paper>
  );
}

function PaidFromToPanel({
  credit,
  debit,
  amount,
  debitEmptyText,
}: {
  credit: { account?: string | null; description?: string | null } | null;
  debit: { account?: string | null; description?: string | null } | null;
  amount: number;
  debitEmptyText: string;
}) {
  return (
    <Paper
      radius="md"
      mt="md"
      p="xs"
      style={{ ...PANEL_STYLE, background: "var(--mantine-color-slate-0)" }}
    >
      <Group wrap="nowrap" gap="xs" align="center">
        <GlSide
          title="Paid from"
          account={credit?.account}
          description={credit?.description}
          amount={amount}
          emptyText="Set the Investor Creditor GL in Investor Settings."
        />
        <Box
          style={{
            flex: "none",
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "var(--mantine-color-brand-0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconArrowRight size={14} color="var(--mantine-color-brand-6)" />
        </Box>
        <GlSide
          title="Paid to"
          account={debit?.account}
          description={debit?.description}
          amount={amount}
          emptyText={debitEmptyText}
        />
      </Group>
    </Paper>
  );
}

/** Every fund record of the investment, with its Record Status. */
function FundsRecordedTable({
  funds,
  highlight,
}: {
  funds: InvestorFundRow[];
  highlight?: string | null;
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  return (
    <Paper radius="md" mt="md" style={{ ...PANEL_STYLE, overflow: "hidden" }}>
      <Group
        justify="space-between"
        px="sm"
        py={8}
        bg="slate.0"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Group gap={6}>
          <Text fw={700} fz="sm" c="slate.8">
            Funds recorded for this Investment
          </Text>
          <Badge variant="light" color="slate" radius="xl" size="sm" circle>
            {funds.length}
          </Badge>
        </Group>
      </Group>
      {funds.length === 0 ? (
        <Text fz="sm" c="slate.6" px="md" py="sm">
          No fund has been recorded yet.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={640}>
          <Table
            verticalSpacing="xs"
            horizontalSpacing="sm"
            fz="xs"
            styles={{
              th: {
                fontSize: 10,
                fontWeight: 700,
                color: "var(--mantine-color-slate-5)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Paid date</Table.Th>
                <Table.Th>Mode</Table.Th>
                <Table.Th>Reference no.</Table.Th>
                <Table.Th>Paid to</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th ta="center">Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {funds.map((r) => (
                <Table.Tr
                  key={r.name}
                  bg={
                    r.name === highlight
                      ? "var(--mantine-color-brand-0)"
                      : undefined
                  }
                >
                  <Table.Td>{fmtDate(r.paid_date)}</Table.Td>
                  <Table.Td fw={600}>{r.mode_of_payment}</Table.Td>
                  <Table.Td ff="monospace">
                    {r.reference_number || "—"}
                  </Table.Td>
                  <Table.Td>{r.debit_gl_description}</Table.Td>
                  <Table.Td ta="right" fw={800}>
                    {fmtAmount(r.amount_paid)}
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      variant="light"
                      radius="xl"
                      size="sm"
                      color={RECORD_STATUS_COLOR[r.record_status] ?? "slate"}
                      style={{ textTransform: "none" }}
                    >
                      {r.record_status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Paper>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function RecordFundModal({
  opened,
  onClose,
  onMinimize,
  mode,
  investorFlowId = null,
  recordName = null,
}: RecordFundModalProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  /* Add: choose the investment (Approved, with an amount still to record) */
  const [chosenFlowId, setChosenFlowId] = useState<string | null>(
    investorFlowId,
  );
  const [investmentSearch, setInvestmentSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(investmentSearch, 300);
  const investmentsQuery = useQuery({
    queryKey: ["investorFunds", "pick", debouncedSearch],
    queryFn: () =>
      getInvestorFunds({
        status: ["Approved"],
        search: debouncedSearch.trim() || undefined,
        page_size: 20,
      }),
    enabled: opened && mode === "add",
  });
  const investmentOptions = (investmentsQuery.data?.data ?? [])
    .filter((i) => i.available_to_record > 0 || i.name === chosenFlowId)
    .map((i) => ({
      value: i.name,
      label: `${i.investor} · ${fmtAmount(i.investment_amount)} · remaining ${fmtAmount(i.remaining_fund)}`,
    }));

  const flowId = mode === "add" ? chosenFlowId : investorFlowId;
  const fundQuery = useQuery({
    queryKey: ["investorFund", flowId],
    queryFn: () => getInvestorFundById(flowId as string),
    enabled: opened && !!flowId,
  });
  const accountsQuery = useQuery({
    queryKey: ["recordFundAccounts"],
    queryFn: getRecordFundAccounts,
    enabled: opened && mode !== "view",
    retry: false,
  });

  const fund = fundQuery.data ?? null;
  const record = recordName
    ? (fund?.funds.find((r) => r.name === recordName) ?? null)
    : null;

  const [saving, setSaving] = useState(false);

  let body: ReactNode;
  if (mode !== "add" && fundQuery.isLoading) {
    body = (
      <Group justify="center" py="xl">
        <Loader size="sm" color="brand" />
      </Group>
    );
  } else if (fundQuery.error) {
    body = (
      <Alert variant="light" color="red" radius="md">
        {parseFrappeError(fundQuery.error)}
      </Alert>
    );
  } else if (mode !== "add" && (!fund || !record)) {
    body = (
      <Alert variant="light" color="red" radius="md">
        This fund record could not be found.
      </Alert>
    );
  } else {
    body = (
      <>
        {mode === "add" && (
          <Select
            label={
              <LabelWithHint
                label="Investment"
                hint="Approved investments with an amount still to be recorded"
              />
            }
            placeholder="Search investor"
            size="sm"
            radius="md"
            mb="md"
            searchable
            styles={FIELD_STYLES}
            data={investmentOptions}
            value={chosenFlowId}
            onChange={setChosenFlowId}
            searchValue={investmentSearch}
            onSearchChange={setInvestmentSearch}
            filter={({ options }) => options}
            rightSection={
              investmentsQuery.isFetching ? <Loader size={14} /> : undefined
            }
            nothingFoundMessage={
              investmentsQuery.isFetching ? "Searching…" : "No investment found"
            }
          />
        )}

        {mode === "add" && chosenFlowId && fundQuery.isLoading && (
          <Group justify="center" py="md">
            <Loader size="sm" color="brand" />
          </Group>
        )}

        {fund && (
          <>
            {/* Investment summary */}
            <SummaryStrip
              items={[
                { label: "Investor", value: fund.investor },
                {
                  label: "Investment amount",
                  value: fmtAmount(fund.investment_amount),
                },
                {
                  label: "Fund received (approved)",
                  value: fmtAmount(fund.fund_received),
                },
                {
                  label: "Draft (not approved)",
                  value: fmtAmount(fund.draft_amount),
                },
                {
                  label: "Remaining fund",
                  value: fmtAmount(fund.remaining_fund),
                },
              ]}
            />

            {mode === "view" && record ? (
              <>
                <Paper radius="md" p="sm" style={PANEL_STYLE}>
                  <Box
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <LockedField
                      label="Paid date"
                      value={fmtDate(record.paid_date)}
                    />
                    <LockedField
                      label="Mode of payment"
                      value={record.mode_of_payment}
                    />
                    <LockedField
                      label="Reference no."
                      value={record.reference_number || "—"}
                    />
                    <LockedField
                      label="Amount"
                      value={fmtAmount(record.amount_paid)}
                    />
                    <LockedField
                      label="Record status"
                      value={
                        <Badge
                          variant="light"
                          radius="sm"
                          size="sm"
                          color={
                            RECORD_STATUS_COLOR[record.record_status] ?? "slate"
                          }
                        >
                          {record.record_status}
                        </Badge>
                      }
                    />
                    <LockedField
                      label="Journal Entry"
                      value={record.journal_entry || "Not posted"}
                    />
                  </Box>
                </Paper>
                <PaidFromToPanel
                  credit={{
                    account: record.credit_gl,
                    description: record.credit_gl_description,
                  }}
                  debit={{
                    account: record.debit_gl,
                    description: record.debit_gl_description,
                  }}
                  amount={Number(record.amount_paid) || 0}
                  debitEmptyText="—"
                />
              </>
            ) : (
              <FundForm
                key={`${flowId}-${fundQuery.dataUpdatedAt}`}
                mode={mode}
                fund={fund}
                record={record}
                accounts={accountsQuery.data ?? null}
                accountsError={accountsQuery.error}
                onSavingChange={setSaving}
                onSaved={(saved) => {
                  queryClient.invalidateQueries({
                    queryKey: ["investorFund", fund.id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["investorFunds"],
                  });
                  queryClient.invalidateQueries({ queryKey: ["fundRecords"] });
                  onClose();
                  openCommonModal({
                    heading:
                      mode === "add" ? "Fund Saved as Draft" : "Fund Updated",
                    subtitle: "",
                    body: `${fmtAmount(Number(saved.amount_paid) || 0)} for ${fund.investor} is saved as Draft. Approve it from the Fund Receipt list to post the Journal Entry.`,
                    color: "green",
                    buttons: [{ label: "Close", color: "green" }],
                  });
                }}
              />
            )}

            <FundsRecordedTable funds={fund.funds} highlight={recordName} />
          </>
        )}
      </>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={saving ? () => {} : onClose}
      centered
      radius="lg"
      size="90vw"
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={!saving}
      styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "85vw",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          padding: 0,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Group
        gap="sm"
        wrap="nowrap"
        px="xl"
        py="md"
        style={{ flex: "none", background: theme.other.brandGradient }}
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
            {TITLES[mode]}
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            {mode === "view"
              ? "A fund received from the investor."
              : "Saved as Draft; the Journal Entry is posted when the record is approved."}
          </Text>
        </Box>
        <Group gap={4} ml="auto" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Minimize"
            disabled={saving}
            onClick={onMinimize}
          >
            <IconMinus size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Close"
            disabled={saving}
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Body */}
      <Box
        px="lg"
        py="md"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: "var(--mantine-color-slate-0)",
        }}
      >
        {body}
      </Box>

      {/* Footer: Save is inside the form (see FundForm); Close is always here. */}
      <Group
        justify="space-between"
        px="lg"
        py="sm"
        style={{
          flex: "none",
          background: "var(--mantine-color-slate-0)",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Button
          variant="subtle"
          color="slate"
          radius="md"
          disabled={saving}
          onClick={onClose}
        >
          {mode === "view" ? "Close" : "Cancel"}
        </Button>
        {mode === "view" && fund && record?.journal_entry && (
          <Button
            radius="md"
            variant="light"
            color="brand"
            leftSection={<IconReceipt2 size={16} />}
            onClick={() => {
              // Investor 360: this investment's Funds paid, with this fund's accounting open.
              const params = new URLSearchParams({
                investor: fund.investor_id,
                investment: fund.id,
                tab: "funds",
                je: record.journal_entry as string,
              });
              onClose();
              navigate({ href: `/investor/investments?${params.toString()}` });
            }}
          >
            View accounting
          </Button>
        )}
        {mode !== "view" && (
          <Button
            type="submit"
            form="record-fund-form"
            radius="md"
            color="brand"
            px="xl"
            loading={saving}
            disabled={!fund}
          >
            {mode === "add" ? "Save as Draft" : "Save"}
          </Button>
        )}
      </Group>
    </Modal>
  );
}

function FundForm({
  mode,
  fund,
  record,
  accounts,
  accountsError,
  onSavingChange,
  onSaved,
}: {
  mode: RecordFundMode;
  fund: InvestorFund;
  record: InvestorFundRow | null;
  accounts: RecordFundAccounts | null;
  accountsError: unknown;
  onSavingChange: (saving: boolean) => void;
  onSaved: (saved: InvestorFundRow) => void;
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  // What this record can be for: what is still free, plus its own amount when editing.
  const maxAmount =
    fund.available_to_record + (record ? Number(record.amount_paid) || 0 : 0);

  const [paidDate, setPaidDate] = useState(
    record?.paid_date ?? toIso(new Date()),
  );
  const [paymentMode, setPaymentMode] =
    useState<InvestorFlowPaymentMode | null>(record?.mode_of_payment ?? null);
  const [referenceNo, setReferenceNo] = useState(
    record?.reference_number ?? "",
  );
  const [amount, setAmount] = useState<number>(
    record ? Number(record.amount_paid) || 0 : maxAmount,
  );

  const debit =
    paymentMode && accounts ? accounts.debit_by_mode[paymentMode] : null;
  const credit = accounts?.credit ?? null;

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        paid_date: paidDate,
        mode_of_payment: paymentMode as InvestorFlowPaymentMode,
        reference_number: referenceNo.trim(),
        amount,
      };
      return mode === "edit" && record
        ? updateFundRecord({ id: fund.id, record: record.name, payload })
        : addFundRecord({ id: fund.id, payload });
    },
    onMutate: () => onSavingChange(true),
    onSettled: () => onSavingChange(false),
    onSuccess: onSaved,
    onError: (error: any) =>
      openCommonModal({
        heading: "Save Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  if (fund.status !== "Approved" || maxAmount <= 0) {
    return (
      <Alert variant="light" color="slate" radius="md">
        {fund.status !== "Approved"
          ? `Funds can be recorded only for an Approved investment (this one is ${fund.status}).`
          : "The full investment amount is already recorded (approved or in draft)."}
      </Alert>
    );
  }

  const amountError =
    amount > maxAmount
      ? `Cannot be more than ${fmtAmount(maxAmount)}.`
      : undefined;
  const canSave =
    !!paidDate &&
    !!paymentMode &&
    !!debit &&
    !!credit &&
    referenceNo.trim().length > 0 &&
    amount > 0 &&
    !amountError;

  return (
    <form
      id="record-fund-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave && !saveMutation.isPending) saveMutation.mutate();
      }}
    >
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        <InvestorDateInput
          label="Paid date"
          size="sm"
          radius="md"
          required
          styles={FIELD_STYLES}
          value={paidDate}
          onChange={(value) => setPaidDate(value)}
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
          value={referenceNo}
          onChange={(e) => setReferenceNo(e.currentTarget.value)}
        />
        <NumberInput
          label={
            <LabelWithHint
              label="Amount"
              hint={`At most ${fmtAmount(maxAmount)}`}
            />
          }
          hideControls
          size="sm"
          radius="md"
          min={1}
          max={maxAmount}
          decimalScale={2}
          thousandSeparator=","
          styles={FIELD_STYLES}
          value={amount}
          onChange={(v) => setAmount(Number(v) || 0)}
          error={amountError}
        />
      </Box>

      {accountsError ? (
        <Alert variant="light" color="red" radius="md" mt="md">
          {parseFrappeError(accountsError)}
        </Alert>
      ) : (
        <PaidFromToPanel
          credit={credit}
          debit={debit}
          amount={amount}
          debitEmptyText={
            paymentMode
              ? `Set the ${paymentMode} GL in Investor Settings to use this mode.`
              : "Select the mode of payment."
          }
        />
      )}
    </form>
  );
}
