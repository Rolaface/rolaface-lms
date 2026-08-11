import { Table, Skeleton } from "@mantine/core";
import type { OffsetOrderComponent } from "../../../api/productApi";

interface DemandTypeTableProps {
  components: OffsetOrderComponent[];
  isLoading?: boolean;
}

export const DemandTypeTable = ({ components, isLoading }: DemandTypeTableProps) => {
  const sorted = [...components].sort((a, b) => a.idx - b.idx);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
        <Table.Thead className="bg-slate-50">
          <Table.Tr>
            <Table.Th className="w-6">S.No</Table.Th>
            <Table.Th>Demand Type</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Table.Tr key={i}>
                <Table.Td><Skeleton height={12} width={14} /></Table.Td>
                <Table.Td><Skeleton height={12} width="60%" /></Table.Td>
              </Table.Tr>
            ))
          ) : (
            sorted.map((c) => (
              <Table.Tr key={c.idx} className="hover:bg-slate-50/60">
                <Table.Td className="text-xs text-slate-500">{c.idx}</Table.Td>
                <Table.Td className="text-xs text-slate-700 font-medium">{c.demand_type}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
};