import {
  SimpleGrid,
  Text,
  Button,
  Paper,
  Stack,
  Center,
  FileButton,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { colorVar, formatFileSize } from "../../../../utils/customer/utils";
import { DOC_TILES } from "../../../constants/customer/constants";
import type { UploadedDoc } from "../../../../types/customer/types";

interface DocumentsStepProps {
  uploadedDocs: Record<string, UploadedDoc>;
  setUploadedDocs: React.Dispatch<
    React.SetStateAction<Record<string, UploadedDoc>>
  >;
  isViewMode?: boolean;
}

export function DocumentsStep({
  uploadedDocs,
  setUploadedDocs,
  isViewMode,
}: DocumentsStepProps) {
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
    <PlainCard>
      <SectionHeader
        icon={IconUpload}
        title="Documents"
        badge="OPTIONAL"
        description="Click a tile to choose a file from your device"
        accent="indigoAlt"
      />
      <SimpleGrid cols={3} spacing="sm">
        {DOC_TILES.map((tile) => {
          const uploaded = uploadedDocs[tile.key];
          const TileIcon = tile.icon;
          return (
            <FileButton
              key={tile.key}
              onChange={(file) => handleFileSelected(tile.key, file)}
              accept={tile.accept}
              disabled={isViewMode}
            >
              {(fileButtonProps) => (
                <Paper
                  {...fileButtonProps}
                  withBorder
                  radius="lg"
                  p="md"
                  ta="center"
                  bg={uploaded ? "brand.0" : "white"}
                  style={{
                    borderColor: uploaded ? colorVar("brand", 1) : "var(--mantine-color-slate-3)",
                    borderStyle: uploaded ? "solid" : "dashed",
                    cursor: isViewMode ? "default" : "pointer",
                  }}
                >
                  {uploaded?.previewUrl ? (
                    <img
                      src={uploaded.previewUrl}
                      alt={uploaded.name}
                      style={{
                        width: "100%",
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: 8,
                        border: `1px solid ${colorVar("brand", 1)}`,
                      }}
                    />
                  ) : (
                    <Center mb="xs">
                      <TileIcon
                        size={18}
                        color={uploaded ? colorVar("brand", 6) : "var(--mantine-color-slate-4)"}
                      />
                    </Center>
                  )}
                  <Text size="xs" fw={700} c="slate.8">
                    {tile.label}
                  </Text>
                  <Text size="xxs" c="slate.5" mt="xs" truncate>
                    {uploaded
                      ? `${uploaded.name} \u00b7 ${formatFileSize(uploaded.size)}`
                      : tile.hint}
                  </Text>
                  {uploaded && !isViewMode && (
                    <Stack gap="xs" mt="xs">
                      <Button
                        variant="transparent"
                        size="compact-xs"
                        p={0}
                        c="danger.6"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeUpload(tile.key);
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  )}
                </Paper>
              )}
            </FileButton>
          );
        })}
      </SimpleGrid>
    </PlainCard>
  );
}
