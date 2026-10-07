import {
  Box,
  Paper,
  Group,
  Badge,
  Text,
  Stack,
  Select,
  TextInput,
  ActionIcon,
  Button,
} from "@mantine/core";
import {
  IconBan,
  IconAlertTriangle,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import {
  SectionHead,
  RULE_FACTORS,
  RULE_OPERATORS,
  type HardStop,
  type ManualReviewRule,
} from "./Ruleshared";

interface DecisionRulesProps {
  hardStops: HardStop[];
  addHardStop: () => void;
  updateHardStop: (id: string, patch: Partial<HardStop>) => void;
  removeHardStop: (id: string) => void;
  manualReviews: ManualReviewRule[];
  addManualReview: () => void;
  updateManualReview: (id: string, patch: Partial<ManualReviewRule>) => void;
  removeManualReview: (id: string) => void;
}

export function DecisionRules({
  hardStops,
  addHardStop,
  updateHardStop,
  removeHardStop,
  manualReviews,
  addManualReview,
  updateManualReview,
  removeManualReview,
}: DecisionRulesProps) {
  return (
    <Box>
      <SectionHead
        title="Decision Rules"
        description="Define automatic decline triggers and manual review escalations."
      />
      <Paper
        radius="md"
        p="md"
        mb="md"
        style={{
          border: "1px solid var(--mantine-color-red-2)",
          background: "var(--mantine-color-red-0)",
        }}
      >
        <Group justify="space-between" mb="md" align="center" wrap="nowrap">
          <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            <Badge
              color="red.7"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="uppercase"
              style={{ borderWidth: 1 }}
              leftSection={
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--mantine-color-red-7)",
                    marginLeft: 6,
                    marginRight: 0,
                  }}
                />
              }
            >
              HARD STOP RULES
            </Badge>
            <Text fz={12} c="slate.7" truncate>
              Conditions that stop automatic approval outright.
            </Text>
          </Group>
          <Group gap="sm" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Badge
              color="red.7"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="none"
              style={{ borderWidth: 1, fontWeight: 600 }}
            >
              {hardStops.length} Rule
              {hardStops.length !== 1 ? "s" : ""} Configured
            </Badge>
            <Badge
              color="red.7"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="none"
              style={{ borderWidth: 1, fontWeight: 700 }}
              leftSection={<IconBan size={14} style={{ marginLeft: 4 }} />}
            >
              Outcome: Auto Decline
            </Badge>
          </Group>
        </Group>

        <Stack gap={4}>
          {hardStops.map((hs, i) => (
            <Paper
              key={hs.id}
              radius="sm"
              px={8}
              py={4}
              style={{
                background: "white",
                border: "1px solid var(--mantine-color-slate-2)",
              }}
            >
              <Group wrap="nowrap" gap="xs" align="center">
                <Text fz={10} fw={700} c="slate.4" w={16} ta="center">
                  {(i + 1).toString().padStart(2, "0")}
                </Text>
                <Select
                  radius="md"
                  size="xs"
                  value={hs.factor}
                  onChange={(v) => v && updateHardStop(hs.id, { factor: v })}
                  data={RULE_FACTORS}
                  style={{ flex: 1.5 }}
                  styles={{
                    input: {
                      height: 24,
                      minHeight: 24,
                      fontSize: 11,
                      borderRadius: 2,
                    },
                  }}
                />
                <Select
                  radius="md"
                  size="xs"
                  value={hs.operator}
                  onChange={(v) => v && updateHardStop(hs.id, { operator: v })}
                  data={RULE_OPERATORS}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      height: 24,
                      minHeight: 24,
                      fontSize: 11,
                      borderRadius: 2,
                    },
                  }}
                />
                <TextInput
                  radius="md"
                  size="xs"
                  value={hs.value}
                  onChange={(e) =>
                    updateHardStop(hs.id, { value: e.target.value })
                  }
                  rightSection={
                    hs.hint ? (
                      <Text fz={9} c="slate.4" mr="xs">
                        {hs.hint}
                      </Text>
                    ) : undefined
                  }
                  rightSectionWidth={80}
                  style={{ flex: 1.5 }}
                  styles={{
                    input: {
                      height: 24,
                      minHeight: 24,
                      fontSize: 11,
                      borderRadius: 2,
                    },
                  }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => removeHardStop(hs.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>

        <Group mt="md" justify="space-between" align="center">
          <Button
            variant="outline"
            color="red.7"
            bg="white"
            radius="md"
            size="xs"
            leftSection={<IconPlus size={14} />}
            style={{
              borderStyle: "dashed",
              borderWidth: 1,
              height: 26,
            }}
            onClick={addHardStop}
          >
            Add Hard Stop Rule
          </Button>
          <Text fz={10} c="slate.5">
            All hard stops trigger immediate evaluation termination
          </Text>
        </Group>
      </Paper>

      <Paper
        radius="md"
        p="md"
        style={{
          border: "1px solid var(--mantine-color-orange-2)",
          background: "var(--mantine-color-orange-0)",
        }}
      >
        <Group justify="space-between" mb="md" align="center" wrap="nowrap">
          <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            <Badge
              color="orange.8"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="uppercase"
              style={{ borderWidth: 1 }}
              leftSection={
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--mantine-color-orange-8)",
                    marginLeft: 6,
                    marginRight: 0,
                  }}
                />
              }
            >
              MANUAL REVIEW RULES
            </Badge>
            <Text fz={12} c="slate.7" truncate>
              Conditions that need a human decision.
            </Text>
          </Group>
          <Group gap="sm" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Badge
              color="orange.8"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="none"
              style={{ borderWidth: 1, fontWeight: 600 }}
            >
              {manualReviews.length} Rule
              {manualReviews.length !== 1 ? "s" : ""} Configured
            </Badge>
            <Badge
              color="orange.8"
              variant="outline"
              bg="white"
              radius="xl"
              size="md"
              tt="none"
              style={{ borderWidth: 1, fontWeight: 700 }}
              leftSection={
                <IconAlertTriangle size={14} style={{ marginLeft: 4 }} />
              }
            >
              Outcome: Manual Review
            </Badge>
          </Group>
        </Group>

        <Stack gap={4}>
          {manualReviews.map((mr, i) => (
            <Paper
              key={mr.id}
              radius="sm"
              px={8}
              py={4}
              style={{
                background: "white",
                border: "1px solid var(--mantine-color-slate-2)",
              }}
            >
              <Group wrap="nowrap" gap="xs" align="center">
                <Text fz={10} fw={700} c="slate.4" w={16} ta="center">
                  {(i + 1).toString().padStart(2, "0")}
                </Text>
                <Select
                  radius="md"
                  size="xs"
                  value={mr.factor}
                  onChange={(v) =>
                    v && updateManualReview(mr.id, { factor: v })
                  }
                  data={RULE_FACTORS}
                  style={{ flex: 1.5 }}
                  styles={{
                    input: {
                      height: 24,
                      minHeight: 24,
                      fontSize: 11,
                      borderRadius: 2,
                    },
                  }}
                />
                <Select
                  radius="md"
                  size="xs"
                  value={mr.operator}
                  onChange={(v) =>
                    v && updateManualReview(mr.id, v === "Between" ? { operator: v } : { operator: v, value2: "" })
                  }
                  data={RULE_OPERATORS}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      height: 24,
                      minHeight: 24,
                      fontSize: 11,
                      borderRadius: 2,
                    },
                  }}
                />
                <Group gap="xs" wrap="nowrap" style={{ flex: 1.5 }}>
                  <TextInput
                    radius="md"
                    size="xs"
                    value={mr.value1}
                    onChange={(e) =>
                      updateManualReview(mr.id, {
                        value1: e.target.value,
                      })
                    }
                    style={{ flex: 1 }}
                    styles={{
                      input: {
                        height: 24,
                        minHeight: 24,
                        fontSize: 11,
                        borderRadius: 2,
                      },
                    }}
                  />
                  {mr.operator === "Between" && (
                    <>
                      <Text fz={9} fw={700} c="slate.5">
                        AND
                      </Text>
                      <TextInput
                        radius="md"
                        size="xs"
                        value={mr.value2}
                        onChange={(e) =>
                          updateManualReview(mr.id, {
                            value2: e.target.value,
                          })
                        }
                        style={{ flex: 1 }}
                        styles={{
                          input: {
                            height: 24,
                            minHeight: 24,
                            fontSize: 11,
                            borderRadius: 2,
                          },
                        }}
                      />
                    </>
                  )}
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="orange.8"
                  size="sm"
                  onClick={() => removeManualReview(mr.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
        <Group mt="md" justify="space-between" align="center">
          <Button
            variant="outline"
            color="orange.8"
            bg="white"
            radius="md"
            size="xs"
            leftSection={<IconPlus size={14} />}
            style={{
              borderStyle: "dashed",
              borderWidth: 1,
              height: 26,
            }}
            onClick={addManualReview}
          >
            Add Manual Review Rule
          </Button>
        </Group>
      </Paper>
    </Box>
  );
}