import {
  TextInput,
  Textarea,
  Select,
  Text,
  Group,
  Badge,
  ActionIcon,
  Stack,
  Button,
  Box,
} from "@mantine/core";
import { IconX, IconPlus, IconTag, IconTrash } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { SUGGESTED_TAGS } from "../../../constants/customer/constants";
import type { CustomField } from "../../../../types/customer/types";

interface TagsStepProps {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  relationshipNotes: string;
  setRelationshipNotes: (v: string) => void;
  customFields: CustomField[];
  addCustomField: () => void;
  removeCustomField: (id: string) => void;
  updateCustomField: (id: string, patch: Partial<CustomField>) => void;
}

export function TagsStep(props: TagsStepProps) {
  const {
    tags, tagInput, setTagInput, addTag, removeTag, relationshipNotes, setRelationshipNotes,
    customFields, addCustomField, removeCustomField, updateCustomField,
  } = props;

  return (
    <PlainCard>
      <SectionHeader icon={IconTag} title="Tags, notes & custom fields" badge="OPTIONAL" description="Segment this customer and capture anything Meridian doesn't have a field for yet" />

      <Text size="xs" fw={700} c="slate.8" mb="xs">Tags</Text>
      <Group gap="xs" mb="xs">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="light"
            color="brand"
            radius="xl"
            size="md"
            rightSection={<IconX size={10} style={{ cursor: "pointer" }} onClick={() => removeTag(tag)} />}
          >
            {tag}
          </Badge>
        ))}
      </Group>


      <Box maw={400}>
        <TextInput
          size="xs"
          radius="md"
          placeholder="Type and press Enter to add a tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
        />
      </Box>

      <Group gap="xs" mt="xs">
        {SUGGESTED_TAGS.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            color="slate"
            radius="xl"
            size="md"
            style={{ cursor: "pointer", fontWeight: 500 }}
            leftSection={<IconPlus size={10} />}
            onClick={() => addTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </Group>

      <Textarea
        mt="sm"
        size="xs"
        radius="md"
        label="Relationship Notes"
        placeholder="Internal remarks visible to staff only"
        minRows={2}
        value={relationshipNotes}
        onChange={(e) => setRelationshipNotes(e.currentTarget.value)}
      />

      <Group justify="space-between" mt="md" mb="xs">
        <Text size="xs" fw={700} c="slate.8">Custom Fields</Text>
        <Text size="10px" c="slate.5">— define your own, no redesign needed</Text>
      </Group>
      <Stack gap="xs">
        {customFields.map((field) => (
          <Group key={field.id} gap="xs" align="center" wrap="nowrap">
            <TextInput
              style={{ flex: 1 }}
              size="xs"
              radius="md"
              placeholder="Field label"
              value={field.label}
              onChange={(e) => updateCustomField(field.id, { label: e.currentTarget.value })}
            />
            <TextInput
              style={{ flex: 1 }}
              size="xs"
              radius="md"
              placeholder="Value"
              value={field.value}
              onChange={(e) => updateCustomField(field.id, { value: e.currentTarget.value })}
            />
            <Select
              w={110}
              size="xs"
              radius="md"
              data={["Text", "Number", "Date"]}
              value={field.type}
              onChange={(v) => updateCustomField(field.id, { type: v ?? "Text" })}
            />
            <ActionIcon color="danger" variant="subtle" radius="md" onClick={() => removeCustomField(field.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          variant="subtle"
          color="brand"
          radius="md"
          leftSection={<IconPlus size={14} />}
          onClick={addCustomField}
          style={{ border: "1px dashed var(--mantine-color-brand-1)" }}
        >
          Add Custom Field
        </Button>
      </Stack>
    </PlainCard>
  );
}