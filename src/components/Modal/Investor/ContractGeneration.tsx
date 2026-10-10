import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  SimpleGrid,
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
  DocumentPaper,
  KeyValueList,
  KpiGrid,
  SectionBox,
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

  return (
    <>
      {schedule && (
        <KpiGrid
          items={[
            {
              label: "Interest per instalment",
              value: fmtAmount(schedule.perPayment),
              color: "info",
            },
            {
              label: "Interest rate",
              value: `${state.rate}% p.a.`,
              color: "warning",
            },
            {
              label: "Tenure",
              value: `${schedule.totalMonths} months`,
              color: "brand",
            },
            {
              label: "Total repayment",
              value: fmtAmount(state.amount + schedule.totalInterest),
              color: "success",
            },
          ]}
        />
      )}

      <SectionBox
        title="Contract email"
        titleAddon={
          <Tag label={status} color={CONTRACT_STATUS_COLOR[status]} />
        }
        actions={
          status !== "Paid" && (
            <Button
              size="sm"
              radius="xl"
              color="brand"
              leftSection={<IconSend size={14} />}
              disabled={!canSend}
              loading={sendMutation.isPending}
              onClick={handleSend}
            >
              {status === "Sent" ? "Send again" : "Send"}
            </Button>
          )
        }
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="To"
            size="sm"
            radius="md"
            readOnly
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
            value={state.mailSubject}
            onChange={(e) => update({ mailSubject: e.currentTarget.value })}
          />
        </SimpleGrid>
        <Textarea
          label="Message"
          size="sm"
          radius="md"
          mt="sm"
          required={status !== "Paid"}
          readOnly={status === "Paid"}
          autosize
          minRows={3}
          value={state.mailMessage}
          onChange={(e) => update({ mailMessage: e.currentTarget.value })}
        />
        {status === "Sent" && !state.contractMailSent && (
          <Text fz="xs" c="slate.5" mt="xs">
            The contract was already sent to this address.
          </Text>
        )}
        {state.contractMailSent && (
          <Alert variant="light" color="brand" radius="md" mt="sm">
            Contract sent. It is saved with the investment when you submit.
          </Alert>
        )}
      </SectionBox>

      {schedule && customer && product && (
        <SectionBox
          title="Investment agreement"
          titleAddon={
            <Badge variant="light" color="slate" radius="sm" size="sm">
              {state.contractNo}
            </Badge>
          }
          actions={
            <>
              <Button
                size="sm"
                radius="xl"
                variant="default"
                leftSection={<IconEye size={14} />}
                onClick={handleViewPdf}
              >
                View contract
              </Button>
              <Button
                size="sm"
                radius="xl"
                color="brand"
                leftSection={<IconDownload size={14} />}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
            </>
          }
        >
          <DocumentPaper>
            <Group gap="sm" wrap="nowrap" mb="md">
              <ThemeIcon size={36} radius="md" variant="light" color="brand">
                <IconFileText size={18} />
              </ThemeIcon>
              <Box>
                <Text fw={700} fz="md" c="slate.8">
                  Investment Agreement
                </Text>
                <Text fz="xs" c="slate.5">
                  Contract No. {state.contractNo} · {fmtDate(new Date())}
                </Text>
              </Box>
            </Group>
            <Text fz="sm" c="slate.7" mb="md">
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
            <KeyValueList
              cols={2}
              rows={[
                { label: "Investment amount", value: fmtAmount(state.amount) },
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
            <Text fz="xs" c="slate.5" mt="md">
              Principal and interest are paid in equal instalments on each
              payout date; the last instalment settles any rounding difference.
            </Text>
          </DocumentPaper>
        </SectionBox>
      )}

      {pdfPreview.modal}
    </>
  );
}
