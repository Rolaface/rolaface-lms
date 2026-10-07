import type { ReactNode } from "react";
import { Badge, Box, Group, Paper, SimpleGrid, Text } from "@mantine/core";
import {
  getInvestmentProductById,
  type InvestmentProductListItem,
} from "../../../api/Investor/productApi";
import { getInvestorFlowById } from "../../../api/Investor/investorFlowApi";
import { getCustomerById } from "../../../api/Customer/customerApi";
import {
  REPAYMENT_FREQUENCIES,
  type InvestorFlowContractStatus,
  type InvestorFlowPayload,
  type InvestorFlowPayment,
  type InvestorFlowRecord,
  type InvestorFlowStatus,
  type InvestorFlowSchedule,
  type InvestorFlowTerms,
  type RepaymentFrequency,
} from "../../../types/Investor/investorFlow";

/* ------------------------------ Types ------------------------------ */
/** The Investor Flow frequencies, plus "At maturity" used by the Earnings / Maturity mock data. */
export type Frequency = RepaymentFrequency | "At maturity";
/** Contract Status of the Custom Investor Flow doctype. */
export type ContractStatus = InvestorFlowContractStatus;
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
  /** Mock data (Earnings & Maturity): index into CUSTOMERS / PRODUCTS. */
  customerIndex: number;
  productIndex: number;
  /** Investor Flow API: chosen Customer and Custom Investment Product. */
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  productId: string | null;
  productName: string;
  productTenureMonths: number;
  productMinAmount: number;
  amount: number;
  rate: number;
  frequency: Frequency;
  firstRepayment: string;
  maturity: string;
  penaltyApplicable: boolean;
  penaltyRate: number;
  contractStatus: ContractStatus;
  /** Investor Flow Status (Draft / Approved / Received / Cancelled). */
  flowStatus: InvestorFlowStatus;
  /** Contract email fields (To = the customer's email). */
  mailTo: string;
  mailSubject: string;
  mailMessage: string;
  /** True once the contract email was sent in this modal; it is saved on submit. */
  contractMailSent: boolean;
  /** File ID of the contract PDF that was emailed. */
  contractFileId: string | null;
  /** Saved payment details (shown once Contract Status is Paid and Status is Received). */
  payment: InvestorFlowPayment | null;
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
  /** Error from the schedule API for the current terms. */
  scheduleError?: string;
}

