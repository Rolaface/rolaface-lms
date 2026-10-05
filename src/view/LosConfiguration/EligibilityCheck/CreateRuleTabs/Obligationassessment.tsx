import {
  Box,
  SimpleGrid,
  Paper,
  Group,
  Badge,
  Text,
  Slider,
  Table,
  Switch,
  ActionIcon,
} from "@mantine/core";
import {
  IconMath,
  IconDots,
  IconBuilding,
  IconTrash,
} from "@tabler/icons-react";
import {
  Field,
  SectionHead,
  type ObligationDef,
  type FormulaParams,
  type SetFormulaParam,
} from "./Ruleshared";

interface ObligationAssessmentProps {
  obligationSources: ObligationDef[];
  updateObligationSource: (index: number, patch: Partial<ObligationDef>) => void;
  formulaParams: FormulaParams;
  setFormulaParam: SetFormulaParam;
}

export function ObligationAssessment({
  obligationSources,
  updateObligationSource,
  formulaParams,
  setFormulaParam,
}: ObligationAssessmentProps) {
  return (
    <Box>
      <SectionHead
        title="Obligation assessment"
        description="Configure which existing obligations reduce the customer's borrowing capacity."
      />

      <SimpleGrid cols={2} spacing="sm" mb="md">
        {/* ── DSR Section ── */}
        <Paper
          px="sm"
          py="sm"
          radius="sm"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group gap={8} mb={4}>
            <Badge color="violet" variant="light" size="sm" radius="sm">
              DSR
            </Badge>
            <Text fz="xs" fw={700} c="slate.8">
              Debt Service Ratio
            </Text>
          </Group>
          <Text fz={10} c="slate.5" mb="sm">
            Measures a customer's total monthly debt obligations as a
            percentage of their gross monthly income.
          </Text>
          <Field
            label={`Maximum DSR — ${formulaParams.maxDtiRatio}%`}
            hint="If total qualifying monthly debt / gross monthly income exceeds this, the applicant is declined or flagged."
          >
            <Group gap="sm" wrap="nowrap" mt={4}>
              <Slider
                value={formulaParams.maxDtiRatio}
                onChange={(value) => setFormulaParam("maxDtiRatio")(value)}
                min={10}
                max={70}
                color="violet"
                style={{ flex: 1 }}
                label={(v) => `${v}%`}
                size="xs"
              />
              <Text fz="xs" fw={700} c="violet.6" w={32}>
                {formulaParams.maxDtiRatio}%
              </Text>
            </Group>
          </Field>
          <Paper
            mt="sm"
            px={8}
            py={6}
            radius="sm"
            style={{
              background: "var(--mantine-color-violet-0)",
              border: "1px solid var(--mantine-color-violet-1)",
            }}
          >
            <Text fz={10} c="violet.7" fw={500}>
              <b>Formula:</b> Total qualifying monthly debt payments ÷ Gross
              monthly income × 100
            </Text>
          </Paper>
        </Paper>

        {/* ── EMI-to-Income Section ── */}
        <Paper
          px="sm"
          py="sm"
          radius="sm"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group gap={8} mb={4}>
            <Badge color="brand" variant="light" size="sm" radius="sm">
              EMI
            </Badge>
            <Text fz="xs" fw={700} c="slate.8">
              EMI-to-Income Ratio
            </Text>
          </Group>
          <Text fz={10} c="slate.5" mb="sm">
            Measures the customer's monthly loan/EMI repayment obligations as a
            percentage of their monthly income.
          </Text>
          <Field
            label={`Maximum EMI-to-Income Ratio — ${formulaParams.maxEmiRatio}%`}
            hint="Qualifying monthly EMI/debt payments + proposed new EMI must not exceed this percentage of monthly income."
          >
            <Group gap="sm" wrap="nowrap" mt={4}>
              <Slider
                value={formulaParams.maxEmiRatio}
                onChange={(value) => setFormulaParam("maxEmiRatio")(value)}
                min={10}
                max={60}
                color="brand"
                style={{ flex: 1 }}
                label={(v) => `${v}%`}
                size="xs"
              />
              <Text fz="xs" fw={700} c="brand.6" w={32}>
                {formulaParams.maxEmiRatio}%
              </Text>
            </Group>
          </Field>
          <Paper
            mt="sm"
            px={8}
            py={6}
            radius="sm"
            style={{
              background: "var(--mantine-color-brand-0)",
              border: "1px solid var(--mantine-color-brand-1)",
            }}
          >
            <Text fz={10} c="brand.7" fw={500}>
              <b>Formula:</b> Qualifying monthly EMI/debt payments ÷ Monthly
              income × 100
            </Text>
          </Paper>
        </Paper>
      </SimpleGrid>

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
                Obligation Source
              </Table.Th>
              <Table.Th
                style={{
                  borderColor: "transparent",
                  width: "50%",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--mantine-color-slate-5)",
                  textTransform: "none",
                }}
              >
                Consider %
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
            {obligationSources.map((obs, index) => {
              const Icon =
                obs.name === "Existing Monthly EMI"
                  ? IconMath
                  : obs.name === "Other Monthly Debt"
                    ? IconDots
                    : obs.name === "Rental Obligation"
                      ? IconBuilding
                      : IconDots;
              return (
                <Table.Tr key={obs.name}>
                  <Table.Td
                    style={{
                      borderColor: "var(--mantine-color-slate-1)",
                      paddingLeft: 8,
                    }}
                  >
                    <Group gap={8}>
                      <Icon size={12} color="var(--mantine-color-slate-5)" />
                      <Text fz={11} fw={500} c="slate.8">
                        {obs.name}
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
                        value={obs.pct}
                        onChange={(v) =>
                          updateObligationSource(index, { pct: v })
                        }
                        disabled={!obs.inc}
                        min={0}
                        max={100}
                        style={{ flex: 1 }}
                        size="xs"
                        color="brand"
                        label={(v) => `${v}%`}
                      />
                      <Text fz={10} fw={600} c="slate.7" w={28}>
                        {obs.pct}%
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
                      checked={obs.ver}
                      onChange={(e) =>
                        updateObligationSource(index, {
                          ver: e.currentTarget.checked,
                        })
                      }
                      disabled={!obs.inc}
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
                      checked={obs.inc}
                      onChange={(e) =>
                        updateObligationSource(index, {
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
    </Box>
  );
}