import apiClient from "../../../config/axios";
import { LENDING_ENDPOINTS } from "../../../components/constants/setting/lendingConfig/lendingConfig.constants";
import type {
  ApiEnvelope,
  LendingDefaultsRaw,
} from "../../../types/setting/lending_config/lendingConfig.types";

/**
 * Read-only fetch of lending configuration defaults.
 * No update/POST call — this screen is entirely display-only.
 */
export async function getLendingDefaults(): Promise<LendingDefaultsRaw> {
  const response = await apiClient.get<ApiEnvelope<LendingDefaultsRaw>>(
    LENDING_ENDPOINTS.getDefaults
  );
  return response.data.message.data;
}