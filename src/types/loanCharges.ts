export interface CreateFeeAndChargePayload {
  item_code: string;
  item_group: string;
}


export interface CreateFeeAndChargeResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}

 export interface FeeAndChargeItem {
   name: string;
   item_code: string;
  item_name: string;
   item_group: string;
  disabled: 0 | 1;
  creation: string;
   [key: string]: unknown;
 }

export interface FeeAndChargePagination {
  page: number;
 page_size: number;
 total: number;
  total_pages: number;
 has_next: boolean;
 has_prev: boolean;
}

 export interface GetFeeAndChargesResponse {

  status_code: number;
  status: string;
  message: string;
 data: FeeAndChargeItem[];
  pagination: FeeAndChargePagination;
 }