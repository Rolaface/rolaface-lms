import { Fragment, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import {
  Box, Text, Button, TextInput, Select, Paper, Table, Checkbox,
  Modal, ActionIcon, Tooltip, Alert,
} from "@mantine/core";
import {
  IconX, IconBriefcase, IconBuildingBank, IconChevronDown, IconTrash,
  IconArrowRight, IconArrowLeft, IconCheck, IconPercentage, IconArrowsExchange,
  IconReceipt2, IconClipboardCheck, IconFileText, IconStack2, IconCalendar,
  IconRefresh, IconClipboardList, IconPencil, IconWallet, IconPlus, IconAlertCircle,
} from "@tabler/icons-react";
import {
  createLoanProduct,
  updateLoanProduct,
  getLoanProductById,
  getAccounts,
  getLoanDemandOffsetOrders,
  type CreateLoanProductPayload,
} from "../../api/LoanProduct/LoanProductAPi";
import { parseFrappeError } from "../../utils/parseFrappeError";
interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  loanProductId?: string | null;
  isViewMode?: boolean;
}

const STEPS = [
  { label: "Product Details", desc: "Basic information", icon: IconBriefcase },
  { label: "Accounting", desc: "Account Mapping", icon: IconBuildingBank },
  { label: "Collection Sequence", desc: "Repayment Order", icon: IconArrowsExchange },
  { label: "Fees & Charges", desc: "Configure applicable loan fees", icon: IconReceipt2 },
];

const theme = {
  brand: { 0: "var(--mantine-color-brand-0)", 1: "var(--mantine-color-brand-1)", 5: "var(--mantine-color-brand-5)", 6: "var(--mantine-color-brand-6)", 7: "var(--mantine-color-brand-7)" },
  accent: { 0: "var(--mantine-color-accent-0)", 1: "var(--mantine-color-accent-1)", 5: "var(--mantine-color-accent-5)", 6: "var(--mantine-color-accent-6)" },
  gold: { 0: "var(--mantine-color-gold-0)", 1: "var(--mantine-color-gold-1)", 5: "var(--mantine-color-gold-5)", 6: "var(--mantine-color-gold-6)" },
  danger: { 0: "var(--mantine-color-danger-0)", 1: "var(--mantine-color-danger-1)", 5: "var(--mantine-color-danger-5)", 6: "var(--mantine-color-danger-6)" },
  indigoAlt: { 0: "var(--mantine-color-indigoAlt-0)", 1: "var(--mantine-color-indigoAlt-1)", 5: "var(--mantine-color-indigoAlt-5)", 6: "var(--mantine-color-indigoAlt-6)" },
};
type ChipColor = keyof typeof theme;

const labelProps = {
  label: "text-[13px] font-semibold text-slate-700 mb-1",
  description: "mt-0 text-[10px] text-slate-400 leading-tight",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[42px] h-[42px] text-sm border-slate-200 rounded-xl overflow-hidden transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] !pl-[58px]",
};
const fieldLabelProps = {
  label: "text-[13px] font-medium text-slate-600 mb-1",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[32px] h-[32px] text-sm rounded-lg border-slate-200 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};
const labelPropsPlain = {
  label: "text-[13px] font-semibold text-slate-700 mb-1",
  description: "mt-0 text-[10px] text-slate-400 leading-tight",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[40px] h-[40px] text-sm border-slate-200 rounded-xl transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] px-4",
};

const IconChip = ({ icon: Icon, color = "brand" }: { icon: React.ComponentType<{ size?: number }>; color?: ChipColor }) => {
  const c = theme[color];
  return (
    <div className="w-full h-full flex items-center justify-center shrink-0 border-r" style={{ backgroundColor: c[0], color: (c as any)[5], borderColor: c[1] }}>
      <Icon size={18} />
    </div>
  );
};

const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: theme.brand[5] }} />
        <Text size="sm" fw={700} className="text-slate-900 tracking-tight">{title}</Text>
      </div>
      {description && <Text size="xs" className="text-slate-400 mb-2 pl-3">{description}</Text>}
      {!description && <div className="mb-1.5" />}
      {children}
    </div>
  </Paper>
);

const PlainCard = ({ description, children }: { description?: string; children: React.ReactNode }) => (
  <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
    <div className="p-4">
      {description && <Text size="sm" className="text-slate-500 mb-3">{description}</Text>}
      {children}
    </div>
  </Paper>
);

