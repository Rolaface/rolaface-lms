import { useState } from "react";
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
  ActionIcon,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconBuildingBank,
  IconChevronDown,
  IconTrash,
} from "@tabler/icons-react";

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
}

export function LoanProductModal({ opened, onClose }: LoanProductProps) {
  const [activeTab, setActiveTab] = useState<string | null>("0");

  // --- 1. Accounting State (Same as Interest Logic) ---
  const [sameAsInterest, setSameAsInterest] = useState(false);
  const [interestAccs, setInterestAccs] = useState({
    income: "",
    receivable: "",
    accrued: "",
    suspended: "",
    waiver: "",
  });
  const [penaltyAccs, setPenaltyAccs] = useState({
    income: "",
    receivable: "",
    accrued: "",
    suspended: "",
    waiver: "",
  });

  const handleInterestChange = (field: keyof typeof interestAccs, value: string | null) => {
    const val = value || "";
    setInterestAccs((prev) => ({ ...prev, [field]: val }));
    if (sameAsInterest) {
      setPenaltyAccs((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handlePenaltyChange = (field: keyof typeof penaltyAccs, value: string | null) => {
    setPenaltyAccs((prev) => ({ ...prev, [field]: value || "" }));
    // Automatically uncheck "Same as Interest" if the user manually edits a penalty field
    if (sameAsInterest) {
      setSameAsInterest(false);
    }
  };

  const handleSameAsInterestToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    setSameAsInterest(isChecked);
    if (isChecked) {
      setPenaltyAccs({ ...interestAccs });
    }
  };

  // --- 2. Charges Table State ---
  const [charges, setCharges] = useState<{ id: number; type: string; percentage: string; amount: string }[]>([]);

  const handleAddCharge = () => {
    setCharges((prev) => [...prev, { id: Date.now(), type: "", percentage: "", amount: "" }]);
  };

  const handleUpdateCharge = (id: number, field: string, value: string) => {
    setCharges((prev) => prev.map((charge) => (charge.id === id ? { ...charge, [field]: value } : charge)));
  };

  const handleRemoveCharge = (id: number) => {
    setCharges((prev) => prev.filter((charge) => charge.id !== id));
  };

  // --- Navigation ---
  const handleNext = () => {
    const current = parseInt(activeTab || "0");
    if (current < 4) setActiveTab((current + 1).toString());
  };

  const dummyAccounts = ["Account A", "Account B", "Account C"];
  const chargeTypes = ["Processing Fee", "Late Fee", "Documentation Fee"];

  const renderProductDetails = () => (
    <div className="flex flex-col gap-4">
      {/* Basic Product Information */}
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        <Text
          size="xs"
          fw={700}
          className="text-gray-700 uppercase tracking-wider mb-3"
        >
          Basic Product Information
        </Text>

        <div className="grid grid-cols-4 gap-4">
          <TextInput
            size="xs"
            label="Product Code"
            placeholder="Enter product code"
            withAsterisk
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Product Name"
            placeholder="Enter product name"
            withAsterisk
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            label="Loan Category"
            placeholder="Select loan category"
            data={["Personal Loan", "Home Loan", "Auto Loan"]}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            label="Repayment Schedule Type"
            placeholder="Select repayment schedule type"
            data={["Equated Monthly Installment (EMI)", "Bullet Payment"]}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Maximum Loan Amount"
            placeholder="Enter maximum amount"
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
        </div>
      </Paper>

      {/* Interest & Repayment Terms */}
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        <Text
          size="xs"
          fw={700}
          className="text-gray-700 uppercase tracking-wider mb-3"
        >
          Interest & Repayment Terms
        </Text>

        <div className="grid grid-cols-4 gap-4">
          <TextInput
            size="xs"
            label="Rate of Interest (% Yearly)"
            description="Total Interest charged annually."
            placeholder="Enter rate of interest"
            withAsterisk
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              description: "mt-0 text-[10px]",
            }}
          />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            label="Frequency"
            description="Monthly, Quarterly, Yearly"
            placeholder="Select frequency"
            data={["Monthly", "Quarterly", "Yearly"]}
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              description: "mt-0 text-[10px]",
            }}
          />
          <TextInput
            size="xs"
            label="Penalty Rate (%)"
            description="Levied on pending amount daily."
            placeholder="Enter penalty rate"
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              description: "mt-0 text-[10px]",
            }}
          />
          <TextInput
            size="xs"
            label="Grace Period (Days)"
            description="Days before penalty applies."
            placeholder="Enter grace period"
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              description: "mt-0 text-[10px]",
            }}
          />
          <TextInput
            size="xs"
            label="Days Past Due for NPA"
            description="Overdue days before NPA mark."
            placeholder="Enter days"
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              description: "mt-0 text-[10px]",
            }}
          />
        </div>
      </Paper>
    </div>
  );

  const renderAccounting = () => (
    <div className="flex flex-col gap-4">
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        {/* Principal Accounts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Text size="sm" fw={600} className="text-gray-900">
              Principal Accounts
            </Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-5 gap-x-6 gap-y-2">
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Loan Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Disbursement Bank Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Repayment Bank Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
          </div>
        </div>

        {/* Interest & Penalty Accounts Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Text size="sm" fw={600} className="text-gray-900">
                Interest & Penalty Accounts
              </Text>
              <IconChevronDown size={14} className="text-gray-500" />
            </div>
            <Checkbox
              size="xs"
              label="Same as Interest"
              checked={sameAsInterest}
              onChange={handleSameAsInterestToggle}
              classNames={{ label: "text-[11px] text-gray-700 font-semibold cursor-pointer" }}
            />
          </div>

          {/* Interest Part */}
          <div className="mb-4">
            <Text size="xs" fw={600} className="text-gray-600 mb-2">
              Interest
            </Text>
            <div className="grid grid-cols-5 gap-x-6 gap-y-3">
              <Select
                size="xs"
                searchable
                value={interestAccs.income}
                onChange={(v) => handleInterestChange("income", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Income Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={interestAccs.receivable}
                onChange={(v) => handleInterestChange("receivable", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Receivable Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={interestAccs.accrued}
                onChange={(v) => handleInterestChange("accrued", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Accrued Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={interestAccs.suspended}
                onChange={(v) => handleInterestChange("suspended", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Suspended Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={interestAccs.waiver}
                onChange={(v) => handleInterestChange("waiver", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Waiver Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
            </div>
          </div>

          {/* Penalty Part */}
          <div>
            <Text size="xs" fw={600} className="text-gray-600 mb-2">
              Penalty
            </Text>
            <div className="grid grid-cols-5 gap-x-6 gap-y-3">
              <Select
                size="xs"
                searchable
                value={penaltyAccs.income}
                onChange={(v) => handlePenaltyChange("income", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Income Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={penaltyAccs.receivable}
                onChange={(v) => handlePenaltyChange("receivable", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Receivable Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={penaltyAccs.accrued}
                onChange={(v) => handlePenaltyChange("accrued", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Accrued Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={penaltyAccs.suspended}
                onChange={(v) => handlePenaltyChange("suspended", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Suspended Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
              <Select
                size="xs"
                searchable
                value={penaltyAccs.waiver}
                onChange={(v) => handlePenaltyChange("waiver", v)}
                rightSection={<IconChevronDown size={14} className="text-gray-500" />}
                placeholder="Select account"
                label="Waiver Account"
                data={dummyAccounts}
                classNames={{ label: "text-xs text-gray-500 mb-1" }}
              />
            </div>
          </div>
        </div>

        {/* General Accounts Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Text size="sm" fw={600} className="text-gray-900">
              General Accounts
            </Text>
            <IconChevronDown size={14} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-5 gap-x-6 gap-y-2">
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Write Off Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Subsidy Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Security Deposit Account"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Write Off Recovery"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Suspense Collection"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              placeholder="Select account"
              label="Customer Refund"
              data={dummyAccounts}
              classNames={{ label: "text-xs text-gray-500 mb-1" }}
            />
          </div>
        </div>
      </Paper>
    </div>
  );

  const renderCollection = () => (
    <Paper
      withBorder
      radius="md"
      p="md"
      className="shadow-sm bg-white min-h-[300px]"
    >
      <Text
        size="xs"
        fw={700}
        className="text-gray-700 uppercase tracking-wider mb-4"
      >
        Collection Sequence
      </Text>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          label="Standard Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          label="Sub Standard Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          label="Written Off Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          label="Settlement Collection"
          placeholder="Select sequence"
          data={["Sequence 1"]}
        />
      </div>
    </Paper>
  );

  const renderCharges = () => (
    <Paper
      withBorder
      radius="md"
      p="md"
      className="shadow-sm bg-white min-h-[300px]"
    >
      <Text
        size="xs"
        fw={700}
        className="text-gray-700 uppercase tracking-wider mb-2"
      >
        Loan Charges
      </Text>
      <div className="border border-gray-200 rounded-md overflow-hidden mb-3 mt-4">
        <Table size="xs" verticalSpacing="sm">
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="w-10">
                <Checkbox size="xs" aria-label="Select all" />
              </Table.Th>
              <Table.Th className="w-12">No.</Table.Th>
              <Table.Th>Charge Type</Table.Th>
              <Table.Th>Percentage</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th className="w-12"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={6}
                  className="text-center py-6 text-gray-500 bg-gray-50/50"
                >
                  No rows
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id}>
                  <Table.Td>
                    <Checkbox size="xs" />
                  </Table.Td>
                  <Table.Td className="text-xs text-gray-600 font-medium">
                    {index + 1}
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={chargeTypes}
                      placeholder="Select type"
                      value={charge.type}
                      onChange={(val) => handleUpdateCharge(charge.id, "type", val || "")}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-gray-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="%"
                      value={charge.percentage}
                      onChange={(e) => handleUpdateCharge(charge.id, "percentage", e.currentTarget.value)}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-gray-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="0.00"
                      value={charge.amount}
                      onChange={(e) => handleUpdateCharge(charge.id, "amount", e.currentTarget.value)}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-gray-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemoveCharge(charge.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
      <Button
        size="xs"
        variant="default"
        onClick={handleAddCharge}
        className="text-gray-700 font-semibold"
      >
        + Add row
      </Button>
    </Paper>
  );

  const renderReview = () => (
    <Paper
      withBorder
      radius="md"
      p="md"
      className="shadow-sm bg-white min-h-[300px]"
    >
      <Text
        size="xs"
        fw={700}
        className="text-gray-700 uppercase tracking-wider mb-4"
      >
        Review
      </Text>
      <Text size="sm" className="text-gray-600">
        Review summary goes here.
      </Text>
    </Paper>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      withCloseButton={false}
      padding={0}
      radius="md"
      className="bg-[#F4F5F7]"
    >
      <Box className="flex flex-col h-[90vh]">
        {/* Dark Blue Header */}
        <Box
          bg="brand.6"
          className="text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-md">
              <IconBuildingBank size={22} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={600} className="leading-tight">
                Create Loan Product
              </Text>
              <Text size="xs" c="white.6">
                Define product details and rules for this loan offering
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              className="text-white hover:bg-white/10 px-2"
              size="xs"
            >
              <IconMinus size={18} />
            </Button>

            <Button
              variant="subtle"
              onClick={onClose}
              className="text-white hover:bg-white/10 px-2"
              size="xs"
            >
              <IconX size={18} />
            </Button>
          </div>
        </Box>

        {/* Main Body Layout */}
        <div className="flex flex-1 overflow-hidden bg-[#F4F5F7]">
          {/* Left Content Area (Tabs + Forms) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Minimalist Tabs */}
            <Box className="px-5 pt-3 bg-white border-b border-gray-200 shrink-0">
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{
                  tab: "px-3 py-2 text-sm font-medium hover:bg-transparent",
                }}
              >
                <Tabs.List className="border-none gap-2">
                  <Tabs.Tab value="0">Basic Details</Tabs.Tab>
                  <Tabs.Tab value="1">Accounting</Tabs.Tab>
                  <Tabs.Tab value="2">Collection Sequence</Tabs.Tab>
                  <Tabs.Tab value="3">Charges</Tabs.Tab>
                  <Tabs.Tab value="4">Review</Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "0" && renderProductDetails()}
              {activeTab === "1" && renderAccounting()}
              {activeTab === "2" && renderCollection()}
              {activeTab === "3" && renderCharges()}
              {activeTab === "4" && renderReview()}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="bg-white border-t border-gray-200 p-3 px-5 flex justify-between items-center shrink-0 rounded-b-md">
          <Button
            size="sm"
            variant="default"
            onClick={onClose}
            className="font-semibold px-5"
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#EF4444] hover:bg-red-600 font-semibold px-5"
            >
              Reset
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleNext}
              className="font-semibold px-5"
            >
              Next
            </Button>
            <Button
              size="sm"
              className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-6"
            >
              Submit
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}