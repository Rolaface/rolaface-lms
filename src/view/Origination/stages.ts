import { loanApplicationModal } from "../../components/Modal/LoanApplication/loanApplicationModalStore";
import { preScreeningModal } from "../../components/Modal/PreScreeningModal/preScreeningModalStore";
import { enrichmentModal } from "../../components/Modal/Enrichment/enrichmentModalStore";
import { underwritingModal } from "../../components/Modal/UnderwritingModal/underwritingModalStore";
import { offerModal } from "../../components/Modal/OfferSigning/offerSigningModalStore";

export interface OriginationStage {
  workflowState: string;
  title: string;
  subtitle: string;
  canCreate?: boolean;
  openModal: (loanApplicationId: string, readOnly: boolean) => void;
}

export type OriginationStageKey = "application" | "prescreening" | "appraisal" | "underwriting" | "offer";

export const ORIGINATION_STAGES: Record<OriginationStageKey, OriginationStage> = {
  application: {
    workflowState: "Draft",
    title: "Loan Applications",
    subtitle: "Draft applications waiting to be sent for pre-screening",
    canCreate: true,
    openModal: (loanApplicationId, readOnly) => loanApplicationModal.open({ loanApplicationId, readOnly }),
  },
  prescreening: {
    workflowState: "Pre-Screening",
    title: "Pre-screening",
    subtitle: "Applications in pre-screening",
    openModal: (loanApplicationId, readOnly) => preScreeningModal.open({ loanApplicationId, readOnly }),
  },
  appraisal: {
    workflowState: "Appraisal",
    title: "Loan Appraisal",
    subtitle: "Applications in loan appraisal",
    openModal: (loanApplicationId, readOnly) => enrichmentModal.open({ loanApplicationId, readOnly }),
  },
  underwriting: {
    workflowState: "Underwriting",
    title: "Underwriting",
    subtitle: "Applications in underwriting",
    openModal: (loanApplicationId, readOnly) => underwritingModal.open({ loanApplicationId, readOnly }),
  },
  offer: {
    workflowState: "Offer",
    title: "Offer Issuance",
    subtitle: "Applications at offer issuance",
    openModal: (loanApplicationId, readOnly) => offerModal.open({ loanApplicationId, readOnly }),
  },
};
