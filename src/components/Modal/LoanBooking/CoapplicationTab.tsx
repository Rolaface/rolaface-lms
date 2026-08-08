import { useEffect, useMemo, useState } from "react";
import { TextInput, Table, ActionIcon, Paper, Text, Button, Group } from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

export interface CoApplicant {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

interface CoApplicantTabProps {
  search: string;
  onSearchChange: (v: string) => void;
  coApplicants: CoApplicant[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Omit<CoApplicant, "id">, value: string) => void;
  onRemove: (id: string) => void;
}

const ROWS_PER_PAGE = 6;

export function CoApplicantTab({
  search,
  onSearchChange,
  coApplicants,
  onAdd,
  onUpdate,
  onRemove,
}: CoApplicantTabProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(coApplicants.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCoApplicants = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return coApplicants.slice(start, start + ROWS_PER_PAGE);
  }, [coApplicants, page]);


  const handleAdd = () => {
    onAdd();
    const nextTotalPages = Math.max(1, Math.ceil((coApplicants.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

  return (
    <Paper withBorder radius="lg" shadow="md" p="lg">
      <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={650}>
          <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="w-16">No.</Table.Th>
                <Table.Th>Applicant Name</Table.Th>
                <Table.Th>Applicant Email</Table.Th>
                <Table.Th>Applicant Mobile</Table.Th>
                <Table.Th className="w-24" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {coApplicants.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <IconUsers size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                      <Text size="xs" c="slate.4">
                        No co-applicants added yet. Click &ldquo;+ Add co-applicant&rdquo; to create one.
                      </Text>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedCoApplicants.map((c, index) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} c="slate.6">
                        {(page - 1) * ROWS_PER_PAGE + index + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.name}
                        onChange={(e) => onUpdate(c.id, "name", e.currentTarget.value)}
                        placeholder="Enter name"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.email}
                        onChange={(e) => onUpdate(c.id, "email", e.currentTarget.value)}
                        placeholder="Enter email"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.mobile}
                        onChange={(e) => onUpdate(c.id, "mobile", e.currentTarget.value)}
                        placeholder="Enter mobile"
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
            Add co-applicant
          </Button>

          {coApplicants.length > ROWS_PER_PAGE && (
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
    </Paper>
  );
}