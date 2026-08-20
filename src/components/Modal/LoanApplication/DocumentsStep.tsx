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
  IconReceipt,
  IconBuildingBank,
  IconIdBadge2,
  IconCamera,
  IconCertificate,
  IconFileCertificate,
  IconFileInvoice,
  IconGavel,
  IconPencil,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type {
  LoanApplicationValues,
  LoanType,
  DirectorDocEntry,
} from "./LoanApplicationModal";
import {
  DocumentPreviewModal,
  formatFileSize,
  getFileKind,
  getFileExtLabel,
  fileKindIcon,
} from "./ViewDoc";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
  directorDocsError?: string | null;
}

type FileFieldKey = Extract<
  keyof LoanApplicationValues,
  | "payslips"
  | "bankStatementsPersonal"
  | "nrcCopy"
  | "passportPhotoPersonal"
  | "tpinCertificate"
  | "pacraCertificate"
  | "form2"
  | "taxClearanceCertificate"
  | "taxComplianceReturn"
  | "orderInvoice"
  | "bankStatementsBusiness"
  | "applicantPassportPhoto"
  | "boardResolution"
>;
interface DocTile {
  key: FileFieldKey;
  label: string;
  description: string;
  icon: React.FC<any>;
  required: boolean;
  guidelines: string[];
}

const nextId = () => Math.random().toString(36).slice(2, 10);
const MAX_DIRECTOR_DOCS = 3;

const DEFAULT_GUIDELINES = [
  "File must be clear, legible and unedited",
  "Accepted formats: PDF, JPG, JPEG",
  "Maximum file size: 5MB",
];

const PERSONAL_DOC_TILES: DocTile[] = [
  {
    key: "payslips",
    label: "Latest three payslips",
    description: "Most recent 3 months of salary slips from your employer.",
    icon: IconReceipt,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "bankStatementsPersonal",
    label: "Bank statements (3 months)",
    description: "Statements from your primary bank account, last 3 months.",
    icon: IconBuildingBank,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "nrcCopy",
    label: "NRC copy",
    description: "A clear scan or photo of both sides of your NRC.",
    icon: IconIdBadge2,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "passportPhotoPersonal",
    label: "Passport-sized photo",
    description: "Recent passport-sized photo with a plain background.",
    icon: IconCamera,
    required: true,
    guidelines: [
      "Plain, light-colored background",
      "Face clearly visible, no filters",
      "Accepted formats: JPG, JPEG, PNG",
    ],
  },
  {
    key: "tpinCertificate",
    label: "TPIN certificate",
    description: "Taxpayer Identification Number certificate.",
    icon: IconCertificate,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
];

const BUSINESS_DOC_TILES: DocTile[] = [
  {
    key: "pacraCertificate",
    label: "PACRA certificate",
    description: "Certificate of incorporation / business registration.",
    icon: IconCertificate,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "form2",
    label: "Form 2",
    description: "Particulars of directors and shareholders.",
    icon: IconFileCertificate,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "taxClearanceCertificate",
    label: "Tax clearance certificate / TPIN",
    description: "Proof of tax compliance for the business.",
    icon: IconFileInvoice,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "taxComplianceReturn",
    label: "Latest tax compliance return",
    description: "Most recently filed tax compliance return.",
    icon: IconFileInvoice,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "orderInvoice",
    label: "Order / Invoice",
    description:
      "Only required if applying for order financing or invoice discounting.",
    icon: IconFileInvoice,
    required: false,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "bankStatementsBusiness",
    label: "Bank statements (6 months)",
    description: "Business account statements, last 6 months.",
    icon: IconBuildingBank,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
  {
    key: "applicantPassportPhoto",
    label: "Applicant passport-sized photo",
    description: "Recent passport-sized photo of the applicant.",
    icon: IconCamera,
    required: true,
    guidelines: [
      "Plain, light-colored background",
      "Face clearly visible, no filters",
      "Accepted formats: JPG, JPEG, PNG",
    ],
  },
  {
    key: "boardResolution",
    label: "Board resolution",
    description: "Resolution authorizing the loan application.",
    icon: IconGavel,
    required: true,
    guidelines: DEFAULT_GUIDELINES,
  },
];

interface UploadedDocRowProps {
  file: File;
  onPreview: () => void;
  onRemove: () => void;
}

function UploadedDocRow({ file, onPreview, onRemove }: UploadedDocRowProps) {
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
          <Button
            variant="light"
            color="brand"
            radius="md"
            size="xs"
            leftSection={<IconEye size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            Preview
          </Button>
          <Button
            variant="subtle"
            color="red"
            radius="md"
            size="xs"
            leftSection={<IconTrash size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            Remove
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}

export function DocumentsStep({ form, loanType, directorDocsError }: StepProps) {
  const tiles = loanType === "Personal" ? PERSONAL_DOC_TILES : BUSINESS_DOC_TILES;
  const [selectedKey, setSelectedKey] = useState<FileFieldKey>(tiles[0].key);

  useEffect(() => {
    setSelectedKey(tiles[0].key);
  }, [loanType]);

  const selected = tiles.find((t) => t.key === selectedKey) ?? tiles[0];
  const SelectedIcon = selected.icon;
  const file = form.values[selected.key] as File | null;
  const error = form.errors[selected.key];

  const [previewOpened, setPreviewOpened] = useState(false);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const directorDocs = form.values.directorDocuments || [];

  const [directorPreview, setDirectorPreview] = useState<{
    file: File;
    title: string;
  } | null>(null);

  const handleAddDirectorDoc = () => {
    if (directorDocs.length >= MAX_DIRECTOR_DOCS) return;
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
              const tileFile = form.values[tile.key] as File | null;
              const tileHasError = !!form.errors[tile.key];
              const isSelected = tile.key === selectedKey;
              const TileIcon = tile.icon;
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
                      <TileIcon
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
                <SelectedIcon size={20} />
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
                  onRemove={() => form.setFieldValue(selected.key, null)}
                />
              </Stack>
            ) : (
              <FileButton
                onChange={(f) => f && form.setFieldValue(selected.key, f)}
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
                {selected.guidelines.map((g, i) => (
                  <List.Item key={i}>{g}</List.Item>
                ))}
              </List>
            </Paper>
          </Stack>
        </Box>
      </Group>

      {loanType === "Business" && (
        <Box>
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="sm" align="center">
              <Text fz="sm" fw={700} c="slate.8">
                Director documents ({directorDocs.length}/{MAX_DIRECTOR_DOCS})
              </Text>
              <Text fz="xs" c="slate.5">
                Add up to 3 director NRC and passport photo uploads.
              </Text>
            </Group>
            <Button
              size="sm"
              variant="light"
              radius="md"
              color="brand"
              onClick={handleAddDirectorDoc}
              disabled={directorDocs.length >= MAX_DIRECTOR_DOCS}
            >
              Add Director Docs
            </Button>
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
                        onPreview={() =>
                          setDirectorPreview({ file: docFile, title: docLabel })
                        }
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
                        accept="application/pdf,image/jpeg,image/jpg,.pdf,.jpg,.jpeg"
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
      />
    </Stack>
  );
}