import type { ComponentProps } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { createModal } from "../../../../store/modal store/createModal";
import { RenewalModal, type RenewalModalMode } from "./RenewalModal";

export interface RenewalModalParams {
  mode: RenewalModalMode;
  /** Investor Flow ID (edit / view). */
  investorFlowId?: string | null;
}

const TITLES: Record<RenewalModalMode, string> = {
  add: "Add Renewal",
  edit: "Edit Renewal",
  view: "View Renewal",
};

export const renewalModal = createModal<
  RenewalModalParams,
  ComponentProps<typeof RenewalModal>
>("investorRenewal", RenewalModal, {
  icon: IconRefresh,
  getTitle: (params) => TITLES[params.mode],
  buildProps: (params) => ({
    mode: params.mode,
    investorFlowId: params.investorFlowId ?? null,
  }),
});
