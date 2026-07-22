import { useState } from 'react';
import { 
  Box, 
  Text, 
  Button, 
  TextInput, 
  Select, 
  Paper,
  Table,
  Checkbox
} from '@mantine/core';
import { 
  IconUser, 
  IconFileText, 
  IconRefresh, 
  IconCreditCard, 
  IconClipboardList,
  IconDeviceFloppy
} from '@tabler/icons-react';

const TABS = [
  { id: 0, title: 'Product Details', subtitle: 'Basic information', icon: IconUser },
  { id: 1, title: 'Accounting', subtitle: 'GL and interest accounts', icon: IconFileText },
  { id: 2, title: 'Collection & Offsets', subtitle: 'Offsets and sequences', icon: IconRefresh },
  { id: 3, title: 'Charges', subtitle: 'Fees and charges', icon: IconCreditCard },
  { id: 4, title: 'Review', subtitle: 'Review and confirm', icon: IconClipboardList },
];

export function LoanApplication() {
  const [activeTab, setActiveTab] = useState(0);

  const handleNext = () => {
    if (activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
  };

  const renderProductDetails = () => (
    <div className="flex flex-col gap-6">
      {/* Basic Product Information */}
      <Paper withBorder radius="md" p="xl" className="shadow-sm">
        <Text fw={700} size="lg" className="text-gray-900">Basic Product Information</Text>
        <Text size="sm" c="dimmed" mb="lg">Capture the basic details of the loan product.</Text>
        
        <div className="grid grid-cols-3 gap-6">
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
      <Paper withBorder radius="md" p="xl" className="shadow-sm">
        <Text fw={700} size="lg" className="text-gray-900">Interest & Repayment Terms</Text>
        <Text size="sm" c="dimmed" mb="lg">Rate, frequency and penalty configuration for this product.</Text>
        
        <div className="grid grid-cols-3 gap-6">
          <TextInput 
            label="Rate of Interest (% Yearly)" 
            placeholder="Enter rate of interest" 
            withAsterisk 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <Select 
            label="Frequency" 
            placeholder="Select frequency" 
            data={['Monthly', 'Quarterly', 'Yearly']}
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
          />
          <TextInput 
            label="Penalty Rate (%)" 
            description="Levied on the pending amount daily in case of delayed repayment."
            placeholder="Enter penalty interest rate" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1', description: 'mt-1' }}
          />
          <TextInput 
            label="Grace Period (Days)" 
            description="Number of days allowed before penalty rate applies."
            placeholder="Enter grace period in days" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1', description: 'mt-1' }}
          />
        </div>
      </Paper>

      {/* Additional Settings */}
      <Paper withBorder radius="md" p="xl" className="shadow-sm">
        <Text fw={700} size="lg" className="text-gray-900">Additional Settings</Text>
        <Text size="sm" c="dimmed" mb="lg">Configure loan behavior and repayment preferences.</Text>
        
        <div className="w-1/2 pr-3">
          <TextInput 
            label="Days Past Due Threshold for NPA" 
            description="Loans will be marked as NPA when the days past due count exceeds this threshold."
            placeholder="Enter number of days" 
            classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1', description: 'mt-1' }}
          />
        </div>
      </Paper>
    </div>
  );

  const renderAccounting = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm">
      <Text fw={700} size="lg" className="text-gray-900">Accounting</Text>
      <Text size="sm" c="dimmed" mb="lg">GL and interest accounts for this product.</Text>
      <Text size="sm" className="text-gray-600">Accounting configuration goes here.</Text>
    </Paper>
  );

  const renderCollection = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm">
      <Text fw={700} size="lg" className="text-gray-900">Collection Sequence</Text>
      <Text size="sm" c="dimmed" mb="lg">Select the offset sequence applied to collections for each asset category.</Text>
      
      <div className="grid grid-cols-2 gap-6">
        <Select 
          label="Collection Offset Sequence for Standard Asset" 
          placeholder="Select sequence" 
          data={['Sequence 1', 'Sequence 2']}
          classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
        />
        <Select 
          label="Collection Offset Sequence for Sub Standard Asset" 
          placeholder="Select sequence" 
          data={['Sequence 1', 'Sequence 2']}
          classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
        />
        <Select 
          label="Collection Offset Sequence for Written Off Asset" 
          placeholder="Select sequence" 
          data={['Sequence 1', 'Sequence 2']}
          classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
        />
        <Select 
          label="Collection Offset Sequence for Settlement Collection" 
          placeholder="Select sequence" 
          data={['Sequence 1', 'Sequence 2']}
          classNames={{ label: 'text-sm font-semibold text-gray-700 mb-1' }}
        />
      </div>
    </Paper>
  );

  const renderCharges = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm">
      <Text fw={700} size="lg" className="text-gray-900">Loan Charges</Text>
      <Text size="sm" c="dimmed" mb="lg">Add one or more charges that apply to this loan product. Click a row to edit its details.</Text>
      
      <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
        <Table>
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="w-12"><Checkbox aria-label="Select all" /></Table.Th>
              <Table.Th>No.</Table.Th>
              <Table.Th>Charge Type</Table.Th>
              <Table.Th>Charge Based On</Table.Th>
              <Table.Th>Percentage</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th className="w-12"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={7} className="text-center py-8 text-gray-500 bg-gray-50/50">
                No rows
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
      <Button variant="default" className="text-gray-700 font-semibold">+ Add row</Button>
    </Paper>
  );

  const renderReview = () => (
    <Paper withBorder radius="md" p="xl" className="shadow-sm">
      <Text fw={700} size="lg" className="text-gray-900">Review</Text>
      <Text size="sm" c="dimmed" mb="lg">Review and confirm all details before saving.</Text>
      <Text size="sm" className="text-gray-600">Review summary goes here.</Text>
    </Paper>
  );

  return (
    // FIX 1: Removed 'max-w-6xl mx-auto' and added 'w-full' to utilize the entire screen width
    <Box className="w-full p-8">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Text size="xl" fw={700} className="text-gray-900 text-2xl">Loan Application</Text>
          <Text size="sm" className="text-gray-500 mt-1">Define product details and rules for this loan offering</Text>
        </div>
        <Button variant="default" leftSection={<IconDeviceFloppy size={18} />} className="font-semibold shadow-sm">
          Save as Draft
        </Button>
      </div>

    {/* Custom Tabs Navigation */}
      <Paper withBorder radius="md" className="p-2 mb-8 shadow-sm bg-white w-full">
        {/* Added this wrapper div to strictly enforce the flex row layout */}
        <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-row items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors min-w-[220px] flex-1 shrink-0 ${
                  isActive ? 'bg-[#EFF6FF] border border-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`flex items-center justify-center shrink-0 h-10 w-10 rounded-full ${isActive ? 'bg-blue-100 text-[#2563EB]' : 'bg-gray-100 text-gray-500'}`}>
                  <TabIcon size={20} stroke={1.5} />
                </div>
                <div className="whitespace-nowrap">
                  <Text size="sm" fw={700} className={isActive ? 'text-[#2563EB]' : 'text-gray-900'}>{tab.title}</Text>
                  <Text size="xs" className={isActive ? 'text-blue-600/70' : 'text-gray-500'}>{tab.subtitle}</Text>
                </div>
              </div>
            );
          })}
        </div>
      </Paper>

      {/* Main Content Area */}
      <div className="mb-8 w-full">
        {activeTab === 0 && renderProductDetails()}
        {activeTab === 1 && renderAccounting()}
        {activeTab === 2 && renderCollection()}
        {activeTab === 3 && renderCharges()}
        {activeTab === 4 && renderReview()}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-between items-center pt-4 w-full">
        <Button variant="default" className="font-semibold shadow-sm px-6">Cancel</Button>
        <div className="flex gap-4">
          <Button variant="default" className="font-semibold shadow-sm px-6">Save as Draft</Button>
          <Button color="blue" onClick={handleNext} className="bg-[#2563EB] hover:bg-blue-700 font-semibold px-6 shadow-sm">
            Save & Next →
          </Button>
        </div>
      </div>
    </Box>
  );
}