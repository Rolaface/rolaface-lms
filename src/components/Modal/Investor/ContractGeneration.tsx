import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import {
  IconDownload,
  IconEye,
  IconFileText,
  IconMail,
  IconSend,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { usePdfPreview } from "./PdfPreviewModal";
import { buildContractPdfFromState, contractPdfName } from "./Investmentpdf";
import { sendEmail } from "../../../api/Investor/investorFlowApi";
import { uploadFile } from "../../../api/loanApi";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import { useCompanyStore } from "../../../store/companyStore";
import {
  KeyValueList,
  Tag,
  fmtDate,
  stateCustomer,
  stateProduct,
  type ModalState,
  type TabProps,
} from "./InvestorModalShared";
import { formatAmount } from "../../../store/currencyStore";

interface ContractGenerationProps extends TabProps {
  /** Investor Flow ID when it already exists (used as the email's reference document). */
  investorFlowId?: string | null;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The plain-text message as the HTML content of the email. */
const messageToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const CONTRACT_STATUS_COLOR: Record<ModalState["contractStatus"], string> = {
  Pending: "warning",
  Sent: "brand",
  Paid: "success",
};

export function ContractGeneration({
  state,
  update,
  schedule,
  investorFlowId = null,
}: ContractGenerationProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const customer = stateCustomer(state);
  const product = stateProduct(state);
  const status = state.contractStatus;

  const theme = useMantineTheme();
  const companyName = useCompanyStore((s) => s.companyName);

  const pdfPreview = usePdfPreview();
  const pdfName = contractPdfName(state);

  const buildPdf = () =>
    buildContractPdfFromState(state, schedule, theme, companyCurrency);

  const handleViewPdf = () => {
    const doc = buildPdf();
    if (doc)
      pdfPreview.open(
        doc,
        `Investment Agreement - ${state.contractNo}`,
        pdfName,
      );
  };

  const handleDownloadPdf = () => buildPdf()?.save(pdfName);

  const sendMutation = useMutation({
    /** Uploads the contract PDF to Frappe, then emails it as an attachment. */
    mutationFn: async (pdf: Blob) => {
      const file = await uploadFile(
        new File([pdf], pdfName, { type: "application/pdf" }),
        1,
        pdfName,
      );
      await sendEmail({
        recipients: state.mailTo.trim(),
        subject: state.mailSubject.trim(),
        content: messageToHtml(state.mailMessage),
        send_me_a_copy: "0",
        ...(investorFlowId && {
          doctype: "Custom Investor Flow",
          name: investorFlowId,
        }),
        attachmentNames: [file.name],
      });
      return file.name;
    },
    onSuccess: (fileId) => {
      update({
        contractStatus: "Sent",
        contractMailSent: true,
        contractFileId: fileId,
      });
      openCommonModal({
        heading: "Contract Sent",
        subtitle: "",
        body: `Contract sent to ${state.mailTo.trim()} successfully.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) =>
      openCommonModal({
        heading: "Send Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  const canSend =
    status !== "Paid" &&
    !!state.mailTo.trim() &&
    !!state.mailSubject.trim() &&
    !!state.mailMessage.trim() &&
    !!schedule &&
    !!customer &&
    !!product;

  const handleSend = () => {
    const doc = buildPdf();
    if (!doc || !canSend) return;
    sendMutation.mutate(doc.output("blob"));
  };

  const cardStyle = {
    border: "1px solid var(--mantine-color-slate-2)",
    background: "var(--mantine-color-white)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  };
  const cardHeader = (title: string, addon: ReactNode, actions: ReactNode) => (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="md"
      py={10}
      style={{
        borderBottom: "1px solid var(--mantine-color-slate-2)",
        flex: "none",
      }}
    >
      <Group gap={8} wrap="nowrap">
        <Text
          fz="xs"
          fw={800}
          c="slate.8"
          tt="uppercase"
          style={{ letterSpacing: 0.5 }}
        >
          {title}
        </Text>
        {addon}
      </Group>
      <Group gap="xs" wrap="nowrap">
        {actions}
      </Group>
    </Group>
  );

  return (
    <>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Left: the agreement */}
        <Paper radius="md" style={cardStyle}>
          {cardHeader(
            "Investment agreement",
            <Badge
              variant="light"
              color="slate"
              radius="sm"
              size="sm"
              ff="monospace"
              style={{ textTransform: "none" }}
            >
              {state.contractNo}
            </Badge>,
            schedule && customer && product ? (
              <>
                <Button
                  size="xs"
                  radius="md"
                  variant="default"
                  leftSection={<IconEye size={14} />}
                  onClick={handleViewPdf}
                >
                  View contract
                </Button>
                <Button
                  size="xs"
                  radius="md"
                  color="brand"
                  leftSection={<IconDownload size={14} />}
                  onClick={handleDownloadPdf}
                >
                  Download PDF
                </Button>
              </>
            ) : null,
          )}
          {schedule && customer && product ? (
            <>
              <Group
                gap="sm"
                wrap="nowrap"
                align="flex-start"
                px="md"
                py="sm"
                style={{
                  borderBottom: "1px solid var(--mantine-color-slate-1)",
                }}
              >
                <ThemeIcon size={32} radius="md" variant="light" color="brand">
                  <IconFileText size={16} />
                </ThemeIcon>
                <Box style={{ minWidth: 0 }}>
                  <Text fw={700} fz="sm" c="slate.8">
                    Investment Agreement
                  </Text>
                  <Text fz="xs" c="slate.5">
                    Contract No. {state.contractNo} · {fmtDate(new Date())}
                  </Text>
                  <Text fz="xs" c="slate.7" mt={2}>
                    Between{" "}
                    <Text span fw={700} c="slate.8">
                      {companyName || "the Company"}
                    </Text>{" "}
                    and{" "}
                    <Text span fw={700} c="slate.8">
                      {customer.name}
                    </Text>{" "}
                    ({customer.id}), the Investor, for the product{" "}
                    <Text span fw={700} c="slate.8">
                      {product.name}
                    </Text>
                    .
                  </Text>
                </Box>
              </Group>
              <Box p="sm" bg="slate.0" style={{ flex: 1 }}>
                <KeyValueList
                  cols={2}
                  rows={[
                    {
                      label: "Investment amount",
                      value: fmtAmount(state.amount),
                    },
                    { label: "Interest rate", value: `${state.rate}% p.a.` },
                    { label: "Repayment frequency", value: state.frequency },
                    { label: "Number of payments", value: schedule.count },
                    {
                      label: "First repayment date",
                      value: fmtDate(state.firstRepayment),
                    },
                    { label: "Maturity date", value: fmtDate(state.maturity) },
                    {
                      label: "Total repayment",
                      value: fmtAmount(state.amount + schedule.totalInterest),
                    },
                    {
                      label: "Penalty",
                      value: state.penaltyApplicable
                        ? `Delayed payouts attract ${state.penaltyRate}% p.a.`
                        : "Not applicable",
                    },
                  ]}
                />
              </Box>
              <Text
                fz={11}
                c="slate.5"
                px="md"
                py={8}
                style={{
                  borderTop: "1px solid var(--mantine-color-slate-2)",
                  flex: "none",
                }}
              >
                Principal and interest are paid in equal instalments on each
                payout date; the last instalment settles any rounding
                difference.
              </Text>
            </>
          ) : (
            <Text fz="sm" c="slate.5" p="md">
              Complete the investor, product and terms to see the agreement.
            </Text>
          )}
        </Paper>

        {/* Right: the email */}
        <Paper radius="md" style={cardStyle}>
          {cardHeader(
            "Contract email",
            <Tag label={status} color={CONTRACT_STATUS_COLOR[status]} />,
            status !== "Paid" && (
              <Button
                size="xs"
                radius="md"
                variant="default"
                leftSection={<IconSend size={14} />}
                disabled={!canSend}
                loading={sendMutation.isPending}
                onClick={handleSend}
              >
                {status === "Sent" ? "Send again" : "Send"}
              </Button>
            ),
          )}
          <Stack gap="sm" p="md" style={{ flex: 1 }}>
            <TextInput
              label="To"
              size="sm"
              radius="md"
              readOnly
              placeholder="Add recipient email..."
              leftSection={<IconMail size={14} />}
              value={state.mailTo}
              error={
                customer && !state.mailTo
                  ? "This customer has no email."
                  : undefined
              }
            />
            <TextInput
              label="Subject"
              size="sm"
              radius="md"
              required={status !== "Paid"}
              readOnly={status === "Paid"}
              placeholder={`Your Investment Agreement - ${state.contractNo}`}
              value={state.mailSubject}
              onChange={(e) => update({ mailSubject: e.currentTarget.value })}
            />
            <Textarea
              label="Message"
              size="sm"
              radius="md"
              required={status !== "Paid"}
              readOnly={status === "Paid"}
              placeholder={
                customer && product
                  ? `Dear ${customer.name}, please find attached your agreement for ${product.name}...`
                  : "Write the message to the investor..."
              }
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
              styles={{
                wrapper: { flex: 1, display: "flex" },
                input: { flex: 1, minHeight: 140 },
              }}
              value={state.mailMessage}
              onChange={(e) => update({ mailMessage: e.currentTarget.value })}
            />
            {status === "Sent" && !state.contractMailSent && (
              <Text fz="xs" c="slate.5">
                The contract was already sent to this address.
              </Text>
            )}
            {state.contractMailSent && (
              <Alert variant="light" color="brand" radius="md">
                Contract sent. It is saved with the investment when you submit.
              </Alert>
            )}
          </Stack>
        </Paper>
      </Box>

      {pdfPreview.modal}
    </>
  );
}
