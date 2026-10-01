import React, { useState, useEffect } from "react";
import { Modal, Box, Group, Stack, Text, Select, Paper, Table, TextInput, Switch, ActionIcon, Button, ThemeIcon } from "@mantine/core";
import { IconArrowUp, IconArrowDown, IconTrash, IconPlus, IconFiles, IconMinus, IconX } from "@tabler/icons-react";
import type { DocumentConfig, ProductOption, SetupRow } from "./documentSetupModalStore";
import { DocumentSetupApi } from "../../api/LosConfiguration/DocumentSetupApi";
import { ModalFooter } from "../shared/ModalFooter";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { useMantineTheme } from "@mantine/core";

export interface DocumentSetupModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  mode?: "view" | "add" | "edit" | null;
  products?: ProductOption[];
  product?: SetupRow;
  docs?: DocumentConfig[];
  onSuccess?: (productId: string, docs: DocumentConfig[]) => void;
}

const doc = (name: string, required = false): DocumentConfig => ({
  id: Math.random().toString(36).slice(2, 9),
  name,
  required,
});

const headStyle = {
  fontSize: "var(--mantine-font-size-xs)",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  border: "none",
};

export function DocumentSetupModal({ opened, onClose, onMinimize, mode, products, product, docs: initialDocs, onSuccess }: DocumentSetupModalProps) {
  const theme = useMantineTheme();
  
  
  const editingId = mode === "edit" ? product?.id : null;
  const productOptions = mode === "add" ? products! : (product ? [product] : []);
  
  const [productId, setProductId] = useState<string | null>(null);
  const isView = mode === "view";
  const [docs, setDocs] = useState<DocumentConfig[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (opened) {
      setProductId(editingId ?? productOptions[0]?.id ?? null);
      setDocs(initialDocs ?? []);
      setNewName("");
      setError(null);
    }
  }, [opened]); // Only run when modal opens

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

  const handleClose = () => {
    onClose();
  };

  const handleMinimize = () => {
    onMinimize?.();
  };

  const save = async () => {
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
    const finalDocs = docs.map((d) => ({ ...d, name: d.name.trim() }));
    
    const payload = {
      loan_product: productId,
      documents: finalDocs.map((d) => ({ document_name: d.name, is_required: d.required ? 1 : 0 })),
    };
    
    try {
      if (mode === "edit") {
        await DocumentSetupApi.update(productId, payload);
      } else {
        await DocumentSetupApi.create(payload);
      }
      onSuccess?.(productId, finalDocs);
      handleClose();
      // NOTE: showSuccess is called inside DocumentSetup.tsx onSave if we want, or here.
      // We will call it here if we want, but it's handled in DocumentSetup.tsx now.
    } catch (e) {
      console.error(e);
      // As requested by user: show the error coming from the backend directly
      setError(parseFrappeError(e));
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = editingId ? "Edit product documents" : "Add product documents";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={680}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0 },
      }}
    >
      <Box style={{ display: "flex", flexDirection: "column", flex: 1 }} bg="white">
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: "var(--mantine-color-white)",
              }}
            >
              <IconFiles size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {headerTitle}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Choose a product, then list the documents applicants must provide.
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleMinimize}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        <Box p="lg" style={{ overflowY: "auto", flex: 1 }}>
          <Stack gap="md">
            <div tabIndex={-1} data-autofocus style={{ outline: "none", position: "absolute", opacity: 0 }} />
            {(() => {
                const selectedProd = productOptions.find(p => p.id === productId);
                return (
                  <Select
                    label="Loan product"
                    radius="md"
                    searchable
                    allowDeselect={false}
                    disabled={!!editingId || isView}
                    data={[{ value: "HEADER", label: "HEADER", disabled: true }, ...productOptions.map((p) => ({ value: p.id, label: p.name }))]}
                    value={productId}
                    onChange={setProductId}
                    nothingFoundMessage="No products found"
                    leftSection={
                      selectedProd?.code ? (
                        <Text fz={12} fw={600} c="brand.7" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                          {selectedProd.code}
                        </Text>
                      ) : undefined
                    }
                    leftSectionWidth={selectedProd?.code ? 65 : 36}
                    renderOption={({ option }) => {
                      if (option.value === "HEADER") {
                        return (
                          <Group wrap="nowrap" gap="xl" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                            <Text fz={10} fw={700} c="slate.5" miw={60}>CODE</Text>
                            <Text fz={10} fw={700} c="slate.5">PRODUCT NAME</Text>
                          </Group>
                        );
                      }
                      
                      const p = productOptions.find((x) => x.id === option.value);
                      return (
                        <Group wrap="nowrap" gap="xl" py={2}>
                          {p?.code ? (
                            <Text fz={12} fw={600} c="brand.7" miw={60} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                              {p.code}
                            </Text>
                          ) : (
                            <Box miw={60} />
                          )}
                          <Text size="sm" fw={500} c="slate.8">{p?.name || option.label}</Text>
                        </Group>
                      );
                    }}
                  />
                );
              })()}

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
                        <Table.Td colSpan={4} p={0} style={{ borderBottom: "1px dashed var(--mantine-color-slate-3)" }}>
                          <Stack align="center" gap={6} py={40} bg="slate.0">
                            <IconFiles size={40} stroke={1} color="var(--mantine-color-slate-4)" />
                            <Text fz={14} c="slate.6" fw={600}>
                              No documents added yet
                            </Text>
                            <Text fz={12.5} c="slate.5">
                              Add the first document below to get started.
                            </Text>
                          </Stack>
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
                              disabled={isView}
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
                              disabled={isView}
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
                              <ActionIcon variant="subtle" color="slate" size="sm" radius="md" disabled={i === 0 || isView} onClick={() => move(i, -1)} aria-label="Move up">
                                <IconArrowUp size={14} />
                              </ActionIcon>
                              <ActionIcon variant="subtle" color="slate" size="sm" radius="md" disabled={i === docs.length - 1 || isView} onClick={() => move(i, 1)} aria-label="Move down">
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

                <Group gap={10} wrap="nowrap" p={14} bg="slate.0" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
                  <TextInput
                    size="sm"
                    radius="md"
                    style={{ flex: 1 }}
                    placeholder="Enter a new document name (e.g. NRC copy)"
                    aria-label="New document name"
                    value={newName}
                    onChange={(e) => setNewName(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addDoc();
                    }}
                  />
                  <Button size="sm" radius="md" color="brand" leftSection={<IconPlus size={16} />} onClick={addDoc}>
                    Add
                  </Button>
                </Group>
              </Paper>

              <Text fz={12} c="danger.6" mt={6} style={{ minHeight: 18 }}>
                {error ?? ""}
              </Text>
            </Box>
          </Stack>
        </Box>
        
        <ModalFooter
          variant="theme"
          isViewMode={false}
          onClose={handleClose}
          onSubmit={save}
          submitLabel={editingId ? "Update documents" : "Save documents"}
          submitLoading={saving}
          submitDisabled={saving}
        />
      </Box>
    </Modal>
  );
}





