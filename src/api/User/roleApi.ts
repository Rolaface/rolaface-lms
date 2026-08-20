import apiClient from "../../config/axios"; 
import { API } from "../../config/api";
import type { UserRoleFormData, PermissionEntry } from "../../types/User/userRole";

// ─── Create ───────────────────────────────────────────────────────────────

export interface CreateUserRoleResponse {
  message: {
    status: "success" | "error";
    data: { roleId: string };
  };
}

export async function createUserRoles(
  payload: UserRoleFormData
): Promise<CreateUserRoleResponse> {
  const { data } = await apiClient.post<CreateUserRoleResponse>(
    API.RoleManagement.createUserRoles,
    payload
  );
  return data;
}

// ─── List ─────────────────────────────────────────────────────────────────

export interface GetUserRolesResponse {
  status_code: number;
  status: "success" | "error";
  message: string;
  data: { Id: string; roleName: string; disabled: 0 | 1 }[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function getUserRoles(
  search?: string,
  page?: number,
  pageSize?: number
): Promise<GetUserRolesResponse> {
  const { data } = await apiClient.get<GetUserRolesResponse>(
    API.RoleManagement.getUserRoles,
    {
      params: {
        ...(search ? { search } : {}),
        ...(page ? { page } : {}),
        ...(pageSize ? { page_size: pageSize } : {}),
      },
    }
  );
  return data;
}

// ─── Get by id ────────────────────────────────────────────────────────────

export interface GetUserRoleByIdResponse {
  message: {
    status: "success" | "error";
    data: {
      roleId: string;
      roleName: string;
      permissions: PermissionEntry[];
    };
  };
}

export async function getUserRoleById(id: string): Promise<GetUserRoleByIdResponse> {
  const { data } = await apiClient.get<GetUserRoleByIdResponse>(
    API.RoleManagement.getUserRolesbyId,
    { params: { id } }
  );
  return data;
}

// ─── Update ───────────────────────────────────────────────────────────────

export async function updateUserRoles(
  id: string,
  payload: UserRoleFormData
): Promise<CreateUserRoleResponse> {
  const { data } = await apiClient.put<CreateUserRoleResponse>(
    API.RoleManagement.updateUserRoles,
    { role_id: id, permission: payload.permission }
  );
  return data;
}

// ─── Enable / disable ───────────────────────────────────────────────────────

export interface UpdateUserRoleStatusResponse {
  message: { status: "success" | "error"; data: string };
}

export async function updateUserRoleStatus(
  id: string,
  isDisabled: 0 | 1
): Promise<UpdateUserRoleStatusResponse> {
  const { data } = await apiClient.put<UpdateUserRoleStatusResponse>(
    API.RoleManagement.updateUserRolesStatus,
    { id, isDisabled }
  );
  return data;
}