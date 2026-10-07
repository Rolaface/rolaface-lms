import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  NumberInput,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvestorEarningById,
  updateInvestorEarning,
} from "../../../api/Investor/investorFlowApi";
import {
  REPAYMENT_FREQUENCIES,
  type InvestorEarning,
  type InvestorEarningDetails,
  type InvestorEarningScheduleRow,
  type RepaymentFrequency,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import {
  KpiGrid,
  MS_PER_MONTH,
  SectionBox,
  TH_STYLE,
  createInitialState,
  inr,
  loadInvestorFlowState,
  type ModalState,
  type Schedule,
} from "./InvestorModalShared";
import { STAGES, StageShell, StageSideNav, type StageId } from "./StageShell";
import { ProcessingReadOnlyView } from "./InvestorModal";

const ROWS_PER_PAGE = 10;

type ScheduleAmountField =
  | "principal_amount"
  | "interest_amount"
  | "penalty_amount"
  | "total_payment";

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

/** Schedule for the read-only Investor Processing view, from the saved earning rows. */
function scheduleFromEarning(e: InvestorEarning): Schedule | null {
  if (!e.schedule.length) return null;
  const totalInterest = e.schedule.reduce((a, r) => a + (Number(r.interest_amount) || 0), 0);
  const start = new Date(e.payment_date || e.schedule[0].payment_date);
  const end = new Date(e.mat_date || e.schedule[e.schedule.length - 1].payment_date);
  return {
    totalMonths: Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_MONTH)),
    totalInterest,
    perPayment: totalInterest / e.schedule.length,
    count: e.schedule.length,
    rows: e.schedule.map((r) => ({
      date: new Date(r.payment_date),
      principal: Number(r.principal_amount) || 0,
      interest: Number(r.interest_amount) || 0,
    })),
  };
}

/** First problem in the draft, or "" when it can be saved. */
function validateDraft({ details, rows }: EarningDraft): string {
  if (!Number.isInteger(details.amount_invested) || details.amount_invested <= 0)
    return "Amount invested must be a whole number greater than 0.";
  if (!details.frequency) return "Select the frequency.";
  if (!details.first_repay_date) return "Enter the first repay date.";
  if (!details.mat_date) return "Enter the maturity date.";
  if (new Date(details.mat_date).getTime() <= new Date(details.first_repay_date).getTime())
    return "Maturity date must be after the first repay date.";
  if (!(details.rate_of_interest >= 0 && details.rate_of_interest <= 100))
    return "Rate of interest must be between 0 and 100.";
  const penalty = details.rate_of_penalty ?? 0;
  if (!(penalty >= 0 && penalty <= 100)) return "Rate of penalty must be between 0 and 100.";
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
}

function EarningsStatements({ draft, onChange }: EarningsStatementsProps) {
  const [page, setPage] = useState(1);
  const { details, rows } = draft;
  const editable = !!onChange;

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const totalInterest = rows.reduce((a, r) => a + (Number(r.interest_amount) || 0), 0);
  const totalPayment = rows.reduce((a, r) => a + (Number(r.total_payment) || 0), 0);

  const setDetail = (patch: Partial<InvestorEarningDetails>) =>
    onChange?.({ ...draft, details: { ...details, ...patch } });

  const setRow = (name: string, patch: Partial<InvestorEarningScheduleRow>) =>
    onChange?.({
      ...draft,
      rows: rows.map((r) => (r.name === name ? { ...r, ...patch } : r)),
    });

  const amountCell = (row: InvestorEarningScheduleRow, field: ScheduleAmountField) =>
    editable ? (
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
        <Box style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <NumberInput
            label="Amount invested"
            size="sm"
            radius="md"
            required={editable}
            readOnly={!editable}
            min={1}
            allowDecimal={false}
            thousandSeparator=","
            value={details.amount_invested}
            onChange={(v) => setDetail({ amount_invested: Number(v) || 0 })}
          />
          <NumberInput
            label="Rate of interest (%)"
            size="sm"
            radius="md"
            required={editable}
            readOnly={!editable}
            min={0}
            max={100}
            decimalScale={2}
            value={details.rate_of_interest}
            onChange={(v) => setDetail({ rate_of_interest: Number(v) || 0 })}
          />
          <Select
            label="Frequency"
            size="sm"
            radius="md"
            required={editable}
            readOnly={!editable}
            allowDeselect={false}
            data={[...REPAYMENT_FREQUENCIES]}
            value={details.frequency}
            onChange={(v) => v && setDetail({ frequency: v as RepaymentFrequency })}
          />
          <TextInput
            type="date"
            label="First repay date"
            size="sm"
            radius="md"
            required={editable}
            readOnly={!editable}
            value={details.first_repay_date ?? ""}
            onChange={(e) => setDetail({ first_repay_date: e.currentTarget.value || null })}
          />
          <TextInput
            type="date"
            label="Maturity date"
            size="sm"
            radius="md"
            required={editable}
            readOnly={!editable}
            value={details.mat_date ?? ""}
            onChange={(e) => setDetail({ mat_date: e.currentTarget.value || null })}
          />
          <NumberInput
            label="Rate of penalty (%)"
            size="sm"
            radius="md"
            readOnly={!editable}
            min={0}
            max={100}
            decimalScale={2}
            value={details.rate_of_penalty ?? ""}
            onChange={(v) => setDetail({ rate_of_penalty: v === "" ? null : Number(v) })}
          />
        </Box>
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
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pageRows.map((row) => (
                    <Table.Tr key={row.name}>
                      <Table.Td>{row.idx}</Table.Td>
                      <Table.Td miw={140}>
                        {editable ? (
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
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
            <Group justify="space-between" mt="sm">
              <Text fz="xs" c="slate.5">
                {rows.length} payouts · Total {inr(totalPayment)}
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
  const draftError = readOnly ? "" : validateDraft(draft);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateInvestorEarning({
        id: investorFlowId,
        payload: {
          ...draft.details,
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
      queryClient.invalidateQueries({ queryKey: ["investorEarning", investorFlowId] });
      queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
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
    onError: (error: any) =>
      openCommonModal({
        heading: "Update Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
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
  } else if (!readOnly) {
    footer = (
      <>
        {draftError && (
          <Text fz="xs" c="red" mr="auto">
            {draftError}
          </Text>
        )}
        <Button
          size="sm"
          radius="xl"
          color="brand"
          disabled={!!draftError}
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
      stageIndex={STAGE_INDEX}
      state={flowState}
      title={readOnly ? "View Earnings" : "Edit Earnings"}
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
          <EarningsStatements draft={draft} onChange={readOnly ? undefined : setDraft} />
        </section>
      )}
    </StageShell>
  );
}
