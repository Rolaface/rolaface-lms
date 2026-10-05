import React, { useEffect } from "react";
import { useForm } from "@mantine/form";
import {
  Modal,
  TextInput,
  Select,
  Box,
  Group,
  ThemeIcon,
  Text,
  Button,
  Grid,
  useMantineTheme,
  Loader,
  Center,
} from "@mantine/core";
import { IconBuildingStore, IconMinus, IconX } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSourceById,
  createSource,
  updateSource,
  enableSource,
  disableSource,
} from "../../api/LosConfiguration/sourceApi";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { ModalFooter } from "../shared/ModalFooter";

interface SourceModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId: string | null;
  isView: boolean;
}

export function SourceModal({ opened, onClose, onMinimize, editId, isView }: SourceModalProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      channel_name: "",
      is_active: "1",
    },
    validate: {
      channel_name: (value) =>
        value.trim().length > 0 ? null : "Source name is required",
      is_active: (value) => (value ? null : "Status is required"),
    },
  });

  const { data: sourceData, isLoading: isLoadingSource } = useQuery({
    queryKey: ["source", editId],
    queryFn: () => getSourceById(editId!),
    enabled: !!editId && opened,
  });

  const [loadedId, setLoadedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (sourceData && editId && loadedId !== editId) {
      form.setValues({
        channel_name: sourceData.channel_name || "",
        is_active: Number(sourceData.is_active) === 1 ? "1" : "0",
      });
      setLoadedId(editId);
    }
  }, [sourceData, editId, loadedId, form]);

  useEffect(() => {
    if (!opened) {
      form.reset();
      setLoadedId(null);
    }
  }, [opened, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize();
  };

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const newStatus = parseInt(values.is_active, 10);
      const payload = {
        channel_name: values.channel_name.trim(),
        is_active: newStatus,
      };

      if (editId) {
        // The update_channel endpoint only expects channel_name
        const updatePayload = { channel_name: values.channel_name.trim() };
        await updateSource(editId, updatePayload);
        
        // If the name changed, the backend changes the ID to the new name.
        const newId = values.channel_name.trim();

        // Update status if it changed, using the new ID!
        if (sourceData && Number(sourceData.is_active) !== newStatus) {
          if (newStatus === 1) await enableSource(newId);
          else await disableSource(newId);
        }
      } else {
        await createSource(payload);
      }
    },
    onSuccess: () => {
      openCommonModal({
        heading: "Success",
        subtitle: "",
        body: editId ? "Source updated successfully" : "Source created successfully",
        color: "green",
        buttons: [
          {
            label: "Close",
            color: "green",
            variant: "filled",
            onClick: () => handleClose(),
          },
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Error",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error) || "Failed to save source",
        color: "red",
        buttons: [{ label: "Close", color: "red", variant: "filled" }],
      });
    },
  });

  const handleSubmit = () => {
    const { hasErrors } = form.validate();
    if (!hasErrors) {
      mutation.mutate(form.values);
    }
  };

  const headerTitle = isView ? "View Source" : editId ? "Update Source" : "Add Source";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={720}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
        },
      }}
    >
      <Box style={{ display: "flex", flexDirection: "column" }} bg="white">
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: "var(--mantine-color-white)",
              }}
            >
              <IconBuildingStore size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {headerTitle}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Source configuration details
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleMinimize}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        <Box p="lg" style={{ overflowY: "auto", flex: 1 }}>
          {editId && isLoadingSource ? (
            <Center py="xl">
              <Loader color="brand" />
            </Center>
          ) : (
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Source Name"
                  placeholder="Enter source name"
                  withAsterisk
                  required={!isView}
                  readOnly={isView}
                  variant={isView ? "filled" : "default"}
                  {...form.getInputProps("channel_name")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Status"
                  placeholder="Select status"
                  withAsterisk
                  required={!isView}
                  readOnly={isView}
                  variant={isView ? "filled" : "default"}
                  allowDeselect={false}
                  data={[
                    { label: "Active", value: "1" },
                    { label: "Inactive", value: "0" },
                  ]}
                  {...form.getInputProps("is_active")}
                />
              </Grid.Col>
            </Grid>
          )}
        </Box>

        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitLabel={editId ? "Update" : "Save"}
          submitLoading={mutation.isPending}
          submitDisabled={mutation.isPending}
        />
      </Box>
    </Modal>
  );
}
