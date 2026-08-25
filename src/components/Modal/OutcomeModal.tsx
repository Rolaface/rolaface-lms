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
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconGavel, IconX } from "@tabler/icons-react";
import { getUsers } from "../../api/User/userApi";
import { ModalFooter } from "../shared/ModalFooter";

const hex = "#E8590C";  

const ACTION_OPTIONS = [
  { value: "Recommend Reject", label: "Recommend Reject" },
  // { value: "Resubmit", label: "Resubmit" },
  { value: "Request Info", label: "Request Info" },
  { value: "Ready for Approval", label: "Ready for Approval" },
];

interface OutcomeModalProps {
  opened: boolean;
  applicationId: string | null;
  applicantName: string | null;
  currentUserEmail?: string | null;
  onClose: () => void;
  onConfirm: (payload: {
    action: string;
    assign_to_user: string;
    comment: string;
  }) => void;
  isSubmitting?: boolean;
}

export function OutcomeModal({
  opened,
  applicationId,
  applicantName,
  currentUserEmail,
  onClose,
  onConfirm,
  isSubmitting,
}: OutcomeModalProps) {
  const [action, setAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const { data: usersResponse, isFetching } = useQuery({
    queryKey: ["outcome-users", debouncedSearch],
    queryFn: () => getUsers(debouncedSearch, 1, 20),
    enabled: opened,
    placeholderData: (prev) => prev,
  });

  const users = (usersResponse?.data ?? []).filter(
    (u) => u.id !== currentUserEmail, // don't let the assignee re-assign to themselves
  );
  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  useEffect(() => {
    if (!opened) {
      setAction(null);
      setSelectedUser(null);
      setComment("");
      setSearch("");
    }
  }, [opened]);

  const handleSubmit = () => {
    if (!action || !selectedUser) return;
    onConfirm({ action, assign_to_user: selectedUser, comment });
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
        content: { overflow: "hidden", borderTop: `4px solid ${hex}` },
      }}
    >
      <Stack gap={0}>
        <Box
          pos="relative"
          pt={44}
          pb={24}
          style={{
            background: `linear-gradient(to bottom, ${hex}4D 0%, ${hex}26 40%, ${hex}00 100%)`,
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
              clipPath:
                "polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0% 50%)",
              background: `${hex}33`,
              boxShadow: `0 0 32px 8px ${hex}40`,
              color: hex,
            }}
          >
            <IconGavel size={32} />
          </Box>
        </Box>

        <Stack align="center" gap="md" px="xl" pb="xl">
          <Stack gap={4} align="center">
            <Text fw={700} size="xl" ta="center">
              Record Review Outcome
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Decide the next step for{" "}
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

          <Select
            w="100%"
            radius="md"
            label="Action"
            placeholder="Select an outcome"
            data={ACTION_OPTIONS}
            value={action}
            onChange={setAction}
            required
          />

          <Select
            w="100%"
            radius="md"
            label="Assign To"
            placeholder="Search by name or email"
            searchable
            required
            value={selectedUser}
            onChange={setSelectedUser}
            onSearchChange={setSearch}
            searchValue={search}
            data={userOptions}
            nothingFoundMessage={isFetching ? "Searching..." : "No users found"}
            rightSection={isFetching ? <Loader size={14} /> : undefined}
            renderOption={({ option }) => {
              const user = users.find((u) => u.id === option.value);
              return (
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" size="sm" color="orange">
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
            label="Comment"
            placeholder="Add notes explaining this outcome (optional)"
            autosize
            minRows={3}
            maxRows={6}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />

          <Box mt="md" mx="-lg" mb="-lg" w="calc(100% + 48px)">
            <ModalFooter
              variant="theme"
              onClose={onClose}
              submitLabel="Submit Outcome"
              submitDisabled={!action || !selectedUser}
              submitLoading={isSubmitting}
              onSubmit={handleSubmit}
            />
          </Box>
        </Stack>
      </Stack>
    </Modal>
  );
}