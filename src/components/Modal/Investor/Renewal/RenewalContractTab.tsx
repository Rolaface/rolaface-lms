/* Tab 3 - the renewal agreement: view / download it as PDF and email it to the investor
   (same flow as the investment's Contract Generation: upload the PDF, email it, then save it on the renewal). */
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  SimpleGrid,
  Text,
  TextInput,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { IconDownload, IconEye, IconMail, IconSend } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { usePdfPreview } from "../PdfPreviewModal";
import { buildRenewalContractPdf, getPdfPalette } from "../Investmentpdf";
import {
  saveRenewalContract,
  sendEmail,
} from "../../../../api/Investor/investorFlowApi";
import { uploadFile } from "../../../../api/loanApi";
import type {
  RenewalContract,
  RenewalRecord,
} from "../../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { openCommonModal } from "../../AlertModal";
import { useCompanyStore } from "../../../../store/companyStore";
import { SectionBox } from "../InvestorModalShared";
import {
  newMaturity,
  renewedPrincipal,
  type RenewalFormValues,
} from "./renewalForm";
import type { RenewalScheduleLine } from "./RenewalScheduleTab";

interface Props {
  /** The saved renewal; the contract can be sent only after the renewal is saved. */
  renewal: RenewalRecord | null;
  contract: RenewalContract | null;
  values: RenewalFormValues;
  rows: RenewalScheduleLine[] | null;
  onSent: (record: RenewalRecord) => void;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const messageToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const STATUS_COLOR: Record<string, string> = {
  Pending: "warning",
  Sent: "brand",
  Paid: "success",
};

export function RenewalContractTab({
  renewal,
  contract,
  values,
  rows,
  onSent,
}: Props) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const companyName = useCompanyStore((s) => s.companyName);
  const pdfPreview = usePdfPreview();

  const status = renewal?.renewal_contract_status || "Pending";
  const [to] = useState(renewal?.renewal_to || contract?.investor_email || "");
  const [subject, setSubject] = useState(renewal?.renewal_subject || "");
  const [message, setMessage] = useState(renewal?.renewal_message || "");

  const pdfName = `Renewal-${contract?.id ?? "contract"}.pdf`;
  const buildPdf = () => {
    if (!contract || !rows?.length || !values.structure) return null;
    return buildRenewalContractPdf(
      {
        contractNo: contract.id,
        companyName,
        issuedOn: new Date(),
        status: renewal?.renewal_status ?? "Draft",
        customer: {
          name: contract.investor,
          id: contract.investor_id,
          email: to,
        },
        productName: contract.investment_product_name,
        previousPrincipal: contract.contract_principal,
        previousMaturity: contract.contract_maturity,
        outstandingPrincipal: contract.outstanding_principal,
        unpaidInterest: contract.unpaid_interest,
        structure: values.structure,
        effectiveDate: values.effectiveDate,
        settlementAmount:
          values.structure === "Partial Settlement"
            ? Number(values.settlementAmount) || 0
            : 0,
        interestSettlement: values.interestSettlement || null,
        interestSettlementDate: values.interestSettlementDate || null,
        reason: values.reason || null,
        principal: renewedPrincipal(values, contract),
        rate: Number(values.rate) || 0,
        frequency: values.frequency,
        tenureMonths: Number(values.tenure) || 0,
        firstPayment: values.firstPayment,
        maturity: newMaturity(values),
        penaltyRate: Number(values.penaltyRate) || 0,
        // Interest of the renewed contract only (a deferred-interest row is old interest).
        totalInterest: rows
          .filter(
            (r) => !(r.status === "Accrued" && !Number(r.principal_amount)),
          )
          .reduce((t, r) => t + (Number(r.interest_amount) || 0), 0),
        rows: rows.map((r) => ({
          date: r.payment_date,
          principal: Number(r.principal_amount) || 0,
          interest: Number(r.interest_amount) || 0,
          total: Number(r.total_payment) || 0,
        })),
      },
      getPdfPalette(theme),
      companyCurrency,
    );
  };

  const sendMutation = useMutation({
    mutationFn: async (pdf: Blob) => {
      const file = await uploadFile(
        new File([pdf], pdfName, { type: "application/pdf" }),
        1,
        pdfName,
      );
      await sendEmail({
        recipients: to.trim(),
        subject: subject.trim(),
        content: messageToHtml(message),
        send_me_a_copy: "0",
        doctype: "Custom Investor Flow",
        name: contract!.id,
        attachmentNames: [file.name],
      });
      return saveRenewalContract({
        id: contract!.id,
        payload: {
          to: to.trim(),
          subject: subject.trim(),
          message,
          file_id: file.name,
        },
      });
    },
    onSuccess: (record) => {
      onSent(record);
      openCommonModal({
        heading: "Renewal Contract Sent",
        subtitle: "",
        body: `The renewal contract was sent to ${to.trim()} successfully.`,
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

  if (!renewal) {
    return (
      <Alert variant="light" color="slate" radius="md">
        Save the renewal first; the renewal contract can then be viewed and
        sent.
      </Alert>
    );
  }

  const cancelled = renewal.renewal_status === "Cancelled";
  const canSend =
    !cancelled &&
    status !== "Paid" &&
    !!to.trim() &&
    !!subject.trim() &&
    !!message.trim() &&
    !!rows?.length;

  return (
    <>
      <SectionBox
        title="Contract email"
        titleAddon={
          <Badge
            variant="light"
            color={STATUS_COLOR[status] ?? "slate"}
            radius="sm"
            style={{ textTransform: "none" }}
          >
            {status}
          </Badge>
        }
        actions={
          !cancelled &&
          status !== "Paid" && (
            <Button
              size="sm"
              radius="xl"
              color="brand"
              leftSection={<IconSend size={14} />}
              disabled={!canSend}
              loading={sendMutation.isPending}
              onClick={() => {
                const doc = buildPdf();
                if (doc && canSend) sendMutation.mutate(doc.output("blob"));
              }}
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
            value={to}
            error={!to ? "This investor has no email." : undefined}
          />
          <TextInput
            label="Subject"
            size="sm"
            radius="md"
            required={!cancelled}
            readOnly={cancelled || status === "Paid"}
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
          />
        </SimpleGrid>
        <Textarea
          label="Message"
          size="sm"
          radius="md"
          mt="sm"
          required={!cancelled}
          readOnly={cancelled || status === "Paid"}
          autosize
          minRows={3}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />
        {!rows?.length && (
          <Text fz="xs" c="warning.7" mt="xs">
            The schedule is needed for the contract; check the Schedule tab.
          </Text>
        )}
      </SectionBox>

      <SectionBox
        title="Renewal agreement"
        actions={
          <Group gap="xs">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              leftSection={<IconEye size={14} />}
              disabled={!rows?.length}
              onClick={() => {
                const doc = buildPdf();
                if (doc)
                  pdfPreview.open(
                    doc,
                    `Renewal Agreement - ${contract?.id}`,
                    pdfName,
                  );
              }}
            >
              View contract
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              leftSection={<IconDownload size={14} />}
              disabled={!rows?.length}
              onClick={() => buildPdf()?.save(pdfName)}
            >
              Download PDF
            </Button>
          </Group>
        }
      >
        <Text fz="sm" c="slate.6">
          The agreement shows the contract in force, how it is renewed (
          {values.structure || "-"}), the renewed terms and the new repayment
          schedule.
        </Text>
      </SectionBox>

      {pdfPreview.modal}
    </>
  );
}
