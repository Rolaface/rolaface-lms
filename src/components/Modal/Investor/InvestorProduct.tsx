import { Select, SimpleGrid, Box } from "@mantine/core";
import {
  CUSTOMERS,
  PRODUCTS,
  KeyValueList,
  SectionBox,
  inr,
  productPatch,
  type TabProps,
} from "./InvestorModalShared";

export function InvestorProduct({ state, update }: TabProps) {
  const customer = CUSTOMERS[state.customerIndex];
  const product = PRODUCTS[state.productIndex];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <SectionBox title="Customer">
        <Select
          label="Customer name"
          placeholder="Select customer"
          size="sm"
          radius="md"
          clearable
          data={CUSTOMERS.map((c, i) => ({ value: String(i), label: c.name }))}
          value={state.customerIndex >= 0 ? String(state.customerIndex) : null}
          onChange={(v) =>
            update({ customerIndex: v === null ? -1 : Number(v) })
          }
        />
        {customer && (
          <Box mt="md">
            <KeyValueList
              rows={[
                { label: "Customer ID", value: customer.id },
                { label: "Payout bank", value: customer.bank },
                { label: "Email (statements)", value: customer.email },
              ]}
            />
          </Box>
        )}
      </SectionBox>

      <SectionBox title="Investment product">
        <Select
          label="Product"
          placeholder="Select product"
          size="sm"
          radius="md"
          clearable
          data={PRODUCTS.map((p, i) => ({ value: String(i), label: p.name }))}
          value={state.productIndex >= 0 ? String(state.productIndex) : null}
          onChange={(v) => update(productPatch(v === null ? -1 : Number(v)))}
        />
        {product && (
          <Box mt="md">
            <KeyValueList
              rows={[
                { label: "Interest rate", value: `${product.rate}% p.a.` },
                { label: "Tenure", value: `${product.tenureMonths} months` },
                { label: "Repayment frequency", value: product.frequency },
                { label: "Minimum investment", value: inr(product.minAmount) },
              ]}
            />
          </Box>
        )}
      </SectionBox>
    </SimpleGrid>
  );
}