
import { Text, Table, Checkbox, NumberInput } from "@mantine/core";

import { formatCurrency, type ChargeRow } from "./RestructureTypes";

interface RestructureChargesTabProps {
  charges: ChargeRow[];
  totalCharges: number;
  onToggleCharge: (id: string, checked: boolean) => void;
  onUpdateChargeAmount: (id: string, amount: number | "") => void;
}

export function RestructureChargesTab({
  charges,
  totalCharges,
  onToggleCharge,
  onUpdateChargeAmount,
}: RestructureChargesTabProps) {
  return (
    <div>
      <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm">
        <Table.Thead>
          <Table.Tr className="border-b border-gray-200">
            <Table.Th style={{ width: 36 }} />
            <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
              CHARGE TYPE
            </Table.Th>
            <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
              DESCRIPTION
            </Table.Th>
            <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
              AMOUNT ($)
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {charges.map((c) => (
            <Table.Tr key={c.id} className="border-b border-gray-100 last:border-0">
              <Table.Td>
                <Checkbox
                  size="sm"
                  color="brand"
                  checked={c.checked}
                  onChange={(e) => onToggleCharge(c.id, e.currentTarget.checked)}
                />
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={600} className="text-gray-900">
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
                  value={c.amount}
                  onChange={(v) => onUpdateChargeAmount(c.id, v as number | "")}
                  disabled={!c.checked}
                  thousandSeparator=","
                  decimalScale={2}
                  className="w-32 ml-auto"
                  styles={{ input: { textAlign: "right" } }}
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
          {formatCurrency(totalCharges)}
        </Text>
      </div>
    </div>
  );
}