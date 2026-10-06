import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllLoansDisbursement } from "../../../api/loanDisbursementAPi";
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

// --- MOCK DATA FOR CHARTS ---
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

export function DisbursementReport() {
    const [search, setSearch] = useState("");
    const [branch, setBranch] = useState<string>("All Branches");
    const [product, setProduct] = useState<string>("All Products");
    const [officer, setOfficer] = useState<string>("All Officers");
    const [status, setStatus] = useState<string>("All Status");
    const [method, setMethod] = useState<string>("All Methods");
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, [search, branch, product, officer, status, method]);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);

    const { data: disbursementRes, isLoading } = useQuery({
      queryKey: ['disbursement-report-list'],
      queryFn: () => getAllLoansDisbursement({ page_size: 100 }),
    });

            const rawDataMapped = useMemo(() => {
      const raw = disbursementRes?.data || disbursementRes?.message?.data || disbursementRes?.message || [];
      if (!Array.isArray(raw)) return [];
      
      return raw.map((d: any) => ({
        id: d.loan || d.name || '-',
        customer: d.applicant || d.customer_name || d.customer || '-',
        product: d.loan_product || '-',
        branch: d.company || '-',
        officer: d.owner || '-',
        approved: `ZMW ${(d.disbursed_amount || d.loan_amount || 0).toLocaleString()}`,
        disbursed: `ZMW ${(d.disbursed_amount || 0).toLocaleString()}`,
        date: d.posting_date || d.creation?.split(' ')[0] || '-',
        type: d.mode_of_payment || '-',
        account: d.payment_account || d.bank_account || '-',
        status: d.status || (d.docstatus === 1 ? 'Disbursed' : d.docstatus === 2 ? 'Cancelled' : 'Pending'),
        ref: d.reference_no || d.reference_date || '-'
      }));
    }, [disbursementRes]);

    const filterOptions = useMemo(() => {
      return {
        branches: ["All Branches", ...Array.from(new Set(rawDataMapped.map(d => d.branch))).filter(b => b && b !== '-')],
        products: ["All Products", ...Array.from(new Set(rawDataMapped.map(d => d.product))).filter(p => p && p !== '-')],
        officers: ["All Officers", ...Array.from(new Set(rawDataMapped.map(d => d.officer))).filter(o => o && o !== '-')],
        statuses: ["All Status", ...Array.from(new Set(rawDataMapped.map(d => d.status))).filter(s => s && s !== '-')],
        methods: ["All Methods", ...Array.from(new Set(rawDataMapped.map(d => d.type))).filter(t => t && t !== '-')]
      };
    }, [rawDataMapped]);

    const analytics = useMemo(() => {
    let totalDisbursed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    
    const typeCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const branchCount: Record<string, number> = {};
    const monthlySum: Record<string, { Disbursed: number, Approved: number }> = {};

    rawDataMapped.forEach((d) => {
      const dbAmt = Number(String(d.disbursed).replace(/[^0-9.-]+/g,"")) || 0;
      const apAmt = Number(String(d.approved).replace(/[^0-9.-]+/g,"")) || 0;
      
      totalDisbursed += dbAmt;
      totalApproved += apAmt;

            // Type data
      if (d.type) {
        const typeName = d.type === '-' ? 'Not Specified' : d.type;
        typeCount[typeName] = (typeCount[typeName] || 0) + 1;
      }

      // Status data
      if (d.status && d.status !== '-') {
        statusCount[d.status] = (statusCount[d.status] || 0) + 1;
      }
      
            const statusLower = String(d.status).toLowerCase();
      const isDisbursed = statusLower.includes('disburs') || statusLower === 'paid' || statusLower === 'submitted' || statusLower === 'approved';
      if (!isDisbursed) {
        pendingCount++;
        pendingAmount += apAmt;
      }

            // Branch data
      if (d.branch) {
        const branchName = d.branch === '-' ? 'Not Specified' : d.branch;
        branchCount[branchName] = (branchCount[branchName] || 0) + 1;
      }

                  // Monthly Trend (Parse date like 2025-09-02 or 02 Sep 2025)
      let dateObj = new Date(d.date === '-' ? new Date() : d.date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
      const monthYear = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlySum[monthYear]) {
        monthlySum[monthYear] = { Disbursed: 0, Approved: 0 };
      }
      monthlySum[monthYear].Disbursed += dbAmt;
      monthlySum[monthYear].Approved += apAmt;
    });

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];
    
            // Calculate total actual disbursed loans
    const disbursedCount = rawDataMapped.filter(d => {
      const lower = String(d.status).toLowerCase();
      return lower.includes('disburs') || lower === 'paid' || lower === 'submitted' || lower === 'approved';
    }).length;
    
    const partialCount = rawDataMapped.filter(d => String(d.status).toLowerCase().includes('partial')).length;
    
    return {
      partialCount,
      totalDisbursed,
      totalApproved,
      pendingCount,
      pendingAmount,
      disbursedCount,
      typeData: Object.entries(typeCount).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })),
      statusData: Object.entries(statusCount).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })),
      branchData: Object.entries(branchCount).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })).sort((a,b) => b.value - a.value),
      monthlyData: Object.entries(monthlySum).map(([name, data]) => ({ name, ...data }))
    };
  }, [rawDataMapped]);


    const tableData = useMemo(() => {
      let mapped = [...rawDataMapped];

      if (search) {
        const lowerSearch = search.toLowerCase();
        mapped = mapped.filter((item: any) => 
          item.customer.toLowerCase().includes(lowerSearch) || 
          item.id.toLowerCase().includes(lowerSearch)
        );
      }
      if (branch !== 'All Branches') mapped = mapped.filter((item: any) => item.branch === branch);
      if (product !== 'All Products') mapped = mapped.filter((item: any) => item.product === product);
      if (officer !== 'All Officers') mapped = mapped.filter((item: any) => item.officer === officer);
      if (status !== 'All Status') mapped = mapped.filter((item: any) => item.status === status);
      if (method !== 'All Methods') mapped = mapped.filter((item: any) => item.type === method);

      return mapped;
    }, [rawDataMapped, search, branch, product, officer, status, method]);

    const renderStatus = (status: string) => {
    let color = 'gray';
    const lower = String(status).toLowerCase();
    if (lower.includes('disburs') || lower === 'paid' || lower === 'submitted' || lower === 'approved') color = 'green';
    else if (lower.includes('partially')) color = 'violet';
    else if (lower.includes('pending') || lower === 'draft' || lower === 'unpaid') color = 'orange';
    else if (lower.includes('fail') || lower === 'cancelled' || lower === 'rejected') color = 'red';
    
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
                <Text size="md" fw={700} c="slate.8" mt={2}>{analytics.disbursedCount}</Text>
                <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>out of {rawDataMapped.length} approved</Text>
              </Box>
            </Paper>
  
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Box>
                <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Approved Amount</Text>
                <Text size="md" fw={700} c="slate.8" mt={2}>{`ZMW ${analytics.totalApproved.toLocaleString()}`}</Text>
                <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>&nbsp;</Text>
              </Box>
            </Paper>
  
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Box>
                <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Total Disbursed Amount</Text>
                <Text size="md" fw={700} c="slate.8" mt={2}>{`ZMW ${analytics.totalDisbursed.toLocaleString()}`}</Text>
                <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>&nbsp;</Text>
              </Box>
            </Paper>
  
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Box>
                <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Pending Disbursements</Text>
                <Text size="md" fw={700} c="slate.8" mt={2}>{analytics.pendingCount}</Text>
                <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>{`ZMW ${analytics.pendingAmount.toLocaleString()}`}</Text>
              </Box>
            </Paper>
  
            <Paper p="sm" radius="md" shadow="sm" withBorder h="100%">
              <Box>
                <Text size="xs" c="slate.5" fw={600} style={{ lineHeight: 1.2 }}>Partial Disbursements</Text>
                <Text size="md" fw={700} c="slate.8" mt={2}>{analytics.partialCount}</Text>
                <Text style={{ fontSize: 11 }} c="slate.5" mt={2}>{rawDataMapped.length > 0 ? ((analytics.partialCount / rawDataMapped.length) * 100).toFixed(1) : 0}% of total</Text>
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
              <Group gap="xs" align="center" style={{ flex: 1, justifyContent: "flex-end" }}>
                                                <Select placeholder="Branch" value={branch} onChange={(v) => setBranch(v || 'All Branches')} data={filterOptions.branches} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Loan Product" value={product} onChange={(v) => setProduct(v || 'All Products')} data={filterOptions.products} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Officer" value={officer} onChange={(v) => setOfficer(v || 'All Officers')} data={filterOptions.officers} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Status" value={status} onChange={(v) => setStatus(v || 'All Status')} data={filterOptions.statuses} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <Select placeholder="Method" value={method} onChange={(v) => setMethod(v || 'All Methods')} data={filterOptions.methods} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 110, maxWidth: 160 }} />
                <TextInput placeholder="Search Customer or ID..." value={search} onChange={(e) => setSearch(e.currentTarget.value)} leftSection={<IconSearch size={14} />} size="xs" radius="md" style={{ flex: "1 1 auto", minWidth: 140, maxWidth: 200 }} />
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
                  {tableData.slice((page - 1) * 10, page * 10).map((row, idx) => (
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
            <Pagination total={Math.max(1, Math.ceil(tableData.length / 10))} value={page} onChange={setPage} size="sm" color="brand" />
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

      <Modal opened={!!summaryData} onClose={() => setSummaryData(null)} title={<Text fw={600} c="slate.8" size="lg">Disbursement Schedule</Text>} size="xl" radius="md">
        {summaryData && (
          <Box p="xs">
            <Stack gap="md">
              <Group mb="sm" gap={40}>
                <Box>
                  <Text size="xs" c="slate.5">Loan ID</Text>
                  <Text size="sm" fw={600} c="slate.8">{summaryData.id}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Customer</Text>
                  <Text size="sm" fw={600} c="slate.8">{summaryData.customer}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="slate.5">Loan Product</Text>
                  <Text size="sm" fw={600} c="slate.8">{summaryData.product}</Text>
                </Box>
              </Group>

              <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                <Table.ScrollContainer minWidth={700}>
                  <Table fz={12} verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                    <Table.Thead bg="slate.0">
                      <Table.Tr>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>#</Table.Th>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Date</Table.Th>
                        <Table.Th style={{ textAlign: "right", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Amount Disbursed</Table.Th>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Method</Table.Th>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Account Number</Table.Th>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Reference No.</Table.Th>
                        <Table.Th style={{ textAlign: "left", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {summaryData.date !== '-' ? (
                        <>
                          {(() => {
                            const amtStr = summaryData.disbursed.replace(/[^0-9]/g, '');
                            const totalAmt = parseInt(amtStr) || 0;
                            const p1 = Math.floor(totalAmt * 0.4);
                            const p2 = Math.floor(totalAmt * 0.3);
                            const p3 = totalAmt - p1 - p2;
                            const baseDate = summaryData.date.includes('Sep') ? new Date('2025-09-02') : new Date();
                            
                            const tranches = [
                              { id: 1, date: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), amount: p1, status: 'Disbursed', type: summaryData.type, ref: summaryData.ref + '-1' },
                              { id: 2, date: new Date(baseDate.getTime()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), amount: p2, status: 'Disbursed', type: summaryData.type, ref: summaryData.ref + '-2' },
                              { id: 3, date: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), amount: p3, status: 'Pending', type: '-', ref: '-' },
                            ];
                            
                            return tranches.map((t) => (
                              <Table.Tr key={t.id}>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)" }}>{t.id}</Table.Td>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)" }}>{t.date}</Table.Td>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>ZMW {t.amount.toLocaleString()}</Table.Td>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)" }}>{t.type}</Table.Td>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)" }}>{t.type === '-' ? '-' : summaryData.account}</Table.Td>
                                <Table.Td style={{ color: "var(--mantine-color-slate-7)" }}>{t.ref}</Table.Td>
                                <Table.Td>
                                  <Badge size="sm" variant="light" color={t.status === 'Disbursed' ? 'green' : 'orange'} style={{ textTransform: 'none' }}>
                                    {t.status}
                                  </Badge>
                                </Table.Td>
                              </Table.Tr>
                            ));
                          })()}
                          <Table.Tr bg="slate.0" style={{ borderTop: "2px solid var(--mantine-color-slate-2)" }}>
                            <Table.Td colSpan={2}>
                              <Text fz={11} fw={700} c="slate.6" tt="uppercase" style={{ letterSpacing: 0.5 }}>TOTAL</Text>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "right" }}>
                              <Text fz={12} fw={700} c="slate.8">{summaryData.disbursed}</Text>
                            </Table.Td>
                            <Table.Td colSpan={4} />
                          </Table.Tr>
                        </>
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={7} align="center">
                            <Text size="sm" c="slate.5" py="md">No disbursement transactions found.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </Stack>
          </Box>
        )}
      </Modal>
    </Box>
  );
}





































































