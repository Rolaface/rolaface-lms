import { create } from 'zustand';
import type { LoanProduct } from '../types/loanProduct';
import { getAllLoanProducts } from '../api/productApi';

interface LoanProductState {
  products: LoanProduct[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
}

function mapApiProductToLoanProduct(raw: any): LoanProduct {
  return {
    id: raw.name ?? raw.product_code ?? '',
    name: raw.product_name ?? raw.name ?? '',
    category: raw.loan_category ?? raw.category ?? '',
    status: raw.status === 'Active' || raw.is_enabled === 1 ? 'Active' : 'Inactive',
    description: raw.description ?? '',
  };
}

export const useLoanProductStore = create<LoanProductState>((set) => ({
  products: [],
  isLoading: false,

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const response = await getAllLoanProducts();
      const rawList: any[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      const products = rawList.map(mapApiProductToLoanProduct);
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch loan products:', error);
      set({ isLoading: false });
    }
  },
}));
