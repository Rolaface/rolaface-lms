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
  ActionIcon,
  Pagination,
  Checkbox,
  SimpleGrid,
  Modal,
  ScrollArea,
  ThemeIcon
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { 
  IconSearch, 
  IconDownload, 
  IconFileText, 
  IconCash, 
  IconWallet,
  IconPercentage,
  IconCoins,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconFilter,
  IconDotsVertical,
  IconCalendarEvent,
  IconEye
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// --- MOCK DATA ---
const productData = [
  { name: 'Personal Loan', value: 42, color: '#3b82f6', amount: 'ZMW 80.67M' },
  { name: 'Business Loan', value: 25, color: '#8b5cf6', amount: 'ZMW 48.16M' },
  { name: 'Home Loan', value: 18, color: '#10b981', amount: 'ZMW 34.67M' },
  { name: 'Education Loan', value: 10, color: '#f59e0b', amount: 'ZMW 19.26M' },
  { name: 'Others', value: 5, color: '#ef4444', amount: 'ZMW 9.88M' },
];

const agingData = [
  { name: 'Current', value: 65, amount: 'ZMW 125.8M', fill: '#3b82f6' },
  { name: '1-30', value: 16, amount: 'ZMW 30.7M', fill: '#10b981' },
  { name: '31-60', value: 8, amount: 'ZMW 15.4M', fill: '#f59e0b' },
  { name: '61-90', value: 5, amount: 'ZMW 9.8M', fill: '#ef4444' },
  { name: '90+', value: 6, amount: 'ZMW 11.1M', fill: '#8b5cf6' },
];

const compositionData = [
  { name: 'Principal', value: 71.8, color: '#3b82f6', amount: 'ZMW 138.46M' },
  { name: 'Interest', value: 21.9, color: '#8b5cf6', amount: 'ZMW 42.18M' },
  { name: 'Fees', value: 4.2, color: '#f59e0b', amount: 'ZMW 8.08M' },
  { name: 'Penalty', value: 2.1, color: '#10b981', amount: 'ZMW 3.92M' },
];

const branchData = [
  { name: 'Lusaka', value: 42, amount: 'ZMW 80.67M', color: '#3b82f6' },
  { name: 'Kitwe', value: 25, amount: 'ZMW 48.16M', color: '#10b981' },
  { name: 'Ndola', value: 18, amount: 'ZMW 34.67M', color: '#8b5cf6' },
  { name: 'Mufulira', value: 10, amount: 'ZMW 19.26M', color: '#60a5fa' },
  { name: 'Others', value: 5, amount: 'ZMW 9.88M', color: '#dbeafe' },
];

const tableData = [
  { id: 'LN-2025-00123', customer: 'Amit Sharma', product: 'Personal Loan', branch: 'Main Branch', officer: 'Rohit Kumar', disbDate: '02 Sep 2025', disbAmt: 'ZMW 500,000', prinRepaid: 'ZMW 120,000', prinOS: 'ZMW 380,000', accInt: 'ZMW 32,450', intPaid: 'ZMW 12,000', intOS: 'ZMW 20,450', feesOS: 'ZMW 5,000', totalOS: 'ZMW 405,450', nextDue: '15 Oct 2025', dpd: 0, status: 'Active' },
  { id: 'LN-2025-00124', customer: 'Priya Singh', product: 'Business Loan', branch: 'City Branch', officer: 'Neha Verma', disbDate: '03 Sep 2025', disbAmt: 'ZMW 1,200,000', prinRepaid: 'ZMW 350,000', prinOS: 'ZMW 850,000', accInt: 'ZMW 78,020', intPaid: 'ZMW 32,000', intOS: 'ZMW 46,020', feesOS: 'ZMW 8,000', totalOS: 'ZMW 904,020', nextDue: '20 Oct 2025', dpd: 5, status: 'Active' },
  { id: 'LN-2025-00125', customer: 'David Mwansa', product: 'Home Loan', branch: 'Lusaka Branch', officer: 'James Banda', disbDate: '04 Sep 2025', disbAmt: 'ZMW 800,000', prinRepaid: 'ZMW 200,000', prinOS: 'ZMW 600,000', accInt: 'ZMW 54,780', intPaid: 'ZMW 22,000', intOS: 'ZMW 32,780', feesOS: 'ZMW 6,000', totalOS: 'ZMW 638,780', nextDue: '18 Oct 2025', dpd: 12, status: 'Overdue' },
  { id: 'LN-2025-00126', customer: 'Grace Chanda', product: 'Personal Loan', branch: 'Kitwe Branch', officer: 'Susan Phiri', disbDate: '05 Sep 2025', disbAmt: 'ZMW 300,000', prinRepaid: 'ZMW 100,000', prinOS: 'ZMW 200,000', accInt: 'ZMW 18,560', intPaid: 'ZMW 8,000', intOS: 'ZMW 10,560', feesOS: 'ZMW 2,500', totalOS: 'ZMW 213,060', nextDue: '25 Oct 2025', dpd: 0, status: 'Active' },
  { id: 'LN-2025-00127', customer: 'Joseph Nalumino', product: 'Business Loan', branch: 'Ndola Branch', officer: 'Michael Tembo', disbDate: '06 Sep 2025', disbAmt: 'ZMW 950,000', prinRepaid: 'ZMW 300,000', prinOS: 'ZMW 650,000', accInt: 'ZMW 60,240', intPaid: 'ZMW 25,000', intOS: 'ZMW 35,240', feesOS: 'ZMW 7,500', totalOS: 'ZMW 692,740', nextDue: '22 Oct 2025', dpd: 3, status: 'Active' },
  { id: 'LN-2025-00128', customer: 'Ruth Bwalya', product: 'Personal Loan', branch: 'Main Branch', officer: 'Rohit Kumar', disbDate: '07 Sep 2025', disbAmt: 'ZMW 600,000', prinRepaid: 'ZMW 180,000', prinOS: 'ZMW 420,000', accInt: 'ZMW 38,760', intPaid: 'ZMW 15,000', intOS: 'ZMW 23,760', feesOS: 'ZMW 4,500', totalOS: 'ZMW 448,260', nextDue: '28 Oct 2025', dpd: 8, status: 'At Risk' },
  { id: 'LN-2025-00129', customer: 'Daniel Phiri', product: 'Home Loan', branch: 'Chipata Branch', officer: 'Neha Verma', disbDate: '07 Sep 2025', disbAmt: 'ZMW 1,500,000', prinRepaid: 'ZMW 450,000', prinOS: 'ZMW 1,050,000', accInt: 'ZMW 96,450', intPaid: 'ZMW 40,000', intOS: 'ZMW 56,450', feesOS: 'ZMW 10,000', totalOS: 'ZMW 1,116,450', nextDue: '02 Nov 2025', dpd: 15, status: 'Overdue' },
  { id: 'LN-2025-00130', customer: 'Tina Nyirenda', product: 'Business Loan', branch: 'Kabwe Branch', officer: 'James Banda', disbDate: '08 Sep 2025', disbAmt: 'ZMW 750,000', prinRepaid: 'ZMW 220,000', prinOS: 'ZMW 530,000', accInt: 'ZMW 48,670', intPaid: 'ZMW 20,000', intOS: 'ZMW 28,670', feesOS: 'ZMW 6,500', totalOS: 'ZMW 565,170', nextDue: '05 Nov 2025', dpd: 0, status: 'Active' },
];


const CustomAgingTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper shadow="md" p="xs" radius="md" withBorder style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Text size="sm" fw={700} c="slate.8" mb={4}>{label === 'Current' ? 'Current (0 DPD)' : `${label} DPD`}</Text>
        <Group justify="space-between" gap="xl" mb={2} wrap="nowrap">
          <Text size="xs" c="slate.6">Share of Portfolio:</Text>
          <Text size="xs" fw={600} c={data.fill}>{data.value}%</Text>
        </Group>
        <Group justify="space-between" gap="xl" wrap="nowrap">
          <Text size="xs" c="slate.6">Outstanding:</Text>
          <Text size="xs" fw={600} c="slate.8">{data.amount}</Text>
        </Group>
      </Paper>
    );
  }
  return null;
};

