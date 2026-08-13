import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TextInput,
  FileInput,
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
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconUpload,
  IconX,
} from "@tabler/icons-react";

// Add this interface
export interface DocumentRow {
  id: string;
  name: string;
  file?: File | null | string;
}

interface DocumentsTabProps {
  documents: DocumentRow[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof DocumentRow, value: any) => void;
  onRemove: (id: string) => void;
}
const ROWS_PER_PAGE = 5;

export function DocumentsTab({
  documents,
  onAdd,
  onUpdate,
  onRemove,
}: DocumentsTabProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(ROWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return documents.slice(start, start + ROWS_PER_PAGE);
  }, [documents, page]);

  const handleAdd = () => {
    onAdd();
    const nextTotalPages = Math.max(
      1,
      Math.ceil((documents.length + 1) / ROWS_PER_PAGE)
    );
    setPage(nextTotalPages);
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Table.ScrollContainer minWidth={650}>
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-16">No.</Table.Th>
              <Table.Th>Document Name</Table.Th>
              <Table.Th>Upload Document</Table.Th>
              <Table.Th className="w-24" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {documents.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <IconFileText
                      size={22}
                      style={{ color: "var(--mantine-color-slate-3)" }}
                    />
                    <Text size="xs" c="slate.4">
                      No documents added yet. Click &ldquo;+ Add document&rdquo;
                      to create one.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedDocs.map((doc, index) => (
                <Table.Tr key={doc.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">
                      {(page - 1) * ROWS_PER_PAGE + index + 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="sm"
                      value={doc.name || ""}
                      onChange={(e) =>
                        onUpdate(doc.id, "name", e.currentTarget.value)
                      }
                      placeholder="e.g. Sanction Letter"
                    />
                  </Table.Td>
                  {/* <Table.Td>
                    <FileInput
                      size="sm"
                      placeholder="Choose file"
                      leftSection={<IconUpload size={14} />}
                      // You can map this to 'file' or 'file_url' based on your DocumentRow interface
                      onChange={(filePayload) =>
                        onUpdate(doc.id, "file", filePayload)
                      }
                    />
                  </Table.Td> */}
                  <Table.Td>
                    {typeof doc.file === "string" && doc.file !== "" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          component="a"
                          href={doc.file}
                          target="_blank"
                          variant="light"
                          size="xs"
                          color="brand"
                          leftSection={<IconFileText size={14} />}
                        >
                          View Uploaded File
                        </Button>
                        <ActionIcon 
                          variant="subtle" 
                          color="danger" 
                          size="sm" 
                          onClick={() => onUpdate(doc.id, "file", null)}
                          title="Remove and upload new file"
                        >
                          <IconX size={16} stroke={1.5} />
                        </ActionIcon>
                      </div>
                    ) : (
                      <FileInput
                        size="sm"
                        value={(doc.file as File) || null}
                        placeholder="Choose file"
                        leftSection={<IconUpload size={14} />}
                        onChange={(filePayload) =>
                          onUpdate(doc.id, "file", filePayload)
                        }
                      />
                    )}
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
                        onClick={() => onRemove(doc.id)}
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
        style={{
          borderTop: "1px solid var(--mantine-color-slate-2)",
          background: "var(--mantine-color-white)",
        }}
      >
        <Button
          variant="subtle"
          color="brand"
          size="xs"
          leftSection={<IconPlus size={16} stroke={2.5} />}
          onClick={handleAdd}
        >
          Add document
        </Button>

        {documents.length > ROWS_PER_PAGE && (
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