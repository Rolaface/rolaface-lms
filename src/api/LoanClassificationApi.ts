// src/api/loanClassificationApi.ts
import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  LoanClassificationData,
  LoanClassificationApiPayload,
  LoanClassificationApiResponse,
} from "../types/loanClassification";

// --- Mappers: UI shape (snake_case) <-> backend shape (camelCase) ---

function toApiPayload(data: LoanClassificationData): LoanClassificationApiPayload {
  return {
    level: data.level,
    classificationCode: data.code,
    classificationName: data.name,
    minDpdRange: data.min_dpd_range,
    maxDpdRange: data.max_dpd_range,
    provisionRate: data.provision_rate,
    isWrittenOff: data.is_written_off,
  };
}

function fromApiRecord(record: any): LoanClassificationData {
  return {
    level: record.level,
    code: record.classificationCode ?? "",
    name: record.classificationName ?? "",
    min_dpd_range: record.minDpdRange ?? null,
    max_dpd_range: record.maxDpdRange ?? null,
    provision_rate: record.provisionRate ?? 0,
    is_written_off: record.isWrittenOff ?? false,
  };
}

export async function createLoanClassification(payload: LoanClassificationData) {
  const { data } = await apiClient.post<LoanClassificationApiResponse>(
    API.loanClassification.create,
    toApiPayload(payload)
  );
  return data;
}

// New: shape returned to the component — data + pagination meta,
// instead of a bare array, so the table can drive backend pagination.
export interface LoanClassificationListResult {
  data: LoanClassificationData[];
  pagination: {
    total: number;
    total_pages: number;
  };
}

export async function getAllLoanClassifications(params?: {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}): Promise<LoanClassificationListResult> {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.sort_by) cleanParams.sort_by = params.sort_by;
  if (params?.sort_order) cleanParams.sort_order = params.sort_order;
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;

  const { data } = await apiClient.get<LoanClassificationApiResponse>(
    API.loanClassification.getAll,
    { params: cleanParams }
  );
  const records = Array.isArray(data?.data) ? data.data : [];

  return {
    data: records.map(fromApiRecord),
    // NOTE: adjust these keys to match whatever your backend actually
    // returns for pagination meta (e.g. it might be data.pagination.total,
    // data.total, data.total_count, etc). Check the real response shape.
    pagination: {
      total: (data as any)?.pagination?.total ?? records.length,
      total_pages: (data as any)?.pagination?.total_pages ?? 1,
    },
  };
}

export async function getLoanClassificationById(
  id: string
): Promise<LoanClassificationData | null> {
  const { data } = await apiClient.get<LoanClassificationApiResponse>(
    API.loanClassification.getById,
    { params: { id } }
  );
  return data?.data ? fromApiRecord(data.data) : null;
}

export async function updateLoanClassification(
  id: string,
  payload: LoanClassificationData
) {
  const { data } = await apiClient.put<LoanClassificationApiResponse>(
    API.loanClassification.update,
    toApiPayload(payload),
    { params: { id } }
  );
  return data;
}

export async function deleteLoanClassification(id: string) {
  const { data } = await apiClient.delete<LoanClassificationApiResponse>(
    API.loanClassification.delete,
    { params: { id } }
  );
  return data;
}