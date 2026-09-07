import { create } from 'zustand';
import type { LoanProduct } from '../types/loanProduct';

interface LoanProductState {
  products: LoanProduct[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
}

const mockLoanProducts: LoanProduct[] = [
  { id: 'prod-001', name: 'Personal Loan', category: 'Retail', status: 'Active', description: 'Unsecured personal loan for individual borrowers.' },
  { id: 'prod-002', name: 'Business Loan', category: 'Commercial', status: 'Active', description: 'Working capital and business expansion loan.' },
  { id: 'prod-003', name: 'Home Loan', category: 'Retail', status: 'Active', description: 'Mortgage loan for residential property purchase.' },
  { id: 'prod-004', name: 'Education Loan', category: 'Retail', status: 'Active', description: 'Loan for higher education expenses.' },
  { id: 'prod-005', name: 'Car Loan', category: 'Retail', status: 'Active', description: 'Secured auto loan for new and used vehicles.' },
  { id: 'prod-006', name: 'Vehicle Loan', category: 'Retail', status: 'Active', description: 'Loan for commercial and personal vehicles.' },
  { id: 'prod-007', name: 'Consumer Loan', category: 'Retail', status: 'Active', description: 'Short-term consumer finance loan.' },
  { id: 'prod-008', name: 'Gold Loan', category: 'Secured', status: 'Active', description: 'Loan against gold ornaments and coins.' },
  { id: 'prod-009', name: 'Loan Against Property', category: 'Secured', status: 'Active', description: 'Secured loan against residential or commercial property.' },
  { id: 'prod-010', name: 'Agricultural Loan', category: 'Priority Sector', status: 'Active', description: 'Crop loan and farm equipment financing.' },
];

export const useLoanProductStore = create<LoanProductState>((set) => ({
  products: mockLoanProducts,
  isLoading: false,

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/loan-products');
      // const data = await response.json();
      // set({ products: data, isLoading: false });
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ products: mockLoanProducts, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch loan products:', error);
      set({ isLoading: false });
    }
  },
}));
