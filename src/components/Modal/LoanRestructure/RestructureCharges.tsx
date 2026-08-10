import { Checkbox, NumberInput, Table, Text } from "@mantine/core";

interface ChargeRow {
  id: string;
  label: string;
  description: string;
  amount: number;
  checked: boolean;
}

interface RestructureChargesProps {
  charges: ChargeRow[];
  totalCharges: number;
  toggleCharge: (id: string, checked: boolean) => void;
  updateChargeAmount: (id: string, amount: number | "") => void;
}

export function RestructureCharges({
  charges,
  totalCharges,
  toggleCharge,
  updateChargeAmount,
}: RestructureChargesProps) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm">
        <Table.Thead>
          <Table.Tr className="border-b border-gray-200">
            <Table.Th style={{ width: 36 }} />
            <Table.Th>CHARGE TYPE</Table.Th>
            <Table.Th>DESCRIPTION</Table.Th>
            <Table.Th className="text-right">AMOUNT ($)</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {charges.map((c) => (
            <Table.Tr key={c.id} className="border-b border-gray-100">
              <Table.Td>
                <Checkbox
                  size="sm"
                  color="brand"
                  checked={c.checked}
                  onChange={(e) =>
                    toggleCharge(c.id, e.currentTarget.checked)
                  }
                />
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={600}>
                  {c.label}
                </Text>
              </Table.Td>

              <Table.Td>
                <Text size="xs" c="dimmed">
                  {c.description}
                </Text>
              </Table.Td>

              <Table.Td>
                <NumberInput
                  size="xs"
                  hideControls
                  value={c.amount}
                  onChange={(v) =>
                    updateChargeAmount(c.id, v as number | "")
                  }
                  disabled={!c.checked}
                  thousandSeparator=","
                  decimalScale={2}
                  className="w-32 ml-auto"
                  styles={{
                    input: {
                      textAlign: "right",
                    },
                  }}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-gray-200">
        <Text size="sm" c="dimmed">
          Total Restructure Charges
        </Text>

        <Text size="lg" fw={700} className="text-[#4F46E5]">
          ${totalCharges.toLocaleString()}
        </Text>
      </div>
    </div>
  );
}