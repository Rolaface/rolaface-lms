import { Box, Tabs, Title } from '@mantine/core';
import { Customer } from './CustomerCreate';
 
export function Customers() {
  return (
    <Box className="w-full p-8">
      <Title order={2} className="text-gray-900 mb-6 font-semibold">
       Create Customer
      </Title>

      <Tabs 
        defaultValue="CustomerCreate" 
        classNames={{
          list: 'border-b border-gray-200 mb-6 gap-4',
          tab: 'text-gray-600 hover:text-gray-900 data-[active]:text-[#2563EB] data-[active]:border-[#2563EB] px-4 py-3 font-medium transition-colors',
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="CustomerCreate">Customer</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="CustomerCreate">
          <Customer />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}