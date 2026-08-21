import { Box, Text, Button, Stack, ThemeIcon, Group, Modal } from "@mantine/core";
import {
  IconDownload,
  IconFileText,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";

import { formatFileSize } from "../../../../utils/customer/utils";
import type { UploadedDoc } from "../../../../types/customer/types";

function getDocKind(doc: UploadedDoc): "pdf" | "image" | "other" {
  const name = doc.name?.toLowerCase() ?? "";
  if (name.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|svg)$/.test(name)) return "image";
  return "other";
}

function getDocExtLabel(doc: UploadedDoc) {
  const parts = doc.name.split(".");
  if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
  return "FILE";
}

export function docKindIcon(doc: UploadedDoc) {
  return getDocKind(doc) === "image" ? IconPhoto : IconFileText;
}

interface DocumentPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  doc: UploadedDoc | null;
  title: string;
}

export function DocumentPreviewModal({
  opened,
  onClose,
  doc,
  title,
}: DocumentPreviewModalProps) {
  if (!doc) return null;

  const kind = getDocKind(doc);
  const previewUrl = doc.previewUrl;

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
            {getDocExtLabel(doc)} • {formatFileSize(doc.size)}
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
          {kind === "pdf" && previewUrl && (
            <iframe
              src={previewUrl}
              title={doc.name}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}

          {kind === "image" && previewUrl && (
            <img
              src={previewUrl}
              alt={doc.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}

          {(kind === "other" || !previewUrl) && (
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
            {doc.name}
          </Text>
          <Group gap="xs">
            {previewUrl && (
              <Button
                component="a"
                href={previewUrl}
                download={doc.name}
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