import type { ReactNode } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCheck,
  IconEye,
  IconMinus,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import {
  STEP_NAMES,
  stateCustomer,
  stateProduct,
  type ModalState,
} from "./InvestorModalShared";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

export type StageId = "processing" | "earnings" | "maturity";

export const PROCESSING_STEP_COUNT = 4;

export const STAGES: { id: StageId; label: string }[] = [
  { id: "processing", label: "Investor Processing" },
  { id: "earnings", label: STEP_NAMES[4] },
  { id: "maturity", label: STEP_NAMES[5] },
];

export function StepDot({
  n,
  active,
  done,
}: {
  n: number;
  active: boolean;
  done: boolean;
}) {
  return (
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
      {done && !active ? <IconCheck size={13} /> : n}
    </Box>
  );
}

/** Strip shown above a stage that is opened from the side nav for viewing. */
export function ViewOnlyBar({ label }: { label: string }) {
  return (
    <Group
      gap={8}
      px={18}
      py={6}
      bg="slate.0"
      style={{
        flex: "none",
        borderBottom: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      <Badge
        size="sm"
        radius="sm"
        variant="light"
        color="gray"
        leftSection={<IconEye size={11} />}
        style={{ textTransform: "none" }}
      >
        View only
      </Badge>
      <Text fz={11.5} c="slate.5">
        {label} is complete and can no longer be edited.
      </Text>
    </Group>
  );
}

export function ReadOnlyFrame({ children }: { children: ReactNode }) {
  return (
    <div
      ref={(el) => {
        if (el) el.setAttribute("inert", "");
      }}
      aria-disabled="true"
      style={{ pointerEvents: "none" }}
    >
      {children}
    </div>
  );
}

export function StageSideNav({
  stageIndex,
  section,
  onSelect,
}: {
  /** Index in STAGES of the stage this modal belongs to. */
  stageIndex: number;
  /** Stage currently shown on the right. */
  section: StageId;
  onSelect: (id: StageId) => void;
}) {
  return (
    <nav className="inv-nav" aria-label="Stages">
      {STAGES.slice(0, stageIndex + 1).map((stage, i) => {
        const active = stage.id === section;
        const done = i < stageIndex;
        return (
          <UnstyledButton
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            aria-current={active ? "page" : undefined}
            mb={4}
            style={{
              display: "block",
              width: "100%",
              borderRadius: "var(--mantine-radius-md)",
              background: active ? "var(--mantine-color-white)" : undefined,
              boxShadow: active
                ? "0 0 0 1px var(--mantine-color-slate-2)"
                : undefined,
            }}
          >
            <Group
              gap="sm"
              wrap="nowrap"
              px={10}
              py={9}
              style={{ whiteSpace: "nowrap" }}
            >
              <StepDot n={i + 1} active={active && !done} done={done} />
              <Box>
                <Text fz="sm" fw={600} c="slate.8">
                  {stage.label}
                </Text>
                <Text fz={11} c="slate.5">
                  {done ? "Completed, view only" : "In progress"}
                </Text>
              </Box>
            </Group>
          </UnstyledButton>
        );
      })}
    </nav>
  );
}

/** A label / value pair of the customer bar: small uppercase label over a bold value. */
function BarItem({
  label,
  value,
  large = false,
}: {
  label: string;
  value: ReactNode;
  large?: boolean;
}) {
  return (
    <Box ta="right">
      <Text
        fz={10}
        fw={600}
        c="slate.5"
        tt="uppercase"
        style={{ letterSpacing: 0.5, whiteSpace: "nowrap" }}
      >
        {label}
      </Text>
      <Text
        fw={700}
        fz={large ? "md" : "sm"}
        c="slate.8"
        style={{ whiteSpace: "nowrap" }}
      >
        {value}
      </Text>
    </Box>
  );
}

/* ------------------------------ Shell ------------------------------- */

interface StageShellProps {
  opened: boolean;
  onClose: () => void;
  /** Minimizes the modal to the dock (same as the other modals). */
  onMinimize?: () => void;
  /** Index in STAGES of the stage this modal belongs to (0, 1 or 2). */
  stageIndex: number;
  state: ModalState;
  /** Header title; defaults to "New Investment". */
  title?: string;
  /** Optional side nav (not used by the Investor Processing modal). */
  sideNav?: ReactNode;
  /** Buttons shown on the right of the footer; "Close" is always on the left. */
  footer?: ReactNode;
  /** Extra label / value pairs shown in the customer bar, before Amount. */
  headerItems?: { label: string; value: ReactNode }[];
  children: ReactNode;
}

/** Modal frame shared by the three stage modals: header, customer bar, body, footer. */
export function StageShell({
  opened,
  onClose,
  onMinimize,
  stageIndex,
  state,
  title = "New Investment",
  sideNav,
  footer,
  headerItems = [],
  children,
}: StageShellProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const theme = useMantineTheme();
  const customer = stateCustomer(state);
  const product = stateProduct(state);

  return (
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
        .inv-nav { width: 240px; flex: none; padding: 14px 10px; border-right: 1px solid var(--mantine-color-slate-2); overflow-y: auto; }
        .inv-body { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
        .inv-topnav { flex: none; display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-bottom: 1px solid var(--mantine-color-slate-2); overflow-x: auto; }
        .inv-topnav-line { flex: 1; min-width: 16px; max-width: 72px; height: 1px; background: var(--mantine-color-slate-3); }
        .inv-content { flex: 1; min-height: 0; overflow: auto; padding: 16px 18px; }
        @media (max-width: 760px) {
          .inv-main { flex-direction: column; }
          .inv-nav { width: auto; display: flex; gap: 4px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--mantine-color-slate-2); padding: 8px; }
        }
      `}</style>

      {/* Header */}
      <Group
        gap="sm"
        wrap="nowrap"
        px={18}
        py={14}
        style={{
          flex: "none",
          background: theme.other.brandGradient,
          color: "var(--mantine-color-white)",
        }}
      >
        <ThemeIcon size={34} radius="md" color="white" c="brand.6">
          <IconPencil size={18} />
        </ThemeIcon>
        <Box>
          <Text fw={700} c="white">
            {title}
          </Text>
          {/* <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            Stage {stageIndex + 1} of {STAGES.length} — {STAGES[stageIndex].label}
          </Text> */}
        </Box>
        <Group gap={4} ml="auto" wrap="nowrap">
          {onMinimize && (
            <ActionIcon
              variant="subtle"
              color="white"
              aria-label="Minimize"
              onClick={onMinimize}
            >
              <IconMinus size={18} />
            </ActionIcon>
          )}
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Close"
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Customer bar */}
      {customer && (
        <Box px={18} pt={10} style={{ flex: "none" }}>
          <Group
            gap="sm"
            wrap="nowrap"
            px="md"
            py={10}
            style={{
              borderRadius: "var(--mantine-radius-md)",
              border: "1px solid var(--mantine-color-slate-2)",
              background: "var(--mantine-color-white)",
            }}
          >
            <Avatar color="brand" variant="light" radius="xl" size={34}>
              {customer.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </Avatar>
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} fz="sm" c="slate.8" truncate>
                {customer.name}
              </Text>
              <Text fz={11} c="brand.6" truncate>
                {product ? product.name : "No product selected"}
              </Text>
            </Box>
            <Group
              gap={22}
              ml="auto"
              wrap="wrap"
              justify="flex-end"
              align="center"
            >
              {headerItems.map((item) => (
                <BarItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
              {headerItems.length > 0 && (
                <Box
                  h={30}
                  style={{
                    borderLeft: "1px solid var(--mantine-color-slate-2)",
                  }}
                />
              )}
              <BarItem
                label="Amount"
                value={state.amount ? fmtAmount(state.amount) : "—"}
                large
              />
              <BarItem
                label="Investment No."
                value={
                  state.investmentNo || (
                    <Badge
                      size="sm"
                      radius="sm"
                      variant="light"
                      color="warning"
                      style={{
                        textTransform: "none",
                        border: "1px solid var(--mantine-color-warning-3)",
                      }}
                    >
                      Pending
                    </Badge>
                  )
                }
              />
            </Group>
          </Group>
        </Box>
      )}

      {/* Body */}
      <Box className="inv-main">
        {sideNav}
        <Box className="inv-body">{children}</Box>
      </Box>

      {/* Footer */}
      <Group
        gap="xs"
        px={18}
        py={12}
        style={{
          flex: "none",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Button size="sm" radius="xl" variant="default" onClick={onClose}>
          Close
        </Button>
        <Box style={{ flex: 1 }} />
        {footer}
      </Group>
    </Modal>
  );
}
