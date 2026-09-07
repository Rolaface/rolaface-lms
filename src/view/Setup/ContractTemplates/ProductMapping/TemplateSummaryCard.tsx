import { Paper, Box, Text, Badge, SimpleGrid, Group } from '@mantine/core';
import { IconFileDescription } from '@tabler/icons-react';
import type { ContractTemplate } from '../../../../types/contractTemplate';

interface TemplateSummaryCardProps {
  template: ContractTemplate;
}

export function TemplateSummaryCard({ template }: TemplateSummaryCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'draft': return 'yellow';
      case 'inactive': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Paper className="p-5 border border-slate-2 rounded-lg bg-white">
      <Group mb="md">
        <Box className="p-2 rounded-md" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
          <IconFileDescription size={24} color="white" />
        </Box>
        <Text size="md" fw={700}>Template Summary</Text>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="lg">
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Template Name</Text>
          <Text size="sm" c="slate.8" fw={600}>{template.templateName}</Text>
        </Box>
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Template Type</Text>
          <Text size="sm" c="slate.8" fw={600}>{template.templateType}</Text>
        </Box>
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Version</Text>
          <Text size="sm" c="slate.8" fw={600}>{template.templateVersion || '1.0'}</Text>
        </Box>
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Status</Text>
          <Badge color={getStatusColor(template.status)} variant="light" size="sm" mt={2}>
            {template.status}
          </Badge>
        </Box>
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Effective From</Text>
          <Text size="sm" c="slate.8" fw={600}>{formatDate(template.effectiveFrom)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="slate.5" fw={500}>Effective To</Text>
          <Text size="sm" c="slate.8" fw={600}>{formatDate(template.effectiveTo)}</Text>
        </Box>
      </SimpleGrid>
    </Paper>
  );
}
