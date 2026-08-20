import { useEffect, useState } from "react";
import { Box, Text, Button, Paper, Stack, ThemeIcon, Group, Modal } from "@mantine/core";
import {
  IconDownload,
  IconFileText,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";

export function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function getFileKind(file: File): "pdf" | "image" | "other" {
  const type = file.type?.toLowerCase() ?? "";
  const name = file.name?.toLowerCase() ?? "";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || /\.(jpe?g|png)$/.test(name)) return "image";
  return "other";
}

export function getFileExtLabel(file: File) {
  const parts = file.name.split(".");
  if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
  return file.type || "FILE";
}

export function fileKindIcon(kind: "pdf" | "image" | "other") {
  if (kind === "image") return IconPhoto;
  return IconFileText;
}

export interface DocumentPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  file: File | null;
  title: string;
}

export function DocumentPreviewModal({
  opened,
  onClose,
  file,
  title,
}: DocumentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [opened, file]);

  if (!file) return null;

  const kind = getFileKind(file);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Box>
          <Text fz="sm" fw={700} c="slate.8">
            {title}
          </Text>
          <Text fz="xs" c="slate.5">
            {getFileExtLabel(file)} • {formatFileSize(file.size)}
          </Text>
        </Box>
      }
      size="xl"
      centered
      radius="md"
      withCloseButton
      closeButtonProps={{
        icon: <IconX size={20} />,
        size: "lg",
        radius: "xl",
        "aria-label": "Close preview",
      }}
      styles={{
        header: {
          paddingBottom: "var(--mantine-spacing-sm)",
          borderBottom: "1px solid var(--mantine-color-slate-2)",
        },
        body: { padding: 0 },
        content: { display: "flex", flexDirection: "column" },
      }}
    >
      <Box
        px="md"
        pb="md"
        pt="md"
        style={{
          height: "min(75vh, 720px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 8,
            border: "1px solid var(--mantine-color-slate-2)",
            background: "var(--mantine-color-slate-0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {kind === "pdf" && objectUrl && (
            <iframe
              src={objectUrl}
              title={file.name}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}

          {kind === "image" && objectUrl && (
            <img
              src={objectUrl}
              alt={file.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}

          {kind === "other" && (
            <Stack align="center" gap={6} py="xl">
              <ThemeIcon radius="xl" size={56} variant="light" color="slate">
                <IconFileText size={28} />
              </ThemeIcon>
              <Text fz="sm" fw={600} c="slate.7">
                Preview unavailable for this file type
              </Text>
              <Text fz="xs" c="slate.5">
                You can still download it to view the contents.
              </Text>
            </Stack>
          )}
        </Box>

        <Group justify="space-between" mt="md">
          <Text fz="xs" c="slate.5" truncate style={{ maxWidth: 320 }}>
            {file.name}
          </Text>
          <Group gap="xs">
            {objectUrl && (
              <Button
                component="a"
                href={objectUrl}
                download={file.name}
                variant="default"
                radius="md"
                size="xs"
                leftSection={<IconDownload size={14} />}
              >
                Download
              </Button>
            )}
            <Button
              variant="light"
              color="slate"
              radius="md"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={onClose}
            >
              Close
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}