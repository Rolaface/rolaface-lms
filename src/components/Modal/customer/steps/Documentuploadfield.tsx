import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  FileButton,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCloudUpload,
  IconEye,
  IconFileText,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileKind(fileName: string): "pdf" | "image" | "other" {
  const name = fileName.toLowerCase();

  if (name.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp|svg)$/.test(name)) return "image";

  return "other";
}

function fileIconFor(fileName: string) {
  return getFileKind(fileName) === "image" ? IconPhoto : IconFileText;
}

interface DocumentUploadFieldProps {
  file: File | null | undefined;
  fileUrl?: string | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
  uploadError?: string | null;
  label?: string;
  hint?: string;
}

export function DocumentUploadField({
  file,
  fileUrl,
  onFileChange,
  onRemove,
  isUploading = false,
  uploadError = null,
  label = "Document Upload",
  hint = "Supported formats: PDF, JPG, PNG | Max size: 5 MB",
}: DocumentUploadFieldProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const existingFileName =
    file?.name ??
    fileUrl?.split("/").pop()?.split("?")[0] ??
    "Uploaded document";

  const existingFileKind = getFileKind(existingFileName);

  const openPreview = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreviewOpened(true);
      return;
    }

    if (fileUrl) {
      setPreviewUrl(fileUrl);
      setPreviewOpened(true);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPreviewOpened(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const hasFile = Boolean(file || fileUrl);
  const fileKind = getFileKind(existingFileName);

  return (
    <Box>
      <Group justify="space-between" align="center" mb={6}>
        <Text size="xs" fw={600} c="slate.7">
          {label} <Text span c="danger.6">*</Text>
        </Text>

        <Text size="10px" c="slate.5">
          {hint}
        </Text>
      </Group>

      {hasFile ? (
        <Stack gap={6}>
          <Paper
            withBorder
            radius="md"
            p="sm"
            bg="white"
            style={{
              borderColor: "var(--mantine-color-slate-2)",
            }}
          >
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Group
                gap="sm"
                wrap="nowrap"
                style={{ minWidth: 0 }}
              >
                <ThemeIcon
                  radius="md"
                  size={36}
                  variant="light"
                  color="danger"
                >
                  {(() => {
                    const RowIcon = fileIconFor(existingFileName);
                    return <RowIcon size={18} />;
                  })()}
                </ThemeIcon>

                <Box style={{ minWidth: 0 }}>
                  <Text
                    size="sm"
                    fw={600}
                    c="slate.8"
                    truncate
                  >
                    {existingFileName}
                  </Text>

                  <Text size="xs" c="slate.5">
                    {file
                      ? formatFileSize(file.size)
                      : "Previously uploaded"}
                  </Text>
                </Box>
              </Group>

              <Group gap={6} wrap="nowrap">
                {isUploading ? (
                  <Badge
                    size="sm"
                    radius="sm"
                    variant="light"
                    color="info"
                    leftSection={
                      <Loader
                        size={10}
                        color="var(--mantine-color-info-6)"
                      />
                    }
                  >
                    Uploading...
                  </Badge>
                ) : uploadError ? (
                  <Badge
                    size="sm"
                    radius="sm"
                    variant="light"
                    color="danger"
                    leftSection={<IconAlertTriangle size={12} />}
                  >
                    Upload failed
                  </Badge>
                ) : (
                  <Badge
                    size="sm"
                    radius="sm"
                    variant="light"
                    color="success"
                    leftSection={<IconCircleCheck size={12} />}
                  >
                    Uploaded
                  </Badge>
                )}

                <Button
                  size="xs"
                  radius="md"
                  variant="light"
                  color="brand"
                  leftSection={<IconEye size={14} />}
                  onClick={openPreview}
                  disabled={isUploading || !hasFile}
                >
                  View
                </Button>

                <ActionIcon
                  size="sm"
                  color="danger"
                  variant="subtle"
                  onClick={onRemove}
                  disabled={isUploading}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>

          {uploadError && !isUploading && (
            <Alert
              color="danger"
              radius="md"
              icon={<IconAlertTriangle size={16} />}
              py={6}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text size="xs" c="danger.7">
                  {uploadError}
                </Text>

                <Button
                  size="xs"
                  radius="md"
                  variant="light"
                  color="danger"
                  onClick={() => {
                    if (file) {
                      onFileChange(file);
                    }
                  }}
                  disabled={!file}
                >
                  Retry
                </Button>
              </Group>
            </Alert>
          )}
        </Stack>
      ) : (
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <FileButton
            onChange={(selectedFile) => {
              if (selectedFile) {
                onFileChange(selectedFile);
              }
            }}
            accept="image/*,.pdf"
          >
            {(fileButtonProps) => (
              <Paper
                {...fileButtonProps}
                withBorder
                radius="md"
                p="lg"
                ta="center"
                bg={isDragOver ? "brand.0" : "slate.0"}
                style={{
                  borderStyle: "dashed",
                  borderColor: isDragOver
                    ? "var(--mantine-color-brand-4)"
                    : "var(--mantine-color-slate-3)",
                  cursor: "pointer",
                  transition:
                    "background-color 120ms ease, border-color 120ms ease",
                }}
              >
                <Stack align="center" gap={6}>
                  <ThemeIcon
                    radius="xl"
                    size={44}
                    variant="light"
                    color="brand"
                  >
                    <IconCloudUpload size={22} />
                  </ThemeIcon>

                  <Text size="sm" fw={600} c="slate.8">
                    Drag &amp; drop a file here
                  </Text>

                  <Text size="xs" c="slate.5">
                    or
                  </Text>

                  <Button
                    radius="md"
                    size="xs"
                    variant="default"
                  >
                    Choose File
                  </Button>
                </Stack>
              </Paper>
            )}
          </FileButton>
        </Box>
      )}

      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title="Document Preview"
        size="lg"
        centered
        radius="md"
      >
        {previewUrl ? (
          <Stack gap="sm">
            <Group justify="space-between" wrap="nowrap">
              <Text
                size="sm"
                fw={600}
                c="slate.8"
                truncate
              >
                {existingFileName}
              </Text>

              <Text size="xs" c="slate.5">
                {file ? formatFileSize(file.size) : "Previously uploaded"}
              </Text>
            </Group>

            <Box
              style={{
                border:
                  "1px solid var(--mantine-color-slate-2)",
                borderRadius:
                  "var(--mantine-radius-md)",
                background:
                  "var(--mantine-color-slate-0)",
                minHeight: 360,
                maxHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {existingFileKind === "image" && (
                <img
                  src={previewUrl}
                  alt={existingFileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    objectFit: "contain",
                  }}
                />
              )}

              {existingFileKind === "pdf" && (
                <iframe
                  src={previewUrl}
                  title={existingFileName}
                  style={{
                    width: "100%",
                    height: "60vh",
                    border: "none",
                  }}
                />
              )}

              {existingFileKind === "other" && (
                <Stack
                  align="center"
                  gap={6}
                  py="xl"
                >
                  <ThemeIcon
                    radius="xl"
                    size={48}
                    variant="light"
                    color="slate"
                  >
                    <IconFileText size={24} />
                  </ThemeIcon>

                  <Text
                    size="sm"
                    fw={600}
                    c="slate.7"
                  >
                    Preview unavailable for this file type
                  </Text>
                </Stack>
              )}
            </Box>

            <Group justify="flex-end">
              <Button
                variant="default"
                radius="md"
                size="xs"
                onClick={closePreview}
              >
                Close
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Box>
  );
}
