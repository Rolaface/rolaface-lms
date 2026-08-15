export interface DashboardSummary {
  total_loans: number;
  active_customers: number;
  total_disbursed: number;
  pending_applications: number;
}

export interface CollectionEfficiency {
  rate_pct: number;
  collected: number;
  demand: number;
  outstanding: number;
}

export interface NPA {
  gross_npa_pct: number;
  net_npa_pct: number;
  gross_npa_amount: number;
  net_npa_amount: number;
}

export interface PortfolioClassification {
  label: string;
  code: string;
  amount: number;
  provision_amount: number;
  pct: number;
}

export interface DashboardCharts {
  collection_efficiency: CollectionEfficiency;
  npa: NPA;
  portfolio_classification: {
    total_portfolio: number;
    classifications: PortfolioClassification[];
  };
  disbursement_vs_collection_trend: {
    period: string;
    disbursement: number;
    collection: number;
  }[];
}

export interface QuickInsights {
  top_loan_product: {
    loan_product: string;
    amount: number;
    pct_of_total: number;
  } | null;
  highest_disbursement: {
    amount: number;
    month_label: string;
  } | null;
  avg_approval_time: string | null;
  overdue_loans: {
    amount: number;
    pct_of_total: number;
  };
  active_agents: number | null;
}

export interface PendingApprovalRow {
  application_id: string;
  customer_name: string;
  loan_product: string;
  amount: number;
  current_stage: string;
  pending_since: string;
}

export interface OverdueTaskRow {
  loan_account: string;
  customer_name: string;
  days_past_due: number;
  amount_overdue: number;
  next_action: string;
  priority: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}