import { Select, Stack, Text, Grid } from "@mantine/core";
import { IconChevronDown, IconUserCog } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../../components/shared/customer/Shared";

// TODO: replace with real RM lookup (useStaff/useRelationshipManagers hook)
// once available. Kept as temporary UI data only — not part of the final
// architecture.
const RM_OPTIONS = [
  { value: "RM001", label: "RM001 - Bwalya Mumba" },
  { value: "RM002", label: "RM002 - Chanda Kunda" },
  { value: "RM003", label: "RM003 - Natasha Zulu" },
];

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

interface AssignmentStepProps {
  relationshipManager: string | null;
  setRelationshipManager: (v: string | null) => void;
}

export function AssignmentStep({
  relationshipManager,
  setRelationshipManager,
}: AssignmentStepProps) {
  const rmName =
    RM_OPTIONS.find((rm) => rm.value === relationshipManager)?.label.split(
      " - ",
    )[1] ?? "";

  return (
    <PlainCard dense>
      <SectionHeader icon={IconUserCog} title="Assignment" dense />

      <Grid gap="sm" mt="xs">
        <Grid.Col span={4}>
          <Select
            radius="md"
            searchable
            rightSection={chevron}
            label="Relationship Manager ID"
            placeholder="Select RM"
            data={RM_OPTIONS}
            value={relationshipManager}
            onChange={setRelationshipManager}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <Stack gap={2}>
            <Text size="xs" fw={600} c="slate.6">
              Relationship Manager Name
            </Text>
            <Text
              size="sm"
              fw={500}
              c={rmName ? "slate.8" : "slate.4"}
              py={8}
              px={12}
              style={{
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-slate-0)",
                minHeight: 36,
              }}
            >
              {rmName || "Auto-filled"}
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </PlainCard>
  );
}