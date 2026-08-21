import apiClient from "../../config/axios";
import { API } from "../../config/api";
import type { CreateUserFormData } from "../../types/User/createUser";


export interface LanguageOption {
  value: string;
  description: string;
  label: string;
}
export interface GetLanguagesResponse {
  message: LanguageOption[];
}

export async function getLanguages(search?: string): Promise<LanguageOption[]> {
  const { data } = await apiClient.get<GetLanguagesResponse>(API.RoleManagement.Language, {
    params: {
      txt: search ?? "",
      doctype: "Language",
      reference_doctype: "User",
      page_length: 20,
      link_fieldname: "language",
    },
  });
  return data.message ?? [];
}

function toUserParams(payload: CreateUserFormData): URLSearchParams {
  const params = new URLSearchParams();
  params.append("email", payload.email);
  params.append("username", payload.username);
  params.append("language", payload.language);
  params.append("firstName", payload.firstName);
  params.append("middleName", payload.middleName ?? "");
  params.append("lastName", payload.lastName ?? "");
  params.append("gender", payload.gender ?? "");
  params.append("phone", payload.phone ?? "");
  params.append("dob", payload.dob ?? "");
  params.append("timezone", payload.timezone ?? "");
  params.append("mobile_no", payload.mobile_no ?? "");
  params.append("roleIds", JSON.stringify(payload.roleIds));
  return params;
}

export interface CreateUserResponse {
  message: { status: "success" | "error"; data: string };
}

export async function createUser(payload: CreateUserFormData): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>(
    `${API.RoleManagement.createUser}?${toUserParams(payload).toString()}`
  );
  return data;
}


export interface UserRow {
  id: string;
  email: string;
  name: string;
  username: string;
  enabled: 0 | 1;
  creation: string;
}
export interface GetUsersResponse {
  status_code: number;
  status: "success" | "error";
  message: string;
  data: UserRow[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function getUsers(
  search?: string,
  page = 1,
  pageSize = 10
): Promise<GetUsersResponse> {
  const { data } = await apiClient.get<GetUsersResponse>(API.RoleManagement.getUser, {
    params: { search: search || undefined, page, page_size: pageSize },
  });
  return data;
}



export interface GetUserByIdResponse {
  message: {
    status: "success" | "error";
    data: {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      middleName: string;
      email: string;
      gender: string;
      username: string;
      language: string;
      timezone: string;
      dob: string | null;
      phone: string;
      mobile_no: string | null;
      roles: string[];
    };
  };
}

export async function getUserById(id: string): Promise<GetUserByIdResponse> {
  const { data } = await apiClient.get<GetUserByIdResponse>(API.RoleManagement.getUserbyId, {
    params: { id },
  });
  return data;
}



export async function updateUser(
  id: string,
  payload: CreateUserFormData
): Promise<CreateUserResponse> {
  const params = toUserParams(payload);
  params.append("id", id);
  const { data } = await apiClient.put<CreateUserResponse>(
    `${API.RoleManagement.updateUser}?${params.toString()}`
  );
  return data;
}



export async function deleteUser(id: string): Promise<unknown> {
  const { data } = await apiClient.post(API.RoleManagement.deleteUser, {
    name: id,
    doctype: "User",
  });
  return data;
}

export interface GenderOption {
  label: string;
  value: string;
}

export async function getAllGenders(): Promise<GenderOption[]> {
  const { data } = await apiClient.get<{ data: { name: string }[] }>(
    API.RoleManagement.getGender
  );
  const rows = data?.data ?? [];
  return rows.map((g) => ({ label: g.name, value: g.name }));
}