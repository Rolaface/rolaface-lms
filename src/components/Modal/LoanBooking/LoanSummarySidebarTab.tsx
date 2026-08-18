import { Text, Badge, Stack, Group, useMantineTheme } from "@mantine/core";
import { getSymbol } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";


function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      py={5} 
    >
      <Text size="xs" c="slate.5">
        {label}
      </Text>
      <Text size="xs" fw={bold ? 700 : 600} c="slate.8" ff="monospace" ta="right">
        {value}
      </Text>
    </Group>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--mantine-color-slate-1)",
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-lg)",
        padding: "10px 12px", // was 12px 14px
      }}
    >
      {children}
    </div>
  );
}

interface LoanSummarySidebarProps {
  productCode: string | null;
  rateOfInterest: number;
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
  rateOfInterest,
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
  const theme = useMantineTheme();
     const companyCurrency = useCompanyStore((state) => state.baseCurrency);
      const currencySymbol = getSymbol(companyCurrency);

      function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}
  return (
    <div
      className="w-full lg:w-[300px] shrink-0"
      style={{
        borderTop: "1px solid var(--mantine-color-slate-2)",
        background: theme.other.summaryPanelBg as string,
      }}
    >
      <div className="lg:shadow-[var(--mantine-shadow-lg)] h-full">
        {/* p-5 -> p-4, gap-4 -> gap-3, and pb-6 added as a safety buffer
            so the last card never sits behind the footer */}
        <div className="p-4 pb-6 flex flex-col gap-3">
          <Text size="sm" fw={700} c="slate.7" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
            Summary
          </Text>

          <SummaryCard>
            <Stack gap={2}> {/* was 4 */}
              <SummaryRow label="Product" value={productCode || "—"} />
              <SummaryRow
                label="Principal"
                value={summaryPrincipal ? `${currencySymbol} ${summaryPrincipal} ` : "—"}
                bold
              />
              <SummaryRow label="Interest Rate" value={`${rateOfInterest || 0}% p.a.`} />
              <SummaryRow label="Tenure" value={tenureMonths ? `${tenureMonths} months` : "—"} />
              <SummaryRow label="Frequency" value={frequency || "—"} bold />
              {/* <SummaryRow label="Repayment Start" value={repaymentStartDate || "—"} />
              <SummaryRow label="Maturity Date" value={maturityDate || "—"} /> */}
              <SummaryRow label="Repayment Start" value={formatDate(repaymentStartDate)} />
<SummaryRow label="Maturity Date" value={formatDate(maturityDate)} />
              <div style={{ paddingBottom: 0 }}>
                <Group justify="space-between" wrap="nowrap" py={5}>
                  <Text size="xs" c="slate.5">
                    Moratorium
                  </Text>
                  <Text size="xs" fw={700} c="slate.8" ta="right">
                    {moratoriumType || "None"}
                  </Text>
                </Group>
              </div>
            </Stack>
          </SummaryCard>

          <div
            style={{
              background: theme.other.brandGradient as string,
              boxShadow: theme.other.brandGlowShadowSm as string,
              borderRadius: "var(--mantine-radius-lg)",
              padding: "12px 16px", // was 16px 18px
            }}
          >
            <Text size="xxs" fw={700} c="brand.1" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
              Estimated EMI
            </Text>
            <Text fw={800} c="white" ff="monospace" style={{ fontSize: 24, lineHeight: 1.25, marginTop: 4 }}>
              {/* fontSize 28 -> 24 */}
              {estimatedEmi ? estimatedEmi.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
            </Text>
          </div>

          <SummaryCard>
            <Stack gap={2}> {/* was 4 */}
              <SummaryRow
                label="Total Interest"
                value={
                  totalInterest
                    ? ` ${currencySymbol} ${totalInterest}`
                    : "—"
                }
              />
              <div style={{ paddingBottom: 0 }}>
                <Group justify="space-between" wrap="nowrap" py={5}>
                  <Text size="xs" c="slate.5">
                    Total Repayment
                  </Text>
                  <Text size="xs" fw={700} c="slate.8" ta="right">
                    {totalRepayment
                      ? `${currencySymbol} ${totalRepayment}`
                      : "—"}
                  </Text>
                </Group>
              </div>
            </Stack>
          </SummaryCard>
        </div>
      </div>
    </div>
  );
}