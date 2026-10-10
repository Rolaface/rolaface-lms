/* One date format for every investor screen: DD-MMM-YYYY (e.g. 29-Sep-2026). */
import dayjs from "dayjs";

export const INVESTOR_DATE_FORMAT = "DD-MMM-YYYY";

/** A date (ISO string or Date) as DD-MMM-YYYY; `empty` when there is none or it is invalid. */
export function formatInvestorDate(
  value: Date | string | null | undefined,
  empty = "-",
): string {
  if (!value) return empty;
  const d = dayjs(value);
  return d.isValid() ? d.format(INVESTOR_DATE_FORMAT) : empty;
}
