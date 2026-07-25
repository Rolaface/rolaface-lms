import { Box, Tabs, Title } from '@mantine/core';
import { LoanDisbursement } from './LoanDisbursement/LoanDisbursement';
import { LoanWriteOff } from './LoanWriteOff/LoanWriteOff';
// import { LoanCategory } from './LoanCategory/LoanCategory';
 
export function Operations() {
  return (
    <Box className="w-full p-8">
      <Title order={2} className="text-gray-900 mb-6 font-semibold">
       Loan Operations
      </Title>

      <Tabs 
        defaultValue="product" 
        classNames={{
          list: 'border-b border-gray-200 mb-6 gap-4',
          tab: 'text-gray-600 hover:text-gray-900 data-[active]:text-[#2563EB] data-[active]:border-[#2563EB] px-4 py-3 font-medium transition-colors',
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="product">Loan Disbursement</Tabs.Tab>
          {/* <Tabs.Tab value="category">Loan Repayment</Tabs.Tab> */}
          <Tabs.Tab value="category">Loan Write Off</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="product">
          <LoanDisbursement />
        </Tabs.Panel>

        <Tabs.Panel value="category">
          <LoanWriteOff />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}