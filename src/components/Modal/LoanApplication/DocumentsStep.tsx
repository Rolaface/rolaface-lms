import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Title,
  Button,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  FileButton,
  List,
  UnstyledButton,
  Modal,
  ActionIcon,
  SimpleGrid,
} from "@mantine/core";
import {
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconFileCertificate,
  IconPencil,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import {
  nextId,
  type ApplicantType,
  type DirectorDocEntry,
  type LoanApplicationValues,
  type RequiredDocument,
} from "./form";
import {
  DocumentPreviewModal,
  formatFileSize,
  getFileKind,
  getFileExtLabel,
  fileKindIcon,
} from "./ViewDoc";
interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  applicantType: ApplicantType;
  documents: RequiredDocument[];
  documentErrors: Record<string, string>;
  directorDocsError?: string | null;
  existingUrls?: WeakMap<File, string>;
  readOnly?: boolean;
}

interface DocTile {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

const DEFAULT_GUIDELINES = [
  "File must be clear, legible and unedited",
  "Accepted formats: PDF, JPG, JPEG, PNG",
  "Maximum file size: 5MB",
];

const tileFor = ({ document_name, is_required, description }: RequiredDocument): DocTile => ({
  key: document_name,
  label: document_name,
  description: description || `Upload a clear copy of the ${document_name.toLowerCase()}.`,
  required: !!is_required,
});

interface UploadedDocRowProps {
  file: File;
  onPreview: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}

function UploadedDocRow({ file, onPreview, onRemove, readOnly = false, }: UploadedDocRowProps) {
  const kind = getFileKind(file);
  const RowIcon = fileKindIcon(kind);

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      bg="white"
      onClick={onPreview}
      style={{
        cursor: "pointer",
        borderColor: "var(--mantine-color-slate-2)",
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon radius="md" size={38} variant="light" color="red">
            <RowIcon size={20} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text fz="sm" fw={600} c="slate.8" truncate>
              {file.name}
            </Text>
            <Text fz="xs" c="slate.5">
              {getFileExtLabel(file)} • {formatFileSize(file.size)}
            </Text>
          </Box>
        </Group>
              <Group gap={6} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
  <ActionIcon
    variant="light"
    color="brand"
    radius="md"
    size="lg"
    aria-label="Preview"
    onClick={(e) => {
      e.stopPropagation();
      onPreview();
    }}
  >
    <IconEye size={16} />
  </ActionIcon>
  {!readOnly && (
    <ActionIcon
      variant="subtle"
      color="red"
      radius="md"
      size="lg"
      aria-label="Remove"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    >
      <IconTrash size={16} />
    </ActionIcon>
  )}
</Group>
      </Group>
    </Paper>
  );
}

export function DocumentsStep({
  form,
  applicantType,
  documents,
  documentErrors,
  directorDocsError,
  existingUrls,
  readOnly = false,
}: StepProps) {
  const tiles = documents.map(tileFor);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(tiles[0]?.key);

  useEffect(() => {
    if (!tiles.some((tile) => tile.key === selectedKey)) setSelectedKey(tiles[0]?.key);
  }, [documents]);

  const selected =
    tiles.find((t) => t.key === selectedKey) ??
    tiles[0] ??
    tileFor({ document_name: "Documents", is_required: 0 });
  const file = form.values.documents[selected.key] ?? null;
  const error = file ? undefined : documentErrors[selected.key];
  const setDocument = (name: string, value: File | null) =>
    form.setFieldValue("documents", { ...form.values.documents, [name]: value });

  const [previewOpened, setPreviewOpened] = useState(false);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const directorDocs = form.values.directorDocuments || [];

  const [directorPreview, setDirectorPreview] = useState<{ file: File; title: string } | null>(null);

  const handleAddDirectorDoc = () => {
    const newIndex = directorDocs.length;
    form.insertListItem("directorDocuments", {
      id: nextId(),
      nrcFile: null,
      photoFile: null,
    } as DirectorDocEntry);
    setEditingIndex(newIndex);
    setModalOpened(true);
  };

  const handleDoneDirectorDoc = () => {
    if (editingIndex === null) return;
    const nrcErr = form.validateField(
      `directorDocuments.${editingIndex}.nrcFile`,
    ).hasError;
    const photoErr = form.validateField(
      `directorDocuments.${editingIndex}.photoFile`,
    ).hasError;
    if (nrcErr || photoErr) return;
    setEditingIndex(null);
    setModalOpened(false);
  };

  const handleEditDirectorDoc = (index: number) => {
    setEditingIndex(index);
    setModalOpened(true);
  };

  const handleDeleteDirectorDoc = (index: number) => {
    form.removeListItem("directorDocuments", index);
  };

  const handleCloseModal = () => {
    if (editingIndex !== null) {
      const current = form.values.directorDocuments[editingIndex];
      if (current && !current.nrcFile && !current.photoFile) {
        form.removeListItem("directorDocuments", editingIndex);
      }
    }
    setEditingIndex(null);
    setModalOpened(false);
  };

  return (
    <Stack gap="xl">
      {tiles.length === 0 ? (
        <Text size="sm" c="slate.5">
          {readOnly ? "No documents uploaded." : "No documents are set up for this loan product."}
        </Text>
      ) : (
        <Group align="stretch" gap="md" wrap="nowrap" style={{ minHeight: 260 }}>
          <Paper
            withBorder
            radius="md"
            bg="white"
            w={240}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Text
              size="xs"
              fw={800}
              tt="uppercase"
              c="slate.5"
              px="sm"
              py="xs"
              style={{ flexShrink: 0, letterSpacing: 0.5 }}
            >
              Required Documents
            </Text>

            <Stack gap={2} px={6} pb={6}>
              {tiles.map((tile) => {
                const tileFile = form.values.documents[tile.key];
                const tileHasError = !tileFile && !!documentErrors[tile.key];
                const isSelected = tile.key === selectedKey;
                return (
                  <UnstyledButton
                    key={tile.key}
                    onClick={() => setSelectedKey(tile.key)}
                    px="xs"
                    py={6}
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
                      background: isSelected
                        ? "var(--mantine-color-brand-0)"
                        : "transparent",
                      border: isSelected
                        ? "1px solid var(--mantine-color-brand-4)"
                        : "1px solid transparent",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" gap={6}>
                      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                        <IconFileCertificate
                          size={14}
                          color={
                            isSelected
                              ? "var(--mantine-color-brand-6)"
                              : "var(--mantine-color-slate-4)"
                          }
                          style={{ flexShrink: 0 }}
                        />
                        <Text
                          size="xs"
                          fw={isSelected ? 700 : 600}
                          c={isSelected ? "brand.7" : "slate.7"}
                          truncate
                        >
                          {tile.label}
                        </Text>
                      </Group>
                      {tileFile ? (
                        <IconCheck
                          size={13}
                          color="var(--mantine-color-green-6)"
                          style={{ flexShrink: 0 }}
                        />
                      ) : tile.required ? (
                        <IconAlertCircle
                          size={13}
                          color={
                            tileHasError
                              ? "var(--mantine-color-red-6)"
                              : "var(--mantine-color-orange-5)"
                          }
                          style={{ flexShrink: 0 }}
                        />
                      ) : null}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Paper>

          <Box style={{ flex: 1, minWidth: 0 }}>
            <Stack gap="md" pr="xs">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon radius="md" size={40} variant="light" color="brand">
                  <IconFileCertificate size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={5} c="slate.8">
                    Upload {selected.label}
                    {selected.required && (
                      <Text component="span" c="red.6">
                        {" "}
                        *
                      </Text>
                    )}
                  </Title>
                  <Text size="sm" c="slate.5">
                    {selected.description}
                  </Text>
                </Box>
              </Group>

                          {file ? (
                <Stack gap="xs">
                  <Text fz="xs" fw={700} c="slate.5" tt="uppercase">
                    Uploaded Document
                  </Text>
                  <UploadedDocRow
                    file={file}
                    onPreview={() => setPreviewOpened(true)}
                    onRemove={() => setDocument(selected.key, null)}
                    readOnly={readOnly}
                  />
                </Stack>
              ) : readOnly ? (
                <Paper
                  withBorder
                  radius="lg"
                  p="md"
                  ta="center"
                  bg="slate.0"
                  style={{ borderStyle: "dashed" }}
                >
                  <Text size="sm" fw={600} c="slate.5">
                    Not provided
                  </Text>
                </Paper>
              ) : (
                <FileButton
                  onChange={(f) => f && setDocument(selected.key, f)}
                  accept="application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png"
                >
                  {(fileButtonProps) => (
                    <Paper
                      {...fileButtonProps}
                      withBorder
                      radius="lg"
                      p="md"
                      ta="center"
                      bg="slate.0"
                      style={{
                        borderStyle: "dashed",
                        borderColor: error
                          ? "var(--mantine-color-red-4)"
                          : "var(--mantine-color-slate-3)",
                        cursor: "pointer",
                      }}
                    >
                      <Stack align="center" gap={4}>
                        <ThemeIcon radius="xl" size={56} variant="light" color="brand">
                          <IconUpload size={26} />
                        </ThemeIcon>
                        <Text size="sm" fw={700} c="slate.8">
                          Click to upload or drag and drop
                        </Text>
                        <Text size="xs" c="slate.5">
                          PDF, JPG, JPEG or PNG (max. 5MB)
                        </Text>
                        <Button radius="md" size="xs" color="brand">
                          Browse Files
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                </FileButton>
              )}

              {error && (
                <Text fz="xs" c="red.6">
                  {error}
                </Text>
              )}

              <Paper
                withBorder
                radius="md"
                p="md"
                bg="blue.0"
                style={{ borderColor: "var(--mantine-color-blue-2)" }}
              >
                <Group gap="xs" mb="xs">
                  <IconInfoCircle size={15} color="var(--mantine-color-blue-6)" />
                  <Text size="xs" fw={700} c="blue.7">
                    Guidelines for {selected.label}
                  </Text>
                </Group>
                <List size="xs" spacing={4} c="slate.6" pl={4}>
                  {DEFAULT_GUIDELINES.map((g, i) => (
                    <List.Item key={i}>{g}</List.Item>
                  ))}
                </List>
              </Paper>
            </Stack>
          </Box>
        </Group>
      )}

      {applicantType === "Business" && (
        <Box>
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="sm" align="center">
              <Text fz="sm" fw={700} c="slate.8">
                Director documents ({directorDocs.length})
              </Text>
              <Text fz="xs" c="slate.5">
                Add director NRC and passport photo uploads.
              </Text>
            </Group>
                        {!readOnly && (
              <Button
                size="sm"
                variant="light"
                radius="md"
                color="brand"
                onClick={handleAddDirectorDoc}
              >
                Add Director Docs
              </Button>
            )}
          </Group>

          {directorDocsError && (
            <Text fz="xs" c="red.6" mb="sm">
              {directorDocsError}
            </Text>
          )}

          {directorDocs.length > 0 && (
            <Stack gap="sm">
              {directorDocs.map((doc, idx) => (
                <Group
                  key={doc.id}
                  justify="space-between"
                  align="center"
                  className="border border-slate-200 bg-slate-50 rounded-md p-2"
                >
                  <Box>
                    <Text fz="sm" fw={600} c="slate.8">
                      Director {idx + 1} Documents
                    </Text>
                    <Text fz="xs" c="slate.5">
                      NRC: {doc.nrcFile ? doc.nrcFile.name : "Pending"} • Photo:{" "}
                      {doc.photoFile ? doc.photoFile.name : "Pending"}
                    </Text>
                  </Box>
                                   {!readOnly && (
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="brand"
                        onClick={() => handleEditDirectorDoc(idx)}
                        aria-label="Edit director documents"
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteDirectorDoc(idx)}
                        aria-label="Delete director documents"
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  )}
                </Group>
              ))}
            </Stack>
          )}
        </Box>
      )}

      <DocumentPreviewModal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        file={file}
        title={selected.label}
        sourceUrl={file ? existingUrls?.get(file) ?? null : null}
      />

      <Modal
        opened={modalOpened && editingIndex !== null}
        onClose={handleCloseModal}
        size="lg"
        title={
          <Text fz="lg" fw={700} c="slate.8">
            {editingIndex !== null
              ? `Director ${editingIndex + 1} Documents`
              : "Add Director Documents"}
          </Text>
        }
      >
        {editingIndex !== null && (
          <Box>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing="md" mb="xl">
              {(["nrcFile", "photoFile"] as const).map((docKey) => {
                const docFile = form.values.directorDocuments[editingIndex][docKey];
                const docError =
                  form.errors[`directorDocuments.${editingIndex}.${docKey}`];
                const docLabel =
                  docKey === "nrcFile"
                    ? `Director ${editingIndex + 1} NRC`
                    : `Director ${editingIndex + 1} passport photo`;

                return (
                  <Box key={docKey}>
                    <Text fz="sm" fw={700} c="slate.8" mb={2}>
                      {docLabel}
                      <Text component="span" c="red.6">
                        {" "}
                        *
                      </Text>
                    </Text>

                    {docFile ? (
                      <UploadedDocRow
                        file={docFile}
                        onPreview={() => setDirectorPreview({ file: docFile, title: docLabel })}
                        onRemove={() =>
                          form.setFieldValue(
                            `directorDocuments.${editingIndex}.${docKey}`,
                            null,
                          )
                        }
                      />
                    ) : (
                      <FileButton
                        onChange={(f) =>
                          f &&
                          form.setFieldValue(
                            `directorDocuments.${editingIndex}.${docKey}`,
                            f,
                          )
                        }
                       accept="application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png"
                      >
                        {(fileButtonProps) => (
                          <Paper
                            {...fileButtonProps}
                            withBorder
                            radius="md"
                            p="md"
                            ta="center"
                            bg="slate.0"
                            style={{
                              borderStyle: "dashed",
                              borderColor: docError
                                ? "var(--mantine-color-red-4)"
                                : "var(--mantine-color-slate-3)",
                              cursor: "pointer",
                            }}
                          >
                            <Text size="xs" fw={600} c="slate.7" truncate>
                              Click to upload
                            </Text>
                          </Paper>
                        )}
                      </FileButton>
                    )}
                    {docError && (
                      <Text fz="xs" c="red.6" mt={4}>
                        {docError}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </SimpleGrid>

            <Group justify="flex-end">
              <Button variant="default" radius="md" onClick={handleCloseModal}>
                Close
              </Button>
              <Button color="brand" radius="md" onClick={handleDoneDirectorDoc}>
                Done
              </Button>
            </Group>
          </Box>
        )}
      </Modal>

     <DocumentPreviewModal
  opened={!!directorPreview}
  onClose={() => setDirectorPreview(null)}
  file={directorPreview?.file ?? null}
  title={directorPreview?.title ?? ""}
  sourceUrl={directorPreview ? existingUrls?.get(directorPreview.file) ?? null : null}
/>
    </Stack>
  );
}