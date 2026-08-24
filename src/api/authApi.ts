import type { AxiosResponse } from "axios";
import apiClient from "../config/axios";
import { API } from "../config/api";

export interface LogoutResponse {
  message: {
    status: string;
    message: string | null;
    data: string;
  };
}

export async function logoutUser(): Promise<LogoutResponse> {
  const resp: AxiosResponse<LogoutResponse> = await apiClient.post(API.logout.logout);
  return resp.data;
}