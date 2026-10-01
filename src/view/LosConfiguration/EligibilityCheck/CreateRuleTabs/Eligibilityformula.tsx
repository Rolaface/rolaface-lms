import {
  Box,
  Group,
  Text,
  TextInput,
  Divider,
  Paper,
  Stack,
  NumberInput,
} from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import {
  SectionHead,
  FORMULA_ITEMS,
  type FormulaParams,
  type SetFormulaParam,
} from "./Ruleshared";

interface EligibilityFormulaProps {
  formulaParams: FormulaParams;
  setFormulaParam: SetFormulaParam;
}

export function EligibilityFormula({
  formulaParams,
  setFormulaParam,
}: EligibilityFormulaProps) {
  return (
    <Box>
      <Group justify="space-between" align="flex-start" mb="sm">
        <SectionHead
          title="Eligibility formula"
          description="The eligible amount is always the lowest of the limits below. Values update live."
        />
      </Group>

      <Group gap="md" mb="md" align="center">
        <Group gap={8}>
  <Text fz={11} c="slate.6" fw={500}>
    Affordability buffer
  </Text>
  <NumberInput
    hideControls
    min={0}
    placeholder="0"
    thousandSeparator=","
    w={64}
    value={
      formulaParams.affordabilityBuffer === null
        ? ""
        : formulaParams.affordabilityBuffer
    }
    onChange={(val) =>
      setFormulaParam("affordabilityBuffer")(val === "" ? 0 : Number(val))
    }
    rightSection={
      <Text fz={9} c="slate.5">
        %
      </Text>
    }
    rightSectionWidth={22}
    size="xs"
    styles={{ input: { minHeight: 28, height: 28 } }}
  />
</Group>
        <Divider orientation="vertical" color="slate.2" />

        <Text fz={11} c="slate.6" fw={500}>
          Max EMI ratio {formulaParams.maxEmiRatio}% · Max DSR{" "}
          {formulaParams.maxDtiRatio}%
        </Text>
      </Group>

      <Paper
        radius="md"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          background: "var(--mantine-color-white)",
          overflow: "hidden",
        }}
      >
        <Stack gap={0}>
          {FORMULA_ITEMS.map(([name, formula], i, arr) => (
            <Box
              key={name}
              px="md"
              py="sm"
              style={{
                borderBottom:
                  i < arr.length - 1
                    ? "1px solid var(--mantine-color-slate-1)"
                    : "none",
              }}
            >
              <Group wrap="nowrap" align="center">
                <Text fz={11} fw={700} c="brand.6" w={16} ta="center">
                  {i + 1}
                </Text>
                <Text fz="xs" fw={600} c="slate.8" w={140}>
                  {name}
                </Text>
                <Text fz={11} c="slate.6" fw={500}>
                  {formula}
                </Text>
              </Group>
            </Box>
          ))}
        </Stack>

        <Box
          p="xs"
          bg="slate.0"
          style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Paper
            px="sm"
            py="xs"
            radius="md"
            style={{
              background: "var(--mantine-color-white)",
              border: "1px solid var(--mantine-color-slate-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Group gap={8}>
              <IconShieldCheck size={14} color="var(--mantine-color-slate-8)" />
              <Text fz="xs" fw={600} c="slate.8">
                Final eligible amount = MIN(all limits above)
              </Text>
            </Group>
          </Paper>
        </Box>
      </Paper>

      <Text fz={10} c="slate.5" mt="sm">
        Worked example: basic salary ZMW 15,000 · net salary ZMW 12,500 · other
        income ZMW 3,000 · credit score 735 · tenure 24 months.
      </Text>
    </Box>
  );
}