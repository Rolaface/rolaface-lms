/* Date field of the investor screens: shows DD-MMM-YYYY, keeps the value as an ISO date string (YYYY-MM-DD). */
import type { ComponentProps } from "react";
import { DateInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import { INVESTOR_DATE_FORMAT } from "./investorDate";

type Props = Omit<
  ComponentProps<typeof DateInput>,
  "value" | "onChange" | "valueFormat"
> & {
  /** ISO date (YYYY-MM-DD) or "" when empty. */
  value: string;
  onChange?: (value: string) => void;
};

export function InvestorDateInput({ value, onChange, ...rest }: Props) {
  return (
    <DateInput
      valueFormat={INVESTOR_DATE_FORMAT}
      placeholder="DD-MMM-YYYY"
      rightSection={
        <IconCalendar size={14} color="var(--mantine-color-slate-4)" />
      }
      popoverProps={{ withinPortal: true, position: "bottom-start" }}
      {...rest}
      value={value || null}
      onChange={(v) => onChange?.(v ? String(v).slice(0, 10) : "")}
    />
  );
}
