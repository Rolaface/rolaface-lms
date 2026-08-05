import {
  IconUser, IconPhone, IconId, IconChartLine, IconCash, IconShieldCheck,
  IconUpload, IconUsers, IconTag, IconPhoto, IconSignature, IconFileText,
  IconReceipt, IconBuildingBank as IconBankFile,
} from "@tabler/icons-react";

// Grid column spans — same 12-col widths the fields used before the split,
// just kept in one place so every step imports the same scale.
export const W = {
  xxs: 2, // postal code, dependents
  xs: 2,  // dates, district, gender
  sm: 3,  // marital status, city, industry
  md: 3,  // occupation, id number, education, credit officer
  lg: 4,  // employer, id type, borrower category, branch
  xl: 3,  // mobile, email
  xxl: 6, // residential address, mailing address, kin address
} as const;

export const STEPS = [
  { label: "Identity", icon: IconUser },
  { label: "Contact", icon: IconPhone },
  { label: "ID Documents", icon: IconId },
  { label: "Financial", icon: IconChartLine },
  { label: "Borrower", icon: IconCash },
  { label: "KYC", icon: IconShieldCheck },
  { label: "Documents", icon: IconUpload },
  { label: "Next of Kin", icon: IconUsers },
  { label: "Tags & Notes", icon: IconTag },
] as const;

export const DOC_TILES = [
  { key: "profilePhoto", label: "Profile Photo", icon: IconPhoto, hint: "JPG, PNG up to 5MB", accept: "image/*" },
  { key: "signature", label: "Signature", icon: IconSignature, hint: "JPG, PNG up to 2MB", accept: "image/*" },
  { key: "nationalId", label: "National ID", icon: IconId, hint: "Front & back", accept: "image/*,.pdf" },
  { key: "utilityBill", label: "Utility Bill", icon: IconFileText, hint: "Proof of address", accept: "image/*,.pdf" },
  { key: "salarySlip", label: "Salary Slip", icon: IconReceipt, hint: "Last 3 months", accept: "image/*,.pdf" },
  { key: "bankStatement", label: "Bank Statement", icon: IconBankFile, hint: "Last 6 months", accept: "image/*,.pdf" },
] as const;

export const SUGGESTED_TAGS = ["VIP", "High risk", "Government employee", "Business owner", "Senior citizen", "Student"];

// The only "exception" styling left in the app — a genuinely read-only,
// muted-looking field. Not a parallel sizing system, just this one case.
export const readOnlyClassNames = {
  input: "!bg-slate-50 !text-slate-400",
};