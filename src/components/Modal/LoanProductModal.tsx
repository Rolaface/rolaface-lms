import { useState } from 'react';
import { 
  Box, 
  Text, 
  Button, 
  TextInput, 
  Select, 
  Paper,
  Table,
  Checkbox,
  Modal,
  Tabs,
  Badge,
  Divider
} from '@mantine/core';
import { 
  IconX,
  IconMinus,
  IconBuildingBank,
  IconFileInvoice,
  IconChevronDown
} from '@tabler/icons-react';

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
}

export function LoanProductModal({ opened, onClose }: LoanProductProps) {
  const [activeTab, setActiveTab] = useState<string | null>('0');

  const handleNext = () => {
    const current = parseInt(activeTab || '0');
    if (current < 4) setActiveTab((current + 1).toString());
  };

  const renderProductDetails = () => (
    <div className="flex flex-col gap-6">
      {/* Basic Product Information */}
      <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">
          Basic Product Information
        </Text>
        
        <div className="grid grid-cols-4 gap-4">
          <TextInput 
            label="Product Code" 
            placeholder="Enter product code" 
            withAsterisk 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <TextInput 
            label="Product Name" 
            placeholder="Enter product name" 
            withAsterisk 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <Select 
            label="Loan Category" 
            placeholder="Select loan category" 
            data={['Personal Loan', 'Home Loan', 'Auto Loan']}
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <Select 
            label="Repayment Schedule Type" 
            placeholder="Select repayment schedule type" 
            data={['Equated Monthly Installment (EMI)', 'Bullet Payment']}
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <TextInput 
            label="Maximum Loan Amount" 
            placeholder="Enter maximum amount" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
        </div>
      </Paper>

      {/* Interest & Repayment Terms */}
      <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">
          Interest & Repayment Terms
        </Text>
        
        <div className="grid grid-cols-4 gap-6">
          <TextInput 
            label="Rate of Interest (% Yearly)" 
             description="Total Interest charged annually on the principal amount."
            placeholder="Enter rate of interest" 
            withAsterisk 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <Select 
            label="Frequency" 
             description="Monthly, Quarterly, Yearly"
            placeholder="Select frequency" 
            data={['Monthly', 'Quarterly', 'Yearly']}
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' , description: 'mt-1'}}
          />
          <TextInput 
            label="Penalty Rate (%)" 
            description="Levied on pending amount daily for delays."
            placeholder="Enter penalty interest rate" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1', description: 'mt-1' }}
          />
          <TextInput 
            label="Grace Period (Days)" 
            description="Days allowed before penalty rate applies."
            placeholder="Enter grace period in days" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1', description: 'mt-1' }}
          />
          <TextInput 
            label="Days Past Due Threshold for NPA" 
            description="Days allowed for overdue before marking as Non-Performing Asset."
            placeholder="Enter number of days" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1',  description: 'mt-1' }}
          />
        </div>
      </Paper>

      {/* Additional Settings */}
      {/* <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">
          Additional Settings
        </Text>
        
        <div className="w-1/3 pr-3">
          
        </div>
      </Paper> */}
    </div>
  );

const renderAccounting = () => (
    <div className="flex flex-col gap-4">
      <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white">

    <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Text size="sm" fw={600} className="text-gray-900">General Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-3">
            <Select placeholder="Select account" label="Income Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Expense Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
           </div>
        </div>

        {/* Loan Accounts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Text size="sm" fw={600} className="text-gray-900">Loan Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-3">
            <Select placeholder="Select account" label="Disbursement Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Loan Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            {/* <Select placeholder="Select account" label="Repayment Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
            <Select placeholder="Select account" label="Security Deposit Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            {/* <Select placeholder="Select account" label="Subsidy Adjustment Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
            <Select placeholder="Select account" label="Suspense Collection Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            {/* <Select placeholder="Select account" label="Customer Refund Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
          </div>
        </div>

        {/* <Divider mb="xl" color="gray.2" /> */}

        {/* Interest Accounts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Text size="sm" fw={600} className="text-gray-900">Interest Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-3">
            {/* <Select placeholder="Select account" label="Interest Income Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
            <Select placeholder="Select account" label="Interest Receivable Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Interest Accrued Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Suspense Interest Income" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            {/* <Select placeholder="Select account" label="Interest Waiver Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
            {/* <Select placeholder="Select account" label="Broken Period Interest Recovery Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
          </div>
        </div>

        {/* <Divider mb="xl" color="gray.2" /> */}

        {/* Additional Interest Accounts Section */}
        {/* <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Text size="sm" fw={600} className="text-gray-900">Additional Interest Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-5">
            <div className="flex items-center mt-6">
              <Checkbox label="Same as regular Interest accounts" classNames={{ label: 'text-xs text-gray-700' }} />
            </div>
            <Select placeholder="Select account" label="Additional Interest Receivable" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Additional Interest Income" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Additional Interest Suspense" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Additional Interest Accrued" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Additional Interest Waiver" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
          </div>
        </div> */}

        {/* <Divider mb="xl" color="gray.2" /> */}

        {/* Penalty Charges Accounts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Text size="sm" fw={600} className="text-gray-900">Penalty Charges Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-3">
            {/* <Select placeholder="Select account" label="Penalty Income Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
            <Select placeholder="Select account" label="Penalty Receivable Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Penalty Accrued Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Penalty Suspense Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            {/* <Select placeholder="Select account" label="Penalty Waiver Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} /> */}
          </div>
        </div>

        {/* <Divider mb="xl" color="gray.2" /> */}

        {/* Write Off Accounts Section */}
        {/* <div>
          <div className="flex items-center gap-2 mb-5">
            <Text size="sm" fw={600} className="text-gray-900">Write Off Accounts</Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-5">
            <Select placeholder="Select account" label="Write Off Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
            <Select placeholder="Select account" label="Write Off Recovery Account" data={[]} classNames={{ label: 'text-xs text-gray-500 mb-1' }} />
          </div>
        </div> */}
      </Paper>
    </div>
  );

  const renderCollection = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white min-h-[400px]">
      <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">Collection Sequence</Text>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Select label="Standard Asset" placeholder="Select sequence" data={['Sequence 1']} />
        <Select label="Sub Standard Asset" placeholder="Select sequence" data={['Sequence 1']} />
      </div>
<Divider mb="xl" color="gray.2" />
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider">Loan Charges</Text>
      <div className="border border-gray-200 rounded-md overflow-hidden mb-4 mt-2">
        <Table>
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="w-12"><Checkbox aria-label="Select all" /></Table.Th>
              <Table.Th>No.</Table.Th>
              <Table.Th>Charge Type</Table.Th>
              <Table.Th>Percentage</Table.Th>
              <Table.Th>Amount</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={5} className="text-center py-8 text-gray-500 bg-gray-50/50">No rows</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
        <Button variant="default" className="text-gray-700 font-semibold">+ Add row</Button>

    </Paper>
  );