export function LoanPortfolioReport() {
  const [search, setSearch] = useState("");
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const renderStatus = (status: string) => {
    let color = 'gray';
    let bg = 'gray.1';
    let textC = 'gray.7';
    if (status === 'Active') { color = 'teal'; bg = '#e6fcf5'; textC = '#099268'; }
    if (status === 'Overdue') { color = 'red'; bg = '#fff5f5'; textC = '#e03131'; }
    if (status === 'At Risk') { color = 'orange'; bg = '#fff4e6'; textC = '#e8590c'; }
    
    return (
      <Badge color={color} variant="filled" size="sm" radius="sm" fw={600} style={{ textTransform: 'none', backgroundColor: bg, color: textC, border: `1px solid var(--mantine-color-${color}-2)` }}>
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
              Loan Portfolio Report
            </Title>
            <Text fz="sm" c="slate.5" mt={4}>
              Get a complete view of your loan book's financial position, outstanding balances and overall portfolio health.
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

                

        {/* --- KPI CARDS (7 CARDS) --- */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 7 }} spacing="sm" mb="sm">
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Active</Text>
                  <Text size="md" fw={700} c="slate.8">1,248</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>↑ 6%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Disbursed</Text>
                  <Text size="md" fw={700} c="slate.8">225.25M</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>↑ 12%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Principal O/S</Text>
                  <Text size="md" fw={700} c="slate.8">138.46M</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>↑ 8%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Interest O/S</Text>
                  <Text size="md" fw={700} c="slate.8">42.17M</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>↑ 5%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total O/S</Text>
                  <Text size="md" fw={700} c="slate.8">192.63M</Text>
                  <Text size="xs" c="green.6" fw={600} mt={2}>↑ 7%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Overdue</Text>
                  <Text size="md" fw={700} c="slate.8">186</Text>
                  <Text size="xs" c="red.6" fw={600} mt={2}>↑ 3%</Text>
                </Box>
              </Group>
            </Paper>

            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <Box>
                  <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Overdue Amt</Text>
                  <Text size="md" fw={700} c="slate.8">28.54M</Text>
                  <Text size="xs" c="red.6" fw={600} mt={2}>↑ 6%</Text>
                </Box>
              </Group>
            </Paper>
        </SimpleGrid>

        {/* --- CHARTS ROW --- */}
        <Grid gutter="md">
          {/* Chart 1: By Product */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Portfolio by Loan Product</Text>
                  
                </Box>
                <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setIsProductModalOpen(true)}>View All</Text>
              </Group>
              <Stack gap="sm" style={{ flex: 1 }}>
                {productData.slice(0, 4).map(item => (
                  <Box key={item.name}>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="slate.6" fw={500}>{item.name}</Text>
                      <Text size="xs" c="slate.8" fw={700}>{item.value}%</Text>
                    </Group>
                    <Group justify="space-between" mb={4}>
                      <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4, flex: 1 }}>
                        <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                      </Box>
                    </Group>
                    <Text style={{ fontSize: 9 }} c="slate.4" ta="right">{item.amount}</Text>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Chart 2: Aging */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Group justify="space-between" mb="md">
                <Box><Text size="sm" fw={600} c="slate.7">Portfolio Aging (DPD)</Text></Box>
              </Group>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agingData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} content={<CustomAgingTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid.Col>

          {/* Chart 3: Composition */}
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ minHeight: 350 }}>
              <Text size="sm" fw={600} c="slate.7" mb="sm">Outstanding Composition</Text>
              <Stack gap="md" align="center">
                <Box style={{ width: '100%', height: 160, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={compositionData} innerRadius={50} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                        {compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack gap={0} align="center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <Text size="xs" c="slate.5" fw={600}>ZMW</Text>
                    <Text size="sm" fw={700} c="slate.8">192.64M</Text>
                    <Text style={{ fontSize: 9 }} c="slate.4">Total</Text>
                  </Stack>
                </Box>
                <Group gap="sm" justify="center" wrap="wrap">
                  {compositionData.map(item => (
                    <Box key={item.name}>
                      <Group gap={6} align="center" wrap="nowrap">
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <Text size="xs" c="slate.6">{item.name}</Text>
                        <Text size="xs" fw={700} c="slate.8">{item.value}%</Text>
                        <Text style={{ fontSize: 9 }} c="slate.4">({item.amount})</Text>
                      </Group>
                    </Box>
                  ))}
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Chart 4: Branch */}
          <Grid.Col span={{ base: 12, lg: 2 }}>
            <Paper p="md" radius="md" shadow="sm" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 350 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
                <Box>
                  <Text size="sm" fw={600} c="slate.7">Portfolio by Branch</Text>
                  
                </Box>
                <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setIsBranchModalOpen(true)}>View All</Text>
              </Group>
              <Stack gap="sm" style={{ flex: 1 }}>
                {branchData.slice(0, 4).map(item => (
                  <Box key={item.name}>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="slate.6">{item.name}</Text>
                      <Group gap={4}>
                        <Text size="xs" c="slate.8" fw={700}>{item.value}%</Text>
                      </Group>
                    </Group>
                    <Group justify="space-between" mb={4}>
                       <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4, flex: 1 }}>
                        <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                      </Box>
                    </Group>
                    <Text style={{ fontSize: 9 }} c="slate.4" ta="right">{item.amount}</Text>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* --- FILTERS & TABLE --- */}
        <Paper radius="md" shadow="sm" withBorder>
          
          {/* Table Header Controls */}
          <Group justify="space-between" p="md" align="center" wrap="wrap">
              <Text size="sm" fw={600} c="slate.8">Loan Portfolio Details</Text>
              <Group gap="xs" align="center">
                <Select placeholder="Branch" defaultValue="All Branches" data={["All Branches", "Lusaka", "Kitwe"]} size="xs" radius="md" w={120} />
                <Select placeholder="Loan Product" defaultValue="All Loan Products" data={["All Loan Products", "Personal Loan", "Business Loan"]} size="xs" radius="md" w={140} />
                <Select placeholder="Officer" defaultValue="All Officers" data={["All Officers", "Rohit Kumar", "Neha Verma"]} size="xs" radius="md" w={110} />
                <Select placeholder="Status" defaultValue="All Status" data={["All Status", "Active", "Overdue"]} size="xs" radius="md" w={100} />
                <Select placeholder="DPD / Aging" defaultValue="All Ranges" data={["All Ranges", "Current", "1-30"]} size="xs" radius="md" w={110} />
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
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Branch</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Disbursed Amount</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Principal O/S</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Total O/S</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>DPD</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600 }}>Status</Table.Th>
                  <Table.Th style={{ color: 'var(--mantine-color-slate-5)', fontWeight: 600, width: 60, textAlign: 'center' }}>View</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tableData.slice(0, 5).map((row, idx) => (
                  <Table.Tr key={idx} style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}>
                    <Table.Td><Text size="xs" fw={500} c="slate.6">{row.id}</Text></Table.Td>
                    <Table.Td><Text size="xs" fw={500} c="slate.8">{row.customer}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="slate.6">{row.product}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="slate.6">{row.branch}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="slate.6">{row.disbAmt}</Text></Table.Td>
                    <Table.Td><Text size="xs" fw={600} c="slate.8">{row.prinOS}</Text></Table.Td>
                    <Table.Td><Text size="xs" fw={700} c="slate.8">{row.totalOS}</Text></Table.Td>
                    <Table.Td><Text size="xs" c={row.dpd > 0 ? "red.6" : "slate.6"} fw={row.dpd > 0 ? 600 : 400}>{row.dpd}</Text></Table.Td>
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
            <Pagination total={156} size="sm" color="brand" />
          </Group>

        </Paper>
      </Stack>

      <Modal opened={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title={<Text fw={600} c="slate.8">Portfolio by Branch (All Branches)</Text>} size="lg" radius="md">
        <ScrollArea h={400} offsetScrollbars>
          <Group justify="space-between" mb="sm" px="xs">
            <Text size="xs" c="slate.5" fw={600}>BRANCH NAME</Text>
            <Text size="xs" c="slate.5" fw={600}>OUTSTANDING AMOUNT & %</Text>
          </Group>
          <Stack gap="md" p="xs">
            {[
              { name: 'Lusaka Main', value: 25, amount: 'ZMW 48.15M', color: 'blue.6' },
              { name: 'Kitwe Center', value: 15, amount: 'ZMW 28.89M', color: 'blue.5' },
              { name: 'Ndola Branch', value: 12, amount: 'ZMW 23.11M', color: 'blue.4' },
              { name: 'Mufulira', value: 10, amount: 'ZMW 19.26M', color: 'blue.3' },
              { name: 'Kabwe', value: 8, amount: 'ZMW 15.41M', color: 'blue.3' },
              { name: 'Livingstone', value: 8, amount: 'ZMW 15.41M', color: 'blue.2' },
              { name: 'Chingola', value: 7, amount: 'ZMW 13.48M', color: 'blue.2' },
              { name: 'Luanshya', value: 6, amount: 'ZMW 11.55M', color: 'blue.2' },
              { name: 'Kasama', value: 5, amount: 'ZMW 9.63M', color: 'blue.1' },
              { name: 'Chipata', value: 4, amount: 'ZMW 7.70M', color: 'blue.1' },
            ].map(item => (
              <Box key={item.name}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" c="slate.7" fw={500}>{item.name}</Text>
                  <Group gap={8}>
                    <Text size="xs" c="slate.5">{item.amount}</Text>
                    <Text size="sm" c="slate.7" fw={700}>{item.value}%</Text>
                  </Group>
                </Group>
                <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                  <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      </Modal>

      <Modal opened={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={<Text fw={600} c="slate.8">Portfolio by Loan Product (All)</Text>} size="lg" radius="md">
        <ScrollArea h={400} offsetScrollbars>
          <Group justify="space-between" mb="sm" px="xs">
            <Text size="xs" c="slate.5" fw={600}>LOAN PRODUCT</Text>
            <Text size="xs" c="slate.5" fw={600}>OUTSTANDING AMOUNT & %</Text>
          </Group>
          <Stack gap="md" p="xs">
            {productData.map(item => (
              <Box key={item.name}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" c="slate.7" fw={500}>{item.name}</Text>
                  <Group gap={8}>
                    <Text size="xs" c="slate.5">{item.amount}</Text>
                    <Text size="sm" c="slate.7" fw={700}>{item.value}%</Text>
                  </Group>
                </Group>
                <Box w="100%" h={8} bg="slate.1" style={{ borderRadius: 4 }}>
                  <Box w={`${item.value}%`} h="100%" bg={item.color} style={{ borderRadius: 4 }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      </Modal>

      <Modal opened={!!summaryData} onClose={() => setSummaryData(null)} title={<Text fw={600} c="slate.8" size="lg">Loan Details Summary</Text>} size="xl" radius="md">
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
                  <Text size="xs" c="slate.5">Status</Text>
                  <Box mt={4}>{renderStatus(summaryData.status)}</Box>
                </Box>
              </SimpleGrid>

              <Box style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }} pt="lg">
                <Text size="md" fw={600} c="slate.7" mb="md">Financial Breakdown</Text>
                <SimpleGrid cols={3} spacing="lg">
                  <Box>
                    <Text size="xs" c="slate.5">Disbursement Date</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.disbDate}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Next Due Date</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.nextDue}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Disbursed Amount</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.disbAmt}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Principal Repaid</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.prinRepaid}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Principal O/S</Text>
                    <Text size="sm" fw={600} c="slate.8">{summaryData.prinOS}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Accrued Interest</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.accInt}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Interest Paid</Text>
                    <Text size="sm" fw={500} c="slate.8">{summaryData.intPaid}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Interest O/S</Text>
                    <Text size="sm" fw={600} c="slate.8">{summaryData.intOS}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Fees/Penalty O/S</Text>
                    <Text size="sm" fw={600} c="slate.8">{summaryData.feesOS}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">Total O/S</Text>
                    <Text size="sm" fw={700} c="slate.8" size="lg">{summaryData.totalOS}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="slate.5">DPD (Days Past Due)</Text>
                    <Text size="sm" fw={600} c={summaryData.dpd > 0 ? "red.6" : "slate.8"}>{summaryData.dpd}</Text>
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



































