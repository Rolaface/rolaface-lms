import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import {
    Box,
    Text,
    TextInput,
    Select,
    Modal,
    Group,
    Stack,
    Button,
    ActionIcon,
    ThemeIcon,
    useMantineTheme,
} from "@mantine/core";
import { IconX, IconMail, IconMinus } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import RichTextEditor from "./TextEditor";
import { openCommonModal } from "../AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { createEmailTemplate, updateEmailTemplate, getEmailTemplateById } from "../../../api/emailTemplateApi";

const INSTALLMENT_TABLE_VARIABLE = "{{ installment_table }}";

const DOC_TYPE_OPTIONS = [
    // { label: "Loan Approval", value: "Loan Approval" },
    // { label: "Loan Disbursement", value: "Loan Disbursement" },
    // { label: "Loan Statement", value: "Loan Statement" },
    // { label: "Payment Reminder", value: "Payment Reminder" },
    { label: "Repayment Reminder", value: "Repayment Reminder" },
    // { label: "Loan Closure", value: "Loan Closure" },
    // { label: "Loan Rejection", value: "Loan Rejection" },
] as const;

type DocType = (typeof DOC_TYPE_OPTIONS)[number]["value"];


function getVariableChips(category: string): {
    label: string;
    value: string;
    payloadValue?: string;
    /** If true, this chip cannot be inserted into the subject field */
    bodyOnly?: boolean;
}[] {
    switch (category) {
        case "Loan Approval":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ loan_amount }}", value: " {{ loan_amount }} " },
            ];
        case "Loan Disbursement":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ disbursement_date }}", value: " {{ disbursement_date }} " },
                { label: "{{ loan_amount }}", value: " {{ loan_amount }} " },
            ];
        case "Loan Statement":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ PERIOD }}", value: " {{ PERIOD }} " },
            ];
        case "Repayment Reminder":
            return [
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ due_date }}", value: " {{ due_date }} " },
                { label: "{{ outstanding_amount }}", value: " {{ outstanding_amount }} " },
                {
                    label: "{{ installment_table }}",
                    value: ` ${INSTALLMENT_TABLE_VARIABLE} `,
                    // bodyOnly — cannot be inserted into the subject input
                    bodyOnly: true,
                },
            ];
        case "Loan Closure":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ closure_date }}", value: " {{ closure_date }} " },
            ];
        case "Loan Rejection":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ rejection_reason }}", value: " {{ rejection_reason }} " },
            ];
        default:
            return [];
    }
} 

export interface EmailTemplateForm {
    name: string;
    subject: string;
    response: string;
}

const DEFAULT_FORM: EmailTemplateForm = {
    name: "",
    subject: "",
    response: "",
}; 
interface EmailTemplateModalProps {
    opened: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    onSaved?: (data: EmailTemplateForm) => void;
    onSubmit?: (data: EmailTemplateForm) => void;
    initialData?: EmailTemplateForm;
    isView?: boolean;
} 

