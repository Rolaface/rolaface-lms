import { useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Tooltip,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconBriefcase,
  IconHash,
  IconFileText,
  IconCurrencyDollar,
  IconPercentage,
  IconCalendar,
  IconInfoCircle,
  IconChevronDown,
} from "@tabler/icons-react";

interface CollateralModalProps {
  opened: boolean;
  onClose: () => void;
}

const labelClass = { label: "text-sm font-medium text-slate-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-slate-500" />;

const COLLATERAL_TYPES = [
  "Market Value Based",
  "Guarantee Based",
  "Normal",
  "Mortgage Initiated",
  "Taken Over",
];

// --- Helper Components ---
function FieldIcon({
  Icon,
  bg,
  color,
}: {
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="p-1.5 rounded-md flex items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      <Icon size={14} style={{ color }} />
    </div>
  );
}

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-4">
    <div className="flex items-center gap-1.5">
      <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
        {title}
      </Text>
      <Tooltip label={subtitle} withArrow>
        <IconInfoCircle size={13} className="text-slate-400" />
      </Tooltip>
    </div>
    <Text size="xs" c="dimmed">
      {subtitle}
    </Text>
  </div>
);

const SummaryRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between items-center border-b border-dashed border-indigo-200/70 py-2">
    <Text size="xs" className="text-indigo-700">
      {label}
    </Text>
    <Text size="xs" fw={bold ? 700 : 600} className="text-slate-900 font-mono">
      {value}
    </Text>
  </div>
);

