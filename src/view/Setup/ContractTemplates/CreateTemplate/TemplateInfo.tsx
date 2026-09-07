import React from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Select,
  Textarea,
  TextInput,
  Divider,
} from '@mantine/core';

interface TemplateInfoProps {
  onNext: () => void;
  onCancel: () => void;
}

export const TemplateInfo: React.FC<TemplateInfoProps> = ({
  onNext,
  onCancel,
}) => {
  return (
    <Box className="flex flex-col bg-white">
      <Box className="p-4">
        <Box maw={650}>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Template Type"
                placeholder="Select template type"
                data={['Loan Agreement', 'Sanction Letter', 'Hypothecation Agreement', 'NDA', 'Other']}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Template Name"
                placeholder="Enter template name"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                type="date"
                label="Effective From"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                type="date"
                label="Effective To"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Comment"
                placeholder="Enter comment"
                minRows={2}
              />
            </Grid.Col>
          </Grid>
        </Box>
      </Box>

      <Divider color="slate.2" />

      <Group justify="space-between" className="p-4" px={32}>
        <Button variant="default" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Group>
          <Button variant="default" size="md">Save as Draft</Button>
          <Button color="brand" size="md" onClick={onNext} rightSection={<span dangerouslySetInnerHTML={{ __html: '&rarr;' }} />}>
            Next: Upload Template
          </Button>
        </Group>
      </Group>
    </Box>
  );
};
