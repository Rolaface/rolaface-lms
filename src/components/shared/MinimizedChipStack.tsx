import { HoverCard, Paper, Group, Text, ThemeIcon, ActionIcon, Stack, ScrollArea, Box } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { useModalMinimizeStore } from '../../store/modalMinimizeStore';

interface MinimizedEntry {
  id: string;
  title: string;
  icon: Icon;
  restore: () => void;
  close: () => void;
}

const MAX_VISIBLE_AVATARS = 3;
const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = 8;

export function MinimizedChipStack() {
  const minimized = useModalMinimizeStore((s) => s.minimized);
  const entries: MinimizedEntry[] = Object.entries(minimized).map(([id, entry]) => ({
    id,
    title: entry.title,
    icon: entry.icon,
    restore: entry.restore,
    close: entry.close,
  }));

  if (entries.length === 0) return null;

  const visibleAvatars = entries.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = entries.length - visibleAvatars.length;

  return (
    <HoverCard width={260} shadow="md" position="top-end" withArrow openDelay={0} closeDelay={200}>
      <HoverCard.Target>
        <Paper
          pos="fixed"
          bottom={2}
          right={16}
          radius="xl"
          withBorder
          py={7}
          pl={7}
          pr={16}
          style={{
            zIndex: 400,
            cursor: 'pointer',
            display: 'inline-flex',
            background: 'color-mix(in srgb, var(--mantine-color-body) 70%, transparent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderColor: 'color-mix(in srgb, var(--mantine-color-slate-3) 60%, transparent)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)',
            transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
          }}
          styles={{
            root: {
              '&:hover': {
                transform: 'translateY(-2px)',
                background: 'color-mix(in srgb, var(--mantine-color-body) 85%, transparent)',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16), 0 4px 10px rgba(15, 23, 42, 0.08)',
              },
            },
          }}
        >
          <Group gap={12} wrap="nowrap">
            <Group gap={0} wrap="nowrap">
              {visibleAvatars.map((entry, idx) => (
                <ThemeIcon
                  key={entry.id}
                  size={AVATAR_SIZE}
                  radius="xl"
                  color="brand"
                  variant="light"
                  style={{
                    border: '2px solid var(--mantine-color-body)',
                    marginLeft: idx === 0 ? 0 : -AVATAR_OVERLAP,
                    zIndex: MAX_VISIBLE_AVATARS - idx,
                  }}
                >
                  <entry.icon size={14} />
                </ThemeIcon>
              ))}
              {overflowCount > 0 && (
                <Box
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-slate-1)',
                    border: '2px solid var(--mantine-color-body)',
                    marginLeft: -AVATAR_OVERLAP,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="11px" fw={600} c="slate.5">
                    +{overflowCount}
                  </Text>
                </Box>
              )}
            </Group>
            <Text size="xs" fw={700} c="slate.8" truncate style={{ maxWidth: 130 }}>
              {entries.length} minimized
            </Text>
          </Group>
        </Paper>
      </HoverCard.Target>

      <HoverCard.Dropdown
        p={0}
        style={{
          background: 'color-mix(in srgb, var(--mantine-color-body) 88%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderColor: 'color-mix(in srgb, var(--mantine-color-slate-3) 60%, transparent)',
        }}
      >
        <ScrollArea.Autosize mah={220} type="auto">
          <Stack gap={0}>
            {entries.map((entry, idx) => (
              <Group
                key={entry.id}
                justify="space-between"
                wrap="nowrap"
                gap="xs"
                px={12}
                py={10}
                style={{
                  cursor: 'pointer',
                  borderBottom: idx < entries.length - 1 ? '0.5px solid var(--mantine-color-slate-2)' : undefined,
                }}
                onClick={() => entry.restore()}
              >
                <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
                  <ThemeIcon size={24} radius="xl" color="brand" variant="light" style={{ flexShrink: 0 }}>
                    <entry.icon size={13} />
                  </ThemeIcon>
                  <Text size="xs" truncate>
                    {entry.title}
                  </Text>
                </Group>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    entry.close();
                  }}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}