import { Fragment, useEffect, useRef, useState } from "react";
import { Affix, Box, Button, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import {
  STEP_NAMES,
  calcSchedule,
  createInitialState,
  validateTerms,
  type ModalState,
  type TabProps,
} from "./InvestorModalShared";
import {
  ReadOnlyFrame,
  STAGES,
  StageShell,
  StepDot,
  ViewOnlyBar,
} from "./StageShell";
import { InvestorProduct } from "./InvestorProduct";
import { TermsSchedule } from "./TermsSchedule";
import { ContractGeneration } from "./ContractGeneration";

interface InvestorModalProps {
  opened: boolean;
  onClose: () => void;
  existingCount: number;
  onSubmitted: (state: ModalState) => void;
}

const PROCESSING_STEPS = STEP_NAMES.slice(0, 3);
const LAST_PROCESSING_STEP = 2;
const noop = () => {};

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

/* ------------------------- The processing tabs ------------------------ */

function ProcessingTab({
  step,
  tabProps,
  existingCount,
}: {
  step: number;
  tabProps: TabProps;
  existingCount: number;
}) {
  switch (step) {
    case 0:
      return <InvestorProduct {...tabProps} />;
    case 1:
      return <TermsSchedule {...tabProps} />;
    case 2:
      return <ContractGeneration {...tabProps} existingCount={existingCount} />;
    default:
      return null;
  }
}

/**
 * Investor Processing as shown from the side nav of the two later modals:
 * same top nav (clickable), same tabs, nothing can be changed.
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
        doneBefore={3}
        onSelect={setViewStep}
      />
      <section className="inv-content">
        <ReadOnlyFrame key={viewStep}>
          <ProcessingTab
            step={viewStep}
            tabProps={{ state, update: noop, schedule, onToast: noop }}
            existingCount={existingCount}
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
  onSubmitted,
}: InvestorModalProps) {
  const [state, setState] = useState<ModalState>(createInitialState);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
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

  const isLastStep = state.step === LAST_PROCESSING_STEP;

  const canNext = () => {
    switch (state.step) {
      case 0:
        return state.customerIndex >= 0 && state.productIndex >= 0;
      case 1:
        return !validateTerms(state) && !!schedule;
      case 2:
        return state.contractStatus === "Executed";
      default:
        return false;
    }
  };

  /** Next inside the steps; on Contract Generation it submits. */
  const handleNext = () => {
    if (isLastStep) {
      onSubmitted(state);
      return;
    }
    update({ step: state.step + 1 });
  };

  return (
    <>
      <StageShell
        opened={opened}
        onClose={onClose}
        stageIndex={0}
        state={state}
        footer={
          <>
            {state.step > 0 && (
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
              {isLastStep ? "Submit" : "Next →"}
            </Button>
          </>
        }
      >
        <ProcessingTopNav current={state.step} doneBefore={state.step} />
        <section className="inv-content">
          <ProcessingTab
            step={state.step}
            tabProps={tabProps}
            existingCount={existingCount}
          />
        </section>
      </StageShell>

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