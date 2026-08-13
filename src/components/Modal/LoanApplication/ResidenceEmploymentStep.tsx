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

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const NATIONALITIES = ["Zambian", "Zimbabwean", "Malawian", "South African", "Other"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"];

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

export function ResidenceEmploymentStep({ form, loanType }: StepProps) {
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

        <TextInput radius="md" type="tel" label={<Label text="Next of kin phone" required />} {...form.getInputProps("kinPhone")} />
        <TextInput radius="md" type="email" label={<Label text="Next of kin email" required />} {...form.getInputProps("kinEmail")} />
        <TextInput radius="md" label={<Label text="Relationship" required />} {...form.getInputProps("kinRelationship")} />
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
            <Group gap="sm" align="center">
              <Text fz="sm" fw={700} c="slate.8">
                Directors ({directors.length}/{MAX_DIRECTORS})
              </Text>
              <Text fz="xs" c="slate.5">
                Add up to 3 directors. Each director requires a name, phone, email, and NRC.
              </Text>
            </Group>
            
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

          <TextInput radius="md" type="tel" label={<Label text="Applicant phone" required />} {...form.getInputProps("applicantPhone")} />
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
          <TextInput
            radius="md"
            type="date"
            label={<Label text="Birth date" required />}
            {...form.getInputProps("applicantBirthDate")}
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
              />
              <TextInput
                radius="md"
                type="tel"
                label={<Label text="Director phone" required />}
                {...form.getInputProps(`directors.${editingIndex}.phone`)}
              />
              <TextInput
                radius="md"
                type="email"
                label={<Label text="Director email" required />}
                {...form.getInputProps(`directors.${editingIndex}.email`)}
              />
              <TextInput
                radius="md"
                label={<Label text="Director NRC" required />}
                {...form.getInputProps(`directors.${editingIndex}.nrc`)}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button color="brand" radius="md" onClick={handleCloseModal}>
                Done
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </>
  );
}