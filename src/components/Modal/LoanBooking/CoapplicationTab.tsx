import {
  Text,
  TextInput,
  Button,
  Table,
  Checkbox,
  ActionIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconSearch, IconInfoCircle, IconPencil, IconTrash, IconPlus } from "@tabler/icons-react";

export interface CoApplicant {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

interface CoApplicantTabProps {
  search: string;
  onSearchChange: (v: string) => void;
  coApplicants: CoApplicant[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Omit<CoApplicant, "id">, value: string) => void;
  onRemove: (id: string) => void;
}

export function CoApplicantTab({
  search,
  onSearchChange,
  coApplicants,
  onAdd,
  onUpdate,
  onRemove,
}: CoApplicantTabProps) {
  return (
    <div className="bg-white p-6 border border-slate-200 rounded-md">
      <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Find Existing Customer
          </Text>
          <Tooltip label="Search for an existing customer to add as a co-applicant." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <TextInput
            size="sm"
            placeholder="Search by name or customer number..."
            leftSection={<IconSearch size={14} className="text-slate-400" />}
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 px-6 w-full sm:w-auto"
          >
            Search
          </Button>
        </div>
      </div>

      <div className="mb-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-indigo-700 rounded-full" />
          <Text size="lg" fw={700} className="text-slate-900">
            Co-Applicants
          </Text>
          <Tooltip label="Add and manage co-applicants linked to this loan account." withArrow>
            <IconInfoCircle size={14} className="text-slate-400 ml-1 cursor-help" />
          </Tooltip>
        </div>
        <Text size="sm" className="text-slate-500">
          Manage co-applicants linked to this application.
        </Text>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
            <Table.Thead className="bg-slate-50/50">
              <Table.Tr>
                <Table.Th className="w-12">
                  <Checkbox size="sm" />
                </Table.Th>
                <Table.Th className="w-16 font-semibold text-slate-800">No.</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Applicant Name</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Applicant Email</Table.Th>
                <Table.Th className="font-semibold text-slate-800">Applicant Mobile</Table.Th>
                <Table.Th className="w-24" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {coApplicants.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center py-8 text-slate-400">
                    No co-applicants added yet. Click "+ Add co-applicant" to create one.
                  </Table.Td>
                </Table.Tr>
              ) : (
                coApplicants.map((c, index) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Checkbox size="sm" />
                    </Table.Td>
                    <Table.Td className="text-slate-600 font-medium">{index + 1}</Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.name}
                        onChange={(e) => onUpdate(c.id, "name", e.currentTarget.value)}
                        placeholder="Enter name"
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.email}
                        onChange={(e) => onUpdate(c.id, "email", e.currentTarget.value)}
                        placeholder="Enter email"
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="sm"
                        value={c.mobile}
                        onChange={(e) => onUpdate(c.id, "mobile", e.currentTarget.value)}
                        placeholder="Enter mobile"
                        classNames={{ input: "bg-white" }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1 justify-end">
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onRemove(c.id)}>
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <div className="border-t border-slate-200 p-3 bg-white">
          <UnstyledButton
            className="flex items-center gap-2 text-[#4F46E5] font-semibold text-sm hover:text-indigo-800 transition-colors px-2 py-1 rounded"
            onClick={onAdd}
          >
            <IconPlus size={16} stroke={2.5} />
            Add co-applicant
          </UnstyledButton>
        </div>
      </div>
    </div>
  );
}