//   const renderCharges = () => (
//     <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white min-h-[400px]">
//       <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">Loan Charges</Text>
//       <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
//         <Table>
//           <Table.Thead className="bg-gray-50">
//             <Table.Tr>
//               <Table.Th className="w-12"><Checkbox aria-label="Select all" /></Table.Th>
//               <Table.Th>No.</Table.Th>
//               <Table.Th>Charge Type</Table.Th>
//               <Table.Th>Percentage</Table.Th>
//               <Table.Th>Amount</Table.Th>
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             <Table.Tr>
//               <Table.Td colSpan={5} className="text-center py-8 text-gray-500 bg-gray-50/50">No rows</Table.Td>
//             </Table.Tr>
//           </Table.Tbody>
//         </Table>
//       </div>
//       <Button variant="default" className="text-gray-700 font-semibold">+ Add row</Button>
//     </Paper>
//   );

  const renderReview = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm bg-white min-h-[400px]">
      <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-6">Review</Text>
      <Text size="sm" className="text-gray-600">Review summary goes here.</Text>
    </Paper>
  );

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size="95%" // Makes it nearly full screen like the screenshot
      withCloseButton={false} 
      padding={0} // Removing padding here allows the header to bleed edge-to-edge
      radius="md"
      className="bg-[#F4F5F7]"
    >
      <Box className="flex flex-col h-[90vh]">
        
        {/* Dark Blue Header */}
      <Box
  bg="brand.6"
  className="text-white px-6 py-4 flex justify-between items-center rounded-t-md shrink-0"
