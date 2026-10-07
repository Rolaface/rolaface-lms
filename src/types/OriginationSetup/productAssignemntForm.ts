export interface CreateProductAssignmentPayload {
  rule_name?: string;
  priority?: number;
  sources: string[];
//   loan_types: string[];
loan_types: ("koua9dcaoi" | "en1hmqos06" | (string & {}))[];
  condition?: {
    join?: "AND" | "OR";
    groups: {
      id?: string | null;
      name?: string;
      join?: "AND" | "OR";
      clauses: {
        id?: string | null;
        variable: string;
        operator?: "=" | "<>" | ">" | ">=" | "<" | "<=" | "between";
        value: string | number;
        value2?: string | number;
      }[];
    }[];
  } | null;
  product: string;
  is_active?: number;
}

export interface CreateProductAssignmentResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      name: string;
      rule_name: string | null;
      priority: number;
      product: string;
      sources: string[];
      loan_types: string[];
      condition: {
        join: "AND" | "OR";
        groups: {
          id: string | null;
          name: string;
          join: "AND" | "OR";
          clauses: {
            id: string | null;
            variable: string;
            operator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "between";
            value: string;
            value2?: string;
          }[];
        }[];
      } | null;
      is_active: number;
      creation: string;
      modified: string;
      owner: string;
      modified_by: string;
      product_name: string;
      source_names: string[];
      loan_type_names: string[];
      has_condition: number;
    };
  };
}


export interface GetProductAssignmentsParams {
  page?: number;
  page_size?: number;
  search?: string;
  product?: string;
  source?: string;
  loan_type?: string;
  is_active?: number;
  has_condition?: number;
  ids?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ProductAssignmentSettings {
  several_match: "First match" | "Manual Review";
  no_match: "Manual Review" | "Default Product";
  default_product: Record<string, string>;
}
