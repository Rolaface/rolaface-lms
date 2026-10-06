import React from 'react';
import { DatePickerInput } from '@mantine/dates';
import { Box, Avatar, Progress, Modal, Button, Title, Text, Paper, Group, Stack, SimpleGrid, Grid, Table, Badge, ActionIcon, Menu, ThemeIcon, RingProgress } from '@mantine/core';
import { IconDots, IconAlertCircle, IconArrowUpRight, IconArrowDownRight, IconCheck, IconClock, IconX, IconUser, IconBriefcase, IconCar, IconHome, IconFileText, IconCurrencyDollar, IconPercentage, IconCalendar } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, ComposedChart, Line, LabelList, PieChart, Pie, Cell, FunnelChart, Funnel , AreaChart, Area } from 'recharts';

const funnelData = [
  { name: 'Applications Logged', count: 12458, fill: '#6366f1', conv: '100%' },
  { name: 'Pre-Screening', count: 10892, fill: '#3b82f6', conv: '87.4%' },
  { name: 'Appraisal', count: 9845, fill: '#14b8a6', conv: '79.0%' },
  { name: 'Underwriting', count: 7420, fill: '#f59e0b', conv: '59.6%' },
  { name: 'Offer Issued', count: 6842, fill: '#f43f5e', conv: '54.9%' },
];

const channelData = [
  { name: 'Branch', apps: 3420, rejected: 1020, approved: 2120 },
  { name: 'Mobile App', apps: 2510, rejected: 710, approved: 1700 },
  { name: 'Website', apps: 1920, rejected: 650, approved: 1110 },
  { name: 'DSA / Agent', apps: 1680, rejected: 690, approved: 870 },
  { name: 'Partner', apps: 1910, rejected: 610, approved: 1160 },
  { name: 'Internet Banking', apps: 1640, rejected: 620, approved: 930 },
];

const productData = [
  { name: 'Personal', apps: 4520, approved: 2150, pending: 2370 },
  { name: 'Business', apps: 3210, approved: 1840, pending: 1370 },
  { name: 'Auto', apps: 2840, approved: 1620, pending: 1220 },
  { name: 'Home', apps: 1888, approved: 980, pending: 908 },
];

const trendData = [
  { month: 'May', Approved: 420, Rejected: 180 },
  { month: 'Jun', Approved: 510, Rejected: 210 },
  { month: 'Jul', Approved: 480, Rejected: 195 },
  { month: 'Aug', Approved: 630, Rejected: 250 },
  { month: 'Sep', Approved: 720, Rejected: 290 },
  { month: 'Oct', Approved: 380, Rejected: 150 },
];

const initialTasks = [
  { id: 'APP-10390', name: 'Chileshe Mulenga', action: 'Credit Review', amount: 'ZMW 150K', status: 'Overdue' },
  { id: 'APP-10411', name: 'Emmanuel Banda', action: 'Field Verification', amount: 'ZMW 45K', status: 'Due Today' },
  { id: 'APP-10388', name: 'Sara Phiri', action: 'Income Sign-off', amount: 'ZMW 320K', status: 'Overdue' },
  { id: 'APP-10299', name: 'Lubasi Mweemba', action: 'Final Approval', amount: 'ZMW 85K', status: 'Tomorrow' },
  { id: 'APP-10301', name: 'Bwalya Nkandu', action: 'KYC Check', amount: 'ZMW 12K', status: 'Due Today' },
];

const reasonsData = [
  { reason: 'Low Credit Score', count: 1204, percent: 38.5 },
  { reason: 'Income Not Sufficient', count: 788, percent: 25.2 },
  { reason: 'KYC / Documents', count: 575, percent: 18.4 },
  { reason: 'High DTI / FOIR', count: 363, percent: 11.6 },
  { reason: 'Other', count: 198, percent: 6.3 },
];

