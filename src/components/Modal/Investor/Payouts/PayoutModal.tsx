/*
 * Investor Payout (Add / Edit / View).
 *   Tab "Payment"  - choose the investment, Pay Dues / Pay Any / Pay Full, payment details; right: dues summary
 *                    and the payment effect (how the amount is split over the EMIs).
 *   Tab "Schedule" - every EMI of the investment: paid, partly paid or unpaid.
 * Saving keeps the payout as Draft; Approve / Cancel / Delete are done from the Investor Payouts list.
 */
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
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconCalendarDue,
  IconCash,
  IconChecklist,
  IconCircleCheck,
  IconClipboardList,
  IconCoins,
  IconHash,
  IconMinus,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addInvestorPayout,
  getPayoutCandidates,
  getPayoutContext,
  previewInvestorPayout,
  updateInvestorPayout,
} from "../../../../api/Investor/investorFlowApi";
import { searchLedgerAccounts } from "../../../../api/utils/frappeUtilsApi";
import {
  INVESTOR_FLOW_PAYMENT_MODES,
  PAYOUT_PAYMENT_TYPES,
  type InvestorFlowPaymentMode,
  type InvestorPayout,
  type PayoutContext,
  type PayoutPayload,
  type PayoutPaymentType,
} from "../../../../types/Investor/investorFlow";
import { useCompanyStore } from "../../../../store/companyStore";
import { formatAmount, getSymbol } from "../../../../store/currencyStore";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { openCommonModal } from "../../AlertModal";
import { InvestorDateInput } from "../InvestorDateInput";
import { formatInvestorDate } from "../investorDate";
import { toIso } from "../InvestorModalShared";

export type PayoutModalMode = "add" | "edit" | "view";

export interface PayoutModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  mode: PayoutModalMode;
  investorFlowId: string | null;
  payoutName: string | null;
}

const ROW_STATUS_COLOR: Record<string, string> = {
  Pending: "slate",
  Accrued: "info",
  "Partially Paid": "warning",
  Paid: "success",
};

const TYPE_ICONS: Record<PayoutPaymentType, ReactNode> = {
  "Pay Dues": <IconClipboardList size={14} />,
  "Pay Any": <IconCoins size={14} />,
  "Pay Full": <IconCircleCheck size={14} />,
};

/* ------------------------------- Shell ------------------------------- */

