import { useState } from "react";
import {
  TextInput,
  Select,
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
  ScrollArea,
} from "@mantine/core";
import {
  IconBuilding,
  IconChevronDown,
  IconPlus,
  IconTrash,
  IconPencil,
  IconDots,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import type { BusinessDirector } from "../../../../hooks/customer/modal/useIdentityState";

interface DirectorsStakeholdersStepProps {
  directors: BusinessDirector[];
  addDirector: (patch?: Partial<Omit<BusinessDirector, "id">>) => void;
  updateDirector: (id: string, patch: Partial<BusinessDirector>) => void;
  removeDirector: (id: string) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

const ROLE_OPTIONS = ["Director", "Shareholder", "Director & Shareholder"];

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

// Matches the full BusinessDirector shape from useIdentityState.ts. The
// table UI here only edits fullName/role/shareholdingPercent — the rest
// (nationality/idType/idNumber/address/notes) ride along as empty defaults
// so this step's draft object stays assignable to the real type.
type DirectorDraft = Omit<BusinessDirector, "id">;

function emptyDraft(): DirectorDraft {
  return {
    fullName: "",
    role: "Director",
    shareholdingPercent: "",
    nationality: null,
    idType: null,
    idNumber: "",
    address: "",
    notes: "",
  };
}

const TABLE_ROW_MAX_VISIBLE = 6;
const TABLE_ROW_HEIGHT = 44;

export function DirectorsStakeholdersStep({
  directors,
  addDirector,
  updateDirector,
  removeDirector,
}: DirectorsStakeholdersStepProps) {
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
      nationality: d.nationality,
      idType: d.idType,
      idNumber: d.idNumber,
      address: d.address,
      notes: d.notes,
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
          value={draft.shareholdingPercent === "" ? "" : Number(draft.shareholdingPercent)}
          onChange={(v) =>
            setDraft({
              ...draft,
              shareholdingPercent: v === "" ? "" : String(v),
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
          <Table.Th style={{ color: "var(--mantine-color-slate-5)", width: "36%" }}>
            Name
          </Table.Th>
          <Table.Th style={{ color: "var(--mantine-color-slate-5)", width: "24%" }}>
            Role
          </Table.Th>
          <Table.Th style={{ color: "var(--mantine-color-slate-5)", width: "18%" }}>
            Ownership %
          </Table.Th>
          <Table.Th style={{ color: "var(--mantine-color-slate-5)", width: "22%" }}>
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
                    <Text size="sm" fw={700}>
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
                  {d.shareholdingPercent === "" ? "—" : `${d.shareholdingPercent}%`}
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
                      <ActionIcon variant="default" radius="md" aria-label="More actions">
                        <IconDots size={14} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconPencil size={13} />} onClick={() => openEdit(d)}>
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
    <PlainCard>
      <SectionHeader
        icon={IconBuilding}
        title="Directors & stakeholders"
        badge="REQUIRED"
      />
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
    </PlainCard>
  );
}