const SubSection = ({ title, icon: Icon, trailing, last = false, children }: { title: string; icon: any; trailing?: React.ReactNode; last?: boolean; children: React.ReactNode }) => (
  <div className={`py-3.5 first:pt-0 ${!last ? "border-b border-slate-100" : ""}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: theme.brand[6] }} />
        <Text size="sm" fw={700} className="text-slate-900">{title}</Text>
      </div>
      {trailing}
    </div>
    {children}
  </div>
);

const SubHeading = ({ children, color = "brand" }: { children: React.ReactNode; color?: "brand" | "danger" }) => {
  const c = theme[color];
  return (
    <Text size="xs" fw={700} className="uppercase tracking-wide mb-0" style={{ color: (c as any)[6] ?? c[5] }}>
      {children}
    </Text>
  );
};

const demandTypeSequence = ["Charges", "Penalty", "Additional Interest", "Interest", "Principal"];

const DemandTypeTable = () => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
      <Table.Thead className="bg-slate-50">
        <Table.Tr>
          <Table.Th className="w-6"></Table.Th>
          <Table.Th className="w-6">No.</Table.Th>
          <Table.Th>Demand Type</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {demandTypeSequence.map((demand, idx) => (
          <Table.Tr key={demand} className="hover:bg-slate-50/60">
            <Table.Td></Table.Td>
            <Table.Td className="text-xs text-slate-500 font-medium">{idx + 1}</Table.Td>
            <Table.Td className="text-xs text-slate-700 font-medium">{demand}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </div>
);

interface ChargeRow {
  id: number;
  type: string;
  basedOn: "Percentage" | "Flat Amount";
  amount: string;
  percentage: string;
  incomeAccount: string;
  receivableAccount: string;
  waiverAccount: string;
  writeOffAccount: string;
  suspenseAccount: string;
}

// Turn an AccountOption[] into the plain string[] Mantine's Select expects.
// The lookup endpoint may return either plain strings (account IDs) or
// { name, account_name, ... } objects depending on the backend — handle
// both, and drop anything falsy so Select never sees an `undefined` entry
// (that's what throws "Cannot use 'in' operator to search for 'group' in undefined").
const toAccountOptions = (accounts: unknown): string[] => {
  if (!Array.isArray(accounts)) return [];
  return accounts
    .map((a) => (typeof a === "string" ? a : a?.name ?? a?.account_name ?? a?.value))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
};

const toOffsetOrderOptions = (orders: unknown): string[] => {
  if (!Array.isArray(orders)) return [];
  return orders
    .map((o) => (typeof o === "string" ? o : o?.name ?? o?.value))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
};

export function LoanProductModal({ opened, onClose, onSaved, loanProductId, isViewMode }: LoanProductProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>("0");

  // ---------- MANTINE FORM (same pattern as LoanAccountModal) ----------
  const form = useForm({
    initialValues: {
      productCode: "",
      productName: "",
      loanCategory: null as string | null,
      repaymentScheduleType: null as string | null,
      maxLoanAmount: "" as number | "",
      npaThreshold: "" as number | "",
      interestRate: "" as number | "",
      interestFrequency: null as string | null,
      penaltyRate: "" as number | "",
      penaltyFrequency: null as string | null,
      gracePeriodDays: "" as number | "",
      collectionSeq: {
        standard: null as string | null,
        subStandard: null as string | null,
        writtenOff: null as string | null,
        settlement: null as string | null,
      },
    },
    validate: {
      productCode: (v) => (!v ? "Product Code is required" : null),
      productName: (v) => (!v ? "Product Name is required" : null),
      loanCategory: (v) => (!v ? "Loan Category is required" : null),
      repaymentScheduleType: (v) => (!v ? "Repayment Schedule Type is required" : null),
      maxLoanAmount: (v) => (!v ? "Maximum Loan Amount is required" : null),
      npaThreshold: (v) => (!v ? "This field is required" : null),
      interestRate: (v) => (!v ? "Interest Rate is required" : null),
      interestFrequency: (v) => (!v ? "Interest Frequency is required" : null),
      penaltyRate: (v) => (!v ? "Penalty Rate is required" : null),
      penaltyFrequency: (v) => (!v ? "Penalty Frequency is required" : null),
      collectionSeq: {
        standard: (v) => (!v ? "Required" : null),
        subStandard: (v) => (!v ? "Required" : null),
        writtenOff: (v) => (!v ? "Required" : null),
        settlement: (v) => (!v ? "Required" : null),
      },
    },
  });

  // Non-required / table-style data kept outside the form (same as charges/collaterals in LoanAccountModal)
  const [generalAccs, setGeneralAccs] = useState({
    loanAccount: "", disbursementAccount: "", repaymentAccount: "", writeOffAccount: "",
    writeOffRecoveryAccount: "", subsidyAccount: "", securityDepositAccount: "",
    suspenseCollectionAccount: "", customerRefundAccount: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sameAsInterest, setSameAsInterest] = useState(false);
  const [interestAccs, setInterestAccs] = useState({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
  const [penaltyAccs, setPenaltyAccs] = useState({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
  // Not part of the Interest/Penalty side-by-side table since there's no
  // penalty equivalent — the backend requires this only on the interest side.
  const [brokenPeriodRecoveryAccount, setBrokenPeriodRecoveryAccount] = useState("");

  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [accountsModalIndex, setAccountsModalIndex] = useState<number | null>(null);

  // ---------- ACCOUNT LOOKUPS (real data, replaces the old dummyAccounts) ----------
  // Income accounts -> used for every "Income Account" field (interest, penalty, charges)
  const { data: incomeAccountsData } = useQuery({
    queryKey: ["accounts", "Income"],
    queryFn: () => getAccounts({ root_type: "Income" }),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  // Asset/Liability accounts -> used for principal-side balance accounts
  // (loan, disbursement, repayment, receivable, accrued, suspense, waiver,
  // security deposit, suspense collection, customer refund, subsidy)
  const { data: principalAccountsData } = useQuery({
    queryKey: ["accounts", "Asset,Liability"],
    queryFn: () => getAccounts({ root_type: "Asset,Liability" }),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  // Unrestricted account list (no root_type filter) -> used for Write Off /
  // Write Off Recovery accounts, per the API note.
  const { data: allAccountsData } = useQuery({
    queryKey: ["accounts", "all"],
    queryFn: () => getAccounts(),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  const incomeAccounts = toAccountOptions(incomeAccountsData);
  const principalAccounts = toAccountOptions(principalAccountsData);
  const writeOffAccounts = toAccountOptions(allAccountsData);

  // ---------- COLLECTION OFFSET SEQUENCE OPTIONS ----------
  const { data: offsetOrdersData } = useQuery({
    queryKey: ["loanDemandOffsetOrders"],
    queryFn: getLoanDemandOffsetOrders,
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });
  const collectionSequenceOptions = toOffsetOrderOptions(offsetOrdersData);

  // ---------- FETCH EXISTING PRODUCT (view / edit) ----------
  const { data: existingProductData, isLoading: isFetchingProduct } = useQuery({
    queryKey: ["loanProduct", loanProductId],
    queryFn: async () => await getLoanProductById(loanProductId as string),
    enabled: !!loanProductId && opened === true,
    refetchOnMount: "always",
  });

  useEffect(() => {
    // GET response shape: { status_code, status, message, data: {...single product} }
    const product = existingProductData?.data;
    if (!product) return;

    const accounts = product.accounts || {};
    const interest = product.interest_accounts || {};
    const penalty = product.penalty_accounts || {};
    const writeOff = product.write_off_accounts || {};

    form.setValues({
      productCode: product.product_code || "",
      productName: product.product_name || "",
      loanCategory: product.loan_category || null,
      repaymentScheduleType: product.repayment_schedule_type || null,
      maxLoanAmount: product.maximum_loan_amount != null ? String(product.maximum_loan_amount) : "",
      npaThreshold: product.days_past_due_threshold_for_npa != null ? String(product.days_past_due_threshold_for_npa) : "",
      interestRate: product.rate_of_interest != null ? String(product.rate_of_interest) : "",
      interestFrequency: product.interest_frequency || null,
      penaltyRate: product.penalty_interest_rate != null ? String(product.penalty_interest_rate) : "",
      penaltyFrequency: product.penalty_frequency || null,
      gracePeriodDays: product.grace_period_in_days != null ? String(product.grace_period_in_days) : "",
      collectionSeq: {
        standard: product.collection_offset_sequence_for_standard_asset || null,
        subStandard: product.collection_offset_sequence_for_sub_standard_asset || null,
        writtenOff: product.collection_offset_sequence_for_written_off_asset || null,
        settlement: product.collection_offset_sequence_for_settlement_collection || null,
      },
    });

    setGeneralAccs({
      loanAccount: accounts.loan_account || "",
      disbursementAccount: accounts.disbursement_account || "",
      repaymentAccount: accounts.payment_account || "",
      writeOffAccount: writeOff.write_off_account || "",
      writeOffRecoveryAccount: writeOff.write_off_recovery_account || "",
      subsidyAccount: accounts.subsidy_adjustment_account || "",
      securityDepositAccount: accounts.security_deposit_account || "",
      suspenseCollectionAccount: accounts.suspense_collection_account || "",
      customerRefundAccount: accounts.customer_refund_account || "",
    });

    setInterestAccs({
      income: interest.income_account || "",
      receivable: interest.receivable_account || "",
      accrued: interest.accrued_account || "",
      suspended: interest.suspense_income_account || "",
      waiver: interest.waiver_account || "",
    });

    setPenaltyAccs({
      income: penalty.income_account || "",
      receivable: penalty.receivable_account || "",
      accrued: penalty.accrued_account || "",
      suspended: penalty.suspense_account || "",
      waiver: penalty.waiver_account || "",
    });

    setBrokenPeriodRecoveryAccount(interest.broken_period_interest_recovery_account || "");

    setSameAsInterest(penalty.same_as_regular_interest_accounts === 1);

    if (Array.isArray(product.loan_charges)) {
      setCharges(
        product.loan_charges.map((c: any) => ({
          id: Date.now() + Math.random(),
          type: c.charge_type || "",
          basedOn: c.charge_based_on === "Fixed Amount" ? "Flat Amount" : "Percentage",
          amount: c.amount ? String(c.amount) : "",
          percentage: c.percentage ? String(c.percentage) : "",
          incomeAccount: c.income_account || "",
          receivableAccount: c.receivable_account || "",
          waiverAccount: c.waiver_account || "",
          writeOffAccount: c.write_off_account || "",
          suspenseAccount: c.suspense_account || "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProductData]);

  const handleInterestChange = (field: keyof typeof interestAccs, value: string | null) => {
    const val = value || "";
    setInterestAccs((prev) => ({ ...prev, [field]: val }));
    if (sameAsInterest) setPenaltyAccs((prev) => ({ ...prev, [field]: val }));
  };

  const handlePenaltyChange = (field: keyof typeof penaltyAccs, value: string | null) => {
    setPenaltyAccs((prev) => ({ ...prev, [field]: value || "" }));
    if (sameAsInterest) setSameAsInterest(false);
  };

  const handleSameAsInterestToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    setSameAsInterest(isChecked);
    if (isChecked) setPenaltyAccs({ ...interestAccs });
  };

  const emptyCharge = (): ChargeRow => ({
    id: Date.now() + Math.random(), type: "", basedOn: "Percentage", amount: "", percentage: "",
    incomeAccount: "", receivableAccount: "", waiverAccount: "", writeOffAccount: "", suspenseAccount: "",
  });

  const handleAddCharge = () => setCharges((prev) => [...prev, emptyCharge()]);

  const handleUpdateCharge = (index: number, field: keyof ChargeRow, value: string) => {
    setCharges((prev) =>
      prev.map((charge, i) => {
        if (i !== index) return charge;
        const updated = { ...charge, [field]: value };
        if (field === "basedOn") {
          if (value === "Percentage") updated.amount = "";
          if (value === "Flat Amount") updated.percentage = "";
        }
        return updated;
      })
    );
  };

  const handleRemoveChargeAt = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
    setAccountsModalIndex(null);
  };

  const buildPayload = (values: typeof form.values): CreateLoanProductPayload => ({
    product_code: values.productCode,
    product_name: values.productName,
    loan_category: values.loanCategory || undefined,
    repayment_schedule_type: values.repaymentScheduleType || undefined,
    maximum_loan_amount: values.maxLoanAmount ? Number(values.maxLoanAmount) : undefined,
    days_past_due_threshold_for_npa: values.npaThreshold ? Number(values.npaThreshold) : undefined,
    rate_of_interest: values.interestRate ? Number(values.interestRate) : undefined,
    interest_frequency: values.interestFrequency || undefined,
    penalty_interest_rate: values.penaltyRate ? Number(values.penaltyRate) : undefined,
    penalty_frequency: values.penaltyFrequency || undefined,
    grace_period_in_days: values.gracePeriodDays ? Number(values.gracePeriodDays) : undefined,

    collection_offset_sequence_for_standard_asset: values.collectionSeq.standard || undefined,
    collection_offset_sequence_for_sub_standard_asset: values.collectionSeq.subStandard || undefined,
    collection_offset_sequence_for_written_off_asset: values.collectionSeq.writtenOff || undefined,
    collection_offset_sequence_for_settlement_collection: values.collectionSeq.settlement || undefined,

    accounts: {
      loan_account: generalAccs.loanAccount || undefined,
      disbursement_account: generalAccs.disbursementAccount || undefined,
      payment_account: generalAccs.repaymentAccount || undefined,
      subsidy_adjustment_account: generalAccs.subsidyAccount || undefined,
      security_deposit_account: generalAccs.securityDepositAccount || undefined,
      suspense_collection_account: generalAccs.suspenseCollectionAccount || undefined,
      customer_refund_account: generalAccs.customerRefundAccount || undefined,
    },

    interest_accounts: {
      income_account: interestAccs.income || undefined,
      receivable_account: interestAccs.receivable || undefined,
      accrued_account: interestAccs.accrued || undefined,
      suspense_income_account: interestAccs.suspended || undefined,
      waiver_account: interestAccs.waiver || undefined,
      broken_period_interest_recovery_account: brokenPeriodRecoveryAccount || undefined,
    },

    penalty_accounts: {
      same_as_regular_interest_accounts: sameAsInterest ? 1 : 0,
      income_account: penaltyAccs.income || undefined,
      receivable_account: penaltyAccs.receivable || undefined,
      accrued_account: penaltyAccs.accrued || undefined,
      suspense_account: penaltyAccs.suspended || undefined,
      waiver_account: penaltyAccs.waiver || undefined,
    },

    write_off_accounts: {
      write_off_account: generalAccs.writeOffAccount || undefined,
      write_off_recovery_account: generalAccs.writeOffRecoveryAccount || undefined,
    },

    loan_charges: charges.map((c) => ({
      charge_type: c.type,
      charge_based_on: c.basedOn === "Flat Amount" ? "Fixed Amount" : "Percentage",
      percentage: c.percentage ? Number(c.percentage) : 0,
      amount: c.amount ? Number(c.amount) : 0,
      income_account: c.incomeAccount || undefined,
      receivable_account: c.receivableAccount || undefined,
      waiver_account: c.waiverAccount || undefined,
      write_off_account: c.writeOffAccount || undefined,
      suspense_account: c.suspenseAccount || undefined,
    })),
  });

  // ---------- CREATE / UPDATE MUTATIONS ----------
  const createMutation = useMutation({
    mutationFn: createLoanProduct,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateLoanProductPayload> }) =>
      updateLoanProduct(id, payload),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      queryClient.invalidateQueries({ queryKey: ["loanProduct", variables.id] });
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---------- SUBMIT (mantine form validate + jump to invalid tab, like LoanAccountModal) ----------
  const handleValidSubmit = (values: typeof form.values) => {
    if (isViewMode) return;
    setSubmitError(null);

    const missingAccounts = getMissingAccountingFields();
    if (missingAccounts.length > 0) {
      setSubmitError(`Missing required accounts: ${missingAccounts.join(", ")}`);
      setActiveTab("1");
      return;
    }

    updateMutation.reset();
    createMutation.reset();
    const payload = buildPayload(values);
    if (loanProductId) {
      updateMutation.mutate({ id: loanProductId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleInvalidSubmit = (errors: typeof form.errors) => {
    const keys = Object.keys(errors);
    if (keys.some((k) => k.startsWith("collectionSeq"))) {
      setActiveTab("2");
    } else {
      setActiveTab("0");
    }
  };

  // Which fields belong to which step — used to validate before "Next"
  const stepFieldsMap: Record<string, string[]> = {
    "0": [
      "productCode", "productName", "loanCategory", "repaymentScheduleType",
      "maxLoanAmount", "npaThreshold", "interestRate", "interestFrequency",
      "penaltyRate", "penaltyFrequency",
    ],
    "2": [
      "collectionSeq.standard", "collectionSeq.subStandard",
      "collectionSeq.writtenOff", "collectionSeq.settlement",
    ],
  };

  // Accounts the backend rejects the product without, once Loan Accounting
  // is enabled for the company (see the "... are mandatory when Loan
  // Accounting is enabled" error). Kept in one place so the "Next" button
  // and the final submit enforce the exact same list.
  const getMissingAccountingFields = (): string[] => {
    const required: { label: string; value: string }[] = [
      { label: "Loan Account", value: generalAccs.loanAccount },
      { label: "Disbursement Account", value: generalAccs.disbursementAccount },
      { label: "Repayment Account", value: generalAccs.repaymentAccount },
      { label: "Security Deposit Account", value: generalAccs.securityDepositAccount },
      { label: "Customer Refund Account", value: generalAccs.customerRefundAccount },
      { label: "Interest Income Account", value: interestAccs.income },
      { label: "Interest Accrued Account", value: interestAccs.accrued },
      { label: "Interest Waiver Account", value: interestAccs.waiver },
      { label: "Interest Receivable Account", value: interestAccs.receivable },
      { label: "Broken Period Interest Recovery Account", value: brokenPeriodRecoveryAccount },
      { label: "Penalty Income Account", value: penaltyAccs.income },
      { label: "Penalty Accrued Account", value: penaltyAccs.accrued },
      { label: "Penalty Waiver Account", value: penaltyAccs.waiver },
      { label: "Penalty Receivable Account", value: penaltyAccs.receivable },
      { label: "Write Off Account", value: generalAccs.writeOffAccount },
      { label: "Write Off Recovery Account", value: generalAccs.writeOffRecoveryAccount },
    ];
    return required.filter((f) => !f.value).map((f) => f.label);
  };

  const validateCurrentStep = (): boolean => {
    if (activeTab === "1") {
      const missing = getMissingAccountingFields();
      if (missing.length > 0) {
        setSubmitError(`Missing required accounts: ${missing.join(", ")}`);
        return false;
      }
      setSubmitError(null);
      return true;
    }
    const fields = stepFieldsMap[activeTab || "0"];
    if (!fields) return true; // step 3 (Charges) has no required fields
    let hasError = false;
    fields.forEach((f) => {
      const result = form.validateField(f);
      if (result.hasError) hasError = true;
    });
    return !hasError;
  };
  const handleNext = () => {
    const current = parseInt(activeTab || "0");
    if (isViewMode) {
      if (current < 3) setActiveTab((current + 1).toString());
      return;
    }
    if (!validateCurrentStep()) return;
    if (current < 3) setActiveTab((current + 1).toString());
  };
  const handleBack = () => {
    const current = parseInt(activeTab || "0");
    if (current > 0) setActiveTab((current - 1).toString());
  };

  const handleReset = () => {
    form.reset();
    setGeneralAccs({ loanAccount: "", disbursementAccount: "", repaymentAccount: "", writeOffAccount: "", writeOffRecoveryAccount: "", subsidyAccount: "", securityDepositAccount: "", suspenseCollectionAccount: "", customerRefundAccount: "" });
    setSameAsInterest(false);
    setInterestAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setPenaltyAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setBrokenPeriodRecoveryAccount("");
    setCharges([]);
    setAccountsModalIndex(null);
    setActiveTab("0");
    setSubmitError(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleModalClose = () => {
    if (loanProductId) {
      queryClient.removeQueries({ queryKey: ["loanProduct", loanProductId] });
    }
    handleReset();
    onClose();
  };

  const frequencyOptions = ["Monthly", "Quarterly", "Yearly"];

  const currentStep = parseInt(activeTab || "0");

  const headerIcon = currentStep === 0 ? IconBriefcase : STEPS[currentStep].icon;
  const headerTitle = loanProductId
    ? isViewMode ? "View Loan Product" : "Update Loan Product"
    : "Create Loan Product";
  const renderProductDetails = () => (
    <div className="flex flex-col gap-4">
      <PlainCard>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <TextInput size="xs" label="Product Code" placeholder="Enter product code" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("productCode")} />
          <TextInput size="xs" label="Product Name" placeholder="Enter product name" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("productName")} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Loan Category" placeholder="Select category" data={["Personal Loan", "Home Loans", "Auto Loan"]} withAsterisk classNames={labelPropsPlain} {...form.getInputProps("loanCategory")} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Repayment Schedule Type" placeholder="Select schedule type" data={["Equated Monthly Installment (EMI)", "Bullet Payment"]} withAsterisk classNames={labelPropsPlain} {...form.getInputProps("repaymentScheduleType")} />
          <TextInput size="xs" label="Maximum Loan Amount" placeholder="Enter amount" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("maxLoanAmount")} />
          <TextInput size="xs" label="Days Past Due Threshold for NPA" placeholder="Enter days" withAsterisk classNames={labelPropsPlain} {...form.getInputProps("npaThreshold")} />
        </div>
      </PlainCard>

      <SectionCard title="Interest & Penalty">
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-2 rounded-xl border p-4" style={{ backgroundColor: theme.indigoAlt[0], borderColor: theme.indigoAlt[1] }}>
            <div className="mb-3"><SubHeading color="brand">Interest</SubHeading></div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              <TextInput size="xs" label="Interest Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("interestRate")} />
              <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Interest Frequency" placeholder="Select frequency" data={frequencyOptions} withAsterisk leftSection={<IconChip icon={IconRefresh} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("interestFrequency")} />
            </div>
          </div>

          <div className="col-span-3 rounded-xl border p-4" style={{ backgroundColor: theme.danger[0], borderColor: theme.danger[1] }}>
            <div className="mb-3"><SubHeading color="danger">Penalty</SubHeading></div>
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              <TextInput size="xs" label="Penalty Rate (%)" placeholder="Enter rate" withAsterisk leftSection={<IconChip icon={IconPercentage} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("penaltyRate")} />
              <Select size="xs" searchable rightSection={<IconChevronDown size={13} className="text-slate-400" />} label="Penalty Frequency" placeholder="Select frequency" data={frequencyOptions} withAsterisk leftSection={<IconChip icon={IconRefresh} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("penaltyFrequency")} />
              <TextInput size="xs" label="Grace Period (Days)" placeholder="Enter days" leftSection={<IconChip icon={IconCalendar} color="danger" />} leftSectionWidth={50} classNames={labelProps} {...form.getInputProps("gracePeriodDays")} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderAccounting = () => (
    <div>
      <SubSection title="Principal Accounts" icon={IconBuildingBank}>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Loan Account" data={principalAccounts} value={generalAccs.loanAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, loanAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Disbursement Bank Account" data={principalAccounts} value={generalAccs.disbursementAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, disbursementAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Repayment Bank Account" data={principalAccounts} value={generalAccs.repaymentAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, repaymentAccount: v || "" }))} classNames={fieldLabelProps} />
        </div>
      </SubSection>

      <SubSection
        title="Interest & Penalty Accounts"
        icon={IconStack2}
        trailing={
          <Checkbox size="xs" label="Same as Interest" checked={sameAsInterest} onChange={handleSameAsInterestToggle} classNames={{ label: "text-xs text-slate-700 font-medium cursor-pointer" }} />
        }
      >
        <div className="grid grid-cols-3 gap-4 mb-2.5 px-0">
          <Text size="xs" fw={700} className="text-slate-400 uppercase tracking-wider">Account Type</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.brand[6] }}>Interest</Text>
          <Text size="xs" fw={700} className="uppercase tracking-wider" style={{ color: theme.danger[6] }}>Penalty</Text>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { key: "income", label: "Income Account", data: incomeAccounts, required: true },
            { key: "receivable", label: "Receivable Account", data: principalAccounts, required: true },
            { key: "accrued", label: "Accrued Account", data: principalAccounts, required: true },
            { key: "suspended", label: "Suspended Account", data: principalAccounts, required: false },
            { key: "waiver", label: "Waiver Account", data: principalAccounts, required: true },
          ].map(({ key, label, data, required }) => (
            <div key={key} className="grid grid-cols-3 gap-4 items-center">
              <Text size="xs" fw={600} className="text-slate-700">
                {label}
                {required && <span className="text-danger-6"> *</span>}
              </Text>
              <Select size="xs" searchable value={interestAccs[key as keyof typeof interestAccs]} onChange={(v) => handleInterestChange(key as keyof typeof interestAccs, v)} rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" data={data} classNames={{ input: fieldLabelProps.input }} />
              <Select size="xs" searchable value={penaltyAccs[key as keyof typeof penaltyAccs]} onChange={(v) => handlePenaltyChange(key as keyof typeof penaltyAccs, v)} rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" data={data} classNames={{ input: fieldLabelProps.input }} />
            </div>
          ))}
        </div>

        <div className="mt-3.5 pt-3.5 border-t border-slate-100">
          <Select
            size="xs" searchable withAsterisk
            label="Broken Period Interest Recovery Account"
            description="Interest-side only — used when a loan is disbursed mid-cycle"
            placeholder="Select account" data={incomeAccounts}
            value={brokenPeriodRecoveryAccount}
            onChange={(v) => setBrokenPeriodRecoveryAccount(v || "")}
            rightSection={<IconChevronDown size={14} className="text-slate-400" />}
            classNames={fieldLabelProps}
            className="max-w-md"
          />
        </div>
      </SubSection>

      <SubSection title="General Accounts" icon={IconFileText} last>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Write Off Account" data={writeOffAccounts} value={generalAccs.writeOffAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, writeOffAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Write Off Recovery" data={writeOffAccounts} value={generalAccs.writeOffRecoveryAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, writeOffRecoveryAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Subsidy Account" data={principalAccounts} value={generalAccs.subsidyAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, subsidyAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Security Deposit Account" data={principalAccounts} value={generalAccs.securityDepositAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, securityDepositAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Suspense Collection" data={principalAccounts} value={generalAccs.suspenseCollectionAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, suspenseCollectionAccount: v || "" }))} classNames={fieldLabelProps} />
          <Select size="xs" searchable withAsterisk rightSection={<IconChevronDown size={14} className="text-slate-400" />} placeholder="Select account" label="Customer Refund" data={principalAccounts} value={generalAccs.customerRefundAccount} onChange={(v) => setGeneralAccs((p) => ({ ...p, customerRefundAccount: v || "" }))} classNames={fieldLabelProps} />
        </div>
      </SubSection>
    </div>
  );


  const collectionAssetColumns = [
    { key: "standard", label: "Standard Asset" },
    { key: "subStandard", label: "Sub Standard Asset" },
    { key: "writtenOff", label: "Written Off Asset" },
    { key: "settlement", label: "Settlement Collection" },
  ];

  const renderCollection = () => (
    <PlainCard description="Configure collection sequence for different asset classifications.">
      <div className="grid grid-cols-4 gap-x-5">
        {collectionAssetColumns.map((col) => (
          <div key={col.key} className="flex flex-col gap-3">
            <Select
              size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              label={col.label} placeholder="Select sequence" data={collectionSequenceOptions}
              withAsterisk leftSection={<IconChip icon={IconClipboardList} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps}
              {...form.getInputProps(`collectionSeq.${col.key}`)}
            />
            <DemandTypeTable />
          </div>
        ))}
      </div>
    </PlainCard>
  );

  const cellInputClasses = {
    input: "h-8 min-h-[32px] w-full text-xs rounded-md border border-slate-200 bg-white hover:border-slate-300 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 px-2",
  };

  const renderCharges = () => (
    <PlainCard>
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
        <Table size="xs" verticalSpacing="xs" horizontalSpacing={6} className="table-fixed w-full">
          <Table.Thead className="bg-slate-50">
            <Table.Tr>
              <Table.Th className="w-6"><Checkbox size="xs" aria-label="Select all" /></Table.Th>
              <Table.Th className="w-6">No.</Table.Th>
              <Table.Th className="w-52">Charge Type</Table.Th>
              <Table.Th className="w-36">Charge Based On</Table.Th>
              <Table.Th className="w-24">Percentage</Table.Th>
              <Table.Th className="w-24">Amount</Table.Th>
              <Table.Th className="w-14"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8 text-slate-400 bg-slate-50/50">
                  No rows yet — add a charge to get started
                </Table.Td>
              </Table.Tr>
            ) : (
              charges.map((charge, index) => (
                <Table.Tr key={charge.id} className="hover:bg-slate-50/60">
                  <Table.Td></Table.Td>
                  <Table.Td className="text-xs text-slate-500 font-medium">{index + 1}</Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Charge Type" value={charge.type} onChange={(e) => handleUpdateCharge(index, "type", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <div className="relative flex items-center bg-slate-100 rounded-full p-0.5 h-8 w-full select-none">
                      <div className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-200 ease-out shadow-sm" style={{ width: "calc(50% - 2px)", left: charge.basedOn === "Percentage" ? "2px" : "50%", backgroundColor: theme.brand[6] }} />
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(index, "basedOn", "Percentage")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Percentage" ? "text-white" : "text-slate-500"}`}>
                        <IconPercentage size={12} />Percentage
                      </button>
                      <button type="button" disabled={isViewMode} onClick={() => handleUpdateCharge(index, "basedOn", "Flat Amount")} className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1 text-[10px] font-semibold rounded-full transition-colors ${charge.basedOn === "Flat Amount" ? "text-white" : "text-slate-500"}`}>
                        Flat
                      </button>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Percentage" value={charge.percentage} disabled={charge.basedOn === "Flat Amount"} onChange={(e) => handleUpdateCharge(index, "percentage", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Amount" value={charge.amount} disabled={charge.basedOn === "Percentage"} onChange={(e) => handleUpdateCharge(index, "amount", e.currentTarget.value)} classNames={cellInputClasses} />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1">
                      <Tooltip label="Modify Map Account" position="top" withArrow>
                        <ActionIcon type="button" color="brand" variant="subtle" onClick={() => setAccountsModalIndex(index)} aria-label="Edit charge accounts">
                          <IconPencil size={15} />
                        </ActionIcon>
                      </Tooltip>
                      {!isViewMode && (
                        <Tooltip label="Delete" position="top" withArrow>
                          <ActionIcon type="button" color="danger" variant="subtle" onClick={() => handleRemoveChargeAt(index)} aria-label="Delete charge">
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
            {!isViewMode && (
              <Table.Tr className="cursor-pointer hover:bg-slate-50/60" onClick={handleAddCharge}>
                <Table.Td colSpan={7} className="py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.brand[6] }}>
                    <IconPlus size={14} />Add charge
                  </div>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </PlainCard>
  );

  const renderChargeAccountsModal = () => {
    if (accountsModalIndex === null) return null;
    const charge = charges[accountsModalIndex];
    if (!charge) return null;

    const update = (field: keyof typeof charge, value: string) => handleUpdateCharge(accountsModalIndex, field, value);

    return (
      <Modal
        opened={accountsModalIndex !== null}
        onClose={() => setAccountsModalIndex(null)}
        size="50%" withCloseButton={false} padding={0} radius="lg" centered
        overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
        styles={{
          content: { display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" },
          header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
          body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
        }}
      >
        <Box className="flex justify-between items-center px-6 py-4 shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}>
              <IconReceipt2 size={16} className="text-white" />
            </div>
            <div>
              <Text size="sm" fw={800} className="text-slate-900 leading-tight">Editing accounts for: {charge.type || "Untitled charge"}</Text>
              <Text size="xs" className="text-slate-400 mt-0.5">Row #{accountsModalIndex + 1} · {charge.basedOn === "Percentage" ? `${charge.percentage || "0"}%` : charge.amount || "0"}</Text>
            </div>
          </div>
          <ActionIcon type="button" variant="light" color="gray" radius="xl" size="lg" onClick={() => setAccountsModalIndex(null)} aria-label="Close" className="hover:bg-slate-100">
            <IconX size={16} />
          </ActionIcon>
        </Box>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
          <fieldset disabled={isViewMode} className="border-0 p-0 m-0">
            <div className="rounded-xl border p-5 bg-white" style={{ borderColor: theme.brand[1] }}>
              <div className="flex items-center gap-2 mb-4">
                <IconWallet size={16} style={{ color: theme.brand[6] }} />
                <Text size="xs" fw={700} className="uppercase tracking-wide" style={{ color: theme.brand[6] }}>Charge Accounts</Text>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Select size="xs" searchable label="Income Account" placeholder="Select income account" data={incomeAccounts} value={charge.incomeAccount} onChange={(v) => update("incomeAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconWallet} color="gold" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
                <Select size="xs" searchable label="Receivable Account" placeholder="Select receivable account" data={principalAccounts} value={charge.receivableAccount} onChange={(v) => update("receivableAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconReceipt2} color="brand" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
                <Select size="xs" searchable label="Waiver Account" placeholder="Select waiver account" data={principalAccounts} value={charge.waiverAccount} onChange={(v) => update("waiverAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconClipboardCheck} color="indigoAlt" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
                <Select size="xs" searchable label="Write Off Account" placeholder="Select write off account" data={writeOffAccounts} value={charge.writeOffAccount} onChange={(v) => update("writeOffAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconClipboardList} color="danger" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
                <Select size="xs" searchable label="Suspense Account" placeholder="Select suspense account" data={principalAccounts} value={charge.suspenseAccount} onChange={(v) => update("suspenseAccount", v || "")} rightSection={<IconChevronDown size={13} className="text-slate-400" />} leftSection={<IconChip icon={IconStack2} color="gold" />} leftSectionWidth={44} classNames={{ label: fieldLabelProps.label, input: `${fieldLabelProps.input} !pl-[50px]` }} />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="bg-white border-t border-slate-100 p-3.5 px-6 flex justify-between items-center shrink-0">
          <Text size="10px" className="text-slate-400">Shortcuts: Esc close</Text>
          <Button type="button" size="sm" radius="md" onClick={() => setAccountsModalIndex(null)} className="font-semibold px-6">
            Done
          </Button>
        </div>
      </Modal>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="80%" withCloseButton={false} padding={0} radius="lg"
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      styles={{
        content: { height: "95vh", maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <form onSubmit={form.onSubmit(handleValidSubmit, handleInvalidSubmit)} style={{ height: "100%" }}>
        <Box className="flex flex-col h-full bg-white" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box className="flex justify-between items-start px-6 pt-4 pb-3 shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}>
                {(() => { const HeaderIcon = headerIcon; return <HeaderIcon size={17} className="text-white" />; })()}
              </div>
              <div>
                <Text size="lg" fw={800} className="text-slate-900 leading-tight">{headerTitle}</Text>
              </div>
            </div>
            <ActionIcon type="button" variant="light" color="gray" radius="xl" size="lg" onClick={handleModalClose} aria-label="Close" className="hover:bg-slate-100">
              <IconX size={18} />
            </ActionIcon>
          </Box>

          <Box className="px-8 pt-2.5 pb-2.5 border-b border-slate-100 shrink-0 bg-white">
            <div className="flex items-center">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isComplete = currentStep > idx;
                const StepIcon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <button type="button" onClick={() => setActiveTab(idx.toString())} className="flex items-center gap-2 text-left shrink-0 group">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold shrink-0 transition-all" style={isActive ? { backgroundColor: theme.brand[6], color: "#fff", boxShadow: `0 0 0 3px ${theme.brand[1]}` } : isComplete ? { backgroundColor: theme.brand[5], color: "#fff" } : { backgroundColor: "#fff", color: "#94a3b8", border: "2px solid #e2e8f0" }}>
                        {isComplete ? <IconCheck size={13} /> : <StepIcon size={13} />}
                      </div>
                      <div className="hidden sm:block whitespace-nowrap">
                        <Text size="xs" fw={700} style={{ color: isActive ? theme.brand[6] : isComplete ? "#334155" : "#94a3b8" }}>{step.label}</Text>
                        <Text size="10px" className="text-slate-400 leading-none">{step.desc}</Text>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-[2px] mx-3 rounded-full transition-colors" style={{ backgroundColor: isComplete ? theme.brand[5] : "#e2e8f0" }} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Box>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 px-6 pb-4 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
            <fieldset disabled={isViewMode} className="border-0 p-0 m-0">
              {activeTab === "0" && renderProductDetails()}
              {activeTab === "1" && renderAccounting()}
              {activeTab === "2" && renderCollection()}
              {activeTab === "3" && renderCharges()}
            </fieldset>
          </div>
          {renderChargeAccountsModal()}
          <div className="bg-white border-t border-slate-100 p-2.5 px-6 flex justify-between items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-4" />

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {submitError && (
                <Text size="xs" c="red" className="sm:mr-2">
                  {submitError}
                </Text>
              )}

              <Button type="button" size="sm" variant="default" radius="md" onClick={handleModalClose} className="font-semibold px-5 border-slate-200">
                {isViewMode ? "Close" : "Cancel"}
              </Button>

              {!isViewMode && (
                <button type="button" onClick={handleReset} className="text-xs font-semibold transition-colors" style={{ color: theme.danger[6] }}>
                  Reset
                </button>
              )}

              {currentStep > 0 && (
                <Button type="button" size="sm" variant="default" radius="md" onClick={handleBack} leftSection={<IconArrowLeft size={14} />} className="font-semibold px-5 text-slate-700 border-slate-200">
                  Back
                </Button>
              )}

              {!isViewMode &&
                (currentStep < 3 ? (
                  <Button type="button" size="sm" radius="md" color="brand" className="font-semibold px-6" onClick={handleNext} rightSection={<IconArrowRight size={14} />}>
                    Save & Next
                  </Button>
                ) : (
                  <Button type="submit" size="sm" radius="md" color="brand" className="font-semibold px-6" loading={isSaving} rightSection={<IconCheck size={14} />}>
                    {loanProductId ? "Update Product" : "Submit"}
                  </Button>
                ))}

              {isViewMode && currentStep < 3 && (
                <Button type="button" size="sm" radius="md" color="brand" className="font-semibold px-6" onClick={handleNext} rightSection={<IconArrowRight size={14} />}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </Box>
      </form>
    </Modal>
  );
}