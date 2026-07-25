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
} from "@tabler/icons-react";

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
}

const STEPS = [
  { label: "Product Details", desc: "Basic information", icon: IconBriefcase },
  { label: "Accounting", desc: "GL and interest accounts", icon: IconBuildingBank },
  { label: "Collection & Offsets", desc: "Offsets and sequences", icon: IconArrowsExchange },
  { label: "Charges", desc: "Fees and charges", icon: IconReceipt2 },
  { label: "Review", desc: "Review and confirm", icon: IconClipboardCheck },
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

  const handleBack = () => {
    const current = parseInt(activeTab || "0");
    if (current > 0) setActiveTab((current - 1).toString());
  };

  const handleReset = () => {
    setSameAsInterest(false);
    setInterestAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setPenaltyAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setCharges([]);
    setActiveTab("0");
  };

  const dummyAccounts = ["Account A", "Account B", "Account C"];
  const chargeTypes = ["Processing Fee", "Late Fee", "Documentation Fee"];
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
      <SectionCard title="Basic Product Information">
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
      </SectionCard>

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
          <Text size="xs" fw={700} className="text-slate-400 uppercase tracking-wider">GL Type</Text>
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

  const renderCharges = () => (
    <SectionCard title="Loan Charges" description="Fees and charges applied to this loan product.">
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
        <Table size="xs" verticalSpacing="sm">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="w-10"><Checkbox size="xs" aria-label="Select all" /></Table.Th>
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
                <Table.Td colSpan={6} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No rows yet — add a charge to get started
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td><Checkbox size="xs" /></Table.Td>
                  <Table.Td className="text-xs text-slate-500 font-medium">{index + 1}</Table.Td>
                  <Table.Td>
                    <Select size="xs" data={chargeTypes} placeholder="Select type" value={charge.type} onChange={(val) => handleUpdateCharge(charge.id, "type", val || "")} variant="unstyled" className="border-b border-transparent hover:border-slate-200" />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="%" value={charge.percentage} onChange={(e) => handleUpdateCharge(charge.id, "percentage", e.currentTarget.value)} variant="unstyled" className="border-b border-transparent hover:border-slate-200" />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="0.00" value={charge.amount} onChange={(e) => handleUpdateCharge(charge.id, "amount", e.currentTarget.value)} variant="unstyled" className="border-b border-transparent hover:border-slate-200" />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="danger" viant="subtle" onClick={() => handleRemoveCharge(charge.id)}><IconTrash size={16} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
      <Button size="xs" variant="default" onClick={handleAddCharge} radius="md" className="text-slate-700 font-semibold border-slate-200">
        + Add row
      </Button>
    </SectionCard>
  );

  const renderReview = () => (
    <SectionCard title="Review" description="Review and confirm before submitting.">
      <Text size="sm" className="text-slate-500">Review summary goes here.</Text>
    </SectionCard>
  );

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
        <Box className="px-6 pt-4 pb-4 border-b border-slate-100 shrink-0 bg-white">
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
          {activeTab === "4" && renderReview()}
        </div>

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
            <Button size="sm" radius="md" color="brand" onClick={handleNext} rightSection={currentStep < 4 ? <IconArrowRight size={14} /> : <IconCheck size={14} />} className="font-semibold px-6">
              {currentStep < 4 ? "Save & Next" : "Submit"}
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}