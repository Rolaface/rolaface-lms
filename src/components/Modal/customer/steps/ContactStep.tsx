import {
  Box,
  TextInput,
  Select,
  Checkbox,
  Text,
  Group,
  Divider,
  Paper,
} from "@mantine/core";
import {
  IconChevronDown,
  IconMail,
  IconPhone,
  IconMapPin,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useCountries } from "../../../../hooks/common/useLookups";

interface ContactStepProps {
  mobileNumber: string;
  setMobileNumber: (v: string) => void;
  alternateMobile: string;
  setAlternateMobile: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  preferredCommunication: string | null;
  setPreferredCommunication: (v: string | null) => void;

  residentialAddress: string;
  setResidentialAddress: (v: string) => void;
  residentialAddressLine2: string;
  setResidentialAddressLine2: (v: string) => void;
  country: string | null;
  setCountry: (v: string | null) => void;
  province: string | null;
  setProvince: (v: string | null) => void;
  district: string;
  setDistrict: (v: string) => void;
  cityTown: string;
  setCityTown: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;

  sameAsResidential: boolean;
  setSameAsResidential: (v: boolean) => void;
  mailingAddress: string;
  setMailingAddress: (v: string) => void;
  mailingAddressLine2: string;
  setMailingAddressLine2: (v: string) => void;
  mailingCountry: string | null;
  setMailingCountry: (v: string | null) => void;
  mailingProvince: string | null;
  setMailingProvince: (v: string | null) => void;
  mailingDistrict: string;
  setMailingDistrict: (v: string) => void;
  mailingCityTown: string;
  setMailingCityTown: (v: string) => void;
  mailingPostalCode: string;
  setMailingPostalCode: (v: string) => void;

