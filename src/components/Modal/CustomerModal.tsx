import { useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  Select,
  Modal,
  Tabs,
  Table,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconUser,
  IconChevronDown,
  IconPlus,
  IconTrash,
  IconBuildingBank,
} from "@tabler/icons-react";
import { BankAccountModal, type BankAccountFormData } from "./BankAccountModal";

interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
}

const CUSTOMER_TYPES = ["Individual", "Company"];

export function CustomerModal({ opened, onClose }: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("0");

  // --- Tab 1: Basic Info ---
  const [customerType, setCustomerType] = useState<string | null>("Company");
  const [customerName, setCustomerName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");

  // --- Tab 2: Bank Accounts ---
  const [bankAccounts, setBankAccounts] = useState<BankAccountFormData[]>([]);
  const [bankModalOpened, setBankModalOpened] = useState(false);

  const handleAddBankAccount = (data: BankAccountFormData) => {
    setBankAccounts((prev) => [...prev, data]);
  };

  const handleRemoveBankAccount = (id: number) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReset = () => {
    setCustomerType("Company");
    setCustomerName("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setMobile("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setStateProvince("");
    setZipCode("");
    setCountry("");
    setBankAccounts([]);
    setActiveTab("0");
  };

  const renderBasicInfo = () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <Select
          size="sm"
          withAsterisk
          label="Customer Type"
          placeholder="Select customer type"
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          data={CUSTOMER_TYPES}
          value={customerType}
          onChange={setCustomerType}
          classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
        />
        <TextInput
          size="sm"
          withAsterisk
          label="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.currentTarget.value)}
          classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
        />
      </div>

      <div>
        <Text size="sm" fw={700} className="text-gray-900 mb-3">
          Primary Contact Details
        </Text>
        <div className="grid grid-cols-4 gap-x-8 gap-y-4">
          <TextInput
            size="sm"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="Email Id"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
        </div>
      </div>

      <div>
        <Text size="sm" fw={700} className="text-gray-900 mb-3">
          Primary Address Details
        </Text>
        <div className="grid grid-cols-4 gap-x-8 gap-y-4">
          <TextInput
            size="sm"
            label="Address Line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="City"
            value={city}
            onChange={(e) => setCity(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="Address Line 2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="State/Province"
            value={stateProvince}
            onChange={(e) => setStateProvince(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="ZIP Code"
            value={zipCode}
            onChange={(e) => setZipCode(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
          <TextInput
            size="sm"
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.currentTarget.value)}
            classNames={{ label: "text-sm font-medium text-gray-700 mb-1" }}
          />
        </div>
      </div>
    </div>
  );

  const renderBankAccounts = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text size="md" fw={700} className="text-gray-900">
          Bank Accounts
        </Text>
        <Button
          size="xs"
          className="bg-[#223A70] hover:bg-[#1a2d57]"
          leftSection={<IconPlus size={14} />}
          onClick={() => setBankModalOpened(true)}
        >
          Add Account
        </Button>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Bank
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Account Holder
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Account Number
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                IFSC
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Default
              </Table.Th>
              <Table.Th className="w-10" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bankAccounts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-8 text-gray-500 bg-gray-50/50">
                  No bank accounts added yet.
                </Table.Td>
              </Table.Tr>
            ) : (
              bankAccounts.map((acc) => (
                <Table.Tr key={acc.id}>
                  <Table.Td className="font-medium">{acc.bank || "—"}</Table.Td>
                  <Table.Td>{acc.accountHolderName || acc.name || "—"}</Table.Td>
                  <Table.Td className="font-mono">{acc.accountNumber || "—"}</Table.Td>
                  <Table.Td className="font-mono">{acc.ifsc || "—"}</Table.Td>
                  <Table.Td>{acc.isDefault ? "Yes" : "—"}</Table.Td>
                  <Table.Td>
                    <Tooltip label="Remove" withArrow>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={() => handleRemoveBankAccount(acc.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        <div className="px-3 py-1.5 text-[11px] text-gray-400 bg-gray-50 border-t border-gray-200">
          Total: {bankAccounts.length}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="80%"
        withCloseButton={false}
        padding={0}
        radius="md"
      >
        <Box className="flex flex-col h-[85vh]">
          {/* Header */}
          <Box
            bg="brand.6"
            className="text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-md">
                <IconUser size={22} className="text-white" />
              </div>
              <div>
                <Text size="md" fw={600} className="leading-tight">
                  {customerName ? customerName : "Create Customer"}
                </Text>
                <Text size="xs" c="white.6">
                  Customer profile, contact and address details
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="subtle" className="text-white hover:bg-white/10 px-2" size="xs">
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

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <Box className="px-5 pt-3 bg-white border-b border-gray-200 shrink-0">
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{ tab: "px-3 py-2 text-sm font-medium hover:bg-transparent" }}
              >
                <Tabs.List className="border-none gap-2">
                  <Tabs.Tab value="0" leftSection={<IconUser size={14} />}>
                    Basic Info
                  </Tabs.Tab>
                  <Tabs.Tab value="1" leftSection={<IconBuildingBank size={14} />}>
                    Bank Accounts
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "0" && renderBasicInfo()}
              {activeTab === "1" && renderBankAccounts()}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 p-3 px-5 flex justify-between items-center shrink-0 rounded-b-md">
            <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5">
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-[#EF4444] hover:bg-red-600 font-semibold px-5"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button size="sm" className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-6">
                Submit
              </Button>
            </div>
          </div>
        </Box>
      </Modal>

      <BankAccountModal
        opened={bankModalOpened}
        onClose={() => setBankModalOpened(false)}
        onSubmit={handleAddBankAccount}
        defaultName={customerName}
        defaultAccountFor="Customer"
      />
    </>
  );
}