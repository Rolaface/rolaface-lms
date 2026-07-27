import { useState } from "react";
import {
  Box,
  Text,
  Title,
  Button,
  TextInput,
  Modal,
  Tabs,
  ActionIcon,
  Tooltip,
  Paper,
  Grid,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  Divider,
  ThemeIcon,
  SegmentedControl,
  ScrollArea,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconUser,
  IconUserCircle,
  IconBuilding,
  IconPlus,
  IconTrash,
  IconBuildingBank,
  IconMail,
  IconPhone,
  IconMapPin,
  IconWorld,
  IconStarFilled,
  IconCreditCard,
  IconRotateClockwise,
  IconCheck,
  IconWallet,
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

  const inputStyles = {
    label: "text-xs font-semibold text-gray-600 mb-1",
    input: "focus:border-[#223A70] transition-colors",
  };

  const renderBasicInfo = () => (
    <Grid gutter="lg">
      {/* LEFT COLUMN */}
      <Grid.Col span={7}>
        <Stack gap="md">
          {/* Company / Identity card */}
          <Paper withBorder radius="md" p="md" className="border-gray-200">
            <Group gap="xs" mb="sm">
              <ThemeIcon
                size={28}
                radius="md"
                variant="gradient"
                gradient={{ from: "#223A70", to: "#3b5fa4", deg: 135 }}
              >
                <IconBuilding size={16} />
              </ThemeIcon>
              <Title order={5} className="text-gray-800">
                Company Details
              </Title>
            </Group>

            <Stack gap="sm">
              <div>
                <Text size="xs" fw={600} className="text-gray-600 mb-1">
                  Customer Type <span className="text-red-500">*</span>
                </Text>
                <SegmentedControl
                  fullWidth
                  size="xs"
                  value={customerType ?? "Company"}
                  onChange={setCustomerType}
                  data={CUSTOMER_TYPES}
                  color="#223A70"
                />
              </div>
              <TextInput
                size="sm"
                withAsterisk
                label="Customer Name"
                placeholder="Acme Corporation"
                value={customerName}
                onChange={(e) => setCustomerName(e.currentTarget.value)}
                classNames={inputStyles}
              />
            </Stack>
          </Paper>

          {/* Contact card */}
          <Paper withBorder radius="md" p="md" className="border-gray-200">
            <Group gap="xs" mb="sm">
              <ThemeIcon size={28} radius="md" variant="light" color="teal">
                <IconUserCircle size={16} />
              </ThemeIcon>
              <Title order={5} className="text-gray-800">
                Primary Contact
              </Title>
            </Group>

            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                size="sm"
                label="First Name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="Last Name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="Email Id"
                placeholder="john@company.com"
                leftSection={<IconMail size={14} className="text-gray-400" />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="Mobile Number"
                placeholder="+1 555 000 0000"
                leftSection={<IconPhone size={14} className="text-gray-400" />}
                value={mobile}
                onChange={(e) => setMobile(e.currentTarget.value)}
                classNames={inputStyles}
              />
            </SimpleGrid>
          </Paper>
        </Stack>
      </Grid.Col>

      {/* RIGHT COLUMN */}
      <Grid.Col span={5}>
        <Paper withBorder radius="md" p="md" className="border-gray-200 h-full">
          <Group gap="xs" mb="sm">
            <ThemeIcon size={28} radius="md" variant="light" color="orange">
              <IconMapPin size={16} />
            </ThemeIcon>
            <Title order={5} className="text-gray-800">
              Primary Address
            </Title>
          </Group>

          <Stack gap="sm">
            <TextInput
              size="sm"
              label="Address Line 1"
              placeholder="Street, Building"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.currentTarget.value)}
              classNames={inputStyles}
            />
            <TextInput
              size="sm"
              label="Address Line 2"
              placeholder="Apartment, Suite"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.currentTarget.value)}
              classNames={inputStyles}
            />
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                size="sm"
                label="City"
                value={city}
                onChange={(e) => setCity(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="State/Province"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="ZIP Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.currentTarget.value)}
                classNames={inputStyles}
              />
              <TextInput
                size="sm"
                label="Country"
                leftSection={<IconWorld size={14} className="text-gray-400" />}
                value={country}
                onChange={(e) => setCountry(e.currentTarget.value)}
                classNames={inputStyles}
              />
            </SimpleGrid>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );

  const renderBankAccounts = () => (
    <Stack gap="md" className="h-full">
      <Group justify="space-between">
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" variant="light" color="indigo">
            <IconWallet size={16} />
          </ThemeIcon>
          <div>
            <Title order={5} className="text-gray-800 leading-tight">
              Bank Accounts
            </Title>
            <Text size="xs" c="dimmed">
              Manage payout accounts for this customer
            </Text>
          </div>
          <Badge variant="light" color="gray" radius="sm">
            {bankAccounts.length} {bankAccounts.length === 1 ? "account" : "accounts"}
          </Badge>
        </Group>
        <Button
          size="xs"
          variant="gradient"
          gradient={{ from: "#223A70", to: "#3b5fa4", deg: 135 }}
          leftSection={<IconPlus size={14} />}
          onClick={() => setBankModalOpened(true)}
        >
          Add Account
        </Button>
      </Group>

      <Divider />

      {bankAccounts.length === 0 ? (
        <Paper
          withBorder
          radius="md"
          p="xl"
          className="border-dashed border-gray-300 bg-gray-50/60 flex-1 flex items-center justify-center"
        >
          <Stack align="center" gap="xs">
            <ThemeIcon size={44} radius="xl" variant="light" color="gray">
              <IconBuildingBank size={22} className="text-gray-400" />
            </ThemeIcon>
            <Text size="sm" fw={600} className="text-gray-600">
              No bank accounts added yet
            </Text>
            <Text size="xs" c="dimmed" className="text-center max-w-[280px]">
              Add a bank account to enable payouts and settlements for this customer.
            </Text>
            <Button
              size="xs"
              variant="light"
              color="#223A70"
              mt="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setBankModalOpened(true)}
            >
              Add Account
            </Button>
          </Stack>
        </Paper>
      ) : (
        <ScrollArea.Autosize mah={330} type="auto" offsetScrollbars>
          <SimpleGrid cols={2} spacing="sm">
            {bankAccounts.map((acc) => (
              <Paper key={acc.id} withBorder radius="md" p="sm" className="border-gray-200 relative">
                <Group justify="space-between" align="flex-start" mb={6}>
                  <Group gap={8}>
                    <ThemeIcon size={26} radius="md" variant="light" color="blue">
                      <IconCreditCard size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={700} className="text-gray-800 leading-tight">
                        {acc.bank || "—"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {acc.accountHolderName || acc.name || "—"}
                      </Text>
                    </div>
                  </Group>
                  <Tooltip label="Remove account" withArrow>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemoveBankAccount(acc.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                <Divider mb={6} />

                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Account Number
                  </Text>
                  <Text size="xs" fw={600} className="font-mono text-gray-700">
                    {acc.accountNumber || "—"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    IFSC
                  </Text>
                  <Text size="xs" fw={600} className="font-mono text-gray-700">
                    {acc.ifsc || "—"}
                  </Text>
                </Group>

                {acc.isDefault && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconStarFilled size={10} />}
                    className="absolute top-2 right-9"
                  >
                    Default
                  </Badge>
                )}
              </Paper>
            ))}
          </SimpleGrid>
        </ScrollArea.Autosize>
      )}
    </Stack>
  );

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="1000px"
        withCloseButton={false}
        padding={0}
        radius="lg"
      >
        <Box className="flex flex-col h-[82vh] max-h-[700px]">
          {/* Header */}
          <Box
            className="text-white px-6 py-4 flex justify-between items-center rounded-t-lg shrink-0"
            style={{
              background: "linear-gradient(135deg, #223A70 0%, #3b5fa4 100%)",
            }}
          >
            <Group gap="md">
              <ThemeIcon size={42} radius="md" variant="white" color="#223A70" className="bg-white/15">
                <IconUser size={22} className="text-white" />
              </ThemeIcon>
              <div>
                <Group gap={8}>
                  <Title order={4} className="text-white leading-tight">
                    {customerName ? customerName : "Create Customer"}
                  </Title>
                  <Badge
                    size="sm"
                    radius="sm"
                    variant="white"
                    color="#223A70"
                    className="text-[#223A70] font-semibold"
                  >
                    {customerType}
                  </Badge>
                </Group>
                <Text size="xs" className="text-white/70">
                  Customer profile, contact and address details
                </Text>
              </div>
            </Group>
            <Group gap={4}>
              <Tooltip label="Minimize">
                <ActionIcon variant="subtle" size="lg" className="text-white hover:bg-white/15">
                  <IconMinus size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Close">
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={onClose}
                  className="text-white hover:bg-white/15"
                >
                  <IconX size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Box>

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/40">
            <Box className="px-6 pt-3 bg-white border-b border-gray-200 shrink-0">
              <Tabs value={activeTab} onChange={setActiveTab} variant="pills" color="#223A70">
                <Tabs.List className="gap-2 pb-3">
                  <Tabs.Tab value="0" leftSection={<IconUser size={14} />}>
                    Basic Info
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="1"
                    leftSection={<IconBuildingBank size={14} />}
                    rightSection={
                      bankAccounts.length > 0 ? (
                        <Badge size="xs" circle color="teal" variant="filled">
                          {bankAccounts.length}
                        </Badge>
                      ) : null
                    }
                  >
                    Bank Accounts
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <div className="flex-1 overflow-hidden p-5">
              {activeTab === "0" && renderBasicInfo()}
              {activeTab === "1" && renderBankAccounts()}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center shrink-0 rounded-b-lg">
            <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5">
              Cancel
            </Button>
            <Group gap={8}>
              <Button
                size="sm"
                variant="light"
                color="red"
                leftSection={<IconRotateClockwise size={14} />}
                className="font-semibold px-5"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="gradient"
                gradient={{ from: "#223A70", to: "#3b5fa4", deg: 135 }}
                leftSection={<IconCheck size={14} />}
                className="font-semibold px-6"
              >
                Submit
              </Button>
            </Group>
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