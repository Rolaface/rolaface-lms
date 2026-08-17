import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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
  Badge,
  FileButton,
  List,UnstyledButton
} from "@mantine/core";

import {
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
} from "@tabler/icons-react";

import {
  colorVar,
  formatFileSize,
} from "../../../../utils/customer/utils";

import { DOC_TILES } from "../../../constants/customer/constants";
import type { UploadedDoc } from "../../../../types/customer/types";

interface DocumentsStepProps {
  uploadedDocs: Record<string, UploadedDoc>;
  setUploadedDocs: Dispatch<SetStateAction<Record<string, UploadedDoc>>>;
  isViewMode?: boolean;
}

export function DocumentsStep({
  uploadedDocs,
  setUploadedDocs,
  isViewMode,
}: DocumentsStepProps) {
  const [selectedKey, setSelectedKey] = useState<string>(DOC_TILES[0].key);
  const selected = DOC_TILES.find((t) => t.key === selectedKey)!;
  const uploaded = uploadedDocs[selectedKey];
  const SelectedIcon = selected.icon;

  const handleFileSelected = (key: string, file: File | null) => {
    if (!file) return;
    setUploadedDocs((prev) => {
      const existing = prev[key];
      if (existing?.previewUrl) URL.revokeObjectURL(existing.previewUrl);
      return {
        ...prev,
        [key]: {
          name: file.name,
          size: file.size,
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        },
      };
    });
  };

  const removeUpload = (key: string) =>
    setUploadedDocs((prev) => {
      const n = { ...prev };
      if (n[key]?.previewUrl) URL.revokeObjectURL(n[key].previewUrl!);
      delete n[key];
      return n;
    });

  return (
    <Group
      align="stretch"
      gap="md"
      wrap="nowrap"
      style={{ height: "100%", minHeight: 0 }}
    >
   
    {/* Left — document list, own scroll area, compact rows */}
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
  <Text size="xs" fw={800} tt="uppercase" c="slate.5" px="sm" py="xs" style={{ flexShrink: 0, letterSpacing: 0.5 }}>
    Required Documents
  </Text>
  <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" scrollbarSize={6}>
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
              background: isSelected ? "var(--mantine-color-brand-0)" : "transparent",
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
                <IconCheck size={13} color="var(--mantine-color-success-6)" style={{ flexShrink: 0 }} />
              ) : (
                <IconAlertCircle size={13} color="var(--mantine-color-danger-5)" style={{ flexShrink: 0 }} />
              )}
            </Group>
          </UnstyledButton>
        );
      })}
    </Stack>
  </ScrollArea>
</Paper>

      {/* Right — upload panel for selected document, own scroll area */}
      <ScrollArea style={{ flex: 1, minWidth: 0 }} type="auto" scrollbarSize={6}>
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

          <FileButton
            onChange={(file) => handleFileSelected(selected.key, file)}
            accept={selected.accept}
            disabled={isViewMode}
          >
            {(fileButtonProps) => (
              <Paper
                {...fileButtonProps}
                withBorder
                radius="lg"
                p="xl"
                ta="center"
                bg={uploaded ? "brand.0" : "slate.0"}
                style={{
                  borderStyle: "dashed",
                  borderColor: uploaded
                    ? colorVar("brand", 3)
                    : "var(--mantine-color-slate-3)",
                  cursor: isViewMode ? "default" : "pointer",
                }}
              >
                {uploaded?.previewUrl ? (
                  <Stack align="center" gap="sm">
                    <img
                      src={uploaded.previewUrl}
                      alt={uploaded.name}
                      style={{
                        maxWidth: 220,
                        maxHeight: 140,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `1px solid ${colorVar("brand", 2)}`,
                      }}
                    />
                    <Text size="sm" fw={600} c="slate.8">
                      {uploaded.name}
                    </Text>
                    <Text size="xs" c="slate.5">
                      {formatFileSize(uploaded.size)}
                    </Text>
                    {!isViewMode && (
                      <Button
                        variant="subtle"
                        color="danger"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeUpload(selected.key);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Stack align="center" gap="sm">
                    <ThemeIcon radius="xl" size={56} variant="light" color="brand">
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
                )}
              </Paper>
            )}
          </FileButton>

          <Paper withBorder radius="md" p="md" bg="info.0" style={{ borderColor: colorVar("info", 2) }}>
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
    </Group>
  );
}