import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCompanyInfo } from "../api/erpDataApi";


interface CompanyState {
  baseCurrency: string;
  companyName: string;
  tpin: string | null;
  industryType: string | null;
  primaryBusinessDomain: string | null;
  loading: boolean;

  setCompany: (data: {
    baseCurrency?: string;
    companyName?: string;
    tpin?: string | null;
    industryType?: string | null;
    primaryBusinessDomain?: string | null;
  }) => void;

  fetchCompany: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      baseCurrency: "",
      companyName: "",
      tpin: null,
      industryType: null,
      primaryBusinessDomain: null,
      loading: false,

      setCompany: (data) =>
        set((state) => ({
          baseCurrency: data.baseCurrency ?? state.baseCurrency,
          companyName: data.companyName ?? state.companyName,
          tpin: data.tpin ?? state.tpin,
          industryType: data.industryType ?? state.industryType,
          primaryBusinessDomain: data.primaryBusinessDomain ?? state.primaryBusinessDomain,
        })),

      fetchCompany: async () => {
        set({ loading: true });
        try {
          const companyData = await getCompanyInfo();   
          if (companyData) {
            set({
              baseCurrency: companyData.baseCurrency,
              companyName: companyData.companyName,
              tpin: companyData.tpin,
              industryType: companyData.industryType,
              primaryBusinessDomain: companyData.primaryBusinessDomain,
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        } catch (err) {
          console.error("[LMS] fetchCompany failed:", err);
          set({ loading: false });
        }
      },
    }),
    {
      name: "company-info",
    },
  ),
);