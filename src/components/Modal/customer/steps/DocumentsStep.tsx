import { useState } from "react";

import {
  Box,
  Text,
  Title,
  Button,
  Paper,
  Stack,
  Group,
  ScrollArea,
  ThemeIcon,
  FileButton,
  List,
  UnstyledButton,
} from "@mantine/core";

import { IconUpload, IconCheck, IconAlertCircle, IconInfoCircle, IconEye, IconTrash } from "@tabler/icons-react";

import { colorVar, formatFileSize } from "../../../../utils/customer/utils";

import { DOC_TILES } from "../../../constants/customer/constants";
import type { UploadedDoc } from "../../../../types/customer/types";
import { DocumentPreviewModal, docKindIcon } from "./DocumentPreviewModal";

interface DocumentsStepProps {
  uploadedDocs: Record<string, UploadedDoc>;
  uploadDoc: (key: string, file: File) => void;
  removeUpload: (key: string) => void;
  uploadingKey?: string | null;
  isViewMode?: boolean;
}

interface UploadedDocRowProps {
  doc: UploadedDoc;
  onPreview: () => void;
  onRemove: () => void;
  isViewMode?: boolean;
}

function UploadedDocRow({ doc, onPreview, onRemove, isViewMode }: UploadedDocRowProps) {
  const RowIcon = docKindIcon(doc);

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
          <ThemeIcon radius="md" size={38} variant="light" color="brand">
            <RowIcon size={20} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text fz="sm" fw={600} c="slate.8" truncate>
              {doc.name}
            </Text>
            <Text fz="xs" c="slate.5">
              {formatFileSize(doc.size)}
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
          {!isViewMode && (
            <Button
              variant="subtle"
              color="danger"
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
          )}
        </Group>
      </Group>
    </Paper>
  );
}

export function DocumentsStep({
  uploadedDocs,
  uploadDoc,
  removeUpload,
  uploadingKey,
  isViewMode,
}: DocumentsStepProps) {
  const [selectedKey, setSelectedKey] = useState<string>(DOC_TILES[0].key);
  const selected = DOC_TILES.find((t) => t.key === selectedKey)!;
  const uploaded = uploadedDocs[selectedKey];
  const SelectedIcon = selected.icon;

  const [previewOpened, setPreviewOpened] = useState(false);

  return (
    <Group
      align="stretch"
      gap="md"
      wrap="nowrap"
      style={{ height: "100%", minHeight: 0 }}
    >
      <Paper
        withBorder
        radius="md"
        bg="white"
        w={240}
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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
        <ScrollArea
          style={{ flex: 1, minHeight: 0 }}
          type="auto"
          scrollbarSize={6}
        >
          <Stack gap={2} px={6} pb={6}>
            {DOC_TILES.map((tile) => {
              const doc = uploadedDocs[tile.key];
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
                      ? `1px solid ${colorVar("brand", 4)}`
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
                    {doc ? (
                      <IconCheck
                        size={13}
                        color="var(--mantine-color-success-6)"
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <IconAlertCircle
                        size={13}
                        color="var(--mantine-color-danger-5)"
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        </ScrollArea>
      </Paper>

      <ScrollArea
        style={{ flex: 1, minWidth: 0 }}
        type="auto"
        scrollbarSize={6}
      >
        <Stack gap="md" pr="xs">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon radius="md" size={40} variant="light" color="brand">
              <SelectedIcon size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4} c="slate.8">
                Upload {selected.label}
              </Title>
              <Text size="sm" c="slate.5">
                {selected.description}
              </Text>
            </Box>
          </Group>

          {uploaded ? (
            <Stack gap="xs">
              <Text fz="xs" fw={700} c="slate.5" tt="uppercase">
                Uploaded Document
              </Text>
              <UploadedDocRow
                doc={uploaded}
                onPreview={() => setPreviewOpened(true)}
                onRemove={() => removeUpload(selected.key)}
                isViewMode={isViewMode}
              />
            </Stack>
          ) : (
            <FileButton
              onChange={(file) => file && uploadDoc(selected.key, file)}
              accept={selected.accept}
              disabled={isViewMode || uploadingKey === selected.key}
            >
              {(fileButtonProps) => (
                <Paper
                  {...fileButtonProps}
                  withBorder
                  radius="lg"
                  p="xl"
                  ta="center"
                  bg="slate.0"
                  style={{
                    borderStyle: "dashed",
                    borderColor: "var(--mantine-color-slate-3)",
                    cursor: isViewMode ? "default" : "pointer",
                  }}
                >
                  <Stack align="center" gap="sm">
                    <ThemeIcon
                      radius="xl"
                      size={56}
                      variant="light"
                      color="brand"
                    >
                      <IconUpload size={26} />
                    </ThemeIcon>
                    <Text size="sm" fw={700} c="slate.8">
                      Click to upload or drag and drop
                    </Text>
                    <Text size="xs" c="slate.5">
                      SVG, PNG, JPG or PDF (max. 5MB)
                    </Text>
                    {!isViewMode && (
                      <Button radius="md" size="xs" color="brand">
                        Browse Files
                      </Button>
                    )}
                  </Stack>
                </Paper>
              )}
            </FileButton>
          )}

          <Paper
            withBorder
            radius="md"
            p="md"
            bg="info.0"
            style={{ borderColor: colorVar("info", 2) }}
          >
            <Group gap="xs" mb="xs">
              <IconInfoCircle size={15} color="var(--mantine-color-info-6)" />
              <Text size="xs" fw={700} c="info.7">
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
      </ScrollArea>

      <DocumentPreviewModal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        doc={uploaded ?? null}
        title={selected.label}
      />
    </Group>
  );
}