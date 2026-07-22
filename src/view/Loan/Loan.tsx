import { Box, Tabs, Title } from '@mantine/core';
import { LoanProduct } from './Product/LoanProduct';
import { LoanCategory } from './LoanCategory/LoanCategory';
import { LoanDemandOffset } from './LoanDemandOffset/LoanDemandOffset';

export function Loan() {
  return (
    <Box className="w-full p-8">
      <Title order={2} className="text-gray-900 mb-6 font-semibold">
        Loan Management
      </Title>

      <Tabs 
        defaultValue="product" 
        classNames={{
          list: 'border-b border-gray-200 mb-6 gap-4',
          tab: 'text-gray-600 hover:text-gray-900 data-[active]:text-[#2563EB] data-[active]:border-[#2563EB] px-4 py-3 font-medium transition-colors',
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="product">Product</Tabs.Tab>
          <Tabs.Tab value="category">Category</Tabs.Tab>
          <Tabs.Tab value="demandOffset">DemandOffset</Tabs.Tab>
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