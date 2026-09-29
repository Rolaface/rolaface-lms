import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
  Progress,
} from "@mantine/core";


import { AreaChart } from "@mantine/charts";
import { DateInput } from "@mantine/dates";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconClipboardData,
  IconDownload,
  IconFileAnalytics,
  IconFilter,
  IconMapPin,
  IconRefresh,
  IconScale,
  IconShieldCheck,
  IconTrendingUp,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import {
  EmptyState,
  ReportShell,
  SectionCard,
} from "../LosReports/shared/LosReportShared";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ApplicationStatus =
  | "Approved"
  | "Rejected"
  | "On Hold"
  | "Withdrawn";

type RiskBand =
  | "Low Risk"
  | "Medium Risk"
  | "High Risk";

type VerificationStatus =
  | "Verified"
  | "Pending"
  | "Discrepancy";

type ApplicationRow = {
  id: string;
  product: string;
  branch: string;
  stage: string;
  status: ApplicationStatus;
  source: string;
  officer: string;
  requested: number;
  approved: number;
  age: number;
  submittedOn: string;
  creditScore: number;
  dti: number;
  riskBand: RiskBand;
  verificationStatus: VerificationStatus;
  discrepancyCount: number;
  rejectionReason: string;
  manualOverride: boolean;
};

type VerificationCategoryStatus =
  | "Verified"
  | "Pending"
  | "Discrepancy";

type VerificationCategories = {
  identity: VerificationCategoryStatus;
  income: VerificationCategoryStatus;
  banking: VerificationCategoryStatus;
  address: VerificationCategoryStatus;
};

type DateRange = [Date | null, Date | null];

type Filters = {
  product: string;
  status: string;
  source: string;
  dateRange: DateRange;
};

/* -------------------------------------------------------------------------- */
/* DUMMY DATA                                                                 */
/* -------------------------------------------------------------------------- */

const APPLICATIONS: ApplicationRow[] = [
  {
    id: "APP-1001",
    product: "Personal Loan",
    branch: "Delhi",
    stage: "Disbursement",
    status: "Approved",
    source: "Branch",
    officer: "Rahul Sharma",
    requested: 450000,
    approved: 420000,
    age: 2,
    submittedOn: "2026-09-20",
    creditScore: 782,
    dti: 28,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1002",
    product: "Home Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "On Hold",
    source: "DSA",
    officer: "Priya Singh",
    requested: 3500000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-18",
    creditScore: 668,
    dti: 43,
    riskBand: "Medium Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 2,
    rejectionReason: "Income mismatch",
    manualOverride: false,
  },
  {
    id: "APP-1003",
    product: "Personal Loan",
    branch: "Lucknow",
    stage: "Approved",
    status: "Approved",
    source: "Digital",
    officer: "Amit Verma",
    requested: 300000,
    approved: 285000,
    age: 1,
    submittedOn: "2026-09-21",
    creditScore: 756,
    dti: 31,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1004",
    product: "Business Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Partner",
    officer: "Rahul Sharma",
    requested: 1200000,
    approved: 0,
    age: 7,
    submittedOn: "2026-09-15",
    creditScore: 584,
    dti: 57,
    riskBand: "High Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 3,
    rejectionReason: "High DTI",
    manualOverride: false,
  },
  {
    id: "APP-1005",
    product: "Personal Loan",
    branch: "Jaipur",
    stage: "Document Verification",
    status: "On Hold",
    source: "Branch",
    officer: "Neha Gupta",
    requested: 500000,
    approved: 0,
    age: 4,
    submittedOn: "2026-09-19",
    creditScore: 642,
    dti: 46,
    riskBand: "Medium Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Incomplete documents",
    manualOverride: false,
  },
  {
    id: "APP-1006",
    product: "Home Loan",
    branch: "Delhi",
    stage: "Disbursement",
    status: "Approved",
    source: "Digital",
    officer: "Vikas Kumar",
    requested: 4200000,
    approved: 4000000,
    age: 3,
    submittedOn: "2026-09-19",
    creditScore: 812,
    dti: 24,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1007",
    product: "Personal Loan",
    branch: "Noida",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "DSA",
    officer: "Priya Singh",
    requested: 250000,
    approved: 0,
    age: 8,
    submittedOn: "2026-09-14",
    creditScore: 556,
    dti: 62,
    riskBand: "High Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "Low credit score",
    manualOverride: false,
  },
  {
    id: "APP-1008",
    product: "Business Loan",
    branch: "Lucknow",
    stage: "Underwriting",
    status: "On Hold",
    source: "Partner",
    officer: "Amit Verma",
    requested: 1800000,
    approved: 0,
    age: 6,
    submittedOn: "2026-09-16",
    creditScore: 618,
    dti: 49,
    riskBand: "Medium Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 2,
    rejectionReason: "Banking irregularity",
    manualOverride: true,
  },
  {
    id: "APP-1009",
    product: "Personal Loan",
    branch: "Jaipur",
    stage: "Approved",
    status: "Approved",
    source: "Digital",
    officer: "Neha Gupta",
    requested: 350000,
    approved: 330000,
    age: 2,
    submittedOn: "2026-09-20",
    creditScore: 741,
    dti: 33,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: true,
  },
  {
    id: "APP-1010",
    product: "Home Loan",
    branch: "Delhi",
    stage: "Application",
    status: "Withdrawn",
    source: "Branch",
    officer: "Vikas Kumar",
    requested: 2800000,
    approved: 0,
    age: 10,
    submittedOn: "2026-09-12",
    creditScore: 692,
    dti: 39,
    riskBand: "Medium Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Customer withdrawn",
    manualOverride: false,
  },
  {
    id: "APP-1011",
    product: "Personal Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "Approved",
    source: "Partner",
    officer: "Rahul Sharma",
    requested: 600000,
    approved: 575000,
    age: 3,
    submittedOn: "2026-09-19",
    creditScore: 728,
    dti: 35,
    riskBand: "Medium Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1012",
    product: "Business Loan",
    branch: "Lucknow",
    stage: "Document Verification",
    status: "On Hold",
    source: "DSA",
    officer: "Amit Verma",
    requested: 1500000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-18",
    creditScore: 603,
    dti: 52,
    riskBand: "High Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 4,
    rejectionReason: "Business proof mismatch",
    manualOverride: false,
  },
  {
    id: "APP-1013",
    product: "Personal Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "Approved",
    source: "Digital",
    officer: "Rahul Sharma",
    requested: 700000,
    approved: 675000,
    age: 2,
    submittedOn: "2026-09-20",
    creditScore: 825,
    dti: 22,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1014",
    product: "Home Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "Approved",
    source: "Branch",
    officer: "Priya Singh",
    requested: 5200000,
    approved: 4900000,
    age: 4,
    submittedOn: "2026-09-18",
    creditScore: 798,
    dti: 26,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1015",
    product: "Business Loan",
    branch: "Jaipur",
    stage: "Credit Assessment",
    status: "Approved",
    source: "Partner",
    officer: "Neha Gupta",
    requested: 2100000,
    approved: 1950000,
    age: 3,
    submittedOn: "2026-09-19",
    creditScore: 773,
    dti: 29,
    riskBand: "Low Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1016",
    product: "Personal Loan",
    branch: "Lucknow",
    stage: "Underwriting",
    status: "Approved",
    source: "Branch",
    officer: "Amit Verma",
    requested: 550000,
    approved: 525000,
    age: 2,
    submittedOn: "2026-09-21",
    creditScore: 748,
    dti: 32,
    riskBand: "Medium Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1017",
    product: "Home Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "Approved",
    source: "Digital",
    officer: "Vikas Kumar",
    requested: 3600000,
    approved: 3450000,
    age: 3,
    submittedOn: "2026-09-20",
    creditScore: 735,
    dti: 34,
    riskBand: "Medium Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "None",
    manualOverride: false,
  },
  {
    id: "APP-1018",
    product: "Personal Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "On Hold",
    source: "DSA",
    officer: "Priya Singh",
    requested: 475000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-17",
    creditScore: 712,
    dti: 36,
    riskBand: "Medium Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Incomplete documents",
    manualOverride: false,
  },
  {
    id: "APP-1019",
    product: "Business Loan",
    branch: "Lucknow",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Partner",
    officer: "Amit Verma",
    requested: 1750000,
    approved: 0,
    age: 6,
    submittedOn: "2026-09-16",
    creditScore: 704,
    dti: 38,
    riskBand: "Medium Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 2,
    rejectionReason: "Income mismatch",
    manualOverride: false,
  },
  {
    id: "APP-1020",
    product: "Home Loan",
    branch: "Jaipur",
    stage: "Underwriting",
    status: "On Hold",
    source: "Branch",
    officer: "Neha Gupta",
    requested: 3100000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-15",
    creditScore: 695,
    dti: 41,
    riskBand: "Medium Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Property verification pending",
    manualOverride: false,
  },
  {
    id: "APP-1021",
    product: "Personal Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "On Hold",
    source: "Digital",
    officer: "Rahul Sharma",
    requested: 650000,
    approved: 0,
    age: 4,
    submittedOn: "2026-09-18",
    creditScore: 681,
    dti: 43,
    riskBand: "Medium Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 1,
    rejectionReason: "Banking irregularity",
    manualOverride: false,
  },
  {
    id: "APP-1022",
    product: "Business Loan",
    branch: "Noida",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "DSA",
    officer: "Priya Singh",
    requested: 1400000,
    approved: 0,
    age: 7,
    submittedOn: "2026-09-14",
    creditScore: 659,
    dti: 45,
    riskBand: "Medium Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 2,
    rejectionReason: "High DTI",
    manualOverride: false,
  },
  {
    id: "APP-1023",
    product: "Home Loan",
    branch: "Lucknow",
    stage: "Document Verification",
    status: "On Hold",
    source: "Partner",
    officer: "Amit Verma",
    requested: 2700000,
    approved: 0,
    age: 6,
    submittedOn: "2026-09-13",
    creditScore: 648,
    dti: 47,
    riskBand: "High Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Incomplete documents",
    manualOverride: false,
  },
  {
    id: "APP-1024",
    product: "Personal Loan",
    branch: "Jaipur",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Branch",
    officer: "Neha Gupta",
    requested: 325000,
    approved: 0,
    age: 8,
    submittedOn: "2026-09-12",
    creditScore: 632,
    dti: 49,
    riskBand: "High Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 2,
    rejectionReason: "Low credit score",
    manualOverride: false,
  },
  {
    id: "APP-1025",
    product: "Business Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Partner",
    officer: "Rahul Sharma",
    requested: 1850000,
    approved: 0,
    age: 9,
    submittedOn: "2026-09-11",
    creditScore: 615,
    dti: 51,
    riskBand: "High Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 3,
    rejectionReason: "High DTI",
    manualOverride: false,
  },
  {
    id: "APP-1026",
    product: "Home Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "On Hold",
    source: "Digital",
    officer: "Vikas Kumar",
    requested: 4100000,
    approved: 0,
    age: 7,
    submittedOn: "2026-09-13",
    creditScore: 598,
    dti: 54,
    riskBand: "High Risk",
    verificationStatus: "Pending",
    discrepancyCount: 1,
    rejectionReason: "Income mismatch",
    manualOverride: false,
  },
  {
    id: "APP-1027",
    product: "Personal Loan",
    branch: "Lucknow",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "DSA",
    officer: "Amit Verma",
    requested: 290000,
    approved: 0,
    age: 10,
    submittedOn: "2026-09-10",
    creditScore: 575,
    dti: 58,
    riskBand: "High Risk",
    verificationStatus: "Verified",
    discrepancyCount: 0,
    rejectionReason: "Low credit score",
    manualOverride: false,
  },
  {
    id: "APP-1028",
    product: "Business Loan",
    branch: "Jaipur",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Branch",
    officer: "Neha Gupta",
    requested: 950000,
    approved: 0,
    age: 11,
    submittedOn: "2026-09-09",
    creditScore: 548,
    dti: 64,
    riskBand: "High Risk",
    verificationStatus: "Discrepancy",
    discrepancyCount: 4,
    rejectionReason: "High DTI",
    manualOverride: false,
  },
];

