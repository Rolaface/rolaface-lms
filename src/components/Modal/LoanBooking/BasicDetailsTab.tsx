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
import type { ComponentType } from "react";
import {
  IconChevronDown,
  IconUserSquareRounded,
  IconReceiptDollar,
} from "@tabler/icons-react";

import { CURRENCIES, FREQUENCIES } from "./Constants";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomers } from "../../../api/customerApi";
import { useMemo } from "react";
import { getAllLoanProducts } from "../../../api/productApi";

const chevronDown = (
  <IconChevronDown size={14} style={{ color: "var(--mantine-color-slate-4)" }} />
);

interface BasicDetailsTabProps {
  form: UseFormReturnType<any>;
  maturityDate: string;
  loanAcNumber: string;
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
}) {
  return (
    <Group gap={8} mb="sm" wrap="nowrap">
      <ThemeIcon variant="light" color="brand" radius="xl" size={26}>
        <Icon size={13} />
      </ThemeIcon>
      <Text
        size="xs"
        fw={700}
        c="slate.5"
        tt="uppercase"
        style={{ letterSpacing: "0.04em", whiteSpace: "nowrap" }}
      >
        {title}
      </Text>
      <div style={{ flex: 1, height: 1, background: "var(--mantine-color-slate-2)" }} />
    </Group>
  );
}

export function BasicDetailsTab({
  form,
  maturityDate,
  loanAcNumber,
}: BasicDetailsTabProps) {
  const moratoriumEnabled = !!form.values.moratoriumType;

  const { data: customerResponse, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: getAllCustomers,
  });

  const customerOptions = useMemo(() => {
    const customers = customerResponse?.data || [];
    return customers.map((c: any) => ({
      value: c.value,
      label: `${c.value} - ${c.label}`,
    }));
  }, [customerResponse]);

  const selectedCustomerName = useMemo(() => {
    const customers = customerResponse?.data || [];
    const found = customers.find((c: any) => c.value === form.values.customerNumber);
    return found ? found.label : "";
  }, [customerResponse, form.values.customerNumber]);

  const { data: productResponse, isLoading: isProductsLoading } = useQuery({
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

  return (
    <div className="flex flex-col gap-3">
      <Paper withBorder radius="lg" shadow="md" p="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
          <Select
            label="Customer Number"
            placeholder={isCustomersLoading ? "Loading..." : "Search customer number..."}
            data={customerOptions}
            disabled={isCustomersLoading}
            searchable
            clearable
            rightSection={chevronDown}
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
            disabled={isProductsLoading}
            searchable
            clearable
            rightSection={chevronDown}
            value={form.values.productCode}
            error={form.errors.productCode}
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
            label="Loan A/C Number"
            placeholder="Auto-generated on save"
            value={loanAcNumber}
            disabled
          />
          <TextInput
            label="Loan Application Number"
            {...form.getInputProps("loanAppNumber")}
          />
          <TextInput
            label="Ref Number"
            placeholder="Optional reference"
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
                checked={form.values.isImport}
                onChange={(e) => form.setFieldValue("isImport", e.currentTarget.checked)}
              />
            </Group>
            <TextInput
              type="date"
              disabled={!form.values.isImport}
              {...form.getInputProps("migrationDate")}
            />
          </div>
        </SimpleGrid>
      </Paper>

      <Paper withBorder radius="lg" shadow="md" p="lg">
        <div className="flex flex-col gap-3">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" verticalSpacing="sm">
            <TextInput
              type="date"
              label="Transaction Date"
              disabled
              {...form.getInputProps("trnDate")}
            />
            <TextInput
              type="date"
              label="Value Date"
              {...form.getInputProps("valueDate")}
            />
            <Select
              label="Currency"
              data={CURRENCIES}
              rightSection={chevronDown}
              {...form.getInputProps("currency")}
            />
            <NumberInput
              label="Loan Amount"
              hideControls
              min={0}
              placeholder="0"
              thousandSeparator=","
              {...form.getInputProps("loanAmount")}
            />
          </SimpleGrid>

          {/* Frequency and Repayment Amount swapped */}
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
            <TextInput
              type="date"
              label="Maturity Date"
              placeholder="Auto-calculated"
              value={maturityDate}
              disabled
            />
            <TextInput
              type="date"
              label="Repayment Start Date"
              {...form.getInputProps("repaymentStartDate")}
            />
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