/** Fields of the Custom Investment Product doctype sent on create / update. */
export interface CreateInvestmentProductPayload {
  /** Unique; saved in UPPERCASE and cannot be changed after create. */
  product_code: string;
  product_name: string;
  product_description: string;
  /** Months; must be between minimum_tenure and maximum_tenure. */
  default_tenure: number;
  /** % p.a.; must be between min_interest_rate and maximum_interest_rate. */
  default_interest_rate: number;
  /** % p.a.; optional. */
  default_penalty_rate: number | null;
  payout_frequency: string;
  disabled: 0 | 1;
  min_interest_rate: number;
  maximum_interest_rate: number;
  minimum_investment: number;
  maximum_investment: number;
  minimum_tenure: number;
  maximum_tenure: number;
}

/** A Custom Investment Product as returned by the API. */
export interface InvestmentProductRecord extends CreateInvestmentProductPayload {
  name: string;
}

export interface CreateInvestmentProductResponse {
  status_code: string;
  status: string;
  message: string;
  data: InvestmentProductRecord;
}
