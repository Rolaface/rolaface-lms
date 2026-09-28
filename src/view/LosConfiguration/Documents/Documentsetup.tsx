import { useMemo, useReducer, useState } from "react";
import {
  Box,
  Group,
  Text,
  Badge,
  Paper,
  Stack,
  Button,
  Table,
  ThemeIcon,
  UnstyledButton,
  ActionIcon,
  TextInput,
  Modal,
  SegmentedControl,
  Switch,
} from "@mantine/core";
import {
  IconUser,
  IconBuilding,
  IconPlus,
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconDeviceFloppy,
  IconRefresh,
  IconX,
  IconAlertCircle,
  IconFileText,
  IconReceipt,
  IconBuildingBank,
  IconId,
  IconCamera,
  IconCertificate,
  IconFileDescription,
  IconSignature,
  IconFiles,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApplicantType = "Individual" | "Business";

/** "Director" holds the per-director documents that belong to Business applications */
export type DocSection = ApplicantType | "Director";

export type DocIconKey =
  | "file"
  | "receipt"
  | "bank"
  | "id"
  | "photo"
  | "certificate"
  | "form"
  | "signature";

export interface DocumentConfig {
  id: string;
  name: string;
  required: boolean;
  icon: DocIconKey;
}

export type DocumentSetupConfig = Record<DocSection, DocumentConfig[]>;

interface DocumentSetupProps {
  /** Configuration to start from. Defaults to an empty setup. */
  initialConfig?: DocumentSetupConfig;
  /** Called with the complete configuration when the user clicks Save. */
  onSave?: (config: DocumentSetupConfig) => void | Promise<void>;
  readOnly?: boolean;
}

const EMPTY_CONFIG: DocumentSetupConfig = { Individual: [], Business: [], Director: [] };

const DOC_ICONS: Record<DocIconKey, { label: string; icon: React.FC<any> }> = {
  file: { label: "Document", icon: IconFileText },
  receipt: { label: "Receipt / invoice", icon: IconReceipt },
  bank: { label: "Bank", icon: IconBuildingBank },
  id: { label: "ID card", icon: IconId },
  photo: { label: "Photo", icon: IconCamera },
  certificate: { label: "Certificate", icon: IconCertificate },
  form: { label: "Form", icon: IconFileDescription },
  signature: { label: "Resolution / signed", icon: IconSignature },
};

// Fixed rows per page — keeps the screen a constant height so it never scrolls
const ROWS = 6;
const ROW_HEIGHT = 46;
const MAX_PREVIEW = 8;

const nextId = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "reset"; config: DocumentSetupConfig }
  | { type: "add"; section: DocSection; doc: DocumentConfig }
  | { type: "update"; section: DocSection; id: string; changes: Partial<Omit<DocumentConfig, "id">> }
  | { type: "remove"; section: DocSection; id: string }
  | { type: "move"; section: DocSection; id: string; dir: -1 | 1 };