export function CollateralModal({ opened, onClose }: CollateralModalProps) {
  // --- Form State ---
  const [collateralCode, setCollateralCode] = useState("");
  const [collateralType, setCollateralType] = useState<string | null>(null);
  const [collateralDescription, setCollateralDescription] = useState("");
  const [collateralValue, setCollateralValue] = useState<number | "">("");
  const [limitContribution, setLimitContribution] = useState<number | "">("");
  const [haircutPercent, setHaircutPercent] = useState<number | "">("");
  const [interestRate, setInterestRate] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleReset = () => {
    setCollateralCode("");
    setCollateralType(null);
    setCollateralDescription("");
    setCollateralValue("");
    setLimitContribution("");
    setHaircutPercent("");
    setInterestRate("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Modal opened={opened} onClose={onClose} size="85%" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col h-auto max-h-[90vh]">
        
        {/* Header */}
        <Box className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-md">
              <IconBriefcase size={22} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={600} className="leading-tight">
                New Collateral
              </Text>
              <Text size="xs" className="text-indigo-100">
                Register a new collateral asset to the system.
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="subtle" className="text-white hover:bg-white/10 px-2" size="xs">
              <IconMinus size={18} />
            </Button>
            <Button variant="subtle" onClick={onClose} className="text-white hover:bg-white/10 px-2" size="xs">
              <IconX size={18} />
            </Button>
          </div>
        </Box>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Identification Section */}
            <div className="border border-slate-200 rounded-md p-5">
              <SectionHeader
                title="Collateral Identification"
                subtitle="Basic details and categorisation of the collateral."
              />
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <TextInput
                  size="sm"
                  label="Collateral Code"
                  placeholder="Enter code"
                  value={collateralCode}
                  onChange={(e) => setCollateralCode(e.currentTarget.value)}
                  leftSection={<FieldIcon Icon={IconHash} bg="#EEF2FF" color="#4F46E5" />}
                  classNames={labelClass}
                />
                <Select
                  size="sm"
                  label="Collateral Type"
                  placeholder="Select type"
                  data={COLLATERAL_TYPES}
                  value={collateralType}
                  onChange={setCollateralType}
                  leftSection={<FieldIcon Icon={IconBriefcase} bg="#F3E8FF" color="#9333EA" />}
                  rightSection={chevronDown}
                  classNames={labelClass}
                />
                <TextInput
                  size="sm"
                  label="Collateral Description"
                  placeholder="Brief description"
                  value={collateralDescription}
                  onChange={(e) => setCollateralDescription(e.currentTarget.value)}
                  leftSection={<FieldIcon Icon={IconFileText} bg="#F3E8FF" color="#9333EA" />}
                  classNames={labelClass}
                />
              </div>
            </div>

            {/* Valuation Section */}
            <div className="border border-slate-200 rounded-md p-5">
              <SectionHeader
                title="Valuation & Metrics"
                subtitle="Financial values and limits applied to the collateral."
              />
              <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                <NumberInput
                  size="sm"
                  label="Collateral Value"
                  placeholder="0"
                  value={collateralValue}
                  onChange={(v) => setCollateralValue(v as number | "")}
                  leftSection={<FieldIcon Icon={IconCurrencyDollar} bg="#FFF7ED" color="#EA580C" />}
                  thousandSeparator=","
                  classNames={labelClass}
                />
                <NumberInput
                  size="sm"
                  label="Limit Contribution"
                  placeholder="0"
                  value={limitContribution}
                  onChange={(v) => setLimitContribution(v as number | "")}
                  leftSection={<FieldIcon Icon={IconCurrencyDollar} bg="#ECFDF5" color="#059669" />}
                  thousandSeparator=","
                  classNames={labelClass}
                />
                <NumberInput
                  size="sm"
                  label="Haircut Percent (%)"
                  placeholder="0.00"
                  value={haircutPercent}
                  onChange={(v) => setHaircutPercent(v as number | "")}
                  leftSection={<FieldIcon Icon={IconPercentage} bg="#EEF2FF" color="#4F46E5" />}
                  classNames={labelClass}
                />
                <NumberInput
                  size="sm"
                  label="Interest Rate (%)"
                  placeholder="0.00"
                  value={interestRate}
                  onChange={(v) => setInterestRate(v as number | "")}
                  leftSection={<FieldIcon Icon={IconPercentage} bg="#EEF2FF" color="#4F46E5" />}
                  classNames={labelClass}
                />
              </div>
            </div>

            {/* Validity Period Section */}
            <div className="border border-slate-200 rounded-md p-5">
              <SectionHeader
                title="Validity Period"
                subtitle="Start and end dates for the collateral's active term."
              />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-1/2">
                <TextInput
                  size="sm"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.currentTarget.value)}
                  leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
                  classNames={labelClass}
                />
                <TextInput
                  size="sm"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.currentTarget.value)}
                  leftSection={<FieldIcon Icon={IconCalendar} bg="#FEF2F2" color="#DC2626" />}
                  classNames={labelClass}
                />
              </div>
            </div>
            
          </div>

          {/* Live Preview Sidebar */}
          <div className="w-[280px] border-l border-slate-200 bg-gradient-to-b from-indigo-50/60 to-violet-50/60 p-5 shrink-0 overflow-y-auto">
            <Text size="xs" fw={700} className="text-indigo-600 uppercase tracking-wide" style={{ fontSize: 10 }}>
              Live Preview
            </Text>
            <Text size="sm" fw={700} className="text-slate-900 mb-4">
              Collateral Summary
            </Text>

            <div className="flex flex-col">
              <SummaryRow label="Code" value={collateralCode || "—"} />
              <SummaryRow label="Type" value={collateralType || "—"} />
              <SummaryRow
                label="Value"
                value={collateralValue ? `$${Number(collateralValue).toLocaleString("en-US")}` : "—"}
                bold
              />
              <SummaryRow
                label="Limit Contrib."
                value={limitContribution ? `$${Number(limitContribution).toLocaleString("en-US")}` : "—"}
              />
              <SummaryRow label="Haircut" value={haircutPercent ? `${haircutPercent}%` : "—"} />
              <SummaryRow label="Interest Rate" value={interestRate ? `${interestRate}%` : "—"} />
              <SummaryRow label="Start Date" value={startDate || "—"} />
              <SummaryRow label="End Date" value={endDate || "—"} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 p-3 px-5 flex justify-between items-center shrink-0 rounded-b-md">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5 text-slate-700 border-slate-200">
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
            <Button size="sm" variant="default" className="font-semibold px-5 text-slate-700 border-slate-200">
              Save as Draft
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold px-6">
              Submit Collateral
            </Button>
          </div>
        </div>
        
      </Box>
    </Modal>
  );
}