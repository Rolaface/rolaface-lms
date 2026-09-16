import { useMemo } from "react";
import { SimpleGrid, TextInput, Select, Box, Text, Group, Checkbox, Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturnType } from "@mantine/form";
import { getAllCountries } from "../../../api/loanApplicationApi"; 

interface ApplicantProps {
  form: UseFormReturnType<any>;
  readOnly?: boolean;
}

const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"];

function Label({
  text,
  required,
  optional,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

export function Applicant({ form, readOnly = false }: ApplicantProps) {
  const { data: countryResponse, isLoading: isCountriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: getAllCountries,
  });

  const countryOptions = useMemo(() => {
    const countries = countryResponse?.message?.data || [];
    return countries.map((c: any) => ({ value: c.value, label: c.label }));
  }, [countryResponse]);

  return (
    <Stack gap="xl">
      {/* Personal Details */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
        <TextInput
          radius="md"
          label={<Label text="Applicant first name" required />}
          placeholder="e.g. John"
          {...form.getInputProps("applicantFirstName")}
          readOnly={readOnly}
        />
        <TextInput
          radius="md"
          label={<Label text="Applicant middle name" optional />}
          placeholder="e.g. K."
          {...form.getInputProps("applicantMiddleName")}
          readOnly={readOnly}
        />
        <TextInput
          radius="md"
          label={<Label text="Applicant last name" required />}
          placeholder="e.g. Doe"
          {...form.getInputProps("applicantLastName")}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          type="tel"
          label={<Label text="Applicant phone" required />}
          placeholder="e.g. 0971234567"
          value={form.values.applicantPhone}
          onChange={(e) =>
            form.setFieldValue("applicantPhone", e.currentTarget.value.replace(/\D/g, ""))
          }
          error={form.errors.applicantPhone}
          readOnly={readOnly}
        />
        <TextInput
          radius="md"
          type="email"
          label={<Label text="Applicant email" required />}
          placeholder="e.g. john.doe@example.com"
          value={form.values.applicantEmail}
          onChange={(e) => {
            form.setFieldValue("applicantEmail", e.currentTarget.value);
            form.validateField("applicantEmail");
          }}
          error={form.errors.applicantEmail}
          readOnly={readOnly}
        />
        <TextInput
          radius="md"
          label={<Label text="Applicant NRC" required />}
          placeholder="e.g. 123456/78/1"
          {...form.getInputProps("applicantNrc")}
          readOnly={readOnly}
        />

        <Select
          radius="md"
          label={<Label text="Applicant gender" required />}
          placeholder="Select"
          data={GENDERS}
          {...form.getInputProps("applicantGender")}
          disabled={readOnly}
        />
        <Select
          radius="md"
          label={<Label text="Marital status" required />}
          placeholder="Select"
          data={MARITAL_STATUSES}
          {...form.getInputProps("applicantMaritalStatus")}
          disabled={readOnly}
        />
        <DateInput
          radius="md"
          label={<Label text="Birth date" required />}
          valueFormat="DD-MMM-YYYY"
          placeholder="DD-MMM-YYYY"
          value={form.values.applicantBirthDate ? new Date(form.values.applicantBirthDate) : null}
          onChange={(date) =>
            form.setFieldValue(
              "applicantBirthDate",
              date ? new Date(date).toISOString().slice(0, 10) : ""
            )
          }
          error={form.errors.applicantBirthDate}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          label={<Label text="Applicant position" required />}
          placeholder="e.g. Managing Director"
          {...form.getInputProps("applicantPosition")}
          readOnly={readOnly}
        />
        <Select
          radius="md"
          label={<Label text="Applicant nationality" required />}
          placeholder={isCountriesLoading ? "Loading..." : "Select"}
          searchable
          clearable
          data={countryOptions}
          disabled={isCountriesLoading || readOnly}
          {...form.getInputProps("applicantNationality")}
        />
      </SimpleGrid>

      {/* Address Details */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {/* Present / Residential Address */}
        <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
          <Text fw={600} mb="md">Residential Address</Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
            <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
              <TextInput radius="md" label={<Label text="Address Line 1" required />} placeholder="Plot / street, area" readOnly={readOnly} style={{ flex: 1 }} />
              <TextInput radius="md" label={<Label text="Address Line 2" />} placeholder="Apartment, suite, etc." readOnly={readOnly} style={{ flex: 1 }} />
            </div>
            <TextInput radius="md" label={<Label text="City / Town" required />} placeholder="e.g. Lusaka" readOnly={readOnly} />
            <Select radius="md" searchable label={<Label text="State / Province" />} placeholder="Select" disabled={readOnly} data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]} />
            <Select radius="md" searchable label={<Label text="Country" required />} placeholder={isCountriesLoading ? "Loading..." : "Select"} disabled={isCountriesLoading || readOnly} data={countryOptions} />
            <TextInput radius="md" label={<Label text="Postal Code" />} placeholder="e.g. 10101" readOnly={readOnly} />
          </SimpleGrid>
        </Box>

        {/* Permanent / Mailing Address */}
        <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Permanent Address</Text>
            <Checkbox label="Same as residential" size="sm" />
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
            <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
              <TextInput radius="md" label={<Label text="Address Line 1" required />} placeholder="Plot / street, area" readOnly={readOnly} style={{ flex: 1 }} />
              <TextInput radius="md" label={<Label text="Address Line 2" />} placeholder="Apartment, suite, etc." readOnly={readOnly} style={{ flex: 1 }} />
            </div>
            <TextInput radius="md" label={<Label text="City / Town" required />} placeholder="e.g. Lusaka" readOnly={readOnly} />
            <Select radius="md" searchable label={<Label text="State / Province" />} placeholder="Select" disabled={readOnly} data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]} />
            <Select radius="md" searchable label={<Label text="Country" required />} placeholder={isCountriesLoading ? "Loading..." : "Select"} disabled={isCountriesLoading || readOnly} data={countryOptions} />
            <TextInput radius="md" label={<Label text="Postal Code" />} placeholder="e.g. 10101" readOnly={readOnly} />
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}