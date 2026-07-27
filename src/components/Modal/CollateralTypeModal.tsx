import { Modal, TextInput, NumberInput, Checkbox, Button, Group } from '@mantine/core';

export function CollateralTypeModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Collateral Type"
      size="xl"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-end gap-4 mt-4">
        <TextInput
          label="Collateral Type"
          withAsterisk
          placeholder="e.g. Real Estate"
          size="sm"
          className="flex-1"
        />
        
        <NumberInput
          label="Haircut %"
          defaultValue={0.000}
          decimalScale={3}
          fixedDecimalScale
          size="sm"
          className="flex-1"
        />
        
        <NumberInput
          label="Loan To Value Ratio"
          placeholder="0"
          size="sm"
          className="flex-1"
        />

        <div className="pb-[6px]">
          <Checkbox 
            label="Disabled" 
            size="sm" 
            color="indigoAlt.4"
          />
        </div>
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