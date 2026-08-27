import type { AxiosResponse } from "axios";
import apiClient from "../../../config/axios";
import { LENDING_ENDPOINTS } from "../../../components/constants/setting/lendingConfig/lendingConfig.constants.ts";
import {
  DUMMY_GL_ACCOUNTS,
  DUMMY_LENDING_DEFAULTS,
  updateMockLendingDefaults,
} from "./lendingConfig.mock.ts";
import type {
  GLAccountOption,
  LendingDefaultsRaw,
  UpdateLendingDefaultsPayload,
  ApiEnvelope,
} from "../../../types/setting/lending_config/lendingConfig.types.ts";

const api = apiClient;

export async function getLendingDefaults(): Promise<LendingDefaultsRaw> {
  // Real Axios Call Scaffold:
  // const response: AxiosResponse<ApiEnvelope<LendingDefaultsRaw>> = await api.get(LENDING_ENDPOINTS.getDefaults);
  // return response.data.message.data;

  return new Promise((resolve) => {
    setTimeout(() => resolve(DUMMY_LENDING_DEFAULTS), 250);
  });
}

export async function getGLAccountsList(search?: string): Promise<GLAccountOption[]> {
  // Real Axios Call Scaffold:
  // const response: AxiosResponse<ApiEnvelope<GLAccountOption[]>> = await api.get(LENDING_ENDPOINTS.getGLAccounts, { params: { search } });
  // return response.data.message.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!search) return resolve(DUMMY_GL_ACCOUNTS);
      const filtered = DUMMY_GL_ACCOUNTS.filter((acc) =>
        acc.label.toLowerCase().includes(search.toLowerCase())
      );
      resolve(filtered);
    }, 200);
  });
}

export async function updateLendingDefaults(
  payload: UpdateLendingDefaultsPayload
): Promise<LendingDefaultsRaw> {
  // Real Axios Call Scaffold:
  // const response: AxiosResponse<ApiEnvelope<LendingDefaultsRaw>> = await api.post(LENDING_ENDPOINTS.updateDefaults, payload);
  // return response.data.message.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      const updated = updateMockLendingDefaults({
        auto_disbursement: payload.auto_disbursement,
        enable_topup: payload.enable_topup,
        same_as_interest: payload.same_as_interest,
        mappings: payload.mappings.map((m, idx) => ({
          id: String(idx + 1),
          transaction_type: m.transaction_type,
          interest_account: m.interest_account,
          penalty_account: m.penalty_account,
        })),
      });
      resolve(updated);
    }, 400);
  });
}