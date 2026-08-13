import React, { useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Group, ActionIcon, Text, useMantineTheme } from "@mantine/core";
import { IconMinus, IconX } from "@tabler/icons-react";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import { useModalStore as useModalStore, LMS_MODAL_LAYER as MODAL_LAYER } from "../../store/ModalStore";

const MAX_WIDTH_PX: Record<string, number> = {
  sm: 420,
  md: 520,
  lg: 620,
  xl: 720,
  "2xl": 820,
  "4xl": 960,
  "5xl": 1060,
  "6xl": 1160,
  wide: 1160,
  full: 1400,
};

export interface MinimizableModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: TablerIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  summaryBar?: React.ReactNode;
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "wide"
    | "full";
  height?: string;
  customWidth?: string;
  formContainerRef?: React.RefObject<HTMLElement | null>;
  hideMinimize?: boolean;
}

export const MinimizableModal: React.FC<MinimizableModalProps> = ({
  modalId,
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "4xl",
  height = "520px",
  customWidth,
  summaryBar,
  formContainerRef,
  hideMinimize = false,
}) => {
  const modalMeta = useModalStore((state) =>
    state.modals.find((m) => m.id === modalId)
  );
  const { minimizeModal } = useModalStore();

  const registeredRef = useRef(false);

  React.useEffect(() => {
    if (isOpen && !registeredRef.current) {
      registeredRef.current = true;
      useModalStore
        .getState()
        .registerModalMeta(modalId, { title, subtitle, icon });
    }
    if (!isOpen) {
      registeredRef.current = false;
    }
  }, [isOpen, modalId, title, subtitle, icon]);

  const modals = useModalStore((state) => state.modals);
  const layer = useMemo(() => {
    const visible = modals
      .filter((m) => !m.minimized)
      .sort((a, b) => a.focusOrder - b.focusOrder);
    const rank = Math.max(
      visible.findIndex((m) => m.id === modalId),
      0
    );
    const backdrop =
      MODAL_LAYER.modalBackdropBase + rank * MODAL_LAYER.modalStep;
    return {
      backdrop,
      panel: backdrop + MODAL_LAYER.modalPanelOffset,
    };
  }, [modals, modalId]);

  if (!isOpen) return null;

  const minimized = modalMeta?.minimized ?? false;

  return (
    <>
      {minimized && <div style={{ display: "none" }}>{children}</div>}
      <AnimatePresence>
        {!minimized && (
          <ModalShell
            title={title}
            subtitle={subtitle}
            icon={icon}
            footer={footer}
            maxWidth={maxWidth}
            height={height}
            customWidth={customWidth}
            backdropZIndex={layer.backdrop}
            panelZIndex={layer.panel}
            onClose={onClose}
            onMinimize={() => minimizeModal(modalId)}
            summaryBar={summaryBar}
            formContainerRef={formContainerRef}
            hideMinimize={hideMinimize}
          >
            {children}
          </ModalShell>
        )}
      </AnimatePresence>
    </>
  );
};

interface ModalShellProps {
  title: string;
  subtitle?: string;
  icon?: TablerIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  height?: string;
  customWidth?: string;
  backdropZIndex: number;
  panelZIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  summaryBar?: React.ReactNode;
  formContainerRef?: React.RefObject<HTMLElement | null>;
  hideMinimize?: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = "4xl",
  height = "520px",
  customWidth,
  backdropZIndex,
  panelZIndex,
  onClose,
  onMinimize,
  summaryBar,
  formContainerRef,
  hideMinimize = false,
}) => {
  const theme = useMantineTheme();
  const panelRef = useRef<HTMLDivElement | null>(null);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: backdropZIndex,
          background: "rgba(15,23,42,0.32)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: panelZIndex,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
          pointerEvents: "none",
          overflow: "auto",
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 32 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            width: "100%",
            maxWidth: customWidth || MAX_WIDTH_PX[maxWidth] || MAX_WIDTH_PX["4xl"],
            height,
            maxHeight: "calc(100dvh - 16px)",
            overflow: "hidden",
            borderRadius: "var(--mantine-radius-lg)",
            border: "1px solid var(--mantine-color-slate-2)",
            background: "var(--mantine-color-white)",
            boxShadow:
              "0 28px 70px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.06)",
          }}
        >
          {/* Header — same solid brand.6 bar pattern as other LMS modals */}
          <Box
            style={{
              position: "relative",
              flexShrink: 0,
              background: theme.other.brandGradient as string,
              borderBottom: "1px solid var(--mantine-color-brand-7)",
              padding: "12px 20px",
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                {Icon && (
                  <Box
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "var(--mantine-radius-md)",
                      background: theme.other.headerIconOverlayBg as string,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} color="var(--mantine-color-white)" />
                  </Box>
                )}
                <Box style={{ minWidth: 0 }}>
                  <Text
                    size="md"
                    fw={700}
                    c="white"
                    style={{ lineHeight: 1.2 }}
                    truncate
                  >
                    {title}
                  </Text>
                  {subtitle && (
                    <Text size="xs" c="brand.1" style={{ lineHeight: 1.2 }} truncate>
                      {subtitle}
                    </Text>
                  )}
                </Box>
              </Group>

              <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                {!hideMinimize && (
                  <ActionIcon
                    variant="subtle"
                    color="white"
                    radius="xl"
                    size="md"
                    aria-label="Minimize"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMinimize();
                    }}
                    styles={{
                      root: {
                        "&:hover": { backgroundColor: theme.other.headerButtonHoverBg as string },
                      },
                    }}
                  >
                    <IconMinus size={16} color="var(--mantine-color-white)" />
                  </ActionIcon>
                )}
                <ActionIcon
                  variant="subtle"
                  color="white"
                  radius="xl"
                  size="md"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  styles={{
                    root: {
                      "&:hover": { backgroundColor: theme.other.headerButtonHoverBg as string },
                    },
                  }}
                >
                  <IconX size={16} color="var(--mantine-color-white)" />
                </ActionIcon>
              </Group>
            </Group>
            {summaryBar && <Box mt={6}>{summaryBar}</Box>}
          </Box>

          {/* Body */}
          <Box
            ref={(node: HTMLDivElement | null) => {
              if (formContainerRef) {
                (formContainerRef as React.MutableRefObject<HTMLElement | null>).current = node;
              }
            }}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "auto",
              background: "var(--mantine-color-slate-0)",
              padding: "16px 20px",
            }}
          >
            {children}
          </Box>

          {/* Footer */}
          {footer && <Box style={{ flexShrink: 0 }}>{footer}</Box>}
        </motion.div>
      </div>
    </>,
    document.body
  );
};