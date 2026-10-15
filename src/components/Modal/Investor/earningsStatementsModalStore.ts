import type { ComponentProps } from "react";
import { IconReportAnalytics } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import {
  EarningsStatementsModal,
  type AmendMode,
} from "./EarningsStatementModal";

export interface EarningsStatementsModalParams {
  /** create: pick an investment, then amend its schedule in use; edit: a Draft amendment; view: any amendment. */
  mode: AmendMode;
  /** Investor Flow ID (edit / view). */
  investorFlowId?: string;
  /** Amendment version (edit / view). */
  version?: number;
}

function getTitle(params: EarningsStatementsModalParams) {
  return params.mode === "create"
    ? "Create Amend"
    : params.mode === "edit"
      ? "Edit Amend"
      : "View Amend";
}

export const earningsStatementsModal = createModal<
  EarningsStatementsModalParams,
  ComponentProps<typeof EarningsStatementsModal>
>("investorEarnings", EarningsStatementsModal, {
  icon: IconReportAnalytics,
  getTitle,
  buildProps: (params) => ({
    mode: params.mode,
    investorFlowId: params.investorFlowId ?? null,
    version: params.version ?? null,
  }),
});
