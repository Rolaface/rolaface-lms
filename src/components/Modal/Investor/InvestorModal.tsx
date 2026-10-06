import { useEffect, useRef, useState } from "react";
import {
  Affix,
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Text,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import {
  CUSTOMERS,
  PRODUCTS,
  STEP_NAMES,
  calcSchedule,
  createInitialState,
  inr,
  validateTerms,
  type FundedInvestment,
  type ModalState,
} from "./InvestorModalShared";
import { InvestorProduct } from "./InvestorProduct";
import { TermsSchedule } from "./TermsSchedule";
import { ContractGeneration } from "./ContractGeneration";
import { FundingAllotment } from "./FundingAllotment";
import { EarningsStatements } from "./EarningsStatements";
import { Maturity } from "./Maturity";

interface InvestorModalProps {
  opened: boolean;
  onClose: () => void;
  /** Number of investments currently in the list (used to build INV-/CON- numbers). */
  existingCount: number;
  /** Called when the investor's funds are confirmed (stage 4). */
  onFunded: (investment: FundedInvestment) => void;
  /** Called when the workflow is completed (stage 6). */
  onCompleted: (investmentNo: string, status: "Redeemed" | "Renewed") => void;
}

export function InvestorModal({
  opened,
  onClose,
  existingCount,
  onFunded,
  onCompleted,
}: InvestorModalProps) {
  const theme = useMantineTheme();
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
  const customer = CUSTOMERS[state.customerIndex];
  const product = PRODUCTS[state.productIndex];

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
      case 4:
        return !!schedule && state.monthsElapsed >= schedule.totalMonths;
      case 5:
        return !!state.decision && !state.completed;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (state.step === 5) {
      if (!state.decision) return;
      onCompleted(
        state.investmentNo,
        state.decision === "redeem" ? "Redeemed" : "Renewed",
      );
      update({ completed: true });
      showToast("Workflow completed for " + state.investmentNo);
      closeTimer.current = window.setTimeout(onClose, 900);
      return;
    }
    update({ step: state.step + 1 });
  };

  const tabProps = { state, update, schedule, onToast: showToast };

  const renderTab = () => {
    switch (state.step) {
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
      case 4:
        return <EarningsStatements {...tabProps} />;
      case 5:
        return <Maturity {...tabProps} />;
      default:
        return null;
    }
  };

  const showBack = state.step > 0 && !(state.step >= 3 && state.funded) && !state.completed;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        centered
        radius="lg"
        withCloseButton={false}
        size="90vw"
        padding={0}
        lockScroll
        closeOnClickOutside={false}
        closeOnEscape={false}
         styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
          header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
          body: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            minHeight: 0,
            overflow: "hidden",
          },
        }}
      >
        <style>{`
          .inv-main { display: flex; flex: 1; min-height: 0; }
          .inv-nav { width: 260px; flex: none; padding: 14px 10px; border-right: 1px solid var(--mantine-color-slate-2); overflow-y: auto; }
          .inv-content { flex: 1; overflow: auto; padding: 16px 18px; }
          @media (max-width: 760px) {
            .inv-main { flex-direction: column; }
            .inv-nav { width: auto; display: flex; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--mantine-color-slate-2); padding: 8px; }
          }
        `}</style>

        {/* Header */}
        <Group
          gap="sm"
          wrap="nowrap"
          px={18}
          py={14}
          style={{ background: theme.other.brandGradient, color: "var(--mantine-color-white)" }}
        >
          <ThemeIcon size={34} radius="md" color="white" c="brand.6">
            <IconPencil size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={700} c="white">
              New Investment
            </Text>
            <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
              Stage {state.step + 1} of 6 — {STEP_NAMES[state.step]}
            </Text>
          </Box>
          <ActionIcon
            variant="subtle"
            color="white"
            ml="auto"
            aria-label="Close"
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {/* Customer bar */}
        {customer && (
          <Group
            gap="sm"
            wrap="nowrap"
            px={18}
            py={10}
            style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
          >
            <Avatar color="brand" variant="light" radius="xl" size={34}>
              {customer.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </Avatar>
            <Box>
              <Text fw={700} fz="sm" c="slate.8">
                {customer.name}
              </Text>
              <Text fz={11} c="slate.5">
                {product ? product.name : "No product selected"}
              </Text>
            </Box>
            <Group gap={18} ml="auto" wrap="nowrap">
              <Box ta="right">
                <Text fz={11} c="slate.5">
                  Amount
                </Text>
                <Text fw={700} fz="sm" c="slate.8">
                  {state.amount ? inr(state.amount) : "—"}
                </Text>
              </Box>
              <Box ta="right">
                <Text fz={11} c="slate.5">
                  Investment No.
                </Text>
                <Text fw={700} fz="sm" c="slate.8">
                  {state.investmentNo || "Pending"}
                </Text>
              </Box>
            </Group>
          </Group>
        )}

        {/* Stage navigation + active tab */}
        <Box className="inv-main">
          <nav className="inv-nav">
            {STEP_NAMES.map((name, i) => {
              const active = i === state.step;
              const done = i < state.step;
              return (
                <Group
                  key={name}
                  gap="sm"
                  wrap="nowrap"
                  px={10}
                  py={9}
                  mb={4}
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    whiteSpace: "nowrap",
                    background: active ? "var(--mantine-color-white)" : undefined,
                    boxShadow: active ? "0 0 0 1px var(--mantine-color-slate-2)" : undefined,
                  }}
                >
                  <Box
                    w={24}
                    h={24}
                    style={{
                      flex: "none",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      background: active
                        ? "var(--mantine-color-brand-6)"
                        : done
                          ? "var(--mantine-color-success-light)"
                          : "var(--mantine-color-slate-2)",
                      color: active
                        ? "var(--mantine-color-white)"
                        : done
                          ? "var(--mantine-color-success-light-color)"
                          : "var(--mantine-color-slate-5)",
                    }}
                  >
                    {done ? <IconCheck size={13} /> : i + 1}
                  </Box>
                  <Text fz="sm" fw={600} c={active || done ? "slate.8" : "slate.5"}>
                    {name}
                  </Text>
                </Group>
              );
            })}
          </nav>

          <section className="inv-content">{renderTab()}</section>
        </Box>

        {/* Footer */}
        <Group
          gap="xs"
          px={18}
          py={12}
          style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Button size="sm" radius="xl" variant="default" onClick={onClose}>
            Close
          </Button>
          <Box style={{ flex: 1 }} />
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
            {state.step === 5 ? "Complete workflow" : "Next →"}
          </Button>
        </Group>
      </Modal>

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