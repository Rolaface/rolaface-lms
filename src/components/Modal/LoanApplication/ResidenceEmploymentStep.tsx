import { useMemo, useState } from "react";
import { SimpleGrid, TextInput, Box, Group, Text, Button, Stack, ActionIcon, Checkbox, Table, Paper } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { cleanPhone, nextId, type ApplicantType, type LoanApplicationValues } from "./form";
import { AddressFields } from "./AddressFields";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  applicantType: ApplicantType;
  directorsError?: string | null;
  readOnly?: boolean;
}

const ROWS_PER_PAGE = 6;

export function AddressPanels({ form, currentRequired, readOnly }: {
  form: UseFormReturnType<LoanApplicationValues>;
  currentRequired: boolean;
  readOnly: boolean;
}) {
  const same = form.values.permanent_same_as_current;
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ gridColumn: "1 / -1" }}>
      <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
        <Text fw={600} mb="md">
          Residential Address
        </Text>
        <AddressFields form={form} path="current_address" required={currentRequired} readOnly={readOnly} />
      </Box>

      <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
        <Group justify="space-between" mb="md">
          <Text fw={600}>Permanent Address</Text>
          <Checkbox
            label="Same as residential"
            size="sm"
            checked={same}
            disabled={readOnly}
            onChange={(e) => {
              form.setFieldValue("permanent_same_as_current", e.currentTarget.checked);
              form.clearFieldError("permanent_address.address_line1");
              form.clearFieldError("permanent_address.city");
              form.clearFieldError("permanent_address.country");
            }}
          />
        </Group>
        <AddressFields form={form} path={same ? "current_address" : "permanent_address"} readOnly={readOnly || same} />
      </Box>
    </SimpleGrid>
  );
}

export function ResidenceEmploymentStep({ form, applicantType, directorsError, readOnly = false }: StepProps) {
  const directors = form.values.directors;
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(directors.length / ROWS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);


  const paginatedDirectors = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return directors.map((dir, idx) => ({ dir, idx })).slice(start, start + ROWS_PER_PAGE);
  }, [directors, page]);

  if (applicantType === "Individual") {
    return (
      <Stack gap="sm">
        <AddressPanels form={form} currentRequired readOnly={readOnly} />
      </Stack>
    );
  }

  const handleAddDirector = () => {
    form.insertListItem("directors", { id: nextId(), full_name: "", phone: "", email: "", nrc: "" });
    setPage(Math.max(1, Math.ceil((directors.length + 1) / ROWS_PER_PAGE)));
  };

  return (
    <Stack gap="sm">
      <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
        <Group justify="space-between" align="flex-start" p="md" pb="xs">
          <Box>
            <Group gap="xs" align="center">
              <Text fz="lg" fw={700} c="dark.9" style={{ letterSpacing: "-0.5px" }}>
                Active Directors
              </Text>
              <Box
                px={10}
                py={2}
                bg="slate.1"
                c="slate.7"
                fw={600}
                style={{ borderRadius: "var(--mantine-radius-xl)", fontSize: "12px" }}
              >
                {directors.length} Recorded
              </Box>
            </Group>
            <Text fz="sm" c="slate.5" mt={4}>
              Add directors. Each director requires a name, phone, email, and NRC.
            </Text>
            {directorsError && (
              <Text fz="xs" c="red.6" mt={4}>
                {directorsError}
              </Text>
            )}
          </Box>
        </Group>

        <Table.ScrollContainer minWidth={780}>
          <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="w-16">No.</Table.Th>
                <Table.Th>Director Name</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>NRC</Table.Th>
                {!readOnly && <Table.Th className="w-24" />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {directors.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={readOnly ? 5 : 6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <IconUsers size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                      <Text size="xs" c="slate.4">
                        No directors added yet. Click &ldquo;+ Add Director&rdquo; to create one.
                      </Text>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedDirectors.map(({ dir, idx }, rowIndex) => (
                  <Table.Tr key={dir.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} c="slate.6">
                        {(page - 1) * ROWS_PER_PAGE + rowIndex + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        maxLength={140}
                        size="sm"
                        placeholder="e.g. John Doe"
                        {...form.getInputProps(`directors.${idx}.full_name`)}
                        readOnly={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        maxLength={140}
                        size="sm"
                        type="tel"
                        placeholder="e.g. 0971234567"
                        value={dir.phone}
                        onChange={(e) =>
                          form.setFieldValue(`directors.${idx}.phone`, cleanPhone(e.currentTarget.value))
                        }
                        error={form.errors[`directors.${idx}.phone`]}
                        readOnly={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        maxLength={140}
                        size="sm"
                        type="email"
                        placeholder="e.g. jane.doe@example.com"
                        {...form.getInputProps(`directors.${idx}.email`)}
                        readOnly={readOnly}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        maxLength={140}
                        size="sm"
                        placeholder="e.g. 123456/78/1"
                        {...form.getInputProps(`directors.${idx}.nrc`)}
                        readOnly={readOnly}
                      />
                    </Table.Td>
                    {!readOnly && (
                      <Table.Td>
                        <div className="flex items-center gap-1 justify-end">
                          <ActionIcon
                            variant="subtle"
                            color="danger"
                            size="sm"
                            onClick={() => form.removeListItem("directors", idx)}
                            aria-label="Delete director"
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
              onClick={handleAddDirector}
            >
              Add Director
            </Button>

            {directors.length > ROWS_PER_PAGE && (
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
    </Stack>
  );
}
