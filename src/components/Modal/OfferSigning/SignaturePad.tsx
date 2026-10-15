import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Group, Modal, Text } from "@mantine/core";

const WIDTH = 560;
const HEIGHT = 200;

export function SignaturePad({
  opened,
  signer,
  fileName,
  saving,
  onClose,
  onSave,
}: {
  opened: boolean;
  signer: string;
  fileName: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1e1b4b";
  }, []);

  useEffect(() => {
    if (opened) setEmpty(true);
  }, [opened]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) * WIDTH) / rect.width, y: ((event.clientY - rect.top) * HEIGHT) / rect.height };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
    setEmpty(false);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, WIDTH, HEIGHT);
    setEmpty(true);
  };

  const save = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onSave(new File([blob], `${fileName}.png`, { type: "image/png" }));
    }, "image/png");
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={600}
      radius="md"
      zIndex={2000}
      title={<Text fw={700} fz={15} c="slate.9">Sign as {signer}</Text>}
    >
      <Text fz={12} c="slate.5" mb={8}>
        Draw the signature with a mouse, trackpad or finger.
      </Text>
      <Box
        style={{
          border: "1.5px dashed var(--mantine-color-slate-3)",
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-slate-0)",
          position: "relative",
        }}
      >
        <canvas
          ref={setupCanvas}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
          style={{ width: "100%", height: HEIGHT, display: "block", touchAction: "none", cursor: "crosshair" }}
        />
        <Box style={{ position: "absolute", left: 24, right: 24, bottom: 36, borderBottom: "1px solid var(--mantine-color-slate-3)", pointerEvents: "none" }} />
      </Box>
      <Group justify="space-between" mt="md">
        <Button variant="subtle" color="gray" radius="md" onClick={clear} disabled={empty || saving}>
          Clear
        </Button>
        <Group gap="xs">
          <Button variant="default" radius="md" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button color="green" radius="md" onClick={save} disabled={empty} loading={saving}>
            Save signature
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
