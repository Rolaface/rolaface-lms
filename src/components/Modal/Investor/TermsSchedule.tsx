import { useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { REPAYMENT_FREQUENCIES } from "../../../types/Investor/investorFlow";
import {
  KpiGrid,
  TH_STYLE,
  fmtDate,
  isRepaymentFrequency,
  nextPayoutDate,
  stateProduct,
  toIso,
  validateTerms,
  type ModalState,
  type TabProps,
} from "./InvestorModalShared";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { InvestorDateInput } from "./InvestorDateInput";

export function TermsSchedule({
  state,
  update,
  schedule,
  scheduleError,
}: TabProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const error = validateTerms(state, fmtAmount) || scheduleError || "";
  // The Penalty column is shown only when a penalty rate is set.
  const showPenalty = state.penaltyApplicable && Number(state.penaltyRate) > 0;

  // Schedule pagination.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const rows = schedule?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(rows.length, currentPage * pageSize);
  const totalPrincipal = rows.reduce((t, r) => t + r.principal, 0);
  const totalInterest = rows.reduce((t, r) => t + r.interest, 0);

  // The mock data (Earnings & Maturity view) can hold "At maturity", which is not an option here.
  const frequencyOptions: string[] = isRepaymentFrequency(state.frequency)
    ? [...REPAYMENT_FREQUENCIES]
    : [...REPAYMENT_FREQUENCIES, state.frequency];

  const handleFrequencyChange = (value: string | null) => {
    if (!value || !isRepaymentFrequency(value)) return;
    const patch: Partial<ModalState> = { frequency: value };
    if (stateProduct(state)) {
      patch.firstRepayment = toIso(nextPayoutDate(new Date(), value));
    }
    update(patch);
  };

  return (
    <>
      {schedule && (
        <KpiGrid
          items={[
            {
              label:
                state.frequency === "At maturity"
                  ? "Interest payout"
                  : "Payout per instalment (interest)",
              value: fmtAmount(schedule.perPayment),
              color: "info",
            },
            {
              label: "Interest rate",
              value: `${state.rate}% p.a.`,
              color: "warning",
            },
            {
              label: "Tenure",
              value: `${schedule.totalMonths} months`,
              color: "brand",
            },
            {
              label: "Total repayment",
              value: fmtAmount(state.amount + schedule.totalInterest),
              color: "success",
            },
          ]}
        />
      )}

      {error && (
        <Alert variant="light" color="danger" radius="md" mb="md" fw={600}>
          {error}
        </Alert>
      )}

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(600px, 340px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: the terms */}
        <Paper
          radius="md"
          p="md"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Stack gap="sm">
            <Text fz="sm" fw={600} c="slate.6">
              Investment Terms
            </Text>
            <SimpleGrid cols={2} spacing="sm">
              <NumberInput
                label="Investment"
                size="sm"
                radius="md"
                hideControls
                min={0}
                thousandSeparator=","
                leftSection={
                  <Text fz={10} fw={700} c="slate.4">
                    {companyCurrency}
                  </Text>
                }
                leftSectionWidth={44}
                value={state.amount || ""}
                onChange={(v) => update({ amount: Number(v) || 0 })}
              />
              <NumberInput
                label="Interest rate"
                size="sm"
                radius="md"
                hideControls
                min={0}
                decimalScale={2}
                rightSection={
                  <Text fz={11} c="slate.4">
                    % p.a.
                  </Text>
                }
                rightSectionWidth={48}
                value={state.rate || ""}
                onChange={(v) => update({ rate: Number(v) || 0 })}
              />
            </SimpleGrid>
            <Select
              label="Repayment frequency"
              size="sm"
              radius="md"
              allowDeselect={false}
              data={frequencyOptions}
              value={state.frequency}
              onChange={handleFrequencyChange}
            />
            <SimpleGrid cols={2} spacing="sm">
              <InvestorDateInput
                label="First repayment"
                size="sm"
                radius="md"
                value={state.firstRepayment}
                onChange={(value) => update({ firstRepayment: value })}
              />
              <InvestorDateInput
                label="Maturity"
                size="sm"
                radius="md"
                value={state.maturity}
                onChange={(value) => update({ maturity: value })}
              />
            </SimpleGrid>
            <Group gap="sm" wrap="nowrap" mih={36}>
              <Checkbox
                label="Penalty applicable"
                size="sm"
                fw={600}
                checked={state.penaltyApplicable}
                onChange={(e) =>
                  update({ penaltyApplicable: e.currentTarget.checked })
                }
              />
              {state.penaltyApplicable && (
                <NumberInput
                  size="xs"
                  radius="md"
                  hideControls
                  min={0}
                  decimalScale={2}
                  w={110}
                  placeholder="Penalty"
                  rightSection={
                    <Text fz={10} c="slate.4">
                      % p.a.
                    </Text>
                  }
                  rightSectionWidth={44}
                  value={state.penaltyRate || ""}
                  onChange={(v) => update({ penaltyRate: Number(v) || 0 })}
                />
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Right: the schedule */}
        <Box style={{ minWidth: 0 }}>
          {schedule ? (
            <>
              <Paper
                radius="md"
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  overflow: "hidden",
                }}
              >
                <Table.ScrollContainer minWidth={520}>
                  <Table
                    verticalSpacing={7}
                    horizontalSpacing="sm"
                    fz="sm"
                    highlightOnHover
                  >
                    <Table.Thead bg="slate.0">
                      <Table.Tr>
                        <Table.Th style={TH_STYLE}>#</Table.Th>
                        <Table.Th style={TH_STYLE}>Date</Table.Th>
                        <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                          Principal
                        </Table.Th>
                        <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                          Interest
                        </Table.Th>
                        {showPenalty && (
                          <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                            Penalty
                          </Table.Th>
                        )}
                        <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                          Instalment
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pageRows.map((r, i) => (
                        <Table.Tr key={i}>
                          <Table.Td c="slate.4">
                            {(currentPage - 1) * pageSize + i + 1}
                          </Table.Td>
                          <Table.Td>{fmtDate(r.date)}</Table.Td>
                          <Table.Td ta="right" c="brand.6">
                            {formatAmount(companyCurrency, r.principal)}
                          </Table.Td>
                          <Table.Td ta="right" c="warning.7">
                            {formatAmount(companyCurrency, r.interest)}
                          </Table.Td>
                          {showPenalty && (
                            <Table.Td ta="right" c="slate.5">
                              {state.penaltyRate}% p.a.
                            </Table.Td>
                          )}
                          <Table.Td ta="right" fw={800}>
                            {formatAmount(
                              companyCurrency,
                              r.principal + r.interest,
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    <Table.Tfoot>
                      <Table.Tr
                        style={{ background: "var(--mantine-color-slate-0)" }}
                      >
                        <Table.Td />
                        <Table.Td fw={800}>Total</Table.Td>
                        <Table.Td ta="right" fw={800} c="brand.6">
                          {formatAmount(companyCurrency, totalPrincipal)}
                        </Table.Td>
                        <Table.Td ta="right" fw={800} c="warning.7">
                          {formatAmount(companyCurrency, totalInterest)}
                        </Table.Td>
                        {showPenalty && <Table.Td />}
                        <Table.Td ta="right" fw={800}>
                          {formatAmount(
                            companyCurrency,
                            totalPrincipal + totalInterest,
                          )}
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tfoot>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
              <Group justify="space-between" mt="sm" wrap="wrap" gap="xs">
                <Group
                  gap="md"
                  c="slate.6"
                  style={{ fontSize: "var(--mantine-font-size-xs)" }}
                >
                  <span>
                    Showing {firstRow}-{lastRow} of {rows.length}
                  </span>
                  <Group gap="xs">
                    <span>Rows:</span>
                    <Select
                      data={["10", "20", "50"]}
                      value={String(pageSize)}
                      onChange={(v) => {
                        setPageSize(Number(v) || 10);
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
            </>
          ) : (
            <Text fz="sm" c="slate.5">
              Enter valid terms to see the schedule.
            </Text>
          )}
        </Box>
      </Box>
    </>
  );
}
