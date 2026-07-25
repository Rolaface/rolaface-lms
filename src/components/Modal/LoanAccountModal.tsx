// LoanAccountModal.tsx
import { Fragment, useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconFileText,
  IconIdBadge2,
  IconCalendarStats,
  IconReceipt2,
  IconBriefcase,
  IconUsers,
  IconFileUpload,
  IconCalculator,
  IconChevronDown,
  IconSearch,
  IconTrash,
  IconBriefcase2,
  IconCheck,
  IconInfoCircle,
  IconHash,
  IconUser,
  IconCalendar,
  IconCurrencyDollar,
  IconCurrencyRupee,
  IconRefresh,
  IconClock,
  IconAdjustments,
  IconSettings, IconPencil, 
  IconPercentage,
} from "@tabler/icons-react";

import { CollateralModal } from "./CollateralModal";

interface LoanAccountModalProps {
  opened: boolean;
  onClose: () => void;
}

const labelClass = { label: "text-sm font-medium text-slate-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-slate-500" />;

// Fixed rate used for the Basic Details EMI preview — in a real app this
// would come from the selected Product Code.
const ANNUAL_RATE = 14.5;

// --- Field icon tile helper, matching the LoanProduct field-icon style ---
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

function calcEmi(principal: number, annualRate: number, tenureMonths: number) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

function calcPrincipalFromEmi(emi: number, annualRate: number, tenureMonths: number) {
  if (!emi || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const principal = (emi * (Math.pow(1 + r, tenureMonths) - 1)) / (r * Math.pow(1 + r, tenureMonths));
  return Math.round(principal * 100) / 100;
}

function buildAmortization(principal: number, annualRate: number, tenureMonths: number) {
  if (!principal || !annualRate || !tenureMonths) return [];
  const r = annualRate / 12 / 100;
  const emi = calcEmi(principal, annualRate, tenureMonths);
  let balance = principal;
  const rows = [];
  const start = new Date();
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * r * 100) / 100;
    const principalPaid = Math.round((emi - interest) * 100) / 100;
    const ending = Math.round((balance - principalPaid) * 100) / 100;
    const date = new Date(start.getFullYear(), start.getMonth() + i, 15);
    rows.push({
      inst: i,
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      beginning: balance,
      principal: principalPaid,
      interest,
      emi,
      ending,
    });
    balance = ending;
  }
  return rows;
}

interface ChargeRow {
  id: number;
  feeType: string;
  amount: number;
  appliedOn: string;
}

interface DocumentRow {
  id: number;
  name: string;
  status: "Pending" | "Uploaded";
}

const FEE_TYPES = ["Processing Fee", "Documentation Charges", "Insurance Premium", "Legal Fee"];
const CURRENCIES = ["USD", "INR", "EUR", "GBP"];
const TENURE_UNITS = ["Months", "Years"];
const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const MORATORIUM_TYPES = ["None", "Principal Only", "EMI (Principal + Interest)"];

const DEFAULT_DOCUMENTS: DocumentRow[] = [
  { id: 1, name: "National ID / Passport", status: "Pending" },
  { id: 2, name: "Proof of Address", status: "Pending" },
  { id: 3, name: "Proof of Income / Payslip", status: "Pending" },
  { id: 4, name: "Signed Loan Account Form", status: "Pending" },
];

const TAB_ITEMS: { value: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: "basic", label: "Basic Details", icon: IconIdBadge2 },
  { value: "schedule", label: "Repayment Schedule", icon: IconCalendarStats },
  { value: "charges", label: "Charges", icon: IconReceipt2 },
  { value: "collateral", label: "Collateral", icon: IconBriefcase },
  { value: "coapplicant", label: "Co-applicant", icon: IconUsers },
  { value: "documents", label: "Documents", icon: IconFileUpload },
  { value: "simulator", label: "Loan Simulator", icon: IconCalculator },
];

