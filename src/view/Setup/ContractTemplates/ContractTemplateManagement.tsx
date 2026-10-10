import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Group,
  SimpleGrid,
  Text,
  Paper,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Switch,
  Pagination,
  Tooltip,
  Avatar,
  Stack,
  Title,
  SegmentedControl,
  useMantineTheme,
  Modal,
  Textarea,
  ThemeIcon,
} from '@mantine/core';
import {
  IconSearch,
  IconFileDescription,
  IconCircleCheck,
  IconClock,
  IconLink,
  IconEye,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useNavigate } from '@tanstack/react-router';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { ModalFooter } from '../../../components/shared/ModalFooter';

export interface TemplateItem {
  id: number | string;
  bank: string;
  color: string;
  product: string;
  type: string;
  name: string;
  version: string;
  uploadDate: string;
  uploadTime: string;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
  description?: string;
}

const BANK_OPTIONS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI Bank',
  'Axis Bank',
  'Bajaj Finserv',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'IndusInd Bank',
];

const BANK_COLORS: Record<string, string> = {
  'HDFC Bank': 'red',
  'ICICI Bank': 'orange',
  'SBI Bank': 'blue',
  'Axis Bank': 'pink',
  'Bajaj Finserv': 'cyan',
  'Kotak Mahindra Bank': 'grape',
  'Bank of Baroda': 'orange',
  'Punjab National Bank': 'yellow',
  'IndusInd Bank': 'teal',
};

const PRODUCT_OPTIONS = [
  'Business Loan',
  'Education Loan',
  'Personal Loan',
  'Home Loan',
  'Consumer Loan',
  'Auto Loan',
  'Gold Loan',
  'Loan Against Property',
];

const CONTRACT_TYPE_OPTIONS = [
  'Loan Agreement',
  'Sanction Letter',
  'Hypothecation Agreement',
  'NDA',
  'Guarantee Agreement',
];

/* ───── initial template data (4 rows only) ───── */
const initialTemplates: TemplateItem[] = [
  {
    id: 1,
    bank: 'HDFC Bank',
    color: 'red',
    product: 'Business Loan',
    type: 'Loan Agreement',
    name: 'HDFC Business Loan Agreement',
    version: '2.0',
    uploadDate: '01-May-2024',
    uploadTime: '10:30 AM',
    effectiveDate: '01-May-2024',
    status: 'Active',
    description: 'Standard commercial & business lending agreement for corporate clients.',
  },
  {
    id: 2,
    bank: 'HDFC Bank',
    color: 'red',
    product: 'Education Loan',
    type: 'Sanction Letter',
    name: 'HDFC Education Sanction Letter',
    version: '1.0',
    uploadDate: '15-Apr-2024',
    uploadTime: '02:15 PM',
    effectiveDate: '15-Apr-2024',
    status: 'Active',
    description: 'Formal sanction letter for higher education loan applicants.',
  },
  {
    id: 3,
    bank: 'ICICI Bank',
    color: 'orange',
    product: 'Personal Loan',
    type: 'Loan Agreement',
    name: 'ICICI Personal Loan Agreement',
    version: '1.0',
    uploadDate: '10-Apr-2024',
    uploadTime: '11:45 AM',
    effectiveDate: '10-Apr-2024',
    status: 'Inactive',
    description: 'Unsecured personal loan borrower contract template.',
  },
  {
    id: 4,
    bank: 'SBI Bank',
    color: 'blue',
    product: 'Home Loan',
    type: 'Loan Agreement',
    name: 'SBI Home Loan Agreement',
    version: '1.1',
    uploadDate: '20-Mar-2024',
    uploadTime: '09:05 AM',
    effectiveDate: '20-Mar-2024',
    status: 'Active',
    description: 'Mortgage loan agreement for residential housing finance.',
  },
];

/* ───── shared sub-components ───── */
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active';
  const scale = isActive ? 'success' : 'danger';
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 8,
          whiteSpace: 'nowrap',
          minWidth: 78,
          justifyContent: 'center',
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{ borderRadius: '50%', background: `var(--mantine-color-${scale}-6)` }}
        />
      }
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </Badge>
  );
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;
const columnHelper = createColumnHelper<TemplateItem>();

