import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Select,
  NumberInput,
  TextInput,
  ActionIcon,
  Paper,
  Text,
  Button,
  Group,
  Box,
  SimpleGrid
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconBriefcase2
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getAllCollaterals } from "../../../api/collateralApi";

export interface CollateralItem {
  id: string;
  loan_security: string;
  qty: number | "";
  loan_security_price: number | "";
  amount: number | "";
}

export interface Collateral {
  status: string;
  reference_no: string;
  description: string;
  items: CollateralItem[];
}

interface CollateralTabProps {
  collateral: Collateral;
  onUpdate: (field: keyof Collateral, value: string) => void;
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof CollateralItem, value: string | number) => void;
  onRemoveItem: (id: string) => void;
}

const ROWS_PER_PAGE = 3;

export function CollateralTab({
  collateral,
  onUpdate,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: CollateralTabProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(collateral.items.length / ROWS_PER_PAGE));

  const { data: collateralsResponse, isLoading: isCollateralsLoading } = useQuery({
    queryKey: ["all-collaterals"],
    queryFn: getAllCollaterals,
  });

  const securityOptions = useMemo(() => {
    const items = collateralsResponse?.data || [];
    if (!Array.isArray(items)) return [];

    return items.map((sec: any) => ({
      value: String(sec.loan_security_code),
      label: `${sec.loan_security_code} - ${sec.loan_security_name}`,
      price: Number(sec.original_security_value) || 0,
    }));
  }, [collateralsResponse]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return collateral.items.slice(start, start + ROWS_PER_PAGE);
  }, [collateral.items, page]);

  const handleAdd = () => {
    onAddItem();
    const nextTotalPages = Math.max(1, Math.ceil((collateral.items.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      {/* Top 3 Fields Section */}
      <Box p="md" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {/* <Select
            label="Status"
            placeholder="Select status"
            data={["Pledged"]}
            disabled
            value={collateral.status}
            onChange={(val) => onUpdate("status", val || "")}
          /> */}
          <TextInput
            label="Reference No."
            placeholder="Enter reference no"
            value={collateral.reference_no}
            onChange={(e) => onUpdate("reference_no", e.currentTarget.value)}
          />
          <TextInput
            label="Description"
            placeholder="Enter description"
            value={collateral.description}
            onChange={(e) => onUpdate("description", e.currentTarget.value)}
          />
        </SimpleGrid>
      </Box>

      {/* Table Section */}
      <Table.ScrollContainer minWidth={650}>
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-16">No.</Table.Th>
              <Table.Th>Loan Security</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Price</Table.Th>
              {/* <Table.Th>Amount</Table.Th> */}
              <Table.Th className="w-24" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collateral.items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <IconBriefcase2 size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                    <Text size="xs" c="slate.4">
                      No collateral items added yet. Click &ldquo;+ Add item&rdquo; to create one.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedItems.map((item, index) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">
                      {(page - 1) * ROWS_PER_PAGE + index + 1}
                    </Text>
                  </Table.Td>
                 <Table.Td>
                    <Select
                      size="sm"
                      data={securityOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      value={item.loan_security}
                      searchable
                      clearable={!!item.loan_security}
                      disabled={isCollateralsLoading}
                      placeholder="Select security"
                      onChange={(val) => {
                        // Update the security code
                        onUpdateItem(item.id, "loan_security", val || "");
                        
                        // Find the selected option to auto-fill price and amount
                        const selectedSec = securityOptions.find((sec) => sec.value === val);
                        if (selectedSec) {
                          onUpdateItem(item.id, "loan_security_price", selectedSec.price);
                          onUpdateItem(item.id, "amount", selectedSec.price); 
                        }
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      value={item.qty}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdateItem(item.id, "qty", val as number)}
                      placeholder="0"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      value={item.loan_security_price}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdateItem(item.id, "loan_security_price", val as number)}
                      placeholder="0.00"
                    />
                  </Table.Td>
                  {/* <Table.Td>
                    <NumberInput
                      size="sm"
                      value={item.amount}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdateItem(item.id, "amount", val as number)}
                      placeholder="0.00"
                    />
                  </Table.Td> */}
                  <Table.Td>
                    <div className="flex items-center gap-1 justify-end">
                      <ActionIcon variant="subtle" color="slate" size="sm">
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                      >
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

      {/* Footer Section */}
      <Group
        justify="space-between"
        className="p-3"
        style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-white)" }}
      >
        <Button
          variant="subtle"
          color="brand"
          size="xs"
          leftSection={<IconPlus size={16} stroke={2.5} />}
          onClick={handleAdd}
        >
          Add item
        </Button>

        {collateral.items.length > ROWS_PER_PAGE && (
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
    </Paper>
  );
}