const escalatedApplications = [
  { id: 'APP-10512', name: 'Zambia Traders Ltd', type: 'Business Loan', amount: 'ZMW 4.5M', stage: 'Underwriting', sla: 'Breached (2 Days)', reason: 'High Value - Admin Sign-off Required', severity: 'red' },
  { id: 'APP-10508', name: 'Mining Solutions Corp', type: 'Asset Finance', amount: 'ZMW 2.8M', stage: 'Appraisal', sla: 'Warning', reason: 'Collateral Valuation Mismatch', severity: 'orange' },
  { id: 'APP-10499', name: 'Dr. Mutale Banda', type: 'Home Loan', amount: 'ZMW 850K', stage: 'KYC Check', sla: 'On Track', reason: 'PEP (Politically Exposed Person) Alert', severity: 'yellow' },
  { id: 'APP-10491', name: 'Copperbelt Logistics', type: 'Fleet Finance', amount: 'ZMW 1.2M', stage: 'Final Approval', sla: 'Breached (1 Day)', reason: 'DTI Ratio Policy Exception', severity: 'red' },
];

const recentApplicationsData = [
  { id: 'APP-10522', name: 'Zambia Traders Ltd', type: 'Business Loan', amount: 'ZMW 4.5M', stage: 'Underwriting', status: 'In Progress', date: 'Oct 05, 2026' },
  { id: 'APP-10521', name: 'Dr. Mutale Banda', type: 'Personal Loan', amount: 'ZMW 150K', stage: 'Pre-Screening', status: 'Pending Review', date: 'Oct 05, 2026' },
  { id: 'APP-10520', name: 'Copperbelt Logistics', type: 'Asset Finance', amount: 'ZMW 2.8M', stage: 'Offer Issued', status: 'Approved', date: 'Oct 04, 2026' },
  { id: 'APP-10519', name: 'Sara Phiri', type: 'Home Loan', amount: 'ZMW 850K', stage: 'Appraisal', status: 'In Progress', date: 'Oct 04, 2026' },
  { id: 'APP-10518', name: 'Emmanuel Banda', type: 'Business Loan', amount: 'ZMW 1.2M', stage: 'Applications Logged', status: 'New', date: 'Oct 04, 2026' },
];

const rejectedAppsData = [
  { applicant: 'Mumba Kalaba', appId: 'APP-10492', reason: 'Low Credit Score', date: 'Oct 02, 2026' },
  { applicant: 'Chanda Bwalya', appId: 'APP-10488', reason: 'High DTI / FOIR', date: 'Oct 01, 2026' },
  { applicant: 'John Phiri', appId: 'APP-10475', reason: 'Income Not Sufficient', date: 'Oct 01, 2026' },
  { applicant: 'Mary Banda', appId: 'APP-10471', reason: 'KYC / Documents', date: 'Sep 30, 2026' },
  { applicant: 'Isaac Lungu', appId: 'APP-10460', reason: 'Low Credit Score', date: 'Sep 29, 2026' },
];

const demographicData = [
  { title: 'Gender', data: [{ name: 'Male (54%)', value: 54, color: '#3b82f6' }, { name: 'Female (43%)', value: 43, color: '#10b981' }, { name: 'Other (3%)', value: 3, color: '#94a3b8' }] },
  { title: 'Age Groups', data: [{ name: '18-25 (15%)', value: 15, color: '#f59e0b' }, { name: '26-35 (45%)', value: 45, color: '#6366f1' }, { name: '36-45 (28%)', value: 28, color: '#8b5cf6' }, { name: '45+ (12%)', value: 12, color: '#14b8a6' }] },
  { title: 'Employment Type', data: [{ name: 'Salaried (55%)', value: 55, color: '#0ea5e9' }, { name: 'Self-Employed (30%)', value: 30, color: '#f59e0b' }, { name: 'Business (15%)', value: 15, color: '#a855f7' }] },
  { title: 'Top Regions', data: [{ name: 'Lusaka (37.5%)', value: 37.5, color: '#3b82f6' }, { name: 'Ndola (23.3%)', value: 23.3, color: '#10b981' }, { name: 'Kitwe (17.5%)', value: 17.5, color: '#a855f7' }, { name: 'Livingstone (12.5%)', value: 12.5, color: '#f59e0b' }, { name: 'Other (9.2%)', value: 9.2, color: '#94a3b8' }] },
];

