import API from "../../config/api";
import apiClient from "../../config/axios";
import type {
  FundRecordListParams,
  FundRecordListResponse,
  InvestorFundRow,
  InvestorFund,
  InvestorFundListParams,
  InvestorFundListResponse,
  RecordFundAccounts,
  RecordFundPayload,
  InvestorMaturity,
  InvestorMaturityListParams,
  InvestorMaturityListResponse,
  InvestorRenewalTerms,
  InvestorSettings,
  InvestorSettingsAccounts,
  InvestorBankAccount,
  InvestorEarning,
  InvestorEarningListParams,
  InvestorEarningListResponse,
  InvestorEarningUpdatePayload,
  InvestorFlowEnvelope,
  InvestorFlowListParams,
  InvestorFlowListResponse,
  InvestorFlowPayload,
  InvestorFlowRecord,
  InvestorFlowSaveContractPayload,
  InvestorFlowSaveContractResult,
  InvestorFlowSchedule,
  InvestorFlowStatus,
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

export interface SendEmailParams {
  recipients: string;
  content: string;
  send_me_a_copy: "0" | "1";
  subject: string;
  cc?: string;
  bcc?: string;
  /** Reference document; only sent when it exists. */
  doctype?: string;
  name?: string;
  /** File IDs to attach. */
  attachmentNames?: string[];
}

export interface SendEmailResponse {
  message: unknown;
}

/** Sends an email with Frappe's frappe.core.doctype.communication.email.make. */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  const formData = new FormData();
  formData.append("recipients", params.recipients);
  if (params.doctype && params.name) {
    formData.append("doctype", params.doctype);
    formData.append("name", params.name);
  }
  formData.append("subject", params.subject);
  formData.append("send_email", "1");
  formData.append("content", params.content);
  formData.append("send_me_a_copy", params.send_me_a_copy);
  if (params.cc) formData.append("cc", params.cc);
  if (params.bcc) formData.append("bcc", params.bcc);
  formData.append("use_default_print_format", "1");
  formData.append("attachments", JSON.stringify(params.attachmentNames ?? []));
  formData.append("print_language", "en");
  formData.append("add_css", "1");

  const { data } = await apiClient.post<SendEmailResponse>(API.Email.send_email, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** Saves the emailed contract (To, Subject, File) and sets Contract Status to Sent. */
export async function saveContract({
  id,
  payload,
}: {
  id: string;
  payload: InvestorFlowSaveContractPayload;
}) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFlowSaveContractResult>>(
    API.investorFlow.saveContract,
    payload,
    { params: { id } },
  );
  return data.message.data;
}


/** Paid From options: the investor's Bank Accounts (Party Type Customer, Party = investor). */
export async function getInvestorBankAccounts(investor: string) {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorBankAccount[]>>(
    API.investorFlow.getInvestorBankAccounts,
    { params: { investor } },
  );
  return data.message.data;
}

/* --------------------------- Earning & Settlement --------------------------- */

export async function getInvestorEarnings(params: InvestorEarningListParams = {}) {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.investment_product?.length) {
    query.investment_product = JSON.stringify(params.investment_product);
  }
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;

  const { data } = await apiClient.get<InvestorEarningListResponse>(API.investorFlow.getEarnings, {
    params: query,
  });
  return data;
}

export async function getInvestorEarningById(id: string) {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorEarning>>(
    API.investorFlow.getEarningById,
    { params: { id } },
  );
  return data.message.data;
}

/** Saves the edited Earning & Settlement details and schedule rows. */
export async function updateInvestorEarning({
  id,
  payload,
}: {
  id: string;
  payload: InvestorEarningUpdatePayload;
}) {
  const { data } = await apiClient.put<InvestorFlowEnvelope<InvestorEarning>>(
    API.investorFlow.updateEarning,
    payload,
    { params: { id } },
  );
  return data.message.data;
}


/** Pays one schedule row (posts the payout Journal Entry) and returns the updated earning. */
export async function payInvestorEarningRow({
  id,
  row,
  paymentDate,
}: {
  id: string;
  row: string;
  paymentDate?: string;
}) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorEarning>>(
    API.investorFlow.payEarningRow,
    { row, ...(paymentDate && { payment_date: paymentDate }) },
    { params: { id } },
  );
  return data.message.data;
}

/** Maturity: all rows Paid -> Status Matured. */
export async function closeInvestorFlow(id: string) {
  const { data } = await apiClient.post<
    InvestorFlowEnvelope<{ id: string; status: InvestorFlowStatus }>
  >(API.investorFlow.close, {}, { params: { id } });
  return data.message.data;
}

