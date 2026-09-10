import { useEffect, useRef, useState } from "react";
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
  useCustomerGroups,
} from "../../../../hooks/common/useLookups";
import { useDebouncedValue } from "@mantine/hooks";
import { getCurrencyList } from "../../../../api/erpDataApi";
import { useCompanyStore } from "../../../../store/companyStore";

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
  customerGroup: string | null;
  setCustomerGroup: (v: string | null) => void;
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
  nrcNumber: string;
  setNrcNumber: (v: string) => void;
  individualTaxId: string;
  setIndividualTaxId: (v: string) => void;

  // Already existed in useIdentityState (used during edit hydration —
  // identity.setCurrency / identity.setTaxId in CustomerModal.tsx) but
  // had no input control anywhere, so a new customer always saved with
  // default_currency / tax_id (company) as "".
  currency: string | null;
  setCurrency: (v: string | null) => void;
  taxId: string;
  setTaxId: (v: string) => void;

  errors?: Record<string, string>;
}

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

// TODO: replace with a real useCurrencies lookup hook once available
// (same pattern as useGenders/useCountries/useCustomerGroups above) —
// kept as a static list for now, matching the temporary-data convention
// already used for staffOptions here and RM_OPTIONS in AssignmentStep.

export function IdentityStep(props: IdentityStepProps) {
  const { data: genderOptions, isLoading: gendersLoading } = useGenders();
  const { data: customerGroupOptions, isLoading: customerGroupsLoading } =
    useCustomerGroups();
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
    customerGroup,
    setCustomerGroup,
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
    nrcNumber,
    setNrcNumber,
    individualTaxId,
    setIndividualTaxId,
    currency,
    setCurrency,
    taxId,
    setTaxId,
    errors = {},
  } = props;

  // ── Currency (backend-driven search) ──────────────────────────────
  const [currencySearch, setCurrencySearch] = useState("");
  const [debouncedCurrencySearch] = useDebouncedValue(currencySearch, 300);
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // Fires only after the user pauses typing, calling the backend search API.
  useEffect(() => {
    let cancelled = false;

    const loadCurrencies = async () => {
      try {
        setCurrencyLoading(true);

        const response = await getCurrencyList({
          search: debouncedCurrencySearch,
          page_size: 10,
        });

        if (cancelled) return;

        const records = Array.isArray(response) ? response : [];
        setCurrencyOptions(
          records.map((item: any) => item?.name).filter(Boolean),
        );
      } catch {
        if (!cancelled) setCurrencyOptions([]);
      } finally {
        if (!cancelled) setCurrencyLoading(false);
      }
    };

    loadCurrencies();
    return () => {
      cancelled = true;
    };
  }, [debouncedCurrencySearch]);

  // ── Default to the company's base currency ────────────────────────
  // Reads from the shared useCompanyStore (persisted in localStorage under
  // "company-info") instead of calling getCompanyInfo() ourselves — this
  // reuses whatever the store already fetched/cached and avoids a second
  // network round-trip. Reacts to `companyBaseCurrency` directly so it
  // applies as soon as the store has a value, whether that's instantly
  // from the persisted cache or after `fetchCompany()` resolves.
  const companyBaseCurrency = useCompanyStore((s) => s.baseCurrency);
  const fetchCompany = useCompanyStore((s) => s.fetchCompany);

  // If the store hasn't fetched company info yet in this session (no
  // persisted cache, or it's empty), kick off a fetch once on mount.
  useEffect(() => {
    if (!companyBaseCurrency) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currencyRef = useRef(currency);
  useEffect(() => {
    currencyRef.current = currency;
  }, [currency]);

  const defaultCurrencyAttempted = useRef(false);
  useEffect(() => {
    if (defaultCurrencyAttempted.current) return;
    if (!companyBaseCurrency) return; // wait until the store actually has one

    defaultCurrencyAttempted.current = true;

    // Only apply if nothing was set meanwhile (e.g. edit hydration).
    if (currencyRef.current) return;

    // Ensure the Select has a matching option so it can render the label.
    setCurrencyOptions((prev) =>
      prev.includes(companyBaseCurrency) ? prev : [companyBaseCurrency, ...prev],
    );
    setCurrency(companyBaseCurrency);
  }, [companyBaseCurrency]);

  // Safety net: if `currency` already has a value when we render (e.g. set
  // by edit-hydration, or by a parent hook) but it isn't in the fetched
  // currencyOptions yet, inject it so the Select can actually show it
  // instead of rendering a blank "Select" placeholder.
  useEffect(() => {
    if (!currency) return;
    setCurrencyOptions((prev) =>
      prev.includes(currency) ? prev : [currency, ...prev],
    );
  }, [currency]);

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
        label="Customer Group"
        placeholder={customerGroupsLoading ? "Loading..." : "Select"}
        data={customerGroupOptions ?? []}
        value={customerGroup}
        onChange={setCustomerGroup}
        rightSection={chevron}
        disabled={customerGroupsLoading}
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
                filter={({ options }) => options}
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

          {/* Industry + Employer were previously destructured from props
              but never rendered here — identity.industry/employer could
              never be set for an Individual customer, so they always went
              to the API as null. Bound to the same industryOptions/
              industriesLoading/setIndustrySearch already fetched above via
              useIndustries(). */}
          <Grid gap="sm" mt="xs">
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
                filter={({ options }) => options}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Employer (Optional)"
                placeholder="e.g. ABC Ltd"
                value={employer}
                onChange={(e) => setEmployer(e.currentTarget.value)}
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
            Government Identification
          </Text>

          <Grid gap="sm">
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="NRC Number"
                placeholder="e.g. 123456/78/1"
                value={nrcNumber}
                onChange={(e) => setNrcNumber(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Tax Identification Number"
                placeholder="Enter TIN / PAN"
                value={individualTaxId}
                onChange={(e) => setIndividualTaxId(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Currency"
                placeholder={currencyLoading ? "Loading..." : "Select"}
                data={currencyOptions}
                value={currency}
                onChange={setCurrency}
                onSearchChange={setCurrencySearch}
                clearable
                filter={({ options }) => options}
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
                filter={({ options }) => options}
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
            Tax & Currency
          </Text>

          <Grid gap="sm">
            <Grid.Col span={3}>
              <TextInput
                radius="md"
                label="Tax Identification Number"
                placeholder="Enter TIN"
                value={taxId}
                onChange={(e) => setTaxId(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={3}>
              <Select
                radius="md"
                searchable
                rightSection={chevron}
                label="Currency"
                placeholder={currencyLoading ? "Loading..." : "Select"}
                data={currencyOptions}
                value={currency}
                onChange={setCurrency}
                onSearchChange={setCurrencySearch}
                clearable
                filter={({ options }) => options}
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
                filter={({ options }) => options}
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