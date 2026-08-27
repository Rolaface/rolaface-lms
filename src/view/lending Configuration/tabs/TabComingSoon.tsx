

import { Box, Paper, Text, ThemeIcon } from "@mantine/core";

import type { Icon as TablerIcon } from "@tabler/icons-react";

interface TabComingSoonProps {
  icon: TablerIcon;
  label: string;
}

export function TabComingSoon({
  icon: Icon,
  label,
}: TabComingSoonProps) {
  return (
    <Paper
      radius="sm"
      withBorder
      p="xl"
    >
      <Box style={{ textAlign: "center" }}>
        <ThemeIcon
          size={44}
          radius="xl"
          variant="light"
          color="brand"
          mx="auto"
          mb="sm"
        >
          <Icon size={20} />
        </ThemeIcon>

        <Text size="sm" fw={600} c="slate.7">
          {label}
        </Text>

        <Text size="xs" c="slate.5" mt={4}>
          This section will be available soon.
        </Text>
      </Box>
    </Paper>
  );
}

export default TabComingSoon;