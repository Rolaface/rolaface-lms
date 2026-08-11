import { useEffect, useMemo, useState } from "react";
import { TextInput, Table, ActionIcon, Tooltip, Loader, Select, Group, Button, Text } from "@mantine/core";
import { IconPercentage, IconPencil, IconTrash, IconPlus, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { getAllItems } from "../../../api/productApi";
import { PlainCard } from "./PlainCard";
import { theme, cellInputClasses } from "./Constants";
import { useQuery } from "@tanstack/react-query";

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

const ROWS_PER_PAGE = 5;

export function ChargesTab({
  charges, isViewMode,
  handleUpdateCharge, handleAddCharge, handleRemoveChargeAt, setAccountsModalIndex,
}: ChargesTabProps) {

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(charges.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCharges = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return charges
      .map((charge, globalIndex) => ({ charge, globalIndex }))
      .slice(start, start + ROWS_PER_PAGE);
  }, [charges, page]);

  const handleAdd = () => {
    handleAddCharge();
    const nextTotalPages = Math.max(1, Math.ceil((charges.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

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
              paginatedCharges.map(({ charge, globalIndex }) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td></Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      searchable
                      placeholder="Charge Type"
                      data={itemOptions}
                      value={charge.type}
                      onChange={(v) => handleUpdateCharge(globalIndex, "type", v || "")}
                      rightSection={isFetchingItems ? <Loader size={12} className="text-slate-400" /> : null}
                      classNames={{ input: cellInputClasses.input }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <div className="relative flex items-center bg-slate-100 rounded-full p-0.5 h-8 w-full select-none">
                      <div className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-200 ease-out shadow-sm" style={{ width: "calc(50% - 2px)", left: charge.basedOn === "Percentage" ? "2px" : "50%", backgroundColor: theme.brand[6] }} />
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(globalIndex, "basedOn", "Percentage")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Percentage" ? "text-white" : "text-slate-500"}`}>
                        <IconPercentage size={12} />Percentage
                      </button>
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(globalIndex, "basedOn", "Flat Amount")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Flat Amount" ? "text-white" : "text-slate-500"}`}>
                        Flat
                      </button>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Percentage" value={charge.percentage} disabled={charge.basedOn === "Flat Amount"} onChange={(e) => handleUpdateCharge(globalIndex, "percentage", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Amount" value={charge.amount} disabled={charge.basedOn === "Percentage"} onChange={(e) => handleUpdateCharge(globalIndex, "amount", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1">
                      <Tooltip label="Modify Map Account" position="top" withArrow>
                        <ActionIcon type="button" color="brand" variant="subtle" onClick={() => setAccountsModalIndex(globalIndex)} aria-label="Edit charge accounts">
                          <IconPencil size={15} />
                        </ActionIcon>
                      </Tooltip>
                      {!isViewMode && (
                        <Tooltip label="Delete" position="top" withArrow>
                          <ActionIcon type="button" color="danger" variant="subtle" onClick={() => handleRemoveChargeAt(globalIndex)} aria-label="Delete charge">
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      <Group justify="space-between" className="px-1">
        {!isViewMode && (
          <Button
            variant="subtle"
            color="brand"
            size="xs"
            leftSection={<IconPlus size={14} stroke={2.5} />}
            onClick={handleAdd}
          >
            Add charge
          </Button>
        )}

        {charges.length > ROWS_PER_PAGE && (
          <Group gap="xs">
            <Text size="xs" c="slate.5">
              Page {page} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              size="sm"
              radius="md"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft size={14} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              size="sm"
              radius="md"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <IconChevronRight size={14} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </PlainCard>
  );
}