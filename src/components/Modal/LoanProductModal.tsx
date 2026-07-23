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
  IconBuildingBank,
  IconChevronDown,
  IconTrash,
  IconInfoCircle,
  IconDeviceFloppy,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconPercentage,
  IconWallet,
  IconArrowsExchange,
  IconReceipt2,
  IconClipboardCheck,
} from "@tabler/icons-react";

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
}

const STEPS = [
  { label: "Product Details", desc: "Basic information", icon: IconWallet },
  { label: "Accounting", desc: "GL and interest accounts", icon: IconBuildingBank },
  { label: "Collection & Offsets", desc: "Offsets and sequences", icon: IconArrowsExchange },
  { label: "Charges", desc: "Fees and charges", icon: IconReceipt2 },
  { label: "Review", desc: "Review and confirm", icon: IconClipboardCheck },
];

// Shared label styling so every field across every step looks consistent
const labelProps = {
  label: "text-[11px] font-semibold text-slate-700 mb-1",
  description: "mt-0 text-[9px] text-slate-400 leading-tight",
  input:
    "min-h-[2px] h-[26px] text-xs border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-colors",
};

const fieldLabelProps = {
  label: "text-[11px] font-medium text-slate-500 mb-1",
  input: "min-h-[26px] h-[26px] text-xs border-slate-200",
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

  // --- Reusable section wrapper — card with a colored accent bar + icon badge ---
  const SectionCard = ({
    title,
    description,
    accent = "indigo",
    children,
  }: {
    title: string;
    description?: string;
    accent?: "indigo" | "violet" | "teal";
    children: React.ReactNode;
  }) => {
    const accentMap: Record<string, string> = {
      indigo: "bg-indigo-500",
      violet: "bg-violet-500",
      teal: "bg-teal-500",
    };
    return (
      <Paper
        withBorder
        radius="lg"
        p={0}
        className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden"
      >
        <div className={`h-[3px] w-full ${accentMap[accent]}`} />
        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Text size="xs" fw={700} className="text-slate-900 tracking-tight">
              {title}
            </Text>
            <IconInfoCircle size={13} className="text-slate-300" />
          </div>
          {description && (
            <Text size="10px" className="text-slate-400 mb-4">
              {description}
            </Text>
          )}
          {!description && <div className="mb-2" />}
          {children}
        </div>
      </Paper>
    );
  };

  const SubHeading = ({
    children,
    color = "indigo",
  }: {
    children: React.ReactNode;
    color?: "indigo" | "rose";
  }) => {
    const colorMap =
      color === "rose"
        ? { dot: "bg-rose-400", text: "text-rose-600" }
        : { dot: "bg-indigo-400", text: "text-indigo-600" };
    return (
      <div className="flex items-center gap-1.5 mb-3">
        <span className={`w-1 h-3 rounded-full ${colorMap.dot}`} />
        <Text size="10px" fw={700} className={`${colorMap.text} uppercase tracking-wide`}>
          {children}
        </Text>
      </div>
    );
  };

  const renderProductDetails = () => (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Basic Product Information"
        description="Capture the basic details of the loan product."
        accent="indigo"
      >
        <div className="grid grid-cols-3 gap-x-5 gap-y-3">
          <TextInput
            size="xs"
            label="Product Code"
            placeholder="Enter code"
            withAsterisk
            classNames={labelProps}
          />
          <TextInput
            size="xs"
            label="Product Name"
            placeholder="Enter product name"
            withAsterisk
            classNames={labelProps}
          />
          <Select
            size="xs"
            searchable
            rightSection={<IconChevronDown size={13} className="text-slate-400" />}
            label="Loan Category"
            placeholder="Select category"
            data={["Personal Loan", "Home Loan", "Auto Loan"]}
            withAsterisk
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
            classNames={labelProps}
          />
          <TextInput
            size="xs"
            label="Maximum Loan Amount"
            placeholder="Enter amount"
            leftSection={<Text size="xs" className="text-slate-400">₹</Text>}
            withAsterisk
            classNames={labelProps}
          />
          <TextInput
            size="xs"
            label="Days Past Due Threshold for NPA"
            placeholder="Enter days"
            withAsterisk
            classNames={labelProps}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Interest & Penalty"
        description="Configure interest rate, penalty rate and related settings."
        accent="violet"
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-2 mt-2">
            <SubHeading>Interest</SubHeading>
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              <TextInput
                size="xs"
                label="Interest Rate (%)"
                placeholder="0.00"
                rightSection={<IconPercentage size={12} className="text-slate-400" />}
                withAsterisk
                classNames={labelProps}
              />
              <Select
                size="xs"
                searchable
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                label="Interest Frequency"
                placeholder="Select"
                data={frequencyOptions}
                withAsterisk
                classNames={labelProps}
              />
            </div>
          </div>

          <div className="rounded-lg bg-rose-50/40 border border-rose-100 p-2">
            <SubHeading color="rose">Penalty</SubHeading>
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              <TextInput
                size="xs"
                label="Penalty Rate (%)"
                placeholder="0.00"
                rightSection={<IconPercentage size={12} className="text-slate-400" />}
                withAsterisk
                classNames={labelProps}
              />
              <Select
                size="xs"
                searchable
                rightSection={<IconChevronDown size={13} className="text-slate-400" />}
                label="Penalty Frequency"
                placeholder="Select"
                data={frequencyOptions}
                withAsterisk
                classNames={labelProps}
              />
              <TextInput
                size="xs"
                label="Grace Period (Days)"
                placeholder="0"
                classNames={labelProps}
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderAccounting = () => (
    <div className="flex flex-col gap-4">
      <SectionCard title="Accounts" description="Map GL accounts used by this loan product." accent="indigo">
        {/* Principal Accounts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Text size="xs" fw={700} className="text-slate-900">
              Principal Accounts
            </Text>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-3">
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Loan Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Disbursement Bank Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Repayment Bank Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
          </div>
        </div>

        {/* Interest & Penalty Accounts Section */}
        <div className="mb-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Text size="xs" fw={700} className="text-slate-900">
              Interest & Penalty Accounts
            </Text>
            {/* <Checkbox
              size="xs"
              label="Same as Interest"
              checked={sameAsInterest}
              onChange={handleSameAsInterestToggle}
              classNames={{ label: "text-[10px] text-slate-600 font-semibold cursor-pointer" }}
            /> */}
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            {/* Header Row */}
            <div className="grid grid-cols-3 gap-6 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <Text size="10px" fw={700} className="text-slate-500 uppercase tracking-wider">
                GL
              </Text>
              <Text size="10px" fw={700} className="text-indigo-600 uppercase tracking-wider">
                INTEREST
              </Text>
              <Text size="10px" fw={700} className="text-rose-600 uppercase tracking-wider">
                PENALTY
              </Text>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col gap-3 p-4">
              {[
                { key: "income", label: "Income Account" },
                { key: "receivable", label: "Receivable Account" },
                { key: "accrued", label: "Accrued Account" },
                { key: "suspended", label: "Suspended Account" },
                { key: "waiver", label: "Waiver Account" },
              ].map(({ key, label }) => (
                <div key={key} className="grid grid-cols-3 gap-6 items-center">
                  <Text size="xs" fw={600} className="text-slate-700">
                    {label}
                  </Text>
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
          </div>
        </div>

        {/* General Accounts Section */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Text size="xs" fw={700} className="text-slate-900">
              General Accounts
            </Text>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-3">
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Write Off Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Write Off Recovery"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Subsidy Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Security Deposit Account"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Suspense Collection"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
            <Select
              size="xs"
              searchable
              rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              placeholder="Select account"
              label="Customer Refund"
              data={dummyAccounts}
              classNames={fieldLabelProps}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderCollection = () => (
    <SectionCard
      title="Collection Sequence"
      description="Define collection order by asset classification."
      accent="teal"
    >
      <div className="grid grid-cols-4 gap-4">
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-slate-400" />}
          label="Standard Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
          classNames={labelProps}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-slate-400" />}
          label="Sub Standard Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
          classNames={labelProps}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-slate-400" />}
          label="Written Off Asset"
          placeholder="Select sequence"
          data={["Sequence 1"]}
          classNames={labelProps}
        />
        <Select
          size="xs"
          searchable
          rightSection={<IconChevronDown size={14} className="text-slate-400" />}
          label="Settlement Collection"
          placeholder="Select sequence"
          data={["Sequence 1"]}
          classNames={labelProps}
        />
      </div>
    </SectionCard>
  );

  const renderCharges = () => (
    <SectionCard title="Loan Charges" description="Fees and charges applied to this loan product." accent="violet">
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
        <Table size="xs" verticalSpacing="sm">
          <Table.Thead className="bg-slate-50">
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
                <Table.Td colSpan={6} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No rows yet — add a charge to get started
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td>
                    <Checkbox size="xs" />
                  </Table.Td>
                  <Table.Td className="text-xs text-slate-500 font-medium">{index + 1}</Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={chargeTypes}
                      placeholder="Select type"
                      value={charge.type}
                      onChange={(val) => handleUpdateCharge(charge.id, "type", val || "")}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-slate-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="%"
                      value={charge.percentage}
                      onChange={(e) => handleUpdateCharge(charge.id, "percentage", e.currentTarget.value)}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-slate-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="0.00"
                      value={charge.amount}
                      onChange={(e) => handleUpdateCharge(charge.id, "amount", e.currentTarget.value)}
                      variant="unstyled"
                      className="border-b border-transparent hover:border-slate-200"
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveCharge(charge.id)}>
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
        className="text-slate-700 font-semibold border-slate-200"
      >
        + Add row
      </Button>
    </SectionCard>
  );

  const renderReview = () => (
    <SectionCard title="Review" description="Review and confirm before submitting." accent="teal">
      <Text size="sm" className="text-slate-500">
        Review summary goes here.
      </Text>
    </SectionCard>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      withCloseButton={false}
      padding={0}
      radius="lg"
      styles={{
        content: {
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box
        className="flex flex-col h-full bg-white"
        style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* Header */}
        <Box  bg="brand.6" className="flex justify-between items-start px-6 pt-5 pb-4 shrink-0 bg-gradient-to-r via-white to-white border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <IconBuildingBank size={18} className="text-white" />
            </div>
            <div>
              <Text size="lg" fw={700} className="text-white leading-tight">
                Create Loan Product
              </Text>
              <Text size="xs" className="text-white mt-0.5">
                Define product details and rules for this loan offering.
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onClose}
              aria-label="Close"
              className="hover:bg-slate-100"
            >
              <IconX size={18} />
            </ActionIcon>
          </div>
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
                  <button
                    type="button"
                    onClick={() => setActiveTab(idx.toString())}
                    className="flex items-center gap-2.5 text-left shrink-0 group"
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0 transition-all ${isActive
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : isComplete
                            ? "bg-indigo-500 text-white"
                            : "bg-white text-slate-400 border-2 border-slate-200 group-hover:border-slate-300"
                        }`}
                    >
                      {isComplete ? <IconCheck size={13} /> : <StepIcon size={12} />}
                    </div>
                    <div className="hidden sm:block whitespace-nowrap">
                      <Text
                        size="xs"
                        fw={700}
                        className={isActive ? "text-indigo-600" : isComplete ? "text-slate-700" : "text-slate-400"}
                      >
                        {step.label}
                      </Text>
                      <Text size="10px" className="text-slate-400">
                        {step.desc}
                      </Text>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-4 rounded-full transition-colors ${isComplete ? "bg-indigo-400" : "bg-slate-150"
                        }`}
                      style={!isComplete ? { backgroundColor: "#e2e8f0" } : undefined}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </Box>

        {/* Form Area — this is the only part that scrolls, so the footer stays put */}
        <div
          className="flex-1 min-h-0 overflow-y-auto p-5 px-6 pb-8 bg-[#F7F8FB]"
          style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}
        >
          {activeTab === "0" && renderProductDetails()}
          {activeTab === "1" && renderAccounting()}
          {activeTab === "2" && renderCollection()}
          {activeTab === "3" && renderCharges()}
          {activeTab === "4" && renderReview()}
        </div>

        {/* Footer Action Bar — always visible, never requires scrolling */}
        <div className="bg-white border-t border-slate-100 p-3.5 px-6 flex justify-between items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5 border-slate-200">
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={handleBack}
                leftSection={<IconArrowLeft size={14} />}
                className="font-semibold px-5 text-slate-700 border-slate-200"
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              variant="default"
              leftSection={<IconDeviceFloppy size={14} />}
              className="font-semibold px-5 text-slate-700 border-slate-200"
            >
              Save as Draft
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              color="indigoAlt"
              rightSection={currentStep < 4 ? <IconArrowRight size={14} /> : <IconCheck size={14} />}
            >
              {currentStep < 4 ? "Save & Next" : "Submit"}
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}