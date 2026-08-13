import React from "react";
import { Box, Group, ActionIcon, Text } from "@mantine/core";
import { IconMaximize, IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";
import type { ModalInstance } from "../../store/ModalStore";

interface MinimizedModalCardProps {
  modal: ModalInstance;
  onRestore: () => void;
  onClose: () => void;
}

export const MinimizedModalCard: React.FC<MinimizedModalCardProps> = ({
  modal,
  onRestore,
  onClose,
}) => {
  const Icon = modal.meta?.icon;
  const title = modal.meta?.title || modal.type;
  const subtitle = modal.meta?.subtitle || (modal.isEdit ? "Edit" : "Create");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 18, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 40,
        width: 224,
        flexShrink: 0,
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-white)",
        padding: "0 8px",
        boxShadow: "var(--mantine-shadow-md)",
      }}
    >
      <Group
        gap="sm"
        wrap="nowrap"
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={onRestore}
        role="button"
        aria-label={`Restore ${title}`}
        title={title}
      >
        <Box
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--mantine-radius-md)",
            background: "var(--mantine-color-brand-0)",
            color: "var(--mantine-color-brand-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon ? (
            <Icon size={14} />
          ) : (
            <Text size="xs" fw={700}>
              {title.charAt(0).toUpperCase()}
            </Text>
          )}
        </Box>
        <Box style={{ minWidth: 0 }}>
          <Text size="xs" fw={700} c="slate.8" truncate>
            {title}
          </Text>
          <Text size={10} c="slate.5" truncate style={{ lineHeight: 1.2 }}>
            {subtitle}
          </Text>
        </Box>
      </Group>

      <ActionIcon
        variant="subtle"
        color="brand"
        radius="md"
        size="sm"
        onClick={onRestore}
        aria-label={`Restore ${title}`}
        title={`Restore ${title}`}
      >
        <IconMaximize size={14} />
      </ActionIcon>

      <ActionIcon
        variant="subtle"
        color="danger"
        radius="md"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label={`Close ${title}`}
        title={`Close ${title}`}
      >
        <IconX size={14} />
      </ActionIcon>
    </motion.div>
  );
};