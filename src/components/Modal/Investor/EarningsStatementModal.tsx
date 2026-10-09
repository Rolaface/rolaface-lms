import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  NumberInput,
  Pagination,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeInvestorFlow,
  getInvestorEarningById,
  payInvestorEarningRow,
  updateInvestorEarning,
} from "../../../api/Investor/investorFlowApi";
import {
  type InvestorEarning,
  type InvestorEarningDetails,
  type InvestorEarningRowStatus,
  type InvestorEarningScheduleRow,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import {
  KeyValueList,
  KpiGrid,
  SectionBox,
  TH_STYLE,
  createInitialState,
  fmtDate,
  inr,
  loadInvestorFlowState,
  scheduleFromEarning,
  toIso,
  type ModalState,
} from "./InvestorModalShared";
import { STAGES, StageShell, StageSideNav, type StageId } from "./StageShell";
import { ProcessingReadOnlyView } from "./InvestorModal";

const ROWS_PER_PAGE = 10;

type ScheduleAmountField =
  | "principal_amount"
  | "interest_amount"
  | "penalty_amount"
  | "total_payment";

const ROW_STATUS_COLOR: Record<InvestorEarningRowStatus, string> = {
  Pending: "slate",
  Accrued: "warning",
  Paid: "success",
};

/** Accrued rows keep their date, principal and interest; only penalty / total can change. */
const ACCRUED_LOCKED_FIELDS = new Set(["payment_date", "principal_amount", "interest_amount"]);

/** Details and schedule rows being viewed / edited. */
interface EarningDraft {
  details: InvestorEarningDetails;
  rows: InvestorEarningScheduleRow[];
}

const draftFromEarning = (e: InvestorEarning): EarningDraft => ({
  details: {
    amount_invested: Number(e.amount_invested) || 0,
    frequency: e.frequency,
    mat_date: e.mat_date,
    rate_of_interest: Number(e.rate_of_interest) || 0,
    first_repay_date: e.first_repay_date,
    rate_of_penalty: e.rate_of_penalty,
  },
  rows: e.schedule.map((r) => ({ ...r })),
});

/** First problem in the schedule rows (the details are read-only), or "" when they can be saved. */
function validateDraft({ rows }: EarningDraft): string {
  for (const r of rows) {
    if (!r.payment_date) return `Row ${r.idx}: enter the payment date.`;
    const amounts = [r.principal_amount, r.interest_amount, r.penalty_amount, r.total_payment];
    if (amounts.some((v) => !(Number(v) >= 0))) return `Row ${r.idx}: amounts cannot be negative.`;
  }
  return "";
}

/* ------------------------------------------------------------------ */
/* Earning & Settlement content                                        */
/* ------------------------------------------------------------------ */

interface EarningsStatementsProps {
  draft: EarningDraft;
  /** Omitted when read-only. */
  onChange?: (draft: EarningDraft) => void;
  /** Pays one schedule row; omitted when read-only. */
  onPay?: (row: InvestorEarningScheduleRow) => void;
  /** Why Pay is disabled (e.g. unsaved changes), or "". */
  payDisabledReason?: string;
  /** Row being paid. */
  payingRow?: string | null;
}

function EarningsStatements({
  draft,
  onChange,
  onPay,
  payDisabledReason = "",
  payingRow = null,
}: EarningsStatementsProps) {
  const [page, setPage] = useState(1);
  const { details, rows } = draft;
  const editable = !!onChange;

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const totalInterest = rows.reduce((a, r) => a + (Number(r.interest_amount) || 0), 0);
  const totalPayment = rows.reduce((a, r) => a + (Number(r.total_payment) || 0), 0);

  const setRow = (name: string, patch: Partial<InvestorEarningScheduleRow>) =>
    onChange?.({
      ...draft,
      rows: rows.map((r) => {
        if (r.name !== name) return r;
        const next = { ...r, ...patch };
        // Principal / Interest / Penalty changed: refill Total Payment (it stays editable).
        if ("principal_amount" in patch || "interest_amount" in patch || "penalty_amount" in patch) {
          next.total_payment =
            Math.round(
              ((Number(next.principal_amount) || 0) +
                (Number(next.interest_amount) || 0) +
                (Number(next.penalty_amount) || 0)) *
                100,
            ) / 100;
        }
        return next;
      }),
    });

  /** Paid rows are locked; Accrued rows lock date, principal and interest. */
  const cellEditable = (row: InvestorEarningScheduleRow, field: string) =>
    editable &&
    row.status !== "Paid" &&
    !(row.status === "Accrued" && ACCRUED_LOCKED_FIELDS.has(field));

  const amountCell = (row: InvestorEarningScheduleRow, field: ScheduleAmountField) =>
    cellEditable(row, field) ? (
      <NumberInput
        size="xs"
        radius="md"
        min={0}
        decimalScale={2}
        thousandSeparator=","
        hideControls
        value={row[field]}
        onChange={(v) => setRow(row.name, { [field]: Number(v) || 0 })}
      />
    ) : (
      <Text fz="xs" ta="right">
        {inr(Number(row[field]) || 0)}
      </Text>
    );

  return (
    <>
      <KpiGrid
        items={[
          { label: "Amount invested", value: inr(details.amount_invested), color: "info" },
          { label: "Rate of interest", value: `${details.rate_of_interest}% p.a.`, color: "warning" },
          { label: "Total interest", value: inr(totalInterest), color: "success" },
          { label: "Payouts", value: String(rows.length), color: "brand" },
        ]}
      />

      <SectionBox title="Details">
        <KeyValueList
          cols={2}
          rows={[
            { label: "Amount invested", value: inr(details.amount_invested) },
            { label: "Rate of interest", value: `${details.rate_of_interest}% p.a.` },
            { label: "Frequency", value: details.frequency || "—" },
            {
              label: "First repay date",
              value: details.first_repay_date ? fmtDate(details.first_repay_date) : "—",
            },
            { label: "Maturity date", value: details.mat_date ? fmtDate(details.mat_date) : "—" },
            {
              label: "Rate of penalty",
              value: details.rate_of_penalty != null ? `${details.rate_of_penalty}% p.a.` : "—",
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="Investor schedule">
        {rows.length === 0 ? (
          <Alert variant="light" color="brand" radius="md">
            No schedule saved for this investment.
          </Alert>
        ) : (
          <>
            <Box style={{ overflowX: "auto" }}>
              <Table verticalSpacing={6} horizontalSpacing="sm" fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={TH_STYLE}>#</Table.Th>
                    <Table.Th style={TH_STYLE}>Payment date</Table.Th>
                    <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Principal</Table.Th>
                    <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Interest</Table.Th>
                    <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Penalty</Table.Th>
                    <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Total payment</Table.Th>
                    <Table.Th style={TH_STYLE}>Status</Table.Th>
                    {onPay && <Table.Th />}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pageRows.map((row) => (
                    <Table.Tr key={row.name}>
                      <Table.Td>{row.idx}</Table.Td>
                      <Table.Td miw={140}>
                        {cellEditable(row, "payment_date") ? (
                          <TextInput
                            type="date"
                            size="xs"
                            radius="md"
                            value={row.payment_date ?? ""}
                            onChange={(e) =>
                              setRow(row.name, { payment_date: e.currentTarget.value })
                            }
                          />
                        ) : (
                          row.payment_date
                        )}
                      </Table.Td>
                      <Table.Td miw={110}>{amountCell(row, "principal_amount")}</Table.Td>
                      <Table.Td miw={110}>{amountCell(row, "interest_amount")}</Table.Td>
                      <Table.Td miw={110}>{amountCell(row, "penalty_amount")}</Table.Td>
                      <Table.Td miw={120}>{amountCell(row, "total_payment")}</Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          radius="sm"
                          size="sm"
                          color={ROW_STATUS_COLOR[row.status ?? "Pending"]}
                        >
                          {row.status ?? "Pending"}
                        </Badge>
                      </Table.Td>
                      {onPay && (
                        <Table.Td ta="right">
                          {row.status !== "Paid" && (
                            <Button
                              size="compact-xs"
                              radius="xl"
                              color="brand"
                              disabled={!!payDisabledReason || (!!payingRow && payingRow !== row.name)}
                              loading={payingRow === row.name}
                              title={payDisabledReason || undefined}
                              onClick={() => onPay(row)}
                            >
                              Pay
                            </Button>
                          )}
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
            <Group justify="space-between" mt="sm">
              <Text fz="xs" c="slate.5">
                {rows.length} payouts · {rows.filter((r) => r.status === "Paid").length} paid ·
                Total {inr(totalPayment)}
                {payDisabledReason && onPay ? ` · ${payDisabledReason}` : ""}
              </Text>
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setPage}
                color="brand"
                size="xs"
                radius="xl"
              />
            </Group>
          </>
        )}
      </SectionBox>
    </>
  );
}

/** Read-only Earning & Settlement of an Investor Flow (loads it by ID). */
export function EarningsStatementsView({ investorFlowId }: { investorFlowId: string }) {
  const { data: earning, isLoading, error } = useQuery({
    queryKey: ["investorEarning", investorFlowId],
    queryFn: () => getInvestorEarningById(investorFlowId),
  });

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" color="brand" />
      </Group>
    );
  }
  if (error || !earning) {
    return (
      <Alert variant="light" color="red" radius="md">
        {error ? parseFrappeError(error) : "The earnings could not be loaded."}
      </Alert>
    );
  }
  return <EarningsStatements draft={draftFromEarning(earning)} />;
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface EarningsStatementsModalProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Flow ID (Status Received). */
  investorFlowId: string;
  /** View (Eye) when true, edit (Pencil) when false. */
  readOnly?: boolean;
  /** Called after the edits are saved. */
  onSaved?: () => void;
  /** Minimizes the modal to the dock. */
  onMinimize: () => void;
}

const STAGE_INDEX = 1;

/**
 * Stage 2 — Earnings & Statements.
 * Side nav: Investor Processing (view only) and Earnings & Statements.
 */
export function EarningsStatementsModal({
  opened,
  onClose,
  investorFlowId,
  readOnly = false,
  onSaved,
  onMinimize,
}: EarningsStatementsModalProps) {
  const earningQuery = useQuery({
    queryKey: ["investorEarning", investorFlowId],
    queryFn: () => getInvestorEarningById(investorFlowId),
    enabled: opened,
  });
  const flowQuery = useQuery({
    queryKey: ["investorFlow", investorFlowId],
    queryFn: () => loadInvestorFlowState(investorFlowId),
    enabled: opened,
  });

  if (earningQuery.data && flowQuery.data) {
    return (
      <EarningsStage
        key={earningQuery.dataUpdatedAt}
        opened={opened}
        onClose={onClose}
        onMinimize={onMinimize}
        investorFlowId={investorFlowId}
        readOnly={readOnly}
        onSaved={onSaved}
        earning={earningQuery.data}
        flowState={flowQuery.data}
      />
    );
  }

  const error = earningQuery.error || flowQuery.error;
  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={createInitialState()}
      title={readOnly ? "View Earnings" : "Edit Earnings"}
    >
      <Group justify="center" py="xl">
        {error ? (
          <Text fz="sm" c="red">
            {parseFrappeError(error)}
          </Text>
        ) : (
          <Loader size="sm" color="brand" />
        )}
      </Group>
    </StageShell>
  );
}

function EarningsStage({
  opened,
  onClose,
  onMinimize,
  investorFlowId,
  readOnly,
  onSaved,
  earning,
  flowState,
}: Omit<EarningsStatementsModalProps, "readOnly"> & {
  readOnly: boolean;
  earning: InvestorEarning;
  flowState: ModalState;
}) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<StageId>("earnings");
  const [draft, setDraft] = useState<EarningDraft>(() => draftFromEarning(earning));
  const viewingEarlier = section !== "earnings";
  const processingSchedule = scheduleFromEarning(earning);
  // Only a Received investment can be edited / paid / closed.
  const editable = !readOnly && earning.status === "Received";
  const draftError = editable ? validateDraft(draft) : "";
  const isDirty = JSON.stringify(draft) !== JSON.stringify(draftFromEarning(earning));
  const allPaid = earning.schedule.length > 0 && earning.schedule.every((r) => r.status === "Paid");

  const refreshEarning = () => {
    queryClient.invalidateQueries({ queryKey: ["investorEarning", investorFlowId] });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlow", investorFlowId] });
  };

  const showFailure = (heading: string, error: any) =>
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });

  const payMutation = useMutation({
    mutationFn: (row: InvestorEarningScheduleRow) =>
      payInvestorEarningRow({ id: investorFlowId, row: row.name, paymentDate: toIso(new Date()) }),
    onSuccess: (_data, row) => {
      refreshEarning();
      openCommonModal({
        heading: "Payout Posted",
        subtitle: "",
        body: `Payout of ${inr(Number(row.total_payment) || 0)} for row ${row.idx} has been posted successfully.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => showFailure("Payout Failed", error),
  });

  const confirmPay = (row: InvestorEarningScheduleRow) =>
    openCommonModal({
      heading: "Pay Schedule Row",
      subtitle: "Please confirm this action before continuing.",
      body: `Pay ${inr(Number(row.total_payment) || 0)} for row ${row.idx} (due ${row.payment_date}) from the Company Bank Account, dated today?`,
      color: "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        { label: "Pay", color: "green", onClick: () => payMutation.mutate(row) },
      ],
    });

  const closeMutation = useMutation({
    mutationFn: () => closeInvestorFlow(investorFlowId),
    onSuccess: () => {
      refreshEarning();
      onClose();
      openCommonModal({
        heading: "Investment Closed",
        subtitle: "",
        body: "All payouts are done. The investment has been marked Matured.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => showFailure("Close Failed", error),
  });

  const confirmClose = () =>
    openCommonModal({
      heading: "Close Investment",
      subtitle: "Please confirm this action before continuing.",
      body: "Every payout has been made. Mark this investment as Matured?",
      color: "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        { label: "Close investment", color: "green", onClick: () => closeMutation.mutate() },
      ],
    });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateInvestorEarning({
        id: investorFlowId,
        payload: {
          schedule: draft.rows.map((row) => ({
            name: row.name,
            payment_date: row.payment_date,
            principal_amount: row.principal_amount,
            interest_amount: row.interest_amount,
            penalty_amount: row.penalty_amount,
            total_payment: row.total_payment,
          })),
        },
      }),
    onSuccess: () => {
      refreshEarning();
      onClose();
      openCommonModal({
        heading: "Earnings Updated",
        subtitle: "",
        body: "Earnings have been updated successfully.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
      onSaved?.();
    },
    onError: (error: any) => showFailure("Update Failed", error),
  });

  let footer;
  if (viewingEarlier) {
    footer = (
      <Button
        size="sm"
        radius="xl"
        variant="light"
        color="brand"
        onClick={() => setSection("earnings")}
      >
        Return to {STAGES[STAGE_INDEX].label}
      </Button>
    );
  } else if (editable) {
    footer = (
      <>
        {draftError && (
          <Text fz="xs" c="red" mr="auto">
            {draftError}
          </Text>
        )}
        {allPaid && (
          <Button
            size="sm"
            radius="xl"
            variant="light"
            color="success"
            disabled={isDirty}
            loading={closeMutation.isPending}
            onClick={confirmClose}
          >
            Close investment
          </Button>
        )}
        <Button
          size="sm"
          radius="xl"
          color="brand"
          disabled={!!draftError || !isDirty}
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </>
    );
  }

  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={flowState}
      title={editable ? "Edit Earnings" : "View Earnings"}
      sideNav={
        <StageSideNav stageIndex={STAGE_INDEX} section={section} onSelect={setSection} />
      }
      footer={footer}
    >
      {section === "processing" ? (
        <ProcessingReadOnlyView
          state={flowState}
          schedule={processingSchedule}
          existingCount={0}
        />
      ) : (
        <section className="inv-content">
          <EarningsStatements
            draft={draft}
            onChange={editable ? setDraft : undefined}
            onPay={editable ? confirmPay : undefined}
            payDisabledReason={isDirty ? "Save your changes before paying" : ""}
            payingRow={payMutation.isPending ? (payMutation.variables?.name ?? null) : null}
          />
        </section>
      )}
    </StageShell>
  );
}
