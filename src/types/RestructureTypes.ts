import type { LoanRepaymentAccount } from "../api/loanRestructureApi";

export type NpaStatus = "Standard" | "Sub-Standard" | "Doubtful" | "Loss";
export type RestructureType = "RATE_CHANGE" | "TOPUP" | "MODIFY_MATURITY";


export interface RestructureLoan {
  id: string; 
  type: string; 
  principalOutstanding: number;
  interestRate: number;
  penaltyRate: number;
  maturityDate: string; 
  repaymentFrequency: string;
  npaStatus: NpaStatus;
  dpd: number;
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

export const CONTENT_HEIGHT = "65vh";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function restructureTypeLabel(type: RestructureType): string {
  switch (type) {
    case "RATE_CHANGE":
      return "Rate Change";
    case "TOPUP":
      return "Top-up";
    case "MODIFY_MATURITY":
      return "Modify Maturity";
    default:
      return type;
  }
}


export function buildSchedule(
  _loan: RestructureLoan | null,
  _restructureType: RestructureType,
  _newInterestRate: number | "",
  _newPrincipalOutstanding: number | "",
  _newMaturityDate: string,
  _valueDate: string
): ScheduleRow[] {
  return [];
}

export interface RestructureBorrower {
  applicantType: string;
  name: string;
  phone: string;
  loans: RestructureLoan[];
}

function toNpaStatus(v?: string): NpaStatus {
  if (v === "Sub-Standard" || v === "Doubtful" || v === "Loss") return v;
  return "Standard";
}


export function groupAccountsByBorrower(rows: LoanRepaymentAccount[]): RestructureBorrower[] {
  const map = new Map<string, RestructureBorrower>();
  for (const row of rows) {
    const key = `${row.applicant_type}::${row.applicant}::${row.phone_number}`;
    const loan: RestructureLoan = {
      id: row.against_loan,
      type: row.loan_product || "—",
      principalOutstanding: row.principal_outstanding ?? 0,
      interestRate: row.rate_of_interest ?? 0,
      penaltyRate: row.penalty_rate ?? 0,
      maturityDate: row.maturity_date || "",
      repaymentFrequency: row.repayment_frequency || "Monthly",
      npaStatus: toNpaStatus(row.npa_status),
      dpd: row.dpd ?? 0,
    };
    const existing = map.get(key);
    if (existing) {
      existing.loans.push(loan);
    } else {
      map.set(key, {
        applicantType: row.applicant_type,
        name: row.applicant_name || row.applicant,
        phone: row.phone_number,
        loans: [loan],
      });
    }
  }
  return [...map.values()];
}


export function addByFrequency(dateISO: string, amount: number, frequency?: string): string {
  if (!dateISO) return "";
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime()) || !amount) return dateISO;
  switch ((frequency || "Monthly").toLowerCase()) {
    case "daily":
      d.setDate(d.getDate() + amount);
      break;
    case "weekly":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "bi-weekly":
      d.setDate(d.getDate() + amount * 14);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + amount * 3);
      break;
    case "one time":
      d.setMonth(d.getMonth() + amount);
      break;
    case "monthly":
    default:
      d.setMonth(d.getMonth() + amount);
  }
  return d.toISOString().slice(0, 10);
}

export const RESTRUCTURE_REASONS = [
  "Financial Hardship",
  "Rate Renegotiation",
  "Loan Consolidation",
  "Collateral Revaluation",
  "Regulatory Requirement",
  "Other",
];

export const CHARGE_DEFS: ChargeRow[] = [
  { id: "processing", label: "Restructuring Processing Fee", description: "One-time fee for processing the restructure request", amount: 0, checked: true },
  { id: "documentation", label: "Documentation Charges", description: "Cost of preparing revised loan agreement documents", amount: 0, checked: false },
  { id: "legal", label: "Legal / Valuation Fee", description: "Applicable when collateral re-valuation is required", amount: 0, checked: false },
];

export function npaBadgeColor(status: NpaStatus) {
  if (status === "Standard") return "success";
  if (status === "Sub-Standard") return "gold";
  if (status === "Doubtful") return "accent";
  return "danger";
}