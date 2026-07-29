// src/api/loanClassificationApi.ts
import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  LoanClassificationData,
  LoanClassificationApiPayload,
  LoanClassificationApiResponse,
} from "../types/loanClassification"

// --- Mappers: UI shape (snake_case) <-> backend shape (camelCase) ---

function toApiPayload(data: LoanClassificationData): LoanClassificationApiPayload {
  return {
    level: data.level,
    classificationCode: data.code,
    classificationName: data.name,
    minDpdRange: data.min_dpd_range,
    maxDpdRange: data.max_dpd_range,
    provisionRate: data.provision_rate,
    // isWrittenOff: data.is_written_off,
  };
}

function fromApiRecord(record: any): LoanClassificationData {
  return {
    level: record.level,
    code: record.classificationCode ?? record.code ?? "",
    name: record.classificationName ?? record.name ?? "",
    min_dpd_range: record.minDpdRange ?? record.min_dpd_range ?? null,
    max_dpd_range: record.maxDpdRange ?? record.max_dpd_range ?? null,
    provision_rate: record.provisionRate ?? record.provision_rate ?? 0,
    is_written_off: record.isWrittenOff ?? record.is_written_off ?? false,
  };
}

export async function createLoanClassification(payload: LoanClassificationData) {
  const { data } = await apiClient.post<LoanClassificationApiResponse>(
    API.loanClassification.create,
    toApiPayload(payload)
  );
  return data;
}

export async function getAllLoanClassifications(params?: {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}): Promise<LoanClassificationData[]> {
  const { data } = await apiClient.get<LoanClassificationApiResponse>(
    API.loanClassification.getAll,
    { params }
  );
  const records = Array.isArray(data?.data) ? data.data : [];
  return records.map(fromApiRecord);
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