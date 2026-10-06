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
  DocumentPaper,
  KeyValueList,
  KpiGrid,
  SectionBox,
  TH_STYLE,
  Tag,
  addMonths,
  fmtMonthYear,
  inr,
  type TabProps,
} from "./InvestorModalShared";
import { usePdfPreview } from "./PdfPreviewModal";
import { buildStatementPdf, getPdfPalette } from "./Investmentpdf";

export function EarningsStatements({ state, update, schedule, onToast }: TabProps) {
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
        }
      >
        <Text fz="xs" c="slate.5">
          “Advance one month” simulates month-end. A statement is created for each
          month and sent to {customer.email}.
        </Text>

        {state.monthsElapsed > 0 ? (
          <Box mt="sm" style={{ maxHeight: 240, overflow: "auto" }}>
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
                          <Button
                            size="compact-xs"
                            radius="xl"
                            variant="default"
                            onClick={() => update({ viewMonth: i })}
                          >
                            View
                          </Button>
                          <Button
                            size="compact-xs"
                            radius="xl"
                            variant="default"
                            disabled={sent}
                            onClick={() => sendStatement(i)}
                          >
                            Send
                          </Button>
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

      {viewed && (
        <DocumentPaper>
          <Text ta="center" fw={700} fz="md" c="slate.8">
            Investment Statement · {viewed.label}
          </Text>
          <Text ta="center" fz="sm" c="slate.5" mb="md">
            To {customer.name} · {customer.email}
          </Text>
          <KeyValueList
            rows={[
              { label: "Contract No.", value: state.contractNo },
              { label: "Principal", value: inr(state.amount) },
              { label: "Interest rate", value: `${state.rate}% p.a.` },
              { label: "Interest earned this month", value: inr(monthlyInterest) },
              { label: "Paid out this month", value: inr(viewed.paidOut) },
              {
                label: "Total interest earned to date",
                value: inr(monthlyInterest * state.viewMonth),
              },
            ]}
          />
          <Group mt="md" gap="xs">
            <Button
              size="sm"
              radius="xl"
              color="brand"
              disabled={!!state.sentStatements[state.viewMonth]}
              onClick={() => sendStatement(state.viewMonth)}
            >
              {state.sentStatements[state.viewMonth]
                ? "Sent to investor"
                : "Send to investor"}
            </Button>
            <Button
              size="sm"
              radius="xl"
              variant="default"
              leftSection={<IconEye size={14} />}
              onClick={() => viewStatementPdf(state.viewMonth)}
            >
              View PDF
            </Button>
            <Button
              size="sm"
              radius="xl"
              variant="default"
              leftSection={<IconDownload size={14} />}
              onClick={() => downloadStatementPdf(state.viewMonth)}
            >
              Download PDF
            </Button>
          </Group>
        </DocumentPaper>
      )}

      {pdfPreview.modal}
    </>
  );
}