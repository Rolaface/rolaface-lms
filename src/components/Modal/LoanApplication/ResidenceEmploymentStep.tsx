import { useEffect, useState } from "react";
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
  ActionIcon,
  Checkbox,
  Collapse,
  Table,
  Paper
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight, IconChevronUp, IconPencil, IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
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
  readOnly?: boolean;
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

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

export function ResidenceEmploymentStep({ form, loanType, directorsError, readOnly = false }: StepProps) {
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
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ gridColumn: "1 / -1" }}>
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
      {/* <Group gap="xs" mt={2} mb={0} wrap="nowrap">
        <Text fz="sm" fw={700} c="slate.8" style={{ whiteSpace: "nowrap" }}>
          Next of Kin Details
        </Text>
        <Box
          style={{
            height: 1,
            flex: 1,
            backgroundColor: "var(--mantine-color-slate-2)",
          }}
        />
      </Group>

      <SimpleGrid
        cols={{ base: 1, sm: 3 }}
        spacing="md"
        verticalSpacing="sm"
      >
                <TextInput
          radius="md"
          label={<Label text="Next of kin name" required />}
          placeholder="e.g. John Doe"
          {...form.getInputProps("kinName")}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          type="tel"
          label={<Label text="Next of kin phone" required />}
          placeholder="e.g. 0971234567"
          value={form.values.kinPhone}
          onChange={(e) =>
            form.setFieldValue(
              "kinPhone",
              e.currentTarget.value.replace(/\D/g, "")
            )
          }
          error={form.errors.kinPhone}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          type="email"
          label={<Label text="Next of kin email" required />}
          placeholder="e.g. john.doe@example.com"
          value={form.values.kinEmail}
          onChange={(e) => {
            form.setFieldValue("kinEmail", e.currentTarget.value);
            form.validateField("kinEmail");
          }}
          error={form.errors.kinEmail}
          readOnly={readOnly}
        />

        <Select
          radius="md"
          label={<Label text="Relationship" required />}
          placeholder="Select relationship"
          data={RELATIONSHIPS}
          {...form.getInputProps("kinRelationship")}
          // style={{ gridColumn: "1 / -1" }}
          disabled={readOnly}
        />
      </SimpleGrid> */}
    </Stack>
  );
}

  // --- Business: Directors & Applicant ---
  const directors = form.values.directors || [];
  const [expandedDirectors, setExpandedDirectors] = useState<number[]>([]);

  const [page, setPage] = useState(1);
const ROWS_PER_PAGE = 6;
const totalPages = Math.max(1, Math.ceil(directors.length / ROWS_PER_PAGE));

  const handleAddDirector = () => {
    form.insertListItem("directors", { id: nextId(), name: "", phone: "", email: "", nrc: "" });
const nextTotalPages = Math.max(1, Math.ceil((directors.length + 1) / ROWS_PER_PAGE));
setPage(nextTotalPages);
  };
  const handleDeleteDirector = (index: number) => {
    form.removeListItem("directors", index);
  };
useEffect(() => {
  if (page > totalPages) setPage(totalPages);
}, [page, totalPages]);

