import type { ProductMappingPayload, ProductMappingResponse } from '../types/contractTemplate';
import type { LoanProduct } from '../types/loanProduct';

const API_BASE = '/api'; // TODO: Configure from environment

/**
 * Save the product mapping for a contract template.
 * Maps one contract template to one or more loan products.
 */
export async function saveProductMapping(
  payload: ProductMappingPayload
): Promise<ProductMappingResponse> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/contract-templates/${payload.templateId}/product-mapping`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // if (!response.ok) throw new Error('Failed to save product mapping');
  // return response.json();

  // Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    success: true,
    message: 'Product mapping saved successfully.',
    templateId: payload.templateId,
    mappedProductIds: payload.productIds,
  };
}

/**
 * Get existing product mappings for a contract template.
 */
export async function getProductMapping(templateId: string): Promise<string[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/contract-templates/${templateId}/product-mapping`);
  // if (!response.ok) throw new Error('Failed to fetch product mapping');
  // const data = await response.json();
  // return data.productIds;

  await new Promise((resolve) => setTimeout(resolve, 300));
  return [];
}

/**
 * Get all available loan products.
 */
export async function getLoanProducts(): Promise<LoanProduct[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE}/loan-products`);
  // if (!response.ok) throw new Error('Failed to fetch loan products');
  // return response.json();

  await new Promise((resolve) => setTimeout(resolve, 300));
  return [];
}
