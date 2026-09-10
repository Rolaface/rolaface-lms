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
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  IconSearch,
  IconUser,
  IconBuilding,
  IconFileText,
  IconChevronRight,
  IconCheck,
  IconSparkles,
  IconInbox,
  IconAlertCircle,
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
];

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();

type LoanConfigTypeId = "personal" | "business" | "mortgage";

const LOAN_CONFIG_TYPES: {
  id: LoanConfigTypeId;
  label: string;
  icon: React.FC<any>;
  amountLabel: string;
  subtypes: { id: string; label: string; purposes: string[] }[];
}[] = [
  {
    id: "personal",
    label: "Personal loan",
    icon: IconUser,
    amountLabel: "ZMW 5,000–ZMW 100,000",
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
    amountLabel: "ZMW 20,000–ZMW 500,000",
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
  {
    id: "mortgage",
    label: "Mortgage",
    icon: IconFileText,
    amountLabel: "ZMW 100,000–ZMW 2,000,000",
    subtypes: [
      {
        id: "home-purchase",
        label: "Home purchase",
        purposes: ["Primary residence", "Investment property"],
      },
    ],
  },
];

 const CONFIG_TO_APPLICANT_TYPE: Record<LoanConfigTypeId, LoanType> = {
  personal: "Personal",
  business: "Business",
  mortgage: "Personal",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fz={11}
      fw={600}
      c="slate.5"
      tt="uppercase"
      style={{ letterSpacing: 0.3 }}
      mb={10}
    >
      {children}
    </Text>
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
function Chip({
  label,
  selected,
  onClick,
  readOnly,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) {
  return (
    <UnstyledButton
      onClick={readOnly ? undefined : onClick}
      px={14}
      py={7}
      style={{
        borderRadius: 20,
        fontSize: 12.5,
        fontWeight: 500,
        border: `1.5px solid ${
          selected
            ? "var(--mantine-color-brand-6)"
            : "var(--mantine-color-slate-2)"
        }`,
        background: selected ? "var(--mantine-color-brand-6)" : "white",
        color: selected ? "white" : "var(--mantine-color-slate-7)",
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <Group gap={6} mt={6} wrap="nowrap" align="flex-start">
      <IconAlertCircle
        size={13}
        color="var(--mantine-color-red-6)"
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <Text fz={12.5} c="red.6">
        {children}
      </Text>
    </Group>
  );
}

export function CustomerLoanStep({ form, readOnly = false }: StepProps) {
  const [query, setQuery] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [useManualSelection, setUseManualSelection] = useState(false);
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
    setUseManualSelection(false);
  };

  const handleCustomerTypeChange = (value: "existing" | "new") => {
    form.setFieldValue("customerType", value);
    form.setFieldValue("selectedCustomerId", "");
    form.setFieldValue("selectedOfferId", "");
    setQuery("");
    setUseManualSelection(false);
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

  return (
    <Stack gap={22}>
      <Box>
        <SectionLabel>1. Customer type</SectionLabel>
        <Group grow align="stretch" gap="lg">
          <TypeCard
            icon={IconUser}
            label="Existing customer"
            description="Search for a customer already in the system"
            selected={customerType === "existing"}
            onClick={() => handleCustomerTypeChange("existing")}
          />
          <TypeCard
            icon={IconSparkles}
            label="New customer"
            description="Start a fresh application"
            selected={customerType === "new"}
            onClick={() => handleCustomerTypeChange("new")}
          />
        </Group>
      </Box>

      {customerType === "existing" && (
        <Box>
          <SectionLabel>2. Find customer</SectionLabel>
                   <TextInput
            radius="md"
            leftSection={<IconSearch size={15} />}
            placeholder="Search by name, customer ID, phone, or national ID"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            mb={selectedCustomer ? 18 : 8}
            readOnly={readOnly}
          />

          {customerLoading && (
            <Group gap={8} c="slate.5" fz="sm" mb={12}>
              <Loader size={14} />
              <Text fz="sm">Loading customer…</Text>
            </Group>
          )}

          {!customerLoading &&
            !selectedCustomer &&
            query.trim().length > 0 && (
              <Box
                mb={16}
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  borderRadius: "var(--mantine-radius-md)",
                  overflow: "hidden",
                }}
              >
                {results.length === 0 ? (
                  <Box p="lg" ta="center">
                    <Text fz="sm" fw={500} c="slate.9">
                      No customer found
                    </Text>
                    <Text fz="xs" c="slate.5" mt={2}>
                      Try a different name, ID, or phone number — or continue
                      as a new customer.
                    </Text>
                  </Box>
                ) : (
                  results.map((c, i) => (
                    <UnstyledButton
                      key={c.id}
                      onClick={() => pickCustomer(c)}
                      w="100%"
                      px={14}
                      py={11}
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

          {selectedCustomer && (
            <Group
              gap={14}
              p="md"
              mb={18}
              style={{
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-lg)",
              }}
            >
              <ThemeIcon radius="xl" size={42} variant="light" color="brand">
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
              <ThemeIcon radius="xl" size={22} color="green" variant="light">
                <IconCheck size={13} />
              </ThemeIcon>
            </Group>
          )}

          {selectedCustomer && (
            <Box>
              <SectionLabel>3. Pre-approved offers</SectionLabel>
              <Box
                p="md"
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  borderRadius: "var(--mantine-radius-lg)",
                }}
              >
                {offersLoading ? (
                  <Group gap={8} c="slate.5" fz="sm">
                    <Loader size={14} />
                    <Text fz="sm">Checking for pre-approved offers…</Text>
                  </Group>
                ) : offersForCustomer.length === 0 ? (
                  <Box ta="center" py={6}>
                    <IconInbox
                      size={22}
                      color="var(--mantine-color-slate-3)"
                    />
                    <Text fz="sm" fw={500} c="slate.9" mt={6}>
                      No pre-approved offers available
                    </Text>
                    <Text fz="xs" c="slate.5" mt={2}>
                      Configure a loan for this customer in the next step.
                    </Text>
                  </Box>
                ) : useManualSelection ? (
                  <UnstyledButton
                    onClick={() => setUseManualSelection(false)}
                    fz={12.5}
                    fw={500}
                    c="brand.6"
                  >
                    ← Back to pre-approved offers
                  </UnstyledButton>
                ) : (
                  <Stack gap={10}>
                    {offersForCustomer.map((o) => {
                      const selected = selectedOfferId === o.id;
                      return (
                                               <UnstyledButton
                          key={o.id}
                          onClick={readOnly ? undefined : () => applyOffer(o)}
                          p="md"
                          // style={{ }}
                          style={{ cursor: readOnly ? "default" : "pointer" ,
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
                          <Group justify="space-between" align="flex-start">
                            <Box>
                              <Text fz="sm" fw={600} c="slate.9">
                                {o.product}
                              </Text>
                              <Text fz="xs" c="slate.5" mt={1}>
                                {o.purpose} · {o.validity}
                              </Text>
                            </Box>
                            {selected && (
                              <ThemeIcon
                                radius="xl"
                                size={20}
                                color="brand"
                              >
                                <IconCheck size={12} />
                              </ThemeIcon>
                            )}
                          </Group>
                          <Group gap={18} mt={10} fz={12.5}>
                            <Text fz={12.5} c="slate.5">
                              Amount up to{" "}
                              <Text span fw={600} c="slate.9">
                                {zmw(o.amount)}
                              </Text>
                            </Text>
                            <Text fz={12.5} c="slate.5">
                              Rate{" "}
                              <Text span fw={600} c="slate.9">
                                {o.rate}%
                              </Text>
                            </Text>
                            <Text fz={12.5} c="slate.5">
                              Tenure up to{" "}
                              <Text span fw={600} c="slate.9">
                                {o.tenure} mo
                              </Text>
                            </Text>
                          </Group>
                          <Text fz={11.5} c="slate.4" mt={6}>
                            {o.condition}
                          </Text>
                        </UnstyledButton>
                      );
                    })}
                    <UnstyledButton
                      onClick={() => {
                        form.setFieldValue("selectedOfferId", "");
                        setUseManualSelection(true);
                      }}
                      fz={12.5}
                      fw={500}
                      c="brand.6"
                      py={4}
                    >
                      Choose another loan product instead →
                    </UnstyledButton>
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

            {customerType === "new" && (
        <Box>
          <SectionLabel>2. Applicant type</SectionLabel>
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
        </Box>
      )}

      {((customerType === "existing" && selectedCustomer && !selectedOfferId) ||
        (customerType === "new" && form.values.applicantType)) && (
        <Box>
          <SectionLabel>
            {customerType === "existing"
              ? "4. Loan configuration"
              : "3. Loan configuration"}
          </SectionLabel>

          <Text fz={12.5} fw={500} c="slate.7" mb={8}>
            Loan type
          </Text>
          <SimpleGrid
            cols={3}
            spacing={10}
            mb={selectedLoanConfigType ? 16 : 0}
          >
            {LOAN_CONFIG_TYPES.map((t) => (
              <TypeCard
                key={t.id}
                icon={t.icon}
                label={t.label}
                description={t.amountLabel}
                selected={loanConfigTypeId === t.id}
                onClick={() => handleLoanConfigTypeChange(t.id)}
              />
            ))}
          </SimpleGrid>

          {selectedLoanConfigType && (
            <Box mb={16}>
              <Text fz={12.5} fw={500} c="slate.7" mb={8}>
                Loan sub-type
              </Text>
              <Group gap={8}>
                {selectedLoanConfigType.subtypes.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={loanSubtypeId === s.id}
                    onClick={() => {
                      setLoanSubtypeId(s.id);
                      setLoanPurpose(null);
                    }}
                  />
                ))}
              </Group>
            </Box>
          )}

          {selectedLoanConfigType && loanSubtypeId && (
            <Box>
              <Text fz={12.5} fw={500} c="slate.7" mb={8}>
                Loan purpose
              </Text>
              <Group gap={8}>
                {selectedLoanConfigType.subtypes
                  .find((s) => s.id === loanSubtypeId)!
                  .purposes.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      selected={loanPurpose === p}
                      onClick={() => setLoanPurpose(p)}
                    />
                  ))}
              </Group>
            </Box>
          )}
        </Box>
      )}

      {!customerType && (
        <FieldError>
          Select a customer type to continue.
        </FieldError>
      )}
    </Stack>
  );
}