const paginatedDirectors = useMemo(() => {
  const start = (page - 1) * ROWS_PER_PAGE;
  return directors
    .map((dir, idx) => ({ dir, idx }))
    .slice(start, start + ROWS_PER_PAGE);
}, [directors, page]);

  return (
    <>
      <Stack gap="sm">
          {/* Directors Section */}
   <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
  <Group justify="space-between" align="flex-start" p="md" pb="xs">
    <Box>
      <Group gap="xs" align="center">
        <Text fz="lg" fw={700} c="dark.9" style={{ letterSpacing: "-0.5px" }}>
          Active Directors
        </Text>
        <Box px={10} py={2} bg="slate.1" c="slate.7" fw={600} style={{ borderRadius: "var(--mantine-radius-xl)", fontSize: "12px" }}>
          {directors.length} Recorded
        </Box>
      </Group>
      <Text fz="sm" c="slate.5" mt={4}>
        Add directors. Each director requires a name, phone, email, and NRC.
      </Text>
      {directorsError && (
        <Text fz="xs" c="red.6" mt={4}>
          {directorsError}
        </Text>
      )}
    </Box>
  </Group>

  <Table.ScrollContainer minWidth={780}>
    <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
      <Table.Thead>
        <Table.Tr>
          <Table.Th className="w-16">No.</Table.Th>
          <Table.Th>Director Name</Table.Th>
          <Table.Th>Phone</Table.Th>
          <Table.Th>Email</Table.Th>
          <Table.Th>NRC</Table.Th>
          {!readOnly && <Table.Th className="w-24" />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {directors.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={readOnly ? 5 : 6} className="text-center py-10">
              <div className="flex flex-col items-center gap-2">
                <IconUsers size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                <Text size="xs" c="slate.4">
                  No directors added yet. Click &ldquo;+ Add Director&rdquo; to create one.
                </Text>
              </div>
            </Table.Td>
          </Table.Tr>
        ) : (
          paginatedDirectors.map(({ dir, idx }, rowIndex) => (
            <Table.Tr key={dir.id}>
              <Table.Td>
                <Text size="sm" fw={500} c="slate.6">
                  {(page - 1) * ROWS_PER_PAGE + rowIndex + 1}
                </Text>
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="sm"
                  placeholder="e.g. John Doe"
                  {...form.getInputProps(`directors.${idx}.name`)}
                  onBlur={() => form.validateField(`directors.${idx}.name`)}
                  readOnly={readOnly}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="sm"
                  type="tel"
                  placeholder="e.g. 0971234567"
                  value={form.values.directors[idx].phone}
                  onChange={(e) =>
                    form.setFieldValue(`directors.${idx}.phone`, e.currentTarget.value.replace(/\D/g, ""))
                  }
                  onBlur={() => form.validateField(`directors.${idx}.phone`)}
                  error={form.errors[`directors.${idx}.phone`]}
                  readOnly={readOnly}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="sm"
                  type="email"
                  placeholder="e.g. jane.doe@example.com"
                  value={form.values.directors[idx].email}
                  onChange={(e) => {
                    form.setFieldValue(`directors.${idx}.email`, e.currentTarget.value);
                    form.validateField(`directors.${idx}.email`);
                  }}
                  onBlur={() => form.validateField(`directors.${idx}.email`)}
                  error={form.errors[`directors.${idx}.email`]}
                  readOnly={readOnly}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="sm"
                  placeholder="e.g. 123456/78/1"
                  {...form.getInputProps(`directors.${idx}.nrc`)}
                  onBlur={() => form.validateField(`directors.${idx}.nrc`)}
                  readOnly={readOnly}
                />
              </Table.Td>
              {!readOnly && (
                <Table.Td>
                  <div className="flex items-center gap-1 justify-end">
                    <ActionIcon
                      variant="subtle"
                      color="danger"
                      size="sm"
                      onClick={() => handleDeleteDirector(idx)}
                      aria-label="Delete director"
                    >
                      <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                  </div>
                </Table.Td>
              )}
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  </Table.ScrollContainer>

  {!readOnly && (
    <Group
      justify="space-between"
      className="p-3"
      style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-white)" }}
    >
      <Button
        variant="subtle"
        color="brand"
        size="xs"
        leftSection={<IconPlus size={16} stroke={2.5} />}
        onClick={handleAddDirector}
      >
        Add Director
      </Button>

      {directors.length > ROWS_PER_PAGE && (
        <Group gap="xs">
          <Text size="xs" c="slate.5">
            Page {page} of {totalPages}
          </Text>
          <ActionIcon variant="default" size="sm" radius="md" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <IconChevronLeft size={14} />
          </ActionIcon>
          <ActionIcon variant="default" size="sm" radius="md" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <IconChevronRight size={14} />
          </ActionIcon>
        </Group>
      )}
    </Group>
  )}
</Paper>
       </Stack>
    </>
  );
}