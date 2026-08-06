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
} from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";

interface KinStepProps {
  kinName: string;
  setKinName: (v: string) => void;
  kinRelationship: string | null;
  setKinRelationship: (v: string | null) => void;
  kinPhone: string;
  setKinPhone: (v: string) => void;
  kinAddress: string;
  setKinAddress: (v: string) => void;
  guarantorLinked: boolean;
  setGuarantorLinked: (v: boolean) => void;
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

export function KinStep(props: KinStepProps) {
  const {
    kinName,
    setKinName,
    kinRelationship,
    setKinRelationship,
    kinPhone,
    setKinPhone,
    kinAddress,
    setKinAddress,
    guarantorLinked,
    setGuarantorLinked,
  } = props;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconUsers}
        title="Next of kin & guarantor"
        badge="OPTIONAL"
        description="Emergency contact and any linked guarantor for this customer"
        accent="gold"
      />

      {/* Name/address need more room than phone/relationship which have
          short, fixed-format values. */}
      <FieldRow columns="1.3fr 0.9fr 1fr">
        <TextInput
          radius="md"
          label="Next of Kin Name"
          placeholder="Full name"
          value={kinName}
          onChange={(e) => setKinName(e.currentTarget.value)}
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

      <FieldRow columns="1fr">
        <TextInput
          radius="md"
          label="Address"
          placeholder="Plot / street, area"
          value={kinAddress}
          onChange={(e) => setKinAddress(e.currentTarget.value)}
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