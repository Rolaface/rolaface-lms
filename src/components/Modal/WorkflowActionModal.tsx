/**
 * WorkflowActionModal — generic, backend-driven workflow action modal.
 *
 * Receives the list of allowed WorkflowActions from the backend (already
 * filtered to the current user's roles by the server). Renders whatever
 * actions the active site workflow exposes — no hardcoded status strings.
 *
 * - Single action  → pre-selected, no dropdown shown.
 * - Multiple actions → shows a Select dropdown.
 * - Comment field is always shown (optional unless action is in COMMENT_REQUIRED).
 * - Assign-to field is optional; user can leave blank for terminal actions.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Modal,
  Box,
  Stack,
  Text,
  Select,
  Textarea,
  ActionIcon,
  Loader,
  Avatar,
  Group,
  Badge,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { getUsers } from "../../api/User/userApi";
import { ModalFooter } from "../shared/ModalFooter";
import type { WorkflowAction } from "../../types/workflow";

const MODAL_ACCENT = "#7048E8";

/** Actions where the user MUST supply a comment. */
const COMMENT_REQUIRED = new Set([
  "Request Info",
  "Recommend Reject",
  "Reject",
  "Resubmit",
]);

export interface WorkflowActionModalProps {
  opened: boolean;
  applicationId: string | null;
  applicantName: string | null;
  /** All actions allowed for this user+state combination from the backend. */
  allowedActions: WorkflowAction[];
  /** Pre-select a specific action (e.g. user clicked a specific menu item). */
  preselectedAction?: string;
  currentUserEmail?: string | null;
  onClose: () => void;
  onConfirm: (payload: {
    action: string;
    comment?: string;
    assign_to_user?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function WorkflowActionModal({
  opened,
  applicationId,
  applicantName,
  allowedActions,
  preselectedAction,
  currentUserEmail,
  onClose,
  onConfirm,
  isSubmitting,
}: WorkflowActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(
    preselectedAction ?? (allowedActions.length === 1 ? allowedActions[0].action : null)
  );
  const [comment, setComment] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [assignToUser, setAssignToUser] = useState<string | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (opened) {
      const defaultAction =
        preselectedAction ?? (allowedActions.length === 1 ? allowedActions[0].action : null);
      setSelectedAction(defaultAction);
      setComment("");
      setAssignToUser(null);
      setSearch("");
    }
  }, [opened, preselectedAction, allowedActions]);

  const { data: usersResponse, isFetching } = useQuery({
    queryKey: ["workflow-assign-users", debouncedSearch],
    queryFn: () => getUsers(debouncedSearch, 1, 20),
    enabled: opened,
    placeholderData: (prev) => prev,
  });

  const users = (usersResponse?.data ?? []).filter(
    (u) => u.id !== currentUserEmail
  );
  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  const actionOptions = allowedActions.map((a) => ({
    value: a.action,
    label: a.action,
  }));

  const activeTransition = allowedActions.find((a) => a.action === selectedAction);
  const commentRequired = selectedAction ? COMMENT_REQUIRED.has(selectedAction) : false;

  const canSubmit =
    !!selectedAction &&
    (!commentRequired || comment.trim().length > 0);

  const handleSubmit = () => {
    if (!selectedAction) return;
    onConfirm({
      action: selectedAction,
      comment: comment.trim() || undefined,
      assign_to_user: assignToUser ?? undefined,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      size="md"
      radius="lg"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      styles={{
        body: { padding: 0 },
        content: { overflow: "hidden", borderTop: `4px solid ${MODAL_ACCENT}` },
      }}
    >
      <Stack gap={0}>
        {/* Header gradient */}
        <Box
          pos="relative"
          pt={44}
          pb={24}
          style={{
            background: `linear-gradient(to bottom, ${MODAL_ACCENT}4D 0%, ${MODAL_ACCENT}26 40%, ${MODAL_ACCENT}00 100%)`,
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16 }}
            aria-label="Close"
          >
            <IconX size={18} />
          </ActionIcon>

          <Box
            mx="auto"
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              clipPath: "polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0% 50%)",
              background: `${MODAL_ACCENT}33`,
              boxShadow: `0 0 32px 8px ${MODAL_ACCENT}40`,
              color: MODAL_ACCENT,
            }}
          >
            <IconArrowRight size={32} />
          </Box>
        </Box>

        <Stack align="center" gap="md" px="xl" pb="xl">
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">
              Workflow Action
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              <Text span fw={600} c="dark">
                {applicantName || applicationId}
              </Text>
              {applicantName && (
                <>
                  {" "}
                  (
                  <Text span fw={500} c="dimmed">
                    {applicationId}
                  </Text>
                  )
                </>
              )}
            </Text>
          </Stack>

          {/* Next state preview */}
          {activeTransition && (
            <Group gap="xs" justify="center">
              <Text fz="xs" c="dimmed">Next state:</Text>
              <Badge variant="light" color="violet" radius="xl" size="sm">
                {activeTransition.next_state}
              </Badge>
            </Group>
          )}

          {/* Action selector — only shown when multiple actions available */}
          {allowedActions.length > 1 && (
            <Select
              w="100%"
              radius="md"
              label="Action"
              placeholder="Select an action"
              data={actionOptions}
              value={selectedAction}
              onChange={setSelectedAction}
              required
            />
          )}

          {/* Assign to user — optional; useful for non-terminal hand-offs */}
          <Select
            w="100%"
            radius="md"
            label="Assign To (optional)"
            placeholder="Search by name or email"
            searchable
            clearable
            value={assignToUser}
            onChange={setAssignToUser}
            onSearchChange={setSearch}
            searchValue={search}
            data={userOptions}
            nothingFoundMessage={isFetching ? "Searching..." : "No users found"}
            rightSection={isFetching ? <Loader size={14} /> : undefined}
            renderOption={({ option }) => {
              const user = users.find((u) => u.id === option.value);
              return (
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" size="sm" color="violet">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>
                  <Box>
                    <Text fz="sm" fw={600}>
                      {user?.name}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      {user?.email}
                    </Text>
                  </Box>
                </Group>
              );
            }}
          />

          <Textarea
            w="100%"
            radius="md"
            label={
              commentRequired ? "Comment (required)" : "Comment (optional)"
            }
            placeholder={
              commentRequired
                ? "A comment is required for this action"
                : "Add any notes for the next handler"
            }
            autosize
            minRows={3}
            maxRows={6}
            required={commentRequired}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />

          <Box mt="md" mx="-lg" mb="-lg" w="calc(100% + 48px)">
            <ModalFooter
              variant="theme"
              onClose={onClose}
              submitLabel={selectedAction ?? "Submit"}
              submitDisabled={!canSubmit}
              submitLoading={isSubmitting}
              onSubmit={handleSubmit}
            />
          </Box>
        </Stack>
      </Stack>
    </Modal>
  );
}
