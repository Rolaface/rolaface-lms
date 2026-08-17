import { useState } from "react";
import { 
  SimpleGrid, 
  TextInput, 
  Select, 
  Box, 
  Group, 
  Text, 
  Button, 
  Stack, 
  Modal,
  ActionIcon
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType, DirectorEntry } from "./LoanApplicationModal";
import { getAllCountries } from "../../../api/loanApplicationApi";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateInput } from "@mantine/dates";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
    directorsError?: string | null;
}

const RELATIONSHIPS = [ "Spouse", "Parent", "Child", "Sibling", "Other",];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
];

const nextId = () => Math.random().toString(36).slice(2, 10);
const MAX_DIRECTORS = 3;

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

// export function ResidenceEmploymentStep({ form, loanType }: StepProps) {
export function ResidenceEmploymentStep({ form, loanType, directorsError }: StepProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: countryResponse, isLoading: isCountriesLoading } = useQuery({
  queryKey: ["countries"],
  queryFn: getAllCountries,
});

const countryOptions = useMemo(() => {
  const countries = countryResponse?.message?.data || [];
  return countries.map((c: any) => ({ value: c.value, label: c.label }));
}, [countryResponse]);

  if (loanType === "Personal") {
    return (
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
        <TextInput
          radius="md"
          label={<Label text="Residential address" required />}
          {...form.getInputProps("residentialAddress")}
        />
        <TextInput radius="md" label={<Label text="Occupation" required />} {...form.getInputProps("occupation")} />
        <TextInput
          radius="md"
          label={<Label text="Employer name" required />}
          {...form.getInputProps("employerName")}
        />

     <Select
  radius="md"
  label={<Label text="Nationality" required />}
  placeholder={isCountriesLoading ? "Loading..." : "Select nationality"}
  searchable
  clearable
  data={countryOptions}
  disabled={isCountriesLoading}
  {...form.getInputProps("nationality")}
/>
        <TextInput
          radius="md"
          label={<Label text="Principal objective of loan" required />}
          {...form.getInputProps("principalObjective")}
        />
        <TextInput
          radius="md"
          label={<Label text="Next of kin name" required />}
          {...form.getInputProps("kinName")}
        />

        {/* <TextInput radius="md" type="tel" label={<Label text="Next of kin phone" required />} {...form.getInputProps("kinPhone")} /> */}
        <TextInput
  radius="md"
  type="tel"
  label={<Label text="Next of kin phone" required />}
  value={form.values.kinPhone}
  onChange={(e) => form.setFieldValue("kinPhone", e.currentTarget.value.replace(/\D/g, ""))}
  error={form.errors.kinPhone}
/>
        <TextInput radius="md" type="email" label={<Label text="Next of kin email" required />} {...form.getInputProps("kinEmail")} />
        {/* <TextInput radius="md" label={<Label text="Relationship" required />} {...form.getInputProps("kinRelationship")} /> */}
        <Select
  radius="md"
  label={<Label text="Relationship" required />}
  placeholder="Select"
  data={RELATIONSHIPS}
  {...form.getInputProps("kinRelationship")}
/>
      </SimpleGrid>
    );
  }

  // --- Business: Directors & Applicant ---
  const directors = form.values.directors || [];

  const handleAddDirector = () => {
    if (directors.length >= MAX_DIRECTORS) return;
    const newIndex = directors.length;
    form.insertListItem("directors", { id: nextId(), name: "", phone: "", email: "", nrc: "" });
    setEditingIndex(newIndex);
    open();
  };

  const handleEditDirector = (index: number) => {
    setEditingIndex(index);
    open();
  };

  const handleDeleteDirector = (index: number) => {
    form.removeListItem("directors", index);
  };
  const handleDone = () => {
    if (editingIndex === null) return;
    const nameErr = form.validateField(`directors.${editingIndex}.name`).hasError;
    const phoneErr = form.validateField(`directors.${editingIndex}.phone`).hasError;
    const emailErr = form.validateField(`directors.${editingIndex}.email`).hasError;
    const nrcErr = form.validateField(`directors.${editingIndex}.nrc`).hasError;

    if (nameErr || phoneErr || emailErr || nrcErr) return;

    setEditingIndex(null);
    close();
  };

  const handleCloseModal = () => {
    // Cleanup: If a user opened "Add Director" but didn't fill anything out, remove it.
    if (editingIndex !== null) {
      const current = form.values.directors[editingIndex];
      if (current && !current.name && !current.phone && !current.email && !current.nrc) {
        form.removeListItem("directors", editingIndex);
      }
    }
    setEditingIndex(null);
    close();
  };

  return (
    <>
      <Stack gap="sm">
               <Group justify="space-between" align="center">
            {/* Replaced Box with Group and added align="center" for perfect vertical alignment */}
            {/* <Group gap="sm" align="center">
              <Text fz="sm" fw={700} c="slate.8">
                Directors ({directors.length}/{MAX_DIRECTORS})
              </Text>
              <Text fz="xs" c="slate.5">
                Add up to 3 directors. Each director requires a name, phone, email, and NRC.
              </Text>
            </Group>
             */}
             <Box>
              <Group gap="sm" align="center">
                <Text fz="sm" fw={700} c="slate.8">
                  Directors ({directors.length}/{MAX_DIRECTORS})
                </Text>
                <Text fz="xs" c="slate.5">
                  Add up to 3 directors. Each director requires a name, phone, email, and NRC.
                </Text>
              </Group>
              {directorsError && (
                <Text fz="xs" c="red.6" mt={4}>
                  {directorsError}
                </Text>
              )}
            </Box>
            <Button 
              variant="light" 
              color="brand" 
              radius="md" 
              size="sm" 
              onClick={handleAddDirector}
              disabled={directors.length >= MAX_DIRECTORS}
            >
              Add Director
            </Button>
          </Group>

          {directors.length > 0 && (
            <Stack gap="sm">
              {directors.map((dir, idx) => (
                <Group 
                  key={dir.id} 
                  justify="space-between" 
                  align="center"
                  className="border border-slate-200 bg-slate-50 rounded-md p-2"
                >
                  <Box>
                    <Text fz="sm" fw={600} c="slate.8">
                      {dir.name || `Director ${idx + 1} (Incomplete)`}
                    </Text>
                    <Text fz="xs" c="slate.5">
                      {dir.nrc ? `NRC: ${dir.nrc}` : "NRC pending"} • {dir.phone || "Phone pending"}
                    </Text>
                  </Box>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="subtle" 
                      color="brand" 
                      onClick={() => handleEditDirector(idx)}
                      aria-label="Edit director"
                    >
                      <IconPencil size={18} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      onClick={() => handleDeleteDirector(idx)}
                      aria-label="Delete director"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        {/* </Box> */}

        {/* Applicant Details */}
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="md">
          <TextInput
            radius="md"
            label={<Label text="Applicant first name" required />}
            {...form.getInputProps("applicantFirstName")}
          />
          <TextInput
            radius="md"
            label={<Label text="Applicant middle name" optional />}
            {...form.getInputProps("applicantMiddleName")}
          />
          <TextInput
            radius="md"
            label={<Label text="Applicant last name" required />}
            {...form.getInputProps("applicantLastName")}
          />

          {/* <TextInput radius="md" type="tel" label={<Label text="Applicant phone" required />} {...form.getInputProps("applicantPhone")} /> */}
          <TextInput
  radius="md"
  type="tel"
  label={<Label text="Applicant phone" required />}
  value={form.values.applicantPhone}
  onChange={(e) => form.setFieldValue("applicantPhone", e.currentTarget.value.replace(/\D/g, ""))}
  error={form.errors.applicantPhone}
/>
          <TextInput radius="md" type="email" label={<Label text="Applicant email" required />} {...form.getInputProps("applicantEmail")} />
          <TextInput radius="md" label={<Label text="Applicant NRC" required />} {...form.getInputProps("applicantNrc")} />

          <Select
            radius="md"
            label={<Label text="Applicant gender" required />}
            placeholder="Select"
            data={GENDERS}
            {...form.getInputProps("applicantGender")}
          />
          <Select
            radius="md"
            label={<Label text="Marital status" required />}
            placeholder="Select"
            data={MARITAL_STATUSES}
            {...form.getInputProps("applicantMaritalStatus")}
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
/>

          <TextInput
            radius="md"
            label={<Label text="Applicant address" required />}
            {...form.getInputProps("applicantAddress")}
          />
          <TextInput
            radius="md"
            label={<Label text="Applicant position" required />}
            {...form.getInputProps("applicantPosition")}
          />
          <Select
  radius="md"
  label={<Label text="Applicant nationality" required />}
  placeholder={isCountriesLoading ? "Loading..." : "Select"}
  searchable
  clearable
  data={countryOptions}
  disabled={isCountriesLoading}
  {...form.getInputProps("applicantNationality")}
/>
        </SimpleGrid>
      </Stack>

      {/* Director Edit/Add Modal */}
      <Modal 
        opened={opened && editingIndex !== null} 
        onClose={handleCloseModal} 
        size="lg" 
        title={
          <Text fz="lg" fw={700} c="slate.8">
            {editingIndex !== null && form.values.directors[editingIndex]?.name 
              ? "Edit Director" 
              : "Add Director"}
          </Text>
        }
      >
        {editingIndex !== null && (
          <Box>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing="md" mb="xl">
             <TextInput
                radius="md"
                label={<Label text="Director name" required />}
                {...form.getInputProps(`directors.${editingIndex}.name`)}
                onBlur={() => form.validateField(`directors.${editingIndex}.name`)}
              />
            <TextInput
  radius="md"
  type="tel"
  label={<Label text="Director phone" required />}
  value={form.values.directors[editingIndex].phone}
  onChange={(e) =>
    form.setFieldValue(`directors.${editingIndex}.phone`, e.currentTarget.value.replace(/\D/g, ""))
  }
  onBlur={() => form.validateField(`directors.${editingIndex}.phone`)}
  error={form.errors[`directors.${editingIndex}.phone`]}
/>
             <TextInput
                radius="md"
                type="email"
                label={<Label text="Director email" required />}
                {...form.getInputProps(`directors.${editingIndex}.email`)}
                onBlur={() => form.validateField(`directors.${editingIndex}.email`)}
              />
             <TextInput
                radius="md"
                label={<Label text="Director NRC" required />}
                {...form.getInputProps(`directors.${editingIndex}.nrc`)}
                onBlur={() => form.validateField(`directors.${editingIndex}.nrc`)}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button variant="default" radius="md" onClick={handleCloseModal}>
                Close
              </Button>
              <Button color="brand" radius="md" onClick={handleDone}>
                Done
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </>
  );
}