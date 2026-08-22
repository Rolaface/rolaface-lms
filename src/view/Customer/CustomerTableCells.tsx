import { Box, Group, Text, Badge, Avatar } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

export function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

export function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  const scale = isActive ? 'success' : 'danger';
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box w={6} h={6} style={{ borderRadius: '50%', background: `var(--mantine-color-${scale}-6)` }} />
      }
    >
      {status || '—'}
    </Badge>
  );
}

export function NameCell({ name, type }: { name: string; type: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Group gap={10} wrap="nowrap">
      <Avatar
        size={34}
        radius="md"
        variant="light"
        color={type === 'Company' ? 'brand' : 'info'}
        style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}
      >
        {initials || '—'}
      </Avatar>
      <Text fz="sm" fw={700} c="slate.8">
        {name || '—'}
      </Text>
    </Group>
  );
}

export function IconText({
  icon,
  children,
  mono = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Group gap={6} wrap="nowrap">
      <Box style={{ color: 'var(--mantine-color-slate-4)', display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Text fz="xs" c="slate.6" style={mono ? { fontFamily: 'var(--mantine-font-family-monospace)' } : undefined}>
        {children || '—'}
      </Text>
    </Group>
  );
}

export function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <Text fz="xs" c="slate.6">
      {text || '—'}
    </Text>
  );
}