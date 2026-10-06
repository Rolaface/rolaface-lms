import API from "../../config/api";
import apiClient from "../../config/axios";
import type {
  InvestorFlowEnvelope,
  InvestorFlowListParams,
  InvestorFlowListResponse,
  InvestorFlowPayload,
  InvestorFlowRecord,
  InvestorFlowSchedule,
  InvestorFlowStatusAction,
  InvestorFlowStatusResult,
  InvestorFlowTerms,
} from "../../types/Investor/investorFlow";

export async function getAllInvestorFlows(params: InvestorFlowListParams = {}) {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  // The backend reads a JSON array for the multi-value filters.
  if (params.investment_product?.length) {
    query.investment_product = JSON.stringify(params.investment_product);
  }
  if (params.status?.length) query.status = JSON.stringify(params.status);
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;

  const { data } = await apiClient.get<InvestorFlowListResponse>(API.investorFlow.getAll, {
    params: query,
  });
  return data;
}

export async function getInvestorFlowById(id: string) {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorFlowRecord>>(
    API.investorFlow.getById,
    { params: { id } },
  );
  return data.message.data;
}

export async function createInvestorFlow(payload: InvestorFlowPayload) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFlowRecord>>(
    API.investorFlow.create,
    payload,
  );
  return data.message.data;
}

export async function updateInvestorFlow({
  id,
  payload,
}: {
  id: string;
  payload: Partial<InvestorFlowPayload>;
}) {
  const { data } = await apiClient.put<InvestorFlowEnvelope<InvestorFlowRecord>>(
    API.investorFlow.update,
    payload,
    { params: { id } },
  );
  return data.message.data;
}

export async function deleteInvestorFlow(id: string) {
  const { data } = await apiClient.delete(API.investorFlow.delete, { params: { id } });
  return data;
}

export async function updateInvestorFlowStatus({
  id,
  action,
}: {
  id: string;
  action: InvestorFlowStatusAction;
}) {
  const { data } = await apiClient.put<InvestorFlowEnvelope<InvestorFlowStatusResult>>(
    API.investorFlow.updateStatus,
    {},
    { params: { id, action } },
  );
  return data.message.data;
}

/** Calculates the payout schedule for the terms; nothing is saved. */
export async function getInvestorFlowSchedule(terms: InvestorFlowTerms) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFlowSchedule>>(
    API.investorFlow.getSchedule,
    terms,
  );
  return data.message.data;
}
