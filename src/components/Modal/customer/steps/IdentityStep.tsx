import {
  Grid,
  TextInput,
  Select,
  SegmentedControl,
  Stack,
} from "@mantine/core";
import { IconChevronDown, IconClipboardCheck } from "@tabler/icons-react";
import {
  FieldLabel,
  PlainCard,
  SectionHeader,
} from "../../../shared/customer/Shared";
import { readOnlyClassNames } from "../../../constants/customer/constants";
import { calcAge } from "../../../../utils/customer/utils";

interface IdentityStepProps {
  customerNumber: string;
  customerType: string;
  setCustomerType: (v: string) => void;
  fullLegalName: string;
  setFullLegalName: (v: string) => void;
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
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-gray-5)" />
);

export function IdentityStep(props: IdentityStepProps) {
  const {
    customerNumber,
    customerType,
    setCustomerType,
    fullLegalName,
    setFullLegalName,
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
  } = props;

  return (
    <Stack gap="sm">
      <PlainCard dense>
        <SectionHeader
          icon={IconClipboardCheck}
          title="Customer type"
          badge="REQUIRED"
          description="What kind of profile is this?"
          dense
        />
        <SegmentedControl
          fullWidth
          size="xs"
          value={customerType}
          onChange={setCustomerType}
          color="brand"
          data={[
            "Individual",
            "Joint",
            "Business",
            "SME",
            "Corporate",
            "Group",
          ]}
        />
      </PlainCard>

      <PlainCard>
        <SectionHeader
          icon={IconClipboardCheck}
          title="Identity"
          badge="REQUIRED"
        />
        <Grid gap="lg">
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Customer number" tag="(auto)" />}
              value={customerNumber}
              disabled
              classNames={readOnlyClassNames}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Full legal name" />}
              placeholder="e.g. Bwalya Mutale"
              withAsterisk
              value={fullLegalName}
              onChange={(e) => setFullLegalName(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Preferred name" tag="Optional" />}
              placeholder="What should we call them?"
              value={preferredName}
              onChange={(e) => setPreferredName(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              searchable
              rightSection={chevron}
              label={<FieldLabel text="Gender" />}
              placeholder="Select"
              withAsterisk
              data={["Male", "Female", "Other"]}
              value={gender}
              onChange={setGender}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              type="date"
              label={<FieldLabel text="Date of birth" />}
              withAsterisk
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Age" tag="(calculated)" />}
              value={calcAge(dateOfBirth)}
              disabled
              classNames={readOnlyClassNames}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              searchable
              rightSection={chevron}
              label={<FieldLabel text="Nationality" />}
              placeholder="Select"
              withAsterisk
              data={[
                "Zambian",
                "Zimbabwean",
                "Malawian",
                "South African",
                "Other",
              ]}
              value={nationality}
              onChange={setNationality}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              searchable
              rightSection={chevron}
              label={<FieldLabel text="Marital status" tag="Optional" />}
              placeholder="Select"
              data={["Single", "Married", "Divorced", "Widowed"]}
              value={maritalStatus}
              onChange={setMaritalStatus}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Occupation" tag="Optional" />}
              placeholder="e.g. Agronomist"
              value={occupation}
              onChange={(e) => setOccupation(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              searchable
              rightSection={chevron}
              label={<FieldLabel text="Industry" tag="Optional" />}
              placeholder="Select"
              data={[
                "Agriculture",
                "Government",
                "Retail",
                "Manufacturing",
                "Education",
                "Other",
              ]}
              value={industry}
              onChange={setIndustry}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={<FieldLabel text="Employer" tag="Optional" />}
              placeholder="e.g. Ministry of Agriculture"
              value={employer}
              onChange={(e) => setEmployer(e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>
      </PlainCard>
    </Stack>
  );
}
