import { Box, Button, Stack, Text, TextInput, Select } from "@mantine/core";
import {
  CUSTOMERS,
  PRODUCTS,
  SectionBox,
  Tag,
  buildNumber,
  toIso,
  type FundedInvestment,
  type PaymentMode,
  type TabProps,
} from "./InvestorModalShared";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

interface FundingAllotmentProps extends TabProps {
  existingCount: number;
  onFunded: (investment: FundedInvestment) => void;
}

export function FundingAllotment({
  state,
  update,
  existingCount,
  onFunded,
}: FundingAllotmentProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const customer = CUSTOMERS[state.customerIndex];
  const product = PRODUCTS[state.productIndex];

  if (state.funded) {
    return (
      <Stack align="center" gap={6} py={30}>
        <Tag label="Funds received" color="success" />
        <Text fw={700} fz={18} c="slate.8" mt="xs">
          Investment {state.investmentNo} is active
        </Text>
        <Text fz="sm" c="slate.5">
          {fmtAmount(state.amount)} received via {state.paymentMode} · Ref{" "}
          {state.utr}
        </Text>
      </Stack>
    );
  }

  const handleConfirm = () => {
    const startDate = new Date();
    const investmentNo = buildNumber("INV", existingCount);
    update({ funded: true, startDate, investmentNo });
    onFunded({
      investmentNo,
      customer: customer.name,
      product: product.name,
      amount: state.amount,
      rate: state.rate,
      startDate: toIso(startDate),
      status: "Active",
    });
  };

  return (
    <SectionBox title="Record investor funds">
      <Text fz="sm" c="slate.8" mb="sm">
        Expected amount:{" "}
        <Text span fw={700}>
          {fmtAmount(state.amount)}
        </Text>{" "}
        from{" "}
        <Text span fw={700}>
          {customer.name}
        </Text>
      </Text>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        <Select
          label="Payment mode"
          size="sm"
          radius="md"
          allowDeselect={false}
          data={["NEFT", "RTGS", "IMPS"]}
          value={state.paymentMode}
          onChange={(v) => v && update({ paymentMode: v as PaymentMode })}
        />
        <TextInput
          label="UTR / reference number"
          placeholder="Enter reference"
          size="sm"
          radius="md"
          value={state.utr}
          onChange={(e) => update({ utr: e.currentTarget.value })}
        />
      </Box>
      <Box mt="md">
        <Button
          size="sm"
          radius="xl"
          color="success"
          disabled={state.utr.trim().length < 6}
          onClick={handleConfirm}
        >
          Confirm funds received
        </Button>
      </Box>
    </SectionBox>
  );
}
