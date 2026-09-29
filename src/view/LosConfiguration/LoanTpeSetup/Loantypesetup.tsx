import { useMemo, useReducer, useState } from "react";
import {
  Box,
  Group,
  Text,
  Badge,
  Paper,
  Stack,
  Button,
  SimpleGrid,
  ThemeIcon,
  UnstyledButton,
  ActionIcon,
  TextInput,
  Select,
  Modal,
} from "@mantine/core";
import {
  IconIdBadge2,
  IconAdjustmentsHorizontal,
  IconUser,
  IconBuilding,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconChevronRight,
  IconDeviceFloppy,
  IconRefresh,
  IconListDetails,
  IconTargetArrow,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApplicantType = "Individual" | "Business";

export interface LoanPurposeConfig {
  id: string;
  name: string;
}

export interface LoanSubTypeConfig {
  id: string;
  name: string;
  purposes: LoanPurposeConfig[];
}

export interface LoanTypeConfig {
  id: string;
  name: string;
  subTypes: LoanSubTypeConfig[];
}

export type LoanSetupConfig = Record<ApplicantType, LoanTypeConfig[]>;

interface LoanTypeSetupProps {
  /** Configuration to start from. Defaults to an empty setup for both applicant types. */
  initialConfig?: LoanSetupConfig;
  /** Called with the complete configuration when the user clicks Save. */
  onSave?: (config: LoanSetupConfig) => void | Promise<void>;
  readOnly?: boolean;
}

type Level = "loanType" | "subType" | "purpose";

const APPLICANT_TYPES: {
  key: ApplicantType;
  title: string;
  description: string;
  icon: React.FC<any>;
}[] = [
  { key: "Individual", title: "Individual", description: "Personal loan applicant", icon: IconUser },
  { key: "Business", title: "Business", description: "Registered business entity", icon: IconBuilding },
];

const EMPTY_CONFIG: LoanSetupConfig = { Individual: [], Business: [] };

const nextId = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "reset"; config: LoanSetupConfig }
  | { type: "addLoanType"; applicant: ApplicantType; id: string; name: string }
  | { type: "renameLoanType"; applicant: ApplicantType; id: string; name: string }
  | { type: "removeLoanType"; applicant: ApplicantType; id: string }
  | { type: "addSubType"; applicant: ApplicantType; loanTypeId: string; id: string; name: string }
  | { type: "renameSubType"; applicant: ApplicantType; loanTypeId: string; id: string; name: string }
  | { type: "removeSubType"; applicant: ApplicantType; loanTypeId: string; id: string }
  | {
      type: "addPurpose";
      applicant: ApplicantType;
      loanTypeId: string;
      subTypeId: string;
      id: string;
      name: string;
    }
  | {
      type: "renamePurpose";
      applicant: ApplicantType;
      loanTypeId: string;
      subTypeId: string;
      id: string;
      name: string;
    }
  | {
      type: "removePurpose";
      applicant: ApplicantType;
      loanTypeId: string;
      subTypeId: string;
      id: string;
    };

function updateLoanType(
  state: LoanSetupConfig,
  applicant: ApplicantType,
  loanTypeId: string,
  fn: (lt: LoanTypeConfig) => LoanTypeConfig,
): LoanSetupConfig {
  return {
    ...state,
    [applicant]: state[applicant].map((lt) => (lt.id === loanTypeId ? fn(lt) : lt)),
  };
}

function updateSubType(
  state: LoanSetupConfig,
  applicant: ApplicantType,
  loanTypeId: string,
  subTypeId: string,
  fn: (st: LoanSubTypeConfig) => LoanSubTypeConfig,
): LoanSetupConfig {
  return updateLoanType(state, applicant, loanTypeId, (lt) => ({
    ...lt,
    subTypes: lt.subTypes.map((st) => (st.id === subTypeId ? fn(st) : st)),
  }));
}

