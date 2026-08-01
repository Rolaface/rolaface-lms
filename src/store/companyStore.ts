import { create } from "zustand";

interface CompanyState {
  baseCurrency: string;
  companyName: string;
  loading: boolean;
  setCompany: (data: { baseCurrency: string; companyName?: string }) => void;
  fetchCompany: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  // TODO: replace hardcoded value once /company or /settings API is ready
  baseCurrency: "INR",
  companyName: "",
  loading: false,

  setCompany: ({ baseCurrency, companyName }) =>
    set((state) => ({
      baseCurrency,
      companyName: companyName ?? state.companyName,
    })),

  // Call this once at app bootstrap (e.g. in App.tsx / a root layout effect)
  // once the real company API exists. For now it's a no-op placeholder —
  // uncomment and wire to the real endpoint when available.
  fetchCompany: async () => {
    // set({ loading: true });
    // try {
    //   const res = await getCompanyDetails(); // plug real API here later
    //   set({ baseCurrency: res.baseCurrency, companyName: res.companyName, loading: false });
    // } catch (err) {
    //   set({ loading: false });
    // }
    return;
  },
}));