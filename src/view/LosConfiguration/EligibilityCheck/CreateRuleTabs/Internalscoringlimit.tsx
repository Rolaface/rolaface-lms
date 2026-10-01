import { useMemo } from "react";
import {
  Box,
  Title,
  Text,
  Table,
  TextInput,
  Group,
  Select,
  ActionIcon,
  Button,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  DECISION_OPTIONS,
  MULTIPLE_BASIS_OPTIONS,
  DECISION_TONE,
  DECISION_DOT,
  type CreditBand,
} from "./Ruleshared";

interface InternalScoringLimitProps {
  internalBands: CreditBand[];
  updateInternalBand: (id: string, patch: Partial<CreditBand>) => void;
  addInternalBand: () => void;
  removeInternalBand: (id: string) => void;
}

export function InternalScoringLimit({
  internalBands,
  updateInternalBand,
  addInternalBand,
  removeInternalBand,
}: InternalScoringLimitProps) {
  const sortedInternalBands = useMemo(
    () => [...internalBands].sort((a, b) => Number(b.min) - Number(a.min)),
    [internalBands],
  );

  return (
    <Box>
      <Box mb="xs">
        <Box
          py={6}
          px={8}
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            background: "transparent",
          }}
        >
          <Title order={6} c="slate.8" fw={600} mb={1}>
            Internal Scoring Limit
          </Title>
          <Text fz={10} c="slate.5">
            Define scoring bands — each band's minimum score and credit limit
            are fully editable. Score is out of 100.
          </Text>
        </Box>
        <Table verticalSpacing={4} fz={11} style={{ tableLayout: "fixed" }}>
          <Table.Thead style={{ background: "transparent" }}>
            <Table.Tr>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 100,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                  paddingLeft: 8,
                }}
              >
                Min score
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 160,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Range
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 80,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Grade
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 250,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                  textAlign: "center",
                }}
              >
                <Box>Credit limit</Box>
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 170,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Decision
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "var(--mantine-color-slate-2)",
                  width: 38,
                }}
              ></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedInternalBands.map((band, i) => {
              const upper = i > 0 ? sortedInternalBands[i - 1].min - 1 : null;
              const rangeLabel =
                upper === null ? `${band.min}+` : `${band.min}–${upper}`;
              const dotColor =
                DECISION_DOT[DECISION_TONE[band.decision] as string];
              return (
                <Table.Tr key={band.id}>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                      paddingLeft: 8,
                    }}
                  >
                    <TextInput
                      radius="md"
                      size="xs"
                      type="number"
                      value={band.min}
                      onChange={(e) =>
                        updateInternalBand(band.id, {
                          min: e.target.value,
                        })
                      }
                      styles={{
                        input: {
                          minHeight: 26,
                          height: 26,
                          textAlign: "center",
                          background: "transparent",
                          borderColor: "var(--mantine-color-slate-3)",
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                      color: "var(--mantine-color-slate-5)",
                    }}
                  >
                    {rangeLabel}
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                    }}
                  >
                    <Box
                      w={40}
                      h={26}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--mantine-color-slate-3)",
                        borderRadius: "var(--mantine-radius-md)",
                        fontWeight: 700,
                        color: "var(--mantine-color-slate-8)",
                      }}
                    >
                      {band.grade}
                    </Box>
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                    }}
                  >
                    <Group
                      gap={0}
                      wrap="nowrap"
                      style={{
                        border: "1px solid var(--mantine-color-slate-3)",
                        borderRadius: "var(--mantine-radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <TextInput
                        radius={0}
                        size="xs"
                        variant="unstyled"
                        w={46}
                        type="number"
                        value={band.multiple}
                        onChange={(e) =>
                          updateInternalBand(band.id, {
                            multiple: e.target.value,
                          })
                        }
                        styles={{
                          input: {
                            minHeight: 26,
                            height: 26,
                            textAlign: "center",
                            fontWeight: 600,
                          },
                        }}
                      />
                      <Box
                        px={8}
                        style={{
                          height: 26,
                          borderLeft: "1px solid var(--mantine-color-slate-3)",
                          borderRight: "1px solid var(--mantine-color-slate-3)",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Text fz={10} c="dimmed">
                          ×
                        </Text>
                      </Box>
                      <Select
                        radius={0}
                        size="xs"
                        variant="unstyled"
                        style={{ flex: 1 }}
                        value={band.basis}
                        onChange={(v) =>
                          v && updateInternalBand(band.id, { basis: v })
                        }
                        data={MULTIPLE_BASIS_OPTIONS}
                        styles={{
                          input: {
                            minHeight: 26,
                            height: 26,
                            paddingLeft: 10,
                          },
                        }}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                    }}
                  >
                    <Select
                      radius="md"
                      size="xs"
                      value={band.decision}
                      onChange={(v) =>
                        v && updateInternalBand(band.id, { decision: v })
                      }
                      data={DECISION_OPTIONS}
                      styles={{
                        input: {
                          minHeight: 26,
                          height: 26,
                          background: "transparent",
                          borderColor: "var(--mantine-color-slate-3)",
                        },
                      }}
                      leftSection={
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 99,
                            background: `var(--mantine-color-${dotColor}-5)`,
                          }}
                        />
                      }
                    />
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-2)",
                    }}
                  >
                    <ActionIcon
                      variant="subtle"
                      color="slate"
                      size="sm"
                      disabled={internalBands.length <= 1}
                      onClick={() => removeInternalBand(band.id)}
                    >
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
        <Box py={8} px={8}>
          <Button
            variant="subtle"
            color="slate"
            size="xs"
            leftSection={<IconPlus size={12} />}
            onClick={addInternalBand}
          >
            Add band
          </Button>
        </Box>
      </Box>
    </Box>
  );
}