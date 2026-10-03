import React from 'react';
import {
  Box,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  SimpleGrid,
  Grid,
  ThemeIcon,
  Table,
  Badge,
  ActionIcon,
  RingProgress,
} from '@mantine/core';
import {
  IconFileText,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconDots,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';
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
  Cell,
  LabelList
} from 'recharts';

/* ============================
   MOCK DATA
   ============================ */

const funnelData = [
  { name: 'Pre-Screening', count: 1854, fill: '#3b82f6' },
  { name: 'Enrichment (Appraisal)', count: 1420, fill: '#60a5fa' },
  { name: 'Eligibility', count: 980, fill: '#93c5fd' },
  { name: 'Underwriting', count: 715, fill: '#bfdbfe' },
  { name: 'Offer Issued', count: 542, fill: '#dbeafe' },
];

const pendingTasks = [
  { id: '#10390', name: 'Review Credit History', stage: 'Underwriting', priority: 'High', date: 'Today' },
  { id: '#10411', name: 'Field Investigation', stage: 'Enrichment', priority: 'Medium', date: 'Today' },
  { id: '#10388', name: 'Income Verification', stage: 'Eligibility', priority: 'High', date: 'Tomorrow' },
  { id: '#10299', name: 'Final Sign-off', stage: 'Offer Issued', priority: 'Low', date: 'Oct 28' },
  { id: '#10301', name: 'KYC Document Check', stage: 'Pre-Screening', priority: 'Medium', date: 'Oct 29' },
];

const channelData = [
  { name: 'Direct Web', apps: 850, approved: 600 },
  { name: 'DSA / Broker', apps: 620, approved: 410 },
  { name: 'Mobile App', apps: 450, approved: 280 },
  { name: 'Partner Tie-ups', apps: 320, approved: 240 },
];

const genderData = [
  { name: 'Male', value: 54, color: '#3b82f6' },
  { name: 'Female', value: 43, color: '#10b981' },
  { name: 'Other', value: 3, color: '#94a3b8' },
];

const ageData = [
  { name: '18-25', value: 15, color: '#f59e0b' },
  { name: '26-35', value: 45, color: '#3b82f6' },
  { name: '36-45', value: 28, color: '#8b5cf6' },
  { name: '45+', value: 12, color: '#10b981' },
];

/* ============================
   COMPONENTS
   ============================ */

function SummaryCard({ title, value, subtext, icon, trend, isPositive }: any) {
  return (
    <Paper p="md" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Text size="sm" fw={600} c="slate.6">{title}</Text>
        <ThemeIcon variant="light" color="brand" size="md" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="xl" fw={700} c="slate.8">{value}</Text>
      <Group gap={4} mt="sm">
        {isPositive ? (
          <IconArrowUpRight size={16} color="var(--mantine-color-teal-6)" />
        ) : (
          <IconArrowDownRight size={16} color="var(--mantine-color-red-6)" />
        )}
        <Text size="xs" fw={600} c={isPositive ? "teal.6" : "red.6"}>{trend}</Text>
        <Text size="xs" c="slate.5">{subtext}</Text>
      </Group>
    </Paper>
  );
}

export default function LosDashboard() {
  return (
    <Box p="lg" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2} c="slate.8" style={{ fontWeight: 700 }}>LOS Dashboard Overview</Title>
      </Group>

      {/* --- ROW 1: SUMMARY CARDS --- */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="lg">
        <SummaryCard 
          title="Total Applications" 
          value="1,854" 
          trend="+5.2%" 
          subtext="vs last 30 days" 
          isPositive={true}
          icon={<IconFileText size={18} />} 
        />
        <SummaryCard 
          title="Requested Value" 
          value="ZMW 74.9M" 
          trend="+12.1%" 
          subtext="vs last 30 days" 
          isPositive={true}
          icon={<IconCurrencyDollar size={18} />} 
        />
        <SummaryCard 
          title="Approval Rate" 
          value="68.5%" 
          trend="+1.8%" 
          subtext="vs last 30 days" 
          isPositive={true}
          icon={<IconCheck size={18} />} 
        />
        <SummaryCard 
          title="Avg. Turnaround Time" 
          value="7.2 Days" 
          trend="-0.9 days" 
          subtext="vs last 30 days" 
          isPositive={true}
          icon={<IconClock size={18} />} 
        />
      </SimpleGrid>

      {/* --- ROW 2: FUNNEL & QUEUE --- */}
      <Grid gutter="lg" mb="lg">
        {/* Conversion Funnel */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%">
            <Text size="md" fw={700} c="slate.8" mb="xl">Application Conversion Funnel</Text>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} width={140} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    <LabelList dataKey="count" position="right" fill="#64748b" fontSize={12} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Pending Tasks Queue */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Text size="md" fw={700} c="slate.8">Pending Tasks Queue</Text>
              <Badge variant="light" color="brand">12 Tasks</Badge>
            </Group>
            
            <Box style={{ overflowX: 'auto' }}>
              <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
                <Table.Thead bg="slate.0">
                  <Table.Tr>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>Task Name</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>Stage</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }}>Priority</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-slate-5)' }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingTasks.map((task) => (
                    <Table.Tr key={task.id}>
                      <Table.Td>
                        <Text size="xs" fw={600} c="slate.8">{task.name}</Text>
                        <Text size="xs" c="dimmed">{task.id} &bull; {task.date}</Text>
                      </Table.Td>
                      <Table.Td><Text size="xs" c="slate.7" fw={500}>{task.stage}</Text></Table.Td>
                      <Table.Td>
                        <Badge 
                          size="sm" 
                          variant="light" 
                          color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'amber' : 'blue'}
                        >
                          {task.priority}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon variant="subtle" color="slate">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* --- ROW 3: CHANNELS & DEMOGRAPHICS --- */}
      <Grid gutter="lg">
        {/* Channel Performance */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%">
            <Text size="md" fw={700} c="slate.8" mb="lg">Sourcing Channel Performance</Text>
            <Box h={250}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="apps" name="Total Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Demographics */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper p="md" radius="md" shadow="sm" withBorder h="100%">
            <Text size="md" fw={700} c="slate.8" mb="sm">User Demographics</Text>
            <Grid gutter="md">
              {/* Age Group */}
              <Grid.Col span={6}>
                <Stack align="center" gap={0}>
                  <Text size="xs" fw={600} c="slate.5" mb="xs">AGE GROUP</Text>
                  <Box h={140} w="100%">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ageData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                          {ageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Group gap="xs" justify="center" mt="xs" wrap="wrap">
                    {ageData.map(item => (
                      <Group gap={4} key={item.name}>
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color }} />
                        <Text size="xs" c="slate.7">{item.name}</Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Grid.Col>

              {/* Gender */}
              <Grid.Col span={6}>
                <Stack align="center" gap={0}>
                  <Text size="xs" fw={600} c="slate.5" mb="xs">GENDER</Text>
                  <Box h={140} w="100%">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                          {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Group gap="xs" justify="center" mt="xs" wrap="wrap">
                    {genderData.map(item => (
                      <Group gap={4} key={item.name}>
                        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: item.color }} />
                        <Text size="xs" c="slate.7">{item.name}</Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
