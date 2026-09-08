import { Box, Card, Grid, Group, Select, Stack, Text, Title } from "@mantine/core";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

import { NO_MATCH_ACTION_OPTIONS, PRODUCT_OPTIONS, type MatchingSettings, type NoMatchAction } from "./shared";

interface MatchingBehaviorTabProps {
  settings: MatchingSettings;
  onChange: (patch: Partial<MatchingSettings>) => void;
}

export function MatchingBehaviorTab({ settings, onChange }: MatchingBehaviorTabProps) {
  return (
    <Card withBorder radius="md" p="lg">
      <Group gap="xs">
        <IconAdjustmentsHorizontal size={16} color="var(--mantine-color-brand-6)" />
        <Title order={4} c="slate.8" fw={600}>
          Matching behavior
        </Title>
      </Group>
      <Text fz="xs" c="slate.5" mt={4}>
        Decide what happens when a customer qualifies for more than one product.
      </Text>

      <Grid mt="lg">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <MatchModeOption
            selected={settings.matchMode === "stop"}
            title="Stop processing after match"
            description="Assign the first matching product and stop checking further groups."
            onSelect={() => onChange({ matchMode: "stop" })}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <MatchModeOption
            selected={settings.matchMode === "multiple"}
            title="Allow multiple matches"
            description="Surface every product the customer qualifies for, not just one."
            onSelect={() => onChange({ matchMode: "multiple" })}
          />
        </Grid.Col>
      </Grid>

      <Grid mt="md">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Default product"
            data={PRODUCT_OPTIONS}
            value={settings.defaultProduct}
            onChange={(v) => v && onChange({ defaultProduct: v })}
            allowDeselect={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="If no rule matches"
            data={NO_MATCH_ACTION_OPTIONS}
            value={settings.noMatchAction}
            onChange={(v) => v && onChange({ noMatchAction: v as NoMatchAction })}
            allowDeselect={false}
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
}

interface MatchModeOptionProps {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}

function MatchModeOption({ selected, title, description, onSelect }: MatchModeOptionProps) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      p="sm"
      style={{
        cursor: "pointer",
        borderRadius: "var(--mantine-radius-sm)",
        border: `1px solid var(--mantine-color-${selected ? "brand-5" : "slate-2"})`,
        background: selected ? "var(--mantine-color-brand-0)" : "var(--mantine-color-white)",
        height: "100%",
      }}
    >
      <Stack gap={2}>
        <Text fz="sm" fw={600} c="slate.8">
          {title}
        </Text>
        <Text fz="xs" c="slate.5">
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

export default MatchingBehaviorTab;