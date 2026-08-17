import {
  TextInput,
  Select,
  Text,
  Group,
  Paper,
  Button,
  Divider,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconChevronDown,
  IconUsers,
  IconLink,
  IconUserPlus,
  IconUser,
  IconMapPin,
} from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";

interface KinStepProps {
  kinFirstName: string;
  setKinFirstName: (v: string) => void;
  kinMiddleName: string;
  setKinMiddleName: (v: string) => void;
  kinLastName: string;
  setKinLastName: (v: string) => void;
  kinRelationship: string | null;
  setKinRelationship: (v: string | null) => void;
  kinPhone: string;
  setKinPhone: (v: string) => void;
  kinAddress: string;
  setKinAddress: (v: string) => void;
  kinDistrict: string;
  setKinDistrict: (v: string) => void;
  kinCityTown: string;
  setKinCityTown: (v: string) => void;
  kinPostalCode: string;
  setKinPostalCode: (v: string) => void;
  guarantorLinked: boolean;
  setGuarantorLinked: (v: boolean) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

const FIELD_W = 220;

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
  icon: typeof IconUser;
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

export function KinStep(props: KinStepProps) {
  const {
    kinFirstName,
    setKinFirstName,
    kinMiddleName,
    setKinMiddleName,
    kinLastName,
    setKinLastName,
    kinRelationship,
    setKinRelationship,
    kinPhone,
    setKinPhone,
    kinAddress,
    setKinAddress,
    kinDistrict,
    setKinDistrict,
    kinCityTown,
    setKinCityTown,
    kinPostalCode,
    setKinPostalCode,
    guarantorLinked,
    setGuarantorLinked,
  } = props;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconUsers}
        title="Next of kin & guarantor"
        badge="OPTIONAL"

        accent="gold"
      />
      {/* --- Kin details --- */}
      <SubHeading icon={IconUser} label="Kin Details" />
      <FieldRow columns="repeat(5, minmax(0, 1fr))">
        <TextInput
          radius="md"
          label="First Name"
          placeholder="e.g. Mwansa"
          value={kinFirstName}
          onChange={(e) => setKinFirstName(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Middle Name"
          placeholder="Optional"
          value={kinMiddleName}
          onChange={(e) => setKinMiddleName(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Last Name"
          placeholder="e.g. Chileshe"
          value={kinLastName}
          onChange={(e) => setKinLastName(e.currentTarget.value)}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Relationship"
          placeholder="Select"
          data={["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]}
          value={kinRelationship}
          onChange={setKinRelationship}
        />
        <TextInput
          radius="md"
          label="Phone"
          placeholder="+260 9__ ___ ___"
          value={kinPhone}
          onChange={(e) => setKinPhone(e.currentTarget.value)}
        />
      </FieldRow>

      {/* --- Address --- */}
      <SubHeading icon={IconMapPin} label="Address" />
      <FieldRow columns="2fr 1fr 1fr 1fr">
        <TextInput
          radius="md"
          label="Address"
          placeholder="Plot / street, area"
          value={kinAddress}
          onChange={(e) => setKinAddress(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="District"
          placeholder="e.g. Chongwe"
          value={kinDistrict}
          onChange={(e) => setKinDistrict(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="City / Town"
          placeholder="e.g. Lusaka"
          value={kinCityTown}
          onChange={(e) => setKinCityTown(e.currentTarget.value)}
        />
        <TextInput
          radius="md"
          label="Postal Code"
          placeholder="e.g. 10101"
          value={kinPostalCode}
          onChange={(e) => setKinPostalCode(e.currentTarget.value)}
        />
      </FieldRow>
      <Divider mt="lg" mb="sm" color="slate.2" />
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={700} c="slate.8">
            Guarantor
          </Text>
          <Text size="10px" c="slate.5">
            — link an existing customer or add a new one
          </Text>
        </Group>
        <Paper
          withBorder
          radius="md"
          p="md"
          bg="slate.0"
          style={{ borderColor: "var(--mantine-color-slate-2)" }}
        >
          <Group gap="sm">
            <Button
              size="xs"
              radius="md"
              variant="light"
              color="brand"
              leftSection={<IconLink size={14} />}
              onClick={() => setGuarantorLinked(true)}
            >
              Link Existing Customer
            </Button>
            <Button
              size="xs"
              radius="md"
              variant="default"
              leftSection={<IconUserPlus size={14} />}
            >
              Add New Guarantor
            </Button>
          </Group>
          <Text size="xs" c="slate.5" mt="sm">
            {guarantorLinked
              ? "1 guarantor linked."
              : "No guarantor linked yet."}
          </Text>
        </Paper>
      </Stack>
    </PlainCard>
  );
}
