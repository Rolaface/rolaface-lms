import { useEffect, useRef, useState } from "react";
import { ActionIcon, Box, Button, Group, Modal, Text, useMantineTheme } from "@mantine/core";
import { IconDownload, IconFileText, IconX } from "@tabler/icons-react";
import type { jsPDF } from "jspdf";

interface PreviewState {
  url: string;
  title: string;
  fileName: string;
}

interface PdfPreviewModalProps {
  preview: PreviewState | null;
  onClose: () => void;
}

export function PdfPreviewModal({ preview, onClose }: PdfPreviewModalProps) {
  const theme = useMantineTheme();

  return (
  <Modal
  opened={!!preview}
  onClose={onClose}
  size="xl"
  centered
  radius="lg"
  padding={0}                    // added
  zIndex={400}
  withCloseButton={false}        // added
  styles={{ content: { overflow: "hidden" }, body: { padding: 0 } }}   
>
      {preview && (
        <>
        <Group gap="sm" wrap="nowrap" px="xl" py="md" style={{ background: theme.other.brandGradient }}>
  <Box
    style={{
      width: 36,
      height: 36,
      flexShrink: 0,
      borderRadius: "var(--mantine-radius-md)",
      background: "var(--mantine-color-white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <IconFileText size={18} color="var(--mantine-color-brand-6)" />
  </Box>
  <Text fw={700} fz="md" c="white" lh={1.3}>
    {preview.title}
  </Text>
  <ActionIcon variant="subtle" color="white" ml="auto" aria-label="Close" onClick={onClose}>
    <IconX size={18} />
  </ActionIcon>
</Group>
          <Box
            style={{
              height: "70vh",
              border: "1px solid var(--mantine-color-slate-2)",
              borderRadius: "var(--mantine-radius-md)",
              overflow: "hidden",
            }}
          >
            <iframe
              src={preview.url}
              title={preview.title}
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </Box>
          <Group
  justify="flex-end"
  gap="xs"
  px="xl"
  py="md"
  style={{
    background: "var(--mantine-color-slate-0)",
    borderTop: "1px solid var(--mantine-color-slate-2)",
  }}
>
            <Button radius="xl" variant="default" onClick={onClose}>
              Close
            </Button>
            <Button
              radius="xl"
              color="brand"
              component="a"
              href={preview.url}
              download={preview.fileName}
              leftSection={<IconDownload size={14} />}
            >
              Download PDF
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}

/** Opens a jsPDF document in the preview modal. Render `modal` once in the tab. */
export function usePdfPreview() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const urlRef = useRef<string | null>(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(() => revoke, []);

  const open = (doc: jsPDF, title: string, fileName: string) => {
    revoke();
    const url = URL.createObjectURL(doc.output("blob"));
    urlRef.current = url;
    setPreview({ url, title, fileName });
  };

  const close = () => {
    revoke();
    setPreview(null);
  };

  return {
    open,
    modal: <PdfPreviewModal preview={preview} onClose={close} />,
  };
}