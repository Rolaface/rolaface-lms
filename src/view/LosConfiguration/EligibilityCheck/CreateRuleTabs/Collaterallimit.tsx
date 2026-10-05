import {
  Box,
  Title,
  Text,
  Table,
  Select,
  ActionIcon,
  Group,
  Button,
} from "@mantine/core";
import { IconTrash, IconPlus, IconInfoCircle } from "@tabler/icons-react";
import { InfoCard, COLLATERAL_TYPES, type CollateralItem } from "./Ruleshared";

interface CollateralLimitProps {
  collateralItems: CollateralItem[];
  updateCollateralItem: (id: string, patch: Partial<CollateralItem>) => void;
  addCollateralItem: () => void;
  removeCollateralItem: (id: string) => void;
}

export function CollateralLimit({
  collateralItems,
  updateCollateralItem,
  addCollateralItem,
  removeCollateralItem,
}: CollateralLimitProps) {
  return (
    <Box>
      <Box
        py={6}
        px={8}
        style={{
          borderBottom: "1px solid var(--mantine-color-slate-2)",
          background: "transparent",
        }}
      >
        <Title order={6} c="slate.8" fw={600} mb={1}>
          Collateral Limit
        </Title>
        <Text fz={10} c="slate.5">
          Add every collateral item this rule accepts. Market value, haircut and
          max LTV convert to a live limit.
        </Text>
      </Box>
      <Box mb="xs">
        <Table verticalSpacing={4} fz={11} style={{ tableLayout: "fixed" }}>
          <Table.Thead style={{ background: "transparent" }}>
            <Table.Tr>
              {[
                ["Type", 150],
                ["Haircut %", 150],
                ["Loan to Value %", 150],
                ["", 36],
              ].map(([h, w]) => (
                <Table.Th
                  key={h}
                  style={{
                    borderColor: "transparent",
                    width: w,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--mantine-color-slate-5)",
                    textTransform: "none",
                    paddingLeft: h === "Type" ? 8 : undefined,
                  }}
                >
                  {h}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collateralItems.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td
                  style={{
                    borderColor: "var(--mantine-color-slate-1)",
                    paddingLeft: 8,
                  }}
                >
                  <Select
                    radius="md"
                    size="xs"
                    value={item.type}
                    onChange={(v) =>
                      v && updateCollateralItem(item.id, { type: v })
                    }
                    data={COLLATERAL_TYPES}
                    styles={{ input: { minHeight: 26, height: 26 } }}
                  />
                </Table.Td>
                <Table.Td
                  style={{
                    borderColor: "var(--mantine-color-slate-1)",
                  }}
                >
                  <Text fz={11} fw={500}>
                    {item.haircutPct}%
                  </Text>
                </Table.Td>
                <Table.Td
                  style={{
                    borderColor: "var(--mantine-color-slate-1)",
                  }}
                >
                  <Text fz={11} fw={500}>
                    {item.maxLtvPct}%
                  </Text>
                </Table.Td>
                <Table.Td
                  style={{
                    borderColor: "var(--mantine-color-slate-1)",
                    paddingRight: 8,
                  }}
                >
                  <ActionIcon
                    variant="subtle"
                    color="slate.4"
                    size="sm"
                    onClick={() => removeCollateralItem(item.id)}
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {collateralItems.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
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
        <Button
          variant="subtle"
          color="slate"
          size="xs"
          leftSection={<IconPlus size={11} />}
          onClick={addCollateralItem}
        >
          Add Collateral
        </Button>
      </Group>
      <InfoCard color="brand" mt="sm">
        <Group gap={6}>
          <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" />
          <Text fz={12} fw={500} c="brand.8">
            Collateral Limit = sum of each included item's Market Value x (1 -
            Haircut %) x Loan to Value %.
          </Text>
        </Group>
      </InfoCard>
    </Box>
  );
}