  mobileDuplicateName?: string | null;
  errors?: Record<string, string>;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

function FieldRow({
  columns,
  children,
}: {
  columns: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "var(--mantine-spacing-sm)",
        marginBottom: 6,
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  );
}

function SubHeading({
  icon: Icon,
  label,
}: {
  icon: typeof IconPhone;
  label: string;
}) {
  return (
    <Group gap={6} mb={6} mt={8}>
      <Icon size={13} color="var(--mantine-color-slate-4)" />
      <Text
        size="10px"
        fw={700}
        tt="uppercase"
        c="slate.5"
        style={{ letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <Divider flex={1} color="slate.1" />
    </Group>
  );
}

function AddressCard({
  title,
  subtitle,
  headerRight,
  disabled,
  addressLine1,
  onAddressLine1,
  addressLine2,
  onAddressLine2,
  cityTown,
  onCityTown,
  county,
  onCounty,
  province,
  onProvince,
  country,
  onCountry,
  countryOptions,
  countriesLoading,
  onCountrySearch,
  postalCode,
  onPostalCode,
}: {
  title: string;
  subtitle: string;
  headerRight?: React.ReactNode;
  disabled?: boolean;
  addressLine1: string;
  onAddressLine1: (v: string) => void;
  addressLine2: string;
  onAddressLine2: (v: string) => void;
  cityTown: string;
  onCityTown: (v: string) => void;
  county: string;
  onCounty: (v: string) => void;
  province: string | null;
  onProvince: (v: string | null) => void;
  country: string | null;
  onCountry: (v: string | null) => void;
  countryOptions: string[];
  countriesLoading: boolean;
  onCountrySearch: (v: string) => void;
  postalCode: string;
  onPostalCode: (v: string) => void;
}) {
  return (
    <Paper radius="md" p="sm" withBorder style={{ minWidth: 0 }}>
      <Group justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Text size="sm" fw={700} c="slate.8">
            {title}
          </Text>
          <Text size="10px" c="slate.5">
            {subtitle}
          </Text>
        </Box>
        {headerRight}
      </Group>

      <TextInput
        radius="md"
        label="Address Line 1"
        placeholder="Plot / street, area"
        withAsterisk
        disabled={disabled}
        value={addressLine1}
        onChange={(e) => onAddressLine1(e.currentTarget.value)}
        mb="{6}"
      />
      <TextInput
        radius="md"
        label="Address Line 2"
        placeholder="Apartment, suite, etc."
        disabled={disabled}
        value={addressLine2}
        onChange={(e) => onAddressLine2(e.currentTarget.value)}
        mb={6}
      />

      <FieldRow columns="repeat(2, minmax(0, 1fr))">
        <TextInput
          radius="md"
          label="City / Town"
          placeholder="e.g. Lusaka"
          withAsterisk
          disabled={disabled}
          value={cityTown}
          onChange={(e) => onCityTown(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="County"
          placeholder="e.g. Chongwe"
          disabled={disabled}
          value={county}
          onChange={(e) => onCounty(e.currentTarget.value)}
        />
      </FieldRow>

      <FieldRow columns="repeat(3, minmax(0, 1fr))">
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="State / Province"
          placeholder="Select"
          disabled={disabled}
          data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]}
          value={province}
          onChange={onProvince}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Country"
          withAsterisk
          placeholder={countriesLoading ? "Loading..." : "Select"}
          disabled={disabled}
          data={countryOptions ?? []}
          value={country}
          onChange={onCountry}
          onSearchChange={onCountrySearch}
        />
        <TextInput
          radius="md"
          label="Postal Code"
          placeholder="e.g. 10101"
          disabled={disabled}
          value={postalCode}
          onChange={(e) => onPostalCode(e.currentTarget.value)}
        />
      </FieldRow>
    </Paper>
  );
}

export function ContactStep(props: ContactStepProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [debouncedCountrySearch] = useDebouncedValue(countrySearch, 300);
  const { data: countryOptions, isLoading: countriesLoading } = useCountries(
    debouncedCountrySearch,
  );

  const [mailingCountrySearch, setMailingCountrySearch] = useState("");
  const [debouncedMailingCountrySearch] = useDebouncedValue(
    mailingCountrySearch,
    300,
  );
  const { data: mailingCountryOptions, isLoading: mailingCountriesLoading } =
    useCountries(debouncedMailingCountrySearch);

  const {
    mobileNumber,
    setMobileNumber,
    alternateMobile,
    setAlternateMobile,
    email,
    setEmail,
    preferredCommunication,
    setPreferredCommunication,
    residentialAddress,
    setResidentialAddress,
    residentialAddressLine2,
    setResidentialAddressLine2,
    country,
    setCountry,
    province,
    setProvince,
    district,
    setDistrict,
    cityTown,
    setCityTown,
    postalCode,
    setPostalCode,
    sameAsResidential,
    setSameAsResidential,
    mailingAddress,
    setMailingAddress,
    mailingAddressLine2,
    setMailingAddressLine2,
    mailingCountry,
    setMailingCountry,
    mailingProvince,
    setMailingProvince,
    mailingDistrict,
    setMailingDistrict,
    mailingCityTown,
    setMailingCityTown,
    mailingPostalCode,
    setMailingPostalCode,
    mobileDuplicateName,
    errors = {},
  } = props;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconMail}
        title="Contact information"
        badge="REQUIRED"
        accent="indigoAlt"
      />

      <SubHeading icon={IconPhone} label="Phone & Email" />

      {mobileDuplicateName && (
        <Paper
          radius="md"
          p="sm"
          mb="sm"
          style={{ background: "var(--mantine-color-danger-0)" }}
        >
          <Group gap={8} wrap="nowrap" align="flex-start">
            <IconAlertTriangle
              size={16}
              color="var(--mantine-color-danger-6)"
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <Text size="xs" c="danger.7">
              This mobile number matches an existing customer:{" "}
              <Text span fw={700}>
                {mobileDuplicateName}
              </Text>
            </Text>
          </Group>
        </Paper>
      )}

      <FieldRow columns="repeat(4, minmax(0, 1fr))">
        <TextInput
          radius="md"
          label="Mobile Number"
          placeholder="+260 9__ ___ ___"
          withAsterisk
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.currentTarget.value)}
          error={errors.mobileNumber}
        />
        <TextInput
          radius="md"
          label="Alternate Mobile"
          placeholder="+260 9__ ___ ___"
          value={alternateMobile}
          onChange={(e) => setAlternateMobile(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={errors.email}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Preferred Communication"
          placeholder="Select"
          data={["SMS", "Email", "WhatsApp", "Phone Call"]}
          value={preferredCommunication}
          onChange={setPreferredCommunication}
        />
      </FieldRow>

      <SubHeading icon={IconMapPin} label="Address" />

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "var(--mantine-spacing-sm)",
          minWidth: 0,
        }}
      >
        <AddressCard
          title="Residential Address"
          subtitle="Primary location"
          addressLine1={residentialAddress}
          onAddressLine1={setResidentialAddress}
          addressLine2={residentialAddressLine2}
          onAddressLine2={setResidentialAddressLine2}
          cityTown={cityTown}
          onCityTown={setCityTown}
          county={district}
          onCounty={setDistrict}
          province={province}
          onProvince={setProvince}
          country={country}
          onCountry={setCountry}
          countryOptions={countryOptions ?? []}
          countriesLoading={countriesLoading}
          onCountrySearch={setCountrySearch}
          postalCode={postalCode}
          onPostalCode={setPostalCode}
        />

        <AddressCard
          title="Mailing Address"
          subtitle="Correspondence & delivery"
          disabled={sameAsResidential}
          headerRight={
            <Checkbox
              size="xs"
              label="Same as residential"
              checked={sameAsResidential}
              onChange={(e) => setSameAsResidential(e.currentTarget.checked)}
            />
          }
          addressLine1={sameAsResidential ? residentialAddress : mailingAddress}
          onAddressLine1={setMailingAddress}
          addressLine2={
            sameAsResidential ? residentialAddressLine2 : mailingAddressLine2
          }
          onAddressLine2={setMailingAddressLine2}
          cityTown={sameAsResidential ? cityTown : mailingCityTown}
          onCityTown={setMailingCityTown}
          county={sameAsResidential ? district : mailingDistrict}
          onCounty={setMailingDistrict}
          province={sameAsResidential ? province : mailingProvince}
          onProvince={setMailingProvince}
          country={sameAsResidential ? country : mailingCountry}
          onCountry={setMailingCountry}
          countryOptions={mailingCountryOptions ?? []}
          countriesLoading={mailingCountriesLoading}
          onCountrySearch={setMailingCountrySearch}
          postalCode={sameAsResidential ? postalCode : mailingPostalCode}
          onPostalCode={setMailingPostalCode}
        />
      </Box>
    </PlainCard>
  );
}
