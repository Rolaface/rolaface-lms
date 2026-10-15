import { Button, Group, Text } from "@mantine/core";
import { IconArrowRight, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";

export type StageBusy = "save" | "approve" | null;

export function StageFooter({
  ready,
  message,
  busy,
  canSave = true,
  onCancel,
  onSave,
  onApprove,
}: {
  ready: boolean;
  message: string;
  busy: StageBusy;
  canSave?: boolean;
  onCancel: () => void;
  onSave: () => void;
  onApprove: () => void;
}) {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      px="xl"
      py={8}
      bg="white"
      style={{
        borderTop: "1px solid var(--mantine-color-slate-2)",
        boxShadow: "0 -6px 18px -14px rgba(15, 23, 42, 0.45)",
        flexShrink: 0,
      }}
    >
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        {ready ? (
          <IconCircleCheck size={15} color="var(--mantine-color-success-6)" style={{ flexShrink: 0 }} />
        ) : (
          <IconInfoCircle size={15} color="var(--mantine-color-slate-4)" style={{ flexShrink: 0 }} />
        )}
        <Text fz={12} c={ready ? "success.7" : "slate.5"} fw={ready ? 600 : 500}>
          {message}
        </Text>
      </Group>
      <Group gap={10} wrap="nowrap">
        <Button variant="subtle" color="slate" radius="md" fw={600} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          radius="md"
          fw={600}
          onClick={onSave}
          disabled={!canSave || busy === "approve"}
          loading={busy === "save"}
        >
          Save
        </Button>
        <Button
          radius="md"
          onClick={onApprove}
          disabled={!ready || busy === "save"}
          loading={busy === "approve"}
          rightSection={<IconArrowRight size={16} />}
          styles={{
            root: ready
              ? {
                  background: "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                  boxShadow: "0 8px 18px -10px color-mix(in srgb, var(--mantine-color-brand-6) 90%, transparent)",
                }
              : undefined,
          }}
        >
          Approve
        </Button>
      </Group>
    </Group>
  );
}
