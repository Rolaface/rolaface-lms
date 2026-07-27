import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Group,
  Button,
  Select,
  NumberInput,
  Table,
  Checkbox,
  Badge,
  Grid,
  UnstyledButton,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import {
  IconAdjustments,
  IconCalendarEvent,
  IconRefresh,
  IconClock,
  IconFileInvoice,
  IconMenuOrder,
  IconList,
  IconPlus,
  IconCheck,
  IconChevronDown,
  IconTrash,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

// Common Colors mapped from CSS
const colors = {
  purple1: '#7C6EE8',
  purple2: '#5B4FD1',
  purpleLight: '#F0EEFD',
  textPrimary: '#1F2430',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  surface0: '#F1F2F6',
  surface1: '#F8F9FB',
  surface2: '#FFFFFF',
  greenBg: '#E9F9EF',
  greenText: '#1E9E5A',
  redBg: '#FDECEC',
  redText: '#E14545',
  amberBg: '#FEF3E2',
  amberText: '#C9840F',
};

// Reusable Custom Components
const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box mb={24}>
    <Group gap={10} mb={6}>
      <Box w={4} h={16} bg={colors.purple1} style={{ borderRadius: 2 }} />
      <Text fz={15} fw={600} c={colors.textPrimary}>
        {title}
      </Text>
    </Group>
    <Text fz={12.5} c={colors.textSecondary} ml={14}>
      {subtitle}
    </Text>
  </Box>
);

const GroupHeading = ({ children }: { children: React.ReactNode }) => (
  <Text
    fz={13}
    fw={700}
    c={colors.textPrimary}
    tt="uppercase"
    ls="0.03em"
    mb={16}
    pb={10}
    style={{ borderBottom: `1px solid ${colors.border}` }}
  >
    {children}
  </Text>
);

const LeftSectionIcon = ({ Icon }: { Icon: any }) => (
  <Box
    w={22}
    h={22}
    bg={colors.purpleLight}
    style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Icon size={12} color={colors.purple2} stroke={2} />
  </Box>
);

const inputStyles = {
  input: {
    height: 42,
    borderRadius: 9,
    borderColor: colors.border,
    fontSize: 13.5,
    color: colors.textPrimary,
    fontWeight: 500,
    backgroundColor: colors.surface2,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: 6,
  },
};

const chevronDown = <IconChevronDown size={14} color={colors.textMuted} />;

