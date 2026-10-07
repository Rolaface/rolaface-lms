import { useState, type ReactNode } from "react";
import { Button, Paper, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  CUSTOMERS,
  KeyValueList,
  SectionBox,
  Tag,
  inr,
  type Decision,
  type TabProps,
} from "./InvestorModalShared";
import {
  STAGES,
  StageShell,
  StageSideNav,
  ViewOnlyBar,
  type StageId,
} from "./StageShell";
import { EarningsStatementsView } from "./EarningsStatementModal";

function MaturityScreen({ state, update, schedule }: TabProps) {
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

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface MaturityModalProps extends TabProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Processing (the four steps) rendered view-only. */
  processingView: ReactNode;
  /** Called on "Complete workflow". */
  onComplete: () => void;
  /** Investor Flow ID whose saved earnings are shown (view only). */
  investorFlowId?: string | null;
}

const STAGE_INDEX = 2;


/**
 * Stage 3 — Maturity.
 * Side nav: Investor Processing and Earnings & Statements (both view only)
 * and Maturity (working).
 */
export function MaturityModal({
  opened,
  onClose,
  state,
  update,
  schedule,
  processingView,
  onComplete,
  investorFlowId = null,
}: MaturityModalProps) {
  const [section, setSection] = useState<StageId>("maturity");
  const viewingEarlier = section !== "maturity";

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
            onClick={() => setSection("maturity")}
          >
            Return to {STAGES[STAGE_INDEX].label}
          </Button>
        ) : (
          <Button
            size="sm"
            radius="xl"
            color="brand"
            disabled={!state.decision || state.completed}
            onClick={onComplete}
          >
            Complete workflow
          </Button>
        )
      }
    >
      {section === "processing" && processingView}

      {section === "earnings" && (
        <>
          <ViewOnlyBar label={STAGES[1].label} />
          <section className="inv-content">
            {investorFlowId ? (
              <EarningsStatementsView investorFlowId={investorFlowId} />
            ) : (
              <Text fz="sm" c="slate.5">
                No saved earnings for this investment.
              </Text>
            )}
          </section>
        </>
      )}

      {section === "maturity" && (
        <section className="inv-content">
          <MaturityScreen
            state={state}
            update={update}
            schedule={schedule}
          />
        </section>
      )}
    </StageShell>
  );
}