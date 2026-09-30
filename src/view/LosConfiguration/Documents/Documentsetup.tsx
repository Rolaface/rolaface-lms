import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconChevronDown,
  IconFiles,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";

import { openCommonModal } from "../../../components/Modal/AlertModal";
import { showSuccess } from "../../../utils/alert";
import { IconText } from "../../Customer/CustomerTableCells";

export interface DocumentConfig {
  id: string;
  name: string;
  required: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  code?: string;
}

export interface ProductDocumentEntry {
  docs: DocumentConfig[];
  updatedAt: string;
}

/** Default documents for every configured product, keyed by product id */
export type DocumentSetupConfig = Record<string, ProductDocumentEntry>;

interface DocumentSetupProps {
  products?: ProductOption[];
  initialConfig?: DocumentSetupConfig;
  /** Called with `null` docs when a product's documents are removed */
  onSave?: (productId: string, docs: DocumentConfig[] | null) => void | Promise<void>;
  readOnly?: boolean;
}

const nextId = () => Math.random().toString(36).slice(2, 10);
const doc = (name: string, required = true): DocumentConfig => ({ id: nextId(), name, required });
const today = () => dayjs().format("DD MMM YYYY");

const DUMMY_PRODUCTS: ProductOption[] = [
  { id: "EDU-01", name: "Study Loan", code: "EDU-01" },
  { id: "HL-PUR", name: "Home Purchase Loan", code: "HL-PUR" },
  { id: "AL-NEW", name: "New Vehicle Loan", code: "AL-NEW" },
  { id: "AL-USED", name: "Used Vehicle Loan", code: "AL-USED" },
  { id: "PL-STF", name: "Staff Loan", code: "PL-STF" },
];

const DUMMY_CONFIG: DocumentSetupConfig = {
  "HL-PUR": {
    updatedAt: "12 Sep 2026",
    docs: [
      doc("NRC copy"),
      doc("Last 3 payslips"),
      doc("Offer letter / title deed"),
      doc("Bank statement (6 months)"),
      doc("Proof of residence", false),
    ],
  },
  "PL-STF": {
    updatedAt: "28 Aug 2026",
    docs: [doc("NRC copy"), doc("Last 3 payslips"), doc("Bank statement (3 months)", false)],
  },
};

const productLabel = (p: ProductOption) => (p.code ? `${p.name} (${p.code})` : p.name);

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const headStyle = {
  fontSize: "var(--mantine-font-size-xs)",
  padding: "0 10px 6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  border: "none",
};

// ---------------------------------------------------------------------------
// Add / edit modal
// ---------------------------------------------------------------------------

