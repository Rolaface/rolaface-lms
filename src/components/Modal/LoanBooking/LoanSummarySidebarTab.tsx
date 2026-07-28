import { Text } from "@mantine/core";
import { ANNUAL_RATE } from "./Constants";

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center border-b border-dashed border-indigo-200/70 py-2">
      <Text size="xs" className="text-indigo-700">
        {label}
      </Text>
      <Text size="xs" fw={bold ? 700 : 600} className="text-slate-900 font-mono">
        {value}
      </Text>
    </div>
  );
}

interface LoanSummarySidebarProps {
  productCode: string | null;
  summaryPrincipal: number;
  currency: string | null;
  tenureMonths: number;
  frequency: string | null;
  repaymentStartDate: string;
  maturityDate: string;
  moratoriumType: string | null;
  estimatedEmi: number;
  totalInterest: number;
  totalRepayment: number;
}

export function LoanSummarySidebar({
  productCode,
  summaryPrincipal,
  currency,
  tenureMonths,
  frequency,
  repaymentStartDate,
  maturityDate,
  moratoriumType,
  estimatedEmi,
  totalInterest,
  totalRepayment,
}: LoanSummarySidebarProps) {
  return (
    <div className="w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-gradient-to-b from-indigo-50/60 to-violet-50/60 p-5 shrink-0 overflow-y-auto">
      <Text size="xs" fw={700} className="text-indigo-600 uppercase tracking-wide" style={{ fontSize: 10 }}>
        Live Preview
      </Text>
      <div className="flex flex-col">
        <SummaryRow label="Product" value={productCode || "—"} />
        <SummaryRow
          label="Principal"
          value={summaryPrincipal ? `${summaryPrincipal.toLocaleString("en-US")} ${currency}` : "—"}
          bold
        />
        <SummaryRow label="Interest Rate" value={`${ANNUAL_RATE}% p.a.`} />
        <SummaryRow label="Tenure" value={tenureMonths ? `${tenureMonths} months` : "—"} />
        <SummaryRow label="Frequency" value={frequency || "—"} bold />
        <SummaryRow label="Repayment Start" value={repaymentStartDate || "—"} />
        <SummaryRow label="Maturity Date" value={maturityDate || "—"} />
        <SummaryRow label="Moratorium" value={moratoriumType || "None"} bold />
      </div>

      <div className="bg-white rounded-md border border-slate-200 p-4 mt-4">
        <Text size="xs" fw={700} className="text-slate-500 uppercase tracking-wide" style={{ fontSize: 10 }}>
          Estimated EMI
        </Text>
        <Text size="xl" fw={800} className="text-slate-900 font-mono" style={{ fontSize: 26 }}>
          {estimatedEmi ? estimatedEmi.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
        </Text>
      </div>

      <div className="flex flex-col mt-3">
        <SummaryRow
          label="Total Interest"
          value={
            totalInterest
              ? `${totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`
              : "—"
          }
        />
        <SummaryRow
          label="Total Repayment"
          value={
            totalRepayment
              ? `${totalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`
              : "—"
          }
          bold
        />
      </div>

      <Text size="xs" c="dimmed" className="mt-3 italic">
        Figures are indicative and recalculate automatically. Final schedule is generated on save.
      </Text>
    </div>
  );
}