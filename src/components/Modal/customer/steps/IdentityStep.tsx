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
} from "@mantine/core";
import {
  IconChevronDown,
  IconClipboardCheck,
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";
import { DatePickerInput } from "@mantine/dates";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { readOnlyClassNames } from "../../../constants/customer/constants";
import { calcAge } from "../../../../utils/customer/utils";
import {
  useGenders,
  useIndustries,
  useCountries,
} from "../../../../hooks/common/useLookups";
import { useDebouncedValue } from "@mantine/hooks";

interface IdentityStepProps {
  customerNumber: string;
  customerType: string;
  setCustomerType: (v: string) => void;

  // Individual
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
  occupation: string;
  setOccupation: (v: string) => void;
  industry: string | null;
  setIndustry: (v: string | null) => void;
  employer: string;
  setEmployer: (v: string) => void;

  // Business — original field set only
  companyName: string;
  setCompanyName: (v: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  incorporationDate: string;
  setIncorporationDate: (v: string) => void;
  businessAddress: string;
  setBusinessAddress: (v: string) => void;
  businessIndustry: string | null;
  setBusinessIndustry: (v: string | null) => void;
  numberOfEmployees: number | "";
  setNumberOfEmployees: (v: number | "") => void;
  annualRevenue: number | "";
  setAnnualRevenue: (v: number | "") => void;

  errors?: Record<string, string>;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

// Sensible cap for grid fields in the Identity form. Too small (the old
// 200px) left dead space in wide grid columns; no cap at all made every
// field balloon to ~300px+ regardless of content (Gender/DOB/Nationality
// don't need that much room). 260px is the sweet spot for this modal's
// content width at 4 columns — fields read as properly sized for their
// content, and the grid gap (not empty field padding) does the job of
// separating columns.
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
  const {
    customerNumber,
    customerType,
    setCustomerType,
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
    businessIndustry,
    setBusinessIndustry,
    numberOfEmployees,
    setNumberOfEmployees,
    annualRevenue,
    setAnnualRevenue,
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

  const customerNumberField = (
    <TextInput
      maw={FIELD_MAW}
      size="xs"
      radius="md"
      label="Customer number (auto)"
      value={customerNumber}
      disabled
      classNames={readOnlyClassNames}
    />
  );

  const typeHeaderRow = (
    <Group align="flex-end" gap="md" mb="sm">
      <Stack gap={2}>
        <Text size="xs" fw={600} c="slate.6">
          Customer Type
        </Text>
        {typeToggle}
      </Stack>
      {customerNumberField}
    </Group>
  );

  return (
    <Stack gap="xs">
      {!isBusiness && (
        <PlainCard>
          <SectionHeader
            icon={IconClipboardCheck}
            title="Identity"
            badge="REQUIRED"
          />

          {typeHeaderRow}

          {/*
            Widths are in `ch` (character-width, relative to font-size)
            instead of raw px. A fixed px guess like 220px is still
            arbitrary — it doesn't actually track the content, and it
            doesn't adapt if font size or zoom changes. `ch` sizes each
            field to roughly how many characters it needs to hold typical
            content (e.g. "Zimbabwean" needs far fewer than a full name),
            so it's genuinely content-driven. `maxWidth: "100%"` on every
            field means on a narrow viewport a field will still shrink to
            fit its wrapped row instead of overflowing.
          */}
          <Group gap="md" align="flex-start" wrap="wrap">
            <TextInput
              style={{ width: "22ch", maxWidth: "100%" }}
              radius="md"
              label="First name"
              placeholder="e.g. Bwalya"
              withAsterisk
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              error={errors.firstName}
            />
            <TextInput
              style={{ width: "16ch", maxWidth: "100%" }}
              radius="md"
              label="Middle name (Optional)"
              placeholder="Optional"
              value={middleName}
              onChange={(e) => setMiddleName(e.currentTarget.value)}
            />
            <TextInput
              style={{ width: "22ch", maxWidth: "100%" }}
              radius="md"
              label="Last name"
              placeholder="e.g. Mutale"
              withAsterisk
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              error={errors.lastName}
            />
            <TextInput
              style={{ width: "24ch", maxWidth: "100%" }}
              radius="md"
              label="Preferred name (Optional)"
              placeholder="What should we call them?"
              value={preferredName}
              onChange={(e) => setPreferredName(e.currentTarget.value)}
            />
            <Select
              style={{ width: "13ch", maxWidth: "100%" }}
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
            <Box style={{ width: "16ch", maxWidth: "100%" }}>
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
            </Box>
            {/* <TextInput
              maw={FIELD_MAW}
              radius="md"
              label="Age (calculated)"
              value={calcAge(dateOfBirth)}
              disabled
              classNames={readOnlyClassNames}
            /> */}
            <Select
              style={{ width: "18ch", maxWidth: "100%" }}
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
            <TextInput
              style={{ width: "20ch", maxWidth: "100%" }}
              radius="md"
              label="Occupation (Optional)"
              placeholder="e.g. Agronomist"
              value={occupation}
              onChange={(e) => setOccupation(e.currentTarget.value)}
            />
            <Select
              style={{ width: "18ch", maxWidth: "100%" }}
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
            <TextInput
              style={{ width: "22ch", maxWidth: "100%" }}
              radius="md"
              label="Employer (Optional)"
              placeholder="e.g. Ministry of Agriculture"
              value={employer}
              onChange={(e) => setEmployer(e.currentTarget.value)}
            />
          </Group>
        </PlainCard>
      )}

      {isBusiness && (
        <PlainCard dense>
          <SectionHeader
            icon={IconBuilding}
            title="Business information"
            badge="REQUIRED"
          />

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

          <Grid gap="sm" mt="xs">
            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Address line 1"
                placeholder="Plot / building / street"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="Address line 2 (Optional)"
                placeholder="Area / locality"
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                radius="md"
                label="City / town"
                placeholder="e.g. Lusaka"
              />
            </Grid.Col>
          </Grid>
        </PlainCard>
      )}
    </Stack>
  );
}