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
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconReceipt2,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { FEE_TYPES } from "./Constants";

export interface ChargeRow {
  id: string;
  feeType: string;
  percentage: number | "";
  amount: number | "";
  appliedOn: string;
}

interface ChargesTabProps {
  charges: ChargeRow[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof ChargeRow, value: string | number) => void;
  onRemove: (id: string) => void;
}

const ROWS_PER_PAGE = 6;

export function ChargesTab({ charges, onAdd, onUpdate, onRemove }: ChargesTabProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(charges.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCharges = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return charges.slice(start, start + ROWS_PER_PAGE);
  }, [charges, page]);


  const handleAdd = () => {
    onAdd();
    const nextTotalPages = Math.max(1, Math.ceil((charges.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Table.ScrollContainer minWidth={650}>
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-16">No.</Table.Th>
              <Table.Th>Fee Type</Table.Th>
              <Table.Th>Percentage</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Applied On</Table.Th>
              <Table.Th className="w-24" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <IconReceipt2 size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                    <Text size="xs" c="slate.4">
                      No charges added yet. Click &ldquo;+ Add charge&rdquo; to create one.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedCharges.map((c, index) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">
                      {(page - 1) * ROWS_PER_PAGE + index + 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="sm"
                      data={FEE_TYPES}
                      value={c.feeType}
                      onChange={(val) => onUpdate(c.id, "feeType", val || "")}
                      placeholder="Select type"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      value={c.percentage}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdate(c.id, "percentage", val as number)}
                      placeholder="0.00"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      value={c.amount}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdate(c.id, "amount", val as number)}
                      placeholder="0.00"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="sm"
                      type="date"
                      value={c.appliedOn}
                      onChange={(e) => onUpdate(c.id, "appliedOn", e.currentTarget.value)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1 justify-end">
                      <ActionIcon variant="subtle" color="slate" size="sm">
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        onClick={() => onRemove(c.id)}
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
          Add charge
        </Button>

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
    </Paper>
  );
}