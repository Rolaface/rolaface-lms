import { Box, Paper, Text, Title, SimpleGrid } from '@mantine/core';
import { IconLayoutDashboard, IconUsers, IconCash, IconFileText } from '@tabler/icons-react';

export function Dashboard() {
  const stats = [
    { title: 'Total Loans', value: '1,204', icon: IconFileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Customers', value: '842', icon: IconUsers, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Disbursed', value: '$4.2M', icon: IconCash, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Pending Applications', value: '38', icon: IconLayoutDashboard, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <Box className="p-8 mx-auto w-full">
      <div className="mb-8">
        <Title order={2} className="text-gray-900">Dashboard</Title>
        <Text c="dimmed" mt="xs">Welcome back to LendFlow LMS. Here is your overview.</Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {stats.map((stat) => (
          <Paper key={stat.title} withBorder p="md" radius="md" className="shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <Text size="xs" c="dimmed" className="uppercase font-semibold tracking-wider">
                  {stat.title}
                </Text>
                <Text fw={700} size="xl" className="text-gray-900 mt-1">
                  {stat.value}
                </Text>
              </div>
            </div>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="xl" radius="md" mt="xl" className="shadow-sm flex items-center justify-center bg-white">
        <div className="text-center">
          <IconLayoutDashboard size={48} className="mx-auto text-gray-300 mb-4" />
          <Text fw={600} className="text-gray-600 text-lg">Charts and Analytics will appear here</Text>
        </div>
      </Paper>
    </Box>
  );
}