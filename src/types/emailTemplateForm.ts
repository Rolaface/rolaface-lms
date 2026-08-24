export interface CreateEmailTemplatePayload {
  __newname: string; 
  subject: string;
  response: string; 
}

export interface UpdateEmailTemplatePayload {
  subject?: string;
  response?: string;
}

export interface EmailTemplateRecord {
  name: string;
  subject: string;
  response: string;
  [key: string]: unknown;
}

export interface EmailTemplateResponse {
  data: EmailTemplateRecord;
}

export interface EmailTemplateListResponse {
  data: EmailTemplateRecord[];
}