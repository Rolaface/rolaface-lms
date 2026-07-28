import { useState, useEffect, useRef } from "react";
import { Modal, Box, Text, TextInput, Button, Group, Paper, ThemeIcon, Stack } from "@mantine/core";
import { IconGripVertical, IconListNumbers, IconX } from "@tabler/icons-react";

export interface ComponentItem {
  id: string;
  name: string;
}

interface LoanCollectionSequenceOrderModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: "add" | "edit" | "view";
  data?: { sequenceName?: string; order?: string[] } | null;
}

const DEFAULT_COMPONENTS: ComponentItem[] = [
  { id: "1", name: "Principal" },
  { id: "2", name: "Interest" },
  { id: "3", name: "Additional Interest" },
  { id: "4", name: "Penalty" },
  { id: "5", name: "Charges" },
];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export function LoanCollectionSequenceOrderModal({
  opened,
  onClose,
  mode = "add",
  data = null,
}: LoanCollectionSequenceOrderModalProps) {
  const isView = mode === "view";

  const title =
    mode === "add"
      ? "New Collection Order"
      : mode === "edit"
      ? "Edit Collection Order"
      : "View Collection Order";

  const description =
    mode === "view"
      ? "Viewing the defined sequence for component liquidation."
      : "Define and order the collection sequence for loan components.";

  // State
  const [sequenceName, setSequenceName] = useState("");
  const [components, setComponents] = useState<ComponentItem[]>(DEFAULT_COMPONENTS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Populate form on open
  useEffect(() => {
    if (opened && data) {
      setSequenceName(data.sequenceName || "");
      if (data.order && data.order.length > 0) {
        const orderedComponents = data.order.map((name, index) => ({
          id: String(index + 1),
          name: name,
        }));
        setComponents(orderedComponents);
      } else {
        setComponents(DEFAULT_COMPONENTS);
      }
    } else if (opened && mode === "add") {
      setSequenceName("");
      setComponents(DEFAULT_COMPONENTS);
    }
  }, [opened, data, mode]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDraggedIndex(null);
    }, 200);
  };

  // Drag and Drop Handlers
  const dragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // Small timeout ensures the drag ghost image generates before we apply the opacity class
    setTimeout(() => {
      setDraggedIndex(position);
    }, 0);
  };

  const dragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const drop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...components];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      setComponents(copyListItems);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIndex(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="600px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconListNumbers size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                {description}
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={handleClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col gap-5">
          <TextInput
            size="xs"
            label="Collection Order Name"
            placeholder="e.g. Standard Write-Off Liquidation Order"
            value={sequenceName}
            onChange={(e) => setSequenceName(e.currentTarget.value)}
            readOnly={isView}
            variant={isView ? "filled" : "default"}
            classNames={labelClass}
            withAsterisk={!isView}
          />

          <Box>
            <div className="mb-2">
              <Text size="sm" fw={600} className="text-gray-700">
                Component Offset Order
              </Text>
              {!isView && (
                <Text size="xs" c="dimmed">
                  Drag and drop the rows to change the collection sequence.
                </Text>
              )}
            </div>

            <Paper withBorder radius="md" className="overflow-hidden bg-white shadow-sm border-gray-200">
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-gray-50/80">
                <div className="w-[20px]" /> {/* Spacer for grip icon */}
                <Text size="xs" fw={600} w={30} ta="center" className="text-gray-500">
                  No.
                </Text>
                <Text size="xs" fw={600} className="text-gray-500 flex-1">
                  Demand Type
                </Text>
              </div>

              {/* Draggable items */}
              <Stack gap={0}>
                {components.map((comp, index) => {
                  const isDragging = draggedIndex === index;

                  return (
                    <div
                      key={comp.name}
                      draggable={!isView}
                      onDragStart={(e) => dragStart(e, index)}
                      onDragEnter={(e) => dragEnter(e, index)}
                      onDragEnd={drop}
                      onDragOver={(e) => e.preventDefault()}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 bg-white transition-all
                        ${!isView ? "cursor-grab active:cursor-grabbing hover:bg-indigo-50/30" : ""}
                        ${isDragging ? "opacity-30 bg-gray-50 scale-[0.99]" : ""}
                      `}
                    >
                      <ThemeIcon
                        variant="subtle"
                        color={isView ? "gray" : "indigo"}
                        size="sm"
                        className={`${isView ? "opacity-0" : "opacity-40 cursor-grab active:cursor-grabbing hover:opacity-100"}`}
                      >
                        <IconGripVertical size={16} />
                      </ThemeIcon>

                      <Text size="sm" fw={600} w={30} ta="center" className="text-gray-400">
                        {index + 1}
                      </Text>

                      <Text size="sm" fw={500} className="text-gray-700 flex-1">
                        {comp.name}
                      </Text>
                    </div>
                  );
                })}
              </Stack>
            </Paper>
          </Box>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
          <Button size="xs" variant="default" onClick={handleClose} className="font-semibold px-5">
            {isView ? "Close" : "Cancel"}
          </Button>

          {!isView && (
            <Button
              size="xs"
              onClick={() => {
                handleClose();
              }}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Save Sequence
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
}