// Main Component
export function LendingSetup() {
  const [activeTab, setActiveTab] = useState('loan');

  // --- Allocations State ---
  const [allocations, setAllocations] = useState({
    standard: 'Interest,Principal,Penal',
    substandard: 'Penal,Interest,Principal',
    writtenoff: 'Principal,Interest,Penal',
    settlement: 'Principal,Penal,Interest',
  });

  // --- Classification Table Data & State ---
  const [classData, setClassData] = useState([
    { id: '1', code: 'STD', name: 'Standard', minDpd: 0, maxDpd: 30, isWrittenOff: false },
    { id: '2', code: 'SUB', name: 'Sub-standard', minDpd: 31, maxDpd: 90, isWrittenOff: false },
  ]);

  const updateClassData = (rowIndex: number, columnId: string, value: any) => {
    setClassData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return { ...old[rowIndex]!, [columnId]: value };
        }
        return row;
      })
    );
  };

  const addClassRow = () => {
    setClassData(prev => [
      ...prev,
      { id: Date.now().toString(), code: '', name: '', minDpd: 0, maxDpd: 0, isWrittenOff: false },
    ]);
  };

  const removeClassRow = (rowIndex: number) => {
    setClassData(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  // --- Provisioning Table Data & State ---
  const [provData, setProvData] = useState([
    { id: '1', code: 'STD', name: 'Standard', security: 'Secured', rate: 0.25 },
    { id: '2', code: 'STD', name: 'Standard', security: 'Unsecured', rate: 10 },
  ]);

  const updateProvData = (rowIndex: number, columnId: string, value: any) => {
    setProvData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return { ...old[rowIndex]!, [columnId]: value };
        }
        return row;
      })
    );
  };

  const addProvRow = () => {
    setProvData(prev => [
      ...prev,
      { id: Date.now().toString(), code: '', name: '', security: 'Secured', rate: 0 },
    ]);
  };

  const removeProvRow = (rowIndex: number) => {
    setProvData(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  // --- TanStack Table Column Definitions ---
  const classColumns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        header: 'No.',
        cell: (info: any) => <Text fz={12.5}>{info.row.index + 1}</Text>,
      },
      {
        accessorKey: 'code',
        header: 'Classification code',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <TextInput size="xs" value={getValue()} onChange={(e) => updateClassData(index, id, e.target.value)} />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Classification name',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <TextInput size="xs" value={getValue()} onChange={(e) => updateClassData(index, id, e.target.value)} />
        ),
      },
      {
        accessorKey: 'minDpd',
        header: 'Min DPD',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <NumberInput size="xs" value={getValue()} onChange={(val) => updateClassData(index, id, val)} />
        ),
      },
      {
        accessorKey: 'maxDpd',
        header: 'Max DPD',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <NumberInput size="xs" value={getValue()} onChange={(val) => updateClassData(index, id, val)} />
        ),
      },
      {
        accessorKey: 'isWrittenOff',
        header: 'Is written off',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={getValue()}
            onChange={(e) => updateClassData(index, id, e.currentTarget.checked)}
          />
        ),
      },
      {
        id: 'actions',
        cell: ({ row: { index } }: any) => (
          <ActionIcon color="red" variant="subtle" onClick={() => removeClassRow(index)}>
            <IconTrash size={16} />
          </ActionIcon>
        ),
      },
    ],
    []
  );

  const provColumns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        header: 'No.',
        cell: (info: any) => <Text fz={12.5}>{info.row.index + 1}</Text>,
      },
      {
        accessorKey: 'code',
        header: 'Classification code',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <Select
            searchable
            size="xs"
            data={['STD', 'SUB', 'DBT', 'LSS']}
            value={getValue()}
            onChange={(val) => updateProvData(index, id, val)}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Classification name',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <TextInput size="xs" value={getValue()} onChange={(e) => updateProvData(index, id, e.target.value)} />
        ),
      },
      {
        accessorKey: 'security',
        header: 'Security type',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <Select
            searchable
            size="xs"
            data={['Secured', 'Unsecured', 'All']}
            value={getValue()}
            onChange={(val) => updateProvData(index, id, val)}
          />
        ),
      },
      {
        accessorKey: 'rate',
        header: 'Provision rate (%)',
        cell: ({ getValue, row: { index }, column: { id } }: any) => (
          <NumberInput size="xs" min={0} max={100} value={getValue()} onChange={(val) => updateProvData(index, id, val)} />
        ),
      },
      {
        id: 'actions',
        cell: ({ row: { index } }: any) => (
          <ActionIcon color="red" variant="subtle" onClick={() => removeProvRow(index)}>
            <IconTrash size={16} />
          </ActionIcon>
        ),
      },
    ],
    []
  );

  const classTable = useReactTable({
    data: classData,
    columns: classColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const provTable = useReactTable({
    data: provData,
    columns: provColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // --- Render Helpers ---
  const renderAllocationOrder = (orderString: string) => {
    const items = orderString.split(',');
    return (
      <Box
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.surface2,
        }}
      >
        {items.map((item, idx) => (
          <Group
            key={item}
            gap={12}
            px={14}
            py={11}
            wrap="nowrap"
            style={{
              borderBottom: idx === items.length - 1 ? 'none' : `1px solid ${colors.border}`,
            }}
          >
            <Box
              w={22}
              h={22}
              bg={colors.purpleLight}
              c={colors.purple2}
              fz={11}
              fw={700}
              style={{
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </Box>
            <Text fz={13} fw={600} c={colors.textPrimary}>
              {item}
            </Text>
          </Group>
        ))}
      </Box>
    );
  };

  const tabs = [
    { id: 'loan', label: 'Loan', num: 1 },
    { id: 'classification', label: 'Classification range', num: 2 },
    { id: 'allocation', label: 'Payment allocation', num: 3 },
    { id: 'provisioning', label: 'Provisioning', num: 4 },
  ];

  return (
    <Box
      bg={colors.surface2}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Group
        p="24px 32px"
        align="flex-start"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <Box
          w={44}
          h={44}
          style={{
            borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.purple1}, ${colors.purple2})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconAdjustments size={22} color="#fff" stroke={2} />
        </Box>
        <Box>
          <Text fz={19} fw={600} c={colors.textPrimary} mb={4}>
            Loan Settings
          </Text>
          <Text fz={13.5} c={colors.textSecondary}>
            Configure loan accounting rules, classification ranges and provisioning.
          </Text>
        </Box>
      </Group>

      {/* Tabs */}
      <Group
        gap={4}
        px={32}
        pt={14}
        bg={colors.surface2}
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <UnstyledButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                fontSize: 13.5,
                fontWeight: 500,
                color: isActive ? colors.textPrimary : colors.textSecondary,
                borderBottom: `2px solid ${isActive ? colors.purple1 : 'transparent'}`,
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <Box
                w={18}
                h={18}
                fz={10.5}
                fw={600}
                bg={isActive ? colors.purpleLight : colors.surface1}
                c={isActive ? colors.purple2 : colors.textMuted}
                style={{
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.num}
              </Box>
              {tab.label}
            </UnstyledButton>
          );
        })}
      </Group>

      {/* Body Content */}
      <Box p="32px" style={{ flex: 1 }}>
        <Box maw={1400}>
          {/* TAB 1: LOAN */}
          {activeTab === 'loan' && (
            <Box>
              <SectionTitle
                title="Loan information"
                subtitle="Loan terms, accrual rules and delinquency thresholds."
              />

              <Box mb={30}>
                <GroupHeading>Loan terms & accrual</GroupHeading>
                <Grid gutter={20}>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Select
                      searchable
                      label="Interest day-count convention"
                      data={['30/360', 'Actual/365', 'Actual/Actual']}
                      defaultValue="30/360"
                      leftSection={<LeftSectionIcon Icon={IconCalendarEvent} />}
                      rightSection={chevronDown}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Select
                      searchable
                      label="Loan accrual frequency"
                      data={['Daily', 'Monthly', 'Quarterly']}
                      defaultValue="Daily"
                      leftSection={<LeftSectionIcon Icon={IconRefresh} />}
                      rightSection={chevronDown}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <NumberInput
                      label="Min. days: disbursement → first repayment"
                      defaultValue={0}
                      leftSection={<LeftSectionIcon Icon={IconCalendarEvent} />}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                </Grid>
              </Box>

              <Box>
                <GroupHeading>Delinquency & collections</GroupHeading>
                <Grid gutter={20}>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <NumberInput
                      label="Days past due threshold"
                      defaultValue={0}
                      leftSection={<LeftSectionIcon Icon={IconClock} />}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <NumberInput
                      label="Auto write-off threshold"
                      defaultValue={0}
                      leftSection={<LeftSectionIcon Icon={IconFileInvoice} />}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Select
                      searchable
                      label="Collection offset logic based on"
                      data={['Due date', 'Value date', 'Booking date']}
                      defaultValue="Due date"
                      leftSection={<LeftSectionIcon Icon={IconMenuOrder} />}
                      rightSection={chevronDown}
                      styles={inputStyles}
                    />
                  </Grid.Col>
                </Grid>
              </Box>
            </Box>
          )}

          {/* TAB 2: CLASSIFICATION RANGE */}
          {activeTab === 'classification' && (
            <Box>
              <SectionTitle
                title="Loan classification ranges"
                subtitle="Map days-past-due bands to asset classifications and write-off status."
              />

              <Box
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  overflow: 'auto',
                }}
                mb={12}
              >
                <Table fz={12.5} verticalSpacing={16} horizontalSpacing={12}>
                  <Table.Thead bg={colors.surface1}>
                    {classTable.getHeaderGroups().map((headerGroup) => (
                      <Table.Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Table.Th key={header.id} c={colors.textSecondary} fw={600}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Thead>
                  <Table.Tbody>
                    {classTable.getRowModel().rows.length > 0 ? (
                      classTable.getRowModel().rows.map((row) => (
                        <Table.Tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <Table.Td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={8} ta="center" py={28} c={colors.textMuted}>
                          No classification rows. Click "Add row" below.
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
              <Button
                variant="default"
                size="xs"
                radius="md"
                onClick={addClassRow}
                leftSection={<IconPlus size={14} />}
                fw={500}
                style={{ height: 34, color: colors.textPrimary, borderColor: colors.border }}
              >
                Add row
              </Button>

              <Text fz={14} fw={600} mt={28} mb={4}>
                Preview classification badges
              </Text>
              <Text fz={12} c={colors.textSecondary} mb={14}>
                Example of how each classification will appear across the app once rows are added.
              </Text>
              <Group gap={8}>
                <Badge bg={colors.greenBg} c={colors.greenText} radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                  Standard
                </Badge>
                <Badge bg={colors.amberBg} c={colors.amberText} radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                  Sub-standard
                </Badge>
                <Badge bg={colors.redBg} c={colors.redText} radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                  Doubtful
                </Badge>
                <Badge bg="#EFE9FB" c="#6B4FCB" radius="md" style={{ textTransform: 'none', fontWeight: 600 }}>
                  Loss / written off
                </Badge>
              </Group>
            </Box>
          )}

          {/* TAB 3: PAYMENT ALLOCATION */}
          {activeTab === 'allocation' && (
            <Box>
              <SectionTitle
                title="Payment allocation"
                subtitle="Choose the collection offset order for each asset classification. The demand-type order updates below each selection."
              />

              <Grid gutter={20}>
                <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
                  <Select
                    searchable
                    label="Standard asset"
                    data={[
                      { value: 'Interest,Principal,Penal', label: 'Interest > Principal > Penal' },
                      { value: 'Penal,Interest,Principal', label: 'Penal > Interest > Principal' },
                      { value: 'Principal,Interest,Penal', label: 'Principal > Interest > Penal' },
                    ]}
                    value={allocations.standard}
                    onChange={(v) => setAllocations({ ...allocations, standard: v || '' })}
                    leftSection={<LeftSectionIcon Icon={IconList} />}
                    rightSection={chevronDown}
                    styles={inputStyles}
                    mb={8}
                  />
                  <Text fz={11} fw={700} c={colors.textSecondary} tt="uppercase" ls="0.05em" mb={4} ml={2}>
                    Allocation order
                  </Text>
                  {renderAllocationOrder(allocations.standard)}
                </Grid.Col>

                <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
                  <Select
                    searchable
                    label="Sub-standard asset"
                    data={[
                      { value: 'Penal,Interest,Principal', label: 'Penal > Interest > Principal' },
                      { value: 'Interest,Principal,Penal', label: 'Interest > Principal > Penal' },
                      { value: 'Principal,Penal,Interest', label: 'Principal > Penal > Interest' },
                    ]}
                    value={allocations.substandard}
                    onChange={(v) => setAllocations({ ...allocations, substandard: v || '' })}
                    leftSection={<LeftSectionIcon Icon={IconList} />}
                    rightSection={chevronDown}
                    styles={inputStyles}
                    mb={8}
                  />
                  <Text fz={11} fw={700} c={colors.textSecondary} tt="uppercase" ls="0.05em" mb={4} ml={2}>
                    Allocation order
                  </Text>
                  {renderAllocationOrder(allocations.substandard)}
                </Grid.Col>

                <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
                  <Select
                    searchable
                    label="Written-off asset"
                    data={[
                      { value: 'Principal,Interest,Penal', label: 'Principal > Interest > Penal' },
                      { value: 'Interest,Principal,Penal', label: 'Interest > Principal > Penal' },
                      { value: 'Penal,Principal,Interest', label: 'Penal > Principal > Interest' },
                    ]}
                    value={allocations.writtenoff}
                    onChange={(v) => setAllocations({ ...allocations, writtenoff: v || '' })}
                    leftSection={<LeftSectionIcon Icon={IconList} />}
                    rightSection={chevronDown}
                    styles={inputStyles}
                    mb={8}
                  />
                  <Text fz={11} fw={700} c={colors.textSecondary} tt="uppercase" ls="0.05em" mb={4} ml={2}>
                    Allocation order
                  </Text>
                  {renderAllocationOrder(allocations.writtenoff)}
                </Grid.Col>

                <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
                  <Select
                    searchable
                    label="Settlement collection"
                    data={[
                      { value: 'Principal,Penal,Interest', label: 'Principal > Penal > Interest' },
                      { value: 'Interest,Principal,Penal', label: 'Interest > Principal > Penal' },
                      { value: 'Penal,Interest,Principal', label: 'Penal > Interest > Principal' },
                    ]}
                    value={allocations.settlement}
                    onChange={(v) => setAllocations({ ...allocations, settlement: v || '' })}
                    leftSection={<LeftSectionIcon Icon={IconList} />}
                    rightSection={chevronDown}
                    styles={inputStyles}
                    mb={8}
                  />
                  <Text fz={11} fw={700} c={colors.textSecondary} tt="uppercase" ls="0.05em" mb={4} ml={2}>
                    Allocation order
                  </Text>
                  {renderAllocationOrder(allocations.settlement)}
                </Grid.Col>
              </Grid>
            </Box>
          )}

          {/* TAB 4: PROVISIONING */}
          {activeTab === 'provisioning' && (
            <Box>
              <SectionTitle
                title="IRAC provisioning configuration"
                subtitle="Set provisioning rates by classification and security type."
              />

              <Box
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  overflow: 'auto',
                }}
                mb={12}
              >
                <Table fz={12.5} verticalSpacing={16} horizontalSpacing={12}>
                  <Table.Thead bg={colors.surface1}>
                    {provTable.getHeaderGroups().map((headerGroup) => (
                      <Table.Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Table.Th key={header.id} c={colors.textSecondary} fw={600}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Thead>
                  <Table.Tbody>
                    {provTable.getRowModel().rows.length > 0 ? (
                      provTable.getRowModel().rows.map((row) => (
                        <Table.Tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <Table.Td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={7} ta="center" py={28} c={colors.textMuted}>
                          No provisioning rows. Click "Add row" below.
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
              <Button
                variant="default"
                size="xs"
                radius="md"
                onClick={addProvRow}
                leftSection={<IconPlus size={14} />}
                fw={500}
                style={{ height: 34, color: colors.textPrimary, borderColor: colors.border }}
              >
                Add row
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Group
        justify="space-between"
        p="18px 32px"
        bg={colors.surface2}
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <Group gap={8}>
          <Button
            variant="default"
            radius="md"
            style={{ height: 38, borderColor: colors.border, color: colors.textPrimary }}
          >
            Cancel
          </Button>
          <Button
            variant="subtle"
            color="red"
            radius="md"
            style={{ height: 38, color: colors.redText }}
          >
            Reset
          </Button>
        </Group>
        <Button
          radius="md"
          rightSection={<IconCheck size={14} />}
          style={{
            height: 38,
            background: `linear-gradient(135deg, ${colors.purple1}, ${colors.purple2})`,
            border: 'none',
            fontWeight: 600,
          }}
        >
          Save settings
        </Button>
      </Group>
    </Box>
  );
}