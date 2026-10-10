import { Fragment, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCheck, IconMinus, IconRefresh, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvestorEarningById,
  getRenewalById,
  getRenewalCandidates,
  getRenewalContext,
  previewRenewalSchedule,
  saveRenewal,
} from "../../../../api/Investor/investorFlowApi";
import type {
  RenewalContract,
  RenewalRecord,
} from "../../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { openCommonModal } from "../../AlertModal";
import { StepDot } from "../StageShell";
import { RenewalTermsTab } from "./RenewalTermsTab";
import { RenewalScheduleTab } from "./RenewalScheduleTab";
import { RenewalContractTab } from "./RenewalContractTab";
import {
  initialValues,
  payloadFromValues,
  validateValues,
  valuesFromRecord,
} from "./renewalForm";

export type RenewalModalMode = "add" | "edit" | "view";

export interface RenewalModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  mode: RenewalModalMode;
  /** Investor Flow ID (edit / view). */
  investorFlowId: string | null;
}

const TABS = ["Renewal terms", "New schedule", "Contract & mail"];

export function RenewalModal({
  opened,
  onClose,
  onMinimize,
  mode,
  investorFlowId,
}: RenewalModalProps) {
  const theme = useMantineTheme();
  const [chosenId, setChosenId] = useState<string | null>(investorFlowId);
  // Set once the renewal is saved (also right after Add), so the Contract tab can be used.
  const [savedId, setSavedId] = useState<string | null>(
    mode === "add" ? null : investorFlowId,
  );
  const id = mode === "add" ? chosenId : investorFlowId;

  const recordQuery = useQuery({
    queryKey: ["renewal", savedId],
    queryFn: () => getRenewalById(savedId as string),
    enabled: opened && !!savedId,
  });
  const candidatesQuery = useQuery({
    queryKey: ["renewalCandidates"],
    queryFn: () => getRenewalCandidates(),
    enabled: opened && mode === "add" && !savedId,
  });
  const contextQuery = useQuery({
    queryKey: ["renewalContext", id],
    queryFn: () => getRenewalContext(id as string),
    enabled: opened && mode === "add" && !savedId && !!id,
  });

  const record = recordQuery.data ?? null;
  const contract = record?.contract ?? contextQuery.data ?? null;

  let body;
  if (savedId && recordQuery.isPending) {
    body = (
      <Group justify="center" py="xl" style={{ flex: 1 }}>
        <Loader size="sm" color="brand" />
      </Group>
    );
  } else if (recordQuery.isError) {
    body = (
      <Box p="lg">
        <Alert variant="light" color="red" radius="md">
          {parseFrappeError(recordQuery.error)}
        </Alert>
      </Box>
    );
  } else {
    body = (
      <RenewalBody
        // Starts again from the chosen investment / the loaded renewal.
        key={
          record
            ? `${record.id}-${record.renewal_status}`
            : `new-${id ?? ""}-${contract ? "c" : ""}`
        }
        mode={mode}
        record={record}
        contract={contract}
        contractLoading={!!id && !savedId && contextQuery.isLoading}
        candidates={candidatesQuery.data ?? []}
        candidatesLoading={candidatesQuery.isLoading}
        investmentId={id}
        onInvestmentChange={setChosenId}
        onSaved={(saved) => setSavedId(saved.id)}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      withCloseButton={false}
      size="90vw"
      padding={0}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
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
      <Group
        gap="sm"
        wrap="nowrap"
        px={18}
        py={12}
        style={{
          flex: "none",
          background: theme.other.brandGradient,
          color: "var(--mantine-color-white)",
        }}
      >
        <ThemeIcon
          size={34}
          radius="md"
          style={{ background: theme.other.headerIconOverlayBg }}
        >
          <IconRefresh size={18} />
        </ThemeIcon>
        <Box>
          <Text fw={700} c="white">
            Investment Contract Renewal
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }}>
            Configure the rollover structure, settlement payout and renewed
            commercial terms.
          </Text>
        </Box>
        <Group gap={4} ml="auto" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Minimize"
            onClick={onMinimize}
          >
            <IconMinus size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="white"
            aria-label="Close"
            onClick={onClose}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>
      {body}
    </Modal>
  );
}

/* ------------------------------ Body ------------------------------ */

