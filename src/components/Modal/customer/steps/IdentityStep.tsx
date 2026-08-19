import { useState } from "react";
import {
  SimpleGrid,
  TextInput,
  Select,
  SegmentedControl,
  Stack,
  Group,
  ActionIcon,
  Text,
  NumberInput,
  UnstyledButton,
  Table,
  Avatar,
  Badge,
  Menu,
  Button,
  Modal,
  ScrollArea,
  Grid,
  Box,
} from "@mantine/core";
import {
  IconChevronDown,
  IconClipboardCheck,
  IconUser,
  IconBuilding,
  IconPlus,
  IconTrash,
  IconPencil,
  IconDots,
  IconCheck,
  IconX,
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

export interface BusinessDirector {
  id: string;
  fullName: string;
  role: string;
  shareholdingPercent: number | "";
}

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

  directors: BusinessDirector[];
  addDirector: (patch?: Partial<Omit<BusinessDirector, "id">>) => void;
  updateDirector: (id: string, patch: Partial<BusinessDirector>) => void;
  removeDirector: (id: string) => void;

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

const ROLE_OPTIONS = ["Director", "Shareholder", "Director & Shareholder"];

// Deterministic avatar color per person so the same name always renders the
// same accent.
const AVATAR_COLORS = [
  "brand",
  "teal",
  "grape",
  "orange",
  "cyan",
  "indigo",
  "pink",
];
function colorForName(name: string) {
  const key = name.trim() || "?";
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type DirectorDraft = Omit<BusinessDirector, "id">;

function emptyDraft(): DirectorDraft {
  return { fullName: "", role: "Director", shareholdingPercent: "" };
}

const TABLE_ROW_MAX_VISIBLE = 3;
const TABLE_ROW_HEIGHT = 44;

function DirectorsShareholdersTable({
  directors,
  addDirector,
  updateDirector,
  removeDirector,
}: {
  directors: BusinessDirector[] | undefined;
  addDirector: (patch?: Partial<Omit<BusinessDirector, "id">>) => void;
  updateDirector: (id: string, patch: Partial<BusinessDirector>) => void;
  removeDirector: (id: string) => void;
}) {
  const safeDirectors = directors ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState<DirectorDraft>(emptyDraft());

  const openAdd = () => {
    setDraft(emptyDraft());
    setEditingId("new");
  };
  const openEdit = (d: BusinessDirector) => {
    setDraft({
      fullName: d.fullName,
      role: d.role,
      shareholdingPercent: d.shareholdingPercent,
    });
    setEditingId(d.id);
  };
  const cancelEdit = () => setEditingId(null);

  const canSave =
    draft.fullName.trim().length > 0 &&
    !!draft.role &&
    draft.shareholdingPercent !== "";

  const handleSave = () => {
    if (!canSave) return;
    if (editingId === "new") addDirector(draft);
    else if (editingId) updateDirector(editingId, draft);
    setEditingId(null);
  };

  const renderEditableRow = (key: string) => (
    <Table.Tr key={key} style={{ height: TABLE_ROW_HEIGHT }}>
      <Table.Td>
        <TextInput
          size="xs"
          radius="md"
          placeholder="Full name"
          value={draft.fullName}
          onChange={(e) =>
            setDraft({ ...draft, fullName: e.currentTarget.value })
          }
        />
      </Table.Td>
      <Table.Td>
        <Select
          size="xs"
          radius="md"
          rightSection={chevron}
          data={ROLE_OPTIONS}
          value={draft.role}
          onChange={(v) => setDraft({ ...draft, role: v ?? "Director" })}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          size="xs"
          radius="md"
          min={0}
          max={100}
          hideControls
          value={draft.shareholdingPercent}
          onChange={(v) =>
            setDraft({
              ...draft,
              shareholdingPercent: v === "" ? "" : Number(v),
            })
          }
        />
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="filled"
            color="brand"
            radius="md"
            disabled={!canSave}
            onClick={handleSave}
            aria-label="Save"
          >
            <IconCheck size={14} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            radius="md"
            onClick={cancelEdit}
            aria-label="Cancel"
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );

  const needsScroll = safeDirectors.length > TABLE_ROW_MAX_VISIBLE;

  const tableBody = (
    <Table
      verticalSpacing={0}
      horizontalSpacing="lg"
      style={{ tableLayout: "fixed", width: "100%" }}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th
            style={{ color: "var(--mantine-color-slate-5)", width: "36%" }}
          >
            Name
          </Table.Th>
          <Table.Th
            style={{ color: "var(--mantine-color-slate-5)", width: "24%" }}
          >
            Role
          </Table.Th>
          <Table.Th
            style={{ color: "var(--mantine-color-slate-5)", width: "18%" }}
          >
            Ownership %
          </Table.Th>
          <Table.Th
            style={{ color: "var(--mantine-color-slate-5)", width: "22%" }}
          >
            Action
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {safeDirectors.length === 0 && editingId !== "new" && (
          <Table.Tr>
            <Table.Td colSpan={4}>
              <Text size="sm" c="slate.5" ta="center" py="md">
                No directors or shareholders added yet.
              </Text>
            </Table.Td>
          </Table.Tr>
        )}

        {safeDirectors.map((d) =>
          editingId === d.id ? (
            renderEditableRow(d.id)
          ) : (
            <Table.Tr key={d.id} style={{ height: TABLE_ROW_HEIGHT }}>
              <Table.Td>
                <Group gap={8} wrap="nowrap">
                  <Avatar
                    radius="xl"
                    size={28}
                    color={colorForName(d.fullName)}
                    variant="light"
                  >
                    <Text size={11} fw={700}>
                      {initialsForName(d.fullName)}
                    </Text>
                  </Avatar>
                  <Text size="sm" fw={600} c="slate.8" truncate>
                    {d.fullName || "Unnamed"}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="slate.6">
                  {d.role}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="slate.6">
                  {d.shareholdingPercent === ""
                    ? "—"
                    : `${d.shareholdingPercent}%`}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <Button
                    size="xs"
                    radius="md"
                    variant="default"
                    leftSection={<IconPencil size={12} />}
                    onClick={() => openEdit(d)}
                  >
                    Edit
                  </Button>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        variant="default"
                        radius="md"
                        aria-label="More actions"
                      >
                        <IconDots size={14} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconPencil size={13} />}
                        onClick={() => openEdit(d)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        color="danger"
                        leftSection={<IconTrash size={13} />}
                        onClick={() => removeDirector(d.id)}
                      >
                        Remove
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ),
        )}
        {editingId === "new" && renderEditableRow("new")}
      </Table.Tbody>
    </Table>
  );

  return (
    <Stack gap="sm" mt="xs">
      <Group justify="space-between" align="center">
        <Group gap={8} align="center">
          <Text size="sm" fw={700} c="slate.8">
            Directors &amp; shareholders
          </Text>
          <Badge size="sm" radius="sm" variant="light" color="brand">
            {safeDirectors.length}
          </Badge>
        </Group>
      </Group>

      {needsScroll ? (
        <ScrollArea.Autosize
          mah={TABLE_ROW_HEIGHT * TABLE_ROW_MAX_VISIBLE + 40}
          type="auto"
        >
          {tableBody}
        </ScrollArea.Autosize>
      ) : (
        tableBody
      )}

      {editingId === null && (
        <UnstyledButton
          onClick={openAdd}
          style={{
            width: "100%",
            border: "1px dashed var(--mantine-color-slate-3)",
            borderRadius: "var(--mantine-radius-md)",
            padding: "10px 0",
            textAlign: "center",
          }}
        >
          <Group gap={6} justify="center">
            <IconPlus size={14} color="var(--mantine-color-brand-6)" />
            <Text size="sm" fw={600} c="brand.6">
              Add director or shareholder
            </Text>
          </Group>
        </UnstyledButton>
      )}
    </Stack>
  );
}

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
    directors,
    addDirector,
    updateDirector,
    removeDirector,
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

          <DirectorsShareholdersTable
            directors={directors}
            addDirector={addDirector}
            updateDirector={updateDirector}
            removeDirector={removeDirector}
          />
        </PlainCard>
      )}
    </Stack>
  );
}
