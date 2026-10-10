import type { ComponentProps } from "react";
import { IconReportAnalytics } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { EarningsStatementsModal } from "./EarningsStatementModal";

export interface EarningsStatementsModalParams {
  /** Investor Flow ID. */
  investorFlowId: string;
  /** View (Eye) when true, edit (Pencil) when false. */
  readOnly?: boolean;
}

function getTitle(params: EarningsStatementsModalParams) {
  return params.readOnly ? "View Investor Payouts" : "Edit Investor Payouts";
}

export const earningsStatementsModal = createModal<EarningsStatementsModalParams, ComponentProps<typeof EarningsStatementsModal>>(
  "investorEarnings",
  EarningsStatementsModal,
  {
    icon: IconReportAnalytics,
    getTitle,
    buildProps: (params) => ({
      investorFlowId: params.investorFlowId,
      readOnly: params.readOnly ?? false,
    }),
  },
);
