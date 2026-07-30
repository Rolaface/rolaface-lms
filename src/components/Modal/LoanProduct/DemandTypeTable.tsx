import { Table } from "@mantine/core";
import { demandTypeSequence } from "./Constants";

export const DemandTypeTable = () => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
      <Table.Thead className="bg-slate-50">
        <Table.Tr>
          <Table.Th className="w-6"></Table.Th>
          <Table.Th className="w-6">No.</Table.Th>
          <Table.Th>Demand Type</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {demandTypeSequence.map((demand, idx) => (
          <Table.Tr key={demand} className="hover:bg-slate-50/60">
            <Table.Td></Table.Td>
            <Table.Td className="text-xs text-slate-500 font-medium">{idx + 1}</Table.Td>
            <Table.Td className="text-xs text-slate-700 font-medium">{demand}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </div>
);