export function EmailTemplateModal({
    opened,
    onClose,
    onMinimize,
    onSubmit,
    onSaved,
    initialData,
    isView = false,
}: EmailTemplateModalProps) {
    const theme = useMantineTheme();

    const isEdit = !!initialData;
    const title = isView ? "View Email Template" : isEdit ? "Edit Email Template" : "Add Email Template";
    const description = isView
        ? "View email template details"
        : isEdit
            ? "Edit email template details"
            : "Create a new email template";

    const [form, setForm] = useState<EmailTemplateForm>(initialData ?? DEFAULT_FORM);
    const [editorReady, setEditorReady] = useState(false);

    const focusedField = useRef<"subject" | "response">("response");
    const subjectRef = useRef<HTMLInputElement>(null);

    const editorInstanceRef = useRef<ReturnType<typeof useEditor> | null>(null);

     const showSuccess = (heading: string, body: string) => {
          openCommonModal({
            heading,
            subtitle: '',
            body,
            color: 'green',
            buttons: [{ label: 'Close', color: 'green' }],
          });
        };
    const queryClient = useQueryClient();

    const { mutate: createTemplate, isPending: isCreating } = useMutation({
        mutationFn: createEmailTemplate,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
           onSaved?.(variables as unknown as EmailTemplateForm);
            onClose();
            showSuccess('Email Template Created', `Email Template ${variables} Created successfully.`);
        },
        onError: (error) => {
            openCommonModal({
                heading: "Action Failed",
                subtitle: "We couldn't complete your request.",
                body: parseFrappeError(error),
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
        },
    });

    const { mutate: editTemplate, isPending: isUpdating } = useMutation({
        mutationFn: ({ name, payload }: { name: string; payload: any }) =>
            updateEmailTemplate({ name, payload }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
            onSaved?.(variables.payload as EmailTemplateForm);
            onClose();
            showSuccess('Email Template Updated', `Email Template ${variables} Updated successfully.`);
        },
        onError: (error) => {
            openCommonModal({
                heading: "Action Failed",
                subtitle: "We couldn't complete your request.",
                body: parseFrappeError(error),
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
        },
    });

    const saving = isCreating || isUpdating;

    // ── Update the form if initialData changes ──
    useEffect(() => {
        setForm(initialData ?? DEFAULT_FORM);
    }, [initialData]);

    const handleModalClose = () => {
        setForm(DEFAULT_FORM);
        onClose();
    };

    // ── Mount the rich text editor a frame after open ──
    useEffect(() => {
        if (!opened) {
            setEditorReady(false);
            return;
        }
        const id = requestAnimationFrame(() => setEditorReady(true));
        return () => cancelAnimationFrame(id);
    }, [opened]);

 
    const handleChipClick = useCallback((chipValue: string, bodyOnly?: boolean) => {
        const isInstallmentTable = chipValue.trim() === INSTALLMENT_TABLE_VARIABLE;

        if ((bodyOnly || isInstallmentTable) && focusedField.current === "subject") {
            focusedField.current = "response"; 
        }

        if (focusedField.current === "subject" && !bodyOnly && !isInstallmentTable) {
             const input = subjectRef.current;
            if (!input) return;

            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const newValue =
                input.value.slice(0, start) + chipValue + input.value.slice(end);

            setForm((prev) => ({ ...prev, subject: newValue }));

            requestAnimationFrame(() => {
                input.focus();
                const cursorPos = start + chipValue.length;
                input.setSelectionRange(cursorPos, cursorPos);
            });
        } else {
            // Insert as an atomic Tiptap node in the editor
            const editorInstance = editorInstanceRef.current;
            if (!editorInstance) return;

            if (isInstallmentTable) {
                editorInstance.chain().focus().insertContent({ type: "invoiceTable" }).run();
            } else {
                editorInstance
                    .chain()
                    .focus()
                    .insertContent({
                        type: "variable",
                        attrs: { label: chipValue.trim() },
                    })
                    .run();
            }
        }
    }, []);

    // ── Form change helpers ──

    const handleFieldChange = useCallback(
        (field: keyof EmailTemplateForm, value: string) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const handleReset = useCallback(() => {
        setForm(initialData ?? DEFAULT_FORM);
    }, [initialData]);

    // ── Submit logic triggering API calls ──

    const handleSubmit = useCallback(() => {
        if (!form.subject.trim()) {
            openCommonModal({
                heading: "Validation Error",
                subtitle: "",
                body: "Subject is required",
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
            return;
        }
        if (!form.response.trim() || form.response === "<p></p>") {
            openCommonModal({
                heading: "Validation Error",
                subtitle: "",
                body: "Response (message) is required",
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
            return;
        }
        if (!isEdit && !form.name) {
            openCommonModal({
                heading: "Validation Error",
                subtitle: "",
                body: "Template category is required",
                color: "red",
                buttons: [{ label: "Close", color: "red" }],
            });
            return;
        }

        if (isEdit && initialData) {
            editTemplate({ name: initialData.name, payload: form as any });
        } else {
            createTemplate(form as any);
        }
    }, [form, isEdit, initialData, createTemplate, editTemplate]);

    const variableChips = useMemo(() => getVariableChips(form.name), [form.name]);

    return (
        <Modal
            opened={opened}
            onClose={handleModalClose}
            size="1000px"
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
                            <IconMail size={16} />
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
                            onClick={handleModalClose}
                            aria-label="Close"
                        >
                            <IconX size={16} color="white" />
                        </ActionIcon>
                    </Group>
                </Group>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Main form column */}
                    <Box className="flex-1 overflow-y-auto" px="xl" py="lg" bg="slate.0">
                        <Stack gap="md">
                            {/* Category + Subject */}
                            <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "1fr 1.7fr" }}>
                                {isEdit || isView ? (
                                    <TextInput
                                        size="sm"
                                        label="Category"
                                        value={form.name}
                                        disabled
                                    />
                                ) : (
                                    <Select
                                        size="sm"
                                        withAsterisk
                                        label="Category"
                                        placeholder="Select template category..."
                                        data={DOC_TYPE_OPTIONS.map((opt) => ({
                                            value: opt.value,
                                            label: opt.label,
                                        }))}
                                        value={form.name || null}
                                        onChange={(value) =>
                                            handleFieldChange("name", (value as DocType) ?? "")
                                        }
                                    />
                                )}

                                <TextInput
                                    size="sm"
                                    withAsterisk
                                    label="Subject"
                                    placeholder="Enter email subject..."
                                    ref={subjectRef}
                                    value={form.subject}
                                    onFocus={() => {
                                        focusedField.current = "subject";
                                    }}
                                    onChange={(e) => handleFieldChange("subject", e.currentTarget.value)}
                                    disabled={isView}
                                />
                            </div>

                            {/* Response (rich text) */}
                            <div className="flex flex-col gap-1">
                                <Text size="xs" fw={500} c="slate.7">
                                    Response <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>
                                </Text>
                                <div
                                    onFocus={() => {
                                        focusedField.current = "response";
                                    }}
                                >
                                    {editorReady && (
                                        <RichTextEditorWithInsert
                                            value={form.response}
                                            onChange={(html) => handleFieldChange("response", html)}
                                            onEditorReady={(editorInstance) => {
                                                editorInstanceRef.current = editorInstance;
                                            }}
                                            minHeight={240}
                                            editable={!isView}
                                        />
                                    )}
                                </div>
                            </div>
                        </Stack>
                    </Box>

                    {/* Right: variable chips */}
                    {!isView && (
                        <Box
                            className="w-[220px] shrink-0 overflow-y-auto"
                            style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
                            p="md"
                        >
                            <Text
                                size="sm"
                                fw={700}
                                c="slate.7"
                                tt="uppercase"
                                mb="sm"
                                style={{ letterSpacing: "0.05em" }}
                            >
                                Variables
                            </Text>

                            {form.name ? (
                                <Stack gap="xs">
                                    <Text size="xs" c="slate.5">
                                        Click to insert at cursor
                                    </Text>
                                    {variableChips.map((chip) => (
                                        <Button
                                            key={chip.value}
                                            size="xs"
                                            radius="md"
                                            variant="light"
                                            color="brand"
                                            fullWidth
                                            ff="monospace"
                                            title={
                                                chip.bodyOnly
                                                    ? "Can only be inserted into the message body"
                                                    : undefined
                                            }
                                            onClick={() => handleChipClick(chip.value, chip.bodyOnly)}
                                            styles={{ label: { whiteSpace: "nowrap" } }}
                                        >
                                            {chip.label}
                                        </Button>
                                    ))}
                                </Stack>
                            ) : (
                                <Text size="xs" c="slate.5">
                                    Select a template category to see available variables
                                </Text>
                            )}
                        </Box>
                    )}
                </div>

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
                        <Button
                            variant="default"
                            radius="xl"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    )}

                    <Group gap="xs">
                        <Button
                            variant="default"
                            radius="xl"
                            onClick={handleModalClose}
                        >
                            {isView ? "Close" : "Cancel"}
                        </Button>
                        {!isView && (
                            <Button
                                radius="xl"
                                color="brand"
                                loading={saving}
                                style={{
                                    background: theme.other.brandGradient as string,
                                    boxShadow: theme.other.brandGlowShadowSm as string,
                                }}
                                onClick={handleSubmit}
                            >
                                {isEdit ? "Update" : "Save"}
                            </Button>
                        )}
                    </Group>
                </Group>
            </Box>
        </Modal>
    );
}

interface RichTextEditorWithInsertProps {
    value: string;
    onChange: (html: string) => void;
    onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
    minHeight?: number;
    editable?: boolean;
}

const RichTextEditorWithInsert: React.FC<RichTextEditorWithInsertProps> = ({
    value,
    onChange,
    onEditorReady,
    minHeight,
    editable = true,
}) => {
    return (
        <RichTextEditor
            value={value}
            onChange={onChange}
            minHeight={minHeight}
            placeholder=""
            editable={editable}
            onEditorReady={onEditorReady}
        />
    );
};
export default EmailTemplateModal;
