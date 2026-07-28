import {
  IconIdBadge2,
  IconCalendarStats,
  IconReceipt2,
  IconBriefcase,
  IconUsers,
  IconFileUpload,
} from "@tabler/icons-react";

// Fixed rate used for the Basic Details EMI preview — in a real app this
// would come from the selected Product Code.
export const ANNUAL_RATE = 14.5;

export interface DocumentRow {
  id: number;
  name: string;
  status: "Pending" | "Uploaded";
}

export const FEE_TYPES = ["Processing Fee", "Documentation Charges", "Insurance Premium", "Legal Fee"];
export const CURRENCIES = ["USD", "INR", "EUR", "GBP"];
export const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

// "None" added so the SegmentedControl has a matching option for the
// default state — previously the control's value/onChange were commented
// out, so this list never actually connected to state at all.
export const MORATORIUM_TYPES = ["Principal Only", "EMI (Principal + Interest)"];

export const DEFAULT_DOCUMENTS: DocumentRow[] = [
  { id: 1, name: "National ID / Passport", status: "Pending" },
  { id: 2, name: "Proof of Address", status: "Pending" },
  { id: 3, name: "Proof of Income / Payslip", status: "Pending" },
  { id: 4, name: "Signed Loan Account Form", status: "Pending" },
];

export const TAB_ITEMS: {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { value: "basic", label: "Basic Details", icon: IconIdBadge2 },
  { value: "charges", label: "Charges", icon: IconReceipt2 },
  { value: "schedule", label: "Repayment Schedule", icon: IconCalendarStats },
  { value: "coapplicant", label: "Co-applicant", icon: IconUsers },
  { value: "collateral", label: "Collateral", icon: IconBriefcase },
  { value: "documents", label: "Documents", icon: IconFileUpload },
];

export const labelClass = { label: "text-sm font-medium text-slate-700 mb-1" };