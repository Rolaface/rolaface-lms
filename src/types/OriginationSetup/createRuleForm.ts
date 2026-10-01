export interface IncomeSource {
  name: string;
  recognition_pct: number;
  verification_required: boolean;
  included: boolean;
}

export interface ObligationSource {
  name: string;
  pct: number;
  verification_required: boolean;
  included: boolean;
}

export interface ScoreBand {
  grade: string;
  min_score: number;
  multiple: number;
  basis: string;
  decision: string;
}

export interface CollateralItem {
  type: string;
  haircut_pct: number;
  max_ltv_pct: number;
}

export interface FormulaParams {
  other_income_recognition: number;
  salary_multiple: number;
  max_emi_ratio: number;
  max_dti_ratio: number;
  affordability_buffer: number;
  product_max: number;
}

export interface HardStop {
  factor: string;
  operator: string;
  value: string;
}

export interface ManualReview {
  factor: string;
  operator: string;
  value1: string;
  value2: string;
}

export interface CreateEligibilityRulePayload {
  rule_name: string;
  loan_product: string;
  effective_from: string;
  effective_to: string | null;
  income_sources: IncomeSource[];
  obligation_sources: ObligationSource[];
  credit_bands: ScoreBand[];
  internal_bands: ScoreBand[];
  collateral_items: CollateralItem[];
  formula_params: FormulaParams;
  hard_stops: HardStop[];
  manual_reviews: ManualReview[];
}


export interface IncomeSource {
  name: string;
  recognition_pct: number;
  verification_required: boolean;
  included: boolean;
}

export interface ObligationSource {
  name: string;
  pct: number;
  verification_required: boolean;
  included: boolean;
}

export interface ScoreBand {
  grade: string;
  min_score: number;
  multiple: number;
  basis: string;
  decision: string;
}

export interface CollateralItem {
  type: string;
  haircut_pct: number;
  max_ltv_pct: number;
}

export interface FormulaParams {
  other_income_recognition: number;
  salary_multiple: number;
  max_emi_ratio: number;
  max_dti_ratio: number;
  affordability_buffer: number;
  product_max: number;
}

export interface HardStop {
  factor: string;
  operator: string;
  value: string;
}

export interface ManualReview {
  factor: string;
  operator: string;
  value1: string;
  value2: string;
}

// The detailed data object for a single rule
export interface EligibilityRuleDetail {
  name: string;
  rule_name: string;
  loan_product: string;
  version: string;
  status: string; // e.g., "Draft", "Active"
  effective_from: string;
  effective_to: string | null;
  modified: string;
  modified_by: string;
  income_sources: IncomeSource[];
  obligation_sources: ObligationSource[];
  credit_bands: ScoreBand[];
  internal_bands: ScoreBand[];
  collateral_items: CollateralItem[];
  formula_params: FormulaParams;
  hard_stops: HardStop[];
  manual_reviews: ManualReview[];
  owner: string;
  creation: string;
  draft_id: string | null;
  product_name: string;
}

// The full API response wrapper
export interface GetEligibilityRuleByIdResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: EligibilityRuleDetail;
  };
}