function RenewalBody({
  mode,
  record,
  contract,
  contractLoading,
  candidates,
  candidatesLoading,
  investmentId,
  onInvestmentChange,
  onSaved,
  onClose,
}: {
  mode: RenewalModalMode;
  record: RenewalRecord | null;
  contract: RenewalContract | null;
  contractLoading: boolean;
  candidates: Awaited<ReturnType<typeof getRenewalCandidates>>;
  candidatesLoading: boolean;
  investmentId: string | null;
  onInvestmentChange: (id: string | null) => void;
  onSaved: (record: RenewalRecord) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [values, setValues] = useState(() =>
    record ? valuesFromRecord(record) : initialValues(contract),
  );
  const update = (patch: Partial<typeof values>) =>
    setValues((v) => ({ ...v, ...patch }));

  const status = record?.renewal_status ?? "Draft";
  const readOnly = mode === "view" || status !== "Draft";
  const error = validateValues(values, contract);

  /* Schedule: a preview while Draft; once Approved, the investment's current schedule. */
  const [debounced] = useDebouncedValue(
    JSON.stringify(payloadFromValues(values)),
    400,
  );
  const previewQuery = useQuery({
    queryKey: ["renewalPreview", investmentId, debounced],
    queryFn: () =>
      previewRenewalSchedule({
        id: investmentId as string,
        payload: JSON.parse(debounced),
      }),
    enabled: status === "Draft" && !!investmentId && !error,
    retry: false,
  });
  const approvedQuery = useQuery({
    queryKey: ["investorEarning", record?.id],
    queryFn: () => getInvestorEarningById(record!.id),
    enabled: status === "Approved" && !!record,
  });
  const scheduleRows =
    status === "Approved"
      ? (approvedQuery.data?.schedule ?? null)
      : status === "Draft"
        ? (previewQuery.data?.schedule ?? null)
        : null;

  const saveMutation = useMutation({
    mutationFn: () =>
      saveRenewal({
        id: investmentId as string,
        payload: payloadFromValues(values),
      }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["renewals"] });
      queryClient.invalidateQueries({ queryKey: ["renewalCandidates"] });
      queryClient.setQueryData(["renewal", saved.id], saved);
      onSaved(saved);
      openCommonModal({
        heading: "Renewal Saved",
        subtitle: "",
        body: `The renewal of ${saved.id} is saved as Draft. Approve it from the Renewal list to post its entry and start the new schedule.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (e: any) =>
      openCommonModal({
        heading: "Save Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(e),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  let content;
  if (tab === 0) {
    content = (
      <RenewalTermsTab
        isAdd={mode === "add" && !record}
        readOnly={readOnly}
        candidates={candidates}
        candidatesLoading={candidatesLoading}
        investmentId={investmentId}
        onInvestmentChange={onInvestmentChange}
        contract={contract}
        contractLoading={contractLoading}
        values={values}
        update={update}
      />
    );
  } else if (tab === 1) {
    content = (
      <RenewalScheduleTab
        caption={
          status === "Approved"
            ? "Current schedule of the renewed contract"
            : "Preview: created when the renewal is approved"
        }
        rows={scheduleRows}
        loading={
          status === "Approved"
            ? approvedQuery.isLoading
            : previewQuery.isFetching && !previewQuery.data
        }
        error={status === "Approved" ? approvedQuery.error : previewQuery.error}
        emptyMessage={
          status === "Cancelled"
            ? "This renewal is Cancelled; the schedule in force before it was restored."
            : error || "Complete the renewal terms to see the new schedule."
        }
      />
    );
  } else {
    content = (
      <RenewalContractTab
        renewal={record}
        contract={contract}
        values={values}
        rows={scheduleRows}
        onSent={(saved) =>
          queryClient.setQueryData(["renewal", saved.id], saved)
        }
      />
    );
  }

  return (
    <>
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderBottom: "1px solid var(--mantine-color-slate-2)",
          overflowX: "auto",
        }}
      >
        {TABS.map((name, i) => {
          const active = i === tab;
          return (
            <Fragment key={name}>
              {i > 0 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 16,
                    maxWidth: 72,
                    height: 1,
                    background: "var(--mantine-color-slate-3)",
                  }}
                />
              )}
              <UnstyledButton
                onClick={() => setTab(i)}
                aria-current={active ? "step" : undefined}
              >
                <Group
                  gap={8}
                  wrap="nowrap"
                  px={10}
                  py={7}
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    background: active
                      ? "var(--mantine-color-white)"
                      : undefined,
                    boxShadow: active
                      ? "0 0 0 1px var(--mantine-color-slate-2)"
                      : undefined,
                  }}
                >
                  <StepDot n={i + 1} active={active} done={false} />
                  <Text fz="sm" fw={600} c={active ? "slate.8" : "slate.5"}>
                    {name}
                  </Text>
                </Group>
              </UnstyledButton>
            </Fragment>
          );
        })}
        {record && (
          <Text fz="xs" c="slate.5" ml="auto" style={{ whiteSpace: "nowrap" }}>
            Renewal status: <b>{status}</b>
          </Text>
        )}
      </div>

      <Box
        p="sm"
        bg="slate.0"
        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      >
        {content}
      </Box>

      <Group
        justify="space-between"
        px={18}
        py={10}
        style={{
          flex: "none",
          borderTop: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap={6}>
          {!readOnly && (
            <>
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: "50%",
                  background: `var(--mantine-color-${error ? "warning" : "success"}-6)`,
                }}
              />
              <Text fz="xs" c={error ? "warning.8" : "slate.6"}>
                {error || "Validation passed • Ready to save the renewal"}
              </Text>
            </>
          )}
        </Group>
        <Group gap="sm">
          <Button variant="default" radius="xl" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              radius="xl"
              color="brand"
              leftSection={<IconCheck size={16} />}
              disabled={!!error}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {record ? "Save Renewal" : "Save Draft Renewal"}
            </Button>
          )}
        </Group>
      </Group>
    </>
  );
}