const tatData = [
  { stage: 'Pre-Screening', days: 1.2, fill: '#3b82f6' },
  { stage: 'Appraisal', days: 2.5, fill: '#3b82f6' },
  { stage: 'Underwriting', days: 4.8, fill: '#ef4444' },
  { stage: 'Offer Issued', days: 1.1, fill: '#3b82f6' },
];

const teamData = [
  { name: 'Rahul Sharma', role: 'Sr. Underwriter', apps: 42, color: '#ef4444' },
  { name: 'Priya Patel', role: 'Underwriter', apps: 28, color: '#f59e0b' },
  { name: 'Amit Singh', role: 'Appraiser', apps: 15, color: '#3b82f6' },
  { name: 'Neha Gupta', role: 'Appraiser', apps: 12, color: '#3b82f6' },
];

const riskData = [
  { name: 'High Risk (<650)', value: 18, color: '#ef4444' },
  { name: 'Low Risk (750+)', value: 52, color: '#10b981' },
  { name: 'Medium (650-749)', value: 30, color: '#f59e0b' },
];


function MetricCard({ title, value, trend, subtext, isPositive, secondaryValue }: any) {
  return (
    <Paper p="md" radius="md" shadow="sm" withBorder>
      <Text size="xs" fw={700} c="slate.5" mb={4} tt="uppercase">{title}</Text>
      <Group align="flex-end" gap="xs">
        <Text size="xl" fw={800} c="slate.8">{value}</Text>
        {secondaryValue && <Text size="sm" fw={700} c="dimmed" mb={4}>{secondaryValue}</Text>}
      </Group>
      <Group gap={4} mt={6} wrap="nowrap">
        {isPositive ? (
          <IconArrowUpRight size={14} color="var(--mantine-color-teal-6)" stroke={3} />
        ) : (
          <IconArrowDownRight size={14} color="var(--mantine-color-red-6)" stroke={3} />
        )}
        <Text size="xs" fw={700} c={isPositive ? "teal.6" : "red.6"}>{trend}</Text>
        <Text size="xs" c="slate.5" fw={500} style={{ whiteSpace: 'nowrap' }}>{subtext}</Text>
      </Group>
    </Paper>
  );
}

function DemographicProgressBar({ title, data }: { title: string, data: any[] }) {
  return (
    <Box>
      <Text size="xs" fw={700} c="slate.5" mb={6} tt="uppercase">{title}</Text>
      <Progress.Root size="md" radius="sm">
        {data.map((item, index) => (
          <Progress.Section key={index} value={item.value} color={item.color} />
        ))}
      </Progress.Root>
      <Group gap={10} mt={8} wrap="wrap">
        {data.map((item, index) => (
          <Group gap={4} key={index}>
            <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color }} />
            <Text fz={11} c="slate.6" fw={600}>{item.name}</Text>
          </Group>
        ))}
      </Group>
    </Box>
  );
}

