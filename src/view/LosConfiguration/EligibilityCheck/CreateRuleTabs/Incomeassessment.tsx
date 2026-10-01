import {
  Box,
  Group,
  Text,
  Table,
  Slider,
  Switch,
  ActionIcon,
  TextInput,
  NumberInput,
} from "@mantine/core";
import {
  IconBriefcase,
  IconBuildingBank,
  IconBuilding,
  IconDots,
  IconTrash,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  SectionHead,
  InfoCard,
  type IncomeSourceTuple,
  type FormulaParams,
  type SetFormulaParam,
} from "./Ruleshared";

interface IncomeAssessmentProps {
  incomeSources: IncomeSourceTuple[];
  updateIncomeSource: (
    index: number,
    patch: Partial<{ pct: number; ver: boolean; inc: boolean }>,
  ) => void;
  formulaParams: FormulaParams;
  setFormulaParam: SetFormulaParam;
}

export function IncomeAssessment({
  incomeSources,
  updateIncomeSource,
  formulaParams,
  setFormulaParam,
}: IncomeAssessmentProps) {
  return (
    <Box>
      <Group justify="space-between" align="flex-start" mb="xs">
        <SectionHead
          title="Income assessment"
          description="Add every income source this rule recognizes and the share counted toward eligibility."
        />
      </Group>

      <Box mb="xs">
        <Table verticalSpacing={4} fz={11} highlightOnHover>
          <Table.Thead style={{ background: "transparent" }}>
            <Table.Tr>
              <Table.Th
                style={{
                  borderColor: "transparent",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                  paddingLeft: 8,
                }}
              >
                Income Source
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "transparent",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Recognition %
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "transparent",
                  width: 60,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Verify
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "transparent",
                  width: 70,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Included
              </Table.Th>
              <Table.Th
                style={{ borderColor: "transparent", width: 36 }}
              ></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {incomeSources.map(([n, pct, ver, inc], index) => {
              const Icon =
                n === "Net Salary"
                  ? IconBriefcase
                  : n === "Business Income"
                    ? IconBuildingBank
                    : n === "Rental Income"
                      ? IconBuilding
                      : IconDots;
              return (
                <Table.Tr key={n as string}>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      paddingLeft: 8,
                    }}
                  >
                    <Group gap={8}>
                      <Icon size={12} color="var(--mantine-color-slate-5)" />
                      <Text fz={11} fw={500} c="slate.8">
                        {n as string}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      width: "50%",
                    }}
                  >
                    <Group gap={12} wrap="nowrap" align="center">
                      <Slider
                        value={pct as number}
                        onChange={(v) => updateIncomeSource(index, { pct: v })}
                        disabled={!inc}
                        min={0}
                        max={100}
                        style={{ flex: 1 }}
                        size="xs"
                        color="brand"
                        label={(v) => `${v}%`}
                      />
                      <Text fz={10} fw={600} c="slate.7" w={28}>
                        {pct}%
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      textAlign: "center",
                      width: 60,
                    }}
                  >
                    <Switch
                      checked={ver as boolean}
                      onChange={(e) =>
                        updateIncomeSource(index, {
                          ver: e.currentTarget.checked,
                        })
                      }
                      disabled={!inc}
                      size="xs"
                      color="brand"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    />
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      textAlign: "center",
                      width: 70,
                    }}
                  >
                    <Switch
                      checked={inc as boolean}
                      onChange={(e) =>
                        updateIncomeSource(index, {
                          inc: e.currentTarget.checked,
                        })
                      }
                      size="xs"
                      color="brand"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    />
                  </Table.Td>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      textAlign: "center",
                      width: 36,
                      paddingRight: 8,
                    }}
                  >
                    <ActionIcon variant="subtle" color="slate.4" size="sm">
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>

      <InfoCard color="brand">
        <Group gap={8} align="flex-start">
          <IconInfoCircle
            size={16}
            color="var(--mantine-color-brand-6)"
            style={{ marginTop: 1 }}
          />
          <Box style={{ flex: 1 }}>
            <Text fz={12} c="brand.7" fw={500}>
              Eligible monthly income = sum of each source × recognition
              percentage
            </Text>
            <Group gap={4} wrap="nowrap" align="center" mt={8}>
  <Text fz={12} c="brand.7" fw={500}>
    Income limit = eligible monthly income ×
  </Text>
  <NumberInput
    hideControls
    min={0}
    placeholder="0"
    thousandSeparator=","
    value={formulaParams.salaryMultiple === null ? "" : formulaParams.salaryMultiple}
    onChange={(val) =>
      setFormulaParam("salaryMultiple")(val === "" ? 0 : Number(val))
    }
    size="xs"
    w={40}
    styles={{
      input: {
        minHeight: 24,
        height: 24,
        padding: "0 4px",
        textAlign: "center",
        fontSize: 12,
        borderColor: "var(--mantine-color-brand-3)",
        backgroundColor: "rgba(255,255,255,0.8)",
        fontWeight: 600,
      },
    }}
  />
  <Text fz={12} c="brand.7" fw={500}>
    multiple
  </Text>
</Group>
          </Box>
        </Group>
      </InfoCard>
    </Box>
  );
}