function reducer(state: LoanSetupConfig, action: Action): LoanSetupConfig {
  switch (action.type) {
    case "reset":
      return action.config;

    case "addLoanType":
      return {
        ...state,
        [action.applicant]: [
          ...state[action.applicant],
          { id: action.id, name: action.name, subTypes: [] },
        ],
      };
    case "renameLoanType":
      return updateLoanType(state, action.applicant, action.id, (lt) => ({ ...lt, name: action.name }));
    case "removeLoanType":
      return {
        ...state,
        [action.applicant]: state[action.applicant].filter((lt) => lt.id !== action.id),
      };

    case "addSubType":
      return updateLoanType(state, action.applicant, action.loanTypeId, (lt) => ({
        ...lt,
        subTypes: [...lt.subTypes, { id: action.id, name: action.name, purposes: [] }],
      }));
    case "renameSubType":
      return updateSubType(state, action.applicant, action.loanTypeId, action.id, (st) => ({
        ...st,
        name: action.name,
      }));
    case "removeSubType":
      return updateLoanType(state, action.applicant, action.loanTypeId, (lt) => ({
        ...lt,
        subTypes: lt.subTypes.filter((st) => st.id !== action.id),
      }));

    case "addPurpose":
      return updateSubType(state, action.applicant, action.loanTypeId, action.subTypeId, (st) => ({
        ...st,
        purposes: [...st.purposes, { id: action.id, name: action.name }],
      }));
    case "renamePurpose":
      return updateSubType(state, action.applicant, action.loanTypeId, action.subTypeId, (st) => ({
        ...st,
        purposes: st.purposes.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)),
      }));
    case "removePurpose":
      return updateSubType(state, action.applicant, action.loanTypeId, action.subTypeId, (st) => ({
        ...st,
        purposes: st.purposes.filter((p) => p.id !== action.id),
      }));

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// One column of the setup (Loan types / Sub-types / Purposes)
// ---------------------------------------------------------------------------

interface ColumnItem {
  id: string;
  name: string;
  count?: number;
}