/* ----------------------------- Constants ----------------------------- */
/** Months between payouts for the mock schedule (calcSchedule). */
export const FREQUENCY_MONTHS: Partial<Record<Frequency, number>> = {
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
    customerId: null,
    customerName: "",
    customerEmail: "",
    productId: null,
    productName: "",
    productTenureMonths: 0,
    productMinAmount: 0,
    amount: 0,
    rate: 0,
    frequency: "Monthly",
    firstRepayment: "",
    maturity: "",
    penaltyApplicable: false,
    penaltyRate: 2,
    contractStatus: "Pending",
    flowStatus: "Draft",
    mailTo: "",
    mailSubject: "",
    mailMessage: "",
    contractMailSent: false,
    contractFileId: null,
    payment: null,
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
  const product = stateProduct(s);
  if (!stateCustomer(s) || !product) return "";
  if (!(s.amount >= product.minAmount))
    return "Minimum investment for " + product.name + " is " + inr(product.minAmount) + ".";
  if (!Number.isInteger(s.amount))
    return "Investment amount must be a whole number.";
  if (!isRepaymentFrequency(s.frequency)) return "Select the repayment frequency.";
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

/* ------------------------- Investor Flow API ------------------------- */
export function isRepaymentFrequency(value: string): value is RepaymentFrequency {
  return (REPAYMENT_FREQUENCIES as readonly string[]).includes(value);
}

/** Same gaps between payouts as the backend schedule (SCHEDULE_FREQUENCY_STEP). */
export function nextPayoutDate(from: Date, frequency: RepaymentFrequency): Date {
  const x = new Date(from);
  switch (frequency) {
    case "Weekly":
      x.setDate(x.getDate() + 7);
      return x;
    case "Bi-Weekly":
      x.setDate(x.getDate() + 14);
      return x;
    case "Monthly":
      return addMonths(x, 1);
    case "Quarterly":
      return addMonths(x, 3);
    case "Yearly":
      return addMonths(x, 12);
  }
}

/** The customer chosen in the modal: the API customer, else the mock one. */
export function stateCustomer(s: ModalState): CustomerOption | null {
  if (s.customerId) {
    return { id: s.customerId, name: s.customerName || s.customerId, email: s.customerEmail, bank: "" };
  }
  return CUSTOMERS[s.customerIndex] ?? null;
}

/** The product chosen in the modal: the API product, else the mock one. */
export function stateProduct(s: ModalState): ProductOption | null {
  if (s.productId) {
    return {
      name: s.productName || s.productId,
      rate: s.rate,
      tenureMonths: s.productTenureMonths,
      frequency: s.frequency,
      minAmount: s.productMinAmount,
    };
  }
  return PRODUCTS[s.productIndex] ?? null;
}

/** Product details only (used when an existing Investor Flow is loaded). */
export function apiProductFields(p: InvestmentProductListItem): Partial<ModalState> {
  return {
    productId: p.name,
    productName: p.product_name,
    productTenureMonths: Number(p.tenure) || 0,
    productMinAmount: Number(p.minimum_investment) || 0,
  };
}

/** Product details plus the terms copied from it (when a product is picked). */
export function apiProductPatch(p: InvestmentProductListItem | null): Partial<ModalState> {
  if (!p) {
    return { productId: null, productName: "", productTenureMonths: 0, productMinAmount: 0 };
  }
  const today = new Date();
  const tenure = Number(p.tenure) || 0;
  const patch: Partial<ModalState> = {
    ...apiProductFields(p),
    amount: Number(p.minimum_investment) || 0,
    rate: Number(p.interest_rate) || 0,
    maturity: toIso(addMonths(today, tenure)),
  };
  if (isRepaymentFrequency(p.payout_frequency)) {
    patch.frequency = p.payout_frequency;
    patch.firstRepayment = toIso(nextPayoutDate(today, p.payout_frequency));
  }
  return patch;
}

export function termsFromState(s: ModalState): InvestorFlowTerms {
  return {
    investment_amount: s.amount,
    repayment_frequency: s.frequency as RepaymentFrequency, // checked by validateTerms
    maturity_date: s.maturity,
    interest_rate: s.rate,
    first_repayment_date: s.firstRepayment,
    ...(s.penaltyApplicable ? { penalty_rate: s.penaltyRate } : {}),
  };
}

export function payloadFromState(s: ModalState): InvestorFlowPayload {
  return {
    investor: s.customerId ?? "",
    investment_product: s.productId ?? "",
    ...termsFromState(s),
  };
}

/** Modal state for an existing Investor Flow. */
export function stateFromRecord(r: InvestorFlowRecord): ModalState {
  const penalty = Number(r.penalty_rate) || 0;
  return {
    ...createInitialState(),
    customerId: r.investor,
    productId: r.investment_product,
    amount: Number(r.investment_amount) || 0,
    rate: Number(r.interest_rate) || 0,
    frequency: r.repayment_frequency,
    firstRepayment: r.first_repayment_date,
    maturity: r.maturity_date,
    penaltyApplicable: penalty > 0,
    penaltyRate: penalty > 0 ? penalty : createInitialState().penaltyRate,
    contractNo: r.name,
    contractStatus: r.contract_status || "Pending",
    flowStatus: r.status,
    mailTo: r.mail_sent || "",
    mailSubject: r.subject || "",
    payment:
      r.contract_status === "Paid"
        ? {
            payment_date: String(r.payment_date ?? ""),
            ref_no: String(r.ref_no ?? ""),
            payment_mode: r.payment_mode as InvestorFlowPayment["payment_mode"],
            amount_paid: Number(r.amount_paid) || 0,
            paid_from: String(r.paid_from ?? ""),
            paid_to: String(r.paid_to ?? ""),
            paid_gl: String(r.paid_gl ?? ""),
            to_gl: String(r.to_gl ?? ""),
          }
        : null,
  };
}

/** Loads an Investor Flow with the customer and product names for the modal. */
export async function loadInvestorFlowState(id: string): Promise<ModalState> {
  const record = await getInvestorFlowById(id);
  const state = stateFromRecord(record);

  const [customer, product] = await Promise.allSettled([
    getCustomerById(record.investor),
    getInvestmentProductById(record.investment_product),
  ]);

  if (customer.status === "fulfilled" && customer.value) {
    state.customerName = customer.value.customer_name || record.investor;
    state.customerEmail = customer.value.email_id || "";
    if (!state.mailTo) state.mailTo = state.customerEmail;
  }
  const productItem = product.status === "fulfilled" ? product.value?.message?.data : null;
  if (productItem) Object.assign(state, apiProductFields(productItem));

  return state;
}

export function scheduleFromApi(res: InvestorFlowSchedule): Schedule {
  return {
    totalMonths: res.total_months,
    totalInterest: res.total_interest,
    perPayment: res.per_payment,
    count: res.count,
    rows: res.schedule.map((r) => ({
      date: new Date(r.date),
      principal: r.principal,
      interest: r.interest,
    })),
  };
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
  cols = 1,
}: {
  rows: { label: string; value: ReactNode }[];
  /** 2 = two label / value pairs per row. */
  cols?: 1 | 2;
}) {
  if (cols === 2) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
        {rows.map((r) => (
          <Paper
            key={r.label}
            radius="md"
            px="md"
            py="xs"
            style={{
              background: "var(--mantine-color-white)",
              border: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <Text fz="xs" c="slate.5">
              {r.label}
            </Text>
            <Text fz="sm" fw={700} c="slate.8">
              {r.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    );
  }
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