function reducer(state: DocumentSetupConfig, action: Action): DocumentSetupConfig {
  switch (action.type) {
    case "reset":
      return action.config;
    case "add":
      return { ...state, [action.section]: [...state[action.section], action.doc] };
    case "update":
      return {
        ...state,
        [action.section]: state[action.section].map((d) =>
          d.id === action.id ? { ...d, ...action.changes } : d,
        ),
      };
    case "remove":
      return { ...state, [action.section]: state[action.section].filter((d) => d.id !== action.id) };
    case "move": {
      const list = [...state[action.section]];
      const from = list.findIndex((d) => d.id === action.id);
      const to = from + action.dir;
      if (from < 0 || to < 0 || to >= list.length) return state;
      [list[from], list[to]] = [list[to], list[from]];
      return { ...state, [action.section]: list };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Paginated document table (fixed height: always ROWS rows)
// ---------------------------------------------------------------------------

function DocTable({
  items,
  onAdd,
  onUpdate,
  onMove,
  onEdit,
  onRemove,
  addPlaceholder,
  emptyText,
  readOnly,
}: {
  items: DocumentConfig[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, changes: Partial<Omit<DocumentConfig, "id">>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onEdit: (doc: DocumentConfig) => void;
  onRemove: (doc: DocumentConfig) => void;
  addPlaceholder: string;
  emptyText: string;
  readOnly?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [newValue, setNewValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / ROWS));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * ROWS, safePage * ROWS);
  const fillers = ROWS - pageItems.length;

  const handleAdd = () => {
    const name = newValue.trim();
    if (!name) {
      setMessage("Document name is required");
      return;
    }
    if (items.some((d) => d.name.trim().toLowerCase() === name.toLowerCase())) {
      setMessage("This document already exists");
      return;
    }
    onAdd(name);
    setNewValue("");
    setMessage(null);
    setPage(Math.max(1, Math.ceil((items.length + 1) / ROWS)));
  };

  return (
    <Paper
      withBorder
      radius="lg"
      bg="white"
      style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}
    >
      <Table verticalSpacing={0} horizontalSpacing="md" style={{ tableLayout: "fixed", width: "100%" }}>
        <Table.Thead bg="slate.0">
          <Table.Tr style={{ height: 38 }}>
            <Table.Th style={{ width: 56 }}>No.</Table.Th>
            <Table.Th>Document name</Table.Th>
            <Table.Th style={{ width: 130 }}>Required</Table.Th>
            <Table.Th style={{ width: readOnly ? 20 : 150 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pageItems.map((doc, i) => {
            const globalIndex = (safePage - 1) * ROWS + i;
            const Icon = DOC_ICONS[doc.icon]?.icon ?? IconFileText;
            return (
              <Table.Tr key={doc.id} style={{ height: ROW_HEIGHT }}>
                <Table.Td>
                  <Text fz={12.5} fw={500} c="slate.6">
                    {globalIndex + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={9} wrap="nowrap">
                    <ThemeIcon radius="md" size={26} variant="light" color="brand">
                      <Icon size={14} />
                    </ThemeIcon>
                    <Text fz={13} fw={600} c="slate.9" truncate>
                      {doc.name}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={8} wrap="nowrap">
                    <Switch
                      size="sm"
                      checked={doc.required}
                      disabled={readOnly}
                      onChange={(e) => onUpdate(doc.id, { required: e.currentTarget.checked })}
                      aria-label={`${doc.name} required`}
                    />
                    <Text fz={11.5} fw={600} c={doc.required ? "orange.7" : "slate.5"}>
                      {doc.required ? "Required" : "Optional"}
                    </Text>
                  </Group>
                </Table.Td>
                {!readOnly && (
                  <Table.Td>
                    <Group gap={2} justify="flex-end" wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        color="slate"
                        size="sm"
                        disabled={globalIndex === 0}
                        onClick={() => onMove(doc.id, -1)}
                        aria-label={`Move ${doc.name} up`}
                      >
                        <IconArrowUp size={15} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="slate"
                        size="sm"
                        disabled={globalIndex === items.length - 1}
                        onClick={() => onMove(doc.id, 1)}
                        aria-label={`Move ${doc.name} down`}
                      >
                        <IconArrowDown size={15} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="slate"
                        size="sm"
                        onClick={() => onEdit(doc)}
                        aria-label={`Edit ${doc.name}`}
                      >
                        <IconPencil size={15} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        onClick={() => onRemove(doc)}
                        aria-label={`Delete ${doc.name}`}
                      >
                        <IconTrash size={15} stroke={1.5} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                )}
                {readOnly && <Table.Td />}
              </Table.Tr>
            );
          })}

          {/* Filler rows keep the table exactly ROWS tall on every page */}
          {Array.from({ length: fillers }).map((_, i) => (
            <Table.Tr key={`filler-${i}`} style={{ height: ROW_HEIGHT }}>
              <Table.Td colSpan={4}>
                {items.length === 0 && i === 0 ? (
                  <Text fz={12} c="slate.4" ta="center">
                    {emptyText}
                  </Text>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Footer: add + message + pagination */}
      <Box style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "white" }} px={12} py={8}>
        <Group gap={8} wrap="nowrap" justify="space-between">
          {!readOnly ? (
            <Group gap={6} wrap="nowrap" style={{ flex: 1, maxWidth: 440 }}>
              <TextInput
                size="xs"
                radius="md"
                style={{ flex: 1 }}
                placeholder={addPlaceholder}
                value={newValue}
                error={!!message}
                onChange={(e) => {
                  setNewValue(e.currentTarget.value);
                  setMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
              <Button
                size="xs"
                variant="light"
                color="brand"
                leftSection={<IconPlus size={14} stroke={2.5} />}
                onClick={handleAdd}
              >
                Add
              </Button>
            </Group>
          ) : (
            <Box />
          )}

          {items.length > ROWS && (
            <Group gap="xs" wrap="nowrap">
              <Text fz={11.5} c="slate.5">
                Page {safePage} of {totalPages}
              </Text>
              <ActionIcon
                variant="default"
                size="sm"
                radius="md"
                disabled={safePage === 1}
                onClick={() => setPage(Math.max(1, safePage - 1))}
              >
                <IconChevronLeft size={14} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="sm"
                radius="md"
                disabled={safePage === totalPages}
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              >
                <IconChevronRight size={14} />
              </ActionIcon>
            </Group>
          )}
        </Group>
        <Text fz={11} c="red.6" mt={4} style={{ height: 14 }}>
          {message ?? ""}
        </Text>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Preview — mirrors the "Required documents" sidebar of the application
// ---------------------------------------------------------------------------

function DocPreview({
  applicant,
  docs,
  directorDocs,
}: {
  applicant: ApplicantType;
  docs: DocumentConfig[];
  directorDocs: DocumentConfig[];
}) {
  const shown = docs.slice(0, MAX_PREVIEW);
  const extra = docs.length - shown.length;

  return (
    <Paper
      withBorder
      radius="lg"
      p={14}
      bg="white"
      style={{ border: "1px solid var(--mantine-color-slate-2)" }}
    >
      <Text fz={13.5} fw={700} c="slate.9">
        Applicant view
      </Text>
      <Text fz={11.5} c="slate.5" mb={12}>
        How the {applicant.toLowerCase()} application lists its documents
      </Text>

      <Box
        p={10}
        style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)" }}
      >
        <Text fz={10.5} fw={700} c="slate.5" mb={8} style={{ letterSpacing: "0.06em" }}>
          REQUIRED DOCUMENTS
        </Text>
        {docs.length === 0 ? (
          <Text fz={12} c="slate.4" py={6}>
            No documents configured
          </Text>
        ) : (
          <Stack gap={2}>
            {shown.map((d, i) => {
              const Icon = DOC_ICONS[d.icon]?.icon ?? IconFileText;
              const first = i === 0;
              return (
                <Group
                  key={d.id}
                  gap={8}
                  wrap="nowrap"
                  px={8}
                  py={6}
                  style={{
                    border: `1px solid ${first ? "var(--mantine-color-brand-3)" : "transparent"}`,
                    background: first ? "var(--mantine-color-brand-0)" : "transparent",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                >
                  <Icon size={14} color={first ? "var(--mantine-color-brand-7)" : "var(--mantine-color-slate-5)"} />
                  <Text fz={12} fw={first ? 700 : 600} c={first ? "brand.8" : "slate.8"} truncate style={{ flex: 1 }}>
                    {d.name}
                  </Text>
                  {d.required && <IconAlertCircle size={14} color="var(--mantine-color-orange-5)" />}
                </Group>
              );
            })}
            {extra > 0 && (
              <Text fz={11} c="slate.5" px={8} pt={4}>
                +{extra} more
              </Text>
            )}
          </Stack>
        )}
      </Box>

      {applicant === "Business" && (
        <Box mt={12}>
          <Text fz={12.5} fw={700} c="slate.9">
            Director documents
          </Text>
          {directorDocs.length === 0 ? (
            <Text fz={11.5} c="slate.4" mt={2}>
              None configured
            </Text>
          ) : (
            <Stack gap={2} mt={4}>
              {directorDocs.slice(0, 3).map((d) => (
                <Text key={d.id} fz={11.5} c="slate.7" truncate>
                  Director 1 {d.name}
                  {d.required && <span style={{ color: "var(--mantine-color-red-6)" }}> *</span>}
                </Text>
              ))}
              {directorDocs.length > 3 && (
                <Text fz={11} c="slate.5">
                  +{directorDocs.length - 3} more per director
                </Text>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function DocumentSetup({ initialConfig = EMPTY_CONFIG, onSave, readOnly = false }: DocumentSetupProps) {
  const [config, dispatch] = useReducer(reducer, initialConfig);
  const [savedConfig, setSavedConfig] = useState<DocumentSetupConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const [applicant, setApplicant] = useState<ApplicantType>("Individual");
  const [businessTab, setBusinessTab] = useState<"applicant" | "director">("applicant");

  const [editing, setEditing] = useState<{ section: DocSection; id: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editRequired, setEditRequired] = useState(true);
  const [editIcon, setEditIcon] = useState<DocIconKey>("file");
  const [editError, setEditError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ section: DocSection; id: string; name: string } | null>(
    null,
  );

  const section: DocSection = applicant === "Business" && businessTab === "director" ? "Director" : applicant;
  const docs = config[section];

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig]);

  const changeApplicant = (value: string) => {
    setApplicant(value as ApplicantType);
    setBusinessTab("applicant");
  };

  // ---- edit modal ---------------------------------------------------------

  const openEdit = (doc: DocumentConfig) => {
    setEditing({ section, id: doc.id });
    setEditName(doc.name);
    setEditRequired(doc.required);
    setEditIcon(doc.icon);
    setEditError(null);
  };

  const commitEdit = () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      setEditError("Document name is required");
      return;
    }
    const duplicate = config[editing.section].some(
      (d) => d.id !== editing.id && d.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setEditError("This document already exists");
      return;
    }
    dispatch({
      type: "update",
      section: editing.section,
      id: editing.id,
      changes: { name, required: editRequired, icon: editIcon },
    });
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    dispatch({ type: "remove", section: pendingDelete.section, id: pendingDelete.id });
    setPendingDelete(null);
  };

  // ---- save / discard -----------------------------------------------------

  const handleReset = () => {
    dispatch({ type: "reset", config: savedConfig });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(config);
      setSavedConfig(config);
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle =
    section === "Director"
      ? "Director documents"
      : `${applicant} applicant documents`;

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }} p={20}>
        {/* Header */}
        <Group justify="space-between" align="center" mb={14} wrap="nowrap">
          <Box>
            <Group gap={10}>
              <Text fz={19} fw={800} c="slate.9" style={{ letterSpacing: "-0.01em" }}>
                Document Setup
              </Text>
              {dirty && (
                <Badge size="sm" radius="xl" color="orange" variant="light">
                  Unsaved changes
                </Badge>
              )}
            </Group>
            <Text fz={12} c="slate.5" mt={2}>
              Define the default document names each applicant type has to provide.
            </Text>
          </Box>

          <SegmentedControl
            radius="md"
            value={applicant}
            onChange={changeApplicant}
            data={[
              {
                value: "Individual",
                label: (
                  <Group gap={6} justify="center" wrap="nowrap">
                    <IconUser size={14} />
                    <span>Individual</span>
                  </Group>
                ),
              },
              {
                value: "Business",
                label: (
                  <Group gap={6} justify="center" wrap="nowrap">
                    <IconBuilding size={14} />
                    <span>Business</span>
                  </Group>
                ),
              },
            ]}
          />
        </Group>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* Left: section header + table */}
          <Stack gap={10} style={{ minWidth: 0 }}>
            <Group justify="space-between" align="center" wrap="nowrap" style={{ height: 32 }}>
              <Group gap={8} wrap="nowrap">
                <ThemeIcon radius="md" size={26} variant="light" color="brand">
                  <IconFiles size={14} />
                </ThemeIcon>
                <Text fz={13.5} fw={700} c="slate.9">
                  {sectionTitle}
                </Text>
                <Badge size="sm" radius="xl" variant="light" color="slate">
                  {docs.length}
                </Badge>
              </Group>

              {applicant === "Business" && (
                <SegmentedControl
                  size="xs"
                  radius="md"
                  value={businessTab}
                  onChange={(v) => setBusinessTab(v as "applicant" | "director")}
                  data={[
                    { value: "applicant", label: "Applicant documents" },
                    { value: "director", label: "Director documents" },
                  ]}
                />
              )}
            </Group>

            {section === "Director" && (
              <Text fz={11.5} c="slate.5" style={{ marginTop: -4 }}>
                Each director is asked for these documents (for example, “Director 1 NRC”).
              </Text>
            )}

            <DocTable
              key={section}
              items={docs}
              onAdd={(name) =>
                dispatch({
                  type: "add",
                  section,
                  doc: { id: nextId(), name, required: true, icon: "file" },
                })
              }
              onUpdate={(id, changes) => dispatch({ type: "update", section, id, changes })}
              onMove={(id, dir) => dispatch({ type: "move", section, id, dir })}
              onEdit={openEdit}
              onRemove={(doc) => setPendingDelete({ section, id: doc.id, name: doc.name })}
              addPlaceholder={
                section === "Director" ? "New director document, e.g. NRC" : "New document, e.g. NRC copy"
              }
              emptyText={`No documents configured for ${
                section === "Director" ? "directors" : `${applicant.toLowerCase()} applicants`
              } yet.`}
              readOnly={readOnly}
            />
          </Stack>

          {/* Right: preview */}
          <DocPreview applicant={applicant} docs={config[applicant]} directorDocs={config.Director} />
        </Box>
      </Box>

      {/* Footer */}
      {!readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={10}
          bg="white"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
        >
          <Button
            variant="transparent"
            c="dark.8"
            px={0}
            fw={600}
            leftSection={<IconRefresh size={15} />}
            onClick={handleReset}
            disabled={!dirty || saving}
          >
            Discard changes
          </Button>
          <Button
            color="brand"
            radius="md"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!dirty}
          >
            Save setup
          </Button>
        </Group>
      )}

      {/* Edit document modal */}
      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            Edit document
          </Text>
        }
        radius="md"
        size="md"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Stack gap="md">
          <TextInput
            radius="md"
            label={<span className="text-sm font-semibold text-slate-800">Document name</span>}
            value={editName}
            error={editError}
            autoFocus
            onChange={(e) => {
              setEditName(e.currentTarget.value);
              setEditError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
            }}
          />

          <Switch
            label={editRequired ? "Required — applicant must upload this" : "Optional"}
            checked={editRequired}
            onChange={(e) => setEditRequired(e.currentTarget.checked)}
          />

          <Box>
            <Text fz={13} fw={600} c="slate.8" mb={6}>
              Icon
            </Text>
            <Group gap={8}>
              {(Object.keys(DOC_ICONS) as DocIconKey[]).map((key) => {
                const Icon = DOC_ICONS[key].icon;
                const active = key === editIcon;
                return (
                  <UnstyledButton
                    key={key}
                    onClick={() => setEditIcon(key)}
                    title={DOC_ICONS[key].label}
                    aria-label={DOC_ICONS[key].label}
                    style={{
                      width: 38,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${
                        active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"
                      }`,
                      background: active ? "var(--mantine-color-brand-0)" : "white",
                      borderRadius: "var(--mantine-radius-md)",
                    }}
                  >
                    <Icon size={18} color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-slate-5)"} />
                  </UnstyledButton>
                );
              })}
            </Group>
          </Box>
        </Stack>

        <Group justify="flex-end" mt="lg" gap={8}>
          <Button variant="default" radius="md" size="xs" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button color="brand" radius="md" size="xs" onClick={commitEdit}>
            Done
          </Button>
        </Group>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        opened={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            Delete document
          </Text>
        }
        radius="md"
        size="sm"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Text fz={13} c="slate.7">
          Delete{" "}
          <Text span fw={700} c="slate.9">
            {pendingDelete?.name}
          </Text>
          ? The change is applied when you click Save setup.
        </Text>
        <Group justify="flex-end" mt="lg" gap={8}>
          <Button variant="default" radius="md" size="xs" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button color="red" radius="md" size="xs" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}