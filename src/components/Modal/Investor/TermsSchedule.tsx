import {
  Alert,
  Box,
  Checkbox,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import {
  FREQUENCY_MONTHS,
  KpiGrid,
  SectionBox,
  TH_STYLE,
  Tag,
  addMonths,
  inr,
  fmtDate,
  toIso,
  validateTerms,
  type Frequency,
  type ModalState,
  type TabProps,
} from "./InvestorModalShared";

export function TermsSchedule({ state, update, schedule }: TabProps) {
  const error = validateTerms(state);
  const penaltyLabel = state.penaltyApplicable ? `${state.penaltyRate}% p.a.` : "—";

  const handleFrequencyChange = (value: string | null) => {
    if (!value) return;
    const frequency = value as Frequency;
    const patch: Partial<ModalState> = { frequency };
    if (state.productIndex >= 0) {
      const months =
        FREQUENCY_MONTHS[frequency] ||
        Math.max(
          1,
          Math.round(
            (new Date(state.maturity).getTime() - Date.now()) / 2629800000,
          ),
        );
      patch.firstRepayment = toIso(addMonths(new Date(), months));
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
              value: inr(schedule.perPayment),
              color: "info",
            },
            { label: "Interest rate", value: `${state.rate}% p.a.`, color: "warning" },
            { label: "Tenure", value: `${schedule.totalMonths} months`, color: "brand" },
            {
              label: "Total repayment",
              value: inr(state.amount + schedule.totalInterest),
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

      <SectionBox title="Investment terms">
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
          }}
        >
          <TextInput
            type="number"
            label="Investment amount (₹)"
            size="sm"
            radius="md"
            step={10000}
            value={state.amount || ""}
            onChange={(e) => update({ amount: Number(e.currentTarget.value) })}
          />
          <TextInput
            type="number"
            label="Interest rate (% p.a.)"
            size="sm"
            radius="md"
            step={0.25}
            value={state.rate || ""}
            onChange={(e) => update({ rate: Number(e.currentTarget.value) })}
          />
          <Select
            label="Repayment frequency"
            size="sm"
            radius="md"
            allowDeselect={false}
            data={Object.keys(FREQUENCY_MONTHS)}
            value={state.frequency}
            onChange={handleFrequencyChange}
          />
          <TextInput
            type="date"
            label="First repayment date"
            size="sm"
            radius="md"
            value={state.firstRepayment}
            onChange={(e) => update({ firstRepayment: e.currentTarget.value })}
          />
          <TextInput
            type="date"
            label="Maturity date"
            size="sm"
            radius="md"
            value={state.maturity}
            onChange={(e) => update({ maturity: e.currentTarget.value })}
          />
          <Stack gap={6} justify="flex-end">
            <Checkbox
              label="Penalty applicable"
              size="sm"
              checked={state.penaltyApplicable}
              onChange={(e) => update({ penaltyApplicable: e.currentTarget.checked })}
            />
            {state.penaltyApplicable && (
              <TextInput
                type="number"
                size="sm"
                radius="md"
                step={0.5}
                placeholder="Penalty % p.a."
                value={state.penaltyRate || ""}
                onChange={(e) => update({ penaltyRate: Number(e.currentTarget.value) })}
              />
            )}
          </Stack>
        </Box>
      </SectionBox>

      <SectionBox
        title="Repayment schedule"
        titleAddon={schedule ? <Tag label={`${schedule.count} payments`} /> : undefined}
      >
        {schedule ? (
          <Box style={{ maxHeight: 240, overflow: "auto" }}>
            <Table stickyHeader verticalSpacing={6} horizontalSpacing="sm" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={TH_STYLE}>Repay date</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Principal</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Interest rate</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>Penalty</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {schedule.rows.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{fmtDate(r.date)}</Table.Td>
                    <Table.Td ta="right">{inr(r.principal)}</Table.Td>
                    <Table.Td ta="right">
                      {state.rate}%{" "}
                      <Text span fz="xs" c="slate.5">
                        ({inr(r.interest)})
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">{penaltyLabel}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Text fz="sm" c="slate.5">
            Enter valid terms to see the schedule.
          </Text>
        )}
      </SectionBox>
    </>
  );
}