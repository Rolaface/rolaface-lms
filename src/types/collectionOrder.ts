export interface CollectionOrderComponent {
  idx: number;
  demand_type: string;
}

export interface CollectionOrderComponentDetail extends CollectionOrderComponent {
  name: string; // backend row id — used as a stable React key while reordering
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
}

export interface CollectionOrderListItem {
  name: string;
  title: string;
  components: CollectionOrderComponent[];
}

export interface CollectionOrderDetail {
  name: string;
  title: string;
  components: CollectionOrderComponentDetail[];
}

export interface CreateCollectionOrderPayload {
  title: string;
  components: CollectionOrderComponent[];
}

export interface UpdateCollectionOrderPayload {
  name: string;
  components: CollectionOrderComponent[];
}

export interface PaginationMeta {
  page: number | string;
  page_size: number | string;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ApiEnvelope<T> {
  status_code: number;
  status: string;
  message: string;
  data: T;
}

export type GetAllCollectionOrdersResponse = ApiEnvelope<{
  collection_orders: Record<string, CollectionOrderListItem>;
  pagination: PaginationMeta;
}>;

export type GetCollectionOrderByIdResponse = ApiEnvelope<CollectionOrderDetail>;

export type CreateCollectionOrderResponse = ApiEnvelope<null>;
export type UpdateCollectionOrderResponse = ApiEnvelope<null>;

export type DeleteCollectionOrderResponse = Record<string, never>;

export interface GetAllCollectionOrdersParams {
  search?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface CollectionOrderSort {
  field: 'title' | 'creation' | 'modified';
  direction: SortDirection;
}