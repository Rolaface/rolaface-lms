import {
  IconUser, IconPhone, IconId, IconChartLine, IconCash, IconShieldCheck,
  IconUpload, IconUsers, IconTag, IconPhoto, IconSignature, IconFileText,
  IconReceipt, IconBuildingBank as IconBankFile, IconDots,
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

// Financial + Borrower are merged into a single "Financial & Lending" step
// (rendered as two stacked cards inside CustomerModal's case 3). This drops
// the step count from 9 to 8 — every index after it shifts up by one.
export const STEPS = [
  { label: "Identity", icon: IconUser },
  { label: "Contact", icon: IconPhone },
  { label: "ID Documents", icon: IconId },
  { label: "Financial & Lending", icon: IconCash },
  { label: "KYC", icon: IconShieldCheck },
  { label: "Documents", icon: IconUpload },
  { label: "Next of Kin", icon: IconUsers },
  { label: "Tags & Notes", icon: IconTag },
] as const;

// Business-level grouping over STEPS above — purely a navigation/display
// layer. Step indices refer to positions in STEPS and are NOT reordered;
// currentStep / validation / handleNext / handleBack in CustomerModal stay
// linear exactly as before. Groups are not contiguous (Next of Kin is
// index 6 but belongs to the first group) — that's expected.
export const STEP_GROUPS = [
  {
    id: "profile",
    label: "Customer Profile",
    icon: IconUser,
    stepIndices: [0, 1, 6], // Identity, Contact, Next of Kin
  },
  {
    id: "verification",
    label: "KYC & Compliance",
    icon: IconShieldCheck,
    stepIndices: [2, 4, 5], // ID Documents, KYC, Documents
  },
  {
    id: "financial",
    label: "Financial & Lending",
    icon: IconBankFile,
    stepIndices: [3], // Financial & Lending (merged)
  },
  // {
  //   id: "additional",
  //   label: "Additional",
  //   icon: IconDots,
  //   stepIndices: [7], // Tags & Notes
  // },
] as const;

export const DOC_TILES = [
  {
    key: "profilePhoto",
    label: "Profile Photo",
    icon: IconPhoto,
    hint: "JPG, PNG up to 5MB",
    accept: "image/*",
    description:
      "Upload a recent, clear photo of the customer's face for identification purposes.",
    guidelines: [
      "Face must be clearly visible and well-lit.",
      "No sunglasses, hats, or filters.",
      "Plain background preferred.",
    ],
  },
  {
    key: "signature",
    label: "Signature",
    icon: IconSignature,
    hint: "JPG, PNG up to 2MB",
    accept: "image/*",
    description:
      "Upload a clear image of the customer's signature on plain paper.",
    guidelines: [
      "Signature must be on a plain white background.",
      "Use dark ink for clear contrast.",
      "Avoid folds, shadows, or cropping.",
    ],
  },
  {
    key: "nationalId",
    label: "National ID",
    icon: IconId,
    hint: "Front & back",
    accept: "image/*,.pdf",
    description:
      "Please upload a clear, legible copy of the front and back of the National ID.",
    guidelines: [
      "Ensure all four corners of the document are visible.",
      "The text must be clear and readable without glare or blurriness.",
      "Document must be valid and not expired.",
    ],
  },
  {
    key: "utilityBill",
    label: "Utility Bill",
    icon: IconFileText,
    hint: "Proof of address",
    accept: "image/*,.pdf",
    description:
      "Upload a recent utility bill (electricity, water, or similar) as proof of residential address.",
    guidelines: [
      "Bill must be dated within the last 3 months.",
      "Customer's name and address must be clearly visible.",
      "Scanned copies or clear photos are accepted.",
    ],
  },
  {
    key: "salarySlip",
    label: "Salary Slip",
    icon: IconReceipt,
    hint: "Last 3 months",
    accept: "image/*,.pdf",
    description:
      "Upload the customer's most recent 3 months of salary slips to verify income.",
    guidelines: [
      "All 3 months must be from the same employer.",
      "Employer name and net pay must be visible.",
      "Combine into a single PDF if possible.",
    ],
  },
  {
    key: "bankStatement",
    label: "Bank Statement",
    icon: IconBankFile,
    hint: "Last 6 months",
    accept: "image/*,.pdf",
    description:
      "Upload the customer's bank statement covering the last 6 months for financial assessment.",
    guidelines: [
      "Must show account holder name and account number.",
      "All 6 months should be included, in order.",
      "Official bank-issued statements only — no screenshots of banking apps.",
    ],
  },
] as const;

export const SUGGESTED_TAGS = ["VIP", "High risk", "Government employee", "Business owner", "Senior citizen", "Student"];

// The only "exception" styling left in the app — a genuinely read-only,
// muted-looking field. Not a parallel sizing system, just this one case.
export const readOnlyClassNames = {
  input: "!bg-slate-50 !text-slate-400",
};