import { Badge, Box, Group, NumberInput, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import type { FinancialLine } from "../../../api/LosConfiguration/LoanApplicationApi";
import { mergeFinancials, toFinancialItems } from "../LoanApplication/form";

export const lineTotal = (lines: FinancialLine[]) => lines.reduce((total, line) => total + (Number(line.monthly_amount) || 0), 0);

const amountOf = (lines: FinancialLine[], source: string) => lines.find((line) => line.source === source)?.monthly_amount;

export const linesEdited = (lines: FinancialLine[], original: FinancialLine[]) => JSON.stringify(lines) !== JSON.stringify(original);

export function FinancialLines({
  title,
  color,
  sources,
  lines,
  original,
  readOnly,
  onChange,
}: {
  title: string;
  color: "success" | "danger";
  sources: string[];
  lines: FinancialLine[];
  original: FinancialLine[];
  readOnly?: boolean;
  onChange: (lines: FinancialLine[]) => void;
}) {
  const rows = mergeFinancials(sources, lines);
  const update = (index: number, amount: number | "") =>
    onChange(toFinancialItems(rows.map((row, i) => (i === index ? { ...row, monthly_amount: amount } : row))));

  return (
    <Paper withBorder radius="md" p={12}>
      <Group justify="space-between" mb={10}>
        <Group gap={8}>
          <Box w={8} h={8} style={{ borderRadius: "50%", background: `var(--mantine-color-${color}-5)` }} />
          <Text fz={12} fw={800} c="slate.8" tt="uppercase" style={{ letterSpacing: 0.4 }}>
            {title}
          </Text>
        </Group>
        <Badge size="sm" radius="sm" variant="outline" color={color}>
          ZMW
        </Badge>
      </Group>
      <Stack gap={6}>
        {rows.map((row, index) => {
          const edited = amountOf(original, row.source) !== (row.monthly_amount === "" ? undefined : row.monthly_amount);
          return (
            <SimpleGrid key={row.source} cols={2} spacing={8}>
              <Box
                px={10}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-slate-2)",
                  background: "var(--mantine-color-slate-0)",
                }}
              >
                <Text fz={12.5} c="slate.8" truncate>
                  {row.source}
                </Text>
              </Box>
              <NumberInput
                size="sm"
                radius="md"
                min={0}
                hideControls
                thousandSeparator=","
                placeholder="0.00"
                readOnly={readOnly}
                leftSection={<Text fz={11} c="slate.5">ZMW</Text>}
                value={row.monthly_amount}
                onChange={(value) => update(index, value === "" ? "" : Number(value) || 0)}
                styles={{
                  input: {
                    fontWeight: 700,
                    textAlign: "right",
                    borderColor: edited ? "var(--mantine-color-orange-5)" : undefined,
                  },
                }}
              />
            </SimpleGrid>
          );
        })}
      </Stack>
    </Paper>
  );
}
