import { TextInput, Table, ActionIcon, Tooltip, Checkbox, Loader, Select } from "@mantine/core";
import { IconPercentage, IconPencil, IconTrash, IconPlus } from "@tabler/icons-react";
import { getAllItems } from "../../../api/productApi";
import { PlainCard } from "./PlainCard";
import { theme, cellInputClasses } from "./Constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface ChargeRow {
  id: number;
  type: string;
  basedOn: "Percentage" | "Flat Amount";
  amount: string;
  percentage: string;
  incomeAccount: string;
  receivableAccount: string;
  waiverAccount: string;
  writeOffAccount: string;
  suspenseAccount: string;
}

interface ChargesTabProps {
  charges: ChargeRow[];
  isViewMode?: boolean;
  handleUpdateCharge: (index: number, field: keyof ChargeRow, value: string) => void;
  handleAddCharge: () => void;
  handleRemoveChargeAt: (index: number) => void;
  setAccountsModalIndex: (index: number) => void;
}

export function ChargesTab({
  charges, isViewMode,
  handleUpdateCharge, handleAddCharge, handleRemoveChargeAt, setAccountsModalIndex,
}: ChargesTabProps) {
  
  // Fetch and format items for the dropdown
  const { data: itemsResponse, isFetching: isFetchingItems } = useQuery({
    queryKey: ["allItems"],
    queryFn: getAllItems,
  });

  const itemOptions = useMemo(() => {
    const items = itemsResponse?.data;
    if (!Array.isArray(items)) return [];
    return items
      .map((i: any) => (typeof i === "string" ? i : i?.name ?? i?.value))
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }, [itemsResponse]);

  return (
    <PlainCard>
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
        <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="w-6"></Table.Th>
              <Table.Th className="w-52">Charge Type</Table.Th>
              <Table.Th className="w-36">Charge Based On</Table.Th>
              <Table.Th className="w-24">Percentage</Table.Th>
              <Table.Th className="w-24">Amount</Table.Th>
              <Table.Th className="w-14"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No rows yet — add a charge to get started
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td></Table.Td>
                  <Table.Td>
<Select 
  size="xs" 
  searchable 
  placeholder="Charge Type" 
  data={itemOptions}
  value={charge.type} 
  onChange={(v) => handleUpdateCharge(index, "type", v || "")} 
  rightSection={isFetchingItems ? <Loader size={12} className="text-slate-400" /> : null}
  classNames={{ input: cellInputClasses.input }} 
/>                  </Table.Td>
                  <Table.Td>
                    <div className="relative flex items-center bg-slate-100 rounded-full p-0.5 h-8 w-full select-none">
                      <div className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-200 ease-out shadow-sm" style={{ width: "calc(50% - 2px)", left: charge.basedOn === "Percentage" ? "2px" : "50%", backgroundColor: theme.brand[6] }} />
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(index, "basedOn", "Percentage")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Percentage" ? "text-white" : "text-slate-500"}`}>
                        <IconPercentage size={12} />Percentage
                      </button>
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(index, "basedOn", "Flat Amount")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Flat Amount" ? "text-white" : "text-slate-500"}`}>
                        Flat
                      </button>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Percentage" value={charge.percentage} disabled={charge.basedOn === "Flat Amount"} onChange={(e) => handleUpdateCharge(index, "percentage", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Amount" value={charge.amount} disabled={charge.basedOn === "Percentage"} onChange={(e) => handleUpdateCharge(index, "amount", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1">
                      <Tooltip label="Modify Map Account" position="top" withArrow>
                        <ActionIcon type="button" color="brand" variant="subtle" onClick={() => setAccountsModalIndex(index)} aria-label="Edit charge accounts">
                          <IconPencil size={15} />
                        </ActionIcon>
                      </Tooltip>
                      {!isViewMode && (
                        <Tooltip label="Delete" position="top" withArrow>
                          <ActionIcon type="button" color="danger" variant="subtle" onClick={() => handleRemoveChargeAt(index)} aria-label="Delete charge">
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
            {!isViewMode && (
              <Table.Tr className="cursor-pointer hover:bg-slate-50/60" onClick={handleAddCharge}>
                <Table.Td colSpan={6} className="py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.brand[6] }}>
                    <IconPlus size={14} />Add charge
                  </div>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </PlainCard>
  );
}