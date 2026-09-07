export interface ContractTemplate {
  id: string;
  templateName: string;
  templateType: string;
  templateVersion: string;
  status: 'Active' | 'Inactive' | 'Draft';
  effectiveFrom: string;
  effectiveTo: string;
  description: string;
  mappedProductIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductMappingPayload {
  templateId: string;
  productIds: string[];
}

export interface ProductMappingResponse {
  success: boolean;
  message: string;
  templateId: string;
  mappedProductIds: string[];
}
