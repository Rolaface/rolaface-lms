export interface CreateFeeAndChargePayload {
  item_code: string;
  item_group: string;
}

// Frappe whitelisted methods wrap the return value in `message`.
// Confirm this shape matches what your endpoint actually returns.
export interface CreateFeeAndChargeResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}