>
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-md">
      <IconBuildingBank size={24} className="text-white" />
    </div>
    <div>
      <Text size="lg" fw={600} className="leading-tight">
        Create Loan Product
      </Text>
      <Text size="xs" c="white.6">
        Define product details and rules for this loan offering
      </Text>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <Button variant="subtle" className="text-white hover:bg-white/10 px-2" size="sm">
      <IconMinus size={20} />
    </Button>

    <Button variant="subtle" onClick={onClose} className="text-white hover:bg-white/10 px-2" size="sm">
      <IconX size={20} />
    </Button>
  </div>
</Box>

        {/* Main Body Layout */}
        <div className="flex flex-1 overflow-hidden bg-[#F4F5F7]">
          
          {/* Left Content Area (Tabs + Forms) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Minimalist Tabs */}
            <Box className="px-8 pt-4 bg-white border-b border-gray-200 shrink-0">
              <Tabs value={activeTab} onChange={setActiveTab} classNames={{ tab: 'px-4 py-3 text-sm font-medium hover:bg-transparent' }}>
                <Tabs.List className="border-none gap-4">
                  <Tabs.Tab value="0">Product Details</Tabs.Tab>
                  <Tabs.Tab value="1">Accounting</Tabs.Tab>
                  <Tabs.Tab value="2">Collection Sequence & Charges</Tabs.Tab>
                  {/* <Tabs.Tab value="3">Charges</Tabs.Tab> */}
                  <Tabs.Tab value="4">Review</Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === '0' && renderProductDetails()}
              {activeTab === '1' && renderAccounting()}
              {activeTab === '2' && renderCollection()}
              {/* {activeTab === '3' && renderCharges()} */}
              {activeTab === '4' && renderReview()}
            </div>
          </div>

          {/* Right Sidebar (Summary Panel) */}
          {/* <div className="w-[280px] bg-white border-l border-gray-200 p-6 flex flex-col items-center shrink-0">
            <div className="bg-[#3B82F6] text-white p-4 rounded-xl mb-4 mt-2">
              <IconFileInvoice size={32} />
            </div>
            <Text fw={700} className="text-gray-900 mb-2">New Product</Text>
            <Badge color="teal" variant="light" size="lg" radius="xl" className="mb-6 font-semibold border border-teal-200">
              ● Active
            </Badge>

            <div className="w-full">
              <Divider my="sm" />
              <div className="flex justify-between items-center text-sm py-1">
                <Text fw={600} className="text-gray-500 text-xs tracking-wider uppercase">Category</Text>
                <Text className="text-gray-900">—</Text>
              </div>
              <Divider my="sm" />
              <div className="flex justify-between items-center text-sm py-1">
                <Text fw={600} className="text-gray-500 text-xs tracking-wider uppercase">Type</Text>
                <Text className="text-gray-900">—</Text>
              </div>
              <Divider my="sm" />
            </div>
          </div> */}
        </div>

        {/* Footer Action Bar */}
        <div className="bg-white border-t border-gray-200 p-4 px-8 flex justify-between items-center shrink-0 rounded-b-md">
          <Button variant="default" onClick={onClose} className="font-semibold px-6">
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button className="bg-[#EF4444] hover:bg-red-600 font-semibold px-6">
              Reset
            </Button>
            <Button variant="default" onClick={handleNext} className="font-semibold px-6">
              Next
            </Button>
            <Button className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-8">
              Submit
            </Button>
          </div>
        </div>

      </Box>
    </Modal>
  );
}