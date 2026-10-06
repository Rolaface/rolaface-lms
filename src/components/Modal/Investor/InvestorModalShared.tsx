import type { ReactNode } from "react";
import { Badge, Box, Group, Paper, Text } from "@mantine/core";

/* ------------------------------ Types ------------------------------ */
export type Frequency = "Monthly" | "Quarterly" | "At maturity";
export type ContractStatus =
  | "Not generated"
  | "Generated"
  | "Signing in progress"
  | "Executed";
export type SignMethod = "E-signature" | "Physical signature";
export type PaymentMode = "NEFT" | "RTGS" | "IMPS";
export type Decision = "redeem" | "renew" | null;

export interface CustomerOption {
  name: string;
  id: string;
  bank: string;
  email: string;
}

export interface ProductOption {
  name: string;
  rate: number;
  tenureMonths: number;
  frequency: Frequency;
  minAmount: number;
}

export interface ScheduleRow {
  date: Date;
  principal: number;
  interest: number;
}

export interface Schedule {
  totalMonths: number;
  totalInterest: number;
  perPayment: number;
  count: number;
  rows: ScheduleRow[];
}

export interface ModalState {
  step: number;
  customerIndex: number;
  productIndex: number;
  amount: number;
  rate: number;
  frequency: Frequency;
  firstRepayment: string;
  maturity: string;
  penaltyApplicable: boolean;
  penaltyRate: number;
  contractStatus: ContractStatus;
  contractNo: string;
  signMethod: SignMethod;
  paymentMode: PaymentMode;
  utr: string;
  funded: boolean;
  startDate: Date | null;
  monthsElapsed: number;
  sentStatements: Record<number, boolean>;
  viewMonth: number;
  decision: Decision;
  completed: boolean;
  investmentNo: string;
}

/** Payload sent to the parent once the investor's funds are confirmed. */
export interface FundedInvestment {
  investmentNo: string;
  customer: string;
  product: string;
  amount: number;
  rate: number;
  startDate: string; // ISO yyyy-mm-dd
  status: "Active";
}

/** Props every tab receives from InvestorModal. */
export interface TabProps {
  state: ModalState;
  update: (patch: Partial<ModalState>) => void;
  schedule: Schedule | null;
  onToast: (message: string) => void;
}

/* ----------------------------- Constants ----------------------------- */
export const FREQUENCY_MONTHS: Record<Frequency, number> = {
  Monthly: 1,
  Quarterly: 3,
  "At maturity": 0,
};

export const CUSTOMERS: CustomerOption[] = [
  { name: "Arjun Mehta", id: "CUS-0001", bank: "HDFC ****4471", email: "arjun.mehta@example.com" },
  { name: "Kavita Ramachandran", id: "CUS-0002", bank: "Kotak ****1129", email: "kavita.r@example.com" },
  { name: "John Doe", id: "CUS-0003", bank: "SBI ****2204", email: "john.doe@example.com" },
  { name: "Abhishek", id: "CUS-0004", bank: "ICICI ****8830", email: "abhishek@example.com" },
];

export const PRODUCTS: ProductOption[] = [
  { name: "Steady Income NCD", rate: 10.5, tenureMonths: 12, frequency: "Monthly", minAmount: 50000 },
  { name: "Quarterly Yield NCD", rate: 11.75, tenureMonths: 24, frequency: "Quarterly", minAmount: 100000 },
  { name: "Growth NCD", rate: 12.5, tenureMonths: 36, frequency: "At maturity", minAmount: 100000 },
];

export const STEP_NAMES = [
  "Investor & Product",
  "Terms & Schedule",
  "Contract Generation",
  "Funding & Allotment",
  "Earnings & Statements",
  "Maturity",
];

export const MS_PER_MONTH = 2629800000;

/* ------------------------------ Helpers ------------------------------ */
export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const fmtMonthYear = (d: Date) =>
  d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

