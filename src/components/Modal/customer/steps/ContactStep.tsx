import { Grid, TextInput, Select, Checkbox, Text, Group } from "@mantine/core";
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
import { W } from "../../../constants/customer/constants";

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
  <IconChevronDown size={13} color="var(--mantine-color-gray-5)" />
);

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

      <Grid gap="md" align="flex-end">
        <Grid.Col span={W.xl}>
          <TextInput
            label="Mobile Number"
            placeholder="+260 9__ ___ ___"
            withAsterisk
            leftSection={<IconChip icon={IconPhone} />}
            leftSectionWidth={38}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.xl}>
          <TextInput
            label="Alternate Mobile"
            placeholder="+260 9__ ___ ___"
            leftSection={<IconChip icon={IconPhone} color="indigoAlt" />}
            leftSectionWidth={38}
            value={alternateMobile}
            onChange={(e) => setAlternateMobile(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.xl}>
          <TextInput
            label="Email Address"
            placeholder="name@example.com"
            leftSection={<IconChip icon={IconMail} color="gold" />}
            leftSectionWidth={38}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Preferred Communication"
            placeholder="Select"
            data={["SMS", "Email", "WhatsApp", "Phone Call"]}
            value={preferredCommunication}
            onChange={setPreferredCommunication}
          />
        </Grid.Col>
      </Grid>

      <Grid gap="md" align="flex-end" mt="md">
        <Grid.Col span={W.xxl}>
          <TextInput
            label="Residential Address"
            placeholder="Plot / street, area"
            leftSection={<IconChip icon={IconMapPin} color="accent" />}
            leftSectionWidth={38}
            value={residentialAddress}
            onChange={(e) => setResidentialAddress(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
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
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Province"
            placeholder="Select"
            data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]}
            value={province}
            onChange={setProvince}
          />
        </Grid.Col>
        <Grid.Col span={W.xs}>
          <TextInput
            label="District"
            placeholder="e.g. Chongwe"
            value={district}
            onChange={(e) => setDistrict(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <TextInput
            label="City / Town"
            placeholder="e.g. Lusaka"
            value={cityTown}
            onChange={(e) => setCityTown(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.xxs}>
          <TextInput
            label="Postal Code"
            placeholder="e.g. 10101"
            value={postalCode}
            onChange={(e) => setPostalCode(e.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>

      <Group justify="space-between" mt="sm" mb="xs">
        <Text size="xs" fw={700} c="dark.7">
          Mailing Address
        </Text>
        <Checkbox
          size="xs"
          label="Same as residential"
          checked={sameAsResidential}
          onChange={(e) => setSameAsResidential(e.currentTarget.checked)}
        />
      </Group>
      {/* Fixed: this TextInput's Grid.Col now sits inside a Grid parent —
          Mantine's Grid.Col reads column context from Grid, so a standalone
          Grid.Col (as before) throws "Grid.Col was not found in tree". */}
      <Grid>
        <Grid.Col span={W.xxl}>
          <TextInput
            placeholder="Plot / street, area"
            disabled={sameAsResidential}
            value={sameAsResidential ? residentialAddress : mailingAddress}
            onChange={(e) => setMailingAddress(e.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>
    </PlainCard>
  );
}
