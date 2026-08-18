export interface BaseArrearParams {
  company?: string;
  as_on_date?: string; 
  loan_account?: string;
  branch?: string;
  loan_product?: string;
  customer?: string;
  arrear_bucket?: string;
  dpd_from?: number;
  dpd_to?: number;
  include_written_off?: number;
}

export interface GetTopOverdueAccountsParams extends BaseArrearParams {
  page?: number;
  page_size?: number;
}

export interface ArrearSummary {
  total_accounts: number;
  total_overdue: number;
  current_amount: number;
  overdue_amount: number;
  written_off_amount: number;
  current_pct: number;
  overdue_pct: number;
  written_off_pct: number;
}

export interface AgingDistributionItem {
  label: string;
  amount: number;
  pct: number;
}

export interface OverdueByProductItem {
  product: string;
  amount: number;
}

export interface OverdueTrendItem {
  period: string; 
  amount: number;
}

export interface ArrearCharts {
  aging_distribution: AgingDistributionItem[];
  overdue_by_product: OverdueByProductItem[];
  overdue_trend: OverdueTrendItem[];
}

export interface ArrearInsights {
  highest_overdue_bucket: {
    label: string;
    amount: number;
  };
  increase_in_overdue: {
    pct: number;
    trend: string;
  };
  overdue_concentration: {
    accounts: number;
    pct: number;
  };
  written_off_percentage: {
    pct: number;
  };
}

export interface OverdueAccountRow {
  loan_account: string;
  customer_name: string;
  branch: string;
  loan_product: string;
  days_past_due: number;
  arrear_bucket: string;
  overdue_emi: number;
  overdue_amount: number;
  current_amount: number;
  total_outstanding: number;
  written_off_amount: number;
}