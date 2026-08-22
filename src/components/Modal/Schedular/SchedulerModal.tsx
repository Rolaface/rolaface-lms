import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Text,
    Select,
    Switch,
    Modal,
    Group,
    Stack,
    Button,
    ActionIcon,
    ThemeIcon,
    useMantineTheme,
} from "@mantine/core";
import { IconX, IconCalendarClock, IconMinus } from "@tabler/icons-react";
import { openCommonModal } from "../AlertModal";

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];
const SCHEDULER_NAME_OPTIONS = ["Repayment Reminder"];

export interface SchedulerFormValues {
    schedulerName: string;
    frequency: string;
    enabled: boolean;
}

const DEFAULT_VALUES: SchedulerFormValues = {
    schedulerName: "",
    frequency: "Monthly",
    enabled: true,
};

interface SchedulerModalProps {
    opened: boolean;
    onClose: () => void;
    onMinimize?: () => void;
     onSubmit?: (data: SchedulerFormValues) => void;
     initialData?: SchedulerFormValues;
    isView?: boolean;
}

export function SchedulerModal({
    opened,
    onClose,
    onMinimize,
    onSubmit,
    initialData,
    isView = false,
}: SchedulerModalProps) {
    const isEdit = !!initialData;
    const title = isView ? "View Scheduler" : isEdit ? "Edit Scheduler" : "Add Scheduler";
    const description = isView
        ? "View scheduler details"
        : isEdit
            ? "Edit scheduler details"
            : "Add a new scheduler";

    const [values, setValues] = useState<SchedulerFormValues>(initialData ?? DEFAULT_VALUES);
    const [saving, setSaving] = useState(false);

    // ── Reset the form whenever the modal opens ──
    useEffect(() => {
        if (opened) {
            setValues(initialData ?? DEFAULT_VALUES);
        }
    }, [opened, initialData]);

    const handleChange = useCallback(
        (field: keyof SchedulerFormValues, value: string | boolean) => {
            setValues((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const handleReset = useCallback(() => {
        setValues(initialData ?? DEFAULT_VALUES);
    }, [initialData]);


    const handleSubmit = useCallback(() => {
        if (!values.schedulerName) {
            openCommonModal({
                heading: "Validation Error",
                subtitle: "",
                body: "Scheduler Name is required",
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
            return;
        }
        if (!values.frequency) {
            openCommonModal({
                heading: "Validation Error",
                subtitle: "",
                body: "Frequency is required",
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
            return;
        }

        setSaving(true);
        onSubmit?.(values);
        setSaving(false);
        onClose();
    }, [values, onSubmit, onClose]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="560px"
            padding={0}
            lockScroll
            styles={{
                content: { display: "flex", flexDirection: "column", overflow: "hidden" },
                header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
                body: { padding: 0, display: "flex", flexDirection: "column" },
            }}
        >
            <Box bg="white" className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <Group
                    justify="space-between"
                    align="center"
                    px="xl"
                    py="sm"
                    bg="brand.6"
                    style={{ borderBottom: "1px solid var(--mantine-color-brand-7)" }}
                >
                    <Group gap="sm">
                        <ThemeIcon radius="md" size={34} variant="white" color="brand">
                            <IconCalendarClock size={16} />
                        </ThemeIcon>
                        <Box>
                            <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                                {title}
                            </Text>
                            <Text size="xs" fw={500} c="brand.1">
                                {description}
                            </Text>
                        </Box>
                    </Group>
                    <Group gap="xs">
                        <ActionIcon
                            variant="subtle"
                            color="white"
                            radius="xl"
                            size="md"
                            onClick={() => onMinimize?.()}
                            aria-label="Minimize"
                        >
                            <IconMinus size={16} color="white" />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            color="white"
                            radius="xl"
                            size="md"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <IconX size={16} color="white" />
                        </ActionIcon>
                    </Group>
                </Group>

                {/* Body */}
                <Box className="flex-1 overflow-y-auto" px="xl" py="lg" bg="slate.0">
                    <Stack gap="md">
                        <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Select
                                size="sm"
                                withAsterisk
                                label="Scheduler Name"
                                placeholder="Select scheduler"
                                data={SCHEDULER_NAME_OPTIONS}
                                value={values.schedulerName || null}
                                onChange={(value) => handleChange("schedulerName", value ?? "")}
                                disabled={isView}
                            />

                            <Select
                                size="sm"
                                withAsterisk
                                label="Frequency"
                                placeholder="Select frequency"
                                data={FREQUENCY_OPTIONS}
                                value={values.frequency || null}
                                onChange={(value) => handleChange("frequency", value ?? "")}
                                disabled={isView}
                            />
                        </div>

                        <Switch
                            label="Enabled"
                            checked={values.enabled}
                            onChange={(e) => handleChange("enabled", e.currentTarget.checked)}
                            disabled={isView}
                            color="brand"
                        />
                    </Stack>
                </Box>

                {/* Footer */}
                <Group
                    justify="space-between"
                    px="xl"
                    py="sm"
                    style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}
                >
                    {isView ? (
                        <div />
                    ) : (
                        <Button variant="default" radius="xl" onClick={handleReset}>
                            Reset
                        </Button>
                    )}

                    <Group gap="xs">
                        <Button variant="default" radius="xl" onClick={onClose}>
                            {isView ? "Close" : "Cancel"}
                        </Button>
                        {!isView && (
                            <Button
                                radius="xl"
                                color="brand"
                                loading={saving}
                                onClick={handleSubmit}
                            >
                                {isEdit ? "Update" : "Submit"}
                            </Button>
                        )}
                    </Group>
                </Group>
            </Box>
        </Modal>
    );
}

export default SchedulerModal;