export const toIso = (d: Date | string) => {
  const x = new Date(d);
  return (
    x.getFullYear() +
    "-" +
    String(x.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(x.getDate()).padStart(2, "0")
  );
};

export const addMonths = (d: Date | string, m: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
};

export const buildNumber = (prefix: string, existingCount: number) =>
  `${prefix}-${new Date().getFullYear()}-${String(existingCount + 1).padStart(4, "0")}`;

export function createInitialState(): ModalState {
  return {
    step: 0,
    customerIndex: -1,
    productIndex: -1,
    amount: 0,
    rate: 0,
    frequency: "Monthly",
    firstRepayment: "",
    maturity: "",
    penaltyApplicable: false,
    penaltyRate: 2,
    contractStatus: "Not generated",
    contractNo: "",
    signMethod: "E-signature",
    paymentMode: "NEFT",
    utr: "",
    funded: false,
    startDate: null,
    monthsElapsed: 0,
    sentStatements: {},
    viewMonth: 0,
    decision: null,
    completed: false,
    investmentNo: "",
  };
}

/** Values copied from the chosen product into the terms (index -1 = none). */
export function productPatch(index: number): Partial<ModalState> {
  if (index < 0) return { productIndex: index };
  const p = PRODUCTS[index];
  const today = new Date();
  return {
    productIndex: index,
    amount: p.minAmount,
    rate: p.rate,
    frequency: p.frequency,
    maturity: toIso(addMonths(today, p.tenureMonths)),
    firstRepayment: toIso(
      addMonths(today, FREQUENCY_MONTHS[p.frequency] || p.tenureMonths),
    ),
  };
}

export function calcSchedule(s: ModalState): Schedule | null {
  const k = FREQUENCY_MONTHS[s.frequency];
  const first = new Date(s.firstRepayment);
  const mat = new Date(s.maturity);
  const now = new Date();

  if (
    !(
      s.amount > 0 &&
      s.rate > 0 &&
      s.firstRepayment &&
      s.maturity &&
      first.getTime() > now.getTime() &&
      mat.getTime() > first.getTime()
    )
  ) {
    return null;
  }

  const totalMonths = Math.max(
    1,
    Math.round((mat.getTime() - now.getTime()) / MS_PER_MONTH),
  );
  const totalInterest = (s.amount * s.rate) / 1200 * totalMonths;

  const dates: Date[] = [];
  if (!k) {
    dates.push(mat);
  } else {
    let i = 0;
    let cur = first;
    while (cur.getTime() < mat.getTime() && i < 600) {
      dates.push(cur);
      i++;
      cur = addMonths(first, i * k);
    }
    dates.push(mat);
  }

  const perPayment = totalInterest / dates.length;
  return {
    totalMonths,
    totalInterest,
    perPayment,
    count: dates.length,
    rows: dates.map((date, i) => ({
      date,
      principal: i === dates.length - 1 ? s.amount : 0,
      interest: perPayment,
    })),
  };
}

export function validateTerms(s: ModalState): string {
  if (s.customerIndex < 0 || s.productIndex < 0) return "";
  const p = PRODUCTS[s.productIndex];
  if (!(s.amount >= p.minAmount))
    return "Minimum investment for " + p.name + " is " + inr(p.minAmount) + ".";
  if (!(s.rate > 0 && s.rate <= 24))
    return "Interest rate must be between 0 and 24%.";
  if (!s.firstRepayment) return "Enter the first repayment date.";
  if (!s.maturity) return "Enter the maturity date.";
  if (new Date(s.firstRepayment).getTime() <= Date.now())
    return "Repayment date must be in the future.";
  if (new Date(s.maturity).getTime() <= new Date(s.firstRepayment).getTime())
    return "Maturity date must be after the first repayment date.";
  if (s.penaltyApplicable && !(s.penaltyRate > 0))
    return "Enter the penalty rate.";
  return "";
}

/* ---------------------------- UI helpers ----------------------------- */
export const TH_STYLE = {
  fontSize: "var(--mantine-font-size-xs)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  fontWeight: 700,
  color: "var(--mantine-color-slate-5)",
};

export function Tag({
  label,
  color = "brand",
}: {
  label: ReactNode;
  color?: string;
}) {
  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
    >
      {label}
    </Badge>
  );
}

export function SectionBox({
  title,
  titleAddon,
  actions,
  children,
}: {
  title?: ReactNode;
  titleAddon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Paper
      radius="md"
      p="md"
      mb="md"
      style={{ border: "1px solid var(--mantine-color-slate-2)" }}
    >
      {(title || actions) && (
        <Group justify="space-between" align="center" wrap="wrap" gap="xs" mb={children ? "sm" : 0}>
          <Group gap="xs" align="center">
            {title && (
              <Text fw={700} fz="sm" c="slate.8">
                {title}
              </Text>
            )}
            {titleAddon}
          </Group>
          {actions && (
            <Group gap="xs" align="center" wrap="wrap">
              {actions}
            </Group>
          )}
        </Group>
      )}
      {children}
    </Paper>
  );
}

export function KeyValueList({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <Box>
      {rows.map((r, i) => (
        <Group
          key={r.label}
          justify="space-between"
          wrap="nowrap"
          py={7}
          style={{
            borderBottom:
              i === rows.length - 1
                ? "none"
                : "1px solid var(--mantine-color-slate-2)",
          }}
        >
          <Text fz="sm" c="slate.5">
            {r.label}
          </Text>
          <Text fz="sm" fw={700} c="slate.8" ta="right">
            {r.value}
          </Text>
        </Group>
      ))}
    </Box>
  );
}

export type KpiColor = "info" | "warning" | "brand" | "success";

export function KpiGrid({
  items,
}: {
  items: { label: string; value: string; color: KpiColor }[];
}) {
  return (
    <Box
      mb="md"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}
    >
      {items.map((it) => (
        <Box
          key={it.label}
          px={12}
          py={10}
          style={{
            borderRadius: "var(--mantine-radius-md)",
            background: `var(--mantine-color-${it.color}-light)`,
            border: `1px solid var(--mantine-color-${it.color}-3)`,
          }}
        >
          <Text fz={11} fw={600} c={`${it.color}.7`}>
            {it.label}
          </Text>
          <Text fz={18} fw={700} c={`${it.color}.7`}>
            {it.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

export function DocumentPaper({ children }: { children: ReactNode }) {
  return (
    <Paper
      radius="md"
      p="lg"
      style={{
        background: "var(--mantine-color-slate-0)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      {children}
    </Paper>
  );
}