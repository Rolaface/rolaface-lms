import { Box, Group, Tabs, Text, Title } from '@mantine/core';
import { IconBox, IconCategory, IconArrowsExchange } from '@tabler/icons-react';
import { LoanProduct } from './Product/LoanProduct';
import { LoanCategory } from './LoanCategory/LoanCategory';
import { LoanDemandOffset } from './LoanDemandOffset/LoanDemandOffset';

export function Loan() {
  return (
    <Box className="w-full p-8 bg-[#F8F9FC] min-h-screen">
      {/* Page header */}
      <Group justify="space-between" align="flex-start" className="mb-6">
        <Box>
          <Title order={2} className="text-gray-900 font-semibold">
            Loan Management
          </Title>
          <Text size="sm" c="dimmed" className="mt-1">
            Create, manage and configure loan products
          </Text>
        </Box>
      </Group>

      <Tabs
        defaultValue="product"
        classNames={{
          root: 'w-full',
          list: 'border-b border-gray-200 mb-6 gap-2',
          tab: 'text-gray-500 hover:text-gray-900 hover:bg-transparent data-[active]:text-brand-6 data-[active]:border-brand-6 px-1 mr-6 py-3 font-medium text-sm transition-colors border-b-2 border-transparent rounded-none',
          tabLabel: 'flex items-center gap-2',
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="product" leftSection={<IconBox size={16} />}>
            Products
          </Tabs.Tab>
          <Tabs.Tab value="category" leftSection={<IconCategory size={16} />}>
            Categories
          </Tabs.Tab>
          <Tabs.Tab value="demandOffset" leftSection={<IconArrowsExchange size={16} />}>
            Demand Offset
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="product">
          <LoanProduct />
        </Tabs.Panel>

        <Tabs.Panel value="category">
          <LoanCategory />
        </Tabs.Panel>

        <Tabs.Panel value="demandOffset">
          <LoanDemandOffset />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}