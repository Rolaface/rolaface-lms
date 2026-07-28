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