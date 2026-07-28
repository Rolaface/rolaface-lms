import {
  Text,
  Table,
  Checkbox,
  Select,
  NumberInput,
  TextInput,
  ActionIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconInfoCircle, IconPencil, IconTrash, IconPlus } from "@tabler/icons-react";
import { FEE_TYPES } from "./Constants";

export interface ChargeRow {
  id: string;
  feeType: string;
  amount: number | "";
  appliedOn: string;
}

interface ChargesTabProps {
  charges: ChargeRow[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof ChargeRow, value: string | number) => void;
  onRemove: (id: string) => void;
}

export function ChargesTab({ charges, onAdd, onUpdate, onRemove }: ChargesTabProps) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-md">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-indigo-700 rounded-full" />
          <Text size="lg" fw={700} className="text-slate-900">
            Loan Charges
          </Text>
          <Tooltip label="Fees and charges applied to this loan product." withArrow>
            <IconInfoCircle size={14} className="text-slate-400 ml-1 cursor-help" />
          </Tooltip>
        </div>
        <Text size="sm" className="text-slate-500">
          Fees and charges applied to this loan product.
        </Text>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
            <Table.Thead className="bg-slate-50/50">
              <Table.Tr>
                <Table.Th className="w-12">
                  <Checkbox size="sm" />
                </Table.Th>
                <Table.Th className="w-16 font-semibold text-slate-800">No.</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Fee Type</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Amount</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Applied On</Table.Th>
                <Table.Th className="w-24" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {charges.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center py-8 text-slate-400">
                    No charges added yet. Click "+ Add charge" to create one.
                  </Table.Td>
                </Table.Tr>
              ) : (
                charges.map((c, index) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Checkbox size="sm" />
                    </Table.Td>
                    <Table.Td className="text-slate-600 font-medium">{index + 1}</Table.Td>
                    <Table.Td>
                      <Select
                        size="sm"
                        data={FEE_TYPES}
                        value={c.feeType}
                        onChange={(val) => onUpdate(c.id, "feeType", val || "")}
                        placeholder="Select type"
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="sm"
                        value={c.amount}
                        onChange={(val) => onUpdate(c.id, "amount", val as number)}
                        placeholder="0.00"
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        type="date"
                        value={c.appliedOn}
                        onChange={(e) => onUpdate(c.id, "appliedOn", e.currentTarget.value)}
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1 justify-end">
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onRemove(c.id)}>
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <div className="border-t border-slate-200 p-3 bg-white">
          <UnstyledButton
            className="flex items-center gap-2 text-[#4F46E5] font-semibold text-sm hover:text-indigo-800 transition-colors px-2 py-1 rounded"
            onClick={onAdd}
          >
            <IconPlus size={16} stroke={2.5} />
            Add charge
          </UnstyledButton>
        </div>
      </div>
    </div>
  );
}