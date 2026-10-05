import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  Loader,
  Alert,
  Switch,
} from "@mantine/core";
import {
  IconBriefcase,
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
  IconAlertCircle,
} from "@tabler/icons-react";
import { createLoanTypes, getAllLoanTypes, deleteLoanType, enableLoanType, disableLoanType, updateLoanTypes } from "../../../api/OriginationSetupAPi/loanSetupApi";
import type { CreateLoanTypePayload, CreateLoantypeResponse } from "../../../types/OriginationSetup/loanTypeForm";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ApplicantType = "Individual" | "Business";
export interface LoanPurposeConfig {
  id: string;
  name: string;
  isActive?: boolean;
}
export interface LoanSubTypeConfig {
  id: string;
  name: string;
  isActive?: boolean;
  purposes: LoanPurposeConfig[];
}
export interface LoanTypeConfig {
  id: string;
  name: string;
  isActive?: boolean;
  subTypes: LoanSubTypeConfig[];
}
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
  initialConfig?: LoanSetupConfig;
  onSave?: (config: LoanSetupConfig) => void | Promise<void>;
  readOnly?: boolean;
}

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

type ApiSetup = CreateLoantypeResponse["message"]["data"]["setup"];

function fromApiSetup(setup: ApiSetup | undefined | null): LoanSetupConfig {
  const mapList = (list: ApiSetup["Individual"] | undefined): LoanTypeConfig[] =>
    (list ?? []).map((lt) => ({
      id: lt.id,
      name: lt.name,
      isActive: lt.isActive !== undefined ? Boolean(lt.isActive) : true,
      subTypes: (lt.subTypes ?? []).map((st) => ({
        id: st.id,
        name: st.name,
        isActive: st.isActive !== undefined ? Boolean(st.isActive) : true,
        purposes: (st.purposes ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
        })),
      })),
    }));

  return {
    Individual: mapList(setup?.Individual),
    Business: mapList(setup?.Business),
  };
}
function toCreatePayload(config: LoanSetupConfig): CreateLoanTypePayload {
  const mapList = (list: LoanTypeConfig[]) =>
    list.map((lt) => ({
      name: lt.name,
      subTypes: lt.subTypes.map((st) => ({
        name: st.name,
        purposes: st.purposes.map((p) => ({ name: p.name })),
      })),
    }));

  return {
    Individual: mapList(config.Individual),
    Business: mapList(config.Business),
  };
}

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
    }
  | {
      type: "toggleActive";
      applicant: ApplicantType;
      id: string;
      isActive: boolean;
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
    case "toggleActive":
      return {
        ...state,
        [action.applicant]: state[action.applicant].map((lt) =>
          lt.id === action.id
            ? { ...lt, isActive: action.isActive }
            : {
                ...lt,
                subTypes: lt.subTypes.map((st) =>
                  st.id === action.id
                    ? { ...st, isActive: action.isActive }
                    : {
                        ...st,
                        purposes: st.purposes.map((p) =>
                          p.id === action.id ? { ...p, isActive: action.isActive } : p,
                        ),
                      },
                ),
              },
        ),
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

interface ColumnItem {
  id: string;
  name: string;
  count?: number;
  isActive?: boolean;
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
  onToggle,
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
  onToggle?: (item: ColumnItem, nextActive: boolean) => void;
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
                      <Group gap={4} wrap="nowrap" pr={6}>
                        {onToggle && (
                          <Switch
                            size="xs"
                            color="teal"
                            checked={item.isActive ?? true}
                            onChange={(e) => onToggle(item, e.currentTarget.checked)}
                            aria-label={`Toggle ${item.name}`}
                            styles={{ track: { cursor: "pointer" } }}
                          />
                        )}
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

export function LoanTypeSetup({ initialConfig, onSave, readOnly = false }: LoanTypeSetupProps) {
  const queryClient = useQueryClient();
  const [config, dispatch] = useReducer(reducer, initialConfig ?? EMPTY_CONFIG);
  const [savedConfig, setSavedConfig] = useState<LoanSetupConfig>(initialConfig ?? EMPTY_CONFIG);

  const [saveError, setSaveError] = useState<string | null>(null);

  const [applicant, setApplicant] = useState<ApplicantType>("Individual");
  const [selectedLoanType, setSelectedLoanType] = useState<Record<ApplicantType, string | null>>({
    Individual: initialConfig?.Individual[0]?.id ?? null,
    Business: initialConfig?.Business[0]?.id ?? null,
  });
  const [selectedSubType, setSelectedSubType] = useState<Record<ApplicantType, string | null>>({
    Individual: initialConfig?.Individual[0]?.subTypes[0]?.id ?? null,
    Business: initialConfig?.Business[0]?.subTypes[0]?.id ?? null,
  });
  const prevState = useRef({ config, selectedLoanType, selectedSubType });
  useEffect(() => {
    prevState.current = { config, selectedLoanType, selectedSubType };
  }, [config, selectedLoanType, selectedSubType]);

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

 const {
    data: loanTypesRes,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["loan-types", { include_inactive: 1 }],
    queryFn: () => getAllLoanTypes(1) as Promise<CreateLoantypeResponse>,
    // enabled: !initialConfig,
  });

  const loading = !initialConfig && isLoading;
  const loadError = queryError
    ? (queryError as any)?.message ?? "Failed to load loan type setup."
    : null;

  useEffect(() => {
    if (!loanTypesRes) return;
    const mapped = fromApiSetup(loanTypesRes?.message?.data?.setup);
    const prev = prevState.current;

    const getLtName = (app: ApplicantType) => prev.config[app].find((lt) => lt.id === prev.selectedLoanType[app])?.name;
    const getStName = (app: ApplicantType) => prev.config[app].flatMap((lt) => lt.subTypes).find((st) => st.id === prev.selectedSubType[app])?.name;

    dispatch({ type: "reset", config: mapped });
    setSavedConfig(mapped);

    setSelectedLoanType({
      Individual: mapped.Individual.find((lt) => lt.name === getLtName("Individual") || lt.id === prev.selectedLoanType.Individual)?.id ?? mapped.Individual[0]?.id ?? null,
      Business: mapped.Business.find((lt) => lt.name === getLtName("Business") || lt.id === prev.selectedLoanType.Business)?.id ?? mapped.Business[0]?.id ?? null,
    });

    setSelectedSubType({
      Individual: mapped.Individual.flatMap((lt) => lt.subTypes).find((st) => st.name === getStName("Individual") || st.id === prev.selectedSubType.Individual)?.id ?? mapped.Individual[0]?.subTypes[0]?.id ?? null,
      Business: mapped.Business.flatMap((lt) => lt.subTypes).find((st) => st.name === getStName("Business") || st.id === prev.selectedSubType.Business)?.id ?? mapped.Business[0]?.subTypes[0]?.id ?? null,
    });
  }, [loanTypesRes]);

  const saveMutation = useMutation({
    mutationFn: createLoanTypes,
    onSuccess: async (res: CreateLoantypeResponse) => {
      const mapped = fromApiSetup(res?.message?.data?.setup);
      dispatch({ type: "reset", config: mapped });
      setSavedConfig(mapped);
      queryClient.invalidateQueries({ queryKey: ["loan-types"] });
      showSuccess(
        "Setup Saved",
        res?.message?.message || "Loan type setup saved successfully.",
      );
      await onSave?.(mapped);
    },
    onError: (error: any) => {
      setSaveError(error?.message ?? "Failed to save loan type setup.");
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const saving = saveMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: deleteLoanType,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-types"] });
      showSuccess(
        "Loan Type Deleted",
        `Loan Type ${variables} deleted successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Loan Type",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => deleteMutation.mutate(id),
        },
      ],
    });
  };

  const enableMutation = useMutation({
    mutationFn: enableLoanType,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-types"] });
      showSuccess(
        "Loan Type Enabled",
        `Loan Type ${variables} enabled successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableLoanType,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-types"] });
      showSuccess(
        "Loan Type Disabled",
        `Loan Type ${variables} disabled successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const handleToggle = (item: ColumnItem, nextActive: boolean) => {
    dispatch({ type: "toggleActive", applicant, id: item.id, isActive: nextActive });
    if (nextActive) {
      enableMutation.mutate(item.id);
    } else {
      disableMutation.mutate(item.id);
    }
  };

  const updateMutation = useMutation({
    mutationFn: updateLoanTypes,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-types"] });
      showSuccess(
        "Loan Type Updated",
        `Loan Type ${variables.id} updated successfully.`,
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  );

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

  const handleReset = () => {
    dispatch({ type: "reset", config: savedConfig });
    setSelectedLoanType({ Individual: null, Business: null });
    setSelectedSubType({ Individual: null, Business: null });
  };

const handleSave = () => {
    setSaveError(null);
    const payload = toCreatePayload(config);
    saveMutation.mutate(payload);
  };

  const totalFor = (a: ApplicantType) => config[a].length;

  if (loading) {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 300,
        }}
      >
        <Loader color="brand" size="sm" />
        <Text fz={12.5} c="slate.5" mt={10}>
          Loading loan type setup…
        </Text>
      </Box>
    );
  }

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
              <IconBriefcase size={16} />
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

         <SimpleGrid cols={{ base: 1, md: 3 }} spacing={12} style={{ alignItems: "start" }} mb={14}>
          <SetupColumn
            icon={IconAdjustmentsHorizontal}
            title="Loan types"
            subtitle={`For ${applicant.toLowerCase()} applicants`}
            items={loanTypes.map((lt) => ({
              id: lt.id,
              name: lt.name,
              count: lt.subTypes.length,
              isActive: lt.isActive,
            }))}
            countLabel="sub-types"
            selectedId={activeLoanType?.id}
            onSelect={setLoanTypeSel}
            onAdd={handleAddLoanType}
            onRename={(id, name) => {
  dispatch({ type: "renameLoanType", applicant, id, name });
  updateMutation.mutate({ id, name });
}}
            onRemove={(item) => confirmDelete(item.id)}
            onToggle={handleToggle}
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
            items={subTypes.map((st) => ({
              id: st.id,
              name: st.name,
              count: st.purposes.length,
              isActive: st.isActive,
            }))}
            countLabel="purposes"
            selectedId={activeSubType?.id}
            onSelect={setSubTypeSel}
            onAdd={handleAddSubType}
           onRename={(id, name) => {
  if (!activeLoanType) return;
  dispatch({ type: "renameSubType", applicant, loanTypeId: activeLoanType.id, id, name });
  updateMutation.mutate({ id, name });
}}
            onRemove={(item) => confirmDelete(item.id)}
            onToggle={handleToggle}
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
            items={purposes.map((p) => ({
              id: p.id,
              name: p.name,
              isActive: p.isActive,
            }))}
            onAdd={handleAddPurpose}
            onRename={(id, name) => {
  if (!activeLoanType || !activeSubType) return;
  dispatch({
    type: "renamePurpose",
    applicant,
    loanTypeId: activeLoanType.id,
    subTypeId: activeSubType.id,
    id,
    name,
  });
  updateMutation.mutate({ id, name });
}}
            onRemove={(item) => confirmDelete(item.id)}
            onToggle={handleToggle}
            addPlaceholder="e.g. Daughter Wedding"
            addLabel="Add"
            emptyText="No purposes yet. Add the first one below."
            disabled={!activeSubType}
            disabledText="Select a sub-type to manage its purposes."
            readOnly={readOnly}
          />
        </SimpleGrid>
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
    </Box>
  );
}