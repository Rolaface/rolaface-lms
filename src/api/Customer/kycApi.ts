import apiClient from "../../config/axios";

const api = apiClient;

export type KycCheckKey = "kyc" | "aml" | "sanctions" | "pep" | "fatca" | "crs";

// TODO: backend endpoint not ready — path + verb unconfirmed
export async function runKycCheck(
  customerId: string,
  key: KycCheckKey,
): Promise<{ key: KycCheckKey; status: string }> {
  const response = await api.post("TODO_ADD_API_KYC_RUN_CHECK", {
    customer_id: customerId,
    check: key,
  });
  return response.data;
}