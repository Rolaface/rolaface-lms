import { useEffect, useMemo, useState } from "react";
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
import { IconText } from "../../Customer/CustomerTableCells";
import { DocumentSetupApi } from "../../../api/LosConfiguration/DocumentSetupApi";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { documentSetupModal } from "../../../components/Modal/documentSetupModalStore";


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

/** One row of the table (a product that already has documents) */
interface SetupRow extends ProductOption {
  documentCount: number;
  requiredCount: number;
  updatedAt: string;
}

type ModalState =
  | { mode: "add"; products: ProductOption[] }
  | { mode: "edit"; product: ProductOption; docs: DocumentConfig[] }
  | null;

interface DocumentSetupProps {
  /** Called with `null` docs when a product's documents are removed */
  onSave?: (productId: string, docs: DocumentConfig[] | null) => void | Promise<void>;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const nextId = () => Math.random().toString(36).slice(2, 10);
const doc = (name: string, required = true): DocumentConfig => ({ id: nextId(), name, required });
const productLabel = (p: ProductOption) => p.name;


const mapSetupRow = (r: any): SetupRow => ({
  id: r.loan_product ?? r.name ?? r.id,
  name: r.loan_product_name ?? r.product_name ?? r.loan_product ?? r.name,
  code: r.product_code ?? r.code ?? r.loan_product ?? r.name,
  documentCount: Number(r.document_count ?? r.documents_count ?? r.total_documents ?? 0),
  requiredCount: Number(r.required_count ?? r.required_documents ?? r.required_document_count ?? 0),
  updatedAt: r.modified ? dayjs(r.modified).format("DD MMM YYYY") : "-",
});

const mapProductOption = (r: any): ProductOption => ({
  id: r.name ?? r.id ?? r.loan_product,
  name: r.product_name ?? r.loan_product_name ?? r.name,
  code: r.product_code ?? r.code ?? r.name,
});

const mapDocs = (detail: any): DocumentConfig[] =>
  (detail?.documents ?? []).map((d: any) => doc(d.document_name, Number(d.is_required) === 1));

const errorMessage = (e: any) =>
  e?.response?.data?.exception ?? e?.response?.data?.message ?? e?.message ?? "Something went wrong.";


const showSuccess = (heading: string, body: string = "") => {
  openCommonModal({
    heading,
    subtitle: "",
    body,
    color: "green",
    buttons: [{ label: "Close", color: "green" }],
  });
};

const showError = (heading: string, error: any) => {
  openCommonModal({
    heading,
    subtitle: "We couldn't complete your request.",
    body: parseFrappeError(error),
    color: "red",
    buttons: [{ label: "Close", color: "red" }],
  });
};

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DocumentSetup({ onSave, readOnly = false }: DocumentSetupProps) {
  const theme = useMantineTheme();

  const [rows, setRows] = useState<SetupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // add/edit pre-fetch in progress

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  

  // ---- load list (GET get_document_setups) ----
  const loadList = async () => {
    setLoading(true);
    try {
      const res = await DocumentSetupApi.getAll(1, 1000);
      setRows(DocumentSetupApi.unwrapList(res).map(mapSetupRow));
    } catch (e) {
      console.error(e);
      showError("Something went wrong", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // ---- filter + client-side pagination ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => `${p.name} ${p.code ?? ""}`.toLowerCase().includes(q));
  }, [rows, search]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, safePage * pageSize);

  // ---- Add: GET get_products_without_documents ----
  const openAdd = async () => {
    setBusy(true);
    try {
      const res = await DocumentSetupApi.getProductsWithoutDocuments();
      const products = DocumentSetupApi.unwrapList(res).map(mapProductOption);
      if (products.length === 0) {
        openCommonModal({
          heading: "All products are set up",
          body: "Every product already has documents. Edit one from the table.",
          color: "blue",
          buttons: [{ label: "Close" }],
        });
        return;
      }
      documentSetupModal.open({ mode: "add", products, onSuccess: async (productId, docs) => { await onSave?.(productId, docs); showSuccess("Documents Saved", "Documents have been saved successfully."); await loadList(); } });
    } catch (e) {
      console.error(e);
      showError("Something went wrong", e);
    } finally {
      setBusy(false);
    }
  };

  // ---- Edit: GET get_document_setup_by_id ----
  const openEdit = async (p: SetupRow) => {
    setBusy(true);
    try {
      const res = await DocumentSetupApi.getById(p.id);
      const detail = DocumentSetupApi.unwrap(res);
      documentSetupModal.open({ mode: "edit", product: p, docs: mapDocs(detail), onSuccess: async (productId, docs) => { await onSave?.(productId, docs); showSuccess("Documents Saved", "Documents have been saved successfully."); await loadList(); } });
    } catch (e) {
      console.error(e);
      showError("Something went wrong", e);
    } finally {
      setBusy(false);
    }
  };

  // ---- Save: POST create_document_setup / PUT update_document_setup ----
  

  // ---- Delete: DELETE delete_document_setup ----
  const confirmRemove = (p: SetupRow) =>
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
            try {
              await DocumentSetupApi.remove(p.id);
              await onSave?.(p.id, null);
              showSuccess("Documents Removed", "Documents have been removed successfully.");
              await loadList();
            } catch (e) {
              console.error(e);
              showError("Something went wrong", e);
            }
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
                loading={busy}
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
            {pageRows.length === 0 ? (
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
                      {loading
                        ? "Loading..."
                        : rows.length === 0
                          ? "No products have documents yet. Add documents for a product to get started."
                          : "No products match your search."}
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              pageRows.map((p) => {
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
                    onDoubleClick={readOnly ? undefined : () => openEdit(p)}
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
                        {p.documentCount} document{p.documentCount === 1 ? "" : "s"}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <Text fz="xs" c="slate.6">
                        {p.requiredCount} of {p.documentCount}
                      </Text>
                    </Table.Td>
                    <Table.Td style={cell()}>
                      <IconText icon={<IconCalendar size={13} />}>{p.updatedAt}</IconText>
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
                                openEdit(p);
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
                                confirmRemove(p);
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

      
    </Stack>
  );
}



