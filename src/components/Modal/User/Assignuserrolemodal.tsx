import { useEffect } from "react";
import { Modal, TextInput, Group, Stack, Text, Checkbox, Chip, Paper, Box, ActionIcon } from "@mantine/core";
import { IconShieldCheck, IconMinus, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRoleFormData } from "../../../types/User/userRole";
import { useUserRoleLogic, PERMISSION_KEYS } from "../../../hooks/user/useUserRole";
import { LMS_MODULES } from "../../../types/User/userRole";
import type { LmsModule } from "../../../types/User/userRole";
import { createUserRoles, updateUserRoles } from "../../../api/User/roleApi";
import { ModalFooter } from "../../../components/shared/ModalFooter";
import { openCommonModal } from "../../../components/Modal/AlertModal";

const ACTION_LABELS: Record<string, string> = {
  read: "Read",
  write: "Write",
  create: "Create",
  delete: "Delete",
  import: "Import",
  export: "Export",
  report: "Report",
  submit: "Submit",
  cancel: "Cancel",
  email: "Email",
};

interface AssignUserRoleModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  editId?: string | null;
  isView?: boolean;
  initialData?: UserRoleFormData | null;
}

export function AssignUserRoleModal({ opened, onClose, onMinimize, editId, isView, initialData }: AssignUserRoleModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editId && !isView;

  const {
    form,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    handleReset,
    toggleAction,
    toggleModuleLevel,
    clearModulePermissions,
    getPermissionActions,
  } = useUserRoleLogic({
    initialData,
    onSubmit: async (data) => {
      const res = isEdit
        ? await updateUserRoles(editId as string, data)
        : await createUserRoles(data);

      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
        handleReset();
    onClose();

      // backend-driven success message; falls back only if backend sends null
      openCommonModal({
        heading: "Success",
        body:
          res.message.message ||
          (isEdit ? "Role updated successfully." : "Role created successfully."),
        color: "success",
        buttons: [{ label: "OK" }],
      });
    },
  });

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      size={900}
      radius="lg"
      padding={0}
      centered
      shadow="xl"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <Box
        px="xl"
        py="md"
        style={{
          background: "var(--mantine-color-brand-6)",
          borderBottom: "1px solid var(--mantine-color-brand-7)",
          borderTopLeftRadius: "var(--mantine-radius-lg)",
          borderTopRightRadius: "var(--mantine-radius-lg)",
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "var(--mantine-shadow-sm)",
              }}
            >
              <IconShieldCheck size={18} stroke={2} color="var(--mantine-color-brand-6)" />
            </Box>
            <Text fw={700} size="md" c="white">
              {isView ? "View Role" : isEdit ? "Edit Role" : "Add Role"}
            </Text>
          </Group>

            <Group gap={4} wrap="nowrap">
           <ActionIcon variant="subtle" radius="md" onClick={onMinimize} style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: "color-mix(in srgb, var(--mantine-color-white) 15%, transparent)" } } }}>
              <IconMinus size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" radius="md" onClick={handleClose} style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: "color-mix(in srgb, var(--mantine-color-white) 15%, transparent)" } } }}>
              <IconX size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* ── Body ───────────────────────────────────────────── */}
        <Box px="xl" py="lg" style={{ maxHeight: "70vh", overflowY: "auto", background: "var(--mantine-color-slate-0)" }}>
        <Stack gap="md">
          <TextInput
            label="Role Name"
            required
            disabled={isEdit || isView}
            value={form.role}
            onChange={(e) => handleFieldChange("role", e.currentTarget.value)}
            error={errors.role}
            placeholder="e.g. Loan Officer, Branch Manager"
            style={{ maxWidth: 340 }}
          />

          {errors.permission && (
            <Text size="xs" c="danger.6">
              {errors.permission}
            </Text>
          )}

          <Stack gap="sm">
            {LMS_MODULES.map((module: LmsModule) => {
              const entry = getPermissionActions(module);
              const activeCount = entry
                ? PERMISSION_KEYS.filter((k) => entry[k] === 1).length
                : 0;
              const allSelected = activeCount === PERMISSION_KEYS.length;

              return (
                <Paper
                  key={module}
                  radius="md"
                  p="md"
                  shadow="xs"
                  style={{
                    border: `1px solid ${activeCount > 0
                      ? "var(--mantine-color-brand-3)"
                      : "var(--mantine-color-slate-2)"
                      }`,
                    background:
                      activeCount > 0
                        ? "color-mix(in srgb, var(--mantine-color-brand-5) 4%, var(--mantine-color-white))"
                        : "var(--mantine-color-white)",
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" mb="sm">
                    <Checkbox
                      label={
                        <Group gap={6} wrap="nowrap">
                          <Text fw={600} size="sm" c="slate.8">
                            {module}
                          </Text>
                          {activeCount > 0 && (
                            <Text size="xs" c="brand.6" fw={700}>
                              {activeCount}/{PERMISSION_KEYS.length}
                            </Text>
                          )}
                        </Group>
                      }
                      checked={allSelected}
                      indeterminate={activeCount > 0 && !allSelected}
                      disabled={isView}
                      onChange={() => toggleModuleLevel(module, !allSelected)}
                    />
                    {activeCount > 0 && !isView && (
                      <Text
                        component="button"
                        type="button"
                        size="xs"
                        fw={600}
                        c="danger.6"
                        onClick={() => clearModulePermissions(module)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Clear
                      </Text>
                    )}
                  </Group>

                  <Group gap={6} wrap="nowrap" mt="sm" style={{ overflowX: "auto", paddingBottom: 2 }}>
                    {PERMISSION_KEYS.map((key) => (
                      <Chip
                        key={key}
                        size="xs"
                        radius="sm"
                        checked={entry ? entry[key] === 1 : false}
                        disabled={isView}
                        onChange={() => toggleAction(module, key)}
                        styles={{ label: { whiteSpace: "nowrap" } }}
                      >
                        {ACTION_LABELS[key]}
                      </Chip>
                    ))}
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      </Box>

      {/* ── Footer ─────────────────────────────────────────── */}
      {!isView && (
        <ModalFooter
          variant="theme"
          onClose={handleClose}
          submitLabel={isEdit ? "Update" : "Submit"}
          submitLoading={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
      {isView && (
        <ModalFooter
          variant="theme"
          isViewMode
          onClose={handleClose}
          submitLabel=""
        />
      )}
    </Modal>
  );
}