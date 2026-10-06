import { Alert, Button, Group, Select, Text, useMantineTheme } from "@mantine/core";
import { IconDownload, IconEye } from "@tabler/icons-react";
import { usePdfPreview } from "./PdfPreviewModal";
import { buildContractPdf, getPdfPalette } from "./Investmentpdf";
import {
  CUSTOMERS,
  PRODUCTS,
  DocumentPaper,
  KeyValueList,
  KpiGrid,
  SectionBox,
  Tag,
  buildNumber,
  fmtDate,
  inr,
  type SignMethod,
  type TabProps,
} from "./InvestorModalShared";

interface ContractGenerationProps extends TabProps {
  existingCount: number;
}

export function ContractGeneration({
  state,
  update,
  schedule,
  existingCount,
}: ContractGenerationProps) {
  const customer = CUSTOMERS[state.customerIndex];
  const product = PRODUCTS[state.productIndex];
  const status = state.contractStatus;
  const statusColor =
    status === "Executed" ? "success" : status === "Not generated" ? "brand" : "warning";

  const theme = useMantineTheme();
  const pdfPreview = usePdfPreview();
  const pdfName = `${state.contractNo}.pdf`;

  const buildPdf = () => {
    if (!schedule || !customer || !product) return null;
    return buildContractPdf(
      {
        contractNo: state.contractNo,
        issuedOn: new Date(),
        status: state.contractStatus,
        signMethod: state.signMethod,
        customer,
        productName: product.name,
        amount: state.amount,
        rate: state.rate,
        frequency: state.frequency,
        firstRepayment: state.firstRepayment,
        maturity: state.maturity,
        penaltyApplicable: state.penaltyApplicable,
        penaltyRate: state.penaltyRate,
        totalMonths: schedule.totalMonths,
        totalInterest: schedule.totalInterest,
        rows: schedule.rows,
      },
      getPdfPalette(theme),
    );
  };

  const handleViewPdf = () => {
    const doc = buildPdf();
    if (doc) pdfPreview.open(doc, `Investment Agreement - ${state.contractNo}`, pdfName);
  };

  const handleDownloadPdf = () => buildPdf()?.save(pdfName);

  return (
    <>
      {schedule && (
        <KpiGrid
          items={[
            {
              label:
                state.frequency === "At maturity"
                  ? "Interest payout"
                  : "Payout per instalment (interest)",
              value: inr(schedule.perPayment),
              color: "info",
            },
            { label: "Interest rate", value: `${state.rate}% p.a.`, color: "warning" },
            { label: "Tenure", value: `${schedule.totalMonths} months`, color: "brand" },
            {
              label: "Total repayment",
              value: inr(state.amount + schedule.totalInterest),
              color: "success",
            },
          ]}
        />
      )}

      <SectionBox
        title="Investment agreement"
        titleAddon={<Tag label={status} color={statusColor} />}
        actions={
          <>
            {status !== "Not generated" && status !== "Executed" && (
              <Select
                size="sm"
                radius="md"
                w={170}
                allowDeselect={false}
                data={["E-signature", "Physical signature"]}
                value={state.signMethod}
                onChange={(v) => v && update({ signMethod: v as SignMethod })}
              />
            )}
            {status === "Not generated" && (
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={() =>
                  update({
                    contractNo: buildNumber("CON", existingCount),
                    contractStatus: "Generated",
                  })
                }
              >
                Generate contract
              </Button>
            )}
            {status === "Generated" && (
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={() => update({ contractStatus: "Signing in progress" })}
              >
                Send for signing
              </Button>
            )}
            {status === "Signing in progress" && (
              <Button
                size="sm"
                radius="xl"
                color="success"
                onClick={() => update({ contractStatus: "Executed" })}
              >
                Mark as executed
              </Button>
            )}
            {status === "Executed" && <Tag label={state.signMethod} color="success" />}
          </>
        }
      />

      {status === "Not generated" ? (
        <Alert variant="light" color="brand" radius="md">
          Generate the contract from the approved terms. The investor’s signature is
          needed before funds are accepted.
        </Alert>
      ) : (
        schedule &&
        customer &&
        product && (
          <>
            <Group justify="flex-end" gap="xs" mb="sm">
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
            </Group>
            <DocumentPaper>
            <Text ta="center" fw={700} fz="md" c="slate.8">
              Investment Agreement
            </Text>
            <Text ta="center" fz="sm" c="slate.5" mb="md">
              Contract No. {state.contractNo} · {fmtDate(new Date())}
            </Text>
            <Text fz="sm" c="slate.8" mb="sm">
              Between the Company (NBFC) and{" "}
              <Text span fw={700}>
                {customer.name}
              </Text>{" "}
              ({customer.id}), the Investor, for the product{" "}
              <Text span fw={700}>
                {product.name}
              </Text>
              .
            </Text>
            <KeyValueList
              rows={[
                { label: "Investment amount", value: inr(state.amount) },
                { label: "Interest rate", value: `${state.rate}% p.a.` },
                { label: "Repayment frequency", value: state.frequency },
                { label: "First repayment date", value: fmtDate(state.firstRepayment) },
                { label: "Maturity date", value: fmtDate(state.maturity) },
                { label: "Number of payments", value: schedule.count },
                {
                  label: "Total repayment",
                  value: inr(state.amount + schedule.totalInterest),
                },
                {
                  label: "Penalty",
                  value: state.penaltyApplicable
                    ? `Delayed payouts attract ${state.penaltyRate}% p.a.`
                    : "Not applicable",
                },
              ]}
            />
            <Text fz="sm" c="slate.5" mt="md">
              Principal is returned on the maturity date together with the final
              interest payment.
            </Text>
          </DocumentPaper>
          </>
        )
      )}

      {pdfPreview.modal}
    </>
  );
}