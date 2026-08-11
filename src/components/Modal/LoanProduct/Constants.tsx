import {
  IconBriefcase, IconBuildingBank, IconArrowsExchange, IconReceipt2,
} from "@tabler/icons-react";

export const STEPS = [
  { label: "Product Details", desc: "Basic information", icon: IconBriefcase },
  { label: "Accounting", desc: "Account Mapping", icon: IconBuildingBank },
  { label: "Collection Sequence", desc: "Repayment Order", icon: IconArrowsExchange },
  { label: "Fees & Charges", desc: "Configure applicable loan fees", icon: IconReceipt2 },
];

export const theme = {
  brand: { 0: "var(--mantine-color-brand-0)", 1: "var(--mantine-color-brand-1)", 5: "var(--mantine-color-brand-5)", 6: "var(--mantine-color-brand-6)", 7: "var(--mantine-color-brand-7)" },
  accent: { 0: "var(--mantine-color-accent-0)", 1: "var(--mantine-color-accent-1)", 5: "var(--mantine-color-accent-5)", 6: "var(--mantine-color-accent-6)" },
  gold: { 0: "var(--mantine-color-gold-0)", 1: "var(--mantine-color-gold-1)", 5: "var(--mantine-color-gold-5)", 6: "var(--mantine-color-gold-6)" },
  danger: { 0: "var(--mantine-color-danger-0)", 1: "var(--mantine-color-danger-1)", 5: "var(--mantine-color-danger-5)", 6: "var(--mantine-color-danger-6)" },
  indigoAlt: { 0: "var(--mantine-color-indigoAlt-0)", 1: "var(--mantine-color-indigoAlt-1)", 5: "var(--mantine-color-indigoAlt-5)", 6: "var(--mantine-color-indigoAlt-6)" },
};
export type ChipColor = keyof typeof theme;

export const labelProps = {
  label: "text-[13px] font-semibold text-slate-700 mb-1",
  description: "mt-0 text-[10px] text-slate-400 leading-tight",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[42px] h-[42px] text-sm border-slate-200 rounded-xl overflow-hidden transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] !pl-[58px]",
};
export const fieldLabelProps = {
  label: "text-[13px] font-medium text-slate-600 mb-1",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[32px] h-[32px] text-sm rounded-lg border-slate-200 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)]",
};
export const labelPropsPlain = {
  label: "text-[13px] font-semibold text-slate-700 mb-1",
  description: "mt-0 text-[10px] text-slate-400 leading-tight",
  error: "text-[10px] text-danger-6 mt-1",
  input: "min-h-[40px] h-[40px] text-sm border-slate-200 rounded-xl transition-colors focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] px-4",
};

export const cellInputClasses = {
  input: "h-8 min-h-[32px] w-full text-xs rounded-md border border-slate-200 bg-white hover:border-slate-300 focus:border-[var(--mantine-color-brand-5)] focus:ring-1 focus:ring-[var(--mantine-color-brand-1)] disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 px-2",
};

export const demandTypeSequence = ["Charges", "Penalty", "Interest", "Principal"];

export const frequencyOptions = ["Monthly", "Quarterly", "Yearly"];

export const collectionAssetColumns = [
  { key: "standard", label: "Standard Asset" },
  { key: "subStandard", label: "Sub Standard Asset" },
  { key: "writtenOff", label: "Written Off Asset" },
  { key: "settlement", label: "Settlement Collection" },
];

// Turn an AccountOption[] into the plain string[] Mantine's Select expects.
// The lookup endpoint may return either plain strings (account IDs) or
// { name, account_name, ... } objects depending on the backend — handle
// both, and drop anything falsy so Select never sees an `undefined` entry
// (that's what throws "Cannot use 'in' operator to search for 'group' in undefined").
export const toAccountOptions = (accounts: unknown): string[] => {
  if (!Array.isArray(accounts)) return [];
  return accounts
    .map((a) => (typeof a === "string" ? a : a?.name ?? a?.account_name ?? a?.value))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
};

export const toOffsetOrderOptions = (orders: unknown): string[] => {
  if (!Array.isArray(orders)) return [];
  return orders
    .map((o) => (typeof o === "string" ? o : o?.name ?? o?.value))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
};