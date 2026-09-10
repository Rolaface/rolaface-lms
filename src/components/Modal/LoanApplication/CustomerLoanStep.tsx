import { useMemo, useState } from "react";
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
  SimpleGrid,
  Divider,
  Button,
  Pagination,
  Select,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconSearch,
  IconSearchOff,
  IconUser,
  IconIdBadge2,
  IconAdjustmentsHorizontal,
  IconDiscount2,
  IconBuilding,
  IconChevronRight,
  IconCheck,
  IconSparkles,
  IconInbox,
  IconPencil,
  IconArrowLeft,
} from "@tabler/icons-react";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  readOnly?: boolean;
}

export interface DummyCustomer {
  id: string;
  name: string;
  phone: string;
  nrc: string;
  segment: string;
  since: string;
  applicantType: LoanType;
  email: string;
  dob: string; // DD-MMM-YYYY
  gender: string;
  maritalStatus: string;
  address: string;
  nationality: string;
  companyName?: string;
  typeOfBusiness?: string;
  establishedDate?: string;
  natureOfBusiness?: string;
  registeredOffice?: string;
  nextOfKin?: { name: string; phone: string; relationship: string } | null;
}

export interface DummyOffer {
  id: string;
  customerId: string;
  product: string;
  amount: number;
  rate: number;
  tenure: number;
  purpose: string;
  validity: string;
  condition: string;
}

const DUMMY_CUSTOMERS: DummyCustomer[] = [
  {
    id: "CU-10234",
    name: "Chanda Mwansa",
    phone: "0977123456",
    nrc: "123456/78/1",
    segment: "Salaried — Ministry of Health",
    since: "Customer since 2021",
    applicantType: "Personal",
    email: "chanda.mwansa@example.com",
    dob: "14-Mar-1990",
    gender: "Female",
    maritalStatus: "Married",
    address: "Plot 22, Kabulonga, Lusaka",
    nationality: "Zambian",
    nextOfKin: {
      name: "Mwansa Mwansa",
      phone: "0977456789",
      relationship: "Spouse",
    },
  },
  {
    id: "CU-10892",
    name: "Bwalya Phiri",
    phone: "0966552310",
    nrc: "234567/11/2",
    segment: "Self-employed — Retail",
    since: "Customer since 2023",
    applicantType: "Personal",
    email: "bwalya.phiri@example.com",
    dob: "02-Jul-1985",
    gender: "Male",
    maritalStatus: "Single",
    address: "House 4B, Chilenje, Lusaka",
    nationality: "Zambian",
    nextOfKin: null,
  },
  {
    id: "CU-11045",
    name: "Kalingalinga Traders Ltd",
    phone: "0955903217",
    nrc: "345678/22/3",
    segment: "Business — Wholesale",
    since: "Customer since 2019",
    applicantType: "Business",
    email: "info@kalingalingatraders.com",
    dob: "",
    gender: "",
    maritalStatus: "",
    address: "Plot 9, Roma, Lusaka",
    nationality: "Zambian",
    companyName: "Kalingalinga Traders Ltd",
    typeOfBusiness: "Private Limited Company",
    establishedDate: "12-Jan-2015",
    natureOfBusiness: "Wholesale of building materials",
    registeredOffice: "Plot 9, Roma, Lusaka",
    nextOfKin: null,
  },
];

const DUMMY_OFFERS: DummyOffer[] = [
  {
    id: "OF-1",
    customerId: "CU-10234",
    product: "Personal Loan — Salary Advance",
    amount: 35000,
    rate: 22,
    tenure: 18,
    purpose: "General purpose",
    validity: "Valid until 30 Sep 2026",
    condition: "Requires latest payslip on file",
  },
  {
    id: "OF-2",
    customerId: "CU-10234",
    product: "Personal Loan — Top-up",
    amount: 15000,
    rate: 20,
    tenure: 12,
    purpose: "Top-up on existing facility",
    validity: "Valid until 15 Oct 2026",
    condition: "Existing loan must be in good standing",
  },
  {
    id: "OF-3",
    customerId: "CU-11045",
    product: "Business Loan — Working Capital",
    amount: 80000,
    rate: 24,
    tenure: 24,
    purpose: "Stock purchase",
    validity: "Valid until 05 Nov 2026",
    condition: "Subject to updated financials",
  },
  {
    id: "OF-4",
    customerId: "CU-10234",
    product: "Personal Loan — Education",
    amount: 20000,
    rate: 21,
    tenure: 24,
    purpose: "Education",
    validity: "Valid until 20 Oct 2026",
    condition: "Requires proof of enrollment",
  },
];

