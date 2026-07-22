import { 
  Box, 
  Button, 
  TextInput, 
  Select, 
  Radio, 
  Group, 
  Paper, 
  Table, 
  Badge, 
  ActionIcon,
  Text,
  Pagination
} from '@mantine/core';
import { IconEye, IconPencil, IconToggleRight, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { LoanProductModal } from '../../../components/Modal/LoanProductModal';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Personal Loan', code: 'PL_001', category: 'Retail', rate: '10.5%', status: 'ACTIVE' },
  { id: 2, name: 'Home Loan', code: 'HL_001', category: 'Mortgage', rate: '8.5%', status: 'ACTIVE' },
  { id: 3, name: 'Auto Loan', code: 'AL_001', category: 'Retail', rate: '9.0%', status: 'INACTIVE' },
];

export function LoanProduct() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box className="flex flex-col gap-6">
      {/* The newly integrated Modal Component */}
      <LoanProductModal opened={opened} onClose={close} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Text size="xl" fw={700} className="text-gray-900">Loan Products</Text>
        <Button 
          color="red"
          onClick={open} 
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={16} />}
        >
          Add Product
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="md" className="shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <TextInput placeholder="Product Name / Code" className="flex-1 min-w-[200px]" />
          <Select placeholder="All Categories" data={['Retail', 'Mortgage', 'Corporate']} className="w-40" />
          <Select placeholder="All Types" data={['Term Loan', 'Overdraft']} className="w-40" />
          
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

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            <Table.Tr>
              <Table.Th className="text-gray-600 font-semibold">Product Name</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Code</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Category</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Base Rate</Table.Th>
              <Table.Th className="text-gray-600 font-semibold">Status</Table.Th>
              <Table.Th className="text-gray-600 font-semibold text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {DUMMY_PRODUCTS.map((row) => (
              <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Table.Td className="font-medium text-gray-900">{row.name}</Table.Td>
                <Table.Td className="text-gray-600">{row.code}</Table.Td>
                <Table.Td className="text-gray-600">{row.category}</Table.Td>
                <Table.Td className="text-gray-600">{row.rate}</Table.Td>
                <Table.Td>
                  <Badge 
                    variant="light" 
                    color={row.status === 'ACTIVE' ? 'green' : 'red'}
                    className="font-semibold tracking-wider"
                  >
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
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Showing 1-3 of 3</span>
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <Select data={['10', '20', '50']} defaultValue="10" size="xs" className="w-16" />
            </div>
          </div>
          <Pagination total={1} color="red" size="sm" radius="sm" />
        </div>
      </Paper>
    </Box>
  );
}