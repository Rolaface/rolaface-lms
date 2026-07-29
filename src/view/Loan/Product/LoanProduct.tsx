import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Button, TextInput, Select, Radio, Group, Paper, Table, Badge,
  ActionIcon, Switch, Text, Pagination, Tooltip, Title, Loader, Alert,
} from '@mantine/core';
import {
  IconEye, IconPencil, IconPlus, IconChevronUp, IconChevronDown,
  IconSelector, IconSearch, IconAlertCircle, IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  flexRender, createColumnHelper,
} from '@tanstack/react-table';
import { LoanProductModal } from '../../../components/Modal/LoanProductModal';
import {
  getLoanProducts,
  deleteLoanProduct,
  enableLoanProduct,
  disableLoanProduct,
  type LoanProductRaw,
} from '../../../api/LoanProduct/LoanProductAPi';
import { parseFrappeError } from '../../../utils/parseFrappeError';

interface NormalizedProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  rate: number;
  max: number;
  disabled: 0 | 1;
  status: 'ACTIVE' | 'INACTIVE';
}

const columnHelper = createColumnHelper<NormalizedProduct>();

function SortIcon({ sorted }: { sorted: string | false }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanProduct() {
  const [opened, { open, close }] = useDisclosure(false);

  // NEW — which product is being viewed/edited
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleModalClose = () => {
    close();
    setSelectedProductId(null);
    setIsViewMode(false);
  };

  // filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // server data state
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLoanProducts();
      const list: LoanProductRaw[] = Array.isArray(res?.data) ? res.data : [];
      const normalized: NormalizedProduct[] = list.map((p) => ({
        id: p.name,
        name: p.product_name || '—',
        code: p.product_code || '—',
        category: p.loan_category?.trim() || 'Uncategorized',
        rate: Number(p.rate_of_interest) || 0,
        max: Number(p.maximum_loan_amount) || 0,
        disabled: p.disabled === 1 ? 1 : 0,
        status: p.disabled === 1 ? 'INACTIVE' : 'ACTIVE',
      }));
      setProducts(normalized);
    } catch (err: any) {
  setError(parseFrappeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const matchesCategory = !category || p.category === category;
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && p.status === 'ACTIVE') ||
        (status === 'inactive' && p.status === 'INACTIVE');
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  // NEW — real backend call instead of local-only toggle
  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    setError(null);
    try {
      if (currentStatus === 'ACTIVE') {
        await disableLoanProduct(id);
      } else {
        await enableLoanProduct(id);
      }
      await fetchProducts();
    } catch (err: any) {
  setError(parseFrappeError(err));
    }
  };

  // NEW — delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan product? This cannot be undone.')) return;
    setError(null);
    try {
      await deleteLoanProduct(id);
      await fetchProducts();
    } catch (err: any) {
        setError(parseFrappeError(err));

    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Product Name',
        cell: (info) => <Text fz="xs" fw={500} c="gray.9">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => <Text fz="xs" c="gray.6">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => <Text fz="xs" c="gray.6">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('rate', {
        header: 'Base Rate',
        cell: (info) => <Text fz="xs" c="gray.6">{Number(info.getValue()).toFixed(2)}%</Text>,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant="light" size="sm" color={info.getValue() === 'ACTIVE' ? 'green' : 'red'} className="font-semibold tracking-wider" styles={{ root: { fontSize: 10, padding: '0 8px' } }}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">Actions</Text>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm" variant="subtle" color="gray"
                  onClick={() => { setSelectedProductId(row.id); setIsViewMode(true); open(); }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm" variant="subtle" color="blue"
                  onClick={() => { setSelectedProductId(row.id); setIsViewMode(false); open(); }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(row.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} withArrow>
                <Switch size="xs" color="green" checked={row.status === 'ACTIVE'} onChange={() => handleToggleStatus(row.id, row.status)} />
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
    setCategory(null);
    setStatus('all');
  };

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanProductModal
        opened={opened}
        onClose={handleModalClose}
        onSaved={fetchProducts}
        loanProductId={selectedProductId}
        isViewMode={isViewMode}
      />

      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">Loan Products</Title>
        <Button
          size="xs" bg="indigoAlt.4"
          onClick={() => { setSelectedProductId(null); setIsViewMode(false); open(); }}
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={14} />}
        >
          Add Product
        </Button>
      </div>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs" placeholder="Product Name / Code" leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[180px]" value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          />
          <Select
            size="xs" placeholder="All Categories" data={categoryOptions}
            className="w-40" searchable clearable rightSection={chevronDown}
            value={category} onChange={(v) => { setCategory(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          />
          <Radio.Group name="status" value={status} onChange={(v) => { setStatus(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
            <Group gap="sm">
              <Radio size="xs" value="all" label="All" color="indigoAlt.4" />
              <Radio size="xs" value="active" label="Active" color="indigoAlt.4" />
              <Radio size="xs" value="inactive" label="Inactive" color="indigoAlt.4" />
            </Group>
          </Radio.Group>
          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>Reset</Button>
        </div>
      </Paper>

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader size="sm" color="brand" />
          </div>
        ) : (
          <>
            <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
              <Table.Thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <Table.Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      return (
                        <Table.Th
                          key={header.id}
                          className={`text-gray-600 font-semibold select-none ${canSort ? 'cursor-pointer' : ''}`}
                          style={{ fontSize: 11, padding: '6px 10px' }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <Group gap={4} wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
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
                {rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length}>
                      <Text ta="center" c="dimmed" fz="xs" py="sm">No products match your filters.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => (
                    <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
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

            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
                <div className="flex items-center gap-1.5">
                  <span>Rows:</span>
                  <Select
                    data={['10', '20', '50']} value={String(pageSize)}
                    onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                    rightSection={chevronDown} size="xs" className="w-14"
                  />
                </div>
              </div>
              <Pagination
                total={table.getPageCount() || 1} value={pageIndex + 1}
                onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
                color="indigoAlt.4" size="xs" radius="sm"
              />
            </div>
          </>
        )}
      </Paper>
    </Box>
  );
}