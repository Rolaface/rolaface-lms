import { useMemo, useState } from "react";
import { Select, SimpleGrid, Box, Loader } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../api/Customer/customerApi";
import { getEveryInvestmentProduct } from "../../../api/Investor/productApi";
import {
  PRODUCTS,
  KeyValueList,
  SectionBox,
  apiProductPatch,
  inr,
  stateCustomer,
  type TabProps,
} from "./InvestorModalShared";

const CUSTOMER_SEARCH_PAGE_SIZE = 50;

export function InvestorProduct({ state, update }: TabProps) {
  const customer = stateCustomer(state);

  /* ----------------------------- Customers ----------------------------- */
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch] = useDebouncedValue(customerSearch, 300);

  const { data: customersResponse, isFetching: customersLoading } = useQuery({
    queryKey: ["investorCustomers", debouncedCustomerSearch],
    queryFn: () =>
      getCustomers({
        search: debouncedCustomerSearch.trim() || undefined,
        page_size: CUSTOMER_SEARCH_PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  // The customer list has no is_investor filter, so only investors are kept here.
  const investors = useMemo(
    () => (customersResponse?.data ?? []).filter((c) => c.is_investor),
    [customersResponse],
  );

  // Keep the chosen customer in the list while the user types a new search.
  const customerOptions = useMemo(() => {
    const options = investors.map((c) => ({ value: c.name, label: c.customer_name || c.name }));
    if (customer && !options.some((o) => o.value === customer.id)) {
      options.unshift({ value: customer.id, label: customer.name });
    }
    return options;
  }, [investors, customer]);

  const handleCustomerChange = (value: string | null) => {
    if (!value) {
      update({ customerId: null, customerName: "", customerEmail: "" });
      return;
    }
    const picked = investors.find((c) => c.name === value);
    update({
      customerId: value,
      customerName: picked?.customer_name || value,
      customerEmail: picked?.email_id || "",
    });
  };

  /* ----------------------------- Products ------------------------------ */
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["investmentProducts", "all"],
    queryFn: getEveryInvestmentProduct,
  });

  const selectedProduct = state.productId
    ? (products.find((p) => p.name === state.productId) ?? null)
    : null;

  // Active products only, plus the chosen one (it may have been marked inactive since).
  const productOptions = useMemo(() => {
    const options = products
      .filter((p) => p.disabled !== 1)
      .map((p) => ({ value: p.name, label: p.product_name }));
    if (state.productId && !options.some((o) => o.value === state.productId)) {
      options.unshift({
        value: state.productId,
        label: state.productName || state.productId,
      });
    }
    return options;
  }, [products, state.productId, state.productName]);

  // Details of the product itself (not the terms, which can be changed on the next step).
  const productDetails = selectedProduct
    ? {
        rate: Number(selectedProduct.interest_rate) || 0,
        tenureMonths: Number(selectedProduct.tenure) || 0,
        frequency: selectedProduct.payout_frequency,
        minAmount: Number(selectedProduct.minimum_investment) || 0,
      }
    : (PRODUCTS[state.productIndex] ?? null);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <SectionBox title="Customer">
        <Select
          label="Customer name"
          placeholder="Search investor"
          size="sm"
          radius="md"
          clearable
          searchable
          data={customerOptions}
          filter={({ options }) => options}
          searchValue={customerSearch}
          onSearchChange={setCustomerSearch}
          value={customer ? customer.id : null}
          onChange={handleCustomerChange}
          rightSection={customersLoading ? <Loader size={14} /> : undefined}
          nothingFoundMessage={customersLoading ? "Searching…" : "No investor found"}
        />
        {customer && (
          <Box mt="md">
            <KeyValueList
              rows={[
                { label: "Customer ID", value: customer.id },
                ...(customer.bank ? [{ label: "Payout bank", value: customer.bank }] : []),
                { label: "Email (statements)", value: customer.email || "—" },
              ]}
            />
          </Box>
        )}
      </SectionBox>

      <SectionBox title="Investment product">
        <Select
          label="Product"
          placeholder={productsLoading ? "Loading…" : "Select product"}
          size="sm"
          radius="md"
          clearable
          searchable
          data={productOptions}
          value={state.productId}
          onChange={(v) =>
            update(apiProductPatch(v ? (products.find((p) => p.name === v) ?? null) : null))
          }
          rightSection={productsLoading ? <Loader size={14} /> : undefined}
          nothingFoundMessage="No product found"
        />
        {productDetails && (
          <Box mt="md">
            <KeyValueList
              rows={[
                { label: "Interest rate", value: `${productDetails.rate}% p.a.` },
                { label: "Tenure", value: `${productDetails.tenureMonths} months` },
                { label: "Repayment frequency", value: productDetails.frequency },
                { label: "Minimum investment", value: inr(productDetails.minAmount) },
              ]}
            />
          </Box>
        )}
      </SectionBox>
    </SimpleGrid>
  );
}
