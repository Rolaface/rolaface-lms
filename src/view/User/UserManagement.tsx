import { Box, Button, TextInput, Group, Paper, Table, Badge, ActionIcon, Text, Pagination, Tooltip, Title, Stack, useMantineTheme, Loader, Select } from '@mantine/core';
import { IconEye, IconPencil, IconPlus, IconSearch, IconFileOff, IconTrash, IconUsers } from '@tabler/icons-react';
import { useUserList } from '../../hooks/user/useUserList';
import { openCommonModal } from '../../components/Modal/AlertModal';
import { userModal } from '../../components/Modal/User/Usermodalstore';
import type { UserRow } from '../../api/User/userApi';

export function UserManagement() {
  const theme = useMantineTheme();
  const {
    searchInput, setSearchInput,
    page, setPage,
    pageSize, setPageSize,
    rows, pagination, loading,
    handleDelete, deletingId,
    openEdit, openView, loadingId,
  } = useUserList();

  const confirmDelete = (row: UserRow) => {
    openCommonModal({
      heading: 'Delete User',
      subtitle: 'This action cannot be undone.',
      body: <>Are you sure you want to delete user <Text span fw={600}>{row.name}</Text>?</>,
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        { label: 'Delete', color: 'red', onClick: () => handleDelete(row.id) },
      ],
    });
  };

  const totalRows = pagination?.total ?? 0;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box style={{ width: 40, height: 40, borderRadius: 'var(--mantine-radius-md)', background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconUsers size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>User Management</Title>
            <Text fz="sm" c="slate.5">Manage system users and their access</Text>
          </Stack>
        </Group>
      </Group>

      <Paper radius="xl" p="xs" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            size="sm" radius="xl" placeholder="Search by name / email / username"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />
          <Group gap="xs" ml="auto">
            <Button
              size="sm" radius="xl" color="brand" onClick={() => userModal.open({})}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              Add User
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" w="100%" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Name</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Email</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Username</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Status</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textAlign: 'right', border: 'none' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr><Table.Td colSpan={5} style={{ border: 'none' }}><Text ta="center" c="slate.5" fz="xs" py="xl">Loading...</Text></Table.Td></Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <IconFileOff size={26} color="var(--mantine-color-slate-4)" />
                    <Text ta="center" c="slate.5" fz="xs">No users match your filters.</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const isRowLoading = loadingId === row.id;
                const isDeleting = deletingId === row.id;
                return (
                  <Table.Tr
                    key={row.id}
                    className="lms-row"
                    style={{ cursor: 'pointer' }}
                    onDoubleClick={() => {
                      if (isRowLoading || isDeleting) return;
                      openView(row);
                    }}
                  >
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)', borderLeft: '3px solid var(--mantine-color-brand-4)' }}>
                      <Text fz="sm" fw={700} c="slate.8">{row.name}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Text fz="xs" c="slate.5">{row.email}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Text fz="xs" c="slate.5">{row.username}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Badge variant="light" size="sm" radius="sm" color={row.enabled ? 'success' : 'danger'} styles={{ root: { fontSize: 10 } }}>
                        {row.enabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Group justify="flex-end" gap={4} wrap="nowrap" onDoubleClick={(e) => e.stopPropagation()}>
                        <Tooltip label="View" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="slate" radius="md" disabled={isRowLoading} onClick={() => openView(row)}>
                            {isRowLoading ? <Loader size={14} /> : <IconEye size={14} />}
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="brand" radius="md" disabled={isRowLoading} onClick={() => openEdit(row)}>
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="danger" radius="md" disabled={isDeleting} onClick={() => confirmDelete(row)}>
                            {isDeleting ? <Loader size={14} /> : <IconTrash size={14} />}
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>{totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select data={['10', '20', '50']} value={String(pageSize)} onChange={(v) => { setPageSize(Number(v) || 10); setPage(1); }} size="xs" radius="xl" w={60} />
            </Group>
          </Group>
          <Pagination total={pagination?.total_pages || 1} value={page} onChange={setPage} color="brand" size="xs" radius="xl" disabled={totalRows === 0} />
        </Group>
      </Paper>
    </Stack>
  );
}