import { useMemo } from "react";
import { ActionIcon, Box, Button, Group, NumberInput, Select, Table, Text, Title, Tooltip } from "@mantine/core";
import { IconInfoCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getLoanSecurityTypeList } from "../../../../api/lookup api/lookUpApi";
import { InfoCard, type CollateralItem } from "./Ruleshared";

interface CollateralLimitProps {
  collateralItems: CollateralItem[];
  updateCollateralItem: (id: string, patch: Partial<CollateralItem>) => void;
  addCollateralItem: () => void;
  removeCollateralItem: (id: string) => void;
}

const FIELD = { input: { height: 30, minHeight: 30, fontSize: 12.5, borderRadius: 8 } };

const headStyle = {
  borderColor: "transparent",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--mantine-color-slate-5)",
  textTransform: "none" as const,
};

const percentInput = (value: number, onChange: (v: number) => void, label: string) => (
  <NumberInput
    aria-label={label}
    value={value}
    onChange={(v) => onChange(v === "" ? 0 : Number(v))}
    min={0}
    max={100}
    clampBehavior="strict"
    decimalScale={2}
    hideControls
    rightSection={
      <Text fz={11} c="slate.5">
        %
      </Text>
    }
    rightSectionWidth={26}
    styles={FIELD}
  />
);

export function CollateralLimit({
  collateralItems,
  updateCollateralItem,
  addCollateralItem,
  removeCollateralItem,
}: CollateralLimitProps) {
  const { data } = useQuery({
    queryKey: ["loan-security-types"],
    queryFn: () => getLoanSecurityTypeList({ page_size: 100 }),
  });
  const typeOptions = useMemo(
    () => ((data?.data ?? []) as { value: string; label: string }[]).map((t) => ({ value: t.value, label: t.label || t.value })),
    [data],
  );

  return (
    <Box>
      <Box py={6} px={8} style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
        <Title order={6} c="slate.8" fw={600} mb={1}>
          Collateral Limit
        </Title>
        <Text fz={10} c="slate.5">
          Add each collateral type this rule accepts, with its haircut and loan to value.
        </Text>
      </Box>
      <Box mb="xs">
        <Table verticalSpacing={6} fz={11} style={{ tableLayout: "fixed" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ ...headStyle, paddingLeft: 8 }}>Type</Table.Th>
              <Table.Th style={{ ...headStyle, width: 150 }}>Haircut</Table.Th>
              <Table.Th style={{ ...headStyle, width: 150 }}>Loan to value</Table.Th>
              <Table.Th style={{ ...headStyle, width: 40 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collateralItems.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)", paddingLeft: 8 }}>
                  <Select
                    aria-label="Collateral type"
                    placeholder="Select type"
                    value={item.type || null}
                    onChange={(v) => updateCollateralItem(item.id, { type: v ?? "" })}
                    data={
                      item.type && !typeOptions.some((t) => t.value === item.type)
                        ? [{ value: item.type, label: item.type }, ...typeOptions]
                        : typeOptions
                    }
                    searchable
                    allowDeselect={false}
                    styles={FIELD}
                  />
                </Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                  {percentInput(item.haircutPct, (v) => updateCollateralItem(item.id, { haircutPct: v }), "Haircut")}
                </Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)" }}>
                  {percentInput(item.maxLtvPct, (v) => updateCollateralItem(item.id, { maxLtvPct: v }), "Loan to value")}
                </Table.Td>
                <Table.Td style={{ borderColor: "var(--mantine-color-slate-1)", paddingRight: 8 }}>
                  <Tooltip label="Remove" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="slate"
                      size="sm"
                      onClick={() => removeCollateralItem(item.id)}
                      aria-label="Remove collateral"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
            {collateralItems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ borderColor: "transparent" }}>
                  <Text fz={11} c="slate.5" ta="center" py="xs">
                    No collateral configured — this rule evaluates as unsecured.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
      <Group justify="flex-start" align="center">
        <Button variant="subtle" color="slate" size="xs" leftSection={<IconPlus size={12} />} onClick={addCollateralItem}>
          Add collateral
        </Button>
      </Group>
      <Box mt="sm">
        <InfoCard color="brand">
          <Group gap={6} wrap="nowrap">
            <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" />
            <Text fz={12} fw={500} c="brand.8">
              Collateral limit = collateral market value × (1 − haircut %) × loan to value %.
            </Text>
          </Group>
        </InfoCard>
      </Box>
    </Box>
  );
}
