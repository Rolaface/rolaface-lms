export interface LoanClassificationData {
  level?: number;
  classificationCode: string;
  classificationName: string;
  minDpdRange: number | null;
  maxDpdRange: number | null;
  provisionRate: number;
}

export interface LoanClassificationApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
}