const OFFERS_PAGE_SIZE = 4;

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();

type LoanConfigTypeId = "personal" | "business";

const LOAN_CONFIG_TYPES: {
  id: LoanConfigTypeId;
  label: string;
  icon: React.FC<any>;
  subtypes: { id: string; label: string; purposes: string[] }[];
}[] = [
  {
    id: "personal",
    label: "Personal loan",
    icon: IconUser,
    subtypes: [
      {
        id: "salary",
        label: "Salary-backed",
        purposes: [
          "Home improvement",
          "Education",
          "Medical",
          "Debt consolidation",
          "Other",
        ],
      },
      {
        id: "consumer",
        label: "Consumer loan",
        purposes: ["Vehicle purchase", "Appliances", "Travel", "Other"],
      },
    ],
  },
  {
    id: "business",
    label: "Business loan",
    icon: IconBuilding,
    subtypes: [
      {
        id: "working-capital",
        label: "Working capital",
        purposes: ["Stock purchase", "Cash flow support", "Other"],
      },
      {
        id: "asset-finance",
        label: "Asset finance",
        purposes: ["Equipment purchase", "Vehicle fleet", "Other"],
      },
    ],
  },
];

 const CONFIG_TO_APPLICANT_TYPE: Record<LoanConfigTypeId, LoanType> = {
  personal: "Personal",
  business: "Business",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fz={11}
      fw={700}
      c="slate.5"
      tt="uppercase"
      style={{ letterSpacing: 0.3 }}
      mb={10}
    >
      {children}
    </Text>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.FC<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
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
      <Group justify="space-between" align="center" mb={12} wrap="nowrap">
        <Group gap={10} wrap="nowrap">
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
        {action}
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
        border: `1.5px solid ${
          selected
            ? "var(--mantine-color-brand-6)"
            : "var(--mantine-color-slate-3)"
        }`,
        background: selected ? "var(--mantine-color-brand-0)" : "white",
        textAlign: "left",
        cursor: readOnly ? "default" : "pointer",
        opacity: readOnly && !selected ? 0.55 : 1,
      }}
    >
      <ThemeIcon
        radius="md"
        size={36}
        variant={selected ? "filled" : "light"}
        color="brand"
      >
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
        border: `1.5px solid ${
          selected
            ? "var(--mantine-color-brand-6)"
            : "var(--mantine-color-slate-2)"
        }`,
        background: selected ? "var(--mantine-color-brand-6)" : "white",
        cursor: readOnly ? "default" : "pointer",
      }}
    >
      <Icon
        size={15}
        color={selected ? "white" : "var(--mantine-color-slate-6)"}
      />
      <Text fz="sm" fw={600} c={selected ? "white" : "slate.7"}>
        {label}
      </Text>
    </UnstyledButton>
  );
}

