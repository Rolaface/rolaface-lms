import type { ComponentProps } from "react";
import { IconHourglass } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { MaturityModal } from "./MaturityModal";

export interface MaturityModalParams {
  /** Investor Flow ID. */
  investorFlowId: string;
  /** View only (no Redeem / Renew). */
  readOnly?: boolean;
}

function getTitle(params: MaturityModalParams) {
  return params.readOnly ? "View Maturity" : "Maturity";
}

export const maturityModal = createModal<
  MaturityModalParams,
  ComponentProps<typeof MaturityModal>
>("investorMaturity", MaturityModal, {
  icon: IconHourglass,
  getTitle,
  buildProps: (params) => ({
    investorFlowId: params.investorFlowId,
    readOnly: params.readOnly ?? false,
  }),
});