function DocumentsModal({
  opened,
  productOptions,
  editingId,
  initialDocs,
  onClose,
  onSubmit,
}: {
  opened: boolean;
  productOptions: ProductOption[];
  /** Product being edited, or null when adding documents for a new product */
  editingId: string | null;
  initialDocs: DocumentConfig[];
  onClose: () => void;
  onSubmit: (productId: string, docs: DocumentConfig[]) => Promise<void>;
}) {
  const [productId, setProductId] = useState<string | null>(editingId ?? productOptions[0]?.id ?? null);
  const [docs, setDocs] = useState<DocumentConfig[]>(initialDocs);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (fn: (list: DocumentConfig[]) => DocumentConfig[]) => {
    setDocs(fn);
    setError(null);
  };

  const addDoc = () => {
    const name = newName.trim();
    if (!name) return;
    if (docs.some((d) => d.name.trim().toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in the list.`);
      return;
    }
    update((l) => [...l, doc(name)]);
    setNewName("");
  };

  const move = (index: number, dir: -1 | 1) =>
    update((l) => {
      const next = [...l];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });

  const submit = async () => {
    if (!productId) {
      setError("Choose a loan product.");
      return;
    }
    if (docs.length === 0) {
      setError("Add at least one document before saving.");
      return;
    }
    const names = docs.map((d) => d.name.trim().toLowerCase());
    if (names.some((n) => !n)) {
      setError("Every document needs a name.");
      return;
    }
    if (new Set(names).size !== names.length) {
      setError("The list has a duplicate document.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(productId, docs.map((d) => ({ ...d, name: d.name.trim() })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={680}
      radius="lg"
      centered
      title={
        <Stack gap={2}>
          <Text fz={17} fw={700} c="slate.9">
            {editingId ? "Edit product documents" : "Add product documents"}
          </Text>
          <Text fz={12.5} c="slate.5">
            Choose a product, then list the documents applicants must provide.
          </Text>
        </Stack>
      }
    >
      <Stack gap="md">
        <Select
          label="Loan product"
          radius="md"
          searchable
          allowDeselect={false}
          disabled={!!editingId}
          data={productOptions.map((p) => ({ value: p.id, label: productLabel(p) }))}
          value={productId}
          onChange={setProductId}
          nothingFoundMessage="No products found"
        />

        <Box>
          <Group gap={6} mb={8}>
            <Text fz={14} fw={600} c="slate.8">
              Documents
            </Text>
            {docs.length > 0 && (
              <Text fz={13} c="slate.5">
                ({docs.length})
              </Text>
            )}
          </Group>

          <Paper withBorder radius="md" style={{ overflow: "hidden", borderColor: "var(--mantine-color-slate-2)" }}>
            <Table verticalSpacing={6} horizontalSpacing="sm" style={{ tableLayout: "fixed" }}>
              <Table.Thead bg="slate.0">
                <Table.Tr>
                  <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px", width: 48 }}>
                    No.
                  </Table.Th>
                  <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px" }}>
                    Document name
                  </Table.Th>
                  <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px", width: 130 }}>
                    Required
                  </Table.Th>
                  <Table.Th style={{ ...headStyle, width: 100 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {docs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text fz={12.5} c="slate.4" ta="center" py="md">
                        No documents yet. Add the first one below.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  docs.map((d, i) => (
                    <Table.Tr key={d.id}>
                      <Table.Td>
                        <Text fz={12.5} c="slate.5">
                          {i + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          size="xs"
                          radius="md"
                          value={d.name}
                          aria-label={`Document ${i + 1} name`}
                          onChange={(e) => {
                            const name = e.currentTarget.value;
                            update((l) => l.map((x) => (x.id === d.id ? { ...x, name } : x)));
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap={8} wrap="nowrap">
                          <Switch
                            size="sm"
                            checked={d.required}
                            aria-label={`${d.name} required`}
                            onChange={(e) => {
                              const required = e.currentTarget.checked;
                              update((l) => l.map((x) => (x.id === d.id ? { ...x, required } : x)));
                            }}
                          />
                          <Text fz={12} fw={600} c={d.required ? "orange.7" : "slate.5"}>
                            {d.required ? "Required" : "Optional"}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={2} justify="flex-end" wrap="nowrap">
                          <ActionIcon variant="subtle" color="slate" size="sm" radius="md" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                            <IconArrowUp size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="slate" size="sm" radius="md" disabled={i === docs.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                            <IconArrowDown size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="danger" size="sm" radius="md" onClick={() => update((l) => l.filter((x) => x.id !== d.id))} aria-label={`Delete ${d.name}`}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>

            <Group gap={8} wrap="nowrap" p={10} bg="slate.0" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
              <TextInput
                size="xs"
                radius="md"
                style={{ flex: 1 }}
                placeholder="New document, e.g. NRC copy"
                aria-label="New document name"
                value={newName}
                onChange={(e) => setNewName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addDoc();
                }}
              />
              <Button size="xs" radius="md" variant="default" leftSection={<IconPlus size={14} />} onClick={addDoc}>
                Add
              </Button>
            </Group>
          </Paper>

          <Text fz={12} c="danger.6" mt={6} style={{ minHeight: 18 }}>
            {error ?? ""}
          </Text>
        </Box>
      </Stack>

      <Group justify="space-between" mt="xs" pt="md" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
        <Button variant="default" radius="md" onClick={onClose}>
          Cancel
        </Button>
        <Button color="brand" radius="md" loading={saving} onClick={submit}>
          Save documents
        </Button>
      </Group>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DocumentSetup({
  products = DUMMY_PRODUCTS,
  initialConfig = DUMMY_CONFIG,
  onSave,
  readOnly = false,
}: DocumentSetupProps) {
  const theme = useMantineTheme();
  const [config, setConfig] = useState<DocumentSetupConfig>(initialConfig);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // undefined = closed, null = adding, string = editing that product
  const [editing, setEditing] = useState<string | null | undefined>(undefined);

  const configured = useMemo(() => products.filter((p) => config[p.id]), [products, config]);
  const unconfigured = useMemo(() => products.filter((p) => !config[p.id]), [products, config]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return configured.filter((p) => `${p.name} ${p.code ?? ""}`.toLowerCase().includes(q));
  }, [configured, search]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, safePage * pageSize);

  const openAdd = () => {
    if (unconfigured.length === 0) {
      openCommonModal({
        heading: "All products are set up",
        body: "Every product already has documents. Edit one from the table.",
        color: "blue",
        buttons: [{ label: "Close" }],
      });
      return;
    }
    setEditing(null);
  };

  const save = async (productId: string, docs: DocumentConfig[]) => {
    await onSave?.(productId, docs);
    setConfig((prev) => ({ ...prev, [productId]: { docs, updatedAt: today() } }));
    setEditing(undefined);
    showSuccess("Documents saved");
  };

  const remove = (p: ProductOption) =>
    openCommonModal({
      heading: "Remove documents",
      body: `Remove all documents for ${p.name}? Applicants for this product will no longer be asked for any documents.`,
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Remove",
          color: "red",
          onClick: async () => {
            await onSave?.(p.id, null);
            setConfig((prev) => {
              const next = { ...prev };
              delete next[p.id];
              return next;
            });
            showSuccess("Documents removed");
          },
        },
      ],
    });

  const columnCount = readOnly ? 5 : 6;

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
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
            <IconFiles size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Document Setup
            </Title>
            <Text fz="sm" c="slate.5">
              Set which documents applicants must provide for each loan product
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
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Product Name / Code"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              px="md"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              Reset
            </Button>
            {!readOnly && (
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={openAdd}
                leftSection={<IconPlus size={14} />}
                style={{
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }}
              >
                Add Product Documents
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
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
            <Table.Tr>
              {["Loan Product", "Code", "Documents", "Required", "Last Updated"].map((h) => (
                <Table.Th key={h} c="slate.5" fw={700} style={headStyle}>
                  {h}
                </Table.Th>
              ))}
              {!readOnly && (
                <Table.Th c="slate.5" fw={700} ta="right" style={headStyle}>
                  Actions
                </Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columnCount} style={{ border: "none" }}>
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
                      <IconFiles size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      {configured.length === 0
                        ? "No products have documents yet. Add documents for a product to get started."
                        : "No products match your search."}
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((p) => {
                const entry = config[p.id];
                const required = entry.docs.filter((d) => d.required).length;
                const cell = (first = false) => ({
                  padding: "10px 10px",
                  border: "none",
                  boxShadow: "var(--mantine-shadow-xs)",
                  borderLeft: first ? "3px solid var(--mantine-color-brand-4)" : undefined,
                });
                return (
                  <Table.Tr
                    key={p.id}
                    className="lms-row"
                    onDoubleClick={readOnly ? undefined : () => setEditing(p.id)}
                    style={{ cursor: readOnly ? "default" : "pointer" }}
                  >
                    <Table.Td style={cell(true)}>
                      <Text fz="sm" fw={700} c="slate.8">
                        {p.name}
                      </Text>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <IconText icon={<IconTag size={13} />} mono>
                        {p.code}
                      </IconText>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <Badge radius="xl" variant="light" color="brand" tt="none" fw={600}>
                        {entry.docs.length} document{entry.docs.length === 1 ? "" : "s"}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <Text fz="xs" c="slate.6">
                        {required} of {entry.docs.length}
                      </Text>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <IconText icon={<IconCalendar size={13} />}>{entry.updatedAt}</IconText>
                    </Table.Td>
                    {!readOnly && (
                      <Table.Td style={cell()}>
                        <Group justify="flex-end" gap={4} wrap="nowrap">
                          <Tooltip label="Edit" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="brand"
                              radius="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(p.id);
                              }}
                            >
                              <IconPencil size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete" withArrow>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="danger"
                              radius="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(p);
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
            <span>{totalRows === 0 ? "Showing 0 of 0" : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) => {
                  setPageSize(Number(v) || 10);
                  setPage(1);
                }}
                allowDeselect={false}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={safePage}
            onChange={setPage}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows === 0}
          />
        </Group>
      </Paper>

      {editing !== undefined && (
        <DocumentsModal
          key={editing ?? "new"}
          opened
          editingId={editing}
          productOptions={editing ? products.filter((p) => p.id === editing) : unconfigured}
          initialDocs={editing ? config[editing].docs.map((d) => ({ ...d })) : []}
          onClose={() => setEditing(undefined)}
          onSubmit={save}
        />
      )}
    </Stack>
  );
}