/* ───── main component ───── */
export function ContractTemplateManagement() {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  // Primary data state (4 initial rows)
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: 'uploadDate', desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<TemplateItem | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Loan Agreement': return 'indigo';
      case 'Sanction Letter': return 'orange';
      case 'Hypothecation Agreement': return 'green';
      case 'NDA': return 'cyan';
      case 'Guarantee Agreement': return 'violet';
      default: return 'gray';
    }
  };

  // Stat metrics (dynamically computed from current template list)
  const totalTemplatesCount = templates.length;
  const activeTemplatesCount = templates.filter((t) => t.status === 'Active').length;
  const inactiveTemplatesCount = templates.filter((t) => t.status === 'Inactive').length;
  const activeProductsCount = new Set(
    templates.filter((t) => t.status === 'Active').map((t) => t.product)
  ).size;

  // Filter data
  const filteredData = useMemo(() => {
    let data = templates;
    if (status === 'active') data = data.filter((t) => t.status === 'Active');
    if (status === 'inactive') data = data.filter((t) => t.status === 'Inactive');
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.bank.toLowerCase().includes(q) ||
          t.product.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q)
      );
    }
    return data;
  }, [templates, search, status]);

  // Full-dataset sorting
  const sortedData = useMemo(() => {
    if (!sorting.length) return filteredData;
    const { id, desc } = sorting[0];
    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[id];
      const bVal = (b as any)[id];

      if (id === 'uploadDate') {
        const aTime = new Date(`${a.uploadDate} ${a.uploadTime || ''}`).getTime();
        const bTime = new Date(`${b.uploadDate} ${b.uploadTime || ''}`).getTime();
        if (!isNaN(aTime) && !isNaN(bTime)) {
          return desc ? bTime - aTime : aTime - bTime;
        }
      } else if (id === 'effectiveDate') {
        const aTime = new Date(a.effectiveDate).getTime();
        const bTime = new Date(b.effectiveDate).getTime();
        if (!isNaN(aTime) && !isNaN(bTime)) {
          return desc ? bTime - aTime : aTime - bTime;
        }
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }

      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }, [filteredData, sorting]);

  // Pagination helpers
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pagedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  // Actions
  const handleView = (template: TemplateItem) => {
    setSelectedTemplate(template);
    setViewModalOpen(true);
  };

  const handleEdit = (template: TemplateItem) => {
    setEditForm({ ...template });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = 'Template name is required';
    if (!editForm.bank.trim()) errors.bank = 'Bank / NBFC is required';
    if (!editForm.product.trim()) errors.product = 'Loan product is required';
    if (!editForm.effectiveDate.trim()) errors.effectiveDate = 'Effective date is required';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    const color = BANK_COLORS[editForm.bank] || editForm.color || 'blue';
    setTemplates((prev) =>
      prev.map((t) => (t.id === editForm.id ? { ...editForm, color } : t))
    );
    setEditModalOpen(false);

    openCommonModal({
      heading: 'Contract Template Updated',
      subtitle: '',
      body: `Template "${editForm.name}" has been updated successfully.`,
      color: 'green',
      buttons: [{ label: 'OK', color: 'green' }],
    });
  };

  const handleDelete = (template: TemplateItem) => {
    openCommonModal({
      heading: 'Delete Contract Template',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete template{' '}
          <Text span fw={600}>
            {template.name}
          </Text>
          ?
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Delete',
          color: 'red',
          onClick: () => {
            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
            openCommonModal({
              heading: 'Contract Template Deleted',
              subtitle: '',
              body: `Contract template "${template.name}" has been deleted successfully.`,
              color: 'green',
              buttons: [{ label: 'OK', color: 'green' }],
            });
          },
        },
      ],
    });
  };

  const handleToggleStatus = (template: TemplateItem) => {
    const willMakeInactive = template.status === 'Active';
    openCommonModal({
      heading: willMakeInactive ? 'Mark as Inactive' : 'Mark as Active',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to mark template{' '}
          <Text span fw={600}>
            {template.name}
          </Text>{' '}
          as {willMakeInactive ? 'inactive' : 'active'}?
        </>
      ),
      color: willMakeInactive ? 'warning' : 'green',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: willMakeInactive ? 'Mark as Inactive' : 'Mark as Active',
          color: willMakeInactive ? 'orange' : 'green',
          onClick: () => {
            setTemplates((prev) =>
              prev.map((t) =>
                t.id === template.id
                  ? { ...t, status: willMakeInactive ? 'Inactive' : 'Active' }
                  : t
              )
            );
            openCommonModal({
              heading: willMakeInactive ? 'Template Marked as Inactive' : 'Template Marked as Active',
              subtitle: '',
              body: `Template "${template.name}" has been marked as ${
                willMakeInactive ? 'inactive' : 'active'
              } successfully.`,
              color: 'green',
              buttons: [{ label: 'OK', color: 'green' }],
            });
          },
        },
      ],
    });
  };

  // Columns definition
  const columns = useMemo(
    () => [
      columnHelper.accessor('bank', {
        header: 'Bank / NBFC',
        cell: (info) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar
              size={34}
              radius="md"
              variant="light"
              color={info.row.original.color}
              style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}
            >
              {info.getValue().charAt(0)}
            </Avatar>
            <Text fz="sm" fw={700} c="slate.8">
              {info.getValue()}
            </Text>
          </Group>
        ),
      }),
      columnHelper.accessor('product', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="sm" c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Contract Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color={getBadgeColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px', whiteSpace: 'nowrap' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Template Name',
        cell: (info) => (
          <Text fz="sm" c="slate.8" className="max-w-[200px] leading-tight line-clamp-2">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('uploadDate', {
        header: 'Uploaded Date',
        cell: (info) => (
          <Box>
            <Text fz="sm" c="slate.8">
              {info.getValue()}
            </Text>
            <Text fz="xs" c="slate.5">
              {info.row.original.uploadTime}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor('effectiveDate', {
        header: 'Effective Date',
        cell: (info) => (
          <Text fz="sm" c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const item = info.row.original;
          const isActive = item.status === 'Active';
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(item);
                  }}
                  aria-label="View template"
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  aria-label="Edit template"
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="danger"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  aria-label="Delete template"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isActive ? 'Mark as Inactive' : 'Mark as Active'} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={isActive}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(item);
                  }}
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
    data: pagedData,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <Stack gap="xs" p="md">
      {/* ── scoped CSS ── */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${(theme.other as any)?.searchFocusRing || 'none'}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${(theme.other as any)?.rowHoverBg || 'var(--mantine-color-slate-0)'} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* ── page header ── */}
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--mantine-radius-md)',
              background: theme.other.brandGradient,
              boxShadow: (theme.other as any)?.brandGlowShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconFileDescription size={17} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={0}>
            <Title order={2} c="slate.8" fw={700} fz="lg">
              Contract Templates
            </Title>
            <Text fz="xs" c="slate.5">
              Upload and manage bank loan contract templates
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* ── stat cards (dynamically computed) ── */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
        <Paper p="xs" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="sm">
            <Box className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--mantine-color-indigo-0)' }}>
              <IconFileDescription size={20} stroke={1.5} color="var(--mantine-color-brand-6)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="lg" fw={700} c="slate.8">
                  {totalTemplatesCount}
                </Text>
                <Text size="xs" fw={600} c="slate.7">
                  Total Templates
                </Text>
              </Group>
              <Text size="xs" c="slate.5">
                All uploaded templates
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="xs" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="sm">
            <Box className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--mantine-color-success-0)' }}>
              <IconCircleCheck size={20} stroke={1.5} color="var(--mantine-color-success-6)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="lg" fw={700} c="slate.8">
                  {activeTemplatesCount}
                </Text>
                <Text size="xs" fw={600} c="slate.7">
                  Active Templates
                </Text>
              </Group>
              <Text size="xs" c="slate.5">
                Currently active
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="xs" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="sm">
            <Box className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--mantine-color-orange-0)' }}>
              <IconClock size={20} stroke={1.5} color="var(--mantine-color-orange-5)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="lg" fw={700} c="slate.8">
                  {inactiveTemplatesCount}
                </Text>
                <Text size="xs" fw={600} c="slate.7">
                  Inactive Templates
                </Text>
              </Group>
              <Text size="xs" c="slate.5">
                Not active
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="xs" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="sm">
            <Box className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
              <IconLink size={20} stroke={1.5} color="var(--mantine-color-blue-5)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="lg" fw={700} c="slate.8">
                  {activeProductsCount}
                </Text>
                <Text size="xs" fw={600} c="slate.7">
                  Loan Products
                </Text>
              </Group>
              <Text size="xs" c="slate.5">
                With active templates
              </Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* ── pill-shaped toolbar ── */}
      <Paper
        radius="xl"
        p={6}
        px="sm"
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
            placeholder="Template Name / Bank"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
          />
          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              component="a"
              href="/setup/contract-templates/create"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate({ to: '/setup/contract-templates/create' });
              }}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: (theme.other as any)?.brandGlowShadowSm,
              }}
            >
              Add Template
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* ── table card ── */}
      <Paper
        radius="lg"
        p="xs"
        pos="relative"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        <Table
          verticalSpacing="xs"
          horizontalSpacing="sm"
          fz="xs"
          w="100%"
          style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isActions = header.id === 'actions';
                  const isSorted = sorting[0]?.id === header.id ? (sorting[0].desc ? 'desc' : 'asc') : false;
                  return (
                    <Table.Th
                      key={header.id}
                      c="slate.5"
                      fw={700}
                      style={{
                        fontSize: 'var(--mantine-font-size-xs)',
                        padding: '0 10px 4px',
                        userSelect: 'none',
                        cursor: !isActions ? 'pointer' : 'default',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: 'none',
                      }}
                      onClick={() => {
                        if (isActions) return;
                        setSorting((prev) => {
                          if (prev[0]?.id === header.id) {
                            return [{ id: header.id, desc: !prev[0].desc }];
                          }
                          return [{ id: header.id, desc: false }];
                        });
                        setPage(1);
                      }}
                    >
                      <Group gap="xs" wrap="nowrap" justify={isActions ? 'flex-end' : 'flex-start'}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {!isActions && <SortIcon sorted={isSorted} />}
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
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="md">
                    <Box
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--mantine-color-white)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--mantine-color-slate-2)',
                      }}
                    >
                      <IconFileDescription size={20} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No contract templates match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const isActive = row.original.status === 'Active';
                return (
                  <Table.Tr key={row.id} className="lms-row">
                    {row.getVisibleCells().map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: '6px 10px',
                          border: 'none',
                          boxShadow: 'var(--mantine-shadow-xs)',
                          borderLeft:
                            idx === 0
                              ? `3px solid var(--mantine-color-${isActive ? 'success' : 'danger'}-4)`
                              : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        {/* ── pagination footer ── */}
        <Group justify="space-between" px="sm" pt={4}>
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>
              {totalRows === 0
                ? 'Showing 0 of 0'
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => {
                  setPageSize(Number(v) || 10);
                  setPage(1);
                }}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows <= pageSize}
          />
        </Group>
      </Paper>

      {/* ── View Modal ── */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        size={640}
        radius="lg"
        padding={0}
        withCloseButton={false}
      >
        <Box bg="white">
          <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{ borderBottom: '1px solid var(--mantine-color-brand-7)' }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <IconFileDescription size={16} />
              </ThemeIcon>
              <Box>
                <Text size="md" fw={700} c="white">
                  View Contract Template
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  Viewing details for this contract template
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={() => setViewModalOpen(false)}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>

          {selectedTemplate && (
            <Box p="xl" bg="slate.0">
              <Paper p="md" radius="md" bg="white" withBorder mb="md">
                <SimpleGrid cols={2} spacing="md">
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      BANK / NBFC
                    </Text>
                    <Group gap="xs" mt={4}>
                      <Avatar size={24} radius="sm" variant="light" color={selectedTemplate.color}>
                        {selectedTemplate.bank.charAt(0)}
                      </Avatar>
                      <Text size="sm" fw={700} c="slate.8">
                        {selectedTemplate.bank}
                      </Text>
                    </Group>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      LOAN PRODUCT
                    </Text>
                    <Text size="sm" fw={600} c="slate.8" mt={4}>
                      {selectedTemplate.product}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      CONTRACT TYPE
                    </Text>
                    <Box mt={4}>
                      <Badge variant="light" color={getBadgeColor(selectedTemplate.type)} size="sm">
                        {selectedTemplate.type}
                      </Badge>
                    </Box>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      STATUS
                    </Text>
                    <Box mt={4}>
                      <StatusBadge status={selectedTemplate.status} />
                    </Box>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      EFFECTIVE DATE
                    </Text>
                    <Text size="sm" c="slate.8" mt={4}>
                      {selectedTemplate.effectiveDate}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5" fw={600}>
                      UPLOADED DATE
                    </Text>
                    <Text size="sm" c="slate.8" mt={4}>
                      {selectedTemplate.uploadDate} {selectedTemplate.uploadTime ? `at ${selectedTemplate.uploadTime}` : ''}
                    </Text>
                  </Box>
                  <Box style={{ gridColumn: '1 / -1' }}>
                    <Text size="xs" c="slate.5" fw={600}>
                      TEMPLATE NAME
                    </Text>
                    <Text size="sm" fw={600} c="slate.8" mt={4}>
                      {selectedTemplate.name}
                    </Text>
                  </Box>
                  {selectedTemplate.description && (
                    <Box style={{ gridColumn: '1 / -1' }}>
                      <Text size="xs" c="slate.5" fw={600}>
                        DESCRIPTION / COMMENT
                      </Text>
                      <Text size="xs" c="slate.7" mt={4}>
                        {selectedTemplate.description}
                      </Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Paper>
            </Box>
          )}

          <ModalFooter
            variant="theme"
            isViewMode={true}
            onClose={() => setViewModalOpen(false)}
            submitLabel=""
          />
        </Box>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        size={680}
        radius="lg"
        padding={0}
        withCloseButton={false}
      >
        <Box bg="white">
          <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{ borderBottom: '1px solid var(--mantine-color-brand-7)' }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <IconPencil size={16} />
              </ThemeIcon>
              <Box>
                <Text size="md" fw={700} c="white">
                  Edit Contract Template
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  Edit contract template configuration and details
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={() => setEditModalOpen(false)}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>

          {editForm && (
            <Box p="xl" bg="slate.0">
              <SimpleGrid cols={2} spacing="md">
                <TextInput
                  label="Template Name"
                  placeholder="Enter template name"
                  withAsterisk
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
                  error={editErrors.name}
                  style={{ gridColumn: '1 / -1' }}
                />
                <Select
                  label="Bank / NBFC"
                  placeholder="Select bank"
                  withAsterisk
                  data={BANK_OPTIONS}
                  value={editForm.bank}
                  onChange={(val) => setEditForm({ ...editForm, bank: val || editForm.bank })}
                  error={editErrors.bank}
                  searchable
                />
                <Select
                  label="Loan Product"
                  placeholder="Select loan product"
                  withAsterisk
                  data={PRODUCT_OPTIONS}
                  value={editForm.product}
                  onChange={(val) => setEditForm({ ...editForm, product: val || editForm.product })}
                  error={editErrors.product}
                  searchable
                />
                <Select
                  label="Contract Type"
                  placeholder="Select type"
                  withAsterisk
                  data={CONTRACT_TYPE_OPTIONS}
                  value={editForm.type}
                  onChange={(val) => setEditForm({ ...editForm, type: val || editForm.type })}
                  searchable
                />
                <TextInput
                  label="Effective Date"
                  placeholder="e.g. 01-May-2024"
                  withAsterisk
                  value={editForm.effectiveDate}
                  onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.currentTarget.value })}
                  error={editErrors.effectiveDate}
                />
                <Select
                  label="Status"
                  data={['Active', 'Inactive']}
                  value={editForm.status}
                  onChange={(val) =>
                    setEditForm({
                      ...editForm,
                      status: (val as 'Active' | 'Inactive') || 'Active',
                    })
                  }
                />
                <TextInput
                  label="Version"
                  placeholder="e.g. 1.0"
                  value={editForm.version || '1.0'}
                  onChange={(e) => setEditForm({ ...editForm, version: e.currentTarget.value })}
                />
                <Textarea
                  label="Description / Comment"
                  placeholder="Enter comment or notes"
                  minRows={2}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.currentTarget.value })}
                  style={{ gridColumn: '1 / -1' }}
                />
              </SimpleGrid>
            </Box>
          )}

          <ModalFooter
            variant="theme"
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleSaveEdit}
            submitLabel="Update"
          />
        </Box>
      </Modal>
    </Stack>
  );
}