import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Radio,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Switch,
  Text,
  Pagination,
  Tooltip,
  Title,
  Loader, 
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch, IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CollateralModal } from '../../components/Modal/CollateralModal';
import {
  getAllCollaterals,
  enableCollateral,
  disableCollateral, deleteCollateral,
} from '../../api/collateralApi';
import { modals } from '@mantine/modals';
interface CollateralRow {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  haircut: number;
  ltv: number;
  status: string;
}

const columnHelper = createColumnHelper<CollateralRow>();

function SortIcon({ sorted }: { sorted: 'asc' | 'desc' | false }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function Collateral() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // const [selectedCollateralId, setSelectedCollateralId] = useState(null);
  const [selectedCollateralId, setSelectedCollateralId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleModalClose = () => {
    close();
    setSelectedCollateralId(null);
    setIsViewMode(false);
  };

  const { data: collateralResponse, isLoading } = useQuery({
    queryKey: ['collaterals'],
    queryFn: getAllCollaterals,
  });

  const queryClient = useQueryClient();

  const { mutate: enableItem } = useMutation({
    mutationFn: (id: string) => enableCollateral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaterals'] });
    },
  });

  const { mutate: disableItem } = useMutation({
    mutationFn: (id: string) => disableCollateral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaterals'] });
    },
  });

  const { mutate: removeItem, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => deleteCollateral(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['collaterals'] });
  },
});

const handleDelete = (id: string) => {
  modals.openConfirmModal({
    title: 'Delete collateral',
    children: (
      <Text size="sm">
        Are you sure you want to delete this collateral? This cannot be undone.
      </Text>
    ),
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => removeItem(id),
  });
};

  const data = useMemo(() => {
    const list = collateralResponse?.data || collateralResponse?.message?.data || collateralResponse || [];
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      id: item.name,
      code: item.loan_security_code,
      name: item.loan_security_name,
      type: item.loan_security_type,
      value: item.original_security_value ?? 0,
      haircut: item.haircut ?? 0,
      ltv: item.loan_to_value_ratio ?? 0,
      status: item.disabled === 1 ? 'DISABLED' : 'ACTIVE',
    }));
  }, [collateralResponse]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesType = !type || c.type === type;
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && c.status === 'ACTIVE') ||
        (status === 'disabled' && c.status === 'DISABLED');
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, type, status]);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    if (currentStatus === 'ACTIVE') {
      disableItem(id);
    } else {
      enableItem(id);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Collateral Name',
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('value', {
        header: 'Orig. Value',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            ${info.getValue().toLocaleString()}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('haircut', {
        header: 'Haircut %',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue().toFixed(3)}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('ltv', {
        header: 'LTV %',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}%
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const isActive = info.getValue() === 'ACTIVE';
          return (
            <Badge
              variant="light"
              size="sm"
              color={isActive ? 'green' : 'red'}
              className="font-semibold tracking-wider"
              styles={{ root: { fontSize: 10, padding: '0 8px' } }}
            >
              {info.getValue()}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isActive = row.status === 'ACTIVE';
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setSelectedCollateralId(row.id);
                    setIsViewMode(true);
                    open();
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={() => {
                    setSelectedCollateralId(row.id);
                    setIsViewMode(false);
                    open();
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
  <ActionIcon
    size="sm"
    variant="subtle"
    color="red"
    disabled={isDeleting}
    onClick={() => handleDelete(row.id)}
  >
    <IconTrash size={14} />
  </ActionIcon>
</Tooltip>
              <Tooltip label={isActive ? 'Disable' : 'Activate'} withArrow>
                <Switch
                  size="xs"
                  color="green"
                  checked={isActive}
                  onChange={() => handleToggleStatus(row.id, row.status)}
                />
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch('');
    setType(null);
    setStatus('all');
  };

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <CollateralModal
        opened={opened}
        onClose={handleModalClose}
        editId={selectedCollateralId}
        isView={isViewMode}
      />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Collaterals
        </Title>
        <Button
          size="xs"
          bg="indigoAlt.4"
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          onClick={() => {
            setSelectedCollateralId(null);
            setIsViewMode(false);
            open();
          }}
          leftSection={<IconPlus size={14} />}
        >
          Add Collateral
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Search Code or Name"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Types"
            data={['Real Estate', 'Vehicles', 'Government Bonds', 'Shares/Equities', 'Cash Deposits']}
            className="w-40"
            searchable
            clearable
            rightSection={chevronDown}
            value={type}
            onChange={(v) => {
              setType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <Radio.Group
            name="status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <Group gap="sm">
              <Radio size="xs" value="all" label="All" color="indigoAlt.4" />
              <Radio size="xs" value="active" label="Active" color="indigoAlt.4" />
              <Radio size="xs" value="disabled" label="Disabled" color="indigoAlt.4" />
            </Group>
          </Radio.Group>

          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      className={`text-gray-600 font-semibold select-none ${
                        canSort ? 'cursor-pointer' : ''
                      }`}
                      style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap={4}
                        wrap="nowrap"
                        justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={header.column.getIsSorted()} />}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader size="sm" color="gray" />
                    <Text ta="center" c="dimmed" fz="xs" mt="sm">
                      Loading collaterals...
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Text ta="center" c="dimmed" fz="xs" py="sm">
                    No collaterals match your filters.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ padding: '5px 10px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="indigoAlt.4"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}