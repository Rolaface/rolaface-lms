import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Group,
  Text,
  Paper,
  Select,
  ActionIcon,
  Title,
  Center,
  Loader,
  Badge,
  Table,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash, IconArrowRight, IconHelpCircle, IconGitMerge, IconGripVertical, IconCircleFilled } from "@tabler/icons-react";
import { getWorkflow, saveWorkflow, getWorkflowStates, getWorkflowActionMasters, getRoles } from "../../api/workflowApi";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { WorkflowPreviewModal } from "./WorkflowPreviewModal";
import { CreatableSelect } from "../../components/CreatableSelect";

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
  );
}

const getDeterministicColor = (str: string) => {
  if (!str) return "slate";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["brand", "indigo", "cyan", "teal", "success", "warning", "grape", "pink", "violet", "orange"];
  return colors[Math.abs(hash) % colors.length];
};

interface LocalState {
  id: string;
  state: string;
  doc_status: string;
  allow_edit: string;
  message: string;
}

interface LocalTransition {
  id: string;
  from_state: string;
  action: string;
  to_state: string;
  allowed: string;
}

export function WorkflowConfiguration() {
  const queryClient = useQueryClient();
  const [states, setStates] = useState<LocalState[]>([]);
  const [transitions, setTransitions] = useState<LocalTransition[]>([]);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [draggedStateIndex, setDraggedStateIndex] = useState<number | null>(null);
  const [draggedTransitionIndex, setDraggedTransitionIndex] = useState<number | null>(null);

  const doctype = "Custom Loan Application";
  const workflowName = "Custom Loan Application Workflow";

  const { data: dbStates = [] } = useQuery({ queryKey: ["workflow-states"], queryFn: getWorkflowStates });
  const { data: dbActions = [] } = useQuery({ queryKey: ["workflow-actions"], queryFn: getWorkflowActionMasters });
  const { data: dbRoles = ["All"] } = useQuery({ queryKey: ["roles"], queryFn: getRoles });

  const roleOptions = [
    { value: "All", label: "All" },
    ...dbRoles.filter((r: string) => r !== "All").map((r: string) => ({ value: r, label: r }))
  ];

  const docStatusOptions = [
    { value: "0", label: "In progress" },
    { value: "1", label: "Final" },
  ];

  const { data: workflowData, isLoading } = useQuery({
    queryKey: ["workflow-configuration", doctype],
    queryFn: () => getWorkflow(doctype),
  });

  useEffect(() => {
    if (workflowData) {
      setStates(
        workflowData.states.map((s: any) => ({
          id: uuidv4(),
          state: s.state,
          doc_status: s.doc_status,
          allow_edit: s.allow_edit,
          message: s.message || "",
        }))
      );
      setTransitions(
        workflowData.transitions.map((t: any) => ({
          id: uuidv4(),
          from_state: t.from_state,
          action: t.action,
          to_state: t.to_state,
          allowed: t.allowed,
        }))
      );
      setHasUnsavedChanges(false);
    }
  }, [workflowData]);

  const markDirty = () => setHasUnsavedChanges(true);

  const addState = () => {
    setStates((prev) => [
      ...prev,
      { id: uuidv4(), state: "", doc_status: "0", allow_edit: "All", message: "" }
    ]);
    markDirty();
  };

  const updateState = (id: string, field: keyof LocalState, value: string) => {
    setStates((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (field === "state") {
            const oldName = s.state;
            if (oldName) {
              setTransitions((tr) =>
                tr.map((t) => ({
                  ...t,
                  from_state: t.from_state === oldName ? value : t.from_state,
                  to_state: t.to_state === oldName ? value : t.to_state,
                }))
              );
            }
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );
    markDirty();
  };

  const removeState = (id: string) => {
    setStates((prev) => prev.filter((s) => s.id !== id));
    markDirty();
  };

  const addTransition = () => {
    setTransitions((prev) => [...prev, { id: uuidv4(), from_state: "", action: "", to_state: "", allowed: "All" }]);
    markDirty();
  };

  const updateTransition = (id: string, field: keyof LocalTransition, value: string) => {
    setTransitions((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    markDirty();
  };

  const removeTransition = (id: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== id));
    markDirty();
  };

  const saveMutation = useMutation({
    mutationFn: saveWorkflow,
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["workflow-configuration", doctype] });
      queryClient.invalidateQueries({ queryKey: ["workflow-states"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-actions"] });
      openCommonModal({
        heading: "Saved successfully",
        subtitle: "",
        body: "Workflow configuration updated.",
        color: "success",
        buttons: [{ label: "Close", color: "success" }],
      });
    },
    onError: (err: any) => {
      openCommonModal({
        heading: "Save Failed",
        subtitle: "",
        body: err.message || "An error occurred while saving.",
        color: "danger",
        buttons: [{ label: "Close", color: "danger" }],
      });
    },
  });

  const handleSave = () => {
    if (states.some((s) => !s.state.trim())) {
      openCommonModal({
        heading: "Validation Error",
        subtitle: "",
        body: "All states must have a name.",
        color: "warning",
        buttons: [{ label: "Close", color: "warning" }],
      });
      return;
    }

    saveMutation.mutate({
      doctype,
      workflow_name: workflowName,
      states: states.map((s) => ({ state: s.state, doc_status: s.doc_status, allow_edit: s.allow_edit, message: s.message })),
      transitions: transitions.map((t) => ({ from_state: t.from_state, action: t.action, to_state: t.to_state, allowed: t.allowed })),
      is_active: 1,
    });
  };

  const uniqueStateNames = Array.from(new Set([...dbStates, ...states.map((s) => s.state).filter((s) => s.trim() !== "")]));
  const uniqueActions = Array.from(new Set([...dbActions, ...transitions.map((t) => t.action).filter((a) => a.trim() !== "")]));

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  return (
    <Box p="lg" bg="var(--mantine-color-slate-0)" style={{ minHeight: "100vh" }}>
      <Group justify="space-between" align="flex-start" mb="xl">
        <Group align="flex-start" gap="md">
          <Box style={{ width: 42, height: 42, borderRadius: 10, background: "var(--mantine-color-brand-6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--mantine-shadow-sm)" }}>
            <IconGitMerge size={24} color="white" />
          </Box>
          <Box>
            <Title order={3} style={{ color: "var(--mantine-color-slate-9)", fontWeight: 700, letterSpacing: "-0.5px" }}>
              {doctype} Workflow
            </Title>
            <Text fz="sm" c="slate.5" mt={2}>
              Manage workflow states, documents statuses, and transition rules
            </Text>
          </Box>
        </Group>

        <Group gap="sm">
          {hasUnsavedChanges && (
            <Badge color="warning" variant="light" size="sm" radius="sm" style={{ textTransform: "none" }}>
              Unsaved changes
            </Badge>
          )}
          <Button size="sm" variant="default" onClick={() => setPreviewOpened(true)} style={{ borderColor: "var(--mantine-color-slate-3)", color: "var(--mantine-color-slate-7)" }}>
            Preview Diagram
          </Button>
          <Button size="sm" color="brand" onClick={handleSave} loading={saveMutation.isPending}>
            Save Workflow
          </Button>
        </Group>
      </Group>

      <Paper radius="md" p="xs" shadow="sm" mb="sm" style={{ border: "1px solid var(--mantine-color-slate-3)" }}>
        <Group justify="space-between" align="center" mb="xs">
          <Group align="center" gap="xs">
            <IconGitMerge size={18} color="var(--mantine-color-slate-6)" />
            <Text fw={600} size="sm">Workflow states</Text>
          </Group>
          <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} onClick={addState}>Add state</Button>
        </Group>

        <Box style={{ overflowX: "auto" }}>
          <Table verticalSpacing="xs" horizontalSpacing="sm">
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th w={50}><Text fz="xs" fw={600} c="dimmed">NO.</Text></Table.Th>
                <Table.Th w="25%"><Text fz="xs" fw={600} c="dimmed">STATE NAME</Text></Table.Th>
                <Table.Th w="15%"><Text fz="xs" fw={600} c="dimmed">DOCUMENT STATUS</Text></Table.Th>
                <Table.Th w="20%"><Text fz="xs" fw={600} c="dimmed">WHO CAN EDIT</Text></Table.Th>
                <Table.Th w="35%"><Text fz="xs" fw={600} c="dimmed">MESSAGE</Text></Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {states.map((s, idx) => (
                <Table.Tr 
                  key={s.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedStateIndex(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedStateIndex === null || draggedStateIndex === idx) return;
                    const newStates = [...states];
                    const [moved] = newStates.splice(draggedStateIndex, 1);
                    newStates.splice(idx, 0, moved);
                    setStates(newStates);
                    setDraggedStateIndex(null);
                    markDirty();
                  }}
                  onDragEnd={() => setDraggedStateIndex(null)}
                  style={{
                    backgroundColor: draggedStateIndex === idx ? "var(--mantine-color-slate-1)" : "inherit",
                    opacity: draggedStateIndex === idx ? 0.5 : 1,
                  }}
                >
                  <Table.Td>
                    <Group gap={4} align="center" wrap="nowrap">
                      <IconGripVertical size={14} color="var(--mantine-color-slate-4)" style={{ cursor: 'grab' }} />
                      <Text fz="xs" c="dimmed">{idx + 1}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <CreatableSelect
                      data={uniqueStateNames}
                      value={s.state}
                      onChange={(val) => updateState(s.id, "state", val)}
                      placeholder="Type state name"
                      width="100%"
                      leftSection={s.state ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(s.state)}-5)`} /> : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={docStatusOptions}
                      value={s.doc_status}
                      onChange={(v) => updateState(s.id, "doc_status", v || "0")}
                      renderOption={({ option }) => <Badge color={option.value === "0" ? "warning" : "success"} variant="light" size="xs">{option.label}</Badge>}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select 
                      size="xs"
                      data={roleOptions} 
                      value={s.allow_edit} 
                      onChange={(v) => updateState(s.id, "allow_edit", v || "All")} 
                      searchable 
                      leftSection={s.allow_edit ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(s.allow_edit)}-5)`} /> : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      value={s.message}
                      onChange={(e) => updateState(s.id, "message", e.currentTarget.value)}
                      placeholder="Optional alert message"
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="danger" variant="subtle" onClick={() => removeState(s.id)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {states.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} align="center">
                    <Text p="xs" c="dimmed" fz="xs">No states defined.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      <Paper radius="md" p="xs" shadow="sm" mb="sm" style={{ border: "1px solid var(--mantine-color-slate-3)" }}>
        <Group justify="space-between" align="center" mb="xs">
          <Group align="center" gap="xs">
            <IconArrowRight size={18} color="var(--mantine-color-slate-6)" />
            <Text fw={600} size="sm">Transition rules</Text>
          </Group>
          <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} onClick={addTransition}>Add rule</Button>
        </Group>

        <Box style={{ overflowX: "auto" }}>
          <Table verticalSpacing="xs" horizontalSpacing="sm">
            <Table.Thead bg="slate.0">
              <Table.Tr>
                <Table.Th w={50}><Text fz="xs" fw={600} c="dimmed">NO.</Text></Table.Th>
                <Table.Th w="25%"><Text fz="xs" fw={600} c="dimmed">FROM STATE</Text></Table.Th>
                <Table.Th w="25%"><Text fz="xs" fw={600} c="dimmed">ACTION</Text></Table.Th>
                <Table.Th w="25%"><Text fz="xs" fw={600} c="dimmed">TO STATE</Text></Table.Th>
                <Table.Th w="25%"><Text fz="xs" fw={600} c="dimmed">WHO CAN EXECUTE</Text></Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transitions.map((t, idx) => (
                <Table.Tr 
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedTransitionIndex(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedTransitionIndex === null || draggedTransitionIndex === idx) return;
                    const newTransitions = [...transitions];
                    const [moved] = newTransitions.splice(draggedTransitionIndex, 1);
                    newTransitions.splice(idx, 0, moved);
                    setTransitions(newTransitions);
                    setDraggedTransitionIndex(null);
                    markDirty();
                  }}
                  onDragEnd={() => setDraggedTransitionIndex(null)}
                  style={{
                    backgroundColor: draggedTransitionIndex === idx ? "var(--mantine-color-slate-1)" : "inherit",
                    opacity: draggedTransitionIndex === idx ? 0.5 : 1,
                  }}
                >
                  <Table.Td>
                    <Group gap={4} align="center" wrap="nowrap">
                      <IconGripVertical size={14} color="var(--mantine-color-slate-4)" style={{ cursor: 'grab' }} />
                      <Text fz="xs" c="dimmed">{idx + 1}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <CreatableSelect
                      data={uniqueStateNames}
                      value={t.from_state}
                      onChange={(val) => updateTransition(t.id, "from_state", val)}
                      placeholder="Select state"
                      leftSection={t.from_state ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(t.from_state)}-5)`} /> : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <IconArrowRight size={12} color="var(--mantine-color-slate-4)" style={{ flexShrink: 0 }} />
                      <CreatableSelect
                        data={uniqueActions}
                        value={t.action}
                        onChange={(val) => updateTransition(t.id, "action", val)}
                        placeholder="Type action"
                        width="100%"
                        leftSection={t.action ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(t.action)}-5)`} /> : undefined}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <CreatableSelect
                      data={uniqueStateNames}
                      value={t.to_state}
                      onChange={(val) => updateTransition(t.id, "to_state", val)}
                      placeholder="Select state"
                      leftSection={t.to_state ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(t.to_state)}-5)`} /> : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select 
                      size="xs"
                      data={roleOptions} 
                      value={t.allowed} 
                      onChange={(v) => updateTransition(t.id, "allowed", v || "All")} 
                      searchable 
                      leftSection={t.allowed ? <IconCircleFilled size={10} color={`var(--mantine-color-${getDeterministicColor(t.allowed)}-5)`} /> : undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="danger" variant="subtle" onClick={() => removeTransition(t.id)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {transitions.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} align="center">
                    <Text p="xs" c="dimmed" fz="xs">No transitions defined.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      <WorkflowPreviewModal opened={previewOpened} onClose={() => setPreviewOpened(false)} states={states} transitions={transitions} />
    </Box>
  );
}
