import type { ComponentProps } from "react";
import { IconCash } from "@tabler/icons-react";
import { createModal } from "../../../../store/modal store/createModal";
import { PayoutModal, type PayoutModalMode } from "./PayoutModal";

export interface PayoutModalParams {
  mode: PayoutModalMode;
  /** Investor Flow ID (edit / view). */
  investorFlowId?: string | null;
  /** Payout (row) ID (edit / view). */
  payoutName?: string | null;
}

const TITLES: Record<PayoutModalMode, string> = {
  add: "Add Payout",
  edit: "Edit Payout",
  view: "View Payout",
};

export const payoutModal = createModal<
  PayoutModalParams,
  ComponentProps<typeof PayoutModal>
>("investorPayout", PayoutModal, {
  icon: IconCash,
  getTitle: (params) => TITLES[params.mode],
  buildProps: (params) => ({
    mode: params.mode,
    investorFlowId: params.investorFlowId ?? null,
    payoutName: params.payoutName ?? null,
  }),
});