function OfferStat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fz={10} fw={700} c="slate.4" tt="uppercase" style={{ letterSpacing: 0.3 }}>
        {label}
      </Text>
      <Text fz={13} fw={700} c="slate.9" mt={1}>
        {value}
      </Text>
    </Box>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.FC<any>;
  title: string;
  description: string;
}) {
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
  const [customerLoading, setCustomerLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [existingView, setExistingView] = useState<"offers" | "configure">(
    "offers",
  );
  const [offersPage, setOffersPage] = useState(0);
  const [loanConfigTypeId, setLoanConfigTypeId] =
    useState<LoanConfigTypeId | null>(null);
  const [loanSubtypeId, setLoanSubtypeId] = useState<string | null>(null);
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);

  const customerType = form.values.customerType;
  const selectedCustomerId = form.values.selectedCustomerId;
  const selectedCustomer =
    DUMMY_CUSTOMERS.find((c) => c.id === selectedCustomerId) || null;
  const selectedOfferId = form.values.selectedOfferId;

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    const q = query.toLowerCase();
    return DUMMY_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(query) ||
        c.nrc.includes(query),
    );
  }, [query]);

  const offersForCustomer = selectedCustomer
    ? DUMMY_OFFERS.filter((o) => o.customerId === selectedCustomer.id)
    : [];

  const totalOffersPages = Math.ceil(
    offersForCustomer.length / OFFERS_PAGE_SIZE,
  );
  const pagedOffers = offersForCustomer.slice(
    offersPage * OFFERS_PAGE_SIZE,
    offersPage * OFFERS_PAGE_SIZE + OFFERS_PAGE_SIZE,
  );

  // Applies a dummy customer's record onto the shared form, including
  // their applicantType, so every downstream step (Applicant Info,
  // Residence & Employment, Documents) renders the correct Personal /
  // Business fields automatically.
  const applyCustomerToForm = (customer: DummyCustomer) => {
    form.setFieldValue("selectedCustomerId", customer.id);
    form.setFieldValue("applicantType", customer.applicantType);
    form.setFieldValue(
      "loanType",
      customer.applicantType === "Business" ? "Business" : "Personal",
    );

    if (customer.applicantType === "Personal") {
      const [firstName, ...rest] = customer.name.split(" ");
      form.setFieldValue("firstName", firstName || "");
      form.setFieldValue("surname", rest.join(" "));
      form.setFieldValue("nrc", customer.nrc);
      form.setFieldValue("phone", customer.phone);
      form.setFieldValue("email", customer.email);
      form.setFieldValue("birthDate", customer.dob);
      form.setFieldValue("gender", customer.gender || null);
      form.setFieldValue("maritalStatus", customer.maritalStatus || null);
      form.setFieldValue("residentialAddress", customer.address);
      form.setFieldValue("nationality", customer.nationality || null);
      if (customer.nextOfKin) {
        form.setFieldValue("kinName", customer.nextOfKin.name);
        form.setFieldValue("kinPhone", customer.nextOfKin.phone);
        form.setFieldValue(
          "kinRelationship",
          customer.nextOfKin.relationship,
        );
      }
    } else {
      form.setFieldValue("companyName", customer.companyName || "");
      form.setFieldValue("typeOfBusiness", customer.typeOfBusiness || null);
      form.setFieldValue("establishedDate", customer.establishedDate || "");
      form.setFieldValue("natureOfBusiness", customer.natureOfBusiness || "");
      form.setFieldValue("registeredOffice", customer.registeredOffice || "");
      form.setFieldValue("applicantEmail", customer.email);
      form.setFieldValue("applicantPhone", customer.phone);
      form.setFieldValue("applicantAddress", customer.address);
      form.setFieldValue("applicantNationality", customer.nationality || null);
    }
  };

  const pickCustomer = (customer: DummyCustomer) => {
    setCustomerLoading(true);
    setTimeout(() => {
      applyCustomerToForm(customer);
      setCustomerLoading(false);
      setExistingView("offers");
      setOffersPage(0);
      setOffersLoading(true);
      setTimeout(() => setOffersLoading(false), 500);
    }, 500);
  };

  const applyOffer = (offer: DummyOffer) => {
    form.setFieldValue("selectedOfferId", offer.id);
    form.setFieldValue("loanAmount", offer.amount);
    form.setFieldValue("tenureMonths", offer.tenure);
    form.setFieldValue("purposeOfLoan", offer.purpose);
    form.setFieldValue("principalObjective", offer.purpose);
  };

  const handleCustomerTypeChange = (value: "existing" | "new") => {
    form.setFieldValue("customerType", value);
    form.setFieldValue("selectedCustomerId", "");
    form.setFieldValue("selectedOfferId", "");
    setQuery("");
    setExistingView("offers");
    setOffersPage(0);
  };

  const clearSelectedCustomer = () => {
    form.setFieldValue("selectedCustomerId", "");
    form.setFieldValue("selectedOfferId", "");
    setQuery("");
    setExistingView("offers");
    setOffersPage(0);
  };

   const handleApplicantTypeChange = (value: LoanType) => {
    form.setFieldValue("applicantType", value);
    form.setFieldValue("loanType", value);
  };

  const handleLoanConfigTypeChange = (id: LoanConfigTypeId) => {
    setLoanConfigTypeId(id);
    setLoanSubtypeId(null);
    setLoanPurpose(null);
    form.setFieldValue("applicantType", CONFIG_TO_APPLICANT_TYPE[id]);
    form.setFieldValue("loanType", CONFIG_TO_APPLICANT_TYPE[id]);
  };

  const selectedLoanConfigType = LOAN_CONFIG_TYPES.find(
    (t) => t.id === loanConfigTypeId,
  );

  const loanConfigBody = (
    <>
      <Box>
        <FieldLabel>Loan type</FieldLabel>
        <Group gap={8}>
          {LOAN_CONFIG_TYPES.map((t) => (
            <IconChip
              key={t.id}
              icon={t.icon}
              label={t.label}
              selected={loanConfigTypeId === t.id}
              onClick={() => handleLoanConfigTypeChange(t.id)}
            />
          ))}
        </Group>
      </Box>

      {selectedLoanConfigType && (
        <>
          <Divider my={16} color="slate.1" />
          <Group align="flex-start" gap={16} wrap="wrap">
            <Box style={{ flex: "1 1 200px", maxWidth: 360 }}>
              <FieldLabel>Loan sub-type</FieldLabel>
              <Select
                radius="md"
                placeholder="Select a sub-type"
                data={selectedLoanConfigType.subtypes.map((s) => ({
                  value: s.id,
                  label: s.label,
                }))}
                value={loanSubtypeId}
                onChange={(value) => {
                  setLoanSubtypeId(value);
                  setLoanPurpose(null);
                }}
                disabled={readOnly}
                comboboxProps={{ withinPortal: true }}
              />
            </Box>

            {loanSubtypeId && (
              <Box style={{ flex: "1 1 200px", maxWidth: 360 }}>
                <FieldLabel>Loan purpose</FieldLabel>
                <Select
                  radius="md"
                  placeholder="Select a purpose"
                  data={selectedLoanConfigType.subtypes
                    .find((s) => s.id === loanSubtypeId)!
                    .purposes.map((p) => ({ value: p, label: p }))}
                  value={loanPurpose}
                  onChange={(value) => setLoanPurpose(value)}
                  disabled={readOnly}
                  comboboxProps={{ withinPortal: true }}
                />
              </Box>
            )}
          </Group>
        </>
      )}
    </>
  );

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
          {customerType === "existing" ? (
            !selectedCustomer ? (
                <Box style={{ width: 340, maxWidth: "100%" }}>
                  <TextInput
                    radius="md"
                    leftSection={<IconSearch size={15} />}
                    placeholder="Search name, customer ID, phone, or NRC"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    readOnly={readOnly}
                    autoFocus
                  />

                  {customerLoading && (
                    <Group gap={8} c="slate.5" fz="sm" mt={10}>
                      <Loader size={14} />
                      <Text fz="sm">Loading customer…</Text>
                    </Group>
                  )}

                  {!customerLoading && query.trim().length > 0 && (
                    <Box
                      mt={8}
                      style={{
                        border: "1px solid var(--mantine-color-slate-2)",
                        borderRadius: "var(--mantine-radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      {results.length === 0 ? (
                        <EmptyState
                          icon={IconSearchOff}
                          title="No customer found"
                          description="Try a different name, ID, or phone number — or continue as a new customer."
                        />
                      ) : (
                        results.map((c, i) => (
                          <UnstyledButton
                            key={c.id}
                            onClick={() => pickCustomer(c)}
                            w="100%"
                            px={14}
                            py={11}
                            className="hover:bg-slate-50 transition-colors"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderTop:
                                i > 0
                                  ? "1px solid var(--mantine-color-slate-1)"
                                  : "none",
                            }}
                          >
                            <Box>
                              <Text fz="sm" fw={600} c="slate.9">
                                {c.name}
                              </Text>
                              <Text fz="xs" c="slate.5">
                                {c.id} · {c.phone}
                              </Text>
                            </Box>
                            <IconChevronRight
                              size={15}
                              color="var(--mantine-color-slate-4)"
                            />
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
                      {selectedCustomer.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </ThemeIcon>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={8}>
                      <Text fz="sm" fw={600} c="slate.9">
                        {selectedCustomer.name}
                      </Text>
                      <Badge size="xs" color="brand" variant="light">
                        {selectedCustomer.id}
                      </Badge>
                      <Badge
                        size="xs"
                        color={
                          selectedCustomer.applicantType === "Business"
                            ? "grape"
                            : "blue"
                        }
                        variant="light"
                      >
                        {selectedCustomer.applicantType}
                      </Badge>
                    </Group>
                    <Text fz="xs" c="slate.5" mt={2}>
                      {selectedCustomer.segment} · {selectedCustomer.since} ·{" "}
                      {selectedCustomer.phone}
                    </Text>
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
              onClick={() => handleCustomerTypeChange("existing")}
              readOnly={readOnly}
            />
          )}

          <IconChip
            icon={IconSparkles}
            label="New customer"
            selected={customerType === "new"}
            onClick={() => handleCustomerTypeChange("new")}
            readOnly={readOnly}
          />
        </Group>
      </Box>

      {customerType === "existing" && selectedCustomer && (
        existingView === "offers" ? (
          <SectionCard
            icon={IconDiscount2}
            title="Pre-approved offers"
            action={
              !offersLoading ? (
                <Button
                  variant="light"
                  color="brand"
                  size="xs"
                  radius="md"
                  onClick={() => setExistingView("configure")}
                >
                  Choose Another Product
                </Button>
              ) : undefined
            }
          >
            {offersLoading ? (
              <Group gap={8} c="slate.5" fz="sm">
                <Loader size={14} />
                <Text fz="sm">Checking for pre-approved offers…</Text>
              </Group>
            ) : offersForCustomer.length === 0 ? (
              <EmptyState
                icon={IconInbox}
                title="No pre-approved offers available"
                description="This customer has no pre-approved offers yet. Use “Choose Another Product” to configure a loan manually."
              />
            ) : (
              <Stack gap={12}>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={10}>
                  {pagedOffers.map((o) => {
                    const selected = selectedOfferId === o.id;
                    return (
                      <UnstyledButton
                        key={o.id}
                        onClick={readOnly ? undefined : () => applyOffer(o)}
                        p="md"
                        style={{
                          cursor: readOnly ? "default" : "pointer",
                          border: `1.5px solid ${
                            selected
                              ? "var(--mantine-color-brand-6)"
                              : "var(--mantine-color-slate-2)"
                          }`,
                          background: selected
                            ? "var(--mantine-color-brand-0)"
                            : "white",
                          borderRadius: "var(--mantine-radius-md)",
                        }}
                      >
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Box style={{ minWidth: 0 }}>
                            <Text fz="sm" fw={700} c="slate.9">
                              {o.product}
                            </Text>
                            <Text fz="xs" c="slate.5" mt={1}>
                              {o.purpose} · {o.validity}
                            </Text>
                          </Box>
                          {selected && (
                            <ThemeIcon radius="xl" size={20} color="brand" style={{ flexShrink: 0 }}>
                              <IconCheck size={12} />
                            </ThemeIcon>
                          )}
                        </Group>
                        <Divider my={10} color="slate.1" />
                        <SimpleGrid cols={3} spacing={4}>
                          <OfferStat label="Amount up to" value={zmw(o.amount)} />
                          <OfferStat label="Rate" value={`${o.rate}%`} />
                          <OfferStat label="Tenure up to" value={`${o.tenure} mo`} />
                        </SimpleGrid>
                        <Text fz={11.5} c="slate.4" mt={10}>
                          {o.condition}
                        </Text>
                      </UnstyledButton>
                    );
                  })}
                </SimpleGrid>

                {totalOffersPages > 1 && (
                  <Group justify="center" mt={2}>
                    <Pagination
                      total={totalOffersPages}
                      value={offersPage + 1}
                      onChange={(p) => setOffersPage(p - 1)}
                      size="sm"
                      radius="md"
                      color="brand"
                    />
                  </Group>
                )}
              </Stack>
            )}
          </SectionCard>
        ) : (
          <SectionCard
            icon={IconAdjustmentsHorizontal}
            title="Loan configuration"
            description="Narrow down the loan type, sub-type, and purpose"
            action={
              <Button
                variant="subtle"
                color="brand"
                size="xs"
                radius="md"
                leftSection={<IconArrowLeft size={13} />}
                onClick={() => setExistingView("offers")}
              >
                Back to Pre-approved Loans
              </Button>
            }
          >
            {loanConfigBody}
          </SectionCard>
        )
      )}

      {customerType === "new" && (
        <Box
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Box style={{ flex: "1 1 380px", minWidth: 320 }}>
            <SectionCard
              icon={IconIdBadge2}
              title="Applicant type"
              description="Choose who this application is for"
            >
              <Group grow align="stretch" gap="lg">
                <TypeCard
                  icon={IconUser}
                  label="Individual"
                  description="Personal loan applicant"
                  selected={form.values.applicantType === "Personal"}
                  onClick={() => handleApplicantTypeChange("Personal")}
                />
                <TypeCard
                  icon={IconBuilding}
                  label="Business"
                  description="Registered business entity"
                  selected={form.values.applicantType === "Business"}
                  onClick={() => handleApplicantTypeChange("Business")}
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
              {loanConfigBody}
            </SectionCard>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
