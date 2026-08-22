export interface LoanClassificationData {
  level: number;
  code: string;
  name: string;
  min_dpd_range: number | null;
  max_dpd_range: number | null;
  provision_rate: number;
  is_written_off: boolean;
}

export interface LoanClassificationApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    total_pages: number;
  };
}

export interface LoanClassificationApiPayload {
  level?: number;
  classificationCode: string;
  classificationName: string;
  minDpdRange: number | null;
  maxDpdRange: number | null;
  provisionRate: number;
  isWrittenOff: boolean;
}