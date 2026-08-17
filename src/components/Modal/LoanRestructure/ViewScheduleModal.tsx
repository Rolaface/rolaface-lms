import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Modal, Table, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { getRepaymentSchedule, type RepaymentScheduleResponse } from "../../../api/loanRestructureApi";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { restructureTypeLabel, type RestructureType } from "../../../types/RestructureTypes";

interface RestructureSchedulePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  restructureType: RestructureType;
  loanProduct: string;
  loanAmount: number | "";
  rateOfInterest: number | "";
  tenure: number | "";
  repaymentFrequency: string;
  repaymentStartDate: string;
}

function formatDisplayDate(iso: string): string {
  const d = dayjs(iso);
  return d.isValid() ? d.format("DD-MMM-YYYY") : "—";
}

export function RestructureSchedulePreviewModal({
  opened,
  onClose,
  restructureType,
  loanProduct,
  loanAmount,
  rateOfInterest,
  tenure,
  repaymentFrequency,
  repaymentStartDate,
}: RestructureSchedulePreviewModalProps) {
  const baseCurrency = useCompanyStore((s) => s.baseCurrency);
  const currencyReady = useCurrencyReady();
  const fmt = (v: number | string | null | undefined) =>
    currencyReady ? formatAmount(baseCurrency, v, { withSymbol: true }) : String(v ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<RepaymentScheduleResponse | null>(null);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!loanProduct) missing.push("Loan Product");
    if (loanAmount === "" || Number(loanAmount) <= 0) missing.push("Loan Amount");
    if (rateOfInterest === "" || Number(rateOfInterest) < 0) missing.push("Rate of Interest");
    if (tenure === "" || Number(tenure) <= 0) missing.push("Extend Tenure By");
    if (!repaymentFrequency) missing.push("Repayment Frequency");
    if (!repaymentStartDate) missing.push("Value Date");
    return missing;
  }, [loanProduct, loanAmount, rateOfInterest, tenure, repaymentFrequency, repaymentStartDate]);

  useEffect(() => {
    if (!opened) {
      setSchedule(null);
      setError(null);
      return;
    }

    if (missingFields.length > 0) {
      setSchedule(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRepaymentSchedule({
      loan_product: loanProduct,
      loan_amount: Number(loanAmount),
      rate_of_interest: Number(rateOfInterest),
      tenure: Number(tenure),
      repayment_frequency: repaymentFrequency,
      repayment_start_date: dayjs(repaymentStartDate).format("DD-MM-YYYY"),
    })
      .then((res) => {
        if (!cancelled) setSchedule(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load repayment schedule.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} size="900px" radius="md" padding={0}>
      <Box className="flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <Text size="md" fw={700} c="slate.8" className="leading-tight">
              New Repayment Schedule
            </Text>
          </div>
          <Button variant="subtle" color="slate" onClick={onClose} className="px-2" size="xs" aria-label="Close">
            <IconX size={18} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pb-4 shrink-0">
          <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
            Type: {restructureTypeLabel(restructureType)}
          </Badge>
          {rateOfInterest !== "" && (
            <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
              Rate: {rateOfInterest}%
            </Badge>
          )}
          {loanAmount !== "" && (
            <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
              Principal: {fmt(loanAmount)}
            </Badge>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {missingFields.length > 0 ? (
            <Text size="sm" c="dimmed" className="py-8 text-center">
              Enter {missingFields.join(", ")} to preview the schedule.
            </Text>
          ) : loading ? (
            <Text size="sm" c="dimmed" className="py-8 text-center">
              Loading schedule…
            </Text>
          ) : error ? (
            <Text size="sm" c="danger.6" className="py-8 text-center">
              {error}
            </Text>
          ) : (
            <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Installment</Table.Th>
                  <Table.Th>Due Date</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Principal</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Interest</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Total EMI</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Balance</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {!schedule || schedule.repayment_periods.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" className="py-8 text-center">
                        Schedule preview not available yet.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  schedule.repayment_periods.map((row, idx) => (
                    <Table.Tr key={`${row.payment_date}-${idx}`}>
                      <Table.Td>#{idx + 1}</Table.Td>
                      <Table.Td>{formatDisplayDate(row.payment_date)}</Table.Td>
                      <Table.Td className="font-mono" style={{ textAlign: "right" }}>{fmt(row.principal_amount)}</Table.Td>
                      <Table.Td className="font-mono" style={{ textAlign: "right" }}>{fmt(row.interest_amount)}</Table.Td>
                      <Table.Td className="font-mono font-semibold" style={{ textAlign: "right" }}>{fmt(row.total_payment)}</Table.Td>
                      <Table.Td className="font-mono" style={{ textAlign: "right" }}>{fmt(row.balance_loan_amount)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          )}
        </div>

        <div className="p-4 px-6 flex justify-end shrink-0" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
          <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5">
            Close
          </Button>
        </div>
      </Box>
    </Modal>
  );
}