import { useEffect, useMemo, useState } from "react";
import {
  TextInput,
  Select,
  Table,
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
  IconBriefcase,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";

// Define the shape of your collateral entry. Merge this into your global form values type.
export interface CollateralEntry {
  id: string;
  type: string;
  description: string;
  value: string;
  ownership: string;
}

interface CollateralStepProps {
  form: UseFormReturnType<any>; // Replace 'any' with your actual FormValues type
  collateralsError?: string | null;
  readOnly?: boolean;
}

const COLLATERAL_TYPES = ["Property", "Vehicle", "Gold", "Deposit"];
const OWNERSHIP_TYPES = ["Applicant", "Co-Applicant", "Third Party"];

const nextId = () => Math.random().toString(36).slice(2, 10);

const ROWS_PER_PAGE = 6;

export function Collateral({ form, collateralsError, readOnly = false }: CollateralStepProps) {
  const collaterals: CollateralEntry[] = form.values.collaterals || [];
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(collaterals.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCollaterals = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return collaterals
      .map((collateral, idx) => ({ collateral, idx }))
      .slice(start, start + ROWS_PER_PAGE);
  }, [collaterals, page]);

  const handleAddCollateral = () => {
    form.insertListItem("collaterals", {
      id: nextId(),
      type: "",
      description: "",
      value: "",
      ownership: "",
    });
    const nextTotalPages = Math.max(1, Math.ceil((collaterals.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

  const handleDeleteCollateral = (index: number) => {
    form.removeListItem("collaterals", index);
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Table.ScrollContainer minWidth={780}>
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-16">No.</Table.Th>
              <Table.Th>Collateral Type</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Collateral Value</Table.Th>
              <Table.Th>Ownership</Table.Th>
              {!readOnly && <Table.Th className="w-24" />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collaterals.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={readOnly ? 5 : 6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <IconBriefcase size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                    <Text size="xs" c="slate.4">
                      No collateral added yet. Click &ldquo;+ Add Collateral&rdquo; to create one.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedCollaterals.map(({ collateral, idx }, rowIndex) => (
                <Table.Tr key={collateral.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">
                      {(page - 1) * ROWS_PER_PAGE + rowIndex + 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="sm"
                      placeholder="Select type"
                      data={COLLATERAL_TYPES}
                      disabled={readOnly}
                      {...form.getInputProps(`collaterals.${idx}.type`)}
                      onBlur={() => form.validateField(`collaterals.${idx}.type`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="sm"
                      placeholder="e.g. 2018 Toyota Hilux"
                      readOnly={readOnly}
                      {...form.getInputProps(`collaterals.${idx}.description`)}
                      onBlur={() => form.validateField(`collaterals.${idx}.description`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="sm"
                      placeholder="e.g. 150000"
                      readOnly={readOnly}
                      {...form.getInputProps(`collaterals.${idx}.value`)}
                      onBlur={() => form.validateField(`collaterals.${idx}.value`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="sm"
                      placeholder="Select ownership"
                      data={OWNERSHIP_TYPES}
                      disabled={readOnly}
                      {...form.getInputProps(`collaterals.${idx}.ownership`)}
                      onBlur={() => form.validateField(`collaterals.${idx}.ownership`)}
                    />
                  </Table.Td>
                  {!readOnly && (
                    <Table.Td>
                      <div className="flex items-center gap-1 justify-end">
                        <ActionIcon
                          variant="subtle"
                          color="danger"
                          size="sm"
                          onClick={() => handleDeleteCollateral(idx)}
                          aria-label="Delete collateral"
                        >
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </div>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {collateralsError && (
        <Text fz="xs" c="red.6" px="md" pt="xs">
          {collateralsError}
        </Text>
      )}

      {!readOnly && (
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
            onClick={handleAddCollateral}
          >
            Add Collateral
          </Button>

          {collaterals.length > ROWS_PER_PAGE && (
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
      )}
    </Paper>
  );
}