import { Modal, TextInput, Button, Group } from '@mantine/core';

export function LoanClassificationModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Loan Classification"
      size="lg"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-end gap-4 mt-4">
        <TextInput
          label="Classification Code"
          withAsterisk
          placeholder="e.g. STD"
          size="sm"
          className="flex-1"
        />
        
        <TextInput
          label="Classification Name"
          withAsterisk
          placeholder="e.g. Standard"
          size="sm"
          className="flex-1"
        />
      </div>

      {/* Footer Actions */}
      <Group justify="flex-end" mt="xl" pt="md" className="border-t border-gray-100">
        <Button variant="default" onClick={onClose} size="sm">
          Cancel
        </Button>
        <Button 
          size="sm" 
          bg="indigoAlt.4"
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          onClick={onClose}
        >
          Save
        </Button>
      </Group>
    </Modal>
  );
}