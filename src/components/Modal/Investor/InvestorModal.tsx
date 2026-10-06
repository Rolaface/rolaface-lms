import { Fragment, useEffect, useRef, useState } from "react";
import { Affix, Box, Button, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import {
  STEP_NAMES,
  calcSchedule,
  createInitialState,
  validateTerms,
  type FundedInvestment,
  type ModalState,
  type TabProps,
} from "./InvestorModalShared";
import {
  PROCESSING_STEP_COUNT,
  ReadOnlyFrame,
  STAGES,
  StageShell,
  StepDot,
  ViewOnlyBar,
} from "./StageShell";
import { InvestorProduct } from "./InvestorProduct";
import { TermsSchedule } from "./TermsSchedule";
import { ContractGeneration } from "./ContractGeneration";
import { FundingAllotment } from "./FundingAllotment";
import { EarningsStatementsModal } from "./EarningsStatementModal";
import { MaturityModal } from "./MaturityModal";

interface InvestorModalProps {
  opened: boolean;
  onClose: () => void;
  /** Number of investments currently in the list (used to build INV-/CON- numbers). */
  existingCount: number;
  /** Called when the investor's funds are confirmed (Funding & Allotment). */
  onFunded: (investment: FundedInvestment) => void;
  /** Called when the workflow is completed (Maturity modal). */
  onCompleted: (investmentNo: string, status: "Redeemed" | "Renewed") => void;
}

/*
 * state.step keeps its old meaning (0..5), so ModalState and the tab
 * components are untouched:
 *
 *   0..3  Investor Processing modal    (this file, top nav)
 *   4     Earnings & Statements modal  (EarningsStatementsModal.tsx)
 *   5     Maturity modal               (MaturityModal.tsx)
 */

const PROCESSING_STEPS = STEP_NAMES.slice(0, PROCESSING_STEP_COUNT);
const LAST_PROCESSING_STEP = PROCESSING_STEP_COUNT - 1;

const noop = () => {};

/* ------------------------- Top nav (4 steps) ------------------------- */

/**
 * Horizontal nav for the four Investor Processing steps.
 * - Without onSelect it is a progress indicator (movement is via Back / Next).
 * - With onSelect (view-only mode) every step is clickable.
 */
function ProcessingTopNav({
  current,
  doneBefore,
  onSelect,
}: {
  current: number;
  /** Steps with an index lower than this are shown as done. */
  doneBefore: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <div className="inv-topnav">
      {PROCESSING_STEPS.map((name, i) => {
        const active = i === current;
        const done = i < doneBefore;
        const item = (
          <Group
            gap={8}
            wrap="nowrap"
            px={10}
            py={7}
            style={{
              borderRadius: "var(--mantine-radius-md)",
              whiteSpace: "nowrap",
              background: active ? "var(--mantine-color-white)" : undefined,
              boxShadow: active ? "0 0 0 1px var(--mantine-color-slate-2)" : undefined,
            }}
          >
            <StepDot n={i + 1} active={active} done={done} />
            <Text fz="sm" fw={600} c={active || done ? "slate.8" : "slate.5"}>
              {name}
            </Text>
          </Group>
        );
        return (
          <Fragment key={name}>
            {i > 0 && <div className="inv-topnav-line" />}
            {onSelect ? (
              <UnstyledButton
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                style={{ flex: "none", borderRadius: "var(--mantine-radius-md)" }}
              >
                {item}
              </UnstyledButton>
            ) : (
              <Box style={{ flex: "none" }} aria-current={active ? "step" : undefined}>
                {item}
              </Box>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ---------------------- The four processing tabs --------------------- */

function ProcessingTab({
  step,
  tabProps,
  existingCount,
  onFunded,
}: {
  step: number;
  tabProps: TabProps;
  existingCount: number;
  onFunded: (investment: FundedInvestment) => void;
}) {
  switch (step) {
    case 0:
      return <InvestorProduct {...tabProps} />;
    case 1:
      return <TermsSchedule {...tabProps} />;
    case 2:
      return <ContractGeneration {...tabProps} existingCount={existingCount} />;
    case 3:
      return (
        <FundingAllotment
          {...tabProps}
          existingCount={existingCount}
          onFunded={onFunded}
        />
      );
    default:
      return null;
  }
}

/**
 * Investor Processing as shown from the side nav of the two later modals:
 * same top nav (clickable), same four tabs, nothing can be changed.
 */
export function ProcessingReadOnlyView({
  state,
  schedule,
  existingCount,
}: Pick<TabProps, "state" | "schedule"> & { existingCount: number }) {
  const [viewStep, setViewStep] = useState(0);
  return (
    <>
      <ViewOnlyBar label={STAGES[0].label} />
      <ProcessingTopNav
        current={viewStep}
        doneBefore={PROCESSING_STEP_COUNT}
        onSelect={setViewStep}
      />
      <section className="inv-content">
        <ReadOnlyFrame key={viewStep}>
          <ProcessingTab
            step={viewStep}
            tabProps={{ state, update: noop, schedule, onToast: noop }}
            existingCount={existingCount}
            onFunded={noop}
          />
        </ReadOnlyFrame>
      </section>
    </>
  );
}

/* ------------------------------- Modal ------------------------------- */

export function InvestorModal({
  opened,
  onClose,
  existingCount,
  onFunded,
  onCompleted,
}: InvestorModalProps) {
  const [state, setState] = useState<ModalState>(createInitialState);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const update = (patch: Partial<ModalState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const schedule = calcSchedule(state);
  const tabProps: TabProps = { state, update, schedule, onToast: showToast };

  /** 0 = Investor Processing, 1 = Earnings & Statements, 2 = Maturity. */
  const stage =
    state.step < PROCESSING_STEP_COUNT ? 0 : state.step - PROCESSING_STEP_COUNT + 1;
  /** Clamped so this modal keeps showing Funding & Allotment while it closes. */
  const processingStep = Math.min(state.step, LAST_PROCESSING_STEP);
  const isLastProcessingStep = processingStep === LAST_PROCESSING_STEP;

  const canNext = () => {
    switch (state.step) {
      case 0:
        return state.customerIndex >= 0 && state.productIndex >= 0;
      case 1:
        return !validateTerms(state) && !!schedule;
      case 2:
        return state.contractStatus === "Executed";
      case 3:
        return state.funded;
      default:
        return false;
    }
  };

  /** Next inside the four steps; on the last one it submits and pops Earnings & Statements. */
  const handleNext = () => update({ step: state.step + 1 });

  const handleComplete = () => {
    if (!state.decision) return;
    onCompleted(
      state.investmentNo,
      state.decision === "redeem" ? "Redeemed" : "Renewed",
    );
    update({ completed: true });
    showToast("Workflow completed for " + state.investmentNo);
    closeTimer.current = window.setTimeout(onClose, 900);
  };

  const showBack =
    state.step > 0 && !(state.step >= 3 && state.funded) && !state.completed;

  const processingView = (
    <ProcessingReadOnlyView
      state={state}
      schedule={schedule}
      existingCount={existingCount}
    />
  );

  return (
    <>
      {/* Stage 1 — Investor Processing (4 steps, top nav, no side nav) */}
      <StageShell
        opened={opened && stage === 0}
        onClose={onClose}
        stageIndex={0}
        state={state}
        footer={
          <>
            {showBack && (
              <Button
                size="sm"
                radius="xl"
                variant="default"
                onClick={() => update({ step: state.step - 1 })}
              >
                ← Back
              </Button>
            )}
            <Button
              size="sm"
              radius="xl"
              color="brand"
              disabled={!canNext()}
              onClick={handleNext}
            >
              {isLastProcessingStep ? "Submit" : "Next →"}
            </Button>
          </>
        }
      >
        <ProcessingTopNav current={processingStep} doneBefore={processingStep} />
        <section className="inv-content">
          <ProcessingTab
            step={processingStep}
            tabProps={tabProps}
            existingCount={existingCount}
            onFunded={onFunded}
          />
        </section>
      </StageShell>

      {/* Stage 2 — pops when Investor Processing is submitted */}
      <EarningsStatementsModal
        {...tabProps}
        opened={opened && stage === 1}
        onClose={onClose}
        processingView={processingView}
        onSubmit={() => update({ step: 5 })}
      />

      {/* Stage 3 — pops when Earnings & Statements is submitted */}
      <MaturityModal
        {...tabProps}
        opened={opened && stage === 2}
        onClose={onClose}
        processingView={processingView}
        onComplete={handleComplete}
      />

      {toast && (
        <Affix position={{ bottom: 20, left: 0, right: 0 }} zIndex={1000}>
          <Box style={{ display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <Paper
              radius="md"
              px={18}
              py={10}
              fw={600}
              style={{
                background: "var(--mantine-color-success-6)",
                color: "var(--mantine-color-white)",
              }}
            >
              {toast}
            </Paper>
          </Box>
        </Affix>
      )}
    </>
  );
}