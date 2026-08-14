import {
  ActionIcon,
  Box,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconGripVertical, IconListNumbers, IconX , IconMinus} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { ModalFooter } from "../shared/ModalFooter";
import { useCollectionOrderForm } from "../../hooks/CollectionOrder/useCollectionOrderForm";
import { openCommonModal } from "./AlertModal";
import type { CollectionOrderListItem } from "../../types/collectionOrder";

export interface LoanCollectionSequenceOrderModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  mode?: "add" | "edit" | "view";
  data?: CollectionOrderListItem | null;
  onSaved: () => void;
}
export function LoanCollectionSequenceOrderModal({
  opened,
  onClose,
  onMinimize,
  mode = "add",
  data = null,
  onSaved,
}: LoanCollectionSequenceOrderModalProps) {
  const isView = mode === "view";

  const title =
    mode === "add" ? "New Collection Sequence" : mode === "edit" ? "Edit Collection Sequence" : "View Collection Sequence";

  const description =
    mode === "view"
      ? "Viewing the defined sequence for component liquidation."
      : "Define and order the collection sequence for loan components.";

  const {
    sequenceName,
    setSequenceName,
    components,
    reorder,
    loadingDetail,
    isSaving,
    handleSave,
    isNameEditable,
  } = useCollectionOrderForm({ opened, mode, data, onSaved, onClose });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => setDraggedIndex(null), 200);
  };
  const handleMinimize = () => {
    onMinimize?.();
  };
  const dragStart = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    setTimeout(() => setDraggedIndex(position), 0);
  };

  const dragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const drop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      reorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIndex(null);
  };

  // ---------- ALERT HELPERS (same pattern as LoanClassificationModal) ----------
  const showErrorMessage = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body,
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const handleSubmit = () => {
    if (!sequenceName.trim()) {
      showErrorMessage("Validation Error", "Collection Sequence Name is required.");
      return;
    }
    if (!components || components.length === 0) {
      showErrorMessage("Validation Error", "At least one component is required in the sequence.");
      return;
    }

    handleSave();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={600}
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: "flex", flexDirection: "column" },
      }}
    >
      <Box bg="white">
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: "1px solid var(--mantine-color-brand-7)" }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconListNumbers size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                {title}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {description}
              </Text>
            </Box>
          </Group>
<Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleMinimize}
              aria-label="Minimize"
            >
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={handleClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        <Box px="xl" py="lg" bg="slate.0">
          <Stack gap="md">
            <TextInput
              size="sm"
              radius="md"
              label="Collection Sequence Name"
              placeholder="e.g. Standard Write-Off Liquidation Sequence"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.currentTarget.value)}
              readOnly={!isNameEditable}
              variant={isNameEditable ? "default" : "filled"}
              withAsterisk={isNameEditable}
              disabled={loadingDetail}
              description={mode === "edit" ? "Name cannot be changed after creation." : undefined}
              styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
            />

            <Box>
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600} c="slate.7">
                  Component Offset Sequence
                </Text>
                {loadingDetail && <Loader size="xs" color="brand" />}
              </Group>
              {!isView && (
                <Text size="xs" c="slate.5" mb="xs">
                  Drag and drop the rows to change the collection sequence.
                </Text>
              )}

              <Paper
                radius="md"
                mt={isView ? 8 : 0}
                style={{ overflow: "hidden", border: "1px solid var(--mantine-color-slate-2)", boxShadow: "var(--mantine-shadow-xs)" }}
              >
                <Group
                  gap="sm"
                  wrap="nowrap"
                  px="md"
                  py={8}
                  style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-slate-0)" }}
                >
                  <Box w={20} />
                  <Text size="xs" fw={700} w={30} ta="center" c="slate.5">
                    No.
                  </Text>
                  <Text size="xs" fw={700} c="slate.5" style={{ flex: 1 }}>
                    Demand Type
                  </Text>
                </Group>

                <Stack gap={0}>
                  {components.map((comp, index) => {
                    const isDragging = draggedIndex === index;
                    return (
                      <Group
                        key={comp.id}
                        gap="sm"
                        wrap="nowrap"
                        px="md"
                        py={10}
                        draggable={!isView}
                        onDragStart={(e) => dragStart(e, index)}
                        onDragEnter={(e) => dragEnter(e, index)}
                        onDragEnd={drop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                          borderBottom: index < components.length - 1 ? "1px solid var(--mantine-color-slate-1)" : "none",
                          background: isDragging ? "var(--mantine-color-slate-0)" : "var(--mantine-color-white)",
                          opacity: isDragging ? 0.35 : 1,
                          cursor: isView ? "default" : "grab",
                          transition: "background-color 120ms ease, opacity 120ms ease",
                        }}
                      >
                        <ThemeIcon
                          variant="subtle"
                          color={isView ? "slate" : "brand"}
                          size="sm"
                          style={{ opacity: isView ? 0 : 0.5, cursor: isView ? "default" : "grab" }}
                        >
                          <IconGripVertical size={16} />
                        </ThemeIcon>
                        <Text size="sm" fw={600} w={30} ta="center" c="slate.4">
                          {index + 1}
                        </Text>
                        <Text size="sm" fw={500} c="slate.7" style={{ flex: 1 }}>
                          {comp.name}
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Box>

        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel="Save "
          submitLoading={isSaving}
        />
      </Box>
    </Modal>
  );
}