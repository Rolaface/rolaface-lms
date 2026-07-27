import { Fragment, useState } from "react";
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
  ActionIcon,
  Menu,
  SegmentedControl,
} from "@mantine/core";
import {
  IconX,
  IconBriefcase,
  IconBuildingBank,
  IconChevronDown,
  IconTrash,
  IconDeviceFloppy,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconPercentage,
  IconArrowsExchange,
  IconReceipt2,
  IconClipboardCheck,
  IconHash,
  IconFileText,
  IconStack2,
  IconCalendar,
  IconCurrencyRupee,
  IconClock,
  IconRefresh,
  IconClipboardList,
  IconPencil,
  IconCopy,
  IconArrowBarToDown,
  IconArrowBarToUp,
  IconWallet,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
}

const STEPS = [
  { label: "Product Details", desc: "Basic information", icon: IconBriefcase },
  { label: "Accounting", desc: "Account Mapping", icon: IconBuildingBank },
  { label: "Collection Sequence", desc: "Repayment Order", icon: IconArrowsExchange },
{ label: "Fees & Charges", desc: "Configure applicable loan fees", icon: IconReceipt2 },

];


const theme = {
  brand: { 0: "var(--mantine-color-brand-0)", 1: "var(--mantine-color-brand-1)", 5: "var(--mantine-color-brand-5)", 6: "var(--mantine-color-brand-6)", 7: "var(--mantine-color-brand-7)" },
  accent: { 0: "var(--mantine-color-accent-0)", 1: "var(--mantine-color-accent-1)", 5: "var(--mantine-color-accent-5)" },
  gold: { 0: "var(--mantine-color-gold-0)", 1: "var(--mantine-color-gold-1)", 5: "var(--mantine-color-gold-5)" },
  danger: { 0: "var(--mantine-color-danger-0)", 1: "var(--mantine-color-danger-1)", 5: "var(--mantine-color-danger-5)", 6: "var(--mantine-color-danger-6)" },
  violet: { 0: "#f5f3ff", 1: "#ede9fe", 5: "#8b5cf6", 6: "#7c3aed" },
  blue: { 0: "#eff6ff", 1: "#dbeafe", 5: "#3b82f6", 6: "#2563eb" },
  emerald: { 0: "#ecfdf5", 1: "#d1fae5", 5: "#10b981", 6: "#059669" },
}
type ChipColor = keyof typeof theme;

// Shared label styling so every field across every step looks consistent
const labelProps = {
  label: "text-[13px] font-semibold text-slate-700 mb-2",
  description: "mt-0 text-[10px] text-slate-400 leading-tight",
  input:
    "min-h-[52px] h-[52px] text-sm border-slate-200 rounded-xl overflow-hidden transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] !pl-[56px]",
};

