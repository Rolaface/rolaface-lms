import { Modal, TextInput, Button, Group, Stack, Text, Paper, ThemeIcon, Box } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { useEffect, useState, useRef } from 'react';

const DEFAULT_COMPONENTS = [
  { id: '1', name: 'Principal' },
  { id: '2', name: 'Interest' },
  { id: '3', name: 'Additional Interest' },
  { id: '4', name: 'Penalty' },
  { id: '5', name: 'Charges' },
];

export function LoanCollectionSequenceOrderModal({ opened, onClose, mode = 'add', data = null }) {
  const isView = mode === 'view';
  
  const title = 
    mode === 'add' ? 'New Collection Sequence' : 
    mode === 'edit' ? 'Edit Collection Sequence' : 
    'View Collection Sequence';

  // State
  const [sequenceName, setSequenceName] = useState('');
  const [components, setComponents] = useState(DEFAULT_COMPONENTS);

  // Drag and Drop Refs
  const dragItem = useRef();
  const dragOverItem = useRef();

  // Populate form on open
  useEffect(() => {
    if (opened && data) {
      setSequenceName(data.sequenceName || '');
      // If data has an order array, map it to our component objects
      if (data.order && data.order.length > 0) {
        const orderedComponents = data.order.map((name, index) => ({
          id: String(index + 1),
          name: name
        }));
        setComponents(orderedComponents);
      } else {
        setComponents(DEFAULT_COMPONENTS);
      }
    } else if (opened && mode === 'add') {
      setSequenceName('');
      setComponents(DEFAULT_COMPONENTS);
    }
  }, [opened, data, mode]);

  // Drag and Drop Handlers
  const dragStart = (e, position) => {
    dragItem.current = position;
  };

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const drop = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...components];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setComponents(copyListItems);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="lg"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <Stack gap="lg" mt="sm">
        <TextInput
          label="Sequence Name"
          placeholder="e.g. Standard Write-Off Liquidation Order"
          size="sm"
          className="w-full"
          value={sequenceName}
          onChange={(e) => setSequenceName(e.currentTarget.value)}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />

        <Box>
          <Text size="sm" fw={500} mb="xs">Component Offset Order</Text>
          <Text size="xs" c="dimmed" mb="md">
            {isView ? 'The defined sequence for component liquidation.' : 'Drag and drop the rows to change the collection sequence.'}
          </Text>

          <Paper withBorder radius="md" className="overflow-hidden bg-gray-50/50">
            {/* Header row */}
            <Group wrap="nowrap" gap="sm" px="md" py="xs" className="border-b border-gray-200 bg-gray-100/50">
              <Box w={24} /> {/* Spacer for grip icon */}
              <Text size="xs" fw={600} w={30} ta="center" c="gray.6">No.</Text>
              <Text size="xs" fw={600} c="gray.6">Demand Type</Text>
            </Group>

            {/* Draggable items */}
            <Stack gap={0}>
              {components.map((comp, index) => (
                <Group
                  key={comp.name}
                  wrap="nowrap"
                  gap="sm"
                  px="md"
                  py="sm"
                  className={`border-b border-gray-100 last:border-0 bg-white ${!isView && 'cursor-grab active:cursor-grabbing hover:bg-gray-50'}`}
                  draggable={!isView}
                  onDragStart={(e) => dragStart(e, index)}
                  onDragEnter={(e) => dragEnter(e, index)}
                  onDragEnd={drop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <ThemeIcon 
                    variant="subtle" 
                    color="gray" 
                    size="sm" 
                    className={`${isView ? 'opacity-0' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <IconGripVertical size={16} />
                  </ThemeIcon>
                  
                  <Text size="sm" fw={500} w={30} ta="center" c="gray.7">
                    {index + 1}
                  </Text>
                  
                  <Text size="sm" c="gray.9" className="flex-1">
                    {comp.name}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Stack>

      {/* Footer Actions */}
      <Group justify="flex-end" mt="xl" pt="md" className="border-t border-gray-100">
        <Button variant="default" onClick={onClose} size="sm">
          {isView ? 'Close' : 'Cancel'}
        </Button>
        {!isView && (
          <Button 
            size="sm" 
            bg="indigoAlt.4"
            className="bg-[#991B1B] hover:bg-red-900 transition-colors"
            onClick={onClose}
          >
            Save
          </Button>
        )}
      </Group>
    </Modal>
  );
}