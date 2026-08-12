import apiClient from '../config/axios';
import { API } from '../config/api';
import type {
  CreateCollectionOrderPayload,
  CreateCollectionOrderResponse,
  UpdateCollectionOrderPayload,
  UpdateCollectionOrderResponse,
  GetAllCollectionOrdersParams,
  GetAllCollectionOrdersResponse,
  GetCollectionOrderByIdResponse,
  DeleteCollectionOrderResponse,
} from '../types/collectionOrder';


const COLLECTION_ORDER_DOCTYPE = 'Loan Demand Offset Order';


function unwrapMessage<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'message' in (raw as Record<string, unknown>)) {
    const inner = (raw as Record<string, unknown>).message;
    if (inner && typeof inner === 'object') {
      return inner as T;
    }
  }
  return raw as T;
}

export async function createCollectionOrder(payload: CreateCollectionOrderPayload) {
  const { data } = await apiClient.post(API.collectionSequence.create, payload);
  return unwrapMessage<CreateCollectionOrderResponse>(data);
}

export async function getAllCollectionOrders(params: GetAllCollectionOrdersParams) {
  const { data } = await apiClient.get(API.collectionSequence.getSequence, { params });
  return unwrapMessage<GetAllCollectionOrdersResponse>(data);
}

export async function getCollectionOrderById(name: string) {
  const { data } = await apiClient.get(API.collectionSequence.getById, { params: { name } });
  return unwrapMessage<GetCollectionOrderByIdResponse>(data);
}

export async function updateCollectionOrder(payload: UpdateCollectionOrderPayload) {
   const { data } = await apiClient.put(API.collectionSequence.updateSequence, payload);
   return unwrapMessage<UpdateCollectionOrderResponse>(data);
 }


export async function deleteCollectionOrder(name: string) {
  const { data } = await apiClient.post(API.collectionSequence.deleteSequence, {
    doctype: COLLECTION_ORDER_DOCTYPE,
    name,
  });
  return unwrapMessage<DeleteCollectionOrderResponse>(data);
}