const fieldLabelProps = {
  label: "text-[13px] font-medium text-slate-600 mb-1.5",
  input:
    "min-h-[42px] h-[42px] text-sm rounded-lg border-slate-200 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};

const IconChip = ({ icon: Icon, color = "brand" }: { icon: React.ComponentType<{ size?: number }>; color?: ChipColor }) => {
  const c = theme[color];
  return (
    <div
      className="w-full h-full flex items-center justify-center shrink-0 border-r"
      style={{ backgroundColor: c[0], color: (c as any)[5], borderColor: c[1] }}
    >
      <Icon size={18} />
    </div>
  );
};

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
  interface ChargeRow {
    id: number;
    type: string;
    basedOn: "Percentage" | "Flat Amount";
    amount: string;
    percentage: string;
    incomeAccount: string;
    receivableAccount: string;
    waiverAccount: string;
    writeOffAccount: string;
    suspenseAccount: string;
  }

  const emptyCharge = (): ChargeRow => ({
    id: Date.now() + Math.random(),
    type: "",
    basedOn: "Percentage",
    amount: "",
    percentage: "",
    incomeAccount: "",
    receivableAccount: "",
    waiverAccount: "",
    writeOffAccount: "",
    suspenseAccount: "",
  });

  const [charges, setCharges] = useState<ChargeRow[]>([]);
  // Only tracks which row's ACCOUNTS modal is open. Charge Type / Based On /
  // Percentage / Amount are now edited inline in the table itself.
  const [accountsModalIndex, setAccountsModalIndex] = useState<number | null>(null);

  const handleAddCharge = () => {
    // Adds the row directly into the table (inline-editable) instead of
    // opening any modal.
    setCharges((prev) => [...prev, emptyCharge()]);
  };

  const handleUpdateCharge = (index: number, field: keyof ChargeRow, value: string) => {
    setCharges((prev) =>
      prev.map((charge, i) => {
        if (i !== index) return charge;
        const updated = { ...charge, [field]: value };
        // Keep the disabled field's stale value cleared when basis changes
        if (field === "basedOn") {
          if (value === "Percentage") updated.amount = "";
          if (value === "Flat Amount") updated.percentage = "";
        }
        return updated;
      })
    );
  };

  const handleRemoveChargeAt = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
    setAccountsModalIndex(null);
  };

  const handleInsertAbove = (index: number) => {
    setCharges((prev) => {
      const next = [...prev];
      next.splice(index, 0, emptyCharge());
      return next;
    });
  };

  const handleInsertBelow = (index: number) => {
    setCharges((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, emptyCharge());
      return next;
    });
  };

  const handleDuplicateCharge = (index: number) => {
    setCharges((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...prev[index], id: Date.now() + Math.random() });
      return next;
    });
  };

  // --- Navigation ---
  const handleNext = () => {
    const current = parseInt(activeTab || "0");
    if (current < 3) setActiveTab((current + 1).toString());
  };

  const handleBack = () => {
    const current = parseInt(activeTab || "0");
    if (current > 0) setActiveTab((current - 1).toString());
  };

  const handleReset = () => {
    setSameAsInterest(false);
    setInterestAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setPenaltyAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setCharges([]);
    setAccountsModalIndex(null);
    setActiveTab("0");
  };

  const dummyAccounts = ["Account A", "Account B", "Account C"];
  const frequencyOptions = ["Monthly", "Quarterly", "Yearly"];

  const currentStep = parseInt(activeTab || "0");

  // Header is dynamic: step 0 shows the modal's overall intro,
  // every later step shows that step's own icon / title / description.
  const headerIcon = currentStep === 0 ? IconBriefcase : STEPS[currentStep].icon;
  const headerTitle = currentStep === 0 ? "Create Loan Product" : STEPS[currentStep].label;
  const headerDesc =
    currentStep === 0 ? "Define product details and rules for this loan offering." : STEPS[currentStep].desc;

  // --- Card used on Product Details: accent bar + title + description ---
  const SectionCard = ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: theme.brand[5] }} />
          <Text size="md" fw={700} className="text-slate-900 tracking-tight">{title}</Text>
        </div>
        {description && <Text size="xs" className="text-slate-400 mb-5 pl-3">{description}</Text>}
        {!description && <div className="mb-3" />}
        {children}
      </div>
    </Paper>
  );

  // --- Card used on Collection & Offsets: just a shadowed card with a lead paragraph ---
  const PlainCard = ({ description, children }: { description?: string; children: React.ReactNode }) => (
    <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
      <div className="p-6">
        {description && <Text size="sm" className="text-slate-500 mb-6">{description}</Text>}
        {children}
      </div>
    </Paper>
  );

  // --- Un-carded heading used inside Accounting (icon + text + divider below) ---
  const SubSection = ({
    title,
    icon: Icon,
    trailing,
    last = false,
    children,
  }: {
    title: string;
    icon: any;
    trailing?: React.ReactNode;
    last?: boolean;
    children: React.ReactNode;
  }) => (
    <div className={`py-5 first:pt-0 ${!last ? "border-b border-slate-100" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: theme.brand[6] }} />
          <Text size="sm" fw={700} className="text-slate-900">{title}</Text>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );

  const SubHeading = ({ children, color = "brand" }: { children: React.ReactNode; color?: "brand" | "danger" }) => {
    const c = theme[color];
    return (
      <Text size="xs" fw={700} className="uppercase tracking-wide mb-0" style={{ color: (c as any)[6] ?? c[5] }}>
        {children}
      </Text>
    );
  };

  const renderProductDetails = () => (
    <div className="flex flex-col gap-5">
      <PlainCard>
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <TextInput size="xs" label="Product Code" placeholder="Enter code" withAsterisk leftSection={<IconChip icon={IconHash} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
          <TextInput size="xs" label="Product Name" placeholder="Enter product name" withAsterisk leftSection={<IconChip icon={IconFileText} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label="Loan Category"
            placeholder="Select category"
            data={["Personal Loan", "Home Loan", "Auto Loan"]}
            withAsterisk
            leftSection={<IconChip icon={IconStack2} color="blue" />}
            leftSectionWidth={50}
            classNames={labelProps}
          />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label="Repayment Schedule Type"
            placeholder="Select schedule type"
            data={["Equated Monthly Installment (EMI)", "Bullet Payment"]}
            withAsterisk
            leftSection={<IconChip icon={IconCalendar} color="emerald" />}
            leftSectionWidth={50}
            classNames={labelProps}
          />
          <TextInput size="xs" label="Maximum Loan Amount" placeholder="Enter amount" withAsterisk leftSection={<IconChip icon={IconCurrencyRupee} color="accent" />} leftSectionWidth={50} classNames={labelProps} />
          <TextInput size="xs" label="Days Past Due Threshold for NPA" placeholder="Enter days" withAsterisk leftSection={<IconChip icon={IconClock} color="danger" />} leftSectionWidth={50} classNames={labelProps} />
        </div>
      </PlainCard>

      <SectionCard title="Interest & Penalty">
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 rounded-xl border p-5" style={{ backgroundColor: theme.violet[0], borderColor: theme.violet[1] }}>
            <div className="mb-3.5">
              <SubHeading color="brand">Interest</SubHeading>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <TextInput size="xs" label="Interest Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
              <Select
                size="xs"
                searchable
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                label="Interest Frequency"
                placeholder="Select frequency"
                data={frequencyOptions}
                withAsterisk
                leftSection={<IconChip icon={IconRefresh} color="violet" />}
                leftSectionWidth={50}
                classNames={labelProps}
              />
            </div>
          </div>

          <div className="col-span-3 rounded-xl border p-5" style={{ backgroundColor: theme.danger[0], borderColor: theme.danger[1] }}>
            <div className="mb-3.5">
              <SubHeading color="danger">Penalty</SubHeading>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <TextInput size="xs" label="Penalty Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="danger" />} leftSectionWidth={50} classNames={labelProps} />
              <Select
                size="xs"
                searchable
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                label="Penalty Frequency"
                placeholder="Select frequency"
                data={frequencyOptions}
                withAsterisk
                leftSection={<IconChip icon={IconRefresh} color="danger" />}
                leftSectionWidth={50}
                classNames={labelProps}
              />
              <TextInput size="xs" label="Grace Period (Days)" placeholder="Enter days" leftSection={<IconChip icon={IconCalendar} color="danger" />} leftSectionWidth={50} classNames={labelProps} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderAccounting = () => (
    <div>
      <SubSection title="Principal Accounts" icon={IconBuildingBank}>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Loan Account" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Disbursement Bank Account" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Repayment Bank Account" data={dummyAccounts} classNames={fieldLabelProps} />
        </div>
      </SubSection>

      <SubSection
        title="Interest & Penalty Accounts"
        icon={IconStack2}
        trailing={
          <Checkbox
            size="xs"
            label="Same as Interest"
            checked={sameAsInterest}
            onChange={handleSameAsInterestToggle}
            classNames={{ label: "text-xs text-slate-700 font-medium cursor-pointer" }}
          />
        }
      >
        <div className="grid grid-cols-3 gap-6 mb-3 px-0">
          <Text size="xs" fw={700} className="text-slate-400 uppercase tracking-wider">Account Type</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.brand[6] }}>Interest</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.danger[6] }}>Penalty</Text>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { key: "income", label: "Income Account" },
            { key: "receivable", label: "Receivable Account" },
            { key: "accrued", label: "Accrued Account" },
            { key: "suspended", label: "Suspended Account" },
            { key: "waiver", label: "Waiver Account" },
          ].map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 gap-6 items-center">
              <Text size="sm" fw={600} className="text-slate-700">{label}</Text>
              <Select
                size="xs"
                searchable
                value={interestAccs[key as keyof typeof interestAccs]}
                onChange={(v) => handleInterestChange(key as keyof typeof interestAccs, v)}
                rightSection={<IconChevronDown size={14} className="text-slate-400" />}
                placeholder="Select account"
                data={dummyAccounts}
                classNames={{ input: fieldLabelProps.input }}
              />
              <Select
                size="xs"
                searchable
                value={penaltyAccs[key as keyof typeof penaltyAccs]}
                onChange={(v) => handlePenaltyChange(key as keyof typeof penaltyAccs, v)}
                rightSection={<IconChevronDown size={14} className="text-slate-400" />}
                placeholder="Select account"
                data={dummyAccounts}
                classNames={{ input: fieldLabelProps.input }}
              />
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="General Accounts" icon={IconFileText} last>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Write Off Account" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Write Off Recovery" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Subsidy Account" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Security Deposit Account" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Suspense Collection" data={dummyAccounts} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Customer Refund" data={dummyAccounts} classNames={fieldLabelProps} />
        </div>
      </SubSection>
    </div>
  );

  const renderCollection = () => (
    <PlainCard description="Configure collection sequence for different asset classifications.">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} label="Standard Asset" placeholder="Select sequence" data={["Sequence 1"]} withAsterisk leftSection={<IconChip icon={IconClipboardList} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
        <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} label="Sub Standard Asset" placeholder="Select sequence" data={["Sequence 1"]} withAsterisk leftSection={<IconChip icon={IconClipboardList} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
        <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} label="Written Off Asset" placeholder="Select sequence" data={["Sequence 1"]} withAsterisk leftSection={<IconChip icon={IconClipboardList} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
        <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} label="Settlement Collection" placeholder="Select sequence" data={["Sequence 1"]} withAsterisk leftSection={<IconChip icon={IconClipboardList} color="violet" />} leftSectionWidth={50} classNames={labelProps} />
      </div>
    </PlainCard>
  );

  // Compact inline input used inside table cells (no label, tighter height)
  const cellInputClasses = {
    input: "h-8 min-h-[32px] w-full text-xs rounded-md border border-slate-200 bg-white hover:border-slate-300 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 px-2",
  };

  const renderCharges = () => (
    <SectionCard title="Loan Charges" description="Fees and charges applied to this loan product.">
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
        <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="w-6"><Checkbox size="xs" aria-label="Select all" /></Table.Th>
              <Table.Th className="w-6">No.</Table.Th>
              <Table.Th className="w-52">Charge Type</Table.Th>
              <Table.Th className="w-48">Charge Based On</Table.Th>
              <Table.Th className="w-24">Percentage</Table.Th>
              <Table.Th className="w-24">Amount</Table.Th>
              <Table.Th className="w-14"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No rows yet — add a charge to get started
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td><Checkbox size="xs" /></Table.Td>
                  <Table.Td className="text-xs text-slate-500 font-medium">{index + 1}</Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="Charge Type"
                      value={charge.type}
                      onChange={(e) => handleUpdateCharge(index, "type", e.currentTarget.value)}
                      classNames={cellInputClasses}
                    />
                  </Table.Td>
                  <Table.Td>
                    <SegmentedControl
                      size="xs"
                      fullWidth
                      data={[
                        { label: "Percentage", value: "Percentage" },
                        { label: "Flat Amount", value: "Flat Amount" },
                      ]}
                      value={charge.basedOn}
                      onChange={(val) => handleUpdateCharge(index, "basedOn", (val as "Percentage" | "Flat Amount") || "Percentage")}
                      color="brand"
                      classNames={{
                        root: "bg-slate-100 p-0.5 h-8",
                        label: "text-xs font-semibold px-1",
                        indicator: "shadow-sm",
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="Percentage"
                      value={charge.percentage}
                      disabled={charge.basedOn === "Flat Amount"}
                      onChange={(e) => handleUpdateCharge(index, "percentage", e.currentTarget.value)}
                      classNames={cellInputClasses}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="Amount"
                      value={charge.amount}
                      disabled={charge.basedOn === "Percentage"}
                      onChange={(e) => handleUpdateCharge(index, "amount", e.currentTarget.value)}
                      classNames={cellInputClasses}
                    />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1">
                      {/* Edit opens ONLY the charge-accounts modal */}
                      <ActionIcon color="brand" variant="subtle" onClick={() => setAccountsModalIndex(index)} aria-label="Edit charge accounts">
                        <IconPencil size={15} />
                      </ActionIcon>
                      <Menu shadow="md" width={170} position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon color="gray" variant="subtle" aria-label="More actions">
                            <IconDotsVertical size={15} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconArrowBarToUp size={14} />} onClick={() => handleInsertAbove(index)}>
                            Insert Above
                          </Menu.Item>
                          <Menu.Item leftSection={<IconArrowBarToDown size={14} />} onClick={() => handleInsertBelow(index)}>
                            Insert Below
                          </Menu.Item>
                          <Menu.Item leftSection={<IconCopy size={14} />} onClick={() => handleDuplicateCharge(index)}>
                            Duplicate
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item color="danger" leftSection={<IconTrash size={14} />} onClick={() => handleRemoveChargeAt(index)}>
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
            {/* Inline "add" row replaces the old standalone Add row button */}
            <Table.Tr className="cursor-pointer hover:bg-slate-50/60" onClick={handleAddCharge}>
              <Table.Td colSpan={7} className="py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.brand[6] }}>
                  <IconPlus size={14} />
                  Add charge
                </div>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </SectionCard>
  );

  // --- Charge accounts modal (accounts only — matches the app's card/field styling) ---
  const renderChargeAccountsModal = () => {
    if (accountsModalIndex === null) return null;
    const charge = charges[accountsModalIndex];
    if (!charge) return null;

    const update = (field: keyof typeof charge, value: string) => handleUpdateCharge(accountsModalIndex, field, value);

    return (
      <Modal
        opened={accountsModalIndex !== null}
        onClose={() => setAccountsModalIndex(null)}
        size="50%"
        withCloseButton={false}
        padding={0}
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
        styles={{
          content: { display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" },
          header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
          body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
        }}
      >
        {/* Summary header — which charge these accounts belong to */}
        <Box className="flex justify-between items-center px-6 py-4 shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}
            >
              <IconReceipt2 size={16} className="text-white" />
            </div>
            <div>
              <Text size="sm" fw={800} className="text-slate-900 leading-tight">
                Editing accounts for: {charge.type || "Untitled charge"}
              </Text>
              <Text size="xs" className="text-slate-400 mt-0.5">
                Row #{accountsModalIndex + 1} · {charge.basedOn === "Percentage" ? `${charge.percentage || "0"}%` : charge.amount || "0"}
              </Text>
            </div>
          </div>
          <ActionIcon variant="light" color="gray" radius="xl" size="lg" onClick={() => setAccountsModalIndex(null)} aria-label="Close" className="hover:bg-slate-100">
            <IconX size={16} />
          </ActionIcon>
        </Box>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
          <div className="rounded-xl border p-5 bg-white" style={{ borderColor: theme.blue[1] }}>
            <div className="flex items-center gap-2 mb-4">
              <IconWallet size={16} style={{ color: theme.blue[6] }} />
              <Text size="xs" fw={700} className="uppercase tracking-wide" style={{ color: theme.blue[6] }}>Charge Accounts</Text>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Select
                size="xs"
                searchable
                label="Income Account"
                placeholder="Select income account"
                data={dummyAccounts}
                value={charge.incomeAccount}
                onChange={(v) => update("incomeAccount", v || "")}
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                leftSection={<IconChip icon={IconWallet} color="emerald" />}
                leftSectionWidth={44}
                classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }}
              />
              <Select
                size="xs"
                searchable
                label="Receivable Account"
                placeholder="Select receivable account"
                data={dummyAccounts}
                value={charge.receivableAccount}
                onChange={(v) => update("receivableAccount", v || "")}
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                leftSection={<IconChip icon={IconReceipt2} color="blue" />}
                leftSectionWidth={44}
                classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }}
              />
              <Select
                size="xs"
                searchable
                label="Waiver Account"
                placeholder="Select waiver account"
                data={dummyAccounts}
                value={charge.waiverAccount}
                onChange={(v) => update("waiverAccount", v || "")}
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                leftSection={<IconChip icon={IconClipboardCheck} color="violet" />}
                leftSectionWidth={44}
                classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }}
              />
              <Select
                size="xs"
                searchable
                label="Write Off Account"
                placeholder="Select write off account"
                data={dummyAccounts}
                value={charge.writeOffAccount}
                onChange={(v) => update("writeOffAccount", v || "")}
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                leftSection={<IconChip icon={IconClipboardList} color="danger" />}
                leftSectionWidth={44}
                classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }}
              />
              <Select
                size="xs"
                searchable
                label="Suspense Account"
                placeholder="Select suspense account"
                data={dummyAccounts}
                value={charge.suspenseAccount}
                onChange={(v) => update("suspenseAccount", v || "")}
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                leftSection={<IconChip icon={IconStack2} color="gold" />}
                leftSectionWidth={44}
                classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 p-3.5 px-6 flex justify-between items-center shrink-0">
          <Text size="10px" className="text-slate-400">Shortcuts: Ctrl+↑ previous · Ctrl+↓ next · Esc close</Text>
          <Button size="sm" radius="md" color="brand" className="font-semibold px-6" onClick={() => setAccountsModalIndex(null)}>
            Done
          </Button>
        </div>
      </Modal>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="70%"
      withCloseButton={false}
      padding={0}
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      styles={{
        content: { height: "90vh", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box className="flex flex-col h-full bg-white" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Header — dynamic per step */}
        <Box className="flex justify-between items-start px-6 pt-6 pb-5 shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}
            >
              {(() => {
                const HeaderIcon = headerIcon;
                return <HeaderIcon size={20} className="text-white" />;
              })()}
            </div>
            <div>
              <Text size="xl" fw={800} className="text-slate-900 leading-tight">{headerTitle}</Text>
              <Text size="xs" className="text-slate-500 mt-1">{headerDesc}</Text>
            </div>
          </div>

          <ActionIcon variant="light" color="gray" radius="xl" size="lg" onClick={onClose} aria-label="Close" className="hover:bg-slate-100">
            <IconX size={18} />
          </ActionIcon>
        </Box>

        {/* Stepper */}
        <Box className="px-10 pt-4 pb-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === idx;
              const isComplete = currentStep > idx;
              const StepIcon = step.icon;
              return (
                <Fragment key={step.label}>
                  <button type="button" onClick={() => setActiveTab(idx.toString())} className="flex items-center gap-2.5 text-left shrink-0 group">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full text-[11px] font-semibold shrink-0 transition-all"
                      style={
                        isActive
                          ? { backgroundColor: theme.brand[6], color: "#fff", boxShadow: `0 0 0 4px ${theme.brand[1]}` }
                          : isComplete
                          ? { backgroundColor: theme.brand[5], color: "#fff" }
                          : { backgroundColor: "#fff", color: "#94a3b8", border: "2px solid #e2e8f0" }
                      }
                    >
                      {isComplete ? <IconCheck size={15} /> : <StepIcon size={15} />}
                    </div>
                    <div className="hidden sm:block whitespace-nowrap">
                      <Text size="xs" fw={700} style={{ color: isActive ? theme.brand[6] : isComplete ? "#334155" : "#94a3b8" }}>
                        {step.label}
                      </Text>
                      <Text size="10px" className="text-slate-400">{step.desc}</Text>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-4 rounded-full transition-colors" style={{ backgroundColor: isComplete ? theme.brand[5] : "#e2e8f0" }} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </Box>

        {/* Form Area — only scrollable region, footer always stays put */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 px-7 pb-10 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
          {activeTab === "0" && renderProductDetails()}
          {activeTab === "1" && renderAccounting()}
          {activeTab === "2" && renderCollection()}
          {activeTab === "3" && renderCharges()}
        </div>
        {renderChargeAccountsModal()}

        {/* Footer — always visible */}
        <div className="bg-white border-t border-slate-100 p-3.5 px-6 flex justify-between items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="default" radius="md" onClick={onClose} className="font-semibold px-5 border-slate-200">Cancel</Button>
            <button type="button" onClick={handleReset} className="text-xs font-semibold transition-colors" style={{ color: theme.danger[6] }}>Reset</button>
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button size="sm" variant="default" radius="md" onClick={handleBack} leftSection={<IconArrowLeft size={14} />} className="font-semibold px-5 text-slate-700 border-slate-200">Back</Button>
            )}
            <Button size="sm" variant="default" radius="md" leftSection={<IconDeviceFloppy size={14} />} className="font-semibold px-5 text-slate-700 border-slate-200">Save as Draft</Button>
            <Button size="sm" radius="md" color="brand" onClick={handleNext} rightSection={currentStep < 3 ? <IconArrowRight size={14} /> : <IconCheck size={14} />} className="font-semibold px-6">
              {currentStep < 3 ? "Save & Next" : "Submit"}
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}