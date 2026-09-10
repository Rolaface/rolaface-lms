import apiClient from "../config/axios";
import { API } from "../config/api";

export interface UploadAndExtractResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    file_url?: string;
    file_name?: string;
    extracted_text?: string;
    [key: string]: any;
  };
}

/**
 * Uploads a PDF/DOCX contract template file to the backend
 * and triggers server-side text extraction.
 *
 * POST /api/method/rolaface_lms_app.api.contract_template.upload_and_extract
 * Content-Type: multipart/form-data
 * Body: { file: <File> }
 */
export async function uploadAndExtractTemplate(
  file: File
): Promise<UploadAndExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<UploadAndExtractResponse>(
    API.contractTemplate.uploadAndExtract,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}