const VERIFICATION_CATEGORY_DATA: Record<
  string,
  VerificationCategories
> = {
  "APP-1001": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1002": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1003": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1004": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1005": {
    identity: "Verified",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1006": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1007": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1008": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1009": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1010": {
    identity: "Verified",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1011": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1012": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1013": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1014": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1015": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1016": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1017": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1018": {
    identity: "Verified",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1019": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1020": {
    identity: "Verified",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1021": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1022": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1023": {
    identity: "Verified",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1024": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1025": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
  "APP-1026": {
    identity: "Verified",
    income: "Pending",
    banking: "Pending",
    address: "Pending",
  },
  "APP-1027": {
    identity: "Verified",
    income: "Verified",
    banking: "Verified",
    address: "Verified",
  },
  "APP-1028": {
    identity: "Discrepancy",
    income: "Pending",
    banking: "Verified",
    address: "Pending",
  },
};

/* -------------------------------------------------------------------------- */
/* OPTIONS                                                                    */
/* -------------------------------------------------------------------------- */

const PRODUCT_OPTIONS = [
  "All Products",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
];

const STATUS_OPTIONS = [
  "All Statuses",
  "Approved",
  "Rejected",
  "On Hold",
  "Withdrawn",
];

const SOURCE_OPTIONS = [
  "All Sources",
  "Branch",
  "Digital",
  "DSA",
  "Partner",
];

const BRANCH_OPTIONS = [
  "All Branches",
  "Delhi",
  "Noida",
  "Lucknow",
  "Jaipur",
];

const OFFICER_OPTIONS = [
  "All Officers",
  "Rahul Sharma",
  "Priya Singh",
  "Amit Verma",
  "Neha Gupta",
  "Vikas Kumar",
];

/* -------------------------------------------------------------------------- */
/* VISUAL TOKENS / HELPERS                                                    */
/* -------------------------------------------------------------------------- */

const chartColors = {
  blue: "#2563EB",
  green: "#059669",
  yellow: "#D97706",
  red: "#DC2626",
  sky: "#0284C7",
  track: "var(--mantine-color-gray-2)",
  border: "var(--mantine-color-gray-2)",
  text: "var(--mantine-color-text)",
  dimmed: "var(--mantine-color-dimmed)",
};

const STATUS_COLORS: Record<
  ApplicationStatus,
  string
> = {
  Approved: "green",
  Rejected: "red",
  "On Hold": "yellow",
  Withdrawn: "gray",
};

const RISK_COLORS: Record<
  RiskBand,
  string
> = {
  "Low Risk": "green",
  "Medium Risk": "yellow",
  "High Risk": "red",
};

const VERIFICATION_COLORS: Record<
  VerificationStatus,
  string
> = {
  Verified: "green",
  Pending: "yellow",
  Discrepancy: "red",
};

const DTI_COLORS = {
  "<30%": chartColors.green,
  "30–39%": chartColors.blue,
  "40–49%": chartColors.yellow,
  "50%+": chartColors.red,
};

const statusColor = (
  status: ApplicationStatus,
) => STATUS_COLORS[status];

const riskColor = (
  risk: RiskBand,
) => RISK_COLORS[risk];

const verificationColor = (
  status: VerificationStatus,
) =>
  VERIFICATION_COLORS[status];

const clampPercent = (
  value: number,
) =>
  Math.max(
    0,
    Math.min(100, value),
  );

const formatDate = (
  value: string,
) => {
  const date = new Date(
    `${value}T00:00:00`,
  );

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

const filterInputStyles = {
  input: {
    minHeight: 30,
    height: 30,
    fontSize: 11,
    fontWeight: 650,
    backgroundColor:
      "var(--mantine-color-gray-0)",
  },
};

const tableHeaderStyles = {
  fontSize: 10,
  fontWeight: 800,
  color: "var(--mantine-color-dimmed)",
  whiteSpace: "nowrap" as const,
};

/* -------------------------------------------------------------------------- */
/* COMPACT KPI                                                                */
/* -------------------------------------------------------------------------- */

function CompactKpi({
  label,
  value,
  helper,
  tone = "blue",
  tooltip,
  emphasis = "primary",
  attention = false,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: string;
  tooltip?: string;
  emphasis?: "primary" | "secondary";
  attention?: boolean;
}) {
  const isPrimary = emphasis === "primary";

  return (
    <Tooltip
      label={tooltip ?? helper ?? label}
      withArrow
      openDelay={350}
      position="top"
    >
      <Card
        withBorder
        radius="md"
        p={9}
        style={{
          height: isPrimary ? 64 : 58,
          overflow: "hidden",
          borderColor: attention
            ? `var(--mantine-color-${tone}-2)`
            : chartColors.border,
          borderLeft: attention
            ? `3px solid var(--mantine-color-${tone}-6)`
            : undefined,
          backgroundColor: attention
            ? `var(--mantine-color-${tone}-0)`
            : "var(--mantine-color-body)",
        }}
      >
        <Group
          justify="space-between"
          align="center"
          gap={8}
          wrap="nowrap"
          style={{ height: "100%" }}
        >
          <Box
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <Text
              size="16px"
              fw={800}
              c="dimmed"

              lh={1.1}
              truncate
            >
              {label}
            </Text>

            {helper && (
              <Text
                size="9px"
                c="dimmed"
                mt={5}
                truncate
                lh={1}
              >
                {helper}
              </Text>
            )}
          </Box>

          <Text
            fw={850}
            fz={isPrimary ? 18 : 15}
            lh={1}
            style={{
              flexShrink: 0,
            }}
          >
            {value}
          </Text>
        </Group>
      </Card>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER COMPONENT                                                           */
/* -------------------------------------------------------------------------- */

function ReportFilter({
  value,
  onChange,
  data,
  width,
  icon,
}: {
  value: string;
  onChange: (
    value: string,
  ) => void;
  data: string[];
  width: number;
  icon: ReactNode;
}) {
  return (
    <Select
      size="xs"
      radius="md"
      w={width}
      value={value}
      onChange={(nextValue) =>
        onChange(
          nextValue ??
          data[0],
        )
      }
      data={data}
      leftSection={icon}
      checkIconPosition="right"
      styles={
        filterInputStyles
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* DONUT CHART                                                                */
/* -------------------------------------------------------------------------- */

function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 148,
  strokeWidth = 16,
}: {
  segments: ChartSegment[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius =
    (size - strokeWidth) /
    2;

  const circumference =
    2 * Math.PI * radius;

  const total =
    segments.reduce(
      (sum, segment) =>
        sum +
        Math.max(
          0,
          segment.value,
        ),
      0,
    );

  let offset = 0;

  return (
    <Box
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
      }}
      aria-label={`${centerLabel}: ${centerValue}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            chartColors.track
          }
          strokeWidth={
            strokeWidth
          }
        />

        {total > 0 &&
          segments.map(
            (segment) => {
              const value =
                Math.max(
                  0,
                  segment.value,
                );

              const length =
                (value / total) *
                circumference;

              const currentOffset =
                offset;

              offset += length;

              if (!value) {
                return null;
              }

              return (
                <circle
                  key={
                    segment.label
                  }
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={
                    segment.color
                  }
                  strokeWidth={
                    strokeWidth
                  }
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(
                    length - 2,
                    0,
                  )} ${circumference}`}
                  strokeDashoffset={
                    -currentOffset
                  }
                  transform={`rotate(-90 ${size / 2
                    } ${size / 2
                    })`}
                />
              );
            },
          )}
      </svg>

      <Stack
        gap={0}
        align="center"
        justify="center"
        style={{
          position:
            "absolute",
          inset: 0,
          pointerEvents:
            "none",
        }}
      >
        <Text
          fw={850}
          fz={24}
          lh={1}
        >
          {centerValue}
        </Text>

        <Text
          size="9px"
          fw={800}
          c="dimmed"
          tt="uppercase"
          mt={4}
          ta="center"
        >
          {centerLabel}
        </Text>
      </Stack>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* CHART TYPES                                                                */
/* -------------------------------------------------------------------------- */

type ChartSegment = {
  label: string;
  value: number;
  color: string;
};

/* -------------------------------------------------------------------------- */
/* REJECTION REASONS                                                          */
/* -------------------------------------------------------------------------- */

function RejectionReasonChart({
  items,
  totalRejected,
}: {
  items: Array<{
    reason: string;
    value: number;
  }>;
  totalRejected: number;
}) {
  const iconForReason = (
    reason: string,
  ) => {
    switch (reason) {
      case "High DTI":
        return (
          <IconScale size={14} />
        );

      case "Low credit score":
        return (
          <IconClipboardData
            size={14}
          />
        );

      case "Income mismatch":
      case "Incomplete documents":
        return (
          <IconFileAnalytics
            size={14}
          />
        );

      case "Banking irregularity":
        return (
          <IconBuilding size={14} />
        );

      case "Property verification pending":
        return (
          <IconMapPin size={14} />
        );

      case "Customer withdrawn":
        return (
          <IconUser size={14} />
        );

      default:
        return (
          <IconAlertTriangle
            size={14}
          />
        );
    }
  };

  const colorForReason = (
    reason: string,
  ) => {
    switch (reason) {
      case "High DTI":
        return chartColors.red;

      case "Low credit score":
        return chartColors.blue;

      case "Income mismatch":
        return chartColors.yellow;

      default:
        return chartColors.sky;
    }
  };

  return (
    <Stack gap={0}>
      <Box
        px={8}
        py={5}
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) 42px 50px",
          columnGap: 7,
          borderRadius: 7,
          backgroundColor:
            "var(--mantine-color-gray-0)",
        }}
      >
        <Text
          size="9px"
          fw={800}
          c="dimmed"
        >
          Reasons
        </Text>

        <Text
          size="9px"
          fw={800}
          c="dimmed"
          ta="right"
        >
          Cases
        </Text>

        <Text
          size="9px"
          fw={800}
          c="dimmed"
          ta="right"
        >
          % Share
        </Text>
      </Box>

      <Stack
        gap={0}
        mt={2}
      >
        {items
          .slice(0, 3)
          .map((item) => {
            const percentage =
              totalRejected > 0
                ? Math.round(
                  (item.value /
                    totalRejected) *
                  100,
                )
                : 0;

            const color =
              colorForReason(
                item.reason,
              );

            return (
              <Box
                key={
                  item.reason
                }
                py={5}
                px={2}
                style={{
                  borderBottom: `1px solid ${chartColors.track}`,
                }}
              >
                <Box
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) 42px 50px",
                    columnGap: 7,
                    alignItems:
                      "center",
                  }}
                >
                  <Group
                    gap={7}
                    wrap="nowrap"
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <ThemeIcon
                      size={24}
                      radius="sm"
                      variant="light"
                      style={{
                        flexShrink: 0,
                        color,
                      }}
                    >
                      {iconForReason(
                        item.reason,
                      )}
                    </ThemeIcon>

                    <Text
                      size="xs"
                      fw={700}
                      truncate
                    >
                      {
                        item.reason
                      }
                    </Text>
                  </Group>

                  <Text
                    size="xs"
                    fw={850}
                    ta="right"
                  >
                    {item.value}
                  </Text>

                  <Text
                    size="9px"
                    fw={750}
                    c="dimmed"
                    ta="right"
                  >
                    {percentage}%
                  </Text>
                </Box>
              </Box>
            );
          })}
      </Stack>
    </Stack>
  );
}

