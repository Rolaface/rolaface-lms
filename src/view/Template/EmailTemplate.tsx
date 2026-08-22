import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Group,
  Paper,
  Table,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Menu,
  Select,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconMail,
  IconSelector,
  IconSearch,
  IconFileText,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { usePermission } from "../../hooks/Usepermission";
import { emailTemplateModal } from "../../components/Modal/EmailTemplate/emailTemplateModalStore";
import type { EmailTemplateForm } from "../../components/Modal/EmailTemplate/EmailTemplateModal";

// ─────────────────────────────────────────────
// Local row type
// (id is a client-side key only — no backend yet)
// ─────────────────────────────────────────────

interface EmailTemplateRow extends EmailTemplateForm {
  id: string;
}

const columnHelper = createColumnHelper<EmailTemplateRow>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const ET_MODULE = "Email Template";

export function EmailTemplate() {
  const theme = useMantineTheme();

  const { can } = usePermission();
  const canCreateTemplate = can(ET_MODULE, "create");
  const canWriteTemplate = can(ET_MODULE, "write");
  const canDeleteTemplate = can(ET_MODULE, "delete");
  const canReadTemplate = can(ET_MODULE, "read");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Local in-memory list (no backend for now) ──
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    showSuccess("Email Template Deleted", `Email Template "${id}" deleted successfully.`);
  };

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Email Template",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => removeTemplate(id),
        },
      ],
    });
  };

  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);

  // ── Client-side search + pagination over the local list ──

  const filteredTemplates = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term),
    );
  }, [templates, debouncedSearch]);

  const totalRows = filteredTemplates.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const data = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, page, pageSize]);

  // ── Modal handlers ──

  const handleAddClick = () => {
    emailTemplateModal.open({
      onSaved: (form) => {
        const id = form.name || `template-${Date.now()}`;
        setTemplates((prev) => [...prev, { ...form, id }]);
        showSuccess("Email Template Created", "Email template created successfully.");
      },
    });
  };

  const handleView = (row: EmailTemplateRow) => {
    emailTemplateModal.open({
      initialData: { name: row.name, subject: row.subject, message: row.message },
      isView: true,
    });
  };

  const handleEdit = (row: EmailTemplateRow) => {
    emailTemplateModal.open({
      initialData: { name: row.name, subject: row.subject, message: row.message },
      onSaved: (form) => {
        setTemplates((prev) =>
          prev.map((t) => (t.id === row.id ? { ...t, ...form } : t)),
        );
        showSuccess("Email Template Updated", "Email template updated successfully.");
      },
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("subject", {
        header: "Subject",
        cell: (info) => (
          <Text fz="xs" c="slate.6" truncate="end" maw={320}>
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const rowData = info.row.original;

          return (
            <Group
              justify="flex-end"
              gap={4}
              wrap="nowrap"
              className="et-row-actions"
            >
              {canReadTemplate && (
                <Tooltip label="View" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    onClick={() => handleView(rowData)}
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              {canWriteTemplate && (
                <Tooltip label="Edit" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="brand"
                    radius="md"
                    onClick={() => handleEdit(rowData)}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              {canDeleteTemplate && (
                <Menu shadow="md" width={140} position="bottom-end" radius="md">
                  <Menu.Target>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="slate"
                      radius="md"
                    >
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      color="danger"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => confirmDelete(rowData.id)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          );
        },
      }),
    ],
    [canReadTemplate, canWriteTemplate, canDeleteTemplate],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const resetFilters = () => {
    setSearchInput("");
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .et-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .et-row-actions { opacity: 1; }
        .et-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .et-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .et-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .et-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .et-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMail size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Email Template
            </Title>
            <Text fz="sm" c="slate.5">
              Manage Email Templates
            </Text>
          </Stack>
        </Group>
      </Group>

      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs" wrap="nowrap" align="center">
          <TextInput
            className="et-search"
            size="sm"
            radius="xl"
            placeholder="Search by name or subject"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.currentTarget.value);
              setPage(1);
            }}
          />

          <Button
            size="sm"
            radius="xl"
            variant="default"
            px="sm"
            style={{ flexShrink: 0 }}
            onClick={resetFilters}
          >
            Reset
          </Button>

          {canCreateTemplate && (
            <Button
              size="sm"
              radius="xl"
              color="brand"
              px="sm"
              style={{
                flexShrink: 0,
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
              onClick={handleAddClick}
              leftSection={<IconPlus size={14} />}
            >
              Add Email Template
            </Button>
          )}
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Box
          style={{
            height: "clamp(320px, calc(100vh - 280px), 720px)",
            overflowY: "auto",
          }}
        >
          <Table
            verticalSpacing="sm"
            horizontalSpacing="sm"
            fz="xs"
            w="100%"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
          >
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <Table.Th
                        key={header.id}
                        className="et-thead-cell"
                        c="slate.5"
                        fw={700}
                        style={{
                          fontSize: "var(--mantine-font-size-xs)",
                          padding: "0 10px 6px",
                          userSelect: "none",
                          cursor: canSort ? "pointer" : "default",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          border: "none",
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <Group
                          gap="xs"
                          wrap="nowrap"
                          justify={
                            header.id === "actions" ? "flex-end" : "flex-start"
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && (
                            <SortIcon sorted={header.column.getIsSorted()} />
                          )}
                        </Group>
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ border: "none" }}>
                    <Stack align="center" gap="xs" py="xl">
                      <Box
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: "var(--mantine-color-white)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <IconFileText size={24} color="var(--mantine-color-slate-4)" />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">
                        No email templates match your search.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr
                    key={row.id}
                    className="et-row"
                    onDoubleClick={() => handleView(row.original)}
                    style={{ cursor: "pointer" }}
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: "10px 10px",
                          border: "none",
                          boxShadow: "var(--mantine-shadow-xs)",
                          borderLeft:
                            idx === 0
                              ? `3px solid var(--mantine-color-brand-4)`
                              : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
            <span>
              {totalRows === 0
                ? "Showing 0 of 0"
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) => {
                  setPageSize(Number(v) || 10);
                  setPage(1);
                }}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={page}
            onChange={(p) => setPage(p)}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows === 0}
          />
        </Group>
      </Paper>
    </Stack>
  );
}

export default EmailTemplate;