export function PayoutModal({
  opened,
  onClose,
  onMinimize,
  mode,
  investorFlowId,
  payoutName,
}: PayoutModalProps) {
  const theme = useMantineTheme();
  const [chosenId, setChosenId] = useState<string | null>(investorFlowId);
  const id = mode === "add" ? chosenId : investorFlowId;

  const contextQuery = useQuery({
    queryKey: ["payoutContext", id],
    queryFn: () => getPayoutContext(id as string),
    enabled: opened && !!id,
    staleTime: 0,
  });
  const context = contextQuery.data ?? null;
  const payout = payoutName
    ? (context?.payouts.find((p) => p.name === payoutName) ?? null)
    : null;

  const title =
    mode === "add"
      ? "Add Payout"
      : mode === "edit"
        ? "Edit Payout"
        : "View Payout";

  let body: ReactNode;
  if (mode !== "add" && contextQuery.isPending) {
    body = (
      <Group justify="center" py="xl" style={{ flex: 1 }}>
        <Loader size="sm" color="brand" />
      </Group>
    );
  } else if (contextQuery.isError) {
    body = (
      <Box p="lg">
        <Alert variant="light" color="red" radius="md">
          {parseFrappeError(contextQuery.error)}
        </Alert>
      </Box>
    );
  } else if (mode !== "add" && !payout) {
    body = (
      <Box p="lg">
        <Alert variant="light" color="red" radius="md">
          This payout could not be found.
        </Alert>
      </Box>
    );
  } else {
    body = (
      <PayoutBody
        key={`${id ?? "new"}-${payout?.name ?? ""}-${context ? "c" : ""}`}
        mode={mode}
        context={context}
        contextLoading={!!id && contextQuery.isFetching && !context}
        payout={payout}
        investmentId={id}
        onInvestmentChange={setChosenId}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      withCloseButton={false}
      size="90vw"
      padding={0}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
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
      <Group
        gap="sm"
        wrap="nowrap"
        px={18}
        py={12}
        style={{ flex: "none", background: theme.other.brandGradient }}
      >
        <ThemeIcon
          size={34}
          radius="md"
          style={{ background: theme.other.headerIconOverlayBg }}
        >
          <IconCash size={18} />
        </ThemeIcon>
        <Box>
          <Text fw={700} c="white">
            {title}
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            Pay the investor against the repayment schedule of an investment.
          </Text>
        </Box>
        <Group gap={4} ml="auto" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Minimize"
            onClick={onMinimize}
          >
            <IconMinus size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Close"
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>
      {body}
    </Modal>
  );
}

/* ------------------------------- Body ------------------------------- */

interface FormValues {
  valueDate: string;
  paymentType: PayoutPaymentType;
  amount: number | "";
  paymentMode: InvestorFlowPaymentMode | null;
  paidFrom: string;
  bankAccount: string | null;
  referenceNumber: string;
  referenceDate: string;
  comment: string;
}

function initialValues(
  context: PayoutContext | null,
  payout: InvestorPayout | null,
): FormValues {
  if (payout) {
    return {
      valueDate: payout.value_date,
      paymentType: payout.payment_type,
      amount: Number(payout.payment_amount) || "",
      paymentMode: payout.payment_mode,
      paidFrom: payout.paid_from,
      bankAccount: payout.investor_bank_account ?? null,
      referenceNumber: payout.reference_number,
      referenceDate: payout.reference_date,
      comment: payout.comment ?? "",
    };
  }
  const today = toIso(new Date());
  return {
    valueDate: today,
    paymentType: "Pay Dues",
    amount: "",
    paymentMode: null,
    paidFrom: context?.default_paid_from ?? "",
    bankAccount:
      context?.bank_accounts.find((b) => b.is_default)?.name ??
      context?.bank_accounts[0]?.name ??
      null,
    referenceNumber: "",
    referenceDate: today,
    comment: "",
  };
}

function PayoutBody({
  mode,
  context,
  contextLoading,
  payout,
  investmentId,
  onInvestmentChange,
  onClose,
}: {
  mode: PayoutModalMode;
  context: PayoutContext | null;
  contextLoading: boolean;
  payout: InvestorPayout | null;
  investmentId: string | null;
  onInvestmentChange: (id: string | null) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const companyCurrency = useCompanyStore((s) => s.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const symbol = getSymbol(companyCurrency);

  const [tab, setTab] = useState<"payment" | "schedule">("payment");
  const [v, setV] = useState<FormValues>(() => initialValues(context, payout));
  const update = (patch: Partial<FormValues>) =>
    setV((prev) => ({ ...prev, ...patch }));
  const readOnly =
    mode === "view" || (payout ? payout.record_status !== "Draft" : false);

  /* Investment search (Add) */
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const candidatesQuery = useQuery({
    queryKey: ["payoutCandidates", debouncedSearch],
    queryFn: () => getPayoutCandidates(debouncedSearch.trim() || undefined),
    enabled: mode === "add",
    // Always fetched fresh when Add Payout opens: only investments with something still owed are listed.
    staleTime: 0,
  });
  const candidateOptions = (candidatesQuery.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.id} · ${c.investor} · ${c.investor_email || c.investor_mobile || c.investor_id} · next ${fmtAmount(c.next_emi_amount)}`,
  }));
  if (
    investmentId &&
    !candidateOptions.some((o) => o.value === investmentId) &&
    context
  ) {
    candidateOptions.unshift({
      value: investmentId,
      label: `${investmentId} · ${context.investor}`,
    });
  }

  /* Paid From: ledger accounts */
  const [accountSearch, setAccountSearch] = useState("");
  const [debouncedAccount] = useDebouncedValue(accountSearch, 300);
  const accountsQuery = useQuery({
    queryKey: ["ledgerAccountSearch", debouncedAccount],
    queryFn: () => searchLedgerAccounts(debouncedAccount),
    enabled: !readOnly,
  });
  const accountOptions = Array.from(
    new Set([
      ...(v.paidFrom ? [v.paidFrom] : []),
      ...(accountsQuery.data ?? []).map((a) => a.name),
    ]),
  );

  /* Payment effect (approved payouts show what they did; otherwise a live preview) */
  const [debouncedAmount] = useDebouncedValue(v.amount, 350);
  const previewQuery = useQuery({
    queryKey: ["payoutPreview", investmentId, v.paymentType, debouncedAmount],
    queryFn: () =>
      previewInvestorPayout(
        investmentId as string,
        v.paymentType,
        v.paymentType === "Pay Any" ? Number(debouncedAmount) || null : null,
      ),
    enabled:
      !!investmentId &&
      !!context &&
      !(payout && payout.record_status !== "Draft") &&
      (v.paymentType !== "Pay Any" || Number(debouncedAmount) > 0),
    retry: false,
  });
  const effect =
    payout && payout.record_status !== "Draft"
      ? {
          payment_amount: payout.payment_amount,
          principal: Number(payout.principal_paid) || 0,
          interest: Number(payout.interest_paid) || 0,
          penalty: Number(payout.penalty_paid) || 0,
          allocations: payout.allocations,
        }
      : (previewQuery.data ?? null);
  const amountToPay =
    v.paymentType === "Pay Any"
      ? Number(v.amount) || 0
      : (effect?.payment_amount ?? 0);

  /* Save (Draft) */
  const problem = !context
    ? "Select the investment."
    : !context.next_emi && mode === "add"
      ? "Nothing is owed on this investment."
      : !v.valueDate
        ? "Enter the value date."
        : v.paymentType === "Pay Any" && !(Number(v.amount) > 0)
          ? "Enter the amount to pay."
          : !v.paymentMode
            ? "Select the payment mode."
            : !v.paidFrom
              ? "Select the account the money is paid from."
              : !v.referenceNumber.trim()
                ? "Enter the reference number."
                : !v.referenceDate
                  ? "Enter the reference date."
                  : previewQuery.isError
                    ? parseFrappeError(previewQuery.error)
                    : "";

  const payload = (): PayoutPayload => ({
    value_date: v.valueDate,
    payment_type: v.paymentType,
    payment_amount: v.paymentType === "Pay Any" ? Number(v.amount) : null,
    payment_mode: v.paymentMode as InvestorFlowPaymentMode,
    paid_from: v.paidFrom,
    investor_bank_account: v.bankAccount,
    reference_number: v.referenceNumber.trim(),
    reference_date: v.referenceDate,
    comment: v.comment.trim() || null,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      payout
        ? updateInvestorPayout({
            id: investmentId as string,
            payout: payout.name,
            payload: payload(),
          })
        : addInvestorPayout({ id: investmentId as string, payload: payload() }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["investorPayouts"] });
      queryClient.invalidateQueries({
        queryKey: ["payoutContext", investmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["payoutCandidates"] });
      onClose();
      openCommonModal({
        heading: payout ? "Payout Updated" : "Payout Saved as Draft",
        subtitle: "",
        body: `${fmtAmount(Number(saved.payment_amount) || 0)} for ${context?.investor ?? ""} is saved as Draft. Approve it from the Investor Payouts list to post the Journal Entry.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: unknown) =>
      openCommonModal({
        heading: "Save Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  const next = context?.next_emi ?? null;

  return (
    <>
      {/* Tabs */}
      <Group
        gap={0}
        px={18}
        pt={8}
        style={{
          flex: "none",
          borderBottom: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {[
          {
            key: "payment" as const,
            label: "Payment",
            icon: <IconCash size={14} />,
          },
          {
            key: "schedule" as const,
            label: "Schedule",
            icon: <IconChecklist size={14} />,
          },
        ].map((t) => (
          <Box
            key={t.key}
            component="button"
            type="button"
            onClick={() => setTab(t.key)}
            px="md"
            py={8}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              borderBottom: `2px solid ${tab === t.key ? "var(--mantine-color-brand-6)" : "transparent"}`,
              color:
                tab === t.key
                  ? "var(--mantine-color-brand-7)"
                  : "var(--mantine-color-slate-6)",
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.icon}
            {t.label}
            {t.key === "schedule" && context && (
              <Badge size="xs" variant="light" color="slate" radius="xl">
                {context.schedule.length}
              </Badge>
            )}
          </Box>
        ))}
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {tab === "payment" ? (
          <>
            {/* Left: the payment */}
            <Box p="md" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
              <Paper radius="md" p="md" withBorder>
                <Group gap="xs" mb="md" wrap="wrap">
                  <IconClipboardList
                    size={16}
                    color="var(--mantine-color-brand-6)"
                  />
                  <Text fw={700} fz="sm" c="slate.8">
                    Executing payout for
                  </Text>
                  {context ? (
                    <>
                      <Badge
                        variant="light"
                        color="brand"
                        radius="sm"
                        style={{ textTransform: "none" }}
                      >
                        {context.id}
                      </Badge>
                      <Text c="slate.4">/</Text>
                      <Badge
                        variant="light"
                        color="orange"
                        radius="sm"
                        style={{ textTransform: "none" }}
                      >
                        {context.investor_id}
                      </Badge>
                      <Text fz="xs" c="slate.6">
                        {context.investor} · {context.investment_product_name}
                      </Text>
                    </>
                  ) : (
                    <Text fz="xs" c="slate.5">
                      choose the investment below
                    </Text>
                  )}
                </Group>

                <fieldset
                  disabled={readOnly}
                  style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
                >
                  <Stack gap="md">
                    {mode === "add" && (
                      <Select
                        label="Investment"
                        description="Search by investment ID, investor name, mobile, customer ID or email"
                        inputWrapperOrder={[
                          "label",
                          "input",
                          "description",
                          "error",
                        ]}
                        placeholder="Search investment"
                        withAsterisk
                        searchable
                        clearable
                        size="sm"
                        radius="md"
                        data={candidateOptions}
                        value={investmentId}
                        onChange={(value) => {
                          onInvestmentChange(value);
                        }}
                        searchValue={search}
                        onSearchChange={setSearch}
                        filter={({ options }) => options}
                        rightSection={
                          candidatesQuery.isFetching ? (
                            <Loader size={14} />
                          ) : undefined
                        }
                        nothingFoundMessage={
                          candidatesQuery.isFetching
                            ? "Searching…"
                            : "No investment with unpaid EMIs"
                        }
                      />
                    )}
                    {contextLoading && (
                      <Group justify="center" py="md">
                        <Loader size="sm" color="brand" />
                      </Group>
                    )}

                    {context && (
                      <>
                        <Box maw={240}>
                          <InvestorDateInput
                            label="Value date"
                            withAsterisk
                            size="sm"
                            radius="md"
                            value={v.valueDate}
                            onChange={(value) => update({ valueDate: value })}
                          />
                        </Box>

                        <Box>
                          <Text fz="sm" fw={500} mb={6}>
                            Nature of payment
                          </Text>
                          <SegmentedControl
                            fullWidth
                            radius="md"
                            color="brand"
                            value={v.paymentType}
                            onChange={(value) =>
                              update({
                                paymentType: value as PayoutPaymentType,
                              })
                            }
                            data={PAYOUT_PAYMENT_TYPES.map((t) => ({
                              value: t,
                              label: (
                                <Group gap={6} justify="center" wrap="nowrap">
                                  {TYPE_ICONS[t]}
                                  <span>{t}</span>
                                </Group>
                              ),
                            }))}
                          />
                          <Text fz={11} c="slate.5" mt={4}>
                            {v.paymentType === "Pay Dues"
                              ? "Pays what is owed on the next unpaid EMI."
                              : v.paymentType === "Pay Full"
                                ? "Pays every unpaid EMI (closes the schedule)."
                                : "Any amount: the oldest unpaid EMI first, interest before principal."}
                          </Text>
                        </Box>

                        <SimpleGrid
                          cols={{ base: 1, sm: 2, lg: 4 }}
                          spacing="md"
                        >
                          <NumberInput
                            label="Amount to pay"
                            withAsterisk
                            size="sm"
                            radius="md"
                            hideControls
                            min={0}
                            decimalScale={2}
                            thousandSeparator=","
                            leftSection={
                              <Text fz={11} c="slate.4">
                                {symbol}
                              </Text>
                            }
                            readOnly={v.paymentType !== "Pay Any"}
                            styles={
                              v.paymentType !== "Pay Any"
                                ? {
                                    input: {
                                      background:
                                        "var(--mantine-color-slate-0)",
                                      fontWeight: 700,
                                    },
                                  }
                                : undefined
                            }
                            value={
                              v.paymentType === "Pay Any"
                                ? v.amount
                                : amountToPay || ""
                            }
                            onChange={(n) =>
                              update({ amount: n === "" ? "" : Number(n) })
                            }
                          />
                          <Select
                            label="Payment mode"
                            withAsterisk
                            size="sm"
                            radius="md"
                            placeholder="Select payment mode"
                            data={[...INVESTOR_FLOW_PAYMENT_MODES]}
                            value={v.paymentMode}
                            onChange={(value) =>
                              update({
                                paymentMode:
                                  value as InvestorFlowPaymentMode | null,
                              })
                            }
                          />
                          <Select
                            label="Paid from"
                            description="Company bank GL"
                            inputWrapperOrder={[
                              "label",
                              "input",
                              "description",
                              "error",
                            ]}
                            withAsterisk
                            size="sm"
                            radius="md"
                            searchable
                            placeholder="Search account"
                            data={accountOptions}
                            value={v.paidFrom || null}
                            onChange={(value) =>
                              update({ paidFrom: value ?? "" })
                            }
                            searchValue={accountSearch}
                            onSearchChange={setAccountSearch}
                            filter={({ options }) => options}
                            rightSection={
                              accountsQuery.isFetching ? (
                                <Loader size={14} />
                              ) : undefined
                            }
                          />
                          <Select
                            label="Investor bank account"
                            size="sm"
                            radius="md"
                            clearable
                            placeholder={
                              context.bank_accounts.length
                                ? "Select account"
                                : "No bank account"
                            }
                            data={context.bank_accounts.map((b) => ({
                              value: b.name,
                              label: `${b.bank}${b.bank_account_no ? ` · ${b.bank_account_no}` : ""}`,
                            }))}
                            value={v.bankAccount}
                            onChange={(value) => update({ bankAccount: value })}
                          />
                          <TextInput
                            label="Reference number"
                            withAsterisk
                            size="sm"
                            radius="md"
                            placeholder="Enter reference no"
                            leftSection={<IconHash size={14} />}
                            value={v.referenceNumber}
                            onChange={(e) =>
                              update({ referenceNumber: e.currentTarget.value })
                            }
                          />
                          <InvestorDateInput
                            label="Reference date"
                            withAsterisk
                            size="sm"
                            radius="md"
                            value={v.referenceDate}
                            onChange={(value) =>
                              update({ referenceDate: value })
                            }
                          />
                        </SimpleGrid>

                        <Textarea
                          label="Comment"
                          size="sm"
                          radius="md"
                          autosize
                          minRows={2}
                          placeholder="Add a comment or description..."
                          value={v.comment}
                          onChange={(e) =>
                            update({ comment: e.currentTarget.value })
                          }
                        />
                      </>
                    )}
                  </Stack>
                </fieldset>
              </Paper>
            </Box>

            {/* Right: dues summary and payment effect */}
            <Box
              p="md"
              style={{
                width: 340,
                flex: "none",
                borderLeft: "1px solid var(--mantine-color-slate-2)",
                background: "var(--mantine-color-slate-0)",
                overflowY: "auto",
              }}
            >
              <Text
                fz="xs"
                fw={800}
                c="slate.8"
                tt="uppercase"
                style={{ letterSpacing: 0.5 }}
                mb="sm"
              >
                Dues summary
              </Text>
              {context ? (
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconCalendarDue
                      size={16}
                      color="var(--mantine-color-slate-5)"
                    />
                    <Box>
                      <Text fz={11} c="slate.5">
                        Next EMI {next?.number ? `(#${next.number})` : ""}
                      </Text>
                      <Text fz="sm" fw={700}>
                        {next
                          ? formatInvestorDate(next.payment_date)
                          : "Nothing owed"}
                      </Text>
                    </Box>
                    {next && (
                      <Badge
                        size="xs"
                        variant="light"
                        color={ROW_STATUS_COLOR[next.status] ?? "slate"}
                        ml="auto"
                      >
                        {next.status}
                      </Badge>
                    )}
                  </Group>
                  <Paper radius="md" p="sm" withBorder>
                    {[
                      ["Principal due", next?.principal ?? 0],
                      ["Interest due", next?.interest ?? 0],
                      ["Penalty", next?.penalty ?? 0],
                    ].map(([label, value]) => (
                      <Group
                        key={label as string}
                        justify="space-between"
                        py={3}
                      >
                        <Text fz="xs" c="slate.6">
                          {label}
                        </Text>
                        <Text fz="xs" ff="monospace">
                          {fmtAmount(Number(value))}
                        </Text>
                      </Group>
                    ))}
                    <Group
                      justify="space-between"
                      pt={6}
                      mt={4}
                      style={{
                        borderTop: "1px solid var(--mantine-color-slate-2)",
                      }}
                    >
                      <Text fz="sm" fw={800}>
                        Next EMI due
                      </Text>
                      <Text fz="sm" fw={800} ff="monospace">
                        {fmtAmount(next?.total ?? 0)}
                      </Text>
                    </Group>
                    <Group justify="space-between" pt={4}>
                      <Text fz="xs" c="slate.5">
                        All unpaid EMIs ({context.outstanding.emis})
                      </Text>
                      <Text fz="xs" fw={700} ff="monospace">
                        {fmtAmount(context.outstanding.total)}
                      </Text>
                    </Group>
                  </Paper>

                  <Text
                    fz="xs"
                    fw={800}
                    c="slate.8"
                    tt="uppercase"
                    style={{ letterSpacing: 0.5 }}
                    mt="xs"
                  >
                    Payment effect
                  </Text>
                  {previewQuery.isFetching && !effect ? (
                    <Group justify="center" py="sm">
                      <Loader size="xs" color="brand" />
                    </Group>
                  ) : effect && effect.allocations.length ? (
                    <Paper radius="md" p="sm" withBorder>
                      <Group justify="space-between" mb={6}>
                        <Text fz="xs" c="slate.6">
                          Amount
                        </Text>
                        <Text fz="sm" fw={800} c="brand.7" ff="monospace">
                          {fmtAmount(effect.payment_amount)}
                        </Text>
                      </Group>
                      <Text fz={11} c="slate.5" mb={6}>
                        Interest {fmtAmount(effect.interest)} · Penalty{" "}
                        {fmtAmount(effect.penalty)} · Principal{" "}
                        {fmtAmount(effect.principal)}
                      </Text>
                      <Stack gap={4}>
                        {effect.allocations.map((a) => (
                          <Group
                            key={a.row}
                            justify="space-between"
                            wrap="nowrap"
                            px={8}
                            py={4}
                            style={{
                              borderRadius: 6,
                              background: "var(--mantine-color-white)",
                              border: "1px solid var(--mantine-color-slate-2)",
                            }}
                          >
                            <Box>
                              <Text fz="xs" fw={700}>
                                EMI #{a.number ?? "-"} ·{" "}
                                {formatInvestorDate(a.payment_date)}
                              </Text>
                              <Text fz={10} c="slate.5">
                                Int {fmtAmount(a.interest)}
                                {a.penalty
                                  ? ` · Pen ${fmtAmount(a.penalty)}`
                                  : ""}{" "}
                                · Prin {fmtAmount(a.principal)}
                              </Text>
                            </Box>
                            <Badge
                              size="xs"
                              variant="light"
                              color={a.settles ? "success" : "warning"}
                              style={{ textTransform: "none" }}
                            >
                              {a.settles ? "Paid" : "Partly"}
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  ) : (
                    <Text fz="xs" c="slate.5">
                      {previewQuery.isError
                        ? parseFrappeError(previewQuery.error)
                        : "Enter the payment to see its effect."}
                    </Text>
                  )}
                </Stack>
              ) : (
                <Text fz="xs" c="slate.5">
                  Select an investment.
                </Text>
              )}
            </Box>
          </>
        ) : (
          <Box p="md" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
            <ScheduleTable context={context} />
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Group
        justify="space-between"
        px={18}
        py={10}
        style={{
          flex: "none",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap={6}>
          {!readOnly && (
            <>
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: "50%",
                  background: `var(--mantine-color-${problem ? "warning" : "success"}-6)`,
                }}
              />
              <Text fz="xs" c={problem ? "warning.8" : "slate.6"}>
                {problem || "Ready to save the payout as Draft"}
              </Text>
            </>
          )}
          {readOnly && payout && (
            <Badge
              variant="light"
              radius="sm"
              color={
                payout.record_status === "Approved"
                  ? "success"
                  : payout.record_status === "Cancelled"
                    ? "danger"
                    : "slate"
              }
            >
              {payout.record_status}
              {payout.journal_entry ? ` · ${payout.journal_entry}` : ""}
            </Badge>
          )}
        </Group>
        <Group gap="sm">
          <Button variant="default" radius="xl" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              radius="xl"
              color="brand"
              disabled={!!problem || previewQuery.isFetching}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {payout ? "Save" : "Save as Draft"}
            </Button>
          )}
        </Group>
      </Group>
    </>
  );
}

/* ------------------------------ Schedule tab ------------------------------ */

function ScheduleTable({ context }: { context: PayoutContext | null }) {
  const companyCurrency = useCompanyStore((s) => s.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!context) {
    return (
      <Text fz="sm" c="slate.5">
        Select an investment to see its schedule.
      </Text>
    );
  }
  const rows = context.schedule;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const count = (status: string) =>
    rows.filter((r) => r.status === status).length;
  const unpaid = rows.length - count("Paid") - count("Partially Paid");

  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        {[
          { label: "EMIs", value: String(rows.length), color: "brand" },
          { label: "Paid", value: String(count("Paid")), color: "success" },
          {
            label: "Partially paid",
            value: String(count("Partially Paid")),
            color: "warning",
          },
          { label: "Unpaid", value: String(unpaid), color: "slate" },
        ].map((k) => (
          <Paper key={k.label} radius="md" p="sm" withBorder>
            <Text fz={11} c="slate.5">
              {k.label}
            </Text>
            <Text fz="lg" fw={800} c={`${k.color}.7`}>
              {k.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
      <Paper radius="md" withBorder style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={820}>
          <Table
            verticalSpacing={7}
            horizontalSpacing="sm"
            fz="xs"
            highlightOnHover
            striped
          >
            <Table.Thead bg="slate.0">
              <Table.Tr>
                {[
                  "#",
                  "Due date",
                  "Principal",
                  "Interest",
                  "Penalty",
                  "Total",
                  "Paid",
                  "Remaining",
                  "Status",
                ].map((h, i) => (
                  <Table.Th
                    key={h}
                    ta={i >= 2 && i <= 7 ? "right" : undefined}
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      color: "var(--mantine-color-slate-5)",
                    }}
                  >
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageRows.map((r) => (
                <Table.Tr key={r.name}>
                  <Table.Td c="slate.5">{r.number}</Table.Td>
                  <Table.Td>{formatInvestorDate(r.payment_date)}</Table.Td>
                  <Table.Td ta="right">{fmtAmount(r.principal)}</Table.Td>
                  <Table.Td ta="right">{fmtAmount(r.interest)}</Table.Td>
                  <Table.Td ta="right">
                    {r.penalty ? fmtAmount(r.penalty) : "-"}
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    {fmtAmount(r.total)}
                  </Table.Td>
                  <Table.Td ta="right" c="success.7">
                    {r.paid ? fmtAmount(r.paid) : "-"}
                  </Table.Td>
                  <Table.Td ta="right" c={r.remaining ? "danger.7" : "slate.4"}>
                    {r.remaining ? fmtAmount(r.remaining) : "-"}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      variant="light"
                      color={ROW_STATUS_COLOR[r.status] ?? "slate"}
                      style={{ textTransform: "none" }}
                    >
                      {r.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Group
          gap="md"
          c="slate.6"
          style={{ fontSize: "var(--mantine-font-size-xs)" }}
        >
          <span>
            Showing {rows.length ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(rows.length, currentPage * pageSize)} of {rows.length}
          </span>
          <Group gap="xs">
            <span>Rows:</span>
            <Select
              data={["10", "20", "50"]}
              value={String(pageSize)}
              onChange={(value) => {
                setPageSize(Number(value) || 10);
                setPage(1);
              }}
              allowDeselect={false}
              size="xs"
              radius="xl"
              w={70}
            />
          </Group>
        </Group>
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={setPage}
          color="brand"
          size="xs"
          radius="xl"
        />
      </Group>
    </Stack>
  );
}