// Add this near the top of the file, alongside the other helpers (outside the component):
function TenureField({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  value: number | "";
  unit: string | null;
  onValueChange: (v: number | "") => void;
  onUnitChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Text size="sm" fw={500} className="text-slate-700 mb-1">
        Tenure
      </Text>
      <div className="flex gap-2">
        <NumberInput
          size="sm"
          placeholder="0"
          value={value}
          onChange={(v) => onValueChange(v as number | "")}
          leftSection={<FieldIcon Icon={IconCalendarStats} bg="#ECFDF5" color="#059669" />}
          className="flex-1"
        />
        <Select
          size="sm"
          data={TENURE_UNITS}
          value={unit}
          onChange={onUnitChange}
          rightSection={<IconChevronDown size={14} className="text-slate-500" />}
          className="w-28"
        />
      </div>
    </div>
  );
}

export function LoanAccountModal({ opened, onClose }: LoanAccountModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("basic");

  // --- Tab 1: Basic Details ---
  const [productCode, setProductCode] = useState<string | null>(null);
  const [loanAcNumber] = useState(""); // auto-generated on save
  const [refNumber, setRefNumber] = useState("REF-2026-000482");
  const [customerNumber, setCustomerNumber] = useState<string | null>(null);

  const [transactionDate, setTransactionDate] = useState("");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState<string | null>("USD");
  const [loanAmount, setLoanAmount] = useState<number | "">("");
  const [tenureValue, setTenureValue] = useState<number | "">("");
  const [tenureUnit, setTenureUnit] = useState<string | null>("Months");
  const [frequency, setFrequency] = useState<string | null>("Monthly");
  const [repaymentStartDate, setRepaymentStartDate] = useState("");
const [collateralModalOpened, setCollateralModalOpened] = useState(false);
const [collateralSearch, setCollateralSearch] = useState("");

  const [moratoriumType, setMoratoriumType] = useState<string | null>("None");
  const [moratoriumPeriod, setMoratoriumPeriod] = useState<number | "">("");

  const tenureMonths = useMemo(() => {
    if (tenureValue === "") return 0;
    return tenureUnit === "Years" ? Number(tenureValue) * 12 : Number(tenureValue);
  }, [tenureValue, tenureUnit]);

  const estimatedEmi = useMemo(
    () => calcEmi(Number(loanAmount) || 0, ANNUAL_RATE, tenureMonths),
    [loanAmount, tenureMonths]
  );
  const totalRepayment = useMemo(
    () => Math.round(estimatedEmi * tenureMonths * 100) / 100,
    [estimatedEmi, tenureMonths]
  );
  const totalInterest = useMemo(
    () => Math.round((totalRepayment - (Number(loanAmount) || 0)) * 100) / 100,
    [totalRepayment, loanAmount]
  );

  const maturityDate = useMemo(() => {
    if (!valueDate || !tenureMonths) return "";
    const d = new Date(valueDate);
    d.setMonth(d.getMonth() + tenureMonths);
    return d.toISOString().split("T")[0];
  }, [valueDate, tenureMonths]);

  // --- Tab 2: Repayment Schedule ---
  const amortization = useMemo(
    () => buildAmortization(Number(loanAmount) || 0, ANNUAL_RATE, tenureMonths),
    [loanAmount, tenureMonths]
  );

  // --- Tab 3: Charges ---
  const [chargeFeeType, setChargeFeeType] = useState<string | null>("Processing Fee");
  const [chargeAmount, setChargeAmount] = useState<number | "">("");
  const [charges, setCharges] = useState<ChargeRow[]>([]);

  const handleAddCharge = () => {
    if (!chargeFeeType || chargeAmount === "" || Number(chargeAmount) <= 0) return;
    setCharges((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1,
        feeType: chargeFeeType,
        amount: Number(chargeAmount),
        appliedOn: "Transaction Date",
      },
    ]);
    setChargeAmount("");
  };

  const handleRemoveCharge = (id: number) => {
    setCharges((prev) => prev.filter((c) => c.id !== id));
  };

  // --- Tab 4: Collateral ---
  const [collaterals, setCollaterals] = useState<{ id: number; name: string }[]>([]);

  // --- Tab 5: Co-applicant ---
  const [coApplicantSearch, setCoApplicantSearch] = useState("");
  const [coApplicants, setCoApplicants] = useState<{ id: number; name: string }[]>([]);

  // --- Tab 6: Documents ---
  const [documents, setDocuments] = useState<DocumentRow[]>(DEFAULT_DOCUMENTS);

  // --- Tab 7: Loan Simulator ---
  const [simPrincipal, setSimPrincipal] = useState<number | "">(50000);
  const [simRate, setSimRate] = useState<number | "">(14.5);
  const [simTenure, setSimTenure] = useState<number | "">(12);
  const [simEmi, setSimEmi] = useState<number | "">("");
  const [simMode, setSimMode] = useState<"principalToEmi" | "emiToPrincipal">("principalToEmi");

  const simComputedEmi = useMemo(() => {
    if (simMode === "emiToPrincipal") return Number(simEmi) || 0;
    return calcEmi(Number(simPrincipal) || 0, Number(simRate) || 0, Number(simTenure) || 0);
  }, [simMode, simPrincipal, simRate, simTenure, simEmi]);

  const simComputedPrincipal = useMemo(() => {
    if (simMode === "emiToPrincipal") {
      return calcPrincipalFromEmi(Number(simEmi) || 0, Number(simRate) || 0, Number(simTenure) || 0);
    }
    return Number(simPrincipal) || 0;
  }, [simMode, simEmi, simRate, simTenure, simPrincipal]);

  const simTotalRepayment = useMemo(
    () => Math.round(simComputedEmi * (Number(simTenure) || 0) * 100) / 100,
    [simComputedEmi, simTenure]
  );
  const simTotalInterest = useMemo(
    () => Math.round((simTotalRepayment - simComputedPrincipal) * 100) / 100,
    [simTotalRepayment, simComputedPrincipal]
  );

  const handleSimPrincipalChange = (v: number | "") => {
    setSimPrincipal(v);
    setSimMode("principalToEmi");
    setSimEmi("");
  };

  const handleSimEmiChange = (v: number | "") => {
    setSimEmi(v);
    setSimMode("emiToPrincipal");
  };

  const handleApplySimulatorToForm = () => {
    setLoanAmount(simComputedPrincipal);
    setTenureValue(simTenure);
    setTenureUnit("Months");
    setActiveTab("basic");
  };

  // --- Summary (shared, persistent) ---
  const summaryPrincipal = Number(loanAmount) || 0;

  const handleReset = () => {
    setProductCode(null);
    setRefNumber("REF-2026-000482");
    setCustomerNumber(null);
    setTransactionDate("");
    setValueDate("");
    setCurrency("USD");
    setLoanAmount("");
    setTenureValue("");
    setTenureUnit("Months");
    setFrequency("Monthly");
    setRepaymentStartDate("");
    setMoratoriumType("None");
    setMoratoriumPeriod("");
    setCharges([]);
    setCollaterals([]);
    setCoApplicants([]);
    setCoApplicantSearch("");
    setDocuments(DEFAULT_DOCUMENTS);
    setActiveTab("basic");
  };

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

  const renderBasicDetails = () => (
    <div className="flex flex-col gap-2">
      <div className="border border-slate-200 rounded-md p-5">
        <SectionHeader
          title="Account Identifiers"
          subtitle="Product and customer linkage for this account."
        />
        <div className="grid grid-cols-4 gap-x-8 gap-y-1">
          <Select
            size="sm"
            label="Product Code"
            placeholder="Search product code..."
            data={[]}
            searchable
            value={productCode}
            onChange={setProductCode}
            leftSection={<FieldIcon Icon={IconHash} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Loan A/C Number"
            placeholder="Auto-generated on save"
            value={loanAcNumber}
            disabled
            leftSection={<FieldIcon Icon={IconIdBadge2} bg="#F3E8FF" color="#9333EA" />}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Ref Number"
            value={refNumber}
            onChange={(e) => setRefNumber(e.currentTarget.value)}
            leftSection={<FieldIcon Icon={IconFileText} bg="#F3E8FF" color="#9333EA" />}
            classNames={labelClass}
          />
          <Select
            size="sm"
            label="Customer Number"
            placeholder="Search customer number..."
            data={[]}
            searchable
            value={customerNumber}
            onChange={setCustomerNumber}
            leftSection={<FieldIcon Icon={IconUser} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-md p-5">
        <SectionHeader
          title="Timeline & Loan Financials"
          subtitle="Dates, currency, amount and repayment structure."
        />
        <div className="grid grid-cols-4 gap-x-8 gap-y-1">
          <TextInput
            size="sm"
            type="date"
            label="Transaction Date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.currentTarget.value)}
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            type="date"
            label="Value Date"
            value={valueDate}
            onChange={(e) => setValueDate(e.currentTarget.value)}
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          <Select
            size="sm"
            label="Currency"
            data={CURRENCIES}
            value={currency}
            onChange={setCurrency}
            leftSection={<FieldIcon Icon={IconCurrencyDollar} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Loan Amount"
            placeholder="0"
            value={loanAmount}
            onChange={(v) => setLoanAmount(v as number | "")}
            leftSection={<FieldIcon Icon={IconCurrencyRupee} bg="#FFF7ED" color="#EA580C" />}
            thousandSeparator=","
            classNames={labelClass}
          />
          <TenureField
            value={tenureValue}
            unit={tenureUnit}
            onValueChange={setTenureValue}
            onUnitChange={setTenureUnit}
          />
          <Select
            size="sm"
            label="Frequency"
            data={FREQUENCIES}
            value={frequency}
            onChange={setFrequency}
            leftSection={<FieldIcon Icon={IconRefresh} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Maturity Date"
            placeholder="Auto-calculated"
            value={maturityDate}
            disabled
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            type="date"
            label="Repayment Start Date"
            value={repaymentStartDate}
            onChange={(e) => setRepaymentStartDate(e.currentTarget.value)}
            leftSection={<FieldIcon Icon={IconCalendar} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-md p-5">
        <SectionHeader
          title="Exceptions / Moratorium"
          subtitle="Optional grace period before repayment obligations begin."
        />
        <div className="grid grid-cols-3 gap-x-8 gap-y-1">
          <Select
            size="sm"
            label="Moratorium (Principal / EMI)"
            data={MORATORIUM_TYPES}
            value={moratoriumType}
            onChange={setMoratoriumType}
            leftSection={<FieldIcon Icon={IconAdjustments} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <div>
            <NumberInput
              size="sm"
              label="Moratorium Period"
              placeholder="0"
              value={moratoriumPeriod}
              onChange={(v) => setMoratoriumPeriod(v as number | "")}
              disabled={!moratoriumType || moratoriumType === "None"}
              leftSection={<FieldIcon Icon={IconClock} bg="#FEF2F2" color="#DC2626" />}
              classNames={labelClass}
            />
            <Text size="xs" c="dimmed" className="mt-1">
              In months. Enabled when a moratorium type is selected.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRepaymentSchedule = () => (
    <div className="flex flex-col gap-3">
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Inst. No.
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Date
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Beginning Bal.
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Principal
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Interest
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                EMI
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Ending Bal.
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {amortization.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  Schedule regenerates automatically once Basic Details are complete.
                </Table.Td>
              </Table.Tr>
            ) : (
              amortization.map((row) => (
                <Table.Tr key={row.inst}>
                  <Table.Td>{row.inst}</Table.Td>
                  <Table.Td>{row.date}</Table.Td>
                  <Table.Td className="font-mono">{row.beginning.toFixed(2)}</Table.Td>
                  <Table.Td className="font-mono">{row.principal.toFixed(2)}</Table.Td>
                  <Table.Td className="font-mono">{row.interest.toFixed(2)}</Table.Td>
                  <Table.Td className="font-mono">{row.emi.toFixed(2)}</Table.Td>
                  <Table.Td className="font-mono">{row.ending.toFixed(2)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
      {amortization.length > 0 && (
        <Text size="xs" c="dimmed">
          Schedule regenerates automatically once Basic Details are complete.
        </Text>
      )}
    </div>
  );

  const renderCharges = () => (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Add Charge
          </Text>
          <Tooltip label="Add a one-time or recurring fee for this loan account." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex items-end gap-3">
          <Select
            size="sm"
            label="Fee Type"
            data={FEE_TYPES}
            value={chargeFeeType}
            onChange={setChargeFeeType}
            leftSection={<FieldIcon Icon={IconReceipt2} bg="#EEF2FF" color="#4F46E5" />}
            rightSection={chevronDown}
            classNames={labelClass}
            className="flex-1"
          />
          <NumberInput
            size="sm"
            label="Amount"
            placeholder="0.00"
            value={chargeAmount}
            onChange={(v) => setChargeAmount(v as number | "")}
            leftSection={<FieldIcon Icon={IconCurrencyRupee} bg="#FFF7ED" color="#EA580C" />}
            classNames={labelClass}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0"
            onClick={handleAddCharge}
          >
            + Add Charge
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Fee Type
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Amount
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-slate-500">
                Applied On
              </Table.Th>
              <Table.Th className="w-10" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No charges added yet.
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td className="font-medium text-indigo-600">{c.feeType}</Table.Td>
                  <Table.Td className="font-mono">{c.amount.toFixed(2)}</Table.Td>
                  <Table.Td className="text-orange-600 font-medium">{c.appliedOn}</Table.Td>
                  <Table.Td>
                    <Tooltip label="Remove" withArrow>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={() => handleRemoveCharge(c.id)}
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
      </div>
    </div>
  );

const renderCollateral = () => (
    <div className="flex flex-col gap-6">
      <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Find Existing Collateral
          </Text>
          <Tooltip label="Search for an existing collateral asset to link to this loan account." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex gap-3">
          <TextInput
            size="sm"
            placeholder="Search by collateral code or description..."
            leftSection={<IconSearch size={14} className="text-slate-400" />}
            value={collateralSearch}
            onChange={(e) => setCollateralSearch(e.currentTarget.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 px-6"
          >
            Search
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 border border-slate-200 rounded-md">
        <IconBriefcase2 size={40} className="text-indigo-400 mb-4" />
        <Text size="sm" fw={700} className="text-slate-900">
          No collaterals linked
        </Text>
        <Text size="xs" c="dimmed" className="mb-4">
          Attach a collateral asset to secure this loan account.
        </Text>
        <Button
          size="xs"
          variant="outline"
          color="indigo"
          className="border-dashed"
          onClick={() => setCollateralModalOpened(true)}
        >
          + Add Collateral
        </Button>
        {collaterals.length > 0 && (
          <div className="w-full mt-6 flex flex-col gap-2">
            {collaterals.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <span>{c.name}</span>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="subtle"
                  onClick={() => setCollaterals((prev) => prev.filter((x) => x.id !== c.id))}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
//   const renderCoApplicant = () => (
//     <div className="flex flex-col gap-6">
//       <div className="border border-slate-200 rounded-md p-5">
//         <div className="flex items-center gap-1.5 mb-3">
//           <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
//             Find Existing Customer
//           </Text>
//           <Tooltip label="Search for an existing customer to add as a co-applicant." withArrow>
//             <IconInfoCircle size={13} className="text-slate-400" />
//           </Tooltip>
//         </div>
//         <div className="flex gap-3">
//           <TextInput
//             size="sm"
//             placeholder="Search by name or customer number..."
//             leftSection={<IconSearch size={14} className="text-slate-400" />}
//             value={coApplicantSearch}
//             onChange={(e) => setCoApplicantSearch(e.currentTarget.value)}
//             className="flex-1"
//           />
//           <Button
//             size="sm"
//             className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 px-6"
//           >
//             Search
//           </Button>
//         </div>
//       </div>

//       {coApplicants.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-16 border border-slate-200 rounded-md">
//           <IconUsers size={36} className="text-indigo-400 mb-4" />
//           <Text size="sm" fw={700} className="text-slate-900">
//             No co-applicant added
//           </Text>
//           <Text size="xs" c="dimmed" className="mb-4 text-center max-w-xs">
//             Or create a fresh profile if the co-applicant is not an existing customer.
//           </Text>
//           <Button
//             size="xs"
//             variant="outline"
//             color="indigo"
//             className="border-dashed"
//             onClick={() =>
//               setCoApplicants((prev) => [
//                 ...prev,
//                 { id: prev.length + 1, name: `Co-applicant ${prev.length + 1}` },
//               ])
//             }
//           >
//             + Add New Co-applicant Profile
//           </Button>
//         </div>
//       ) : (
//         <div className="flex flex-col gap-2">
//           {coApplicants.map((c) => (
//             <div
//               key={c.id}
//               className="flex justify-between items-center border border-slate-200 rounded-md px-3 py-2 text-sm"
//             >
//               <span>{c.name}</span>
//               <ActionIcon
//                 size="sm"
//                 color="red"
//                 variant="subtle"
//                 onClick={() => setCoApplicants((prev) => prev.filter((x) => x.id !== c.id))}
//               >
//                 <IconTrash size={14} />
//               </ActionIcon>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
  
const renderCoApplicant = () => (
    <div className="flex flex-col gap-4">
      {/* Top Form (Styled like Charges) */}
       <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Find Existing Customer
          </Text>
          <Tooltip label="Search for an existing customer to add as a co-applicant." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex gap-3">
          <TextInput
            size="sm"
            placeholder="Search by name or customer number..."
            leftSection={<IconSearch size={14} className="text-slate-400" />}
            value={coApplicantSearch}
            onChange={(e) => setCoApplicantSearch(e.currentTarget.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 px-6"
          >
            Search
          </Button>
        </div>
      </div>
      <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Add Co-Applicant
          </Text>
          <Tooltip label="Add a new co-applicant to this loan account." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex items-end gap-3">
          <TextInput
            size="sm"
            label="Applicant Name"
            placeholder="Enter name"
            classNames={labelClass}
            className="flex-1"
          />
          <TextInput
            size="sm"
            label="Applicant Email"
            placeholder="Enter email"
            classNames={labelClass}
            className="flex-1"
          />
          <TextInput
            size="sm"
            label="Applicant Mobile"
            placeholder="Enter mobile"
            classNames={labelClass}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0"
            onClick={() => {
              // Mock adding a full row for the preview
              setCoApplicants((prev) => [
                ...prev,
                { 
                  id: prev.length + 1, 
                  name: `Applicant Name ${prev.length + 1}`,
                  email: `Applicant Email`,
                  mobile: `Applicant Mobile`
                },
              ]);
            }}
          >
            + Add Co-Applicant
          </Button>
        </div>
      </div>

      {/* Bottom Table (Fields from Co-Applicants Image) */}
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="w-10 text-center px-4">
                <input type="checkbox" className="rounded border-slate-300 cursor-pointer" />
              </Table.Th>
              <Table.Th className="text-slate-500 font-medium w-12 text-center">No.</Table.Th>
              <Table.Th className="text-slate-500 font-medium">Applicant Name</Table.Th>
              <Table.Th className="text-slate-500 font-medium">Applicant Email</Table.Th>
              <Table.Th className="text-slate-500 font-medium">Applicant Mobile</Table.Th>
              <Table.Th className="w-12 text-center">
                <IconSettings size={16} className="text-slate-400 mx-auto" />
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {coApplicants.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No co-applicants added yet.
                </Table.Td>
              </Table.Tr>
            ) : (
              coApplicants.map((c, idx) => (
                <Table.Tr key={c.id}>
                  <Table.Td className="text-center px-4">
                    <input type="checkbox" className="rounded border-slate-300 cursor-pointer" />
                  </Table.Td>
                  <Table.Td className="text-center font-medium text-slate-600">{idx + 1}</Table.Td>
                  <Table.Td className="text-slate-700">{c.name}</Table.Td>
                  {/* Mock fields falling back to strings for existing state shape */}
                  <Table.Td className="text-slate-500">{(c as any).email || 'Applicant Email'}</Table.Td>
                  <Table.Td className="text-slate-500">{(c as any).mobile || 'Applicant Mobile'}</Table.Td>
                  <Table.Td className="text-center">
                    <ActionIcon
                      size="sm"
                      color="gray"
                      variant="subtle"
                      className="mx-auto"
                      onClick={() => setCoApplicants((prev) => prev.filter((x) => x.id !== c.id))}
                    >
                      <IconPencil size={15} className="text-slate-500" />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed border-slate-300 rounded-md py-8 flex items-center justify-center bg-slate-50/40">
        <Text size="sm" c="dimmed">
          📁 Drag and drop files here, or{" "}
          <span className="text-indigo-600 font-medium cursor-pointer">browse</span> to upload
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center border border-slate-200 rounded-md px-4 py-3 text-sm"
          >
            <span className="text-slate-700">{doc.name}</span>
            <Badge
              size="sm"
              variant="light"
              color={doc.status === "Uploaded" ? "green" : "yellow"}
              className="font-semibold"
              styles={{ root: { fontSize: 10 } }}
            >
              {doc.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSimulator = () => (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <div className="flex items-center gap-1.5">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Loan Simulator
          </Text>
          <Tooltip
            label="Model different scenarios before committing values to the application."
            withArrow
          >
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <Text size="xs" c="dimmed">
          Model different scenarios before committing values to the application. Fill in
          Principal to solve for EMI, or fill in EMI to solve for Principal.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <NumberInput
            size="sm"
            label="Principal"
            value={simPrincipal}
            onChange={(v) => handleSimPrincipalChange(v as number | "")}
            leftSection={<FieldIcon Icon={IconCurrencyDollar} bg="#FFF7ED" color="#EA580C" />}
            thousandSeparator=","
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Interest Rate (% p.a.)"
            value={simRate}
            onChange={(v) => setSimRate(v as number | "")}
            leftSection={<FieldIcon Icon={IconPercentage} bg="#EEF2FF" color="#4F46E5" />}
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Tenure (months)"
            value={simTenure}
            onChange={(v) => setSimTenure(v as number | "")}
            leftSection={<FieldIcon Icon={IconCalendarStats} bg="#ECFDF5" color="#059669" />}
            classNames={labelClass}
          />
          <div>
            <NumberInput
              size="sm"
              label="EMI"
              value={simMode === "emiToPrincipal" ? simEmi : simComputedEmi || ""}
              onChange={(v) => handleSimEmiChange(v as number | "")}
              leftSection={<FieldIcon Icon={IconCalculator} bg="#FFF7ED" color="#EA580C" />}
              classNames={labelClass}
            />
            <Text size="xs" c="dimmed" className="mt-1">
              Enter an EMI to back-calculate the Principal below.
            </Text>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600">
            Showing{" "}
            <span className="font-semibold text-indigo-600">
              {simMode === "principalToEmi" ? "Principal → EMI" : "EMI → Principal"}
            </span>
            . Type a value into {simMode === "principalToEmi" ? "EMI" : "Principal"} to switch
            to {simMode === "principalToEmi" ? "EMI → Principal" : "Principal → EMI"} mode.
          </div>

          <Button
            size="sm"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 border-0 font-semibold"
            onClick={handleApplySimulatorToForm}
          >
            Apply to Loan Form →
          </Button>
        </div>

        <div className="bg-orange-50/70 border border-orange-200 rounded-md p-6 flex flex-col gap-3">
          <Text size="xs" fw={700} c="orange.8" className="uppercase tracking-wide" style={{ fontSize: 10 }}>
            Estimated EMI
          </Text>
          <Text size="xl" fw={800} c="orange.7" style={{ fontSize: 28 }}>
            {simComputedEmi.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>

          <div className="flex justify-between text-sm text-slate-700 border-t border-orange-200 pt-3">
            <span>Principal</span>
            <span className="font-mono">
              {simComputedPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-700 border-t border-orange-200 pt-3">
            <span>Total Interest Payable</span>
            <span className="font-mono">
              {simTotalInterest.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-700 border-t border-orange-200 pt-3">
            <span>Total Repayment</span>
            <span className="font-mono">
              {simTotalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
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

  const activeTabIndex = TAB_ITEMS.findIndex((t) => t.value === activeTab);

  return (
    <Modal opened={opened} onClose={onClose} size="95%" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col h-[90vh]">
        {/* Header */}
        <Box className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-md">
              <IconFileText size={22} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={600} className="leading-tight">
                New Loan Account
              </Text>
              <Text size="xs" className="text-indigo-100">
                Create and configure a new loan account.
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

        {/* Stepper — tab navigation styled like the Loan Product stepper */}
        {/* <Box className="px-5 pt-4 pb-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center overflow-x-auto"> */}
          <Box className="px-5 pt-4 pb-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center overflow-x-auto w-full">
            {TAB_ITEMS.map((tab, idx) => {
              const isActive = idx === activeTabIndex;
              const isComplete = idx < activeTabIndex;
              const StepIcon = tab.icon;
              return (
                <Fragment key={tab.value}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className="flex items-center gap-2 text-left shrink-0 group"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : isComplete
                            ? "bg-indigo-500 text-white"
                            : "bg-white text-slate-400 border-2 border-slate-200 group-hover:border-slate-300"
                      }`}
                    >
                      {isComplete ? <IconCheck size={14} /> : <StepIcon size={14} />}
                    </div>
                    <Text
                      size="xs"
                      fw={700}
                      className={`whitespace-nowrap ${
                        isActive ? "text-indigo-600" : isComplete ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </button>
                 {idx < TAB_ITEMS.length - 1 && (
                    <div
                      className={`flex-1 min-w-[2rem] h-[2px] mx-3 rounded-full transition-colors ${
                        isComplete ? "bg-indigo-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </Box>

        {/* Body: main content + persistent live-preview sidebar */}
        <div className="flex-1 flex overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "basic" && renderBasicDetails()}
            {activeTab === "schedule" && renderRepaymentSchedule()}
            {activeTab === "charges" && renderCharges()}
            {activeTab === "collateral" && renderCollateral()}
            {activeTab === "coapplicant" && renderCoApplicant()}
            {activeTab === "documents" && renderDocuments()}
            {activeTab === "simulator" && renderSimulator()}
          </div>

          {/* Live Preview Sidebar */}
          <div className="w-[280px] border-l border-slate-200 bg-gradient-to-b from-indigo-50/60 to-violet-50/60 p-5 shrink-0 overflow-y-auto">
            <Text size="xs" fw={700} className="text-indigo-600 uppercase tracking-wide" style={{ fontSize: 10 }}>
              Live Preview
            </Text>
            <Text size="sm" fw={700} className="text-slate-900 mb-4">
              Loan Summary
            </Text>

            <div className="flex flex-col">
              <SummaryRow label="Product" value={productCode || "—"} />
              <SummaryRow
                label="Principal"
                value={summaryPrincipal ? `${summaryPrincipal.toLocaleString("en-US")} ${currency}` : "—"}
                bold
              />
              <SummaryRow label="Interest Rate" value={`${ANNUAL_RATE}% p.a.`} />
              <SummaryRow label="Tenure" value={tenureMonths ? `${tenureMonths} months` : "—"} />
              <SummaryRow label="Frequency" value={frequency || "—"} bold />
              <SummaryRow label="Repayment Start" value={repaymentStartDate || "—"} />
              <SummaryRow label="Maturity Date" value={maturityDate || "—"} />
              <SummaryRow label="Moratorium" value={moratoriumType || "None"} bold />
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-4 mt-4">
              <Text size="xs" fw={700} className="text-slate-500 uppercase tracking-wide" style={{ fontSize: 10 }}>
                Estimated EMI
              </Text>
              <Text size="xl" fw={800} className="text-slate-900 font-mono" style={{ fontSize: 26 }}>
                {estimatedEmi ? estimatedEmi.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
              </Text>
            </div>

            <div className="flex flex-col mt-3">
              <SummaryRow
                label="Total Interest"
                value={totalInterest ? `${totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}` : "—"}
              />
              <SummaryRow
                label="Total Repayment"
                value={totalRepayment ? `${totalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}` : "—"}
                bold
              />
            </div>

            <Text size="xs" c="dimmed" className="mt-3 italic">
              Figures are indicative and recalculate automatically. Final schedule is generated
              on save.
            </Text>
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
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold px-6"
            >
              Submit Application
            </Button>
          </div>
        </div>
  </Box>
      <CollateralModal 
        opened={collateralModalOpened} 
        onClose={() => setCollateralModalOpened(false)} 
      />
    </Modal>
  );
}