export default function LosDashboard() {
  const [modalState, setModalState] = React.useState({ isOpen: false, title: '' });
  const [tasks, setTasks] = React.useState(initialTasks);
  const [reviewState, setReviewState] = React.useState<any>({ isOpen: false, app: null });
  const openDetails = (title: string) => setModalState({ isOpen: true, title });

  const getModalData = () => {
    const t = modalState.title;
    if (t.includes('Stages')) return {
      headers: ['STAGE', 'TOTAL APPLICATIONS', 'SUCCESS RATE', 'STATUS'],
      rows: funnelData.map(d => ({ col1: d.name, col2: d.count.toLocaleString(), col3: d.conv, status: 'Active', color: 'green' }))
    };
    if (t.includes('Channel')) return {
      headers: ['CHANNEL', 'APPLICATIONS', 'APPROVED', 'REJECTED'],
      rows: channelData.map(d => ({ col1: d.name, col2: d.apps.toLocaleString(), col3: d.approved.toLocaleString(), status: d.rejected.toLocaleString(), color: 'red' }))
    };
    if (t.includes('Product')) return {
      headers: ['LOAN PRODUCT', 'TOTAL APPLICATIONS', 'APPROVED', 'APPROVAL RATE'],
      rows: productData.map(d => ({ col1: d.name, col2: d.apps.toLocaleString(), col3: d.approved.toLocaleString(), status: ((d.approved/d.apps)*100).toFixed(1)+'%', color: 'blue' }))
    };
    if (t.includes('Rejection')) return {
      headers: ['APPLICANT NAME', 'APPLICATION NO.', 'REJECTION REASON', 'DATE REJECTED'],
      rows: rejectedAppsData.map(d => ({ col1: d.applicant, col2: d.appId, col3: d.reason, status: d.date, color: 'gray', isText: true }))
    };
    if (t.includes('Risk')) return {
      headers: ['RISK CATEGORY', 'PERCENTAGE', 'RISK LEVEL', 'ACTION'],
      rows: riskData.map(d => ({ col1: d.name, col2: d.value+'%', col3: d.value > 40 ? 'Major' : 'Minor', status: 'Monitor', color: 'indigo' }))
    };
    if (t.includes('Time')) return {
      headers: ['PROCESSING STAGE', 'AVG DAYS', 'SLA TARGET', 'STATUS'],
      rows: tatData.map(d => {
        const sla = d.stage === 'Underwriting' ? 4.0 : 2.0;
        const breached = d.days > sla;
        return { col1: d.stage, col2: d.days + ' Days', col3: sla.toFixed(1) + ' Days', status: breached ? 'Breached' : 'On Track', color: breached ? 'red' : 'green' };
      })
    };
    if (t.includes('Workload')) return {
      headers: ['STAFF MEMBER', 'ROLE', 'ACTIVE FILES', 'CAPACITY'],
      rows: teamData.map(d => ({ col1: d.name, col2: d.role, col3: d.apps.toLocaleString(), status: d.apps > 30 ? 'Overloaded' : 'Optimal', color: d.apps > 30 ? 'red' : 'green' }))
    };
    if (t.includes('Tasks')) return {
      headers: ['APPLICANT NAME', 'APPLICATION NO.', 'PENDING ACTION', 'DEADLINE'],
      rows: tasks.map(d => ({ col1: d.name, col2: d.id, col3: `${d.action} (${d.amount})`, status: d.status, color: d.status === 'Overdue' ? 'red' : d.status === 'Due Today' ? 'orange' : 'blue' }))
    };
    if (t.includes('User')) return {
      headers: ['CATEGORY', 'SEGMENT', 'PERCENTAGE', 'STATUS'],
      rows: demographicData.flatMap(d => d.data.map(item => ({ col1: d.title, col2: item.name.split(' (')[0], col3: item.value+'%', status: 'Active', color: 'green' })))
    };
    if (t.includes('Recent') || t.includes('App:')) {
      const selected = recentApplicationsData.find(d => t.includes(d.id));
      if (selected) {
        return {
          headers: ['APPLICATION NO.', 'APPLICANT NAME', 'LOAN PRODUCT', 'CURRENT STAGE'],
          rows: [{ col1: selected.id, col2: selected.name, col3: `${selected.type} (${selected.amount})`, status: selected.stage, color: 'blue', isText: true }]
        };
      }
      return {
        headers: ['APPLICANT NAME', 'APPLICATION NO.', 'LOAN PRODUCT', 'CURRENT STAGE'],
        rows: recentApplicationsData.map(d => ({ col1: d.name, col2: d.id, col3: d.type, status: d.stage, color: 'blue', isText: true }))
      };
    }
if (t.includes('Queue')) {
      const mockQueueApps = [
        { applicant: 'Zambia Traders Ltd', amount: 'ZMW 4.5M', time: '48 Hrs', status: 'Breached', severity: 'red' },
        { applicant: 'Mining Solutions Corp', amount: 'ZMW 2.8M', time: '24 Hrs', status: 'Warning', severity: 'orange' },
        { applicant: 'Dr. Mutale Banda', amount: 'ZMW 850K', time: '4 Hrs', status: 'On Track', severity: 'teal' },
        { applicant: 'Copperbelt Logistics', amount: 'ZMW 1.2M', time: '72 Hrs', status: 'Breached', severity: 'red' },
        { applicant: 'Chanda Bwalya', amount: 'ZMW 150K', time: '12 Hrs', status: 'On Track', severity: 'teal' },
      ];

      return {
        headers: ['APPLICANT NAME', 'LOAN AMOUNT', 'TIME IN QUEUE', 'SLA STATUS'],
        rows: mockQueueApps.map(d => ({ col1: d.applicant, col2: d.amount, col3: d.time, status: d.status, color: d.severity }))
      };
    }
if (t.includes('Escalation')) return {
      headers: ['APPLICANT', 'LOAN PRODUCT', 'REVIEW REASON', 'SLA STATUS'],
      rows: escalatedApplications.map(d => ({ col1: d.name, col2: d.type, col3: d.reason, status: d.sla, color: d.severity === 'yellow' ? 'orange' : d.severity }))
    };
    return {
      headers: ['METRIC', 'VALUE', 'PERCENTAGE', 'STATUS'],
      rows: [{ col1: 'Overall', col2: 'N/A', col3: 'N/A', status: 'N/A', color: 'gray' }]
    };
  };

  return (
    <Box p="lg" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={3} c="slate.8" style={{ fontWeight: 700 }}>LOS Dashboard</Title>
        <Group gap="sm">
          <Group gap={8}>
            <DatePickerInput placeholder="From Date" size="sm" w={130} leftSection={<IconCalendar size={14} />} clearable />
            <Text size="sm" c="slate.4" fw={600}>-</Text>
            <DatePickerInput placeholder="To Date" size="sm" w={130} leftSection={<IconCalendar size={14} />} clearable />
          </Group>
          <Button variant="outline" color="slate" size="sm" leftSection={<IconFileText size={16} />}>Export</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md" mb="lg">
        <MetricCard title="Total Applications" value="12,458" trend="+12.5%" subtext="vs last month" isPositive={true} secondaryValue="ZMW 4.2B" />
        <MetricCard title="Approved Loans" value="6,842" trend="+8.2%" subtext="vs last month" isPositive={true} secondaryValue="ZMW 2.1B" />
        <MetricCard title="Total Disbursed" value="ZMW 1.8B" trend="+15.3%" subtext="vs last month" isPositive={true} />
        <MetricCard title="Avg Processing Time" value="4.2 Days" trend="-0.5 days" subtext="vs last month" isPositive={true} />
        <MetricCard title="Overall Approval Rate" value="54.9%" trend="-2.1%" subtext="vs last month" isPositive={false} />
      </SimpleGrid>

      <Grid gutter="md" mb="lg" align="stretch">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%" display="flex" style={{ flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700} c="slate.8">Application Stages</Text>
              <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer' }} onClick={() => openDetails('Application Stages')}>View Details &rarr;</Text>
            </Group>
            <Box style={{ flex: 1 }}>
              <Grid align="center" gutter="md">
                <Grid.Col span={{ base: 12, sm: 5 }}>
                  <Box h={200}>
                    <ResponsiveContainer width="100%" height="100%">
                      <FunnelChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Funnel dataKey="count" data={funnelData} isAnimationActive={false}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <LabelList position="center" fill="#fff" stroke="none" dataKey="count" fontSize={11} fontWeight={600} formatter={(val: any) => val.toLocaleString()} />
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 7 }}>
                  <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" style={{ borderCollapse: 'collapse' }}>
                    <Table.Thead>
                      <Table.Tr style={{ borderBottom: 'none' }}>
                        <Table.Th style={{ color: 'var(--mantine-color-slate-4)', fontWeight: 600, border: 'none', paddingBottom: 8, whiteSpace: 'nowrap' }}>STAGE</Table.Th>
                        <Table.Th style={{ color: 'var(--mantine-color-slate-4)', fontWeight: 600, textAlign: 'right', border: 'none', paddingBottom: 8, whiteSpace: 'nowrap' }}>APPLICATIONS</Table.Th>
                        <Table.Th style={{ color: 'var(--mantine-color-slate-4)', fontWeight: 600, textAlign: 'right', border: 'none', paddingBottom: 8, whiteSpace: 'nowrap' }}>SUCCESS RATE</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {funnelData.map((stage) => (
                        <Table.Tr key={stage.name} style={{ borderBottom: '1px dashed var(--mantine-color-slate-2)' }}>
                          <Table.Td style={{ border: 'none', whiteSpace: 'nowrap' }}>
                            <Group gap="sm" wrap="nowrap">
                              <Box w={10} h={10} style={{ borderRadius: '50%', backgroundColor: stage.fill, flexShrink: 0 }} />
                              <Text size="xs" fw={600} c="slate.7">{stage.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td align="right" style={{ border: 'none' }}><Text size="xs" fw={700} c="slate.8">{stage.count.toLocaleString()}</Text></Table.Td>
                          <Table.Td align="right" style={{ border: 'none' }}><Text size="xs" fw={700} c="slate.8">{stage.conv}</Text></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Grid.Col>
              </Grid>
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%" display="flex" style={{ flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700} c="slate.8">Rejection Analysis</Text>
              <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer' }} onClick={() => openDetails('Rejection Analysis')}>View Details &rarr;</Text>
            </Group>
            <Stack gap="md" style={{ flex: 1 }}>
              {reasonsData.map((item) => (
                <Box key={item.reason}>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" fw={600} c="slate.7">{item.reason}</Text>
                    <Group gap={8}>
                      <Text size="xs" c="slate.5">{item.percent}%</Text>
                      <Text size="sm" fw={700} c="slate.8">{item.count.toLocaleString()}</Text>
                    </Group>
                  </Group>
                  <Progress value={item.percent} color="indigo.4" size="sm" radius="xl" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%" display="flex" style={{ flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700} c="slate.8">Channel Performance</Text>
              <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer' }} onClick={() => openDetails('Channel Performance')}>View Details &rarr;</Text>
            </Group>
            <Box h={220}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={channelData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" scale="band" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis tickFormatter={(val: any) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 15, fontSize: 12, color: '#64748b' }} />
                  <Bar dataKey="apps" name="Applications" fill="#a78bfa" barSize={16} isAnimationActive={false} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#f43f5e" barSize={16} isAnimationActive={false} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} isAnimationActive={false} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}>
                    <LabelList dataKey="approved" position="top" fontSize={11} fill="#10b981" fontWeight={700} dy={-5} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%" display="flex" style={{ flexDirection: 'column' }}>
            <Group justify="space-between" mb="lg">
              <Text size="sm" fw={700} c="slate.8">User Breakdown Snapshot</Text>
              <Text size="xs" c="blue.6" fw={600} style={{ cursor: 'pointer' }} onClick={() => openDetails('User Breakdown Snapshot')}>View Details &rarr;</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              {demographicData.map((demo) => (
                <DemographicProgressBar key={demo.title} title={demo.title} data={demo.data} />
              ))}
            </SimpleGrid>
          </Paper>
        </Grid.Col>
      </Grid>

      
      {/* Recent Applications Table */}
      <Paper p="lg" radius="md" shadow="sm" withBorder mb="lg">
        <Group justify="space-between" mb="lg">
          <Box>
            <Text size="md" fw={700} c="slate.8">Recent Loan Applications</Text>
            <Text size="xs" c="slate.5" mt={2}>Live feed of the latest applications currently moving through the origination pipeline.</Text>
          </Box>
          <Button variant="light" size="xs" radius="xl" onClick={() => openDetails('Recent Applications')}>View All Applications</Button>
        </Group>
        <Box style={{ overflowX: 'auto' }}>
          <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: 8 }}>
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>APPLICANT</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>LOAN PRODUCT</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>AMOUNT</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>CURRENT STAGE</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>STATUS</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }} ta="right">ACTION</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentApplicationsData.map((app) => (
                <Table.Tr key={app.id}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="slate.8">{app.name}</Text>
                    <Text fz={11} c="slate.5">{app.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">{app.type}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700} c="slate.7">{app.amount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c="brand.6">{app.stage}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={app.status === 'Approved' ? 'teal' : app.status === 'New' ? 'blue' : 'orange'} variant="light">
                      {app.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Button size="xs" variant="default" onClick={() => openDetails(`App: ${app.id}`)}>View File</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      <Modal opened={modalState.isOpen} onClose={() => setModalState({ isOpen: false, title: '' })} title={null} size="xl" padding="xl" radius="md" withCloseButton={false}>
        <Group justify="space-between" mb="xl">
          <Box>
            <Title order={4} c="slate.8">{modalState.title} Details</Title>
            <Text size="sm" c="slate.5" mt={4}>
              {modalState.title.includes('Stages') ? 'Detailed breakdown of all applications currently in the pipeline.' :
               modalState.title.includes('Channel') ? 'Performance metrics across all origination channels.' :
               modalState.title.includes('User') ? 'Detailed segment statistics for registered users.' :
               modalState.title.includes('Tasks') ? 'Full list of pending action items.' :
               modalState.title.includes('Product') ? 'Complete portfolio breakdown by loan product.' :
               modalState.title.includes('Rejection') ? 'Detailed list of recently rejected loan applications and their reasons.' :
               modalState.title.includes('Escalation') ? 'Complete list of all escalated applications requiring administrative review.' :
               modalState.title.includes('Risk') ? 'Distribution of credit risk across active applicants.' :
               modalState.title.includes('App:') ? 'Detailed application summary and current origination stage.' :
               'Comprehensive view of selected metrics.'}
            </Text>
          </Box>
          <Group gap="sm">
            <Button variant="light" color="slate" size="xs" leftSection={<IconFileText size={14} />}>Export CSV</Button>
            <ActionIcon variant="subtle" color="slate" onClick={() => setModalState({ isOpen: false, title: '' })}><IconX size={20} /></ActionIcon>
          </Group>
        </Group>

        <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: 8 }}>
          <Table.Thead bg="slate.0">
            <Table.Tr>
              {getModalData().headers.map((h, i) => (
                <Table.Th key={i} style={{ color: 'var(--mantine-color-slate-5)' }}>{h}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {getModalData().rows.map((r, i) => (
              <Table.Tr key={i}>
                <Table.Td><Text size="sm" fw={600} c="slate.7">{r.col1}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={500} c="slate.6">{r.col2}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={500} c="slate.6">{r.col3}</Text></Table.Td>
                <Table.Td>
                  {r.isText ? (
                    <Text size="sm" fw={500} c="slate.6">{r.status}</Text>
                  ) : (
                    <Badge size="xs" variant="light" color={r.color}>{r.status}</Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Modal>

      {/* Application Review Modal */}
      <Modal opened={reviewState.isOpen} onClose={() => setReviewState({ isOpen: false, app: null })} title={<Title order={4} c="slate.8">Application Review - {reviewState.app?.id}</Title>} size="lg" radius="md">
        {reviewState.app && (
          <Stack gap="md">
            <Group grow align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" fw={600}>APPLICANT NAME</Text>
                <Text size="sm" fw={600} c="slate.8">{reviewState.app.name}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" fw={600}>LOAN PRODUCT</Text>
                <Text size="sm" fw={600} c="slate.8">{reviewState.app.type}</Text>
              </Box>
            </Group>
            <Group grow align="flex-start">
              <Box>
                <Text size="xs" c="dimmed" fw={600}>LOAN AMOUNT</Text>
                <Text size="sm" fw={700} c="slate.8">{reviewState.app.amount}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" fw={600}>CURRENT STAGE</Text>
                <Text size="sm" fw={600} c="slate.8">{reviewState.app.stage}</Text>
              </Box>
            </Group>

            <Paper p="sm" radius="md" bg={reviewState.app.severity === 'red' ? 'red.0' : reviewState.app.severity === 'orange' ? 'orange.0' : 'yellow.0'} style={{ border: `1px solid var(--mantine-color-${reviewState.app.severity}-3)` }}>
              <Group gap="sm" mb="xs">
                <ThemeIcon color={reviewState.app.severity} size="sm" variant="light" radius="xl"><IconAlertCircle size={14} /></ThemeIcon>
                <Text size="sm" fw={700} c={`${reviewState.app.severity}.9`}>Review Reason</Text>
              </Group>
              <Text size="sm" c={`${reviewState.app.severity}.9`}>{reviewState.app.reason}</Text>
              <Text size="xs" c={`${reviewState.app.severity}.7`} mt={4} fw={600}>SLA Status: {reviewState.app.sla}</Text>
            </Paper>

            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => setReviewState({ isOpen: false, app: null })}>Cancel</Button>
              <Button color="red">Reject File</Button>
              <Button color="green">Approve Exception</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
