import { useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  Select,
  Paper,
  Table,
  Modal,
  Tabs,
  Switch,
  Badge,
  Avatar,
  Pagination,
  Tooltip,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconFileText,
  IconChevronDown,
  IconSearch,
  IconRefresh,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconCircleCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
}

// --- Reference data (would normally come from the backend) ---
const BRANCHES = [
  { code: "001", name: "Lusaka Main Branch", sub: "Cairo Road, Lusaka" },
  { code: "014", name: "Ndola Corporate Branch", sub: "Broadway, Ndola" },
  { code: "022", name: "Kitwe Business Branch", sub: "President Ave, Kitwe" },
  { code: "031", name: "Livingstone Branch", sub: "Mosi-oa-Tunya Rd" },
];

const LOAN_PRODUCTS = [
  {
    code: "PRD-SME-102",
    name: "SME Business Growth Loan",
    basis: "Reducing balance",
    rateRange: "13.5% – 18% p.a.",
    tenorRange: "6 – 60 months",
    collateral: true,
    maxAmount: 2_500_000,
    description:
      "Working capital facility for registered SMEs, secured against business assets or a third-party guarantee.",
  },
  {
    code: "PRD-PER-011",
    name: "Personal Salary Advance",
    basis: "Flat rate",
    rateRange: "10% – 14% p.a.",
    tenorRange: "1 – 12 months",
    collateral: false,
    maxAmount: 150_000,
    description: "Short-term salary-backed advance for individual employees.",
  },
  {
    code: "PRD-AST-207",
    name: "Asset Finance — Commercial Vehicle",
    basis: "Reducing balance",
    rateRange: "14% – 19% p.a.",
    tenorRange: "12 – 72 months",
    collateral: true,
    maxAmount: 4_000_000,
    description: "Finance facility secured against the vehicle being purchased.",
  },
  {
    code: "PRD-AGR-315",
    name: "Agri-Business Seasonal Loan",
    basis: "Bullet repayment",
    rateRange: "12% – 16% p.a.",
    tenorRange: "3 – 9 months",
    collateral: true,
    maxAmount: 1_200_000,
    description: "Seasonal working capital for registered agricultural producers.",
  },
];

const CUSTOMERS = [
  {
    id: "CUS-0093214",
    name: "Chanda Mwansa",
    type: "Individual",
    cif: "771002834",
    phone: "+260 97 712 3344",
    email: "c.mwansa@mailbox.zm",
    nrc: "221556/71/1",
    segment: "Retail — Mass Affluent",
    rm: "Ruth Kanyanta",
    facilities: "1 active loan",
    creditScore: 742,
    risk: "Low Risk",
    memberSince: "Mar 2019",
    kycVerified: true,
    active: true,
  },
  {
    id: "CUS-0081120",
    name: "Bwalya Enterprises Ltd",
    type: "Corporate",
    cif: "771048821",
    phone: "+260 96 550 2210",
    email: "info@bwalyaent.co.zm",
    nrc: "N/A",
    segment: "Corporate — SME",
    rm: "Ruth Kanyanta",
    facilities: "2 active loans",
    creditScore: 690,
    risk: "Medium Risk",
    memberSince: "Jan 2021",
    kycVerified: true,
    active: true,
  },
  {
    id: "CUS-0074430",
    name: "Natasha Phiri",
    type: "Individual",
    cif: "771093011",
    phone: "+260 95 330 8871",
    email: "n.phiri@mailbox.zm",
    nrc: "331882/63/1",
    segment: "Retail — Standard",
    rm: "James Banda",
    facilities: "0 active loans",
    creditScore: 705,
    risk: "Low Risk",
    memberSince: "Jul 2022",
    kycVerified: false,
    active: true,
  },
];

const CURRENCIES = ["ZMW — Zambian Kwacha", "USD — US Dollar", "ZAR — South African Rand"];
const TENOR_UOM = ["Days", "Weeks", "Months", "Years"];
const EMI_UOM = ["Weekly", "Bi-weekly", "Monthly", "Quarterly"];
const REPAYMENT_METHODS = ["Direct Debit", "Standing Order", "Cash / Teller", "Mobile Money"];

