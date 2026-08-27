// LoanApplicationModal.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Tabs,
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
} from "@tabler/icons-react";

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

// Fixed rate used for the Basic Details EMI preview — in a real app this
// would come from the selected Product Code.
const ANNUAL_RATE = 14.5;

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
  { id: 4, name: "Signed Loan Application Form", status: "Pending" },
];

const TAB_ITEMS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "basic", label: "Basic Details", icon: <IconIdBadge2 size={14} /> },
  { value: "schedule", label: "Repayment Schedule", icon: <IconCalendarStats size={14} /> },
  { value: "charges", label: "Charges", icon: <IconReceipt2 size={14} /> },
  { value: "collateral", label: "Collateral", icon: <IconBriefcase size={14} /> },
  { value: "coapplicant", label: "Co-applicant", icon: <IconUsers size={14} /> },
  { value: "documents", label: "Documents", icon: <IconFileUpload size={14} /> },
  { value: "simulator", label: "Loan Simulator", icon: <IconCalculator size={14} /> },
];

export function LoanApplicationModal({ opened, onClose }: LoanApplicationModalProps) {
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
      <Text size="sm" fw={700} className="text-gray-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
        {title}
      </Text>
      <Text size="xs" c="dimmed">
        {subtitle}
      </Text>
    </div>
  );
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
      <Text size="sm" fw={500} className="text-gray-700 mb-1">
        Tenure
      </Text>
      <div className="flex gap-2">
        <NumberInput
          size="sm"
          placeholder="0"
          value={value}
          onChange={(v) => onValueChange(v as number | "")}
          className="flex-1"
        />
        <Select
          size="sm"
          data={TENURE_UNITS}
          value={unit}
          onChange={onUnitChange}
          rightSection={<IconChevronDown size={14} className="text-gray-500" />}
          className="w-28"
        />
      </div>
    </div>
  );
}

  const renderBasicDetails = () => (
    <div className="flex flex-col gap-6">
      <div className="border border-gray-200 rounded-md p-5">
        <SectionHeader
          title="Account Identifiers"
          subtitle="Product and customer linkage for this account."
        />
        <div className="grid grid-cols-4 gap-x-8 gap-y-2">
          <Select
            size="sm"
            label="Product Code"
            placeholder="Search product code..."
            data={[]}
            searchable
            value={productCode}
            onChange={setProductCode}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Loan A/C Number"
            placeholder="Auto-generated on save"
            value={loanAcNumber}
            disabled
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Ref Number"
            value={refNumber}
            onChange={(e) => setRefNumber(e.currentTarget.value)}
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
            rightSection={chevronDown}
            classNames={labelClass}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-md p-5">
        <SectionHeader
          title="Timeline & Loan Financials"
          subtitle="Dates, currency, amount and repayment structure."
        />
        <div className="grid grid-cols-4 gap-x-8 gap-y-2">
          <TextInput
            size="sm"
            type="date"
            label="Transaction Date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.currentTarget.value)}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            type="date"
            label="Value Date"
            value={valueDate}
            onChange={(e) => setValueDate(e.currentTarget.value)}
            classNames={labelClass}
          />
          <Select
            size="sm"
            label="Currency"
            data={CURRENCIES}
            value={currency}
            onChange={setCurrency}
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Loan Amount"
            placeholder="0"
            value={loanAmount}
            onChange={(v) => setLoanAmount(v as number | "")}
            leftSection={
              <span className="text-xs text-gray-500 font-medium">{currency}</span>
            }
            leftSectionWidth={44}
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
            rightSection={chevronDown}
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            label="Maturity Date"
            placeholder="Auto-calculated"
            value={maturityDate}
            disabled
            classNames={labelClass}
          />
          <TextInput
            size="sm"
            type="date"
            label="Repayment Start Date"
            value={repaymentStartDate}
            onChange={(e) => setRepaymentStartDate(e.currentTarget.value)}
            classNames={labelClass}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-md p-5">
        <SectionHeader
          title="Exceptions / Moratorium"
          subtitle="Optional grace period before repayment obligations begin."
        />
        <div className="grid grid-cols-3 gap-x-8 gap-y-2">
          <Select
            size="sm"
            label="Moratorium (Principal / EMI)"
            data={MORATORIUM_TYPES}
            value={moratoriumType}
            onChange={setMoratoriumType}
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

  // small helper for tenure value + unit combo, kept inline for simplicity
  function GroupTenure({
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
        <Text size="sm" fw={500} className="text-gray-700 mb-1">
          Tenure
        </Text>
        <div className="flex gap-2">
          <NumberInput
            size="sm"
            placeholder="0"
            value={value}
            onChange={(v) => onValueChange(v as number | "")}
            className="flex-1"
          />
          <Select
            size="sm"
            data={TENURE_UNITS}
            value={unit}
            onChange={onUnitChange}
            rightSection={chevronDown}
            className="w-28"
          />
        </div>
      </div>
    );
  }
  // Referenced above as `Group-Tenure`; alias to satisfy JSX naming rules.
  const GroupTenureTag = GroupTenure as any;

  const renderRepaymentSchedule = () => (
    <div className="flex flex-col gap-3">
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Inst. No.
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Date
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Beginning Bal.
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Principal
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Interest
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                EMI
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Ending Bal.
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {amortization.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-gray-500 bg-gray-50/50">
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
      <div className="border border-gray-200 rounded-md p-5">
        <Text size="sm" fw={700} className="text-gray-900 uppercase tracking-wide mb-3" style={{ fontSize: 11 }}>
          Add Charge
        </Text>
        <div className="flex items-end gap-3">
          <Select
            size="sm"
            label="Fee Type"
            data={FEE_TYPES}
            value={chargeFeeType}
            onChange={setChargeFeeType}
            rightSection={chevronDown}
            classNames={labelClass}
            className="w-60"
          />
          <NumberInput
            size="sm"
            label="Amount"
            placeholder="0.00"
            value={chargeAmount}
            onChange={(v) => setChargeAmount(v as number | "")}
            classNames={labelClass}
            className="w-48"
          />
          <Button
            size="sm"
            className="bg-[#223A70] hover:bg-[#1a2d57]"
            onClick={handleAddCharge}
          >
            + Add Charge
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <Table verticalSpacing="sm" fz="xs">
          <Table.Thead className="bg-gray-50">
            <Table.Tr>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Fee Type
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Amount
              </Table.Th>
              <Table.Th className="uppercase text-[10px] tracking-wide text-gray-500">
                Applied On
              </Table.Th>
              <Table.Th className="w-10" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} className="text-center py-8 text-gray-500 bg-gray-50/50">
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
    <div className="flex flex-col items-center justify-center py-20 border border-gray-200 rounded-md">
      <IconBriefcase2 size={40} className="text-amber-700/60 mb-4" />
      <Text size="sm" fw={700} className="text-gray-900">
        No collaterals linked
      </Text>
      <Text size="xs" c="dimmed" className="mb-4">
        Attach a collateral asset to secure this loan account.
      </Text>
      <Button
        size="xs"
        variant="outline"
        className="border-dashed"
        onClick={() =>
          setCollaterals((prev) => [
            ...prev,
            { id: prev.length + 1, name: `Collateral ${prev.length + 1}` },
          ])
        }
      >
        + Add Collateral
      </Button>
      {collaterals.length > 0 && (
        <div className="w-full mt-6 flex flex-col gap-2">
          {collaterals.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center border border-gray-200 rounded-md px-3 py-2 text-sm"
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
  );

  const renderCoApplicant = () => (
    <div className="flex flex-col gap-6">
      <div className="border border-gray-200 rounded-md p-5">
        <Text size="sm" fw={700} className="text-gray-900 uppercase tracking-wide mb-3" style={{ fontSize: 11 }}>
          Find Existing Customer
        </Text>
        <div className="flex gap-3">
          <TextInput
            size="sm"
            placeholder="Search by name or customer number..."
            leftSection={<IconSearch size={14} className="text-gray-400" />}
            value={coApplicantSearch}
            onChange={(e) => setCoApplicantSearch(e.currentTarget.value)}
            className="flex-1"
          />
          <Button size="sm" className="bg-[#223A70] hover:bg-[#1a2d57] px-6">
            Search
          </Button>
        </div>
      </div>

      {coApplicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-md">
          <IconUsers size={36} className="text-blue-400 mb-4" />
          <Text size="sm" fw={700} className="text-gray-900">
            No co-applicant added
          </Text>
          <Text size="xs" c="dimmed" className="mb-4 text-center max-w-xs">
            Or create a fresh profile if the co-applicant is not an existing customer.
          </Text>
          <Button
            size="xs"
            variant="outline"
            className="border-dashed"
            onClick={() =>
              setCoApplicants((prev) => [
                ...prev,
                { id: prev.length + 1, name: `Co-applicant ${prev.length + 1}` },
              ])
            }
          >
            + Add New Co-applicant Profile
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {coApplicants.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <span>{c.name}</span>
              <ActionIcon
                size="sm"
                color="red"
                variant="subtle"
                onClick={() => setCoApplicants((prev) => prev.filter((x) => x.id !== c.id))}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed border-gray-300 rounded-md py-8 flex items-center justify-center bg-gray-50/40">
        <Text size="sm" c="dimmed">
          📁 Drag and drop files here, or{" "}
          <span className="text-indigo-600 font-medium cursor-pointer">browse</span> to upload
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center border border-gray-200 rounded-md px-4 py-3 text-sm"
          >
            <span className="text-gray-700">{doc.name}</span>
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
        <Text size="sm" fw={700} className="text-gray-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
          Loan Simulator
        </Text>
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
            leftSection={<span className="text-xs text-gray-500 font-medium">USD</span>}
            leftSectionWidth={44}
            thousandSeparator=","
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Interest Rate (% p.a.)"
            value={simRate}
            onChange={(v) => setSimRate(v as number | "")}
            classNames={labelClass}
          />
          <NumberInput
            size="sm"
            label="Tenure (months)"
            value={simTenure}
            onChange={(v) => setSimTenure(v as number | "")}
            classNames={labelClass}
          />
          <div>
            <NumberInput
              size="sm"
              label="EMI"
              value={simMode === "emiToPrincipal" ? simEmi : simComputedEmi || ""}
              onChange={(v) => handleSimEmiChange(v as number | "")}
              leftSection={<span className="text-xs text-gray-500 font-medium">EMI</span>}
              leftSectionWidth={44}
              classNames={labelClass}
            />
            <Text size="xs" c="dimmed" className="mt-1">
              Enter an EMI to back-calculate the Principal below.
            </Text>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-600">
            Showing{" "}
            <span className="font-semibold text-indigo-600">
              {simMode === "principalToEmi" ? "Principal → EMI" : "EMI → Principal"}
            </span>
            . Type a value into {simMode === "principalToEmi" ? "EMI" : "Principal"} to switch
            to {simMode === "principalToEmi" ? "EMI → Principal" : "Principal → EMI"} mode.
          </div>

          <Button
            size="sm"
            color="green"
            className="font-semibold"
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

          <div className="flex justify-between text-sm text-gray-700 border-t border-orange-200 pt-3">
            <span>Principal</span>
            <span className="font-mono">
              {simComputedPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 border-t border-orange-200 pt-3">
            <span>Total Interest Payable</span>
            <span className="font-mono">
              {simTotalInterest.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 border-t border-orange-200 pt-3">
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
    <div className="flex justify-between items-center border-b border-dashed border-blue-200/70 py-2">
      <Text size="xs" c="blue.7">
        {label}
      </Text>
      <Text size="xs" fw={bold ? 700 : 600} className="text-gray-900 font-mono">
        {value}
      </Text>
    </div>
  );

  return (
    <Modal opened={opened} onClose={onClose} size="95%" withCloseButton={false} padding={0} radius="md">
      <Box className="flex flex-col h-[90vh]">
        {/* Header */}
        <Box className="bg-[#223A70] text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-md">
              <IconFileText size={22} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={600} className="leading-tight">
                New Loan Account
              </Text>
              <Text size="xs" c="white.6">
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

        {/* Tabs */}
        <Box className="px-5 pt-3 bg-white border-b border-gray-200 shrink-0">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            classNames={{ tab: "px-3 py-2 text-sm font-medium hover:bg-transparent" }}
          >
            <Tabs.List className="border-none gap-1 flex-nowrap overflow-x-auto">
              {TAB_ITEMS.map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value} leftSection={tab.icon}>
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
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
          <div className="w-70 border-l border-gray-200 bg-gradient-to-b from-blue-50/60 to-emerald-50/60 p-5 shrink-0 overflow-y-auto">
            <Text size="xs" fw={700} c="blue.6" className="uppercase tracking-wide" style={{ fontSize: 10 }}>
              Live Preview
            </Text>
            <Text size="sm" fw={700} className="text-gray-900 mb-4">
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

            <div className="bg-white rounded-md border border-gray-200 p-4 mt-4">
              <Text size="xs" fw={700} c="gray.6" className="uppercase tracking-wide" style={{ fontSize: 10 }}>
                Estimated EMI
              </Text>
              <Text size="xl" fw={800} className="text-gray-900 font-mono" style={{ fontSize: 26 }}>
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
            <Button size="sm" variant="default" className="font-semibold px-5">
              Save as Draft
            </Button>
            <Button size="sm" className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-6">
              Submit Application
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}