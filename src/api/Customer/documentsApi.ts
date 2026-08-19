import apiClient from "../../config/axios";

const api = apiClient;

// TODO: backend endpoint not ready — path + verb unconfirmed
export async function uploadCustomerDocument(
  customerId: string,
  docKey: string,
  file: File,
): Promise<{ name: string; size: number; url: string }> {
  const formData = new FormData();
  formData.append("customer_id", customerId);
  formData.append("doc_key", docKey);
  formData.append("file", file);
  const response = await api.post("TODO_ADD_API_CUSTOMER_DOC_UPLOAD", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteCustomerDocument(
  customerId: string,
  docKey: string,
): Promise<void> {
  await api.post("TODO_ADD_API_CUSTOMER_DOC_DELETE", {
    customer_id: customerId,
    doc_key: docKey,
  });
}