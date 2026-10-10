/* Shared helpers of the Investor 360 view: selection type and formatting. */
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

/** What the main area of the Investor 360 view shows. */
export type InvestorViewSelection =
  | { type: "overview" }
  | { type: "investment"; id: string }
  | { type: "statement" }
  | { type: "profile" };

/** Formats an amount in the company currency. */
export function useMoney() {
  const currency = useCompanyStore((state) => state.baseCurrency);
  return (value: number | null | undefined) => formatAmount(currency, Number(value) || 0, { withSymbol: true });
}

export const fmtDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
