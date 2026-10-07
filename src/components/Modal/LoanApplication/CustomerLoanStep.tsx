import { useState } from "react";
import {
  Box,
  Group,
  Text,
  TextInput,
  Stack,
  ThemeIcon,
  UnstyledButton,
  Loader,
  Badge,
  Divider,
  Select,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconSearch,
  IconSearchOff,
  IconUser,
  IconIdBadge2,
  IconAdjustmentsHorizontal,
  IconBuilding,
  IconBriefcase,
  IconChevronRight,
  IconCheck,
  IconSparkles,
  IconPencil,
} from "@tabler/icons-react";
import { getAllCustomers } from "../../../api/customerApi";
import type { ApplicantType, LoanApplicationValues } from "./form";
import { usePurposeOptions, useSubTypeOptions, useLoanTypeOptions, type Option } from "./lookups";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fz={11} fw={700} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.3 }} mb={10}>
      {children}
    </Text>
  );
}

function ErrorText({ error }: { error: React.ReactNode }) {
  if (!error) return null;
  return (
    <Text fz="xs" c="red.6" mt={6}>
      {error}
    </Text>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.FC<any>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      p="md"
      style={{
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-lg)",
        background: "var(--mantine-color-white)",
        height: "100%",
      }}
    >
      <Group gap={10} wrap="nowrap" mb={12}>
        <ThemeIcon radius="md" size={28} variant="light" color="brand">
          <Icon size={15} />
        </ThemeIcon>
        <Box>
          <Text fz="sm" fw={700} c="slate.9">
            {title}
          </Text>
          {description && (
            <Text fz={11.5} c="slate.5" mt={1}>
              {description}
            </Text>
          )}
        </Box>
      </Group>
      {children}
    </Box>
  );
}

function TypeCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
  readOnly,
}: {
  icon: React.FC<any>;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) {
  return (
    <UnstyledButton
      onClick={readOnly ? undefined : onClick}
      p="md"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: "var(--mantine-radius-md)",
        border: `1.5px solid ${selected ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-3)"}`,
        background: selected ? "var(--mantine-color-brand-0)" : "white",
        textAlign: "left",
        cursor: readOnly ? "default" : "pointer",
        opacity: readOnly && !selected ? 0.55 : 1,
      }}
    >
      <ThemeIcon radius="md" size={36} variant={selected ? "filled" : "light"} color="brand">
        <Icon size={17} />
      </ThemeIcon>
      <Box>
        <Text fz="sm" fw={700} c={selected ? "brand.8" : "slate.9"} mb={2}>
          {label}
        </Text>
        <Text fz="xs" c={selected ? "brand.7" : "slate.5"}>
          {description}
        </Text>
      </Box>
    </UnstyledButton>
  );
}

function IconChip({
  icon: Icon,
  label,
  selected,
  onClick,
  readOnly,
}: {
  icon: React.FC<any>;
  label: string;
  selected: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) {
  return (
    <UnstyledButton
      onClick={readOnly ? undefined : onClick}
      px={16}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 30,
        borderRadius: "var(--mantine-radius-md)",
        border: `1.5px solid ${selected ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"}`,
        background: selected ? "var(--mantine-color-brand-6)" : "white",
        cursor: readOnly ? "default" : "pointer",
      }}
    >
      <Icon size={15} color={selected ? "white" : "var(--mantine-color-slate-6)"} />
      <Text fz="sm" fw={600} c={selected ? "white" : "slate.7"}>
        {label}
      </Text>
    </UnstyledButton>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.FC<any>; title: string; description: string }) {
  return (
    <Stack align="center" gap={6} py={14}>
      <ThemeIcon radius="xl" size={40} variant="light" color="slate">
        <Icon size={19} />
      </ThemeIcon>
      <Text fz="sm" fw={600} c="slate.9">
        {title}
      </Text>
      <Text fz="xs" c="slate.5" ta="center" maw={280}>
        {description}
      </Text>
    </Stack>
  );
}