/* -------------------------------------------------------------------------- */
/* CREDIT SCORE DISTRIBUTION - SPLINE AREA                                    */
/* -------------------------------------------------------------------------- */

function CreditScoreDistributionChart({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
  }>;
}) {
  const total = items.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const chartData = items.map((item) => ({
    band: item.label,
    applications: item.value,
  }));

  return (
    <Box
      style={{
        width: "100%",
      }}
    >
      <Group
        justify="flex-end"
        mb={4}
      >
        <Box
          px={8}
          py={4}
          style={{
            border: `1px solid ${chartColors.track}`,
            borderRadius: 8,
            backgroundColor:
              "var(--mantine-color-gray-0)",
          }}
        >
          <Text
            size="9px"
            fw={800}
            c="dimmed"
          >
            {total} apps
          </Text>
        </Box>
      </Group>

      <AreaChart
        h={200}
        data={chartData}
        dataKey="band"
        series={[
          {
            name: "applications",
            color: chartColors.red,
          },
        ]}
        curveType="monotone"
        withDots
        withGradient
        withXAxis
        withYAxis
        gridAxis="y"
        tickLine="none"
        fillOpacity={0.18}
        yAxisProps={{
          width: 30,
          tickSize: 0,
          domain: [0, "auto"],
        }}
        xAxisProps={{
          tickSize: 0,
        }}
        tooltipAnimationDuration={150}
        styles={{
          root: {
            width: "100%",
          },
        }}
      />
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* DTI DISTRIBUTION                                                           */
/* -------------------------------------------------------------------------- */

function DtiDistributionTable({
  items,
  total,
}: {
  items: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  total: number;
}) {
  return (
    <Box
      style={{
        width: "100%",
      }}
    >
      {/* TABLE HEADER */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns:
            "82px minmax(100px, 1fr) 42px",
          alignItems: "center",
          gap: 12,
          minHeight: 34,
          borderBottom:
            "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Text
          size="9px"
          fw={800}
          c="dimmed"
          tt="uppercase"
        >
          DTI Band
        </Text>

        <Text
          size="9px"
          fw={800}
          c="dimmed"
          tt="uppercase"
        >
          Applications
        </Text>

        <Text
          size="9px"
          fw={800}
          c="dimmed"
          tt="uppercase"
          ta="right"
        >
          % Share
        </Text>
      </Box>

      {/* TABLE ROWS */}
      <Stack gap={0}>
        {items.map((item, index) => {
          const percentage =
            total > 0
              ? Math.round(
                (item.value / total) * 100,
              )
              : 0;

          const color =
            item.color ??
            DTI_COLORS[
            item.label as keyof typeof DTI_COLORS
            ] ??
            chartColors.blue;

          return (
            <Box
              key={item.label}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "82px minmax(100px, 1fr) 42px",
                alignItems: "center",
                gap: 12,
                minHeight: 52,
                borderBottom:
                  index !== items.length - 1
                    ? "1px solid var(--mantine-color-gray-2)"
                    : undefined,
              }}
            >
              {/* DTI BAND */}
              <Group
                gap={7}
                wrap="nowrap"
              >
                <Box
                  w={7}
                  h={7}
                  style={{
                    flexShrink: 0,
                    borderRadius: "50%",
                    backgroundColor: color,
                  }}
                />

                <Text
                  size="sm"
                  fw={600}
                  c="slate.8"
                  style={{
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Text>
              </Group>

              {/* APPLICATIONS + BAR */}
              <Box
                style={{
                  minWidth: 0,
                }}
              >
                <Group
                  justify="space-between"
                  gap={8}
                  mb={5}
                  wrap="nowrap"
                >
                  <Text
                    size="sm"
                    fw={700}
                    c="slate.8"
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    {item.value}
                  </Text>
                </Group>

                <Box
                  style={{
                    width: "100%",
                    height: 7,
                    borderRadius: 999,
                    overflow: "hidden",
                    backgroundColor:
                      "var(--mantine-color-gray-2)",
                  }}
                >
                  <Box
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      minWidth:
                        item.value > 0 ? 6 : 0,
                      borderRadius: 999,
                      backgroundColor: color,
                      transition: "width 180ms ease",
                    }}
                  />
                </Box>
              </Box>

              {/* SHARE */}
              <Text
                size="sm"
                fw={700}
                c="slate.8"
                ta="right"
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                {percentage}%
              </Text>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* VERIFICATION STATUS                                                        */
/* -------------------------------------------------------------------------- */

function VerificationStatusList({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
    color: string;
    icon: ReactNode;
  }>;
}) {
  return (
    <Stack gap={0}>
      {items.map((item, index) => {
        const progress = clampPercent(item.value);

        return (
          <Box
            key={item.label}
            px={2}
            py={9}
            style={{
              borderBottom:
                index < items.length - 1
                  ? `1px solid ${chartColors.track}`
                  : undefined,
            }}
          >
            <Group
              gap={9}
              wrap="nowrap"
              align="center"
            >
              <ThemeIcon
                size={30}
                radius="sm"
                variant="light"
                style={{
                  flexShrink: 0,
                  color: item.color,
                }}
              >
                {item.icon}
              </ThemeIcon>

              <Box
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Group
                  justify="space-between"
                  gap={8}
                  mb={5}
                  wrap="nowrap"
                >
                  <Text
                    size="xs"
                    fw={750}
                    truncate
                  >
                    {item.label}
                  </Text>

                  <Text
                    size="10px"
                    fw={850}
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    {progress}%
                  </Text>
                </Group>

                <Box
                  style={{
                    width: "100%",
                    height: 7,
                    borderRadius: 999,
                    overflow: "hidden",
                    backgroundColor:
                      chartColors.track,
                  }}
                  role="img"
                  aria-label={`${item.label}: ${progress}%`}
                >
                  <Box
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      minWidth:
                        progress > 0 ? 6 : 0,
                      borderRadius: 999,
                      backgroundColor:
                        item.color,
                      transition:
                        "width 180ms ease",
                    }}
                  />
                </Box>
              </Box>
            </Group>
          </Box>
        );
      })}
    </Stack>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function RiskVerification() {
  const [filters, setFilters] =
    useState<Filters>({
      product:
        "All Products",
      status:
        "All Statuses",
      source:
        "All Sources",
      dateRange: [
        null,
        null,
      ],
    });

  const [tableBranch, setTableBranch] =
    useState(
      "All Branches",
    );

  const [tableOfficer, setTableOfficer] =
    useState(
      "All Officers",
    );

  /* ------------------------------------------------------------------------ */
  /* FILTERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const setFilter = <
    K extends keyof Filters
  >(
    key: K,
    value: Filters[K],
  ) => {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };

  const resetFilters = () => {
    setFilters({
      product:
        "All Products",
      status:
        "All Statuses",
      source:
        "All Sources",
      dateRange: [
        null,
        null,
      ],
    });

    setTableBranch(
      "All Branches",
    );

    setTableOfficer(
      "All Officers",
    );
  };

  const hasActiveFilters =
    filters.product !==
    "All Products" ||
    filters.status !==
    "All Statuses" ||
    filters.source !==
    "All Sources" ||
    filters.dateRange[0] !==
    null ||
    filters.dateRange[1] !==
    null ||
    tableBranch !==
    "All Branches" ||
    tableOfficer !==
    "All Officers";

  /* ------------------------------------------------------------------------ */
  /* FILTERED APPLICATIONS                                                    */
  /* ------------------------------------------------------------------------ */

  const filteredApps =
    useMemo(() => {
      const [from, to] =
        filters.dateRange;

      const fromDate =
        from
          ? new Date(
            from.getFullYear(),
            from.getMonth(),
            from.getDate(),
          ).getTime()
          : null;

      const toDate =
        to
          ? new Date(
            to.getFullYear(),
            to.getMonth(),
            to.getDate(),
            23,
            59,
            59,
            999,
          ).getTime()
          : null;

      return APPLICATIONS.filter(
        (app) => {
          if (
            filters.product !==
            "All Products" &&
            app.product !==
            filters.product
          ) {
            return false;
          }

          if (
            filters.status !==
            "All Statuses" &&
            app.status !==
            filters.status
          ) {
            return false;
          }

          if (
            filters.source !==
            "All Sources" &&
            app.source !==
            filters.source
          ) {
            return false;
          }

          const submittedTime =
            new Date(
              `${app.submittedOn}T00:00:00`,
            ).getTime();

          if (
            fromDate !==
            null &&
            submittedTime <
            fromDate
          ) {
            return false;
          }

          if (
            toDate !== null &&
            submittedTime >
            toDate
          ) {
            return false;
          }

          return true;
        },
      );
    }, [filters]);

  const tableApps =
    useMemo(() => {
      return filteredApps.filter(
        (app) =>
          (tableBranch ===
            "All Branches" ||
            app.branch ===
            tableBranch) &&
          (tableOfficer ===
            "All Officers" ||
            app.officer ===
            tableOfficer),
      );
    }, [
      filteredApps,
      tableBranch,
      tableOfficer,
    ]);

  /* ------------------------------------------------------------------------ */
  /* METRICS                                                                  */
  /* ------------------------------------------------------------------------ */

  const metrics =
    useMemo(() => {
      const totalAssessed =
        filteredApps.length;

      const summary =
        filteredApps.reduce(
          (acc, app) => {
            if (
              app.status ===
              "Approved"
            ) {
              acc.approved += 1;
            }

            if (
              app.status ===
              "Rejected"
            ) {
              acc.rejected += 1;
            }

            if (
              app.riskBand ===
              "High Risk"
            ) {
              acc.highRisk += 1;
            }

            if (
              app.status ===
              "On Hold" ||
              app.verificationStatus ===
              "Discrepancy"
            ) {
              acc.manualReview += 1;
            }

            acc.discrepancies +=
              app.discrepancyCount;

            if (
              app.manualOverride
            ) {
              acc.manualOverrides +=
                1;
            }

            acc.creditScoreTotal +=
              app.creditScore;

            acc.dtiTotal +=
              app.dti;

            return acc;
          },
          {
            approved: 0,
            rejected: 0,
            highRisk: 0,
            manualReview: 0,
            discrepancies: 0,
            manualOverrides: 0,
            creditScoreTotal: 0,
            dtiTotal: 0,
          },
        );

      const approvalRate =
        totalAssessed > 0
          ? Math.round(
            (summary.approved /
              totalAssessed) *
            100,
          )
          : 0;

      const rejectionRate =
        totalAssessed > 0
          ? Math.round(
            (summary.rejected /
              totalAssessed) *
            100,
          )
          : 0;

      return {
        totalAssessed,
        ...summary,
        avgCreditScore:
          totalAssessed > 0
            ? Math.round(
              summary.creditScoreTotal /
              totalAssessed,
            )
            : 0,
        avgDti:
          totalAssessed > 0
            ? Math.round(
              summary.dtiTotal /
              totalAssessed,
            )
            : 0,
        approvalRate,
        rejectionRate,
      };
    }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* DECISION BREAKDOWN                                                       */
  /* ------------------------------------------------------------------------ */

  const decisionBreakdown =
    useMemo(() => {
      const total =
        metrics.approved +
        metrics.rejected;

      return {
        total,
        approved:
          metrics.approved,
        rejected:
          metrics.rejected,
        notDecided: Math.max(
          metrics.totalAssessed -
          total,
          0,
        ),
        approvedRate:
          total > 0
            ? Math.round(
              (metrics.approved /
                total) *
              100,
            )
            : 0,
        rejectedRate:
          total > 0
            ? Math.round(
              (metrics.rejected /
                total) *
              100,
            )
            : 0,
      };
    }, [metrics]);

  /* ------------------------------------------------------------------------ */
  /* RISK DISTRIBUTION                                                        */
  /* ------------------------------------------------------------------------ */

  const riskDistribution =
    useMemo(() => {
      const counts: Record<
        RiskBand,
        number
      > = {
        "Low Risk": 0,
        "Medium Risk": 0,
        "High Risk": 0,
      };

      filteredApps.forEach(
        (app) => {
          counts[
            app.riskBand
          ] += 1;
        },
      );

      return [
        {
          label: "Low Risk",
          value:
            counts["Low Risk"],
          color:
            chartColors.green,
        },
        {
          label: "Medium Risk",
          value:
            counts[
            "Medium Risk"
            ],
          color:
            chartColors.yellow,
        },
        {
          label: "High Risk",
          value:
            counts[
            "High Risk"
            ],
          color:
            chartColors.red,
        },
      ];
    }, [filteredApps]);

  const riskTotal =
    riskDistribution.reduce(
      (sum, item) =>
        sum + item.value,
      0,
    );

  /* ------------------------------------------------------------------------ */
  /* REJECTION REASONS                                                        */
  /* ------------------------------------------------------------------------ */

  const rejectionReasons =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      filteredApps.forEach(
        (app) => {
          if (
            app.status !==
            "Rejected"
          ) {
            return;
          }

          counts.set(
            app.rejectionReason,
            (counts.get(
              app.rejectionReason,
            ) ?? 0) + 1,
          );
        },
      );

      return Array.from(
        counts.entries(),
      )
        .map(
          ([
            reason,
            value,
          ]) => ({
            reason,
            value,
          }),
        )
        .sort(
          (a, b) =>
            b.value -
            a.value,
        );
    }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* CREDIT SCORE ANALYSIS                                                    */
  /* ------------------------------------------------------------------------ */

  const creditScoreBands =
    useMemo(() => {
      const bands = [
        {
          label: "750+",
          min: 750,
          value: 0,
        },
        {
          label: "700–749",
          min: 700,
          value: 0,
        },
        {
          label: "650–699",
          min: 650,
          value: 0,
        },
        {
          label: "<650",
          min: 0,
          value: 0,
        },
      ];

      filteredApps.forEach(
        (app) => {
          if (
            app.creditScore >=
            750
          ) {
            bands[0].value += 1;
          } else if (
            app.creditScore >=
            700
          ) {
            bands[1].value += 1;
          } else if (
            app.creditScore >=
            650
          ) {
            bands[2].value += 1;
          } else {
            bands[3].value += 1;
          }
        },
      );

      return bands;
    }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* DTI ANALYSIS                                                             */
  /* ------------------------------------------------------------------------ */

  const dtiBands =
    useMemo(() => {
      const bands = [
        {
          label: "<30%",
          value: 0,
          color:
            DTI_COLORS[
            "<30%"
            ],
        },
        {
          label: "30–39%",
          value: 0,
          color:
            DTI_COLORS[
            "30–39%"
            ],
        },
        {
          label: "40–49%",
          value: 0,
          color:
            DTI_COLORS[
            "40–49%"
            ],
        },
        {
          label: "50%+",
          value: 0,
          color:
            DTI_COLORS[
            "50%+"
            ],
        },
      ];

      filteredApps.forEach(
        (app) => {
          if (app.dti < 30) {
            bands[0].value += 1;
          } else if (
            app.dti < 40
          ) {
            bands[1].value += 1;
          } else if (
            app.dti < 50
          ) {
            bands[2].value += 1;
          } else {
            bands[3].value += 1;
          }
        },
      );

      return bands;
    }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* VERIFICATION                                                             */
  /* ------------------------------------------------------------------------ */

  const documentVerification =
    useMemo(() => {
      const total =
        filteredApps.length;

      const categories: Array<{
        key: keyof VerificationCategories;
        label: string;
      }> = [
          {
            key: "identity",
            label: "Identity",
          },
          {
            key: "income",
            label: "Income",
          },
          {
            key: "banking",
            label: "Banking",
          },
          {
            key: "address",
            label: "Address",
          },
        ];

      return categories.map(
        (category) => {
          const verifiedCount =
            filteredApps.filter(
              (app) =>
                VERIFICATION_CATEGORY_DATA[
                app.id
                ]?.[
                category.key
                ] ===
                "Verified",
            ).length;

          return {
            label:
              category.label,
            value:
              total > 0
                ? Math.round(
                  (verifiedCount /
                    total) *
                  100,
                )
                : 0,
          };
        },
      );
    }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* CSV EXPORT                                                               */
  /* ------------------------------------------------------------------------ */

  const exportApplications = (
    rows: ApplicationRow[],
  ) => {
    const header = [
      "Application ID",
      "Product",
      "Branch",
      "Stage",
      "Status",
      "Source",
      "Officer",
      "Requested Amount",
      "Approved Amount",
      "Age",
      "Submitted On",
      "Credit Score",
      "DTI",
      "Risk Band",
      "Verification Status",
      "Discrepancies",
      "Rejection Reason",
      "Manual Override",
    ];

    const rowsForExport =
      rows.map((app) => [
        app.id,
        app.product,
        app.branch,
        app.stage,
        app.status,
        app.source,
        app.officer,
        app.requested,
        app.approved,
        app.age,
        app.submittedOn,
        app.creditScore,
        app.dti,
        app.riskBand,
        app.verificationStatus,
        app.discrepancyCount,
        app.rejectionReason,
        app.manualOverride
          ? "Yes"
          : "No",
      ]);

    const csv = [
      header,
      ...rowsForExport,
    ]
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(
                cell,
              ).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href = url;
    anchor.download =
      "credit-risk-verification-report.csv";

    document.body.appendChild(
      anchor,
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <ReportShell
      title="Credit & Risk Verification"

      icon={
        <IconShieldCheck
          size={18}
        />
      }
      filters={
        <Group
          gap={6}
          wrap="wrap"
          align="center"
        >
          <ReportFilter
            value={
              filters.product
            }
            onChange={(value) =>
              setFilter(
                "product",
                value,
              )
            }
            data={
              PRODUCT_OPTIONS
            }
            width={150}
            icon={
              <IconClipboardData
                size={13}
              />
            }
          />

          <ReportFilter
            value={
              filters.status
            }
            onChange={(value) =>
              setFilter(
                "status",
                value,
              )
            }
            data={
              STATUS_OPTIONS
            }
            width={135}
            icon={
              <IconFilter
                size={13}
              />
            }
          />

          <ReportFilter
            value={
              filters.source
            }
            onChange={(value) =>
              setFilter(
                "source",
                value,
              )
            }
            data={
              SOURCE_OPTIONS
            }
            width={125}
            icon={
              <IconTrendingUp
                size={13}
              />
            }
          />

          <DateInput
            size="xs"
            radius="md"
            w={135}
            value={
              filters.dateRange[0]
            }
            onChange={(value) =>
              setFilter(
                "dateRange",
                [
                  value,
                  filters.dateRange[1],
                ],
              )
            }
            valueFormat="DD-MMM-YYYY"
            placeholder="From date"
            leftSection={
              <IconCalendar
                size={13}
              />
            }
            styles={
              filterInputStyles
            }
          />

          <DateInput
            size="xs"
            radius="md"
            w={135}
            value={
              filters.dateRange[1]
            }
            onChange={(value) =>
              setFilter(
                "dateRange",
                [
                  filters.dateRange[0],
                  value,
                ],
              )
            }
            valueFormat="DD-MMM-YYYY"
            placeholder="To date"
            leftSection={
              <IconCalendar
                size={13}
              />
            }
            styles={
              filterInputStyles
            }
          />

          <Button
            size="xs"
            radius="md"
            variant={
              hasActiveFilters
                ? "light"
                : "subtle"
            }
            color={
              hasActiveFilters
                ? "blue"
                : "gray"
            }
            leftSection={
              <IconRefresh
                size={13}
              />
            }
            onClick={
              resetFilters
            }
            styles={{
              root: {
                height: 30,
              },
              label: {
                fontSize: 11,
                fontWeight: 700,
              },
            }}
          >
            Reset
          </Button>
        </Group>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* KPI ROW                                                            */}
      {/* ------------------------------------------------------------------ */}

      <SimpleGrid
        cols={{
          base: 2,
          xs: 3,
          sm: 4,
          md: 5,
        }}
        spacing={6}
        mb="md"
        style={{
          alignItems: "start",
        }}
      >
        <CompactKpi
          label="Total Assessed"
          value={String(metrics.totalAssessed)}
          tooltip="All applications matching the report filters."
          emphasis="primary"
        />

        <CompactKpi
          label="Approved"
          value={String(metrics.approved)}
          tooltip={`${metrics.approved} approved out of ${metrics.totalAssessed} assessed.`}
          tone="green"
          emphasis="primary"
        />

        <CompactKpi
          label="Rejected"
          value={String(metrics.rejected)}

          tooltip={`${metrics.rejected} rejected out of ${metrics.totalAssessed} assessed.`}
          tone="red"
          emphasis="primary"
          
        />

        <CompactKpi
          label="High Risk"
          value={String(metrics.highRisk)}
          tooltip="Applications currently classified as High Risk."
          tone="red"
          emphasis="primary"
          
        />

        <CompactKpi
          label="Manual Review"
          value={String(metrics.manualReview)}
          tooltip="Includes applications on hold or with verification discrepancies."
          tone="yellow"
          emphasis="primary"
          
        />

        <CompactKpi
          label="Discrepancies"
          value={String(metrics.discrepancies)}
          tooltip="Total discrepancy events across assessed applications."
          tone="red"
          emphasis="secondary"
          
        />

        <CompactKpi
          label="Avg Credit Score"
          value={String(metrics.avgCreditScore)}
          tooltip="Average credit score across applications matching the report filters."
          emphasis="secondary"
        />

        <CompactKpi
          label="Avg DTI"
          value={`${metrics.avgDti}%`}

          tooltip="Average DTI across applications matching the report filters."
          tone={
            metrics.avgDti >= 50
              ? "red"
              : metrics.avgDti >= 40
                ? "yellow"
                : "green"
          }
          emphasis="secondary"
        />

        <CompactKpi
          label="Manual Overrides"
          value={String(metrics.manualOverrides)}
          tooltip="Applications where an assessment decision was manually overridden."
          tone="yellow"
          emphasis="secondary"
        />
      </SimpleGrid>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION A                                                            */}
      {/* ------------------------------------------------------------------ */}

      <SimpleGrid
        cols={{
          base: 1,
          lg: 3,
        }}
        spacing="md"
        mb="md"
        style={{
          alignItems:
            "stretch",
        }}
      >
        <Box
          style={{
            height: "100%",
            display: "grid",
            gridTemplateRows:
              "minmax(0, 1fr)",
          }}
        >
          <SectionCard title="Approval vs Rejection">
            {decisionBreakdown.total >
              0 ? (
              <SimpleGrid
                cols={{
                  base: 1,
                  xs: 2,
                }}
                spacing={8}
              >
                <Box
                  style={{
                    height: 136,
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                    flexDirection:
                      "column",
                  }}
                >
                  <DonutChart
                    size={106}
                    strokeWidth={14}
                    centerValue={String(
                      decisionBreakdown.total,
                    )}
                    centerLabel="DECIDED"
                    segments={[
                      {
                        label:
                          "Approved",
                        value:
                          decisionBreakdown.approved,
                        color:
                          chartColors.green,
                      },
                      {
                        label:
                          "Rejected",
                        value:
                          decisionBreakdown.rejected,
                        color:
                          chartColors.red,
                      },
                    ]}
                  />

                  {decisionBreakdown.notDecided >
                    0 && (
                      <Text
                        size="9px"
                        fw={700}
                        c="dimmed"
                        mt={2}
                      >
                        {
                          decisionBreakdown.notDecided
                        }{" "}
                        not decided
                      </Text>
                    )}
                </Box>

                <Stack
                  gap={10}
                  justify="center"
                >
                  <Group
                    justify="space-between"
                    gap={8}
                    wrap="nowrap"
                  >
                    <Group
                      gap={7}
                      wrap="nowrap"
                    >
                      <Box
                        w={8}
                        h={8}
                        style={{
                          borderRadius:
                            "50%",
                          backgroundColor:
                            chartColors.green,
                        }}
                      />

                      <Text
                        size="xs"
                        fw={700}
                      >
                        Approved
                      </Text>
                    </Group>

                    <Text
                      size="xs"
                      fw={850}
                    >
                      {
                        decisionBreakdown.approved
                      }{" "}
                      (
                      {
                        decisionBreakdown.approvedRate
                      }
                      %)
                    </Text>
                  </Group>

                  <Group
                    justify="space-between"
                    gap={8}
                    wrap="nowrap"
                  >
                    <Group
                      gap={7}
                      wrap="nowrap"
                    >
                      <Box
                        w={8}
                        h={8}
                        style={{
                          borderRadius:
                            "50%",
                          backgroundColor:
                            chartColors.red,
                        }}
                      />

                      <Text
                        size="xs"
                        fw={700}
                      >
                        Rejected
                      </Text>
                    </Group>

                    <Text
                      size="xs"
                      fw={850}
                    >
                      {
                        decisionBreakdown.rejected
                      }{" "}
                      (
                      {
                        decisionBreakdown.rejectedRate
                      }
                      %)
                    </Text>
                  </Group>

                  <Divider
                    my={1}
                  />

                  <Group
                    justify="space-between"
                    gap={8}
                    wrap="nowrap"
                  >
                    <Text
                      size="9px"
                      fw={700}
                      c="dimmed"
                    >
                      Total assessed
                    </Text>

                    <Text
                      size="xs"
                      fw={800}
                    >
                      {
                        metrics.totalAssessed
                      }
                    </Text>
                  </Group>
                </Stack>
              </SimpleGrid>
            ) : (
              <EmptyState
                title="No decision data"
                description="Try changing the report filters."
              />
            )}
          </SectionCard>
        </Box>

        <Box
          style={{
            height: "100%",
            display: "grid",
            gridTemplateRows:
              "minmax(0, 1fr)",
          }}
        >
          <SectionCard title="Risk Distribution">
            {riskTotal > 0 ? (
              <SimpleGrid
                cols={{
                  base: 1,
                  xs: 2,
                }}
                spacing={8}
              >
                <Box
                  style={{
                    height: 136,
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                  }}
                >
                  <DonutChart
                    size={106}
                    strokeWidth={14}
                    centerValue={String(
                      riskTotal,
                    )}
                    centerLabel="ASSESSED"
                    segments={riskDistribution.map(
                      (item) => ({
                        label:
                          item.label,
                        value:
                          item.value,
                        color:
                          item.color,
                      }),
                    )}
                  />
                </Box>

                <Stack
                  gap={10}
                  justify="center"
                >
                  {riskDistribution.map(
                    (item) => {
                      const percentage =
                        riskTotal >
                          0
                          ? Math.round(
                            (item.value /
                              riskTotal) *
                            100,
                          )
                          : 0;

                      return (
                        <Group
                          key={
                            item.label
                          }
                          justify="space-between"
                          gap={8}
                          wrap="nowrap"
                        >
                          <Group
                            gap={7}
                            wrap="nowrap"
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <Box
                              w={8}
                              h={8}
                              style={{
                                borderRadius:
                                  "50%",
                                backgroundColor:
                                  item.color,
                              }}
                            />

                            <Text
                              size="xs"
                              fw={650}
                              truncate
                            >
                              {
                                item.label
                              }
                            </Text>
                          </Group>

                          <Text
                            size="xs"
                            fw={850}
                            style={{
                              flexShrink: 0,
                            }}
                          >
                            {item.value}{" "}
                            (
                            {
                              percentage
                            }
                            %)
                          </Text>
                        </Group>
                      );
                    },
                  )}
                </Stack>
              </SimpleGrid>
            ) : (
              <EmptyState
                title="No risk data"
                description="Try changing the report filters."
              />
            )}
          </SectionCard>
        </Box>

        <Box
          style={{
            height: "100%",
            display: "grid",
            gridTemplateRows:
              "minmax(0, 1fr)",
          }}
        >
          <SectionCard title="Top Rejection Reasons">
            <Box
              style={{
                height: 136,
                display:
                  "flex",
                alignItems:
                  "center",
              }}
            >
              {rejectionReasons.length >
                0 ? (
                <Box
                  style={{
                    width: "100%",
                  }}
                >
                  <RejectionReasonChart
                    items={
                      rejectionReasons
                    }
                    totalRejected={
                      metrics.rejected
                    }
                  />
                </Box>
              ) : (
                <Box
                  style={{
                    width: "100%",
                  }}
                >
                  <EmptyState
                    title="No rejection data"
                    description="There are no rejected applications in the current filter."
                  />
                </Box>
              )}
            </Box>
          </SectionCard>
        </Box>
      </SimpleGrid>


      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: CREDIT SCORE + DTI + VERIFICATION STATUS                */}
      {/* ------------------------------------------------------------------ */}

      <SimpleGrid
        cols={{
          base: 1,
          lg: 3,
        }}
        spacing="md"
        mb="md"
        style={{
          alignItems: "stretch",
          gridAutoRows: "1fr",
        }}
      >
        {/* CREDIT SCORE DISTRIBUTION */}
        <SectionCard title="Credit Score Distribution">
          <Box
            style={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CreditScoreDistributionChart
              items={creditScoreBands}
            />
          </Box>
        </SectionCard>

        {/* DTI DISTRIBUTION */}
        <SectionCard title="DTI Distribution">
          <Box
            style={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <DtiDistributionTable
              items={dtiBands}
              total={filteredApps.length}
            />
          </Box>
        </SectionCard>

        {/* VERIFICATION STATUS */}
        <SectionCard title="Verification Status">
          <Box
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Stack gap={0}>
              {documentVerification.map((item, index) => {
                const colors = [
                  chartColors.blue,
                  chartColors.green,
                  chartColors.sky,
                  chartColors.red,
                ];

                return (
                  <Box
                    key={item.label ?? item.name ?? index}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "82px minmax(100px, 1fr) 42px",
                      alignItems: "center",
                      gap: 12,
                      minHeight: 52,
                      borderBottom:
                        index !== documentVerification.length - 1
                          ? "1px solid var(--mantine-color-gray-2)"
                          : undefined,
                    }}
                  >
                    {/* CATEGORY */}
                    <Text
                      size="sm"
                      fw={600}
                      c="slate.8"
                      style={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label ?? item.name}
                    </Text>

                    {/* PROGRESS */}
                    <Progress
                      value={
                        item.value ??
                        item.completionRate ??
                        0
                      }
                      size={7}
                      radius="xl"
                      color={
                        colors[index] ??
                        chartColors.blue
                      }
                      styles={{
                        root: {
                          backgroundColor:
                            "var(--mantine-color-gray-2)",
                        },
                      }}
                    />

                    {/* PERCENTAGE */}
                    <Text
                      size="sm"
                      fw={700}
                      c="slate.8"
                      ta="right"
                      style={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.value ??
                        item.completionRate ??
                        0}
                      %
                    </Text>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </SectionCard>
      </SimpleGrid>


      {/* ------------------------------------------------------------------ */}
      {/* ASSESSED APPLICATIONS                                               */}
      {/* ------------------------------------------------------------------ */}

      <SectionCard>
        <Box
          style={{
            minWidth: 0,
          }}
        >
          <Group
            justify="space-between"
            align="center"
            mb="sm"
            gap="sm"
            wrap="wrap"
          >
            <Box>
              <Group
                gap={7}
                align="center"
              >
                <Text
                  fw={800}
                  fz="sm"
                >
                  Assessed Applications
                </Text>

              </Group>


            </Box>

            <Group
              gap={5}
              align="center"
              wrap="wrap"
            >
              <Tooltip
                label="These filters affect only the Assessed Applications table below."
                withArrow
                openDelay={350}
              >
                <Text
                  size="9px"
                  fw={800}
                  c="dimmed"
                >
                  Table filters
                </Text>
              </Tooltip>

              <Select
                size="xs"
                radius="md"
                w={135}
                value={
                  tableBranch
                }
                onChange={(
                  value,
                ) =>
                  setTableBranch(
                    value ??
                    "All Branches",
                  )
                }
                data={
                  BRANCH_OPTIONS
                }
                leftSection={
                  <IconBuilding
                    size={13}
                  />
                }
                checkIconPosition="right"
                styles={
                  filterInputStyles
                }
              />

              <Select
                size="xs"
                radius="md"
                w={145}
                value={
                  tableOfficer
                }
                onChange={(
                  value,
                ) =>
                  setTableOfficer(
                    value ??
                    "All Officers",
                  )
                }
                data={
                  OFFICER_OPTIONS
                }
                leftSection={
                  <IconUser
                    size={13}
                  />
                }
                checkIconPosition="right"
                styles={
                  filterInputStyles
                }
              />

              <Button
                size="xs"
                radius="md"
                variant="light"
                leftSection={
                  <IconDownload
                    size={13}
                  />
                }
                onClick={() =>
                  exportApplications(
                    tableApps,
                  )
                }
                disabled={
                  tableApps.length ===
                  0
                }
                styles={{
                  root: {
                    height: 30,
                  },
                  label: {
                    fontSize: 11,
                    fontWeight: 700,
                  },
                }}
              >
                CSV
              </Button>
            </Group>
          </Group>

          <Divider mb="sm" />

          {tableApps.length >
            0 ? (
            <Box
              style={{
                width: "100%",
                overflow: "hidden",
              }}
            >
              <Table
                highlightOnHover={false}
                withTableBorder
                withColumnBorders={false}
                verticalSpacing={7}
                fz={10}
                style={{
                  width: "100%",
                  minWidth: 0,
                  tableLayout: "fixed",
                  backgroundColor: "white",
                }}
                styles={{
                  table: {
                    backgroundColor: "white",
                  },
                  tr: {
                    backgroundColor: "white",
                  },
                  td: {
                    backgroundColor: "white",
                  },
                  th: {
                    backgroundColor: "white",
                  },
                }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      Application
                    </Table.Th>

                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      Credit Score
                    </Table.Th>

                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      Risk
                    </Table.Th>

                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      DTI
                    </Table.Th>

                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      Verification
                    </Table.Th>

                    <Table.Th
                      style={
                        tableHeaderStyles
                      }
                    >
                      Status
                    </Table.Th>

                    <Table.Th
                      visibleFrom="md"
                      style={
                        tableHeaderStyles
                      }
                    >
                      Override
                    </Table.Th>

                    <Table.Th
                      visibleFrom="md"
                      style={
                        tableHeaderStyles
                      }
                    >
                      Submitted
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {tableApps
                    .slice(0, 5)
                    .map(
                      (app) => (
                        <Table.Tr
                          key={
                            app.id
                          }
                        >
                          <Table.Td>
                            <Box>
                              <Text
                                fw={800}
                                size="10px"
                                c="blue"
                              >
                                {
                                  app.id
                                }
                              </Text>

                              <Text
                                size="9px"
                                c="dimmed"
                                mt={1}
                              >
                                {
                                  app.product
                                }
                              </Text>
                            </Box>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="11px"
                              fw={800}
                            >
                              {
                                app.creditScore
                              }
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              fw={700}
                              c="slate.8"
                            >
                              {app.riskBand}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="11px"
                              fw={700}
                              c={
                                app.dti >=
                                  50
                                  ? "red"
                                  : app.dti >=
                                    40
                                    ? "yellow"
                                    : "green"
                              }
                            >
                              {
                                app.dti
                              }
                              %
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              fw={700}
                              c="slate.8"
                            >
                              {app.verificationStatus}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              fw={700}
                              c="slate.8"
                            >
                              {app.status}
                            </Text>
                          </Table.Td>

                          <Table.Td
                            visibleFrom="md"
                          >
                            {app.manualOverride ? (
                              <Badge
                                size="sm"
                                variant="light"
                                color="yellow"
                              >
                                Yes
                              </Badge>
                            ) : (
                              <Text
                                size="10px"
                                c="dimmed"
                              >
                                —
                              </Text>
                            )}
                          </Table.Td>

                          <Table.Td
                            visibleFrom="md"
                          >
                            <Text
                              size="10px"
                              c="dimmed"
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatDate(
                                app.submittedOn,
                              )}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ),
                    )}
                </Table.Tbody>
              </Table>
            </Box>
          ) : (
            <EmptyState
              title="No applications found"
              description="Try changing the Branch, Officer, or report filters."
            />
          )}
        </Box>
      </SectionCard>
    </ReportShell >
  );
}