import { useEffect, useRef, useState } from "react";
import { Box, Button, Group, Modal, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
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
  return (
    <Modal
      opened={!!preview}
      onClose={onClose}
      size="xl"
      centered
      radius="lg"
      zIndex={400}
      title={
        <Text fw={700} c="slate.8">
          {preview?.title}
        </Text>
      }
    >
      {preview && (
        <>
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
          <Group justify="flex-end" mt="md" gap="xs">
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