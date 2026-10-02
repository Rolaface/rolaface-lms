import React, { useState } from "react";
import {
  Box,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Table,
  Badge,
  Grid,
  ThemeIcon,
  ActionIcon,
  Pagination,
  SimpleGrid,
  Modal,
  ScrollArea
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { 
  IconSearch, 
  IconDownload, 
  IconFileText, 
  IconCash, 
  IconWallet, 
  IconClock, 
  IconChartPie,
  IconArrowUpRight,
  IconArrowDownRight,
  IconFilter,
  IconDotsVertical, IconEye,
  IconCalendarEvent
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// --- MOCK DATA ---
const monthlyData = [
  { name: 'Jan', Disbursed: 8, Approved: 9 },
  { name: 'Feb', Disbursed: 7, Approved: 8.5 },
  { name: 'Mar', Disbursed: 10, Approved: 11 },
  { name: 'Apr', Disbursed: 11, Approved: 12 },
  { name: 'May', Disbursed: 12, Approved: 13 },
  { name: 'Jun', Disbursed: 14, Approved: 15 },
  { name: 'Jul', Disbursed: 14, Approved: 15.5 },
  { name: 'Aug', Disbursed: 13, Approved: 14 },
  { name: 'Sep', Disbursed: 17, Approved: 18 },
];

const quarterlyData = [
  { name: 'Q1 2025', Disbursed: 25, Approved: 28.5 },
  { name: 'Q2 2025', Disbursed: 37, Approved: 40 },
  { name: 'Q3 2025', Disbursed: 44, Approved: 47.5 },
  { name: 'Q4 2025', Disbursed: 20, Approved: 22 },
];

const yearlyData = [
  { name: '2023', Disbursed: 95, Approved: 110 },
  { name: '2024', Disbursed: 120, Approved: 135 },
  { name: '2025', Disbursed: 156, Approved: 168 },
];

const typeData = [
  { name: 'Bank Transfer', value: 380, color: '#3b82f6' },
  { name: 'Mobile Money', value: 50, color: '#8b5cf6' },
  { name: 'Cash', value: 20, color: '#10b981' },
  { name: 'Cheque', value: 5, color: '#f59e0b' },
];

const statusData = [
  { name: 'Disbursed', value: 380, color: '#10b981' },
  { name: 'Pending', value: 50, color: '#f59e0b' },
  { name: 'Partially Disbursed', value: 25, color: '#8b5cf6' },
  { name: 'Failed', value: 5, color: '#ef4444' },
];

const branchData = [
  { name: 'Lusaka', value: 42, color: '#3b82f6' },
  { name: 'Kitwe', value: 25, color: '#60a5fa' },
  { name: 'Ndola', value: 18, color: '#93c5fd' },
  { name: 'Mufulira', value: 10, color: '#bfdbfe' },
  { name: 'Others', value: 5, color: '#dbeafe' },
];

const tableData = [
  { id: 'LN-2025-00123', customer: 'Amit Sharma', product: 'Personal Loan', branch: 'Main Branch', officer: 'Rohit Kumar', approved: 'ZMW 500,000', disbursed: 'ZMW 500,000', date: '02 Sep 2025', type: 'Bank Transfer', account: '1234567890', status: 'Disbursed', ref: 'TRX983745' },
  { id: 'LN-2025-00124', customer: 'Priya Singh', product: 'Business Loan', branch: 'City Branch', officer: 'Neha Verma', approved: 'ZMW 1,200,000', disbursed: 'ZMW 1,000,000', date: '03 Sep 2025', type: 'Mobile Money', account: '0987654321', status: 'Partially Disbursed', ref: 'TRX983746' },
  { id: 'LN-2025-00125', customer: 'David Mwansa', product: 'Home Loan', branch: 'Lusaka Branch', officer: 'James Banda', approved: 'ZMW 800,000', disbursed: 'ZMW 800,000', date: '04 Sep 2025', type: 'Bank Transfer', account: '1122334455', status: 'Disbursed', ref: 'TRX983747' },
  { id: 'LN-2025-00126', customer: 'Grace Chanda', product: 'Personal Loan', branch: 'Kitwe Branch', officer: 'Susan Phiri', approved: 'ZMW 300,000', disbursed: 'ZMW 0', date: '-', type: '-', account: '-', status: 'Pending', ref: '-' },
  { id: 'LN-2025-00127', customer: 'Joseph Nalumino', product: 'Business Loan', branch: 'Ndola Branch', officer: 'Michael Tembo', approved: 'ZMW 950,000', disbursed: 'ZMW 950,000', date: '05 Sep 2025', type: 'Bank Transfer', account: '5566778899', status: 'Disbursed', ref: 'TRX983748' },
  { id: 'LN-2025-00128', customer: 'Ruth Bwalya', product: 'Personal Loan', branch: 'Main Branch', officer: 'Rohit Kumar', approved: 'ZMW 600,000', disbursed: 'ZMW 300,000', date: '06 Sep 2025', type: 'Mobile Money', account: '2233445566', status: 'Partially Disbursed', ref: 'TRX983749' },
  { id: 'LN-2025-00129', customer: 'Daniel Phiri', product: 'Home Loan', branch: 'Chipata Branch', officer: 'Neha Verma', approved: 'ZMW 1,500,000', disbursed: 'ZMW 1,500,000', date: '07 Sep 2025', type: 'Bank Transfer', account: '6677889900', status: 'Disbursed', ref: 'TRX983750' },
  { id: 'LN-2025-00130', customer: 'Tina Nyirenda', product: 'Business Loan', branch: 'Kabwe Branch', officer: 'James Banda', approved: 'ZMW 750,000', disbursed: 'ZMW 0', date: '-', type: '-', account: '-', status: 'Failed', ref: '-' },
];

export function DisbursementReport() {
  const [search, setSearch] = useState("");
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const renderStatus = (status: string) => {
    let color = 'gray';
    if (status === 'Disbursed') color = 'green';
    if (status === 'Partially Disbursed') color = 'violet';
    if (status === 'Pending') color = 'orange';
    if (status === 'Failed') color = 'red';
    
    return (
      <Badge color={color} variant="light" size="sm" radius="sm" fw={600} style={{ textTransform: 'none' }}>
        {status}
      </Badge>
    );
  };

  return (
    <Box bg="slate.0" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Stack gap="md" px="md" pt="xs" pb="xl">
        
        {/* --- HEADER --- */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2} c="slate.8" fw={700} style={{ fontSize: 24 }}>
              Disbursement Report
            </Title>
            <Text fz="sm" c="slate.5" mt={4}>
              View detailed information about loan disbursements including amount, date, type and status.
            </Text>
          </Box>
          <Group gap="sm">
            <DatePickerInput placeholder="From Date" leftSection={<IconCalendarEvent size={16} />} clearable />
            <DatePickerInput placeholder="To Date" leftSection={<IconCalendarEvent size={16} />} clearable />
            <Button 
              leftSection={<IconDownload size={16} />} 
              radius="md" 
              size="sm"
              style={{ backgroundColor: '#1e293b' }}
            >
              Export Report
            </Button>
          </Group>
        </Group>

        

        {/* --- KPI CARDS --- */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="sm" mb="sm">
          <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
            <Box>
              <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Loans Disbursed</Text>
              <Text size="md" fw={700} c="slate.8" mt={2}>450</Text>
              <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>out of 500 approved</Text>
              <Text size="xs" c="green.6" fw={600} mt={4}>↑ 12% vs last month</Text>
            </Box>
          </Paper>

          <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
            <Box>
              <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Approved Amount</Text>
              <Text size="md" fw={700} c="slate.8" mt={2}>ZMW 18,750,000</Text>
              <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>&nbsp;</Text>
              <Text size="xs" c="green.6" fw={600} mt={4}>↑ 8% vs last month</Text>
            </Box>
          </Paper>

          <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
            <Box>
              <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Disbursed Amount</Text>
              <Text size="md" fw={700} c="slate.8" mt={2}>ZMW 12,500,000</Text>
              <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>&nbsp;</Text>
              <Text size="xs" c="green.6" fw={600} mt={4}>↑ 15% vs last month</Text>
            </Box>
          </Paper>

          <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
            <Box>
              <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Pending Disbursements</Text>
              <Text size="md" fw={700} c="slate.8" mt={2}>50</Text>
              <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>10% of approved</Text>
              <Text size="xs" c="red.6" fw={600} mt={4}>↓ 2% vs last month</Text>
            </Box>
          </Paper>

          <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
            <Box>
              <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Partial Disbursements</Text>
              <Text size="md" fw={700} c="slate.8" mt={2}>25</Text>
              <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>5% of approved</Text>
              <Text size="xs" c="green.6" fw={600} mt={4}>↓ 3% vs last month</Text>
            </Box>
          </Paper>
        </SimpleGrid>

        {/* --- CHARTS ROW --- */}
        <Grid gutter="md">
            {/* Chart 1: Volume */}
            <Grid.Col span={{ base: 12, lg: 4 }}><Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 300 }}>
              <Group justify="space-between" mb="md" wrap="nowrap" align="flex-start">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Disbursement Volume Trend</Text>
                  <Group gap="xs" mt={4}>
                    <Group gap={4}><Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: '#3b82f6' }} /><Text size="xs" c="slate.5">Disbursed Amount</Text></Group>
                    <Group gap={4}><Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: '#bfdbfe' }} /><Text size="xs" c="slate.5">Approved Amount</Text></Group>
                  </Group>
                </Box>
                
              </Group>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}M`} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="Disbursed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Approved" fill="#bfdbfe" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer></Paper></Grid.Col>

            {/* Chart 2: Type */}
            <Grid.Col span={{ base: 12, lg: 2 }}><Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 300 }}><Text size="sm" fw={600} c="slate.7" mb="sm">Disbursement Method</Text>
              <Stack gap="xs" align="center" h={230}>
                <Box style={{ width: '100%', height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} innerRadius="60%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none">
                        {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart></ResponsiveContainer></Box><Group gap="sm" justify="center" wrap="wrap">
                  {typeData.map(item => (
                    <Box key={item.name}>
                      <Group gap={6} align="center" wrap="nowrap">
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <Text size="xs" c="slate.6">{item.name}</Text>
                        <Text size="xs" fw={700} c="slate.8">{item.value}</Text>
                        <Text style={{ fontSize: 10 }} c="slate.4">({Math.round((item.value / 455) * 100)}%)</Text>
                      </Group>
                    </Box>))}</Group></Stack></Paper></Grid.Col>

            {/* Chart 3: Branch */}
            <Grid.Col span={{ base: 12, lg: 3 }}><Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 300 }}><Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Disbursement by Branch</Text>
                  
                </Box>
                <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setIsBranchModalOpen(true)}>View All</Text>
              </Group>
              <Stack gap="sm" style={{ flex: 1 }}>
                {branchData.slice(0, 4).map(item => (
                  <Box key={item.name}>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="slate.6">{item.name}</Text>
                      <Text size="xs" c="slate.5" fw={600}>{item.value}%</Text>
                    </Group>
                    <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                      <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                    </Box>
                  </Box>))}</Stack></Paper></Grid.Col>

            {/* Chart 4: Status */}
            <Grid.Col span={{ base: 12, lg: 3 }}><Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 300 }}>
              <Text size="sm" fw={600} c="slate.7" mb="sm">Disbursement Status</Text>
              <Stack gap="xs" align="center" h={230}>
                <Box style={{ width: '100%', height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} innerRadius="60%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none">
                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart></ResponsiveContainer></Box><Group gap="sm" justify="center" wrap="wrap">
                  {statusData.map(item => (
                    <Box key={item.name}>
                      <Group gap={6} align="center" wrap="nowrap">
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <Text size="xs" c="slate.6">{item.name}</Text>
                        <Text size="xs" fw={700} c="slate.8">{item.value}</Text>
                        <Text style={{ fontSize: 10 }} c="slate.4">({Math.round((item.value / 460) * 100)}%)</Text>
                      </Group>
                    </Box>))}</Group></Stack></Paper></Grid.Col>
        </Grid>

        {/* --- TABLE --- */}
        <Paper radius="md" shadow="sm" withBorder>
          <Group justify="space-between" p="md" align="center" wrap="wrap">
              <Text size="sm" fw={600} c="slate.8">Disbursement Details</Text>
              <Group gap="xs" align="center">
                <Select placeholder="Branch" defaultValue="All Branches" data={["All Branches", "Lusaka", "Kitwe"]} size="xs" radius="md" w={120} />
                <Select placeholder="Loan Product" defaultValue="All Products" data={["All Products", "Personal Loan", "Business Loan"]} size="xs" radius="md" w={130} />
                  <Select placeholder="Officer" defaultValue="All Officers" data={["All Officers", "Rohit Kumar", "Neha Verma"]} size="xs" radius="md" w={110} />
                <Select placeholder="Status" defaultValue="All Status" data={["All Status", "Disbursed", "Pending"]} size="xs" radius="md" w={110} />
                <Select placeholder="Method" defaultValue="All Methods" data={["All Methods", "Bank Transfer", "Mobile Money", "Cash", "Cheque"]} size="xs" radius="md" w={130} />
                <TextInput placeholder="Search Customer..." leftSection={<IconSearch size={14} />} size="xs" radius="md" w={160} />
              </Group>
            </Group>
          {/* Table Area */}
          <Box style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
              <Table.Thead bg="slate.0">
                  <Table.Tr>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Loan ID</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Customer</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Loan Product</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Loan Officer</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Approved Amount</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Disbursed Amount</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Status</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600, width: 60, textAlign: 'center' }}>View</Table.Th>
                  </Table.Tr>
                </Table.Thead>
              <Table.Tbody>
                  {tableData.slice(0, 5).map((row, idx) => (
                    <Table.Tr key={idx} style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}>
                      <Table.Td><Text size="xs" fw={500} c="slate.7">{row.id}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="slate.7">{row.customer}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="slate.7">{row.product}</Text></Table.Td>
                        <Table.Td><Text size="xs" c="slate.7">{row.officer}</Text></Table.Td>
                      <Table.Td><Text size="xs" c="slate.7">{row.approved}</Text></Table.Td>
                      <Table.Td><Text size="xs" fw={600} c="slate.8">{row.disbursed}</Text></Table.Td>
                      <Table.Td>{renderStatus(row.status)}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <ActionIcon variant="subtle" color="blue" onClick={() => setSummaryData(row)}>
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
            </Table>
          </Box>
          
          {/* Pagination */}
          <Group justify="flex-end" p="md" style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }}>
            <Pagination total={57} size="sm" color="brand" />
          </Group>

        </Paper>
      </Stack>

      <Modal opened={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title="Disbursement by Branch (All Branches)" size="lg" radius="md">
        <ScrollArea h={400} offsetScrollbars>
          <Group justify="space-between" mb="sm" px="xs">
            <Text size="xs" c="slate.5" fw={600}>BRANCH NAME</Text>
            <Text size="xs" c="slate.5" fw={600}>% OF TOTAL DISBURSEMENTS</Text>
          </Group>
          <Stack gap="md" p="xs">
            {[
              { name: 'Lusaka Main', value: 25, color: 'blue.6' },
              { name: 'Kitwe Center', value: 15, color: 'blue.5' },
              { name: 'Ndola Branch', value: 12, color: 'blue.4' },
              { name: 'Mufulira', value: 10, color: 'blue.3' },
              { name: 'Kabwe', value: 8, color: 'blue.3' },
              { name: 'Livingstone', value: 8, color: 'blue.2' },
              { name: 'Chingola', value: 7, color: 'blue.2' },
              { name: 'Luanshya', value: 6, color: 'blue.2' },
              { name: 'Kasama', value: 5, color: 'blue.1' },
              { name: 'Chipata', value: 4, color: 'blue.1' },
            ].map(item => (
              <Box key={item.name}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" c="slate.7" fw={500}>{item.name}</Text>
                  <Text size="sm" c="slate.7" fw={700}>{item.value}%</Text>
                </Group>
                <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                  <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      </Modal>

      <Modal opened={!!summaryData} onClose={() => setSummaryData(null)} title={<Text fw={600} c="slate.8" size="lg">Disbursement Details Summary</Text>} size="xl" radius="md">
        {summaryData && (
          <Box p="xs">
            <Stack gap="lg">
              <SimpleGrid cols={3} spacing="lg">
                <Box>
                  <Text size="xs" c="slate.5">Loan ID</Text>
                  <Text size="md" fw={600} c="slate.8">{summaryData.id}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Customer</Text>
                  <Text size="md" fw={600} c="slate.8">{summaryData.customer}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Loan Product</Text>
                  <Text size="md" fw={600} c="slate.8">{summaryData.product}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Branch</Text>
                  <Text size="md" fw={600} c="slate.8">{summaryData.branch}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Loan Officer</Text>
                  <Text size="md" fw={600} c="slate.8">{summaryData.officer}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Disbursement Status</Text>
                  <Box mt={4}>{renderStatus(summaryData.status)}</Box>
                </Box>
              </SimpleGrid>

              <Box style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }} pt="lg">
                <Text size="md" fw={600} c="slate.7" mb="md">Transaction Details</Text>
                <SimpleGrid cols={3} spacing="lg">
                  <Box>
                    <Text size="xs" c="slate.5">Approved Amount</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.approved}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Disbursed Amount</Text>
                    <Text size="sm" fw={600} c="slate.8">{summaryData.disbursed}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Disbursement Date</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.date}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Disbursement Method</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.type}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Account Number</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.account}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Reference No.</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.ref}</Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setSummaryData(null)}>Close</Button>
              </Group>
            </Stack>
          </Box>
        )}
      </Modal>
    </Box>
  );
}













































