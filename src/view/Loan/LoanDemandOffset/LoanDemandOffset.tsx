import { 
  Box, Button, TextInput, Radio, Group, Paper, Table, Badge, ActionIcon, Text, Pagination 
} from '@mantine/core';
import { IconEye, IconPencil, IconToggleRight, IconPlus } from '@tabler/icons-react';

const DUMMY_OFFSETS = [
  { id: 1, name: 'Standard Collection', components: 'Principal, Interest', status: 'ACTIVE' },
  { id: 2, name: 'Penalty First Offset', components: 'Penalty, Interest, Principal', status: 'ACTIVE' },
  { id: 3, name: 'NPA Recovery Offset', components: 'Charges, Principal', status: 'INACTIVE' },
];

export function LoanDemandOffset() {
  return (
    <Box className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Text size="xl" fw={700} className="text-gray-900">Demand Offsets</Text>
        <Button 
          color="red" 
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={16} />}
        >
          Add Offset
        </Button>
      </div>

      <Paper withBorder radius="md" p="md" className="shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <TextInput placeholder="Search Offset Name / Component" className="flex-1 min-w-[200px]" />
          <Radio.Group name="status" defaultValue="all">
            <Group mt="xs" className="mb-2.5">
              <Radio value="all" label="All" color="red" />
              <Radio value="active" label="Active" color="red" />
              <Radio value="inactive" label="Inactive" color="red" />
            </Group>
          </Radio.Group>
          <Button variant="default" className="ml-auto px-6">Reset</Button>
        </div>
      </Paper>

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            <Table.Tr>
              <Table.Th className="text-gray-600 font-semibold">Offset Name</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Components</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Status</Table.Th>
              <Table.Th className="text-gray-600 font-semibold text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {DUMMY_OFFSETS.map((row) => (
              <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Table.Td className="font-medium text-gray-900">{row.name}</Table.Td>
                <Table.Td className="text-gray-600">{row.components}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={row.status === 'ACTIVE' ? 'green' : 'red'}>
                    {row.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end" gap="xs">
                    <ActionIcon variant="subtle" color="gray"><IconEye size={18} /></ActionIcon>
                    <ActionIcon variant="subtle" color="blue"><IconPencil size={18} /></ActionIcon>
                    <ActionIcon variant="subtle" color={row.status === 'ACTIVE' ? 'green' : 'gray'}>
                      <IconToggleRight size={22} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Showing 1-3 of 3</span>
          </div>
          <Pagination total={1} color="red" size="sm" radius="sm" />
        </div>
      </Paper>
    </Box>
  );
}