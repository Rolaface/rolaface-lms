import { useState } from "react";
import {
  TextInput,
  Select,
  SegmentedControl,
  Stack,
  Group,
  Text,
  NumberInput,
  Grid,
  Box,
  Switch,
} from "@mantine/core";
import {
  IconChevronDown,
  IconClipboardCheck,
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";
import { DatePickerInput } from "@mantine/dates";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { calcAge } from "../../../../utils/customer/utils";
import {
  useGenders,
  useIndustries,
  useCountries,
} from "../../../../hooks/common/useLookups";
import { useDebouncedValue } from "@mantine/hooks";

// TODO: replace with real staff lookup (useStaff hook / API) once available.
// Kept as temporary UI data only — not part of the final architecture.
const staffOptions = [
  { value: "EMP001", label: "EMP001 - John Banda" },
  { value: "EMP002", label: "EMP002 - Mary Phiri" },
  { value: "EMP003", label: "EMP003 - Peter Mwansa" },
];

interface IdentityStepProps {
  customerNumber: string;
  customerType: string;
  setCustomerType: (v: string) => void;
  customerCategory: string | null;
  setCustomerCategory: (v: string | null) => void;
  isStaffCustomer: boolean;
  setIsStaffCustomer: (v: boolean) => void;
  staffId: string | null;
  setStaffId: (v: string | null) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  middleName: string;
  setMiddleName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  preferredName: string;
  setPreferredName: (v: string) => void;
  gender: string | null;
  setGender: (v: string | null) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  nationality: string | null;
  setNationality: (v: string | null) => void;
  maritalStatus: string | null;
  setMaritalStatus: (v: string | null) => void;
  occupation: string;
  setOccupation: (v: string) => void;
  industry: string | null;
  setIndustry: (v: string | null) => void;
  employer: string;
  setEmployer: (v: string) => void;

  companyName: string;
  setCompanyName: (v: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  incorporationDate: string;
  setIncorporationDate: (v: string) => void;
  businessAddress: string;
  setBusinessAddress: (v: string) => void;
  businessAddressLine2: string;
  setBusinessAddressLine2: (v: string) => void;
  businessIndustry: string | null;
  setBusinessIndustry: (v: string | null) => void;
  numberOfEmployees: number | "";
  setNumberOfEmployees: (v: number | "") => void;
  annualRevenue: number | "";
  setAnnualRevenue: (v: number | "") => void;
  businessCity: string;
  setBusinessCity: (v: string) => void;
  businessProvince: string | null;
  setBusinessProvince: (v: string | null) => void;
  businessCountry: string | null;
  setBusinessCountry: (v: string | null) => void;
  businessPostalCode: string;
  setBusinessPostalCode: (v: string) => void;

  errors?: Record<string, string>;
}

const customerCategoryOptions = [
  { value: "Retail", label: "Retail" },
  { value: "SME", label: "SME" },
  { value: "Corporate", label: "Corporate" },
];

const customerMaritalOptions = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Separated", label: "Separated" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
  { value: "Annulled", label: "Annulled" },
  { value: "Not Disclosed", label: "Not Disclosed" },
];

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

const FIELD_MAW = 260;

export function IdentityStep(props: IdentityStepProps) {
  const { data: genderOptions, isLoading: gendersLoading } = useGenders();
  const [industrySearch, setIndustrySearch] = useState("");
  const [debouncedIndustrySearch] = useDebouncedValue(industrySearch, 300);
  const { data: industryOptions, isLoading: industriesLoading } = useIndustries(
    debouncedIndustrySearch,
  );

  const [nationalitySearch, setNationalitySearch] = useState("");
  const [debouncedNationalitySearch] = useDebouncedValue(
    nationalitySearch,
    300,
  );
  const { data: nationalityOptions, isLoading: nationalitiesLoading } =
    useCountries(debouncedNationalitySearch);

  const [businessCountrySearch, setBusinessCountrySearch] = useState("");
  const [debouncedBusinessCountrySearch] = useDebouncedValue(
    businessCountrySearch,
    300,
  );
  const { data: businessCountryOptions, isLoading: businessCountriesLoading } =
    useCountries(debouncedBusinessCountrySearch);

  const {
    customerNumber,
    customerType,
    setCustomerType,
    customerCategory,
    setCustomerCategory,
    isStaffCustomer,
    setIsStaffCustomer,
    staffId,
    setStaffId,
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    preferredName,
    setPreferredName,
    gender,
    setGender,
    dateOfBirth,
    setDateOfBirth,
    nationality,
    setNationality,
    maritalStatus,
    setMaritalStatus,
    occupation,
    setOccupation,
    industry,
    setIndustry,
    employer,
    setEmployer,
    companyName,
    setCompanyName,
    registrationNumber,
    setRegistrationNumber,
    incorporationDate,
    setIncorporationDate,
    businessAddress,
    setBusinessAddress,
    businessAddressLine2,
    setBusinessAddressLine2,
    businessIndustry,
    setBusinessIndustry,
    numberOfEmployees,
    setNumberOfEmployees,
    annualRevenue,
    setAnnualRevenue,
    businessCity,
    setBusinessCity,
    businessProvince,
    setBusinessProvince,
    businessCountry,
    setBusinessCountry,
    businessPostalCode,
    setBusinessPostalCode,
    errors = {},
  } = props;

  const isBusiness = customerType === "Business";

  const typeToggle = (
    <SegmentedControl
      size="xs"
      radius="md"
      value={customerType}
      onChange={setCustomerType}
      color="brand"
      data={[
        {
          value: "Individual",
          label: (
            <Group gap={5} wrap="nowrap" justify="center">
              <IconUser size={12} />
              <span>Individual</span>
            </Group>
          ),
        },
        {
          value: "Business",
          label: (
            <Group gap={5} wrap="nowrap" justify="center">
              <IconBuilding size={12} />
              <span>Business</span>
            </Group>
          ),
        },
      ]}
      styles={{
        root: {
          background: "var(--mantine-color-slate-1)",
          padding: 3,
          border: "1px solid var(--mantine-color-slate-2)",
          width: "fit-content",
        },
        indicator: { boxShadow: "var(--mantine-shadow-sm)" },
        label: {
          fontWeight: 600,
          fontSize: "var(--mantine-font-size-xs)",
          paddingTop: 5,
          paddingBottom: 5,
          paddingLeft: 10,
          paddingRight: 10,
          "&[data-active]": { color: "var(--mantine-color-white)" },
        },
      }}
    />
  );

  // Identity card header: title/badge on the left, read-only customer
  // number tucked in the top-right as plain text (not a form field).
  const identityCardHeader = (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <SectionHeader
        icon={IconClipboardCheck}
        title="Identity"
        badge="REQUIRED"
      />

      <Stack gap={0} align="flex-end" style={{ flex: "0 0 auto" }}>
        <Text
          size="10px"
          fw={600}
          tt="uppercase"
          c="slate.5"
          style={{ letterSpacing: 0.5 }}
        >
          Customer number
        </Text>
        <Text size="sm" fw={600} c="slate.7">
          {customerNumber}
        </Text>
      </Stack>
    </Group>
  );

  // Classification row: Customer Type, Customer Category always shown.
  // Staff Customer + conditional Staff ID only apply to Individual customers
  // (a business/company can never itself be "staff").
  const typeHeaderRow = (
    <Group align="flex-end" gap="lg" mb="lg" wrap="wrap">
      <Stack gap={2} style={{ flex: "0 0 auto" }}>
        <Text size="xs" fw={600} c="slate.6">
          Customer Type
        </Text>
        {typeToggle}
      </Stack>

      <Select
        maw={FIELD_MAW}
        size="xs"
        radius="md"
        label="Customer Category"
        placeholder="Select"
        data={customerCategoryOptions}
        value={customerCategory}
        onChange={setCustomerCategory}
        rightSection={chevron}
      />

      {!isBusiness && (
        <>
          <Stack gap={2} style={{ flex: "0 0 auto" }}>
            <Switch
              label="Staff Customer"
              description="Is the customer an employee?"
              checked={isStaffCustomer}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setIsStaffCustomer(checked);

                if (!checked) {
                  setStaffId(null);
                }
              }}
            />
          </Stack>

          {isStaffCustomer && (
            <Select
              maw={FIELD_MAW}
              size="xs"
              radius="md"
              label="Staff ID"
              placeholder="Select staff"
              data={staffOptions}
              value={staffId}
              onChange={setStaffId}
              rightSection={chevron}
              searchable
              clearable
              withAsterisk
            />
          )}
        </>
      )}
    </Group>
  );

  return (
    <Stack gap="xs">
      {!isBusiness && (
        <PlainCard>
          {identityCardHeader}

          {typeHeaderRow}

          <Grid gap="sm" mt="xs">
            <Grid.Col span={3}>
              <TextInput
                radius="md"
                label="First name"
                placeholder="e.g. Bwalya"
                withAsterisk
                value={firstName}
                onChange={(e) => setFirstName(e.currentTarget.value)}
                error={errors.firstName}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                radius="md"
                label="Middle name (Optional)"
                placeholder="Optional"
                value={middleName}
                onChange={(e) => setMiddleName(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                radius="md"
                label="Last name"
                placeholder="e.g. Mutale"
                withAsterisk
                value={lastName}
                onChange={(e) => setLastName(e.currentTarget.value)}
                error={errors.lastName}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Preferred name (Optional)"
                placeholder="What should we call them?"
                value={preferredName}
                onChange={(e) => setPreferredName(e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>

          <Grid gap="sm" mt="xs">
            <Grid.Col span={2}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Gender"
                placeholder={gendersLoading ? "Loading..." : "Select"}
                withAsterisk
                data={genderOptions ?? []}
                value={gender}
                onChange={setGender}
                error={errors.gender}
                disabled={gendersLoading}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <DatePickerInput
                radius="md"
                label="Date of birth"
                placeholder="DD-MMM-YYYY"
                value={dateOfBirth ? new Date(dateOfBirth) : null}
                valueFormat="DD-MMM-YYYY"
                onChange={(date) =>
                  setDateOfBirth(
                    date ? new Date(date).toISOString().split("T")[0] : "",
                  )
                }
                maxDate={new Date()}
                clearable
                withAsterisk
                error={errors.dateOfBirth}
              />
              {dateOfBirth && (
                <Text size="xs" c="slate.5" mt={4}>
                  Age:{" "}
                  <Text span fw={600} c="slate.7">
                    {calcAge(dateOfBirth)}
                  </Text>
                </Text>
              )}
            </Grid.Col>
            <Grid.Col span={2}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Nationality"
                placeholder={nationalitiesLoading ? "Loading..." : "Select"}
                withAsterisk
                data={nationalityOptions ?? []}
                value={nationality}
                onChange={setNationality}
                onSearchChange={setNationalitySearch}
                error={errors.nationality}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <Select
                radius="md"
                label="Marital Status"
                placeholder="Select"
                data={customerMaritalOptions}
                value={maritalStatus}
                onChange={setMaritalStatus}
                rightSection={chevron}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Occupation (Optional)"
                placeholder="e.g. Agronomist"
                value={occupation}
                onChange={(e) => setOccupation(e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>

          <Text
            size="10px"
            fw={700}
            tt="uppercase"
            c="slate.5"
            mt="lg"
            mb={6}
            style={{ letterSpacing: 0.5 }}
          >
            Employment Details
          </Text>

          <Grid gap="sm">
            <Grid.Col span={4}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Industry (Optional)"
                placeholder={industriesLoading ? "Loading..." : "Select"}
                data={industryOptions ?? []}
                value={industry}
                onChange={setIndustry}
                onSearchChange={setIndustrySearch}
                disabled={industriesLoading && !industryOptions}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Employer (Optional)"
                placeholder="e.g. Ministry of Agriculture"
                value={employer}
                onChange={(e) => setEmployer(e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>
        </PlainCard>
      )}

      {isBusiness && (
        <PlainCard dense>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <SectionHeader
              icon={IconBuilding}
              title="Business information"
              badge="REQUIRED"
            />

            <Stack gap={0} align="flex-end" style={{ flex: "0 0 auto" }}>
              <Text
                size="10px"
                fw={600}
                tt="uppercase"
                c="slate.5"
                style={{ letterSpacing: 0.5 }}
              >
                Customer number
              </Text>
              <Text size="sm" fw={600} c="slate.7">
                {customerNumber}
              </Text>
            </Stack>
          </Group>

          {typeHeaderRow}

          <Grid gap="sm" mt="xs">
            <Grid.Col span={3}>
              <TextInput
                radius="md"
                label="Registered company name"
                placeholder="e.g. Chileshe Farms Ltd"
                withAsterisk
                value={companyName}
                onChange={(e) => setCompanyName(e.currentTarget.value)}
                error={errors.companyName}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <TextInput
                radius="md"
                label="Registration number"
                placeholder="e.g. 112938"
                withAsterisk
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.currentTarget.value)}
                error={errors.registrationNumber}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <DatePickerInput
                radius="md"
                label="Incorporation date"
                placeholder="DD-MMM-YYYY"
                value={incorporationDate ? new Date(incorporationDate) : null}
                valueFormat="DD-MMM-YYYY"
                onChange={(date) =>
                  setIncorporationDate(
                    date ? new Date(date).toISOString().split("T")[0] : "",
                  )
                }
                maxDate={new Date()}
                clearable
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Industry"
                placeholder={industriesLoading ? "Loading..." : "Select"}
                data={industryOptions ?? []}
                value={businessIndustry}
                onChange={setBusinessIndustry}
                onSearchChange={setIndustrySearch}
              />
            </Grid.Col>

            <Grid.Col span={1}>
              <NumberInput
                radius="md"
                label="Employees"
                placeholder="e.g. 24"
                min={0}
                hideControls
                value={numberOfEmployees}
                onChange={(v) =>
                  setNumberOfEmployees(v === "" ? "" : Number(v))
                }
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                radius="md"
                label="Annual revenue"
                placeholder="e.g. 4,200,000"
                min={0}
                hideControls
                thousandSeparator=","
                value={annualRevenue}
                onChange={(v) => setAnnualRevenue(v === "" ? "" : Number(v))}
              />
            </Grid.Col>
          </Grid>

          <Text
            size="10px"
            fw={700}
            tt="uppercase"
            c="slate.5"
            mt="lg"
            mb={6}
            style={{ letterSpacing: 0.5 }}
          >
            Registered Office Address
          </Text>

          <Grid gap="sm">
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Address line 1"
                placeholder="Plot / building / street"
                withAsterisk
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.currentTarget.value)}
                error={errors.businessAddress}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Address line 2 (Optional)"
                placeholder="Area / locality"
                value={businessAddressLine2}
                onChange={(e) => setBusinessAddressLine2(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="City / town"
                placeholder="e.g. Lusaka"
                withAsterisk
                value={businessCity}
                onChange={(e) => setBusinessCity(e.currentTarget.value)}
                error={errors.businessCity}
              />
            </Grid.Col>
          </Grid>

          <Grid gap="sm" mt="xs">
            <Grid.Col span={4}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="State / Province"
                placeholder="Select"
                withAsterisk
                data={[
                  "Lusaka",
                  "Copperbelt",
                  "Southern",
                  "Eastern",
                  "Northern",
                ]}
                value={businessProvince}
                onChange={setBusinessProvince}
                error={errors.businessProvince}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Country"
                placeholder={businessCountriesLoading ? "Loading..." : "Select"}
                withAsterisk
                data={businessCountryOptions ?? []}
                value={businessCountry}
                onChange={setBusinessCountry}
                onSearchChange={setBusinessCountrySearch}
                error={errors.businessCountry}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Postal Code"
                placeholder="e.g. 10101"
                value={businessPostalCode}
                onChange={(e) => setBusinessPostalCode(e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>
        </PlainCard>
      )}
    </Stack>
  );
}