import type { ComponentProps } from "react";
import { IconCash } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { RecordFundModal, type RecordFundMode } from "./RecordFundModal";

export interface RecordFundModalParams {
  mode: RecordFundMode;
  /** Investor Flow ID (edit / view). */
  investorFlowId?: string | null;
  /** Fund record (row) ID (edit / view). */
  recordName?: string | null;
}

const TITLES: Record<RecordFundMode, string> = {
  add: "Add Fund",
  edit: "Edit Fund",
  view: "View Fund",
};

export const recordFundModal = createModal<RecordFundModalParams, ComponentProps<typeof RecordFundModal>>(
  "investorRecordFund",
  RecordFundModal,
  {
    icon: IconCash,
    getTitle: (params) => TITLES[params.mode],
    buildProps: (params) => ({
      mode: params.mode,
      investorFlowId: params.investorFlowId ?? null,
      recordName: params.recordName ?? null,
    }),
  },
);
