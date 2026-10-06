import { Paper, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  CUSTOMERS,
  KeyValueList,
  SectionBox,
  Tag,
  inr,
  type Decision,
  type TabProps,
} from "./InvestorModalShared";

export function Maturity({ state, update, schedule }: TabProps) {
  const customer = CUSTOMERS[state.customerIndex];

  if (state.completed) {
    return (
      <Stack align="center" gap={6} py={30}>
        <Tag label="Completed" color="success" />
        <Text fw={700} fz={18} c="slate.8" mt="xs">
          Investment closed
        </Text>
      </Stack>
    );
  }

  if (!schedule || !customer) return null;

  const finalRow = schedule.rows[schedule.rows.length - 1];
  const amountDue = finalRow.principal + finalRow.interest;

  const options: { value: Exclude<Decision, null>; title: string; text: string }[] = [
    { value: "redeem", title: "Redeem", text: `Pay ${inr(amountDue)} to ${customer.bank}.` },
    {
      value: "renew",
      title: "Renew",
      text: `Reinvest ${inr(amountDue)} as a new investment.`,
    },
  ];

  return (
    <>
      <SectionBox title="Maturity settlement">
        <KeyValueList
          rows={[
            { label: "Principal", value: inr(finalRow.principal) },
            { label: "Final interest payment", value: inr(finalRow.interest) },
            { label: "Amount due to investor", value: inr(amountDue) },
          ]}
        />
      </SectionBox>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {options.map((o) => {
          const selected = state.decision === o.value;
          return (
            <UnstyledButton key={o.value} onClick={() => update({ decision: o.value })}>
              <Paper
                radius="md"
                p="md"
                style={{
                  border: `1px solid ${
                    selected
                      ? "var(--mantine-color-brand-6)"
                      : "var(--mantine-color-slate-2)"
                  }`,
                  background: selected ? "var(--mantine-color-brand-light)" : undefined,
                }}
              >
                <Text fw={700} fz="sm" c="slate.8" mb={6}>
                  {o.title}
                </Text>
                <Text fz="sm" c="slate.6">
                  {o.text}
                </Text>
              </Paper>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </>
  );
}