import { useState, type ReactNode } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Progress,
  Table,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { IconDownload, IconEye } from "@tabler/icons-react";
import {
  CUSTOMERS,
  PRODUCTS,
  KpiGrid,
  SectionBox,
  TH_STYLE,
  Tag,
  addMonths,
  fmtMonthYear,
  inr,
  type TabProps,
} from "./InvestorModalShared";
import {
  STAGES,
  StageShell,
  StageSideNav,
  type StageId,
} from "./StageShell";
import { usePdfPreview } from "./PdfPreviewModal";
import { buildStatementPdf, getPdfPalette } from "./Investmentpdf";

interface EarningsStatementsProps extends TabProps {
  readOnly?: boolean;
}

export function EarningsStatements({
  state,
  update,
  schedule,
  onToast,
  readOnly = false,
}: EarningsStatementsProps) {
  const theme = useMantineTheme();
  const pdfPreview = usePdfPreview();
  const customer = CUSTOMERS[state.customerIndex];
  if (!schedule || !state.startDate || !customer) return null;

  const startDate = state.startDate;
  const { rows, totalMonths } = schedule;
  const payoutRows = rows.slice(0, rows.length - 1);
  const simulatedDate = addMonths(startDate, state.monthsElapsed);
  const interestPaid = payoutRows
    .filter((r) => r.date.getTime() <= simulatedDate.getTime())
    .reduce((a, r) => a + r.interest, 0);
  const monthlyInterest = (state.amount * state.rate) / 1200;
  const months = Array.from({ length: state.monthsElapsed }, (_, i) => i + 1);
  const pendingCount = months.filter((i) => !state.sentStatements[i]).length;

  const windowFor = (i: number) => {
    const from = addMonths(startDate, i - 1);
    const to = addMonths(startDate, i);
    return {
      from,
      to,
      label: fmtMonthYear(to),
      paidOut: payoutRows
        .filter(
          (r) => r.date.getTime() > from.getTime() && r.date.getTime() <= to.getTime(),
        )
        .reduce((x, r) => x + r.interest, 0),
    };
  };

  const viewed =
    state.viewMonth && state.viewMonth <= state.monthsElapsed
      ? windowFor(state.viewMonth)
      : null;

  const statementPdf = (i: number) => {
    const w = windowFor(i);
    return {
      doc: buildStatementPdf(
        {
          contractNo: state.contractNo,
          statementLabel: w.label,
          periodFrom: w.from,
          periodTo: w.to,
          monthNo: i,
          totalMonths,
          customer,
          productName: PRODUCTS[state.productIndex].name,
          principal: state.amount,
          rate: state.rate,
          interestEarned: monthlyInterest,
          paidOut: w.paidOut,
          earnedToDate: monthlyInterest * i,
        },
        getPdfPalette(theme),
      ),
      title: `Investment Statement - ${w.label}`,
      fileName: `Statement-${state.contractNo}-${w.label.replace(" ", "-")}.pdf`,
    };
  };

  const viewStatementPdf = (i: number) => {
    const s = statementPdf(i);
    pdfPreview.open(s.doc, s.title, s.fileName);
  };

  const downloadStatementPdf = (i: number) => {
    const s = statementPdf(i);
    s.doc.save(s.fileName);
  };

  const sendStatement = (i: number) => {
    update({ sentStatements: { ...state.sentStatements, [i]: true } });
    onToast("Statement sent to " + customer.email);
  };

  const sendAllPending = () => {
    const sent = { ...state.sentStatements };
    months.forEach((j) => {
      sent[j] = true;
    });
    update({ sentStatements: sent });
    onToast("All pending statements sent");
  };

  return (
    <>
      <KpiGrid
        items={[
          { label: "Invested", value: inr(state.amount), color: "info" },
          {
            label: "Interest earned",
            value: inr(monthlyInterest * state.monthsElapsed),
            color: "success",
          },
          { label: "Interest paid out", value: inr(interestPaid), color: "brand" },
          {
            label: "Months completed",
            value: `${state.monthsElapsed} / ${totalMonths}`,
            color: "warning",
          },
        ]}
      />

      <Progress
        value={(state.monthsElapsed / totalMonths) * 100}
        color="success"
        size={8}
        radius="xl"
        mb="md"
      />

      <SectionBox
        title="Monthly statements"
        actions={
          readOnly ? undefined : (
            <>
              <Button
                size="xs"
                radius="xl"
                variant="default"
                disabled={pendingCount === 0}
                onClick={sendAllPending}
              >
                Send all pending ({pendingCount})
              </Button>
              <Button
                size="xs"
                radius="xl"
                color="brand"
                disabled={state.monthsElapsed >= totalMonths}
                onClick={() => update({ monthsElapsed: state.monthsElapsed + 1 })}
              >
                Advance one month
              </Button>
            </>
          )
        }
      >
        {!readOnly && (
          <Text fz="xs" c="slate.5">
            “Advance one month” simulates month-end. A statement is created for each
            month and sent to {customer.email}.
          </Text>
        )}

        {state.monthsElapsed > 0 ? (
          <Box mt={readOnly ? 0 : "sm"} style={{ maxHeight: 240, overflow: "auto" }}>
            <Table stickyHeader verticalSpacing={6} horizontalSpacing="sm" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={TH_STYLE}>Statement month</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Interest earned</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Paid out</Table.Th>
                  <Table.Th style={TH_STYLE}>Status</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[...months].reverse().map((i) => {
                  const w = windowFor(i);
                  const sent = !!state.sentStatements[i];
                  return (
                    <Table.Tr key={i}>
                      <Table.Td>{w.label}</Table.Td>
                      <Table.Td ta="right">{inr(monthlyInterest)}</Table.Td>
                      <Table.Td ta="right">{inr(w.paidOut)}</Table.Td>
                      <Table.Td>
                        <Tag
                          label={sent ? "Sent" : "Pending"}
                          color={sent ? "success" : "warning"}
                        />
                      </Table.Td>
                      <Table.Td ta="right">
                        <Group gap={6} justify="flex-end" wrap="nowrap">
                          <Tooltip label="View PDF" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="slate"
                              radius="md"
                              onClick={() => viewStatementPdf(i)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Download PDF" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="brand"
                              radius="md"
                              onClick={() => downloadStatementPdf(i)}
                            >
                              <IconDownload size={14} />
                            </ActionIcon>
                          </Tooltip>
                          {/* <Button
                            size="compact-xs"
                            radius="xl"
                            variant="default"
                            onClick={() => update({ viewMonth: i })}
                          >
                            View
                          </Button> */}
                          {!readOnly && (
                            <Button
                              size="compact-xs"
                              radius="xl"
                              variant="default"
                              disabled={sent}
                              onClick={() => sendStatement(i)}
                            >
                              Send
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Alert variant="light" color="brand" radius="md" mt="sm">
            No statements yet. Advance a month to generate the first one.
          </Alert>
        )}
      </SectionBox>
      {pdfPreview.modal}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface EarningsStatementsModalProps extends TabProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Processing (the four steps) rendered view-only by InvestorModal. */
  processingView: ReactNode;
  /** Called on Submit; InvestorModal then pops the Maturity modal. */
  onSubmit: () => void;
}

const STAGE_INDEX = 1;

/**
 * Stage 2 — Earnings & Statements.
 * Side nav: Investor Processing (view only) and Earnings & Statements (working).
 */
export function EarningsStatementsModal({
  opened,
  onClose,
  state,
  update,
  schedule,
  onToast,
  processingView,
  onSubmit,
}: EarningsStatementsModalProps) {
  const [section, setSection] = useState<StageId>("earnings");
  const viewingEarlier = section !== "earnings";

  // Same rule the old single modal used for leaving this step.
  const canSubmit = !!schedule && state.monthsElapsed >= schedule.totalMonths;

  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      stageIndex={STAGE_INDEX}
      state={state}
      sideNav={
        <StageSideNav stageIndex={STAGE_INDEX} section={section} onSelect={setSection} />
      }
      footer={
        viewingEarlier ? (
          <Button
            size="sm"
            radius="xl"
            variant="light"
            color="brand"
            onClick={() => setSection("earnings")}
          >
            Return to {STAGES[STAGE_INDEX].label}
          </Button>
        ) : (
          <Button
            size="sm"
            radius="xl"
            color="brand"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            Submit
          </Button>
        )
      }
    >
      {section === "processing" ? (
        processingView
      ) : (
        <section className="inv-content">
          <EarningsStatements
            state={state}
            update={update}
            schedule={schedule}
            onToast={onToast}
          />
        </section>
      )}
    </StageShell>
  );
}