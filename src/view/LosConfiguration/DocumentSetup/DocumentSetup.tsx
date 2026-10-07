import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  IconCalendar,
  IconChevronDown,
  IconEye,
  IconFiles,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { DocumentSetupApi } from '../../../api/LosConfiguration/DocumentSetupApi';
import { parseFrappeError } from '../../../utils/parseFrappeError';
import { documentSetupModal } from '../../../components/Modal/documentSetupModalStore';

interface DocumentSetupProps {
  onSave?: (productId: string, docs: any[] | null) => void | Promise<void>;
  readOnly?: boolean;
}

interface DocumentSetupRow {
  id: string;
  name: string;
  code: string;
  documentCount: number;
  requiredCount: number;
  updatedAt: string; // formatted
  rawModified: string; // used for sorting
}

const columnHelper = createColumnHelper<DocumentSetupRow>();

function IconText({
  icon,
  children,
  mono = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Group gap={6} wrap="nowrap">
      <Box style={{ color: 'var(--mantine-color-slate-4)', display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Text
        fz="xs"
        c="slate.6"
        style={mono ? { fontFamily: 'var(--mantine-font-family-monospace)' } : undefined}
      >
        {children}
      </Text>
    </Group>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function DocumentSetup({ onSave, readOnly = false }: DocumentSetupProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  // filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);

  // table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: documentSetupsResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['documentSetups', debouncedSearch, page, pageSize],
    queryFn: () => DocumentSetupApi.getAll(page, pageSize, debouncedSearch),
    placeholderData: (prev) => prev,
  });

  // ---- Response -> rows -------------------------------------------------
  const rows: DocumentSetupRow[] = useMemo(() => {
    const list = DocumentSetupApi.unwrapList(documentSetupsResponse) || [];
    return list.map((r: any) => ({
      id: r.loan_product ?? r.name ?? r.id,
      name: r.loan_product_name ?? r.product_name ?? r.loan_product ?? r.name,
      code: r.product_code ?? r.code ?? r.loan_product ?? r.name,
      documentCount: Number(r.document_count ?? r.documents_count ?? r.total_documents ?? 0),
      requiredCount: Number(
        r.required_count ?? r.required_documents ?? r.required_document_count ?? 0
      ),
      updatedAt: r.modified ? dayjs(r.modified).format('DD MMM YYYY') : '-',
      rawModified: r.modified || r.creation || '',
    })).sort(
      (a: DocumentSetupRow, b: DocumentSetupRow) =>
        new Date(b.rawModified || 0).getTime() - new Date(a.rawModified || 0).getTime()
    );
  }, [documentSetupsResponse]);

  // ---- Pagination (server-side, same as Collateral) ----------------------
  // Search + pagination both happen on the backend, so `rows` is already
  // the current page.
  const q = debouncedSearch.trim();
  const pagination = DocumentSetupApi.unwrapPagination(documentSetupsResponse);
  const totalRows = pagination?.total ?? rows.length;
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(totalRows / pageSize));
  const pageRows = rows;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  // ---- Modals / mutations ----------------------------------------------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: 'red',
      buttons: [{ label: 'OK', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string = '') => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'OK', color: 'green' }],
    });
  };

  const { mutate: removeItem, isPending: isDeleting, variables: deletingId } = useMutation({
    mutationFn: (productId: string) => DocumentSetupApi.remove(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['documentSetups'] });
      queryClient.invalidateQueries({ queryKey: ['productsWithoutDocuments'] });
      showSuccess('Documents Removed', 'Documents for the product have been removed.');
      onSave?.(productId, null);
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const handleDelete = (row: DocumentSetupRow) => {
    openCommonModal({
      heading: 'Remove Documents',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Remove all documents for{' '}
          <Text span fw={600}>
            {row.name}
          </Text>
          ? Applicants for this product will no longer be asked for any documents.
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Remove documents',
          color: 'red',
          onClick: () => removeItem(row.id),
        },
      ],
    });
  };

  const handleAdd = () => documentSetupModal.open({ editId: null, isView: false });
  const handleView = (row: DocumentSetupRow) =>
    documentSetupModal.open({ editId: row.id, isView: true });
  const handleEdit = (row: DocumentSetupRow) =>
    documentSetupModal.open({ editId: row.id, isView: false });

  // ---- Table ------------------------------------------------------------
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) =>
          info.getValue() ? (
            <IconText icon={<IconTag size={13} />} mono>
              {info.getValue()}
            </IconText>
          ) : (
            <Text fz="xs" c="slate.4">
              -
            </Text>
          ),
      }),
      columnHelper.accessor('documentCount', {
        header: 'Documents',
        cell: (info) => (
          <Badge variant="light" color="brand" size="md" radius="sm" fw={600}>
            {info.getValue()} {info.getValue() === 1 ? 'document' : 'documents'}
          </Badge>
        ),
      }),
      columnHelper.accessor('requiredCount', {
        header: 'Required',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.6" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {info.getValue()} of {info.row.original.documentCount}
          </Text>
        ),
      }),
      columnHelper.accessor('rawModified', {
        id: 'updatedAt',
        header: 'Last Updated',
        cell: (info) => (
          <IconText icon={<IconCalendar size={13} />}>{info.row.original.updatedAt}</IconText>
        ),
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
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View documents" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(row);
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              {!readOnly && (
                <>
                  <Tooltip label="Edit documents" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="brand"
                      radius="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                      }}
                    >
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove all" withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="danger"
                      radius="md"
                      loading={isDeleting && deletingId === row.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row);
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly, isDeleting, deletingId]
  );

  const table = useReactTable({
    data: pageRows,
    columns,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  const resetFilters = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <Stack gap="md" p="lg" style={{ flex: 1, minHeight: 0 }}>
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Header — icon tile + title */}
      <Group gap="sm" align="center" wrap="nowrap">
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--mantine-radius-md)',
            background: theme.other.brandGradient,
            boxShadow: theme.other.brandGlowShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconFiles size={20} color="var(--mantine-color-white)" stroke={1.8} />
        </Box>
        <Stack gap={2}>
          <Title order={2} c="slate.8" fw={700}>
            Document Setup
          </Title>
          <Text fz="sm" c="slate.5">
            Set which documents applicants must provide for each loan product
          </Text>
        </Stack>
      </Group>

      {/* Toolbar — pill search + reset + add */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Product Name / Code"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            {!readOnly && (
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={handleAdd}
                leftSection={<IconPlus size={14} />}
                style={{
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }}
              >
                Add Product Documents
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Data Table — floating rounded row-cards on a soft canvas */}
      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
            <Box
              style={{
                height: 'clamp(320px, calc(100vh - 280px), 720px)',
                overflowY: 'auto',
                opacity: isFetching ? 0.6 : 1,
                transition: 'opacity 120ms ease',
              }}
            >
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                fz="xs"
                w="100%"
                style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}
              >
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        return (
                          <Table.Th
                            key={header.id}
                            className="lms-thead-cell"
                            c="slate.5"
                            fw={700}
                            style={{
                              fontSize: 'var(--mantine-font-size-xs)',
                              padding: '0 10px 6px',
                              userSelect: 'none',
                              cursor: canSort ? 'pointer' : 'default',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              border: 'none',
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Group
                              gap="xs"
                              wrap="nowrap"
                              justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </Group>
                          </Table.Th>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Thead>

                <Table.Tbody>
                  {tableRows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                        <Stack align="center" gap="xs" py="xl">
                          <Box
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: '50%',
                              background: 'var(--mantine-color-white)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--mantine-color-slate-2)',
                            }}
                          >
                            <IconFiles size={26} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            {q
                              ? `No products match "${search}". Try a different name or code.`
                              : 'No documents configured. Set up required documents for your loan products to get started.'}
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    tableRows.map((row) => (
                      <Table.Tr
                        key={row.id}
                        className="lms-row"
                        onDoubleClick={() => handleView(row.original)}
                        style={{ cursor: 'pointer' }}
                      >
                        {row.getVisibleCells().map((cell, idx) => (
                          <Table.Td
                            key={cell.id}
                            style={{
                              padding: '10px 10px',
                              border: 'none',
                              boxShadow: 'var(--mantine-shadow-xs)',
                              borderLeft:
                                idx === 0 ? '3px solid var(--mantine-color-brand-4)' : undefined,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Pagination Footer */}
            <Group justify="space-between" px="sm" pt="xs">
              <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
                <span>
                  {totalRows === 0
                    ? 'Showing 0 of 0'
                    : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
                </span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={['10', '20', '50', '100']}
                    value={String(pageSize)}
                    onChange={(v) => {
                      setPageSize(Number(v) || 10);
                      setPage(1);
                    }}
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={70}
                  />
                </Group>
              </Group>
              <Pagination
                total={totalPages}
                value={page}
                onChange={(p) => setPage(p)}
                color="brand"
                size="xs"
                radius="xl"
                disabled={totalRows === 0}
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}