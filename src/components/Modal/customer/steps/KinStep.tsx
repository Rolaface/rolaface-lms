import {
  Grid,
  TextInput,
  Select,
  Text,
  Group,
  Paper,
  Button,
  Divider,
  Stack,
} from "@mantine/core";
import {
  IconChevronDown,
  IconUsers,
  IconLink,
  IconUserPlus,
} from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { W } from "../../../constants/customer/constants";

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
      <Grid gap="md" align="flex-end">
        <Grid.Col span={W.lg}>
          <TextInput
            label="Next of Kin Name"
            placeholder="Full name"
            value={kinName}
            onChange={(e) => setKinName(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Relationship"
            placeholder="Select"
            data={["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]}
            value={kinRelationship}
            onChange={setKinRelationship}
          />
        </Grid.Col>
        <Grid.Col span={W.md}>
          <TextInput
            label="Phone"
            placeholder="+260 9__ ___ ___"
            value={kinPhone}
            onChange={(e) => setKinPhone(e.currentTarget.value)}
          />
        </Grid.Col>
        <Grid.Col span={W.xxl}>
          <TextInput
            label="Address"
            placeholder="Plot / street, area"
            value={kinAddress}
            onChange={(e) => setKinAddress(e.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>

      <Divider mt="lg" mb="sm" />
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
              variant="light"
              color="brand"
              leftSection={<IconLink size={14} />}
              onClick={() => setGuarantorLinked(true)}
            >
              Link Existing Customer
            </Button>
            <Button
              size="xs"
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
