import { Paper, Group, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconX, IconSquare } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

interface MinimizedChipProps {
  title: string;
  icon: Icon;
  offset?: number;
  onRestore: () => void;
  onClose: () => void;
}

export function MinimizedChip({ title, icon: IconComp, offset = 0, onRestore, onClose }: MinimizedChipProps) {
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
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={20} radius="xl" color="brand" variant="light">
            <IconComp size={12} />
          </ThemeIcon>
          <Text size="xs" fw={600} truncate>{title}</Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <ActionIcon size="xs" variant="subtle" aria-label="Restore"
            onClick={(e) => { e.stopPropagation(); onRestore(); }}>
            <IconSquare size={12} />
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" color="red" aria-label="Close"
            onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <IconX size={12} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}