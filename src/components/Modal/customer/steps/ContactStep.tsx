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
        gap: "var(--mantine-spacing-md)",
        marginBottom: "var(--mantine-spacing-sm)",
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
    <Group gap={6} mb="sm" mt="md">
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

export function ContactStep(props: ContactStepProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [debouncedCountrySearch] = useDebouncedValue(countrySearch, 300);
  const { data: countryOptions, isLoading: countriesLoading } = useCountries(
    debouncedCountrySearch,
  );
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

      <FieldRow columns="2fr 1fr 1fr">
        <TextInput
          radius="md"
          label="Residential Address"
          placeholder="Plot / street, area"
          value={residentialAddress}
          onChange={(e) => setResidentialAddress(e.currentTarget.value)}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Country"
          placeholder={countriesLoading ? "Loading..." : "Select"}
          data={countryOptions ?? []}
          value={country}
          onChange={setCountry}
          onSearchChange={setCountrySearch}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Province"
          placeholder="Select"
          data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]}
          value={province}
          onChange={setProvince}
        />
      </FieldRow>

      <FieldRow columns="repeat(3, minmax(0, 1fr))">
        <TextInput
          radius="md"
          label="District"
          placeholder="e.g. Chongwe"
          value={district}
          onChange={(e) => setDistrict(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="City / Town"
          placeholder="e.g. Lusaka"
          value={cityTown}
          onChange={(e) => setCityTown(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Postal Code"
          placeholder="e.g. 10101"
          value={postalCode}
          onChange={(e) => setPostalCode(e.currentTarget.value)}
        />
      </FieldRow>

      <Group justify="space-between" mt="lg" mb="xs">
        <Text size="xs" fw={700} c="slate.8">
          Mailing Address
        </Text>
        <Checkbox
          size="xs"
          label="Same as residential"
          checked={sameAsResidential}
          onChange={(e) => setSameAsResidential(e.currentTarget.checked)}
        />
      </Group>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "var(--mantine-spacing-md)",
        }}
      >
        <TextInput
          radius="md"
          placeholder="Plot / street, area"
          disabled={sameAsResidential}
          value={sameAsResidential ? residentialAddress : mailingAddress}
          onChange={(e) => setMailingAddress(e.currentTarget.value)}
        />
      </Box>
    </PlainCard>
  );
}
