import { Card, Grid, Select, Stack, Text, TextInput, Title } from "@mantine/core";

import { CATEGORY_OPTIONS, PRODUCT_LINE_OPTIONS, SOURCE_OPTIONS, SUBCATEGORY_OPTIONS, type RuleSetDetails } from "./shared";

interface RuleDetailsTabProps {
  details: RuleSetDetails;
  onChange: (patch: Partial<RuleSetDetails>) => void;
}

export function RuleDetailsTab({ details, onChange }: RuleDetailsTabProps) {
  return (
    <Card withBorder radius="md" p="lg">
      <Title order={4} c="slate.8" fw={600}>
        Rule details
      </Title>
      <Text fz="xs" c="slate.5" mt={4}>
        Identify this rule and the data it evaluates before defining conditions in the Rule groups tab.
      </Text>

      <Stack gap="md" mt="lg">
        <TextInput
          label="Rule name"
          placeholder="e.g., Auto Loan Product Assignment"
          value={details.ruleName}
          onChange={(e) => onChange({ ruleName: e.currentTarget.value })}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Source"
              data={SOURCE_OPTIONS}
              value={details.source}
              onChange={(v) => v && onChange({ source: v })}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Category"
              data={CATEGORY_OPTIONS}
              value={details.category}
              onChange={(v) => v && onChange({ category: v })}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Subcategory"
              data={SUBCATEGORY_OPTIONS}
              value={details.subcategory}
              onChange={(v) => v && onChange({ subcategory: v })}
              allowDeselect={false}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Product line"
              data={PRODUCT_LINE_OPTIONS}
              value={details.productLine}
              onChange={(v) => v && onChange({ productLine: v })}
              allowDeselect={false}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}

export default RuleDetailsTab;