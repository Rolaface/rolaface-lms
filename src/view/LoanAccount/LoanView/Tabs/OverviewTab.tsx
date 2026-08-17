import { Paper, Text } from "@mantine/core";
import { OverviewField, SectionHeading, serif } from "../SharedUI";
import { LoanInstallmentOverview } from "../LoanInstallmentOverview";
import { HistoryTab } from "./HistoryTab";
import { AccountingTab } from "./AccountingTab";
import { DisbursementTab } from "./DisbursementTab";
import { CollateralTab } from "./CollateralTab";
import { DocumentsTab } from "./DocumentsTab";

export function OverviewTab({ data, renderCurrency, actions }: any) {
  const { overview } = data;

  const principal = overview.outstanding_principal || 0;
  const interest =
    overview.demands?.find((d: any) => d.type === "Interest")?.outstanding || 0;
  const penalty =
    overview.demands?.find((d: any) => d.type === "Penalty")?.outstanding || 0;

  return (
    <div className="flex flex-col gap-5">
      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{
          border: "1px solid #ECE8DD",
          boxShadow: "0 3px 14px rgba(36,31,61,0.06)",
        }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <Text fz="lg" fw={600} c="gray.9" style={serif}>
            Loan overview
          </Text>
          <Text fz="xs" c="dimmed">
            Core terms &amp; current standing
          </Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
          <OverviewField label="LOAN NUMBER" value={overview.name} />
          <OverviewField label="PRODUCT" value={overview.loan_product} />
          <OverviewField label="LOAN STATUS" value={overview.status} />
          <OverviewField
            label="ORIGINAL AMOUNT"
            value={renderCurrency(overview.loan_amount)}
          />
          <OverviewField
            label="DISBURSED AMOUNT"
            value={renderCurrency(overview.disbursed_amount)}
          />
          <OverviewField
            label="OUTSTANDING PRINCIPAL"
            value={renderCurrency(principal)}
          />
          <OverviewField
            label="OUTSTANDING INTEREST"
            value={renderCurrency(interest)}
          />
          <OverviewField
            label="OUTSTANDING PENALTY"
            value={renderCurrency(penalty)}
          />
          <OverviewField
            label="REPAYMENT FREQUENCY"
            value={overview.repayment_frequency}
          />
          <OverviewField
            label="LOAN TENURE"
            value={`${overview.repayment_periods} months`}
          />
          <OverviewField
            label="REMAINING TENURE"
            value={`${overview.remaining_tenure} months`}
          />
          <OverviewField label="LOAN OFFICER" value={overview.owner} />
        </div>
      </Paper>

      {data.disbursements.length > 0 && (
        <>
          {/* <SectionHeading title="Disbursement" /> */}
          <DisbursementTab
            data={data.disbursements.slice(0, 5)}
            hidePagination
            renderCurrency={renderCurrency}
          />
        </>
      )}

      {data.timeline.length > 0 && (
        <>
          <SectionHeading
            title="Repayment schedule"
            aside="Tap any installment for the full breakdown"
          />
          <LoanInstallmentOverview
            data={data}
            renderCurrency={renderCurrency}
            actions={actions}
          />
        </>
      )}

      {data.history.length > 0 && (
        <>
          {/* <SectionHeading title="Recent Repayments" /> */}
          <HistoryTab
            data={data.history.slice(0, 5)}
            hidePagination
            renderCurrency={renderCurrency}
          />
        </>
      )}

      {data.collateral.length > 0 && (
        <>
          <SectionHeading title="Collaterals" />
          <CollateralTab
            data={data.collateral.slice(0, 5)}
            hidePagination
            renderCurrency={renderCurrency}
          />
        </>
      )}
      {data.documents.length > 0 && (
        <>
          <SectionHeading title="Documents" />
          <DocumentsTab
            data={data.documents.slice(0, 5)}
            hidePagination
            renderCurrency={renderCurrency}
          />
        </>
      )}
      {data.accounting.length > 0 && (
        <>
          <SectionHeading title="Accounting" />
          <AccountingTab
            data={data.accounting.slice(0, 5)}
            hidePagination
            renderCurrency={renderCurrency}
          />
        </>
      )}
    </div>
  );
}
