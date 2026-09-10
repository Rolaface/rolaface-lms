export interface LoanProduct {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Inactive';
  description?: string;
}