interface ScheduleRow {
  no: number;
  date: Date;
  opening: number;
  principal: number;
  interest: number;
  charges: number;
  emi: number;
  closing: number;
  status: "Pending" | "Paid" | "Overdue";
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function LoanApplicationModal({ opened, onClose }: LoanApplicationModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("0");

  // --- Tab 1: Basic Details ---
  const [branch, setBranch] = useState<string | null>(null);
  const [productCode, setProductCode] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isMigrated, setIsMigrated] = useState(false);
  const [loanAccountNumber] = useState(
    () => `LN-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
  );
  const [applicationNumber] = useState(
    () => `APP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
  );

  const selectedProduct = useMemo(
    () => LOAN_PRODUCTS.find((p) => p.code === productCode) || null,
    [productCode]
  );

  // --- Tab 2: Customer Details ---
  const [customerId, setCustomerId] = useState<string | null>(null);
  const selectedCustomer = useMemo(
    () => CUSTOMERS.find((c) => c.id === customerId) || null,
    [customerId]
  );

  // --- Tab 3: Loan Details ---
  const [postingDate, setPostingDate] = useState("2026-07-20");
  const [transactionDate, setTransactionDate] = useState("2026-07-20");
  const [startDate, setStartDate] = useState("2026-07-25");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState("2026-08-25");
  const [currency, setCurrency] = useState<string | null>(CURRENCIES[0]);
  const [sanctionedAmount, setSanctionedAmount] = useState("850000");
  const [interestRate, setInterestRate] = useState("15.50");
  const [penaltyRate, setPenaltyRate] = useState("3.00");
  const [bookingCharges, setBookingCharges] = useState("8500.00");
  const [repaymentType, setRepaymentType] = useState<"TENOR" | "EMI">("TENOR");
  const [tenorValue, setTenorValue] = useState("36");
  const [tenorUOM, setTenorUOM] = useState<string | null>("Months");
  const [emiUOM, setEmiUOM] = useState<string | null>("Monthly");
  const [repaymentMethod, setRepaymentMethod] = useState<string | null>("Direct Debit");

  const maturityDate = useMemo(() => {
    const tenor = parseInt(tenorValue, 10) || 0;
    if (!firstInstallmentDate || tenor <= 0) return "";
    const d = new Date(firstInstallmentDate);
    d.setMonth(d.getMonth() + (tenor - 1));
    return fmtDate(d);
  }, [firstInstallmentDate, tenorValue]);

  // --- Tab 4: Repayment Schedule ---
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [schedulePage, setSchedulePage] = useState(1);
  const [emi, setEmi] = useState(0);
  const pageSize = 10;

  const generateSchedule = () => {
    const principal = parseFloat(sanctionedAmount.replace(/,/g, "")) || 0;
    const annualRate = parseFloat(interestRate) || 0;
    const tenor = parseInt(tenorValue, 10) || 0;
    if (!principal || !annualRate || !tenor) return;

    const monthlyRate = annualRate / 100 / 12;
    const calcEmi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
      (Math.pow(1 + monthlyRate, tenor) - 1);

    let balance = principal;
    const rows: ScheduleRow[] = [];
    const base = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();

    for (let i = 1; i <= tenor; i++) {
      const interest = balance * monthlyRate;
      const principalPart = calcEmi - interest;
      const charge = i % 12 === 0 ? 150 : 0;
      const closing = balance - principalPart;
      const due = new Date(base);
      due.setMonth(base.getMonth() + (i - 1));
      let status: ScheduleRow["status"] = "Pending";
      if (i <= 2) status = "Paid";
      else if (i === 3) status = "Overdue";

      rows.push({
        no: i,
        date: due,
        opening: balance,
        principal: principalPart,
        interest,
        charges: charge,
        emi: calcEmi + charge,
        closing: Math.max(closing, 0),
        status,
      });
      balance = closing;
    }

    setSchedule(rows);
    setEmi(calcEmi);
    setSchedulePage(1);
  };

