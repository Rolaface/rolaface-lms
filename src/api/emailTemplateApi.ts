import apiClient from "../config/axios";
import { API } from "../config/api";
import type {
  CreateEmailTemplatePayload,
  UpdateEmailTemplatePayload,
  EmailTemplateResponse,
  EmailTemplateListResponse,
} from "../types/emailTemplateForm";

// Doctype name contains a space, so every path use must be encoded.
const encodeTemplateName = (name: string) => encodeURIComponent(name);

export async function createEmailTemplate(payload: CreateEmailTemplatePayload) {
  const { data } = await apiClient.post<EmailTemplateResponse>(
    API.emailTemplate.base,
    payload
  );
  return data;
}

export async function updateEmailTemplate({
  name,
  payload,
}: {
  name: string;
  payload: UpdateEmailTemplatePayload;
}) {
  const { data } = await apiClient.put<EmailTemplateResponse>(
    `${API.emailTemplate.base}/${encodeTemplateName(name)}`,
    payload
  );
  return data;
}

export async function getEmailTemplateById(name: string) {
  const { data } = await apiClient.get<EmailTemplateResponse>(
    `${API.emailTemplate.base}/${encodeTemplateName(name)}`
  );
  return data;
}

export async function deleteEmailTemplate(name: string) {
  const { data } = await apiClient.delete(
    `${API.emailTemplate.base}/${encodeTemplateName(name)}`
  );
  return data;
}

export async function getAllEmailTemplates() {
  const { data } = await apiClient.get<EmailTemplateListResponse>(
    API.emailTemplate.base
  );
  return data;
}