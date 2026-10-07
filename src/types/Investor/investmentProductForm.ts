export interface CreateInvestmentProductPayload {
   "product_name": string;
   "tenure": string;
   "minimum_investment": string;
   "interest_rate": string;
   "payout_frequency": string;
   "disabled": 0 | 1;
}

export interface CreateInvestmentProductResponse {
    status_code: string,
    status: string,
    message: string,
    data: {
    name: string;
     product_name: string,
     tenure: string,
    minimum_investment: string,
    interest_rate: string,
    payout_frequency: string,
    disabled: 0 | 1
  };
}