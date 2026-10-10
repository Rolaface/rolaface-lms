/* Shared helpers of the Investor 360 view: selection type and formatting. */
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";

/** What the main area of the Investor 360 view shows. */
export type InvestorViewSelection =
  | { type: "overview" }
  | { type: "investment"; id: string }
  | { type: "statement" }
  | { type: "profile" }
  | { type: "notifications" };

/** Formats an amount in the company currency. */
export function useMoney() {
  const currency = useCompanyStore((state) => state.baseCurrency);
  return (value: number | null | undefined) =>
    formatAmount(currency, Number(value) || 0, { withSymbol: true });
}

/** DD-MMM-YYYY, the date format of every investor screen. */
export const fmtDate = (value: string | null | undefined) =>
  formatInvestorDate(value);

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
