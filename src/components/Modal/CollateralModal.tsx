import { Modal, TextInput, NumberInput, Select, Checkbox, Button, Group, SimpleGrid } from '@mantine/core';

export function CollateralModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Collateral"
      size="xl"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" mt="sm">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <TextInput
            label="Collateral Code"
            withAsterisk
            size="sm"
          />
          <TextInput
            label="Collateral Name"
            withAsterisk
            size="sm"
          />
          <NumberInput
            label="Haircut %"
            defaultValue={0.000}
            decimalScale={3}
            fixedDecimalScale
            size="sm"
          />
          <NumberInput
            label="Original Collateral Value"
            thousandSeparator
            size="sm"
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Select
            label="Collateral Type"
            withAsterisk
            data={['Real Estate', 'Vehicles', 'Government Bonds', 'Shares/Equities', 'Cash Deposits']}
            searchable
            size="sm"
          />
          <NumberInput
            label="Loan To Value Ratio"
            size="sm"
          />
          <Checkbox 
            label="Disabled" 
            size="sm" 
            mt="xs"
            color="indigoAlt.4"
          />
        </div>
      </SimpleGrid>

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