import API from "../../config/api";
import apiClient from "../../config/axios";
import type {
  CreateInvestmentProductPayload,
  CreateInvestmentProductResponse,
  InvestmentProductRecord,
} from "../../types/Investor/investmentProductForm";


export async function createInvestmentProduct(payload: CreateInvestmentProductPayload) {
  const { data } = await apiClient.post<CreateInvestmentProductResponse>(API.investmentProduct.create, payload);
  return data;
}

export async function updateInvestmentProduct({ id, payload }: {
  id: string;
  payload: Partial<CreateInvestmentProductPayload>;
}) {
  const { data } = await apiClient.put(
    API.investmentProduct.update,
    payload,
    {
      params: { id },
    }
  );

  return data;
}

export interface InvestmentProductListParams {
  search?: string;
  disabled?: 0 | 1;
  page?: number;
  page_size?: number;
}

export async function getAllInvestmentProduct(params?: InvestmentProductListParams) {
  const { data } = await apiClient.get(API.investmentProduct.getAll, { params });
  return data;
}

/** A row of get_investment_product. */
export type InvestmentProductListItem = InvestmentProductRecord;

const ALL_PRODUCTS_PAGE_SIZE = 50;

/** Every investment product, read page by page. */
export async function getEveryInvestmentProduct(): Promise<InvestmentProductListItem[]> {
  const first = await getAllInvestmentProduct({ page: 1, page_size: ALL_PRODUCTS_PAGE_SIZE });
  const totalPages: number = first?.pagination?.total_pages ?? 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
      getAllInvestmentProduct({ page: i + 2, page_size: ALL_PRODUCTS_PAGE_SIZE }),
    ),
  );
  return [first, ...rest].flatMap((res) => (Array.isArray(res?.data) ? res.data : []));
}

export async function getInvestmentProductById(id: string) {
  const { data } = await apiClient.get(API.investmentProduct.getById, { params: { id } });
  return data;
}

export async function deleteInvestmentProduct(id: string) {
  const { data } = await apiClient.delete(API.investmentProduct.delete, { params: { id } });
  return data;
}

export async function enableInvestmentProduct(id: string) {
  const { data } = await apiClient.put(API.investmentProduct.enable, {}, { params: { id } });
  return data;
}

export async function disableInvestmentProduct(id: string) {
  const { data } = await apiClient.put(API.investmentProduct.disable, {}, { params: { id } });
  return data;
}