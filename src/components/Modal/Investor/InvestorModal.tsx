import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Affix, Box, Button, Group, Loader, Paper, Text, UnstyledButton } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvestorFlow,
  getInvestorFlowById,
  getInvestorFlowSchedule,
  updateInvestorFlow,
} from "../../../api/Investor/investorFlowApi";
import { getInvestmentProductById } from "../../../api/Investor/productApi";
import { getCustomerById } from "../../../api/Customer/customerApi";
import { openCommonModal } from "../AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import {
  STEP_NAMES,
  apiProductFields,
  createInitialState,
  payloadFromState,
  scheduleFromApi,
  stateCustomer,
  stateFromRecord,
  stateProduct,
  termsFromState,
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
  /** Investor Flow ID to view / edit; null for a new one. */
  editId?: string | null;
  isView?: boolean;
  /** Called after the Investor Flow is created or updated. */
  onSaved: () => void;
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
  showViewOnlyBar = true,
}: Pick<TabProps, "state" | "schedule"> & {
  existingCount: number;
  showViewOnlyBar?: boolean;
}) {
  const [viewStep, setViewStep] = useState(0);
  return (
    <>
      {showViewOnlyBar && <ViewOnlyBar label={STAGES[0].label} />}
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

/** Loads an Investor Flow with the customer and product names for the modal. */
async function loadInvestorFlowState(id: string): Promise<ModalState> {
  const record = await getInvestorFlowById(id);
  const state = stateFromRecord(record);

  const [customer, product] = await Promise.allSettled([
    getCustomerById(record.investor),
    getInvestmentProductById(record.investment_product),
  ]);

  if (customer.status === "fulfilled" && customer.value) {
    state.customerName = customer.value.customer_name || record.investor;
    state.customerEmail = customer.value.email_id || "";
  }
  const productItem = product.status === "fulfilled" ? product.value?.message?.data : null;
  if (productItem) Object.assign(state, apiProductFields(productItem));

  return state;
}

export function InvestorModal({
  opened,
  onClose,
  existingCount,
  editId = null,
  isView = false,
  onSaved,
}: InvestorModalProps) {
  const queryClient = useQueryClient();
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

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  /* ------------------------ Existing Investor Flow ----------------------- */
  const {
    data: loadedState,
    isLoading: isEditLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["investorFlow", editId],
    queryFn: () => loadInvestorFlowState(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (loadedState) setState(loadedState);
  }, [loadedState]);

  useEffect(() => {
    if (loadError) showError("Could Not Load Investment", loadError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  /* ------------------------------ Schedule ----------------------------- */
  const termsError = validateTerms(state);
  const hasParties = !!stateCustomer(state) && !!stateProduct(state);
  const termsKey = useMemo(
    () => (hasParties && !termsError ? JSON.stringify(termsFromState(state)) : ""),
    [hasParties, termsError, state],
  );
  const [debouncedTermsKey] = useDebouncedValue(termsKey, 400);

  const scheduleQuery = useQuery({
    queryKey: ["investorFlowSchedule", debouncedTermsKey],
    queryFn: () => getInvestorFlowSchedule(JSON.parse(debouncedTermsKey)),
    enabled: opened && !!debouncedTermsKey,
    retry: false,
  });

  // The schedule is only shown (and Next allowed) for the terms currently on screen.
  const scheduleIsCurrent =
    !!termsKey && termsKey === debouncedTermsKey && !scheduleQuery.isFetching;
  const schedule =
    scheduleIsCurrent && scheduleQuery.data ? scheduleFromApi(scheduleQuery.data) : null;
  const scheduleError =
    scheduleIsCurrent && scheduleQuery.error ? parseFrappeError(scheduleQuery.error) : undefined;

  const tabProps: TabProps = { state, update, schedule, scheduleError, onToast: showToast };

  /* ------------------------------- Save -------------------------------- */
  const handleSaved = (heading: string, body: string) => {
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    if (editId) queryClient.invalidateQueries({ queryKey: ["investorFlow", editId] });
    showSuccess(heading, body);
    onSaved();
  };

  const createMutation = useMutation({
    mutationFn: createInvestorFlow,
    onSuccess: () =>
      handleSaved("Investment Created", "Investment saved as Draft."),
    onError: (error: any) => showError("Create Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: updateInvestorFlow,
    onSuccess: () =>
      handleSaved("Investment Updated", "Investment updated successfully."),
    onError: (error: any) => showError("Update Failed", error),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isLastStep = state.step === LAST_PROCESSING_STEP;

  const canNext = () => {
    switch (state.step) {
      case 0:
        return hasParties;
      case 1:
        return !termsError && !!schedule;
      case 2:
        return state.contractStatus === "Executed" && !!schedule;
      default:
        return false;
    }
  };

  /** Next inside the steps; on Contract Generation it saves the Investor Flow. */
  const handleNext = () => {
    if (!isLastStep) {
      update({ step: state.step + 1 });
      return;
    }
    const payload = payloadFromState(state);
    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const title = editId ? (isView ? "View Investment" : "Edit Investment") : "New Investment";

  let body;
  if (editId && (isEditLoading || !loadedState)) {
    body = (
      <Group justify="center" py="xl">
        {isEditLoading ? (
          <Loader size="sm" color="brand" />
        ) : (
          <Text fz="sm" c="slate.5">
            The investment could not be loaded.
          </Text>
        )}
      </Group>
    );
  } else if (isView) {
    body = (
      <ProcessingReadOnlyView
        state={state}
        schedule={schedule}
        existingCount={existingCount}
        showViewOnlyBar={false}
      />
    );
  } else {
    body = (
      <>
        <ProcessingTopNav current={state.step} doneBefore={state.step} />
        <section className="inv-content">
          <ProcessingTab
            step={state.step}
            tabProps={tabProps}
            existingCount={existingCount}
          />
        </section>
      </>
    );
  }

  return (
    <>
      <StageShell
        opened={opened}
        onClose={onClose}
        stageIndex={0}
        state={state}
        title={title}
        footer={
          isView ? undefined : (
            <>
              {state.step > 0 && (
                <Button
                  size="sm"
                  radius="xl"
                  variant="default"
                  disabled={isSaving}
                  onClick={() => update({ step: state.step - 1 })}
                >
                  ← Back
                </Button>
              )}
              <Button
                size="sm"
                radius="xl"
                color="brand"
                disabled={!canNext() || isSaving}
                loading={isSaving}
                onClick={handleNext}
              >
                {isLastStep ? (editId ? "Update" : "Submit") : "Next →"}
              </Button>
            </>
          )
        }
      >
        {body}
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