import { useState, useRef } from "react";
import { Modal, Box, Group, Text, ActionIcon, Button, ThemeIcon,
} from "@mantine/core";
import { IconGauge, IconFileText, IconX, IconMinus, IconCircleCheck, IconInfoCircle, IconArrowRight } from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import { DUMMY_PERSONAL_LOAN_APPLICATION, DUMMY_PRESCREENING_CONTEXT } from "./Dummyloanapplicationdata";
import type { PreScreeningModalProps, Section } from "./PreScreeningShared";
import { ContextHeader, LeftNav } from "./PreScreeningShared";
import { PrescreeningWorkspace } from "./PrescreeningWorkspace";
export function PreScreeningModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  embedded = false,
  readOnly = false,
  onMinimize,
}: PreScreeningModalProps) {
  const [section, setSection] = useState<Section>("prescreening");
  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  // Add this early return for the embedded state
  if (embedded) {
    return (
      <PrescreeningWorkspace
        values={applicationValues}
        readOnly={readOnly}
        onSubmitReady={handleSubmitReady}
      />
    );
  }
  const bodyContent = (
    <Box
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {!embedded && (
        <Group justify="space-between" align="center" px="xl" py="sm" bg="brand.6" style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}>
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconGauge size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>Loan Application</Text>
              <Text size="xs" fw={500} c="brand.1">Stage 2 &mdash; Prescreening</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onMinimize} aria-label="Minimize">
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>      )}

      <ContextHeader
        values={applicationValues}
        applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
      />

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
                <LeftNav 
          section={section} 
          setSection={setSection} 
          stageIndex={2}
          items={[
            { id: "application", label: "Loan application", hint: "Submitted", icon: IconFileText, done: true },
            { id: "prescreening", label: "Prescreening", hint: "In progress", icon: IconGauge, done: false },
          ]}
        />

        <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {section === "application" ? (
            <Box style={{ height: "100%" }}>
              <Box style={{ height: "calc(100% - 70px)" }}>
                <LoanApplicationModal
                  embedded
                  readOnly
                  initialValues={applicationValues}
                  opened={false}
                  onClose={() => {}}
                  onMinimize={() => {}}
                />
              </Box>
            </Box>

          ) : (
            <PrescreeningWorkspace
              values={applicationValues}
              readOnly={readOnly}
              onSubmitReady={handleSubmitReady}
            />
          )}
        </Box>
      </Box>
      {!embedded && !readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py={8}
          bg="white"
          style={{
            borderTop: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "0 -6px 18px -14px rgba(15, 23, 42, 0.45)",
            flexShrink: 0,
          }}
        >
          <Group gap={8} wrap="nowrap">
            {canSubmit ? (
              <IconCircleCheck size={15} color="var(--mantine-color-success-6)" />
            ) : (
              <IconInfoCircle size={15} color="var(--mantine-color-slate-4)" />
            )}
            <Text fz={12} c={canSubmit ? "success.7" : "slate.5"} fw={canSubmit ? 600 : 500}>
              {canSubmit
                ? "All prescreening checks passed — ready for appraisal."
                : "Resolve the outstanding checks to continue."}
            </Text>
          </Group>
          <Group gap={10}>
            <Button variant="subtle" color="slate" radius="md" fw={600} onClick={onClose}>
              Cancel
            </Button>
            <Button
              radius="md"
              onClick={handleSubmit}
              disabled={!canSubmit}
              rightSection={<IconArrowRight size={16} />}
              styles={{
                root: canSubmit
                  ? {
                      background:
                        "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                      boxShadow:
                        "0 8px 18px -10px color-mix(in srgb, var(--mantine-color-brand-6) 90%, transparent)",
                    }
                  : undefined,
              }}
            >
              Submit
            </Button>
          </Group>
        </Group>
      )}
    </Box>
  );

  if (embedded) {
    return (
      <Box style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {bodyContent}
      </Box>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1400}
      padding={0}
      closeOnClickOutside={false}
        closeOnEscape={false}
      lockScroll
      styles={{
        content: {
          height: "95vh",
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      {bodyContent}
    </Modal>
  );
}



