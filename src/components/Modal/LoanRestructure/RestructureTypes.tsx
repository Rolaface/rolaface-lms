
export type NpaStatus = "Standard" | "Sub-Standard" | "Doubtful" | "Loss";
export type RestructureType = "RATE_CHANGE" | "TOPUP" | "MODIFY_MATURITY";

export interface RestructureLoan {
  id: string;
  type: string;
  principalOutstanding: number;
  interestRate: number;
  penaltyRate: number;
  maturityDate: string;
  npaStatus: NpaStatus;
  dpd: number;
}

export interface RestructureBorrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: RestructureLoan[];
}

export interface RestructureFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  reason: string | null;
  restructureType: RestructureType;
  newInterestRate?: number;
  newPenaltyRate?: number;
  topupAmount?: number;
  newPrincipalOutstanding?: number;
  newMaturityDate?: string;
  charges: { id: string; label: string; amount: number }[];
  totalCharges: number;
}

export interface ChargeRow {
  id: string;
  label: string;
  description: string;
  amount: number;
  checked: boolean;
}

export interface ScheduleRow {
  emiNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalEmi: number;
  balance: number;
}

/* =========================
 * Dummy data
 * ========================= */
export const BORROWERS: RestructureBorrower[] = [
  {
    name: "Yash Joshi",
    cif: "1009842",
    phone: "+91 98765 43210",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-001",
        type: "Vehicle Loan",
        principalOutstanding: 12450,
        interestRate: 9.5,
        penaltyRate: 2,
        maturityDate: "2029-03-15",
        npaStatus: "Standard",
        dpd: 0,
      },
      {
        id: "LNA-2025-089",
        type: "Personal Loan",
        principalOutstanding: 4200,
        interestRate: 11.25,
        penaltyRate: 2.5,
        maturityDate: "2027-11-01",
        npaStatus: "Standard",
        dpd: 0,
      },
    ],
  },
  {
    name: "Meera Nair",
    cif: "1010223",
    phone: "+91 91234 56780",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-014",
        type: "Home Loan",
        principalOutstanding: 284300,
        interestRate: 8.75,
        penaltyRate: 1.5,
        maturityDate: "2041-06-01",
        npaStatus: "Standard",
        dpd: 0,
      },
    ],
  },
  {
    name: "Arjun Kapoor",
    cif: "1011567",
    phone: "+91 99887 66554",
    status: "Overdue",
    loans: [
      {
        id: "LNA-2025-032",
        type: "Vehicle Loan",
        principalOutstanding: 8600,
        interestRate: 10.5,
        penaltyRate: 3,
        maturityDate: "2028-02-18",
        npaStatus: "Sub-Standard",
        dpd: 98,
      },
      {
        id: "LNA-2025-047",
        type: "Personal Loan",
        principalOutstanding: 2150,
        interestRate: 12,
        penaltyRate: 3.5,
        maturityDate: "2026-12-25",
        npaStatus: "Sub-Standard",
        dpd: 45,
      },
    ],
  },
  {
    name: "Sanya Iyer",
    cif: "1012890",
    phone: "+91 90000 12345",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-058",
        type: "Education Loan",
        principalOutstanding: 156000,
        interestRate: 7.8,
        penaltyRate: 1,
        maturityDate: "2033-08-10",
        npaStatus: "Standard",
        dpd: 0,
      },
    ],
  },
  {
    name: "Rohan Mehta",
    cif: "1013456",
    phone: "+91 98123 45678",
    status: "Overdue",
    loans: [
      {
        id: "LNA-2025-071",
        type: "Vehicle Loan",
        principalOutstanding: 5400,
        interestRate: 11,
        penaltyRate: 3,
        maturityDate: "2027-03-03",
        npaStatus: "Doubtful",
        dpd: 210,
      },
    ],
  },
];

export const RESTRUCTURE_REASONS = [
  "Financial Hardship",
  "Rate Renegotiation",
  "Loan Consolidation",
  "Collateral Revaluation",
  "Regulatory Requirement",
  "Other",
];

export const CHARGE_DEFS: ChargeRow[] = [
  {
    id: "processing",
    label: "Restructuring Processing Fee",
    description: "One-time fee for processing the restructure request",
    amount: 1500,
    checked: true,
  },
  {
    id: "documentation",
    label: "Documentation Charges",
    description: "Cost of preparing revised loan agreement documents",
    amount: 500,
    checked: true,
  },
  {
    id: "legal",
    label: "Legal / Valuation Fee",
    description: "Applicable when collateral re-valuation is required",
    amount: 2000,
    checked: true,
  },
  {
    id: "cersai",
    label: "CERSAI / Registration Fee",
    description: "Statutory charge for updating security registration",
    amount: 250,
    checked: true,
  },
  {
    id: "stamp",
    label: "Stamp Duty",
    description: "As applicable per state regulations on revised agreement",
    amount: 0,
    checked: false,
  },
];

/* =========================
 * Helpers
 * ========================= */
export const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

export const CONTENT_HEIGHT = "min(840px, calc(100vh - 150px))";
export function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function npaBadgeColor(status: NpaStatus) {
  if (status === "Standard") return "green";
  if (status === "Sub-Standard") return "gold";
  if (status === "Doubtful") return "accent";
  return "danger";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthsBetween(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 1);
}

export function buildSchedule(
  loan: RestructureLoan | null,
  type: RestructureType,
  newInterestRate: number | "",
  newPrincipalOutstanding: number | "",
  newMaturityDate: string,
  valueDate: string
): ScheduleRow[] {
  if (!loan) return [];
  const principal =
    type === "TOPUP" && newPrincipalOutstanding !== ""
      ? Number(newPrincipalOutstanding)
      : loan.principalOutstanding;
  const annualRate =
    type === "RATE_CHANGE" && newInterestRate !== "" ? Number(newInterestRate) : loan.interestRate;
  const maturity = type === "MODIFY_MATURITY" && newMaturityDate ? newMaturityDate : loan.maturityDate;
  const start = valueDate || todayISO();
  const months = monthsBetween(start, maturity);
  const monthlyRate = annualRate / 12 / 100;

  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  const startDate = new Date(start);
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    let principalComponent = emi - interest;
    if (i === months) principalComponent = balance;
    balance = Math.max(balance - principalComponent, 0);
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i);
    rows.push({
      emiNo: i,
      dueDate: due.toISOString().slice(0, 10),
      principal: Math.round(principalComponent * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      totalEmi: Math.round((principalComponent + interest) * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return rows;
}

export function restructureTypeLabel(type: RestructureType) {
  if (type === "RATE_CHANGE") return "Rate Change";
  if (type === "TOPUP") return "Topup";
  return "Modify Maturity";
}