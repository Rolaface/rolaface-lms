import { useEffect, useState } from "react";
import { Box, Text, Button, Stack, ThemeIcon, Group, Modal, Loader } from "@mantine/core";
import {
  IconDownload,
  IconFileText,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";

const ERP_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") as string;

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
  sourceUrl?: string | null;
}

export function DocumentPreviewModal({
  opened,
  onClose,
  file,
  title,
  sourceUrl,
}: DocumentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when closed
    if (!opened) {
      setObjectUrl(null);
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    const loadPreview = async () => {
      // 1. Fetching a previously uploaded file from the backend securely
      if (sourceUrl) {
        try {
          setIsLoading(true);
          setErrorMsg(null);
          
          const fileUrl = `${ERP_BASE}${sourceUrl}`;
          const response = await fetch(fileUrl, { credentials: 'include' });

          if (!response.ok) {
            throw new Error(`Failed to load: HTTP ${response.status}`);
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error("Received HTML instead of a file. Check proxy/auth.");
          }

          const blob = await response.blob();
          if (!isMounted) return;

          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        } catch (err: any) {
          if (isMounted) {
            console.error('Preview error:', err);
            setErrorMsg(err.message || "Failed to load document.");
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } 
      // 2. Generating a local preview for a newly selected File in the form
      else if (file) {
        createdUrl = URL.createObjectURL(file);
        setObjectUrl(createdUrl);
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [opened, file, sourceUrl]);

  if (!file && !sourceUrl) return null;

   const kind = file ? getFileKind(file) : (sourceUrl?.match(/\.(jpeg|jpg|png|gif)$/i) ? 'image' : 'pdf');
  const displaySize = file ? formatFileSize(file.size) : "Remote file";
  const displayExt = file ? getFileExtLabel(file) : (sourceUrl?.split('.').pop()?.toUpperCase() || "FILE");

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
            {displayExt} • {displaySize}
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
          {isLoading && (
            <Stack align="center" gap={6}>
              <Loader color="brand" />
              <Text fz="sm" c="slate.6">Loading document...</Text>
            </Stack>
          )}

          {!isLoading && errorMsg && (
            <Text c="red" fw={500}>{errorMsg}</Text>
          )}

          {!isLoading && !errorMsg && objectUrl && kind === "pdf" && (
            <iframe
              src={objectUrl}
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}

          {!isLoading && !errorMsg && objectUrl && kind === "image" && (
            <img
              src={objectUrl}
              alt={title}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}

          {!isLoading && !errorMsg && !objectUrl && kind === "other" && (
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
            {file ? file.name : (sourceUrl?.split('/').pop() || 'document')}
          </Text>
          <Group gap="xs">
            {objectUrl && !errorMsg && (
              <Button
                component="a"
                href={objectUrl}
                download={file ? file.name : (sourceUrl?.split('/').pop() || 'document')}
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