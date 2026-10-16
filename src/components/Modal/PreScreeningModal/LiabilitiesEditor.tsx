import { ActionIcon, Badge, Box, Button, Group, NumberInput, Table, Text, TextInput } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

import type { FinancialLine } from "../../../api/LosConfiguration/LoanApplicationApi";
import { OBLIGATION_SOURCES } from "../LoanApplication/form";
import { FinancialLines } from "./FinancialLines";
import { MicroLabel, zmw } from "./PreScreeningShared";

export const declaredLines = (lines: FinancialLine[]) => lines.filter((line) => !line.origin);
export const facilityLines = (lines: FinancialLine[]) => lines.filter((line) => line.origin);
export const outstandingTotal = (lines: FinancialLine[]) =>
  facilityLines(lines).reduce((total, line) => total + (Number(line.outstanding) || 0), 0);

const tableBox = { border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-lg)", overflow: "hidden" };

export function LiabilitiesEditor({
  lines,
  original,
  readOnly,
  onChange,
}: {
  lines: FinancialLine[];
  original: FinancialLine[];
  readOnly?: boolean;
  onChange: (lines: FinancialLine[]) => void;
}) {
  const bureau = lines.filter((line) => line.origin === "bureau");
  const manual = lines.filter((line) => line.origin === "manual");
  const setManual = (next: FinancialLine[]) => onChange([...declaredLines(lines), ...bureau, ...next]);
  const updateManual = (index: number, patch: Partial<FinancialLine>) =>
    setManual(manual.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <>
      <FinancialLines
        title="Declared on the application"
        color="danger"
        sources={OBLIGATION_SOURCES}
        lines={declaredLines(lines)}
        original={declaredLines(original)}
        readOnly={readOnly}
        onChange={(declared) => onChange([...declared, ...facilityLines(lines)])}
      />

      <Group gap={8} mt="lg" mb={4}>
        <MicroLabel c="slate.5">From credit bureau</MicroLabel>
        <Badge size="xs" radius="xl" color="slate" variant="light">
          View only
        </Badge>
      </Group>
      <Box style={tableBox}>
        <Table fz={12.5}>
          <Table.Thead bg="slate.0">
            <Table.Tr>
              <Table.Th>Institution</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Outstanding</Table.Th>
              <Table.Th>Monthly Payment</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bureau.length ? (
              bureau.map((line, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{line.institution}</Table.Td>
                  <Table.Td>{line.source}</Table.Td>
                  <Table.Td>{zmw(line.outstanding ?? null)}</Table.Td>
                  <Table.Td>{zmw(line.monthly_amount)}</Table.Td>
                  <Table.Td>
                    <Text fz={11.5} fw={600} c={line.status === "Active" ? "green.7" : "red.6"}>
                      {line.status}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text fz={12.5} c="slate.5" ta="center" py="sm">
                    Bureau data is unavailable for this customer.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <Group justify="space-between" align="center" mt="lg" mb={4} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <MicroLabel c="slate.5">Additional liabilities</MicroLabel>
          <Text fz={11} c="slate.5" mt={2}>
            Facilities the bureau can't see — added on top of the figures above.
          </Text>
        </Box>
        {!readOnly && (
          <Button
            size="compact-sm"
            radius="md"
            variant="light"
            style={{ flexShrink: 0 }}
            leftSection={<IconPlus size={13} />}
            onClick={() =>
              setManual([...manual, { origin: "manual", institution: "", source: "Personal Loan", outstanding: 0, monthly_amount: 0, status: "Active" }])
            }
          >
            Add liability
          </Button>
        )}
      </Group>
      <Box style={tableBox}>
        <Table fz={12.5}>
          <Table.Thead bg="slate.0">
            <Table.Tr>
              <Table.Th>Institution</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Outstanding</Table.Th>
              <Table.Th>Monthly Payment</Table.Th>
              {!readOnly && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {manual.length ? (
              manual.map((line, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <TextInput size="xs" value={line.institution ?? ""} placeholder="Institution" disabled={readOnly}
                      onChange={(e) => updateManual(index, { institution: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" value={line.source} placeholder="Type" disabled={readOnly} error={!line.source.trim()}
                      onChange={(e) => updateManual(index, { source: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" hideControls min={0} thousandSeparator="," value={line.outstanding ?? ""} placeholder="0" disabled={readOnly}
                      onChange={(value) => updateManual(index, { outstanding: Number(value) || 0 })} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" hideControls min={0} thousandSeparator="," value={line.monthly_amount} placeholder="0" disabled={readOnly}
                      onChange={(value) => updateManual(index, { monthly_amount: Number(value) || 0 })} />
                  </Table.Td>
                  {!readOnly && (
                    <Table.Td>
                      <ActionIcon size="sm" color="red" variant="subtle" onClick={() => setManual(manual.filter((_, i) => i !== index))}>
                        <IconX size={14} />
                      </ActionIcon>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={readOnly ? 4 : 5}>
                  <Text fz={12.5} c="slate.5" ta="center" py="sm">
                    No additional liabilities added.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </>
  );
}
