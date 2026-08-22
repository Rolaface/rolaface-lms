import {
  Text,
  TextInput,
  NumberInput,
  Select,
  SegmentedControl,
  Input,
  Checkbox,
  Paper,
  SimpleGrid,
  Group,
  ThemeIcon,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import {
  IconChevronDown,
  IconUserSquareRounded,
  IconReceiptDollar,
} from "@tabler/icons-react";

import { CURRENCIES, FREQUENCIES } from "./Constants";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomers } from "../../../api/customerApi";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { getAllLoanProducts } from "../../../api/productApi";
import { getSymbol } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

const chevronDown = (
  <IconChevronDown size={14} style={{ color: "var(--mantine-color-slate-4)" }} />
);

interface BasicDetailsTabProps {
  form: UseFormReturnType<any>;
  maturityDate: string;
  loanAcNumber: string;
}

export function BasicDetailsTab({
  form,
  maturityDate,
  loanAcNumber,
}: BasicDetailsTabProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);
  const moratoriumEnabled = !!form.values.moratoriumType;
  const toDateObj = (value: string | null | undefined) => (value ? new Date(value) : null);
  const toDateString = (date: Date | string | null) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
  };

  // ---- Customer Number: backend search, debounced ----
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [debouncedCustomerSearch] = useDebouncedValue(customerSearchInput, 400);

  const { data: customerResponse, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers", debouncedCustomerSearch],
    queryFn: () => getAllCustomers({ search: debouncedCustomerSearch || undefined }),
  });

  const customerOptions = useMemo(() => {
    const customers = customerResponse?.data || [];
    return customers.map((c: any) => ({
      value: c.value,
      label: `${c.value} - ${c.label}`,
    }));
  }, [customerResponse]);

  // Cache value->label pairs across searches so a previously selected
  // customer's name doesn't disappear once the search text changes
  // (since results are now backend-filtered and no longer a static full list).
  const [customerLabelMap, setCustomerLabelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const customers = customerResponse?.data || [];
    if (customers.length === 0) return;
    setCustomerLabelMap((prev) => {
      const next = { ...prev };
      customers.forEach((c: any) => {
        next[c.value] = c.label;
      });
      return next;
    });
  }, [customerResponse]);

  const selectedCustomerName = form.values.customerNumber
    ? customerLabelMap[form.values.customerNumber] || ""
    : "";
  // NOTE: in edit mode, if the loan's existing customer never appears in a
  // fetched search result (e.g. a large customer base and the default/empty
  // search doesn't include them), this will show blank until searched by
  // name/code. There's no getCustomerById endpoint in what was shared — if
  // one exists, tell me and I'll wire a direct lookup here instead.

  const { data: productResponse, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: getAllLoanProducts,
  });

  const productOptions = useMemo(() => {
    const products = productResponse?.data || [];
    return products.map((p: any) => ({
      value: p.name,
      label: p.name,
    }));
  }, [productResponse]);

  const selectedProductName = useMemo(() => {
    const products = productResponse?.data || [];
    const found = products.find((p: any) => p.name === form.values.productCode);
    return found ? found.product_name || found.name : "";
  }, [productResponse, form.values.productCode]);
  const hasLoanAppNumber = !!form.values.loanAppNumber;
  return (
    <div className="flex flex-col gap-3">
      <Paper withBorder radius="lg" shadow="md" p="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
          <Select
            label="Customer Number"
            placeholder={isCustomersLoading ? "Loading..." : "Search customer number..."}
            data={customerOptions}
            disabled={isCustomersLoading || hasLoanAppNumber}
            searchable
            clearable
            rightSection={chevronDown}
            searchValue={customerSearchInput}
            onSearchChange={setCustomerSearchInput}
            filter={({ options }) => options}
            {...form.getInputProps("customerNumber")}
          />
          <TextInput
            label="Customer Name"
            disabled
            placeholder="Auto-filled on selection"
            value={selectedCustomerName}
          />
          <Select
            label="Product Code"
            placeholder={isProductsLoading ? "Loading..." : "Search product code..."}
            data={productOptions}
            disabled={isProductsLoading || hasLoanAppNumber}
            searchable
            clearable={!!form.values.productCode}
            rightSection={chevronDown}
            value={form.values.productCode}
            error={form.errors.productCode}
            onClick={() => refetchProducts()}
            required
            onChange={(value) => {
              form.setFieldValue("productCode", value);
              const products = productResponse?.data || [];
              const found = products.find((p: any) => p.name === value);
              form.setFieldValue("rateOfInterest", found?.rate_of_interest ?? 0);
            }}
          />
          <TextInput
            label="Product Name"
            disabled
            placeholder="Auto-filled on selection"
            value={selectedProductName}
          />

          <TextInput
            label="Loan Account Number"
            placeholder="Auto-generated on save"
            value={loanAcNumber}
            disabled
          />
          <TextInput
            label="Loan Application Number"
            // disabled={hasLoanAppNumber}
            disabled
            {...form.getInputProps("loanAppNumber")}
          />
          <TextInput
            label="Ref Number"
            placeholder="Optional reference"
            disabled={hasLoanAppNumber}
            {...form.getInputProps("refNumber")}
          />
          <div className="flex flex-col gap-1">
            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" fw={600} c="slate.6">
                Migration Date
              </Text>
              <Checkbox
                size="xs"
                label="Migrated"
                disabled={hasLoanAppNumber}
                checked={form.values.isImport}
                onChange={(e) => form.setFieldValue("isImport", e.currentTarget.checked)}
              />
            </Group>

            <DateInput
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              radius="lg"
              disabled={!form.values.isImport || hasLoanAppNumber}
              value={toDateObj(form.values.migrationDate)}
              onChange={(date) =>
                form.setFieldValue("migrationDate", toDateString(date))
              }
            />
          </div>
        </SimpleGrid>
      </Paper>

      <Paper withBorder radius="lg" shadow="md" p="lg">
        <div className="flex flex-col gap-3">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
            <DateInput
              label="Transaction Date"
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              disabled
              value={toDateObj(form.values.trnDate)}
              onChange={(date) => form.setFieldValue("trnDate", toDateString(date))}
            />
            {/* <DateInput
              label="Value Date"
              withAsterisk
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              value={toDateObj(form.values.valueDate)}
              onChange={(date) => form.setFieldValue("valueDate", toDateString(date))}
            /> */}
            <DateInput
              label="Value Date"
              withAsterisk
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              value={toDateObj(form.values.valueDate)}
              onChange={(date) => form.setFieldValue("valueDate", toDateString(date))}
              error={form.errors.valueDate}
            />
            <TextInput
              label="Currency"
              value={companyCurrency}
              disabled
            />
            <NumberInput
              label="Loan Amount"
              hideControls
              min={0}
              placeholder="0"
              thousandSeparator=","
              {...form.getInputProps("loanAmount")}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
            <Input.Wrapper label="Fixed Repayments In">
              <SegmentedControl
                data={["TENOR", "EMI"]}
                fullWidth
                color="brand"
                value={form.values.fixedRepaymentsIn}
                onChange={(val) => form.setFieldValue("fixedRepaymentsIn", val)}
              />
            </Input.Wrapper>
            <NumberInput
              label="Tenure (months)"
              placeholder="0"
              hideControls
              min={0}
              disabled={form.values.fixedRepaymentsIn === "EMI"}
              {...form.getInputProps("tenureValue")}
            />
            <NumberInput
              label="Repayment Amount"
              placeholder="0"
              hideControls
              min={0}
              disabled={form.values.fixedRepaymentsIn === "TENOR"}
              {...form.getInputProps("repaymentAmount")}
            />
            <Select
              label="Frequency"
              data={FREQUENCIES}
              rightSection={chevronDown}
              {...form.getInputProps("frequency")}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
            <DateInput
              label="Maturity Date"
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              value={toDateObj(maturityDate)}
              disabled
              onChange={() => { }}
            />
            {/* <DateInput
              label="Repayment Start Date"
              withAsterisk
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              value={toDateObj(form.values.repaymentStartDate)}
              onChange={(date) => form.setFieldValue("repaymentStartDate", toDateString(date))}
            /> */}
            <DateInput
              label="Repayment Start Date"
              withAsterisk
              valueFormat="DD-MMM-YYYY"
              placeholder="DD-MMM-YYYY"
              value={toDateObj(form.values.repaymentStartDate)}
              onChange={(date) => form.setFieldValue("repaymentStartDate", toDateString(date))}
              error={form.errors.repaymentStartDate}
            />
            <div className="flex items-center h-full">
              <Checkbox
                size="xs"
                label="Auto Disbursement on Loan Booking"
                checked={form.values.auto_create_disbursement_on_loan_booking}
                onChange={(e) =>
                  form.setFieldValue(
                    "auto_create_disbursement_on_loan_booking",
                    e.currentTarget.checked
                  )
                }
              />
            </div>
          </SimpleGrid>
        </div>
      </Paper>

      <Paper withBorder radius="lg" shadow="md" p="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
          <Input.Wrapper label="Moratorium Type">
            <SegmentedControl
              size="xs"
              data={[
                { label: "Principal", value: "Principal" },
                { label: "EMI", value: "EMI" },
              ]}
              fullWidth
              color="brand"
              value={form.values.moratoriumType}
              onChange={(val) => form.setFieldValue("moratoriumType", val)}
            />
          </Input.Wrapper>
          <NumberInput
            label="Moratorium Period"
            placeholder="0"
            hideControls
            min={0}
            disabled={!moratoriumEnabled}
            {...form.getInputProps("moratoriumPeriod")}
          />
        </SimpleGrid>
      </Paper>
    </div>
  );
}