/* ------------------------- Custom Investor Settings ------------------------- */

export async function getInvestorSettings() {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorSettings>>(
    API.investorFlow.getSettings,
  );
  return data.message.data;
}

export async function updateInvestorSettings(payload: InvestorSettingsAccounts) {
  const { data } = await apiClient.put<InvestorFlowEnvelope<InvestorSettings>>(
    API.investorFlow.updateSettings,
    payload,
  );
  return data.message.data;
}

/* --------------------------------- Maturity --------------------------------- */

export async function getInvestorMaturities(params: InvestorMaturityListParams) {
  const query: Record<string, string | number> = { view: params.view };
  if (params.search) query.search = params.search;
  if (params.investment_product?.length) {
    query.investment_product = JSON.stringify(params.investment_product);
  }
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;

  const { data } = await apiClient.get<InvestorMaturityListResponse>(API.investorFlow.getMaturities, {
    params: query,
  });
  return data;
}

export async function getInvestorMaturityById(id: string) {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorMaturity>>(
    API.investorFlow.getMaturityById,
    { params: { id } },
  );
  return data.message.data;
}

/** Pays everything still owed and closes the investment as Matured. */
export async function redeemInvestorFlow(id: string) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorMaturity>>(
    API.investorFlow.redeem,
    {},
    { params: { id } },
  );
  return data.message.data;
}

/** Pays the interest owed and carries the principal into a new Draft investment. */
export async function renewInvestorFlow({ id, terms }: { id: string; terms: InvestorRenewalTerms }) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorMaturity>>(
    API.investorFlow.renew,
    terms,
    { params: { id } },
  );
  return data.message.data;
}

/* -------------------------------- Record Fund -------------------------------- */

export async function getInvestorFunds(params: InvestorFundListParams = {}) {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.status?.length) query.status = JSON.stringify(params.status);
  if (params.fund_status?.length) query.fund_status = JSON.stringify(params.fund_status);
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;

  const { data } = await apiClient.get<InvestorFundListResponse>(API.investorFlow.getFunds, {
    params: query,
  });
  return data;
}

export async function getInvestorFundById(id: string) {
  const { data } = await apiClient.get<InvestorFlowEnvelope<InvestorFund>>(API.investorFlow.getFundById, {
    params: { id },
  });
  return data.message.data;
}

/** Paid from (Investor Creditor GL) and Paid to per Mode of Payment, from Investor Settings. */
export async function getRecordFundAccounts() {
  const { data } = await apiClient.get<InvestorFlowEnvelope<RecordFundAccounts>>(
    API.investorFlow.getRecordFundAccounts,
  );
  return data.message.data;
}

/** Saves a fund received from the investor as a Draft record (no accounting yet). */
export async function addFundRecord({ id, payload }: { id: string; payload: RecordFundPayload }) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFundRow>>(
    API.investorFlow.addFundRecord,
    payload,
    { params: { id } },
  );
  return data.message.data;
}

/** Edits a Draft fund record. */
export async function updateFundRecord({
  id,
  record,
  payload,
}: {
  id: string;
  record: string;
  payload: RecordFundPayload;
}) {
  const { data } = await apiClient.put<InvestorFlowEnvelope<InvestorFundRow>>(
    API.investorFlow.updateFundRecord,
    payload,
    { params: { id, record } },
  );
  return data.message.data;
}

/** Deletes a Draft fund record. */
export async function deleteFundRecord({ id, record }: { id: string; record: string }) {
  const { data } = await apiClient.delete(API.investorFlow.deleteFundRecord, { params: { id, record } });
  return data;
}

/** Approves a Draft fund record: posts its Journal Entry. */
export async function approveFundRecord({ id, record }: { id: string; record: string }) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFundRow>>(
    API.investorFlow.approveFundRecord,
    {},
    { params: { id, record } },
  );
  return data.message.data;
}

/** Cancels a fund record (an Approved one's Journal Entry is cancelled too). */
export async function cancelFundRecord({ id, record }: { id: string; record: string }) {
  const { data } = await apiClient.post<InvestorFlowEnvelope<InvestorFundRow>>(
    API.investorFlow.cancelFundRecord,
    {},
    { params: { id, record } },
  );
  return data.message.data;
}

export async function getFundRecords(params: FundRecordListParams = {}) {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.record_status?.length) query.record_status = JSON.stringify(params.record_status);
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;

  const { data } = await apiClient.get<FundRecordListResponse>(API.investorFlow.getFundRecords, {
    params: query,
  });
  return data;
}
