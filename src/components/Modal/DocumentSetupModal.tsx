import React, { useEffect } from "react";
import { Box, Group, Stack, Text, Select, Paper, Table, TextInput, Switch, ActionIcon, Button, ThemeIcon, LoadingOverlay, Modal, useMantineTheme } from "@mantine/core";
import { IconTrash, IconPlus, IconFiles, IconMinus, IconX } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { DocumentSetupApi, type DocumentSetupPayload } from "../../api/LosConfiguration/DocumentSetupApi";
import { ModalFooter } from "../shared/ModalFooter";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";

export interface DocumentSetupModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  isView?: boolean;
}

export interface DocumentConfig {
  id: string;
  name: string;
  required: boolean;
}

const doc = (name: string): DocumentConfig => ({
  id: "temp-" + Math.random().toString(36).substring(2, 9),
  name,
  required: true,
});

const headStyle = { textTransform: "uppercase" as const, letterSpacing: 0.5, fontSize: 10, padding: "8px 10px" };

export function DocumentSetupModal({ opened, onClose, onMinimize, editId, isView }: DocumentSetupModalProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      productId: null as string | null,
      docs: [] as DocumentConfig[],
      newName: "",
    },
    validate: {
      productId: (v) => (!v ? "Choose a loan product." : null),
      docs: (v) =>
        v.length === 0
          ? "Add at least one document."
          : v.some((d) => !d.name.trim())
          ? "Document names cannot be blank."
          : null,
    },
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["productsWithoutDocuments"],
    queryFn: () => DocumentSetupApi.getProductsWithoutDocuments(),
    enabled: opened && !editId,
  });

  const { data: editData, isLoading: isEditLoading, refetch } = useQuery({
    queryKey: ["documentSetup", editId],
    queryFn: () => DocumentSetupApi.getById(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (editId && opened) {
      refetch();
    }
  }, [editId, opened]);

  useEffect(() => {
    if (opened) {
      if (editId && editData) {
        const detail = DocumentSetupApi.unwrap(editData);
        form.setValues({
          productId: detail.loan_product || detail.name || detail.id || "",
          docs: (detail.documents || detail.document_list || []).map((d: any, i: number) => ({
            id: d.id || d.name || String(i),
            name: d.document_name || d.name || "",
            required: d.is_required === 1 || d.required === 1 || d.is_required === true,
          })),
          newName: "",
        });
      } else if (!editId && productsData) {
        const opts = DocumentSetupApi.unwrapList(productsData);
        const firstId = opts[0]?.loan_product ?? opts[0]?.name ?? opts[0]?.id ?? null;
        form.setValues({
          productId: firstId,
          docs: [],
          newName: "",
        });
      }
    } else if (!opened) {
      form.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editData, productsData]);

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "OK", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "OK", color: "green" }],
    });
  };

  const createMutation = useMutation({
    mutationFn: DocumentSetupApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentSetups"] });
      queryClient.invalidateQueries({ queryKey: ["productsWithoutDocuments"] });
      const name = productOptions.find((p) => p.id === form.values.productId)?.name || "the product";
      showSuccess("Documents Saved", `Documents for ${name} have been saved successfully.`);
      form.reset();
      onClose();
    },
    onError: (error: any) => showError("Save Failed", error),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => DocumentSetupApi.update(editId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentSetups"] });
      queryClient.invalidateQueries({ queryKey: ["documentSetup", editId] });
      const name = productOptions.find((p) => p.id === form.values.productId)?.name || "the product";
      showSuccess("Documents Updated", `Documents for ${name} have been updated successfully.`);
      form.reset();
      onClose();
    },
    onError: (error: any) => showError("Update Failed", error),
  });

  const handleSubmit = () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    const payload: DocumentSetupPayload = {
      loan_product: form.values.productId as string,
      documents: form.values.docs.map((d) => ({
        document_name: d.name,
        is_required: d.required ? 1 : 0,
      })),
    };

    if (editId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addDoc = () => {
    const name = form.values.newName.trim();
    if (!name) return;
    form.setFieldValue("docs", [...form.values.docs, doc(name)]);
    form.setFieldValue("newName", "");
  };


  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleMinimize = () => {
    onMinimize?.();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDataLoading = (!!editId && isEditLoading) || (!editId && isProductsLoading);
  const isPending = isSaving || isDataLoading; 

  let productOptions: any[] = [];
  if (editId && editData) {
    const detail = DocumentSetupApi.unwrap(editData);
    productOptions = [{
      id: detail.loan_product || detail.name || detail.id || "",
      name: detail.loan_product_name || detail.product_name || detail.loan_product || detail.name || "",
      code: detail.product_code || detail.code || detail.loan_product || detail.name || "",
    }];
  } else if (!editId && productsData) {
    productOptions = DocumentSetupApi.unwrapList(productsData).map((r: any) => ({
      id: r.loan_product ?? r.name ?? r.id,
      name: r.loan_product_name ?? r.product_name ?? r.loan_product ?? r.name,
      code: r.product_code ?? r.code ?? r.loan_product ?? r.name,
    }));
  }

  const selectedProd = productOptions.find((p) => p.id === form.values.productId);
  const headerTitle = editId ? (isView ? "View product documents" : "Edit product documents") : "Add product documents";

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
        content: { display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 500 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0 },
      }}
    >
      <Box style={{ display: "flex", flexDirection: "column", flex: 1 }} bg="white" mih={550}>
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

        <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <LoadingOverlay visible={isSaving || isDataLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <Box p="lg" style={{ overflowY: "auto", flex: 1 }}>
            <Stack gap="md">
              <Select
                label="Loan product"
                searchable
                allowDeselect={false}
                disabled={!!editId || isView}
                data={[{ value: "HEADER", label: "HEADER", disabled: true }, ...productOptions.map((p) => ({ value: p.id, label: p.name }))]}
                {...form.getInputProps("productId")}
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

              <Box>
                <Group gap={6} mb={8}>
                  <Text fz={14} fw={600} c="slate.8">Documents</Text>
                  {form.values.docs.length > 0 && (
                    <Text fz={13} c="slate.5">({form.values.docs.length})</Text>
                  )}
                </Group>

                <Paper withBorder radius="md" style={{ overflow: "hidden", borderColor: "var(--mantine-color-slate-2)" }}>
                  <Table verticalSpacing={6} horizontalSpacing="sm" style={{ tableLayout: "fixed" }}>
                    <Table.Thead bg="slate.0">
                      <Table.Tr>
                        <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px", width: 48 }}>No.</Table.Th>
                        <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px" }}>Document name</Table.Th>
                        <Table.Th c="slate.5" fw={700} style={{ ...headStyle, padding: "8px 10px", width: 130 }}>Required</Table.Th>
                        <Table.Th style={{ ...headStyle, width: 100 }} />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {form.values.docs.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={4} p={0} style={{ borderBottom: "1px dashed var(--mantine-color-slate-3)" }}>
                            <Stack align="center" gap={6} py={40} bg="slate.0">
                              <IconFiles size={40} stroke={1} color="var(--mantine-color-slate-4)" />
                              <Text fz={14} c="slate.6" fw={600}>No documents added yet</Text>
                              <Text fz={12.5} c="slate.5">Add the first document below to get started.</Text>
                            </Stack>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        form.values.docs.map((d, i) => (
                          <Table.Tr key={d.id}>
                            <Table.Td>
                              <Text fz={12.5} c="slate.5">{i + 1}</Text>
                            </Table.Td>
                            <Table.Td>
                              <TextInput
                                size="xs"
                                radius="md"
                                disabled={isView}
                                aria-label={"Document " + (i + 1) + " name"}
                                {...form.getInputProps("docs." + i + ".name")}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Group gap={8} wrap="nowrap">
                                <Switch
                                  size="sm"
                                  disabled={isView}
                                  aria-label={d.name + " required"}
                                  {...form.getInputProps("docs." + i + ".required", { type: "checkbox" })}
                                />
                                <Text fz={12} fw={600} c={d.required ? "orange.7" : "slate.5"}>
                                  {d.required ? "Required" : "Optional"}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={2} justify="flex-end" wrap="nowrap">
                                <ActionIcon variant="subtle" color="danger" size="sm" radius="md" disabled={isView} onClick={() => {
                                  form.setFieldValue("docs", form.values.docs.filter((_, idx) => idx !== i));
                                }} aria-label={"Delete " + d.name}>
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>

                  {!isView && (
                    <Group gap={10} wrap="nowrap" p={14} bg="slate.0" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
                      <TextInput
                        size="sm"
                        radius="md"
                        style={{ flex: 1 }}
                        placeholder="Enter a new document name (e.g. NRC copy)"
                        aria-label="New document name"
                        {...form.getInputProps("newName")}
                        onKeyDown={(e) => { if (e.key === "Enter") addDoc(); }}
                      />
                      <Button size="sm" radius="md" color="brand" leftSection={<IconPlus size={16} />} onClick={addDoc}>
                        Add
                      </Button>
                    </Group>
                  )}
                </Paper>
              </Box>
            </Stack>
          </Box>

          <ModalFooter
            variant="theme"
            isViewMode={isView ?? false}
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitLabel={editId ? "Update documents" : "Save documents"}
            submitLoading={isPending}
            submitDisabled={isPending}
          />
        </Box>
      </Box>
    </Modal>
  );
}