function SetupColumn({
  icon: Icon,
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  addPlaceholder,
  addLabel,
  emptyText,
  disabled,
  disabledText,
  readOnly,
  showChevron,
  countLabel,
}: {
  icon: React.FC<any>;
  title: string;
  subtitle: string;
  items: ColumnItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (item: ColumnItem) => void;
  addPlaceholder: string;
  addLabel: string;
  emptyText: string;
  disabled?: boolean;
  disabledText: string;
  readOnly?: boolean;
  showChevron?: boolean;
  countLabel?: string;
}) {
  const [newValue, setNewValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const validate = (raw: string, excludeId?: string): string | null => {
    const name = raw.trim();
    if (!name) return "Name is required";
    const duplicate = items.some(
      (i) => i.id !== excludeId && i.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return "This name already exists";
    return null;
  };

  const handleAdd = () => {
    const err = validate(newValue);
    if (err) {
      setAddError(err);
      return;
    }
    onAdd(newValue.trim());
    setNewValue("");
    setAddError(null);
  };

  const startEdit = (item: ColumnItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setEditError(null);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    const err = validate(editValue, editingId);
    if (err) {
      setEditError(err);
      return;
    }
    onRename(editingId, editValue.trim());
    setEditingId(null);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  return (
    <Paper
      withBorder
      radius="lg"
      bg="white"
      style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden", minWidth: 0 }}
    >
      <Group
        px={12}
        py={10}
        gap={8}
        wrap="nowrap"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
      >
        <ThemeIcon radius="md" size={24} variant="light" color="brand">
          <Icon size={13} />
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fz={13} fw={700} c="slate.9">
            {title}
          </Text>
          <Text fz={11} c="slate.5">
            {subtitle}
          </Text>
        </Box>
        {!disabled && (
          <Badge size="sm" radius="xl" variant="light" color="slate">
            {items.length}
          </Badge>
        )}
      </Group>

      {disabled ? (
        <Box p="xl" ta="center">
          <Text fz={12} c="slate.4">
            {disabledText}
          </Text>
        </Box>
      ) : (
        <>
          <Stack gap={6} p={10} style={{ minHeight: 200 }}>
            {items.length === 0 ? (
              <Box py="xl" ta="center">
                <Text fz={12} c="slate.4">
                  {emptyText}
                </Text>
              </Box>
            ) : (
              items.map((item) => {
                const isEditing = editingId === item.id;
                const isSelected = !!onSelect && item.id === selectedId;

                if (isEditing) {
                  return (
                    <Group key={item.id} gap={6} wrap="nowrap" align="flex-start">
                      <TextInput
                        size="xs"
                        radius="md"
                        style={{ flex: 1 }}
                        value={editValue}
                        autoFocus
                        error={editError}
                        onChange={(e) => {
                          setEditValue(e.currentTarget.value);
                          setEditError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <ActionIcon size="md" variant="light" color="green" onClick={commitEdit} aria-label="Save name">
                        <IconCheck size={15} />
                      </ActionIcon>
                      <ActionIcon size="md" variant="default" onClick={cancelEdit} aria-label="Cancel edit">
                        <IconX size={15} />
                      </ActionIcon>
                    </Group>
                  );
                }

                return (
                  <Group
                    key={item.id}
                    gap={4}
                    wrap="nowrap"
                    style={{
                      border: `1px solid ${
                        isSelected ? "var(--mantine-color-brand-3)" : "var(--mantine-color-slate-2)"
                      }`,
                      background: isSelected ? "var(--mantine-color-brand-0)" : "white",
                      borderRadius: "var(--mantine-radius-md)",
                      transition: "background 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <UnstyledButton
                      onClick={() => onSelect?.(item.id)}
                      px={10}
                      py={8}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        cursor: onSelect ? "pointer" : "default",
                      }}
                    >
                      <Group gap={8} wrap="nowrap">
                        <Text
                          fz={12.5}
                          fw={isSelected ? 700 : 600}
                          c={isSelected ? "brand.7" : "slate.9"}
                          truncate
                          style={{ flex: 1 }}
                        >
                          {item.name}
                        </Text>
                        {item.count !== undefined && countLabel && (
                          <Text fz={10.5} c="slate.5" style={{ whiteSpace: "nowrap" }}>
                            {item.count} {countLabel}
                          </Text>
                        )}
                        {showChevron && (
                          <IconChevronRight
                            size={14}
                            color={
                              isSelected ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-4)"
                            }
                          />
                        )}
                      </Group>
                    </UnstyledButton>
                    {!readOnly && (
                      <Group gap={2} wrap="nowrap" pr={6}>
                        <ActionIcon
                          variant="subtle"
                          color="slate"
                          size="sm"
                          onClick={() => startEdit(item)}
                          aria-label={`Rename ${item.name}`}
                        >
                          <IconPencil size={15} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="danger"
                          size="sm"
                          onClick={() => onRemove(item)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <IconTrash size={15} stroke={1.5} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>
                );
              })
            )}
          </Stack>

          {!readOnly && (
            <Group
              gap={6}
              p={10}
              wrap="nowrap"
              align="flex-start"
              style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "white" }}
            >
              <TextInput
                size="xs"
                radius="md"
                style={{ flex: 1 }}
                placeholder={addPlaceholder}
                value={newValue}
                error={addError}
                onChange={(e) => {
                  setNewValue(e.currentTarget.value);
                  setAddError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
              <Button
                size="xs"
                variant="light"
                color="brand"
                leftSection={<IconPlus size={14} stroke={2.5} />}
                onClick={handleAdd}
                style={{ height: 30 }}
              >
                {addLabel}
              </Button>
            </Group>
          )}
        </>
      )}
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function LoanTypeSetup({ initialConfig = EMPTY_CONFIG, onSave, readOnly = false }: LoanTypeSetupProps) {
  const [config, dispatch] = useReducer(reducer, initialConfig);
  const [savedConfig, setSavedConfig] = useState<LoanSetupConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const [applicant, setApplicant] = useState<ApplicantType>("Individual");
  const [selectedLoanType, setSelectedLoanType] = useState<Record<ApplicantType, string | null>>({
    Individual: null,
    Business: null,
  });
  const [selectedSubType, setSelectedSubType] = useState<Record<ApplicantType, string | null>>({
    Individual: null,
    Business: null,
  });
  const [pendingDelete, setPendingDelete] = useState<{
    level: Level;
    id: string;
    name: string;
    childCount: number;
  } | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  );

  // Effective selection — only valid if the stored id still exists in the list
  const loanTypes = config[applicant];
  const activeLoanType = loanTypes.find((lt) => lt.id === selectedLoanType[applicant]) ?? null;
  const subTypes = activeLoanType?.subTypes ?? [];
  const activeSubType = subTypes.find((st) => st.id === selectedSubType[applicant]) ?? null;
  const purposes = activeSubType?.purposes ?? [];

  const setLoanTypeSel = (id: string | null) => {
    setSelectedLoanType((s) => ({ ...s, [applicant]: id }));
    setSelectedSubType((s) => ({ ...s, [applicant]: null }));
  };
  const setSubTypeSel = (id: string | null) =>
    setSelectedSubType((s) => ({ ...s, [applicant]: id }));

  // ---- add / rename / remove handlers -------------------------------------

  const handleAddLoanType = (name: string) => {
    const id = nextId();
    dispatch({ type: "addLoanType", applicant, id, name });
    setLoanTypeSel(id);
  };

  const handleAddSubType = (name: string) => {
    if (!activeLoanType) return;
    const id = nextId();
    dispatch({ type: "addSubType", applicant, loanTypeId: activeLoanType.id, id, name });
    setSubTypeSel(id);
  };

  const handleAddPurpose = (name: string) => {
    if (!activeLoanType || !activeSubType) return;
    dispatch({
      type: "addPurpose",
      applicant,
      loanTypeId: activeLoanType.id,
      subTypeId: activeSubType.id,
      id: nextId(),
      name,
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { level, id } = pendingDelete;
    if (level === "loanType") {
      dispatch({ type: "removeLoanType", applicant, id });
    } else if (level === "subType" && activeLoanType) {
      dispatch({ type: "removeSubType", applicant, loanTypeId: activeLoanType.id, id });
    } else if (level === "purpose" && activeLoanType && activeSubType) {
      dispatch({
        type: "removePurpose",
        applicant,
        loanTypeId: activeLoanType.id,
        subTypeId: activeSubType.id,
        id,
      });
    }
    setPendingDelete(null);
  };

  const handleReset = () => {
    dispatch({ type: "reset", config: savedConfig });
    setSelectedLoanType({ Individual: null, Business: null });
    setSelectedSubType({ Individual: null, Business: null });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(config);
      setSavedConfig(config);
    } finally {
      setSaving(false);
    }
  };

  const totalFor = (a: ApplicantType) => config[a].length;

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box style={{ flex: 1, minHeight: 0, overflowY: "auto" }} p={20}>
        {/* Header */}
        <Group justify="space-between" align="flex-start" mb={14} wrap="wrap">
          <Box>
            <Text fz={19} fw={800} c="slate.9" style={{ letterSpacing: "-0.01em" }}>
              Loan Type Setup
            </Text>
            <Text fz={12} c="slate.5" mt={4}>
              Define the loan types, sub-types and purposes available for each applicant type.
            </Text>
          </Box>
          {dirty && (
            <Badge size="sm" radius="xl" color="orange" variant="light">
              Unsaved changes
            </Badge>
          )}
        </Group>

        {/* Applicant type */}
        <Paper
          withBorder
          radius="lg"
          p={14}
          mb={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group gap={10} mb={12} wrap="nowrap">
            <ThemeIcon radius="md" size={30} variant="light" color="brand">
              <IconIdBadge2 size={16} />
            </ThemeIcon>
            <Box>
              <Text fz={13.5} fw={700} c="slate.9">
                Applicant type
              </Text>
              <Text fz={11.5} c="slate.5">
                Choose which applicant type you are configuring
              </Text>
            </Box>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12}>
            {APPLICANT_TYPES.map((opt) => {
              const active = opt.key === applicant;
              const Icon = opt.icon;
              return (
                <UnstyledButton
                  key={opt.key}
                  onClick={() => setApplicant(opt.key)}
                  p={12}
                  style={{
                    border: `1px solid ${
                      active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"
                    }`,
                    background: active ? "var(--mantine-color-brand-0)" : "white",
                    borderRadius: "var(--mantine-radius-md)",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <Group gap={12} wrap="nowrap">
                    <ThemeIcon
                      radius="md"
                      size={36}
                      variant={active ? "filled" : "light"}
                      color="brand"
                    >
                      <Icon size={18} />
                    </ThemeIcon>
                    <Box style={{ flex: 1 }}>
                      <Text fz={13.5} fw={700} c={active ? "brand.8" : "slate.9"}>
                        {opt.title}
                      </Text>
                      <Text fz={11.5} c={active ? "brand.7" : "slate.5"}>
                        {opt.description}
                      </Text>
                    </Box>
                    <Badge size="sm" radius="xl" variant="light" color={active ? "brand" : "slate"}>
                      {totalFor(opt.key)} loan type{totalFor(opt.key) === 1 ? "" : "s"}
                    </Badge>
                  </Group>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </Paper>

        {/* Three columns: Loan type → Sub-type → Purpose */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={12} style={{ alignItems: "start" }} mb={14}>
          <SetupColumn
            icon={IconAdjustmentsHorizontal}
            title="Loan types"
            subtitle={`For ${applicant.toLowerCase()} applicants`}
            items={loanTypes.map((lt) => ({ id: lt.id, name: lt.name, count: lt.subTypes.length }))}
            countLabel="sub-types"
            selectedId={activeLoanType?.id}
            onSelect={setLoanTypeSel}
            onAdd={handleAddLoanType}
            onRename={(id, name) => dispatch({ type: "renameLoanType", applicant, id, name })}
            onRemove={(item) =>
              setPendingDelete({
                level: "loanType",
                id: item.id,
                name: item.name,
                childCount: loanTypes.find((lt) => lt.id === item.id)?.subTypes.length ?? 0,
              })
            }
            addPlaceholder="e.g. Personal Loan"
            addLabel="Add"
            emptyText="No loan types yet. Add the first one below."
            disabledText=""
            readOnly={readOnly}
            showChevron
          />

          <SetupColumn
            icon={IconListDetails}
            title="Loan sub-types"
            subtitle={activeLoanType ? `Under ${activeLoanType.name}` : "Select a loan type"}
            items={subTypes.map((st) => ({ id: st.id, name: st.name, count: st.purposes.length }))}
            countLabel="purposes"
            selectedId={activeSubType?.id}
            onSelect={setSubTypeSel}
            onAdd={handleAddSubType}
            onRename={(id, name) =>
              activeLoanType &&
              dispatch({ type: "renameSubType", applicant, loanTypeId: activeLoanType.id, id, name })
            }
            onRemove={(item) =>
              setPendingDelete({
                level: "subType",
                id: item.id,
                name: item.name,
                childCount: subTypes.find((st) => st.id === item.id)?.purposes.length ?? 0,
              })
            }
            addPlaceholder="e.g. Wedding"
            addLabel="Add"
            emptyText="No sub-types yet. Add the first one below."
            disabled={!activeLoanType}
            disabledText="Select a loan type to manage its sub-types."
            readOnly={readOnly}
            showChevron
          />

          <SetupColumn
            icon={IconTargetArrow}
            title="Loan purposes"
            subtitle={activeSubType ? `Under ${activeSubType.name}` : "Select a sub-type"}
            items={purposes.map((p) => ({ id: p.id, name: p.name }))}
            onAdd={handleAddPurpose}
            onRename={(id, name) =>
              activeLoanType &&
              activeSubType &&
              dispatch({
                type: "renamePurpose",
                applicant,
                loanTypeId: activeLoanType.id,
                subTypeId: activeSubType.id,
                id,
                name,
              })
            }
            onRemove={(item) =>
              setPendingDelete({ level: "purpose", id: item.id, name: item.name, childCount: 0 })
            }
            addPlaceholder="e.g. Daughter Wedding"
            addLabel="Add"
            emptyText="No purposes yet. Add the first one below."
            disabled={!activeSubType}
            disabledText="Select a sub-type to manage its purposes."
            readOnly={readOnly}
          />
        </SimpleGrid>

        {/* Preview of what the applicant will see */}
        {/* <Paper
          withBorder
          radius="lg"
          p={14}
          bg="white"
          style={{ border: "1px solid var(--mantine-color-slate-2)" }}
        >
          <Group gap={10} mb={10} wrap="nowrap">
            <ThemeIcon radius="md" size={30} variant="light" color="brand">
              <IconAdjustmentsHorizontal size={16} />
            </ThemeIcon>
            <Box>
              <Text fz={13.5} fw={700} c="slate.9">
                Preview — Loan configuration
              </Text>
              <Text fz={11.5} c="slate.5">
                How the {applicant.toLowerCase()} applicant will see the loan type, sub-type and purpose
              </Text>
            </Box>
          </Group>

          <Text fz={10.5} fw={700} c="slate.5" mb={6} style={{ letterSpacing: "0.06em" }}>
            LOAN TYPE
          </Text>
          {loanTypes.length === 0 ? (
            <Text fz={12} c="slate.4" mb={12}>
              No loan types configured for {applicant.toLowerCase()} applicants.
            </Text>
          ) : (
            <Group gap={8} mb={12}>
              {loanTypes.map((lt) => {
                const active = lt.id === activeLoanType?.id;
                return (
                  <UnstyledButton
                    key={lt.id}
                    onClick={() => setLoanTypeSel(lt.id)}
                    px={14}
                    py={7}
                    style={{
                      border: `1px solid ${
                        active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"
                      }`,
                      background: active ? "var(--mantine-color-brand-6)" : "white",
                      borderRadius: "var(--mantine-radius-md)",
                    }}
                  >
                    <Text fz={12.5} fw={700} c={active ? "white" : "slate.7"}>
                      {lt.name}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12}>
            <Select
              radius="md"
              label={
                <Text fz={10.5} fw={700} c="slate.5" style={{ letterSpacing: "0.06em" }}>
                  LOAN SUB-TYPE
                </Text>
              }
              placeholder="Select"
              data={subTypes.map((st) => ({ value: st.id, label: st.name }))}
              value={activeSubType?.id ?? null}
              onChange={(v) => setSubTypeSel(v)}
              disabled={!activeLoanType}
            />
            <Select
              radius="md"
              label={
                <Text fz={10.5} fw={700} c="slate.5" style={{ letterSpacing: "0.06em" }}>
                  LOAN PURPOSE
                </Text>
              }
              placeholder="Select"
              data={purposes.map((p) => ({ value: p.id, label: p.name }))}
              disabled={!activeSubType}
            />
          </SimpleGrid>
        </Paper> */}
      </Box>

      {/* Footer */}
      {!readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={10}
          bg="white"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
        >
          <Button
            variant="transparent"
            c="dark.8"
            px={0}
            fw={600}
            leftSection={<IconRefresh size={15} />}
            onClick={handleReset}
            disabled={!dirty || saving}
          >
            Discard changes
          </Button>
          <Button
            color="brand"
            radius="md"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!dirty}
          >
            Save setup
          </Button>
        </Group>
      )}

      {/* Delete confirmation */}
      <Modal
        opened={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={
          <Text fz={14.5} fw={700} c="slate.9">
            Delete {pendingDelete?.level === "loanType" ? "loan type" : pendingDelete?.level === "subType" ? "sub-type" : "purpose"}
          </Text>
        }
        radius="md"
        size="sm"
        centered
        withCloseButton
        closeButtonProps={{ icon: <IconX size={16} /> }}
      >
        <Text fz={13} c="slate.7">
          Delete <Text span fw={700} c="slate.9">{pendingDelete?.name}</Text>?
          {pendingDelete && pendingDelete.childCount > 0 && (
            <>
              {" "}
              This will also delete its {pendingDelete.childCount}{" "}
              {pendingDelete.level === "loanType" ? "sub-type" : "purpose"}
              {pendingDelete.childCount === 1 ? "" : "s"}
              {pendingDelete.level === "loanType" ? " and their purposes" : ""}.
            </>
          )}{" "}
          The change is applied when you click Save setup.
        </Text>
        <Group justify="flex-end" mt="lg" gap={8}>
          <Button variant="default" radius="md" size="xs" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button color="red" radius="md" size="xs" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}