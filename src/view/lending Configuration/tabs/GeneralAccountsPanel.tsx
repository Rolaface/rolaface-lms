import { Paper, Group, Text, Table, Select, Skeleton } from "@mantine/core";
import { IconBuildingBank } from "@tabler/icons-react";
import { useGeneralAccounts } from "../../../hooks/setting/lending-config/useGeneralAccounts";

export function GeneralAccountsPanel() {
  const { rows, glAccounts, isLoading } = useGeneralAccounts();

  return (
    <Paper radius="sm" withBorder>
      <Group
        justify="space-between"
        align="center"
        p="md"
        bg="slate.0"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Group gap="xs">
          <IconBuildingBank size={16} />
          <Text size="sm" fw={600} c="slate.8">
            General Account Mapping
          </Text>
        </Group>
      </Group>

      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover={false} horizontalSpacing="lg" verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: "50%" }}>Account Type</Table.Th>
              <Table.Th style={{ width: "50%" }}>GL Account</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Skeleton height={20} width="60%" />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={30} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : rows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="slate.8">
                        {row.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Select
                        placeholder={row.value ? undefined : "Not configured"}
                        data={glAccounts}
                        value={row.value}
                        disabled
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export default GeneralAccountsPanel;