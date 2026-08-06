import { Box, TextInput, Select, Checkbox, Text, Group, Divider } from "@mantine/core";
import {
  IconChevronDown,
  IconMail,
  IconPhone,
  IconMapPin,
  IconWorld,
} from "@tabler/icons-react";
import {
  IconChip,
  PlainCard,
  SectionHeader,
} from "../../../shared/customer/Shared";

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
  } = props;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconMail}
        title="Contact information"
        badge="REQUIRED"
        description="How and where to reach this customer"
        accent="indigoAlt"
      />

      {/* --- Phone & email --- */}
      <SubHeading icon={IconPhone} label="Phone & Email" />
      <FieldRow columns="repeat(4, minmax(0, 1fr))">
        <TextInput
          radius="md"
          label="Mobile Number"
          placeholder="+260 9__ ___ ___"
          withAsterisk
          leftSection={<IconChip icon={IconPhone} />}
          leftSectionWidth={38}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Alternate Mobile"
          placeholder="+260 9__ ___ ___"
          leftSection={<IconChip icon={IconPhone} color="indigoAlt" />}
          leftSectionWidth={38}
          value={alternateMobile}
          onChange={(e) => setAlternateMobile(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Email Address"
          placeholder="name@example.com"
          leftSection={<IconChip icon={IconMail} color="gold" />}
          leftSectionWidth={38}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
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

      {/* --- Address --- */}
      <SubHeading icon={IconMapPin} label="Address" />


      <FieldRow columns="2fr 1fr 1fr">
        <TextInput
          radius="md"
          label="Residential Address"
          placeholder="Plot / street, area"
          leftSection={<IconChip icon={IconMapPin} color="accent" />}
          leftSectionWidth={38}
          value={residentialAddress}
          onChange={(e) => setResidentialAddress(e.currentTarget.value)}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Country"
          placeholder="Select"
          leftSection={<IconChip icon={IconWorld} color="brand" />}
          leftSectionWidth={38}
          data={["Zambia", "Zimbabwe", "Malawi", "South Africa"]}
          value={country}
          onChange={setCountry}
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

      {/* --- Mailing address --- */}
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
      <FieldRow columns="2fr 1fr 1fr">
        <TextInput
          radius="md"
          placeholder="Plot / street, area"
          disabled={sameAsResidential}
          value={sameAsResidential ? residentialAddress : mailingAddress}
          onChange={(e) => setMailingAddress(e.currentTarget.value)}
        />
      </FieldRow>
    </PlainCard>
  );
}