export function CustomerLoanStep({ form, readOnly = false }: StepProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query.trim(), 300);
  const { values } = form;
  const { customer_type: customerType, applicant_type: applicantType } = values;

  const { data: customersRes, isFetching: customersLoading } = useQuery({
    queryKey: ["customer-search", debouncedQuery],
    queryFn: () => getAllCustomers({ search: debouncedQuery }),
    enabled: customerType === "Existing" && !values.customer && debouncedQuery.length > 0,
  });
  const customers: Option[] = customersRes?.data ?? [];

  const { options: loanTypeOptions, isLoading: loanTypesLoading } = useLoanTypeOptions(applicantType);
  const { options: subTypeOptions } = useSubTypeOptions(values.loan_type);
  const { options: purposeOptions } = usePurposeOptions(values.loan_sub_type);

  const handleCustomerTypeChange = (value: "Existing" | "New") => {
    form.setFieldValue("customer_type", value);
    form.setFieldValue("customer", null);
    form.setFieldValue("customer_name", "");
    setQuery("");
  };

  const pickCustomer = (customer: Option) => {
    form.setFieldValue("customer", customer.value);
    form.setFieldValue("customer_name", customer.label || customer.value);
  };

  const clearSelectedCustomer = () => {
    form.setFieldValue("customer", null);
    form.setFieldValue("customer_name", "");
    setQuery("");
  };

  const handleApplicantTypeChange = (value: ApplicantType) => {
    if (value === applicantType) return;
    form.setFieldValue("applicant_type", value);
    form.setFieldValue("loan_type", null);
    form.setFieldValue("loan_sub_type", null);
    form.setFieldValue("loan_purpose", null);
  };

  const handleLoanTypeChange = (id: string) => {
    form.setFieldValue("loan_type", id);
    form.setFieldValue("loan_sub_type", null);
    form.setFieldValue("loan_purpose", null);
  };

  const loanTypeIcon = applicantType === "Business" ? IconBriefcase : IconUser;
  const showConfiguration = customerType === "New" || (customerType === "Existing" && !!values.customer);

  return (
    <Stack gap={16}>
      <Box
        p="md"
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-lg)",
          background: "var(--mantine-color-white)",
        }}
      >
        <Group gap={10} wrap="nowrap" align="flex-start">
          {customerType === "Existing" ? (
            !values.customer ? (
              <Box style={{ width: 340, maxWidth: "100%" }}>
                <TextInput
                  radius="md"
                  leftSection={<IconSearch size={15} />}
                  rightSection={customersLoading ? <Loader size={14} /> : null}
                  placeholder="Search customer name or ID"
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  readOnly={readOnly}
                  error={form.errors.customer}
                  autoFocus
                />

                {debouncedQuery.length > 0 && !customersLoading && (
                  <Box
                    mt={8}
                    style={{
                      border: "1px solid var(--mantine-color-slate-2)",
                      borderRadius: "var(--mantine-radius-md)",
                      overflow: "hidden",
                    }}
                  >
                    {customers.length === 0 ? (
                      <EmptyState
                        icon={IconSearchOff}
                        title="No customer found"
                        description="Try a different name or ID — or continue as a new customer."
                      />
                    ) : (
                      customers.map((c, i) => (
                        <UnstyledButton
                          key={c.value}
                          onClick={() => pickCustomer(c)}
                          w="100%"
                          px={14}
                          py={11}
                          className="hover:bg-slate-50 transition-colors"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : "none",
                          }}
                        >
                          <Box>
                            <Text fz="sm" fw={600} c="slate.9">
                              {c.label || c.value}
                            </Text>
                            <Text fz="xs" c="slate.5">
                              {c.value}
                            </Text>
                          </Box>
                          <IconChevronRight size={15} color="var(--mantine-color-slate-4)" />
                        </UnstyledButton>
                      ))
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Group gap={12} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <ThemeIcon radius="xl" size={40} variant="light" color="brand">
                  <Text fz="sm" fw={700}>
                    {(values.customer_name || values.customer)
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </ThemeIcon>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8}>
                    <Text fz="sm" fw={600} c="slate.9">
                      {values.customer_name || values.customer}
                    </Text>
                    <Badge size="xs" color="brand" variant="light">
                      {values.customer}
                    </Badge>
                  </Group>
                </Box>
                {!readOnly && (
                  <UnstyledButton
                    onClick={clearSelectedCustomer}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <IconPencil size={12} color="var(--mantine-color-brand-6)" />
                    <Text fz={12.5} fw={600} c="brand.6">
                      Change
                    </Text>
                  </UnstyledButton>
                )}
                <ThemeIcon radius="xl" size={20} color="green" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
              </Group>
            )
          ) : (
            <IconChip
              icon={IconSearch}
              label="Existing customer"
              selected={false}
              onClick={() => handleCustomerTypeChange("Existing")}
              readOnly={readOnly}
            />
          )}

          <IconChip
            icon={IconSparkles}
            label="New customer"
            selected={customerType === "New"}
            onClick={() => handleCustomerTypeChange("New")}
            readOnly={readOnly}
          />
        </Group>
        <ErrorText error={form.errors.customer_type && "Choose an existing or new customer"} />
      </Box>

      {showConfiguration && (
        <Box style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <Box style={{ flex: "1 1 380px", minWidth: 320 }}>
            <SectionCard icon={IconIdBadge2} title="Applicant type" description="Choose who this application is for">
              <Group grow align="stretch" gap="lg">
                <TypeCard
                  icon={IconUser}
                  label="Individual"
                  description="Personal loan applicant"
                  selected={applicantType === "Individual"}
                  onClick={() => handleApplicantTypeChange("Individual")}
                  readOnly={readOnly}
                />
                <TypeCard
                  icon={IconBuilding}
                  label="Business"
                  description="Registered business entity"
                  selected={applicantType === "Business"}
                  onClick={() => handleApplicantTypeChange("Business")}
                  readOnly={readOnly}
                />
              </Group>
            </SectionCard>
          </Box>

          <Box style={{ flex: "1 1 380px", minWidth: 320 }}>
            <SectionCard
              icon={IconAdjustmentsHorizontal}
              title="Loan configuration"
              description="Narrow down the loan type, sub-type, and purpose"
            >
              <Box>
                <FieldLabel>Loan type</FieldLabel>
                {loanTypesLoading ? (
                  <Loader size={14} />
                ) : loanTypeOptions.length === 0 ? (
                  <Text fz="xs" c="slate.5">
                    No active {applicantType.toLowerCase()} loan types. Add them in Loan Type Setup.
                  </Text>
                ) : (
                  <Group gap={8}>
                    {loanTypeOptions.map((t) => (
                      <IconChip
                        key={t.value}
                        icon={loanTypeIcon}
                        label={t.label}
                        selected={values.loan_type === t.value}
                        onClick={() => handleLoanTypeChange(t.value)}
                        readOnly={readOnly}
                      />
                    ))}
                  </Group>
                )}
                <ErrorText error={form.errors.loan_type} />
              </Box>

              {values.loan_type && (
                <>
                  <Divider my={16} color="slate.1" />
                  <Group align="flex-start" gap={16} wrap="wrap">
                    <Box style={{ flex: "1 1 200px", maxWidth: 360 }}>
                      <FieldLabel>Loan sub-type</FieldLabel>
                      <Select
                        radius="md"
                        placeholder="Select a sub-type"
                        data={subTypeOptions}
                        value={values.loan_sub_type}
                        onChange={(value) => {
                          form.setFieldValue("loan_sub_type", value);
                          form.setFieldValue("loan_purpose", null);
                        }}
                        error={form.errors.loan_sub_type}
                        disabled={readOnly}
                        comboboxProps={{ withinPortal: true }}
                      />
                    </Box>

                    {values.loan_sub_type && (
                      <Box style={{ flex: "1 1 200px", maxWidth: 360 }}>
                        <FieldLabel>Loan purpose</FieldLabel>
                        <Select
                          radius="md"
                          placeholder="Select a purpose"
                          data={purposeOptions}
                          {...form.getInputProps("loan_purpose")}
                          disabled={readOnly}
                          comboboxProps={{ withinPortal: true }}
                        />
                      </Box>
                    )}
                  </Group>
                </>
              )}
            </SectionCard>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
