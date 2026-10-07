import { useMemo, useState } from "react";
import { TextInput, Select, NumberInput, ActionIcon, Paper, Text, Button, Group, Box, SimpleGrid } from "@mantine/core";
import { IconTrash, IconPlus, IconBriefcase, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { nextId, type LoanApplicationValues } from "./form";
import { useCollateralTypeOptions } from "./lookups";

interface CollateralStepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

const ROWS_PER_PAGE = 6;

export function Collateral({ form, readOnly = false }: CollateralStepProps) {
  const collaterals = form.values.collaterals;
  const { options: collateralTypeOptions, isLoading } = useCollateralTypeOptions();
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(collaterals.length / ROWS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);


  const paginatedCollaterals = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return collaterals.map((collateral, idx) => ({ collateral, idx })).slice(start, start + ROWS_PER_PAGE);
  }, [collaterals, page]);

  const handleAddCollateral = () => {
    form.insertListItem("collaterals", {
      id: nextId(),
      collateral_type: null,
      estimated_value: "",
      ownership_date: "",
      description: "",
    });
    setPage(Math.max(1, Math.ceil((collaterals.length + 1) / ROWS_PER_PAGE)));
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Box style={{ overflowX: "auto" }}>
        <Box miw={780}>
          <div className="flex items-center px-4 py-2.5" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
            <div className="flex-1">
              <Text size="sm" fw={700}>
                Add Collaterals
              </Text>
            </div>
            {!readOnly && <div className="w-24 shrink-0" />}
          </div>

          {collaterals.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex flex-col items-center gap-2">
                <IconBriefcase size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                <Text size="xs" c="slate.4">
                  No collateral added yet. Click &ldquo;+ Add Collateral&rdquo; to create one.
                </Text>
              </div>
            </div>
          ) : (
            paginatedCollaterals.map(({ collateral, idx }, rowIndex) => (
              <div
                key={collateral.id}
                className="flex items-start px-4 py-3"
                style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
              >
                <div className="w-16 shrink-0 pt-7">
                  <Text size="sm" fw={500} c="slate.6">
                    {(page - 1) * ROWS_PER_PAGE + rowIndex + 1}
                  </Text>
                </div>

                <SimpleGrid cols={3} spacing="md" verticalSpacing="xs" className="flex-1">
                  <Select
                    size="sm"
                    label="Collateral Type"
                    placeholder={isLoading ? "Loading..." : "Select type"}
                    data={collateralTypeOptions}
                    searchable
                    disabled={readOnly}
                    {...form.getInputProps(`collaterals.${idx}.collateral_type`)}
                  />
                  <NumberInput
                    size="sm"
                    label="Estimated Collateral Value"
                    placeholder="e.g. 150,000"
                    min={0}
                    allowNegative={false}
                    hideControls
                    thousandSeparator=","
                    readOnly={readOnly}
                    {...form.getInputProps(`collaterals.${idx}.estimated_value`)}
                  />
                  <DateInput
                    size="sm"
                    radius="md"
                    label="Ownership Date if Applicable"
                    valueFormat="DD-MMM-YYYY"
                    placeholder="DD-MMM-YYYY"
                    maxDate={new Date()}
                    clearable
                    value={collateral.ownership_date || null}
                    onChange={(date) =>
                      form.setFieldValue(
                        `collaterals.${idx}.ownership_date`,
                        date ? new Date(date).toISOString().slice(0, 10) : "",
                      )
                    }
                    readOnly={readOnly}
                  />
                  <TextInput
                    size="sm"
                    label="Description"
                    placeholder="e.g. 2018 Toyota Hilux"
                    readOnly={readOnly}
                    style={{ gridColumn: "1 / -1" }}
                    {...form.getInputProps(`collaterals.${idx}.description`)}
                  />
                </SimpleGrid>

                {!readOnly && (
                  <div className="w-24 shrink-0 flex items-center gap-1 justify-end pt-7">
                    <ActionIcon
                      variant="subtle"
                      color="danger"
                      size="sm"
                      onClick={() => form.removeListItem("collaterals", idx)}
                      aria-label="Delete collateral"
                    >
                      <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                  </div>
                )}
              </div>
            ))
          )}
        </Box>
      </Box>

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
                onClick={() => setPage(page - 1)}
              >
                <IconChevronLeft size={14} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="sm"
                radius="md"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
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
