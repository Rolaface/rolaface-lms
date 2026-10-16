import { useState } from "react";
import { Modal, Box, Group, Text, ActionIcon, ThemeIcon } from "@mantine/core";
import { IconGauge, IconFileText, IconX, IconMinus } from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import * as LoanApplicationApi from "../../../api/LosConfiguration/LoanApplicationApi";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import type { PreScreeningModalProps, Section } from "./PreScreeningShared";
import { ContextHeader, LeftNav } from "./PreScreeningShared";
import { PrescreeningWorkspace, type PrescreeningResult } from "./PrescreeningWorkspace";
import { StageLoading, useStageApplication } from "../stageData";
import { StageFooter, type StageBusy } from "../StageFooter";

export function PreScreeningModal({
  opened,
  onClose,
  loanApplicationId,
  application: embeddedApplication,
  embedded = false,
  readOnly = false,
  onMinimize,
}: PreScreeningModalProps) {
  const [section, setSection] = useState<Section>("prescreening");
  const [result, setResult] = useState<PrescreeningResult | null>(null);
  const [busy, setBusy] = useState<StageBusy>(null);
  const stage = useStageApplication(embedded ? null : loanApplicationId);

  if (embedded) {
    return embeddedApplication ? <PrescreeningWorkspace application={embeddedApplication} readOnly={readOnly} /> : null;
  }

  const { application, values } = stage;

  const canSubmit = !!result?.ready;

  const stageStatus = result?.payload.custom_status;
  const decisionHint =
    canSubmit && (stageStatus === "Review" || stageStatus === "Warning")
      ? ` Approve passes it on your decision; Save keeps it as ${stageStatus}.`
      : "";

  const persist = async (approve: boolean) => {
    if (!result || !loanApplicationId) return;
    setBusy(approve ? "approve" : "save");
    if (!(await stage.save(result.payload))) {
      setBusy(null);
      return;
    }
    try {
      await LoanApplicationApi.evaluate(loanApplicationId, result.overrides, true, approve);
      onClose();
    } catch (error) {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    } finally {
      setBusy(null);
    }
  };

  const bodyContent = (
    <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
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
      </Group>

      {!application || !values ? (
        <StageLoading error={stage.error} />
      ) : (
        <>
          <ContextHeader values={values} applicationId={application.name} loanTypeName={application.loan_type_name} />

          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
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
                    <LoanApplicationModal embedded readOnly initialValues={values} opened={false} onClose={() => {}} onMinimize={() => {}} />
                  </Box>
                </Box>
              ) : (
                <PrescreeningWorkspace application={application} readOnly={readOnly} onChange={setResult} />
              )}
            </Box>
          </Box>
          {!readOnly && (
            <StageFooter
              ready={canSubmit}
              warning={!!result?.warning}
              message={
                (result?.message ??
                  (canSubmit ? "All prescreening checks passed — ready for appraisal." : "Resolve the outstanding checks to continue.")) +
                decisionHint
              }
              busy={busy}
              canSave={!!result}
              onCancel={onClose}
              onSave={() => persist(false)}
              onApprove={() => persist(true)}
            />
          )}
        </>
      )}
    </Box>
  );

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
        content: { height: "95vh", maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      {bodyContent}
    </Modal>
  );
}
