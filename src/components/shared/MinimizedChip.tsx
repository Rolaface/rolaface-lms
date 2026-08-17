import { Paper, Group, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconX, IconArrowsDiagonal } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

interface MinimizedChipProps {
  title: string;
  icon: Icon;
  offset?: number;
  onRestore: () => void;
  onClose: () => void;
}

export function MinimizedChip({
  title,
  icon: IconComp,
  offset = 0,
  onRestore,
  onClose,
}: MinimizedChipProps) {
  return (
    <Paper
      pos="fixed"
      bottom={16 + offset * 56}
      right={16}
      p="xs"
      radius="md"
      shadow="md"
      withBorder
      style={{ zIndex: 400, cursor: 'pointer', minWidth: 220, maxWidth: 280 }}
      onClick={onRestore}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={28} radius="md" color="brand" variant="light">
            <IconComp size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600} truncate>
            {title}
          </Text>
        </Group>

        <Group gap={4} wrap="nowrap">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="Expand"
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
          >
            <IconArrowsDiagonal size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}