  const filteredSchedule = useMemo(() => {
    const q = scheduleSearch.trim().toLowerCase();
    if (!q) return schedule;
    return schedule.filter(
      (r) =>
        String(r.no).includes(q) ||
        fmtDate(r.date).toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [schedule, scheduleSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / pageSize));
  const pageRows = filteredSchedule.slice(
    (schedulePage - 1) * pageSize,
    schedulePage * pageSize
  );

  const totals = useMemo(() => {
    const principal = parseFloat(sanctionedAmount.replace(/,/g, "")) || 0;
    const totInterest = schedule.reduce((a, r) => a + r.interest, 0);
    const totCharges = schedule.reduce((a, r) => a + r.charges, 0);
    const totPrincipal = schedule.reduce((a, r) => a + r.principal, 0);
    const totEmi = schedule.reduce((a, r) => a + r.emi, 0);
    return {
      totPrincipal,
      totInterest,
      totCharges,
      totEmi,
      totPayable: principal + totInterest + totCharges,
    };
  }, [schedule, sanctionedAmount]);

  // --- Navigation ---
  const handleNext = () => {
    const current = parseInt(activeTab || "0", 10);
    if (current === 2 && schedule.length === 0) generateSchedule();
    if (current < 3) setActiveTab((current + 1).toString());
  };
  const handleBack = () => {
    const current = parseInt(activeTab || "0", 10);
    if (current > 0) setActiveTab((current - 1).toString());
  };

  const handleReset = () => {
    setBranch(null);
    setProductCode(null);
    setReferenceNumber("");
    setIsMigrated(false);
    setCustomerId(null);
    setSanctionedAmount("");
    setInterestRate("");
    setPenaltyRate("");
    setBookingCharges("");
    setTenorValue("");
    setSchedule([]);
    setActiveTab("0");
  };

  // ================= Tab renderers =================

  const renderBasicDetails = () => (
    <div className="flex flex-col gap-4">
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-3">
          Basic Details
        </Text>
        <Text size="xs" c="dimmed" className="mb-4">
          Branch, product selection and application identifiers
        </Text>

        <div className="grid grid-cols-3 gap-4">
          <Select
            size="xs"
            searchable
            withAsterisk
            label="Branch"
            placeholder="Select branch"
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            data={BRANCHES.map((b) => ({ value: b.code, label: `${b.name} — ${b.code}` }))}
            value={branch}
            onChange={setBranch}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <Select
            size="xs"
            searchable
            withAsterisk
            label="Loan Product"
            placeholder="Select a loan product"
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            data={LOAN_PRODUCTS.map((p) => ({ value: p.code, label: p.name }))}
            value={productCode}
            onChange={setProductCode}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Reference Number"
            placeholder="e.g. external CRM or referral ID"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.currentTarget.value)}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Loan Account Number"
            readOnly
            value={loanAccountNumber}
            description="Auto-generated on submission — read-only"
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              input: "bg-gray-50 text-gray-500 font-mono",
              description: "text-[10px] mt-1",
            }}
          />
          <TextInput
            size="xs"
            label="Application Number"
            readOnly
            value={applicationNumber}
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              input: "bg-gray-50 text-gray-500 font-mono",
            }}
          />
          <div className="flex flex-col gap-1">
            <Text size="xs" fw={600} className="text-gray-700">
              &nbsp;
            </Text>
            <div className="border border-gray-200 rounded-md bg-gray-50 px-3 py-2 flex items-center justify-between">
              <div>
                <Text size="xs" fw={600} className="text-gray-800">
                  {isMigrated ? "Migrated Loan" : "Newly Originated Loan"}
                </Text>
                <Text size="[10px]" className="text-[10px] text-gray-500">
                  Toggle on if migrated from a legacy core banking system
                </Text>
              </div>
              <Switch
                size="sm"
                color="teal"
                checked={isMigrated}
                onChange={(e) => setIsMigrated(e.currentTarget.checked)}
              />
            </div>
          </div>
        </div>

        {selectedProduct && (
          <Paper withBorder radius="md" p="sm" className="mt-4 bg-teal-50 border-teal-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-teal-700">
                <IconFileText size={16} />
              </div>
              <div>
                <Text size="xs" fw={700} className="text-gray-900">
                  {selectedProduct.name}
                </Text>
                <Text size="[10px]" className="text-[10px] text-gray-500 font-mono">
                  {selectedProduct.code}
                </Text>
              </div>
            </div>
            <Text size="xs" className="text-gray-600 mb-2">
              {selectedProduct.description}
            </Text>
            <div className="flex flex-wrap gap-2">
              <Badge size="sm" variant="outline" color="teal">
                {selectedProduct.rateRange}
              </Badge>
              <Badge size="sm" variant="outline" color="teal">
                {selectedProduct.tenorRange}
              </Badge>
              <Badge size="sm" variant="outline" color="teal">
                {selectedProduct.collateral ? "Collateral required" : "Unsecured"}
              </Badge>
              <Badge size="sm" variant="outline" color="teal">
                Max {selectedProduct.basis}
              </Badge>
              <Badge size="sm" variant="outline" color="teal">
                Max ZMW {selectedProduct.maxAmount.toLocaleString()}
              </Badge>
            </div>
          </Paper>
        )}
      </Paper>
    </div>
  );

  const renderCustomerDetails = () => (
    <div className="flex flex-col gap-4">
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-3">
          Customer Details
        </Text>
        <Text size="xs" c="dimmed" className="mb-4">
          Search and confirm the borrower for this application
        </Text>

        <div className="grid grid-cols-3 gap-4">
          <Select
            size="xs"
            searchable
            withAsterisk
            label="Customer Number"
            placeholder="Search by name, CIF or phone"
            leftSection={<IconSearch size={13} className="text-gray-500" />}
            rightSection={<IconChevronDown size={14} className="text-gray-500" />}
            data={CUSTOMERS.map((c) => ({ value: c.id, label: `${c.name} — ${c.id}` }))}
            value={customerId}
            onChange={setCustomerId}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Customer Name"
            readOnly
            value={selectedCustomer?.name || ""}
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              input: "bg-gray-50 text-gray-500",
            }}
          />
        </div>

        {selectedCustomer && (
          <Paper withBorder radius="md" className="mt-5 overflow-hidden">
            <div className="bg-[#0F2A4A] px-5 py-4 flex items-center gap-4">
              <Avatar radius="xl" size={48} color="blue" variant="filled">
                {selectedCustomer.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </Avatar>
              <div>
                <Text size="sm" fw={700} className="text-white">
                  {selectedCustomer.name}
                </Text>
                <Text size="xs" className="text-blue-200">
                  {selectedCustomer.type} Customer · Member since {selectedCustomer.memberSince}
                </Text>
              </div>
              <div className="ml-auto flex gap-2">
                {selectedCustomer.active && (
                  <Badge
                    size="sm"
                    variant="light"
                    color="green"
                    leftSection={<IconCircleCheck size={12} />}
                  >
                    Active
                  </Badge>
                )}
                {selectedCustomer.kycVerified && (
                  <Badge
                    size="sm"
                    variant="light"
                    color="green"
                    leftSection={<IconShieldCheck size={12} />}
                  >
                    KYC Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 p-5 bg-white">
              <SummaryItem label="CIF Number" value={selectedCustomer.cif} mono />
              <SummaryItem label="Contact Number" value={selectedCustomer.phone} />
              <SummaryItem label="Email Address" value={selectedCustomer.email} />
              <SummaryItem label="National Reg. No." value={selectedCustomer.nrc} mono />
              <SummaryItem label="Segment" value={selectedCustomer.segment} />
              <SummaryItem label="Relationship Manager" value={selectedCustomer.rm} />
              <SummaryItem label="Existing Facilities" value={selectedCustomer.facilities} />
              <SummaryItem
                label="Credit Score"
                value={`${selectedCustomer.creditScore} · ${selectedCustomer.risk}`}
                color="text-green-700"
              />
            </div>
          </Paper>
        )}
      </Paper>
    </div>
  );

  const renderLoanDetails = () => (
    <div className="flex flex-col gap-4">
      <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
        <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-3">
          Loan Dates
        </Text>
        <div className="grid grid-cols-3 gap-4">
          <TextInput
            size="xs"
            type="date"
            withAsterisk
            label="Posting Date"
            value={postingDate}
            onChange={(e) => setPostingDate(e.currentTarget.value)}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            type="date"
            withAsterisk
            label="Transaction Date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.currentTarget.value)}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            type="date"
            withAsterisk
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.currentTarget.value)}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            type="date"
            withAsterisk
            label="First Installment Date"
            value={firstInstallmentDate}
            onChange={(e) => setFirstInstallmentDate(e.currentTarget.value)}
            classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
          />
          <TextInput
            size="xs"
            label="Due Date"
            readOnly
            value={firstInstallmentDate ? `${new Date(firstInstallmentDate).getDate()} of each month` : ""}
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              input: "bg-gray-50 text-gray-500",
            }}
          />
          <TextInput
            size="xs"
            label="Maturity Date"
            readOnly
            value={maturityDate}
            classNames={{
              label: "text-xs font-semibold text-gray-700 mb-1",
              input: "bg-gray-50 text-gray-500",
            }}
          />
        </div>
      </Paper>

      <div className="grid grid-cols-2 gap-4">
        <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
          <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-3">
            Financial Information
          </Text>
          <div className="grid grid-cols-2 gap-4">
            <Select
              size="xs"
              withAsterisk
              label="Currency"
              data={CURRENCIES}
              value={currency}
              onChange={setCurrency}
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
            />
           <TextInput
              size="xs"
              withAsterisk
              label="Sanctioned Amount"
              value={sanctionedAmount}
              onChange={(e) => setSanctionedAmount(e.currentTarget.value)}
            //   leftSection={<Text size="[10px]" className="text-[10px] text-gray-500">ZMW</Text>}
            leftSection={<span className="text-[10px] text-gray-500">ZMW</span>}
              leftSectionWidth={40}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1", input: "font-mono" }}
            />
            <TextInput
              size="xs"
              withAsterisk
              label="Interest Rate"
              description="Annualized, reducing balance basis"
              value={interestRate}
              onChange={(e) => setInterestRate(e.currentTarget.value)}
              rightSection={<Text size="[10px]" className="text-[10px] text-gray-500 pr-1">% p.a.</Text>}
              rightSectionWidth={50}
              classNames={{
                label: "text-xs font-semibold text-gray-700 mb-1",
                input: "font-mono",
                description: "text-[10px] mt-0",
              }}
            />
            <TextInput
              size="xs"
              label="Penalty Interest Rate"
              description="Applied on overdue installments only"
              value={penaltyRate}
              onChange={(e) => setPenaltyRate(e.currentTarget.value)}
              rightSection={<Text size="[10px]" className="text-[10px] text-gray-500 pr-1">%</Text>}
              rightSectionWidth={40}
              classNames={{
                label: "text-xs font-semibold text-gray-700 mb-1",
                input: "font-mono",
                description: "text-[10px] mt-0",
              }}
            />
            <div className="col-span-2">
             <TextInput
                size="xs"
                label="Booking Charges"
                description="One-time origination fee, deducted at disbursement"
                value={bookingCharges}
                onChange={(e) => setBookingCharges(e.currentTarget.value)}
                leftSection={<span className="text-[10px] text-gray-500">ZMW</span>}
                leftSectionWidth={40}
                classNames={{
                  label: "text-xs font-semibold text-gray-700 mb-1",
                  input: "font-mono",
                  description: "text-[10px] mt-1",
                }}
              />
            </div>
          </div>
        </Paper>

        <Paper withBorder radius="md" p="md" className="shadow-sm bg-white">
          <Text size="xs" fw={700} className="text-gray-700 uppercase tracking-wider mb-3">
            Repayment Configuration
          </Text>
          <div className="flex gap-2 mb-4">
            {(["TENOR", "EMI"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRepaymentType(opt)}
                className={`flex-1 border rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  repaymentType === opt
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {opt === "TENOR" ? "Tenor" : "EMI"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              size="xs"
              withAsterisk
              label="Tenor Value"
              value={tenorValue}
              onChange={(e) => setTenorValue(e.currentTarget.value)}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1", input: "font-mono" }}
            />
            <Select
              size="xs"
              withAsterisk
              label="Tenor UOM"
              data={TENOR_UOM}
              value={tenorUOM}
              onChange={setTenorUOM}
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
            />
            <Select
              size="xs"
              withAsterisk
              label="EMI UOM"
              data={EMI_UOM}
              value={emiUOM}
              onChange={setEmiUOM}
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
            />
            <Select
              size="xs"
              withAsterisk
              label="Repayment Method"
              data={REPAYMENT_METHODS}
              value={repaymentMethod}
              onChange={setRepaymentMethod}
              rightSection={<IconChevronDown size={14} className="text-gray-500" />}
              classNames={{ label: "text-xs font-semibold text-gray-700 mb-1" }}
            />
          </div>
        </Paper>
      </div>
    </div>
  );

  const renderRepaymentSchedule = () => (
    <Paper withBorder radius="md" className="shadow-sm bg-white overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-wrap gap-3">
        <div className="flex gap-2">
          <Button
            size="xs"
            className="bg-[#0E7C86] hover:bg-[#0A6169]"
            leftSection={<IconRefresh size={14} />}
            onClick={generateSchedule}
          >
            Generate Schedule
          </Button>
          <Button size="xs" variant="default" onClick={generateSchedule}>
            Recalculate
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <TextInput
            size="xs"
            placeholder="Search installments..."
            leftSection={<IconSearch size={13} />}
            value={scheduleSearch}
            onChange={(e) => {
              setScheduleSearch(e.currentTarget.value);
              setSchedulePage(1);
            }}
          />
          <Tooltip label="Export as PDF">
            <Button size="xs" variant="default" leftSection={<IconFileTypePdf size={14} />}>
              PDF
            </Button>
          </Tooltip>
          <Tooltip label="Export to Excel">
            <Button size="xs" variant="default" leftSection={<IconFileSpreadsheet size={14} />}>
              Excel
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px]">
        <div className="overflow-auto max-h-[420px] border-r border-gray-100">
          <Table size="xs" verticalSpacing="sm" className="min-w-full">
            <Table.Thead className="bg-gray-50 sticky top-0">
              <Table.Tr>
                <Table.Th>No.</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Opening</Table.Th>
                <Table.Th>Principal</Table.Th>
                <Table.Th>Interest</Table.Th>
                <Table.Th>Charges</Table.Th>
                <Table.Th>EMI</Table.Th>
                <Table.Th>Closing</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} className="text-center py-8 text-gray-500 bg-gray-50/50">
                    No installments generated yet. Click "Generate Schedule".
                  </Table.Td>
                </Table.Tr>
              ) : (
                pageRows.map((r) => (
                  <Table.Tr key={r.no}>
                    <Table.Td className="font-mono text-xs">{String(r.no).padStart(2, "0")}</Table.Td>
                    <Table.Td className="text-xs">{fmtDate(r.date)}</Table.Td>
                    <Table.Td className="font-mono text-xs">{fmt(r.opening)}</Table.Td>
                    <Table.Td className="font-mono text-xs">{fmt(r.principal)}</Table.Td>
                    <Table.Td className="font-mono text-xs">{fmt(r.interest)}</Table.Td>
                    <Table.Td className="font-mono text-xs">{fmt(r.charges)}</Table.Td>
                    <Table.Td className="font-mono text-xs font-semibold">{fmt(r.emi)}</Table.Td>
                    <Table.Td className="font-mono text-xs">{fmt(r.closing)}</Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="light"
                        color={
                          r.status === "Paid" ? "green" : r.status === "Overdue" ? "red" : "gray"
                        }
                      >
                        {r.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
            {schedule.length > 0 && (
              <Table.Tfoot className="bg-gray-50">
                <Table.Tr>
                  <Table.Td colSpan={3} className="font-semibold text-xs">
                    Totals
                  </Table.Td>
                  <Table.Td className="font-mono font-semibold text-xs">{fmt(totals.totPrincipal)}</Table.Td>
                  <Table.Td className="font-mono font-semibold text-xs">{fmt(totals.totInterest)}</Table.Td>
                  <Table.Td className="font-mono font-semibold text-xs">{fmt(totals.totCharges)}</Table.Td>
                  <Table.Td className="font-mono font-semibold text-xs">{fmt(totals.totEmi)}</Table.Td>
                  <Table.Td />
                  <Table.Td />
                </Table.Tr>
              </Table.Tfoot>
            )}
          </Table>
        </div>

        <div className="p-4 bg-gray-50">
          <Text size="xs" fw={700} className="text-gray-600 uppercase tracking-wider mb-3">
            Loan Summary
          </Text>
          <Paper radius="md" p="sm" className="bg-[#0F2A4A] mb-3">
            <Text size="[10px]" className="text-[10px] text-blue-200 font-semibold mb-1">
              Total Payable
            </Text>
            <Text size="lg" fw={800} className="text-white font-mono">
              ZMW {fmt(totals.totPayable)}
            </Text>
          </Paper>
          <div className="grid grid-cols-2 gap-2">
            <SummaryCard label="Total Principal" value={fmt(parseFloat(sanctionedAmount) || 0)} />
            <SummaryCard label="Total Interest" value={fmt(totals.totInterest)} />
            <SummaryCard label="Total Charges" value={fmt(totals.totCharges)} />
            <SummaryCard label="EMI Amount" value={fmt(emi)} />
          </div>
          <SummaryCard label="Loan Tenure" value={`${tenorValue || 0} Months`} full />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <Text size="xs" c="dimmed">
          {filteredSchedule.length === 0
            ? "Showing 0 of 0"
            : `Showing ${(schedulePage - 1) * pageSize + 1}–${Math.min(
                schedulePage * pageSize,
                filteredSchedule.length
              )} of ${filteredSchedule.length}`}
        </Text>
        <Pagination
          size="xs"
          total={totalPages}
          value={schedulePage}
          onChange={setSchedulePage}
          color="teal"
        />
      </div>
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
              <IconFileText size={22} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={600} className="leading-tight">
                Create Loan Application
              </Text>
              <Text size="xs" c="white.6">
                Application ID: <span className="font-mono">{applicationNumber}</span>
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

        {/* Main Body Layout */}
        <div className="flex flex-1 overflow-hidden bg-[#F4F5F7]">
          <div className="flex-1 flex flex-col overflow-hidden">
            <Box className="px-5 pt-3 bg-white border-b border-gray-200 shrink-0">
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{ tab: "px-3 py-2 text-sm font-medium hover:bg-transparent" }}
              >
                <Tabs.List className="border-none gap-2">
                  <Tabs.Tab value="0">Basic Details</Tabs.Tab>
                  <Tabs.Tab value="1">Customer Details</Tabs.Tab>
                  <Tabs.Tab value="2">Loan Details</Tabs.Tab>
                  <Tabs.Tab value="3">Repayment Schedule</Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "0" && renderBasicDetails()}
              {activeTab === "1" && renderCustomerDetails()}
              {activeTab === "2" && renderLoanDetails()}
              {activeTab === "3" && renderRepaymentSchedule()}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
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
            <Button
              size="sm"
              variant="default"
              onClick={handleBack}
              disabled={activeTab === "0"}
              className="font-semibold px-5"
            >
              Back
            </Button>
            <Button size="sm" variant="default" onClick={handleNext} className="font-semibold px-5">
              Next
            </Button>
            <Button size="sm" className="bg-[#223A70] hover:bg-[#1a2d57] font-semibold px-6">
              Submit
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}

function SummaryItem({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <Text size="[10px]" className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">
        {label}
      </Text>
      <Text size="xs" fw={600} className={`${mono ? "font-mono" : ""} ${color || "text-gray-800"}`}>
        {value}
      </Text>
    </div>
  );
}

function SummaryCard({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <Paper
      withBorder
      radius="md"
      p="xs"
      className={`bg-white ${full ? "col-span-2 mt-2" : ""}`}
    >
      <Text size="[10px]" className="text-[10px] text-gray-500 font-semibold mb-1">
        {label}
      </Text>
      <Text size="sm" fw={700} className="text-[#0F2A4A] font-mono">
        {value